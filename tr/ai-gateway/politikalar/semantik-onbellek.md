---
title: "Semantik Önbellek"
description: "Aynı veya anlamca benzer LLM isteklerinin yanıtını saklar ve tekrarında modele gitmeden döner"
---

:::tip

Bu doküman spesifik bir politikanın detaylı kullanımını anlatır. Eğer Apinizer politika yapısını ilk kez kullanıyorsanız veya politikaların genel çalışma prensiplerini öğrenmek istiyorsanız, öncelikle [Politika Nedir?](/tr/concepts/temel-kavramlar/politika-nedir) sayfasını okumanızı öneririz.

:::

## Genel Bakış

### Amacı Nedir?

- Aynı veya anlamca benzer isteklerin yanıtlarını saklayıp yeniden kullanır.
- Tekrarlı isteklerin sağlayıcıya gitmemesini sağlayarak token maliyetini düşürür.
- Önbellek isabetinde çıkarım adımını atlayarak gecikmeyi ve sağlayıcı yükünü azaltır.

Birebir aynı tekrarlar [Döngü Koruması](/tr/ai-gateway/politikalar/dongu-korumasi) konusudur. Bu politika anlamca yakın istekleri de eşleştirebilir.

### Çalışma Prensibi

| Katman | Davranış |
|--------|----------|
| **Exact Match** | Önceki istekle birebir aynı istek, onun önbellekteki yanıtını kullanır |
| **Vector Similarity** | Farklı kelimelerle yazılmış ama anlamca yakın istekleri embedding ile bulur. İsteğe bağlıdır |

İstek içeriği embedding sağlayıcısı ile vektöre çevrilir ve vektör veritabanında saklanır. Eşik skoru `0` yapılırsa eşik zorlaması kapanır; şu üç filtre yine uygulanır: kapsam izolasyonu (aynı model, proxy, kimlik), aday sayısı (nearest-neighbor limiti) ve girdi ömrü (TTL).

Önbellek anahtarı, tamamlanmış prompt üzerinden türetilir ve model, API proxy kimliği ve çağıran credential'ı içerir. Bir kiracının yanıtı başka bir kiracıya dönmez.

[Kişisel Veri Maskeleme](/tr/ai-gateway/politikalar/kisisel-veri-maskeleme) veya [DLP Koruması](/tr/ai-gateway/politikalar/dlp-korumasi) aktifse ham yanıt önbelleğe yazılmaz; yalnız maskelenmiş sürüm saklanır. Önbellek isabeti maskeleme kurallarını atlayamaz.

Bu politika [Prompt Şablonu](/tr/ai-gateway/politikalar/prompt-sablonu), [Prompt Süsleyici](/tr/ai-gateway/politikalar/prompt-susleyici) ve [RAG Enjeksiyonu](/tr/ai-gateway/politikalar/rag-enjeksiyonu) sonrasında çalışmalıdır. Anahtar, zenginleştirilmiş içerik üzerinden hesaplanır. Apinizer kaydederken sıralama ihlallerini düzeltir.

## Özellikler ve Yetenekler

### Temel Özellikler

- **Trailing Message Count:** Sondan geriye doğru kaç mesajın embed edileceği. Varsayılan `1`.
- **Rol anahtarları:** Include System, Include Assistant ve Include Tool Messages benzerlik eşleşmesine hangi rollerin katılacağını genişletir.
- **Similarity Threshold:** Yüksek eşik daha az ve daha isabetli isabet verir. `0` eşik zorlamasını kapatır.
- **Nearest-Neighbour Count:** Çekilecek en fazla aday kayıt sayısı.

### İleri Düzey Özellikler

- **Honor Cache-Control Header:** Açıksa istemcinin `no-store` ve `no-cache` direktiflerine uyar.
- **Anonim istekler:** Bypass cache (varsayılan), Shared pool veya Reject. Shared pool, anonim kullanıcılar arasında yanıt paylaşır.
- **TTL:** Süresi dolan girdiler silinir. PostgreSQL ve Qdrant bakımı her gün 04:45'te süresi dolmuş vektör kayıtlarını temizler. Redis kayıtları kendiliğinden expire olur.
- **Depolama:** Benzerlik için PostgreSQL pgvector, Qdrant veya Redis. Yanıt gövdeleri önbellek backend'inde saklanır. APIops'ta vektör veritabanı ve embedding sağlayıcısı isim bazlı referans ile verilir.
- **Kapsam:** Proxy, proje ve çağıran kimlik başına. Anonim için ortak havuz isteğe bağlıdır.

## Kullanım Senaryoları

| Senaryo | Durum | Çözüm (Politika Uygulaması) | Beklenen Davranış / Sonuç |
|---------|-------|----------------------------|---------------------------|
| Teslimat soruları | "Teslimat ne kadar sürer?" ile "Kargo kaç günde gelir?" anlamca aynı | Vector Similarity ve benzerlik eşiği | İkinci soru eşiği aşarsa yanıt modele gitmeden önbellekten döner |
| Kişisel yanıt | Yanıtta kullanıcıya özel veri var | Kişisel Veri Maskeleme aktif | Önbellekte yalnız maskelenmiş yanıt tutulur |

Sık değişen stok, fiyat veya kargo durumunda TTL kısa tutulmalıdır.

## Politika Parametrelerini Yapılandırma

### Eşleşme

- **Trailing Message Count:** Çok turlu sohbette bağlamı yakalamak için artırılabilir.
- **Include System / Assistant / Tool Messages:** Benzerliğe katılacak roller.
- **Similarity Threshold:** Vektör eşleşmesi için en düşük skor.
- **Nearest-Neighbour Count:** En fazla aday kayıt.

### Önbellek Kontrolü ve Anonim İstekler

- **Honor Cache-Control Header:** İstemci `no-store` ve `no-cache` direktiflerine uyar.
- **Bypass cache:** Anonim istekler önbelleği atlar.
- **Shared pool:** Anonimler ortak havuzu paylaşır. Kullanıcıya özel içerikte dikkatli kullanılmalıdır.
- **Reject:** Anonim istekler reddedilir.

### TTL ve Depolama

Her girdinin TTL'i vardır. Verisi sık değişen içerikte TTL kısa tutulur. Benzerlik eşleşmesi PostgreSQL pgvector, Qdrant veya Redis üzerinde çalışır.

## Kontrol Listesi

- Exact match yeterli mi, Vector Similarity de gerekli mi?
- Vektör modu için embedding sağlayıcısı ve vektör veritabanı tanımlı mı?
- Similarity Threshold ayarlandı mı?
- Trailing Message Count sohbet bağlamına uygun mu?
- TTL içeriğin değişim hızına göre ayarlandı mı?
- Anonim istek davranışı güvenlik ihtiyacına uygun mu?
- Honor Cache-Control Header açık mı?
- Kişisel veri veya DLP aktifse önbelleğin maskelenmiş yanıt sakladığı doğrulandı mı?
- Politika RAG, Prompt Şablonu ve Prompt Süsleyici sonrasında mı?

## Politikayı Silme

Bu politikanın silme adımları ve kullanımdayken uygulanacak işlemler için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.

## Politikayı Dışa/İçe Aktarma

Bu politikanın dışa aktarma ve içe aktarma adımları için [Export/Import](/tr/admin/secrets-management/export-import) sayfasına bakabilirsiniz.

## Politikayı API'ye Bağlama

Bu politikanın API'lere nasıl bağlanacağı için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.
