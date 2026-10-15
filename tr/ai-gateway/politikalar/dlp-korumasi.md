---
title: "DLP Koruması"
description: "İstek ve yanıtlardaki API anahtarı, JWT, özel anahtar ve parola gibi sırları tespit edip engeller veya maskeler"
---

:::tip

Bu doküman spesifik bir politikanın detaylı kullanımını anlatır. Eğer Apinizer politika yapısını ilk kez kullanıyorsanız veya politikaların genel çalışma prensiplerini öğrenmek istiyorsanız, öncelikle [Politika Nedir?](/tr/concepts/temel-kavramlar/politika-nedir) sayfasını okumanızı öneririz.

:::

## Genel Bakış

### Amacı Nedir?

- İstek ve yanıtlardaki sırları tespit eder: API anahtarları, sertifikalar, JWT, özel anahtarlar ve parolalar.
- Eşleşmede isteği veya yanıtı engeller, işaretler veya değeri maskeler.
- Kişisel veriden farklı olarak erişim bilgisi sızıntısını hedefler.

[Kişisel Veri Maskeleme](/tr/ai-gateway/politikalar/kisisel-veri-maskeleme) ile farkı:

| | Kişisel Veri Maskeleme | DLP Koruması |
|---|---|---|
| Hedef | Kişisel veri (TCKN, IBAN, telefon) | Sırlar (API key, JWT, private key, parola) |
| Amaç | Gizlilik ve KVKK/GDPR uyumu | Erişim bilgisi sızıntısını önleme |
| Ek yetenek | Re-identification (Unmask) | File Signature Detection |

İkisi birlikte kullanılabilir. Uyumluluk kapsamı HIPAA Safe Harbor tanımlayıcıları (telefon, SSN, tıbbi kayıt no, sağlık planı ID, cihaz tanımlayıcıları, IP, URL) ve PCI DSS (PAN, son kullanma, track verisi, PIN, CVV/CVC) desenlerini içerir. İsim, tarih ve coğrafi bölüm gibi bazı HIPAA alanları regex yerine semantik katman gerektirir.

### Çalışma Prensibi

Yerleşik desenler sürümlenmiş ve checksum'lı bir paket olarak gelir. Checksum uyuşmazsa o paketin desenleri uygulanmaz ve uyarı loglanır. Hazır bir desen düzenlenirse override işaretlenir ve sonraki güncellemelerde ezilmez. Silme kalıcıdır; sonraki sürümde yeniden eklenebilir.

Hazır desen grupları:

- **API anahtarları:** AWS (`AKIA...`), OpenAI (`sk-...`), GitHub (`ghp_...`), Slack (`xoxb_...`), Google (`AIza...`)
- **Kriptografik materyal:** PEM private key blokları ve sertifikalar
- **Kimlik doğrulama:** JWT, parola, secret ve api-key atamaları
- **Kart verisi:** Track 1, Track 2, PIN, CVV/CVC

İstek yönü prompt'taki sırları modele ulaşmadan yakalar. Yanıt yönü modelin veya tool sonucunun geri yansıttığı sırları yakalar. Streaming'de bir chunk grubu bloğu tetiklerse o akıştaki kalan chunk grupları da maskelenir.

JSON kuralları yalnız string değerlere uygulanır; alan adları ve yapı korunur. Maskeli gövde üretilemezse istek **ERR-303** ile reddedilir. Decode Encoded Content, base64, hex, yüzde kodlaması ve Unicode escape'i çözüp tarar; çözülen içerik yeniden yazılmaz. Kodlanmış içerikte sır bulunursa maskeleme yerine block uygulanır. ReDoS riski taşıyan desenler runtime'da atlanır.

Bu politika [Prompt Şablonu](/tr/ai-gateway/politikalar/prompt-sablonu), [Prompt Süsleyici](/tr/ai-gateway/politikalar/prompt-susleyici) ve [RAG Enjeksiyonu](/tr/ai-gateway/politikalar/rag-enjeksiyonu) sonrasında çalışmalıdır. Kişisel Veri Maskeleme bu kuraldan muaftır ve RAG'dan önce de çalışabilir. Apinizer kaydederken sıralama ihlallerini düzeltir.

## Özellikler ve Yetenekler

### Temel Özellikler

- **Aksiyon:** Block, Flag, Mask, Delete, Hash veya Encrypt.
- **Değerlendirme motoru:** Built-in, Built-in + External veya External only. Varsayılan Built-in'dir.
- **Harici hata modu:** Block on failure (varsayılan) veya Allow on failure.
- **Dosya imzası:** Varsayılan kapalıdır. Yalnız Block veya Flag seçilebilir.

### İleri Düzey Özellikler

