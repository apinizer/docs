---
title: "Prompt Şablonu"
description: "Katalogdaki mesaj yapılarını alias ve parametrelerle gateway tarafında tam messages listesine dönüştürür"
---

:::tip

Bu doküman spesifik bir politikanın detaylı kullanımını anlatır. Eğer Apinizer politika yapısını ilk kez kullanıyorsanız veya politikaların genel çalışma prensiplerini öğrenmek istiyorsanız, öncelikle [Politika Nedir?](/tr/concepts/temel-kavramlar/politika-nedir) sayfasını okumanızı öneririz.

:::

## Genel Bakış

### Amacı Nedir?

- Tekrar kullanılan mesaj yapılarını katalogda tutar.
- İstemcinin alias ve parametre göndermesiyle tam `messages[]` listesini gateway tarafında oluşturur.
- Şablon alanlarının sağlayıcıya gitmeden kaldırılmasını sağlar.

### Çalışma Prensibi

1. Katalogda roller, mesajlar ve `{{param}}` yer tutucuları tanımlanır.
2. Şablon, politikaya binding olarak eklenir ve bir alias verilir.
3. İstemci `template` ve `template_params` alanlarını gönderir.
4. Parametreler tek geçişte yerleştirilir.
5. Mesajlar REPLACE, PREPEND veya APPEND ile birleştirilir.
6. Şablon alanları sağlayıcıya gönderilmeden kaldırılır.

Prompt Şablonu pipeline'da ilk çalışır. Ardından [Prompt Süsleyici](/tr/ai-gateway/politikalar/prompt-susleyici), [RAG Enjeksiyonu](/tr/ai-gateway/politikalar/rag-enjeksiyonu), guardrail ve önbellek politikaları gelir.

## Özellikler ve Yetenekler

### Temel Özellikler

- **Alias bağlama:** Aynı politika içinde benzersiz alias ile katalog şablonunu seçer.
- **Parametre yerleştirme:** `{{param}}` yer tutucuları istemci parametreleriyle tek geçişte doldurulur.
- **Birleştirme modu:** İstemci mesajlarını değiştirir, başa ekler veya sona ekler.
- **Alan temizleme:** `template` ve `template_params` sağlayıcıya gitmeden kaldırılır.

### İleri Düzey Özellikler

- **Eksik parametre davranışı:** BLOCK, EMPTY veya DEFAULT.
- **Katalog bağı:** Catalog-bound binding güncellemeleri alır; localized binding bağımsızdır.
- **Karakter sınırı:** `maxExpandedChars` aşılırsa istek fail-closed reddedilir.
- **Yeniden çözümleme yok:** İstemci parametresindeki `${env}` veya yeni `{{...}}` tekrar çözülmez.

## Kullanım Senaryoları

| Senaryo | Durum | Çözüm (Politika Uygulaması) | Beklenen Davranış / Sonuç |
|---------|-------|----------------------------|---------------------------|
| Kısa özet şablonu | İstemci her seferinde aynı talimatı kurmak istemiyor | `kisa-aciklama` alias'ı `{{metin}} metnini tek cümlede özetle.` mesajını içerir | İstemci alias ve `metin` parametresini gönderir; gateway bunu standart chat mesajına dönüştürür |

```json
{
  "model": "<model-adı>",
  "template": "kisa-aciklama",
  "template_params": { "metin": "Özetlenecek içerik" }
}
```

## Politika Parametrelerini Yapılandırma

### Şablon Bağlama

- Alias, politika içinde benzersiz olmalıdır.
- Messages ve Parameters içindeki adlar eşleşmelidir.
- Catalog-bound binding güncellemeleri alır; localized binding bağımsızdır.

### Parametre Davranışı

- **BLOCK:** Eksik zorunlu parametrede isteği reddeder.
- **EMPTY:** Eksik değeri boş kullanır.
- **DEFAULT:** Varsayılan değeri kullanır.
- İstemci parametresinde `${env}` veya yeni `{{...}}` tekrar çözülmez.

### Birleştirme Modu

- **REPLACE:** İstemci mesajlarını şablon ile değiştirir.
- **PREPEND:** Şablon mesajlarını başa ekler.
- **APPEND:** Şablon mesajlarını sona ekler.

### Temizleme ve Karakter Limiti

Şablon alanları sağlayıcıya gönderilmeden kaldırılmalıdır. `maxExpandedChars` aşılırsa istek fail-closed reddedilir.

## Kontrol Listesi

- Alias benzersiz mi?
- Yer tutucu ve parametreler eşleşiyor mu?
- Eksik veya bilinmeyen parametre davranışı doğru mu?
- Birleştirme modu doğru mu?
- Şablon alanları temizleniyor mu?
- Politika pipeline'ın başında mı?
- API Proxy yeniden deploy edildi mi?

## Politikayı Silme

Bu politikanın silme adımları ve kullanımdayken uygulanacak işlemler için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.

## Politikayı Dışa/İçe Aktarma

Bu politikanın dışa aktarma ve içe aktarma adımları için [Export/Import](/tr/admin/secrets-management/export-import) sayfasına bakabilirsiniz.

## Politikayı API'ye Bağlama

Bu politikanın API'lere nasıl bağlanacağı için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.
