---
title: "Prompt Süsleyici"
description: "İstemcinin mesaj listesine kurumsal üslup, güvenlik veya yanıt biçimi için sabit talimat blokları ekler"
---

:::tip

Bu doküman spesifik bir politikanın detaylı kullanımını anlatır. Eğer Apinizer politika yapısını ilk kez kullanıyorsanız veya politikaların genel çalışma prensiplerini öğrenmek istiyorsanız, öncelikle [Politika Nedir?](/tr/concepts/temel-kavramlar/politika-nedir) sayfasını okumanızı öneririz.

:::

## Genel Bakış

### Amacı Nedir?

- İstemcinin `messages[]` listesine yönetici tarafından hazırlanan sabit talimat blokları ekler.
- Kurumsal üslup, güvenlik veya yanıt biçimi kurallarını merkezi uygular.
- İstemci talimatı göndermese bile modelin tamamlanmış mesaj listesinde bu kuralları görmesini sağlar.

### Çalışma Prensibi

Her blok `PREPEND` veya `APPEND` konumuna, `system`, `user` ya da `assistant` rolüyle eklenir. İçerikte `${env}` ve `#{context}` değişkenleri çözülebilir. System blokları istenirse mevcut system mesajına birleştirilir.

Sıra: [Prompt Şablonu](/tr/ai-gateway/politikalar/prompt-sablonu) sonrasında; [RAG Enjeksiyonu](/tr/ai-gateway/politikalar/rag-enjeksiyonu), guardrail, önbellek ve token politikalarından önce çalışmalıdır.

## Özellikler ve Yetenekler

### Temel Özellikler

- **Konum:** PREPEND veya APPEND.
- **Rol:** system, user veya assistant.
- **İçerik:** Eklenecek sabit talimat.
- **Etkin:** Bloğu silmeden pasif yapar.

### İleri Düzey Özellikler

- **Mevcut system mesajına birleştirme:** Yalnız system bloklarında geçerlidir. Yeni system mesajı eklemek yerine mevcut system içeriğine birleştirir.
- **Preset ve localize:** Catalog-bound blok preset güncellemelerini alır. Localized blok bağımsızdır. Export/import sonrasında katalog bağlantısı kopabilir; içerik korunur.
- **Max Total Chars:** Toplam blok içeriği sınırı aşarsa içerik kesilmez; istek fail-closed reddedilir.

## Kullanım Senaryoları

| Senaryo | Durum | Çözüm (Politika Uygulaması) | Beklenen Davranış / Sonuç |
|---------|-------|----------------------------|---------------------------|
| Kurumsal yanıt biçimi | İstemci üslup talimatını her istekte göndermiyor | `Yanıtı kısa, açık ve Türkçe ver.` system bloğu PREPEND olarak eklenir | İstemci bu talimatı göndermese bile model tamamlanmış mesaj listesinde görür |

## Politika Parametrelerini Yapılandırma

### Bloklar

- **Position:** PREPEND veya APPEND.
- **Role:** system, user veya assistant.
- **Content:** Eklenecek sabit talimat.
- **Enabled:** Bloğu silmeden pasif yapar.

### Mevcut System Mesajına Birleştirme

Yalnız system bloklarında geçerlidir. Açıldığında yeni system mesajı eklemek yerine mevcut system içeriğine birleştirir.

### Preset ve Localize

Catalog-bound blok preset güncellemelerini alır. Localized blok bağımsızdır. Export/import sonrasında katalog bağlantısı kopabilir ancak içerik korunur.

### Max Total Chars

Toplam blok içeriği sınırı aşarsa içerik kesilmez; istek fail-closed reddedilir.

## Kontrol Listesi

- Position ve Role doğru mu?
- Bloklar birbiriyle çelişiyor mu?
- System birleştirme tercihi doğru mu?
- Değişkenler hedef ortamda tanımlı mı?
- Max Total Chars yeterli mi?
- API Proxy yeniden deploy edildi mi?

## Politikayı Silme

Bu politikanın silme adımları ve kullanımdayken uygulanacak işlemler için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.

## Politikayı Dışa/İçe Aktarma

Bu politikanın dışa aktarma ve içe aktarma adımları için [Export/Import](/tr/admin/secrets-management/export-import) sayfasına bakabilirsiniz.

## Politikayı API'ye Bağlama

Bu politikanın API'lere nasıl bağlanacağı için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.