- **File Signature Detection:** base64 veya hex adaylarını çözüp baştaki baytları magic-byte tablolarıyla karşılaştırır. Tanınan formatlar: PDF, ZIP/Office, PNG/JPEG/GIF, GZIP/RAR/7-Zip, ELF/PE, OLE2, RTF, Java class. Signature Position, magic-byte'ın başta mı yoksa gömülü mü olduğunu ayrıca raporlar.
- **Harici sağlayıcı:** `llm-judge` veya `http-dlp`. Yerleşik Block, birleşik modda harici çağrıyı kısa devre yapar. Harici sağlayıcı streaming yanıtlarda çağrılmaz.
- **Hash ve Encrypt:** Hash kuruluma özel salt ile SHA-256 üretir. Encrypt AES/GCM/NoPadding kullanır; çözme yalnız aynı Apinizer kurulumunda Groovy ile yapılır.
- **Özel kalıplar:** Java regex (`java.util.regex.Pattern`). Test the pattern paneli kaydetmeden önce sunucu tarafında doğrular.

## Kullanım Senaryoları

| Senaryo | Durum | Çözüm (Politika Uygulaması) | Beklenen Davranış / Sonuç |
|---------|-------|----------------------------|---------------------------|
| Yapılandırma yapıştırma | Geliştirici prompt'a AWS ve OpenAI anahtarı içeren config yapıştırıyor | Yerleşik desenler isteği modele göndermeden sırları yakalar | Mask ise anahtarlar maskelenir. Block ise istek reddedilir ve sırlar sağlayıcıya ulaşmaz. Yanıtta üretilen sır da kullanıcıya dönmeden yakalanır |
| Base64 PEM | Özel anahtar dosyası base64 olarak yapıştırılmış | File Signature Detection açıktır | Magic-byte ile tanınır ve Block veya Flag uygulanır |

## Politika Parametrelerini Yapılandırma

### Temel Ayarlar

| Ayar | Açıklama | Varsayılan |
|------|----------|-----------|
| **Max Input Characters** | Desenler çalışmadan önce kesme sınırı | `8000` |
| **Action** | Block, Flag veya Mask | — |
| **Evaluation Engine** | Built-in, Built-in + External veya External only | Built-in |
| **External Failure Mode** | Block on failure veya Allow on failure | Block on failure |
| **File Signature Detection** | Etkinleştirme ve format allow-list | Kapalı |
| **Timeout** | Harici hakem bağlantı zaman aşımı | `2000 ms` |

### Kural Aksiyonları

| Aksiyon | Davranış |
|---------|----------|
| **Block** | İstek veya yanıt tamamen reddedilir. Dosya imzası için varsayılan budur |
| **Flag** | İşlem devam eder; eşleşme kayda alınır |
| **Mask** | Değer maskelenip iletilir. Kodlanmış içerikte Block'a yükselir |
| **Delete** | Eşleşen değer silinir |
| **Hash** | Kuruluma özel salt ile SHA-256 |
| **Encrypt** | AES/GCM/NoPadding |

### Dosya İmzası

Varsayılan kapalıdır. İhtiyaç varsa açın ve format allow-list ile hangi formatların yakalanacağını belirleyin. Yalnız Block veya Flag seçilebilir.

### Harici DLP

- **llm-judge:** LLM tabanlı karar.
- **http-dlp:** Satıcıdan bağımsız HTTP uç noktası. Servis `text`, `direction`, `apiType` alanlarını alır; HTTP 2xx ile `safe`, `categories` ve `score` döndürmelidir. `safe` veya `flagged` boolean zorunludur. Eksik veya geçersiz JSON hata sayılır.

Evaluation Engine:

- **Built-in only:** Yalnız regex.
- **Built-in + External:** İkisi de çalışır. Yerleşik Block harici çağrıyı kısa devre yapar.
- **External provider only:** Yalnız harici; regex yok sayılır.

## Kontrol Listesi

- Hedef sır tipleri yerleşik desenlerle kapsanıyor mu?
- Aksiyon ihtiyaca uygun mu?
- İkili dosya riski varsa File Signature Detection açık ve format listesi ayarlı mı?
- Decode Encoded Content değerlendirildi mi?
- Harici sağlayıcı kullanılıyorsa Evaluation Engine ve External Failure Mode doğru mu?
- Streaming yanıtta harici sağlayıcının çağrılmayacağı biliniyor mu?
- Özel kalıplar Test the pattern ile doğrulandı mı?
- Politika Prompt Şablonu, Prompt Süsleyici ve RAG sonrasında mı?
- HIPAA veya PCI DSS gereksiniminde ilgili desenler aktif mi?

## Politikayı Silme

Bu politikanın silme adımları ve kullanımdayken uygulanacak işlemler için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.

## Politikayı Dışa/İçe Aktarma

Bu politikanın dışa aktarma ve içe aktarma adımları için [Export/Import](/tr/admin/secrets-management/export-import) sayfasına bakabilirsiniz.

## Politikayı API'ye Bağlama

Bu politikanın API'lere nasıl bağlanacağı için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.
