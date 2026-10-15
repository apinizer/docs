---
title: "Kişisel Veri Maskeleme"
description: "İstek ve yanıtlardaki TCKN, IBAN, telefon ve e-posta gibi kişisel verileri tespit edip maskeler"
---

:::tip

Bu doküman spesifik bir politikanın detaylı kullanımını anlatır. Eğer Apinizer politika yapısını ilk kez kullanıyorsanız veya politikaların genel çalışma prensiplerini öğrenmek istiyorsanız, öncelikle [Politika Nedir?](/tr/concepts/temel-kavramlar/politika-nedir) sayfasını okumanızı öneririz.

:::

## Genel Bakış

### Amacı Nedir?

- İstek ve yanıtlardaki kişisel verileri tespit edip maskeler.
- Bu verilerin LLM sağlayıcısına sızmasını veya yanıt yoluyla ifşa olmasını önler.
- RAG senaryosunda embedding sağlayıcısının kişisel veriyi görmesini sınırlar.

Her yeni AI proxy, önceden doldurulmuş bir **Default PII Mask** politikası ile gelir. Sıfırlamak için **Clear All** kullanılır. Boş kural listesi hiçbir şey maskelemez ve uyarı üretir.

Sırlar (API anahtarı, JWT, özel anahtar) [DLP Koruması](/tr/ai-gateway/politikalar/dlp-korumasi) politikasının konusudur.

### Çalışma Prensibi

1. Politika, istek ve yanıt içeriğini yerleşik tiplere ve özel kalıplara göre tarar.
2. Eşleşen her veri için kural aksiyonu uygulanır: Block, Flag, Mask, Encrypt, Hash veya Delete.
3. Mask aksiyonunda değer seçilen Mask Shape ile değiştirilir.

JSON kuralları yalnız string değerlere uygulanır; alan adları ve yapı korunur. Maskeleme sonrası JSON geçersiz olursa istek **ERR-303** ile reddedilir.

Decode Encoded Content varsayılan kapalıdır. base64, hex, yüzde kodlaması ve Unicode escape 3 seviyeye kadar çözülür. Çözülen içerik yalnız incelenir, gövdeye yazılmaz. gzip ve deflate çözülmez. Kodlanmış içerikte kişisel veri bulunursa istek reddedilir. Okunabilirlik eşiği, hash ve UUID yanlış pozitiflerini azaltır.

Streaming yanıtlarda maskeleme buffer-and-scan ile çalışır: akış biriktirildikten sonra işlenir. Maskeleme aktifken time-to-first-token korunmaz. Aynı değer birden fazla parçada tutarlı maskelenir.

[RAG Enjeksiyonu](/tr/ai-gateway/politikalar/rag-enjeksiyonu) öncesinde çalışırsa embedding sağlayıcısı da kişisel veriyi görmez. Sonrasında çalışırsa RAG bağlamı enjekte edildikten sonra maskelenir.

## Özellikler ve Yetenekler

### Temel Özellikler

Yerleşik tipler, mümkün olan yerlerde checksum kullanır:

| Veri tipi | Doğrulama |
|-----------|-----------|
| **TCKN** | 11 hane ve checksum |
| **IBAN** | TR ve uluslararası format, mod-97 checksum |
| **Telefon** | Türkiye formatı, yapısal |
| **E-posta** | Yapısal desen |
| **Kredi kartı** | Luhn checksum |
| **IP adresi** | IPv4 ve IPv6, yapısal |
| **URL** | Yapısal |
| **Pasaport no** | Yapısal, checksum yok |
| **SSN** | Yapısal |
| **Ehliyet no** | Türkiye formatı, yapısal |
| **Kripto cüzdan** | Bitcoin ve Ethereum checksum |

Özel Java regex kalıpları da tanımlanabilir.

### İleri Düzey Özellikler

- **Mask biçimleri:** Replace entirely, Keep first N, Keep last N, Mask first N, Sequential Placeholder, Synthetic Value.
- **Re-identification:** Yalnız Sequential Placeholder ve Synthetic Value için. None, Automatic (Response Inline) veya Unmask API.
- **Katalog bağı:** Catalog-bound kural düzenlenirse Localized olur. Katalog güncellenince yalnız Localized kurallar korunur.
- **ReDoS:** Riskli kalıplar ekranda etkin görünse bile runtime'da atlanır.
- **Çalışma modu:** Inline (Block için zorunlu), Asynchronous veya Observe-Only.

Sequential Placeholder ve Synthetic Value tek bir istek veya yanıt döngüsü içinde tutarlı, farklı istekler arasında kasıtlı olarak tutarsızdır.

## Kullanım Senaryoları

