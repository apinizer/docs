---
title: "Konu Koruması"
description: "Kullanıcı mesajını izin verilen ve yasaklanan konularla anlamsal olarak karşılaştırır ve iş alanı dışında yanıtı sınırlar"
---

:::tip

Bu doküman spesifik bir politikanın detaylı kullanımını anlatır. Eğer Apinizer politika yapısını ilk kez kullanıyorsanız veya politikaların genel çalışma prensiplerini öğrenmek istiyorsanız, öncelikle [Politika Nedir?](/tr/concepts/temel-kavramlar/politika-nedir) sayfasını okumanızı öneririz.

:::

## Genel Bakış

### Amacı Nedir?

- Kullanıcı mesajını izin verilen ve yasaklanan konu tanımlarıyla anlamsal olarak karşılaştırır.
- Uygulamanın yalnız belirlenen iş alanlarında yanıt vermesini sağlar.
- Yasaklanan konu ile izin verilen konu birlikte eşleşirse yasaklanan konuyu önceliklendirir.

### Çalışma Prensibi

1. İstek içeriğinin embedding'i üretilir.
2. Mesaj önce yasaklanan, ardından izin verilen konu embedding'leriyle karşılaştırılır.
3. Benzerlik değeri ilgili eşiği geçerse yapılandırılan `BLOCK` veya `FLAG` aksiyonu uygulanır.
4. Yasaklanan konu ile izin verilen konu birlikte eşleşirse yasaklanan konu önceliklidir.

Konu embedding'leri önbelleğe alınır. Embedding modeli değiştirilirse eşikler yeniden kalibre edilmelidir.

Bu politika [Prompt Şablonu](/tr/ai-gateway/politikalar/prompt-sablonu), [Prompt Süsleyici](/tr/ai-gateway/politikalar/prompt-susleyici) ve [RAG Enjeksiyonu](/tr/ai-gateway/politikalar/rag-enjeksiyonu) sonrasında çalışmalıdır; böylece nihai prompt değerlendirilir.

## Özellikler ve Yetenekler

### Temel Özellikler

- **İzin verilen konular:** Uygulamanın yanıt verebileceği konular.
- **Yasaklanan konular:** Her durumda sınırlandırılacak konular.
- **Eşikler:** İzin verilen ve yasaklanan konular için ayrı benzerlik eşikleri.
- **Aksiyon:** Gerçek engelleme için Inline ve Block; kalibrasyon için Flag veya Observe-Only.

### İleri Düzey Özellikler

- **Embedding uyumu:** Provider, model ve dimension birbiriyle uyumlu olmalıdır.
- **Yeniden kalibrasyon:** Model değişikliğinden sonra konu vektörleri ve eşikler yenilenmelidir.
- **İfade biçimi:** Tek kelime yerine açık ve bağlamlı ifadeler kullanılmalıdır. Sabit evrensel eşik yoktur.

## Kullanım Senaryoları

| Senaryo | Durum | Çözüm (Politika Uygulaması) | Beklenen Davranış / Sonuç |
|---------|-------|----------------------------|---------------------------|
| Bankacılık asistanı | Asistan yalnız hesap bakiyesi ve işlem sorgularına yanıt vermeli | İzin verilen konuya hesap bakiyesi ve işlem sorguları, yasaklanan konuya hukuki tavsiye eklenir | Konu dışı veya yasaklı mesaj eşik üzerinde eşleştiğinde model çağrısı engellenir |

## Politika Parametrelerini Yapılandırma

### Konu Tanımları

- **Allowed Topics:** Uygulamanın yanıt verebileceği konular.
- **Denied Topics:** Her durumda sınırlandırılacak konular.
- Tek kelime yerine açık ve bağlamlı ifadeler kullanılmalıdır.

### Benzerlik Eşikleri

- **Similarity Threshold:** İzin verilen konu eşleşme eşiği.
- **Denied Similarity Threshold:** Yasaklanan konu eşleşme eşiği.
- Sabit evrensel değer yoktur; model ve gerçek trafikle test edilmelidir.

### Embedding Ayarları

- Provider, model ve dimension birbiriyle uyumlu olmalıdır.
- Model değişikliği sonrasında konu vektörleri ve eşikler yenilenmelidir.

### Aksiyon ve Çalışma Modu

- Gerçek engelleme için `Inline + Block` kullanılmalıdır.
- Kalibrasyon için `Flag` veya `Observe-Only` tercih edilebilir.

## Kontrol Listesi

- İzin verilen ve yasaklanan konular açık yazıldı mı?
- Eşikler gerçek örneklerle test edildi mi?
- Embedding Provider, Model ve Dimension uyumlu mu?
- Gerçek engelleme için Inline ve Block seçildi mi?
- Politika doğru sırada mı?
- API Proxy yeniden deploy edildi mi?

## Politikayı Silme

Bu politikanın silme adımları ve kullanımdayken uygulanacak işlemler için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.

## Politikayı Dışa/İçe Aktarma

Bu politikanın dışa aktarma ve içe aktarma adımları için [Export/Import](/tr/admin/secrets-management/export-import) sayfasına bakabilirsiniz.

## Politikayı API'ye Bağlama

Bu politikanın API'lere nasıl bağlanacağı için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.