| Senaryo | Durum | Çözüm (Politika Uygulaması) | Beklenen Davranış / Sonuç |
|---------|-------|----------------------------|---------------------------|
| Sigorta asistanı | Müşteri mesajında TCKN, IBAN ve telefon var; sağlayıcı bunları görmemeli, yetkili operatör görmeli | İstek yönünde Mask ve Sequential Placeholder; Automatic Unmask ve yetkili rol | `12345678901` modele `<TCKN_1>` olarak gider. Yetkili operatöre dönen yanıtta yer tutucu gerçek değerle değiştirilir |
| Sahte IBAN | Doğal okunan ama gerçek olmayan değer gerekli | Synthetic Value | Rezerve test aralığından checksum geçerli sahte bir IBAN üretilir |
| Korelasyon | Değer geri döndürülmeden ilişkilendirilmeli | Hash veya Encrypt | SHA-256 veya AES/GCM çıktısı üretilir |

## Politika Parametrelerini Yapılandırma

### Kural Yönetimi

Her kuralda Data Type, Rule Action ve Mask için Mask Shape belirlenir.

- **Add Default Set:** Her yerleşik tip için birer kural ekler.
- **Add from Preset:** PII Patterns kataloğundan seçtirir.
- **Add Definition:** Tek bir özel kural oluşturur.
- **Clear All:** Onay sonrası tüm kuralları siler.

### Kural Aksiyonları

| Aksiyon | Davranış |
|---------|----------|
| **Block** | Eşleşmede istek veya yanıt reddedilir |
| **Flag** | İşlem devam eder; tespit kayda alınır |
| **Mask** | Değer seçilen biçime göre değiştirilir |
| **Encrypt** | AES/GCM/NoPadding ile şifreler, Base64 çıktı verir. Çözme için kurulum anahtarı ve Groovy script gerekir |
| **Hash** | Kuruluma özel salt ile SHA-256 |
| **Delete** | Değeri siler |

### Mask Biçimi

| Biçim | Girdi | Çıktı |
|-------|-------|-------|
| **Replace entirely** (varsayılan) | 05321234567 | `***` |
| **Keep first N** (N=4) | 05321234567 | `0532*******` |
| **Keep last N** (N=4) | 05321234567 | `*******4567` |
| **Mask first N** (N=4) | 05321234567 | `****1234567` |
| **Sequential Placeholder** | 05321234567 | `<PHONE_1>` |
| **Synthetic Value** | 05321234567 | Geçerli sahte değer |

### Geri Döndürme

- **None:** Varsayılan. Orijinal değer atılır.
- **Automatic (Response Inline):** Yetkili çağıranlara yanıt içinde orijinal değer geri konur. Authorized Caller Roles listesinde en az bir rol gerekir. Streaming yanıtlarda ve Standard dışı veri saklama profillerinde atlanır.
- **Unmask API:** Yetkili Manager operatörleri Management API ile sonradan geri alır.

Orijinal değerler dağıtık önbellekte şifreli saklanır (trace ID, kural ve pseudonym ile anahtarlanır) ve 1 saat sonra süresi dolar.

### Kod Çözme ve Çalışma Modu

Kodlanmış içerikteki kişisel veriyi yakalamak için Decode Encoded Content açılır. Açıkken kodlanmış içerikte kişisel veri bulunursa istek reddedilir.

- **Inline (Blocking):** Block için zorunludur.
- **Asynchronous:** Arka planda çalışır; eşleşmeler kaydedilir.
- **Observe-Only:** Engellemez ve maskelemez.

### Özel Kalıplar

Özel kalıplar Java regex kullanır. Test the pattern paneli kaydetmeden önce kalıbı sunucu tarafında çalıştırır. Source kolonu kuralın Catalog-bound mı Localized mı olduğunu gösterir.

## Kontrol Listesi

- Kural listesi boş değil mi?
- Gerekli veri tipleri eklendi mi?
- Her kuralda doğru aksiyon seçildi mi?
- Mask kullanılıyorsa uygun biçim seçildi mi?
- Geri döndürme gerekiyorsa mod ve yetkili roller ayarlandı mı?
- Decode Encoded Content gerekli mi?
- Block için Inline seçildi mi?
- Özel kalıplar Test the pattern ile doğrulandı mı?
- RAG varsa sıra veri sınırı kararına göre ayarlandı mı?
- Streaming kullanılıyorsa ilk token gecikmesi kabul edilebilir mi?

## Politikayı Silme

Bu politikanın silme adımları ve kullanımdayken uygulanacak işlemler için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.

## Politikayı Dışa/İçe Aktarma

Bu politikanın dışa aktarma ve içe aktarma adımları için [Export/Import](/tr/admin/secrets-management/export-import) sayfasına bakabilirsiniz.

## Politikayı API'ye Bağlama

Bu politikanın API'lere nasıl bağlanacağı için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.
