---
title: "Token Hız Sınırı"
description: "LLM trafiğinin token tüketimini ve isteğe bağlı USD maliyetini zaman pencerelerinde sınırlar"
---

:::tip

Bu doküman spesifik bir politikanın detaylı kullanımını anlatır. Eğer Apinizer politika yapısını ilk kez kullanıyorsanız veya politikaların genel çalışma prensiplerini öğrenmek istiyorsanız, öncelikle [Politika Nedir?](/tr/concepts/temel-kavramlar/politika-nedir) sayfasını okumanızı öneririz.

:::

## Genel Bakış

### Amacı Nedir?

- Belirli bir zaman penceresinde tüketilebilecek token miktarını veya harcanabilecek bütçeyi sınırlar.
- Tek bir tüketici veya ekibin tüm kapasiteyi kullanmasını önler.
- Ani token patlamalarını yumuşatır ve proje veya organizasyon bazında sınır çizer.

Bu özellik AI Gateway lisans modülüne dahildir. Kota ekranındaki limitler tek başına çalışmaz. Zorlama, AI proxy'nin istek politika listesindeki Token Hız Sınırı politikası üzerinden devreye girer.

### Çalışma Prensibi

1. **Tahmin:** İstek modele gönderilmeden token maliyeti tahmin edilir.
2. **Rezervasyon:** Tahmin, ilgili tüm kapsam ve zaman pencerelerinde rezerve edilir.
3. **Düzeltme:** Yanıt tamamlandığında, streaming dahil, rezervasyon gerçek tüketime göre düzeltilir.

Birden fazla kapsam aynı anda geçerliyse en katı sınır uygulanır.

| Kapsam | Anlamı |
|-------|--------|
| **Credential** | Tek bir Consumer veya API istemcisinin belirli bir proxy ve ortamdaki trafiği. AI Token Budget olarak atanır |
| **Application** | Bir credential'ın belirli bir API proxy üzerinden kullanımı |
| **Organization** | Aynı organizasyondaki tüm credential'lar arasında paylaşılan sınır |
| **Project** | Bir projenin tüm AI trafiği |

Admin kapsamında tanımlanan organizasyonlar projeler arasında paylaşılabilir. Proje yöneticileri bunları görüntüler ve kullanır; düzenleme yalnız sistem yöneticisindedir.

Her kapsam için dört pencere ve isteğe bağlı USD bütçesi tanımlanabilir: Per Minute, Per Hour, Per Day, Per Month. Token limiti ve USD bütçesi bağımsızdır.

## Özellikler ve Yetenekler

### Temel Özellikler

| Aksiyon | Davranış | Ne zaman |
|---------|----------|----------|
| **Block** | İstek reddedilir. `429` ve `Retry-After` (saniye) döner | Katı sınır |
| **Failover** | İstek, zincirdeki sonraki sağlayıcı veya modele gider | Kesintisiz hizmet |
| **Alert Only** | İstek geçer; yalnız uyarı üretilir | İzleme |
| **Downgrade to a Cheaper Model** | İstek daha düşük maliyetli modele gider | Hizmeti kesmeden maliyet düşürme |

`Retry-After`, `apinizer.limit.retryAfterClampSeconds` JVM özelliği ile sınırlanır. Varsayılan `86400` saniyedir (1 gün).

### İleri Düzey Özellikler

- **Oversized Guard:** Max Tokens Per Request ve Max Prompt Characters tek isteğin boyutunu sınırlar. Limit Source, Explicit veya Model Catalog olabilir. On Overflow, Block veya Truncate Oldest Messages olabilir.
- **Kesme koruması:** Truncate Oldest Messages seçilse bile tüm `system` mesajları ve son `user` mesajı korunur.
- **Eşik alarmları:** Limitlerin %50, %80, %90 ve %100 seviyelerinde alarm üretilir.
- **İzleme:** Reports View Tokens Used, Tokens Remaining, Cost to Date ve Alerts değerlerini gösterir. [Usage Reports](/api-reference/usage-reports) uç noktaları salt okunur tüketim verisi sağlar.

## Kullanım Senaryoları

| Senaryo | Durum | Çözüm (Politika Uygulaması) | Beklenen Davranış / Sonuç |
|---------|-------|----------------------------|---------------------------|
| SaaS müşteri kotası | Her müşteri ayrı organizasyon; toplam maliyet ve müşteri izolasyonu gerekli | Project aylık 50M token. Organization saatlik 200K token ve aylık 200 USD. Credential dakikada 20K token | Bir müşteri saatlik sınırı doldurursa Block ile 429 döner ve diğer müşteriler etkilenmez. %50, %80, %90 ve %100 eşiklerinde alarm üretilir |
| Maliyet düşürme | Pahalı model bütçeyi zorluyor | Downgrade | İstek daha ucuz modele gider, hizmet kesilmez |
| Sağlayıcı kotası | Birincil sağlayıcıda kota dolmuş | Failover | İstek ikincil sağlayıcıya gider |

## Politika Parametrelerini Yapılandırma

### Aşım Aksiyonu

Block, Failover, Alert Only veya Downgrade to a Cheaper Model seçilir. Katı koruma için Block, kesintisiz hizmet için Failover veya Downgrade, kalibrasyon için Alert Only kullanılır.

### Kapsam ve Pencere

- Credential, Application, Organization veya Project. Birden fazla kapsamda en katı limit uygulanır.
- Per Hour günlük hız, Per Month harcama tavanı, Per Minute patlama koruması için kullanılır.
- Token limiti, USD bütçesi veya ikisi birden her pencerede ayrı tanımlanabilir.

### İstek Başına Boyut

- **Max Tokens Per Request:** Bu token sayısını aşan istekleri engeller.
- **Max Prompt Characters:** Prompt karakter limitini aşarsa engeller.
- **Limit Source:** Explicit, Max Tokens Per Request değerini kullanır. Model Catalog, model kataloğundaki limiti kullanır.
- **On Overflow:** Block veya Truncate Oldest Messages.

### Alarm ve Rapor

%50, %80, %90 ve %100 alarmlarının bildirim kanallarına bağlı olduğunu devreye almadan önce doğrulayın.

## Kontrol Listesi

- Limitler tanımlandıktan sonra politika AI proxy'nin istek politika listesine eklendi mi?
- Kapsam doğru mu ve birden fazla kapsamda en katı limit dikkate alındı mı?
- Zaman pencereleri ihtiyaca göre ayarlandı mı?
- Token limiti, USD bütçesi veya ikisi birden gerekli mi?
- Aşım aksiyonu doğru mu?
- Oversized Guard gerekli mi?
- Truncate Oldest Messages kullanılacaksa bağlam korunması kabul edilebilir mi?
- Eşik alarmları bildirim kanallarına bağlı mı?

## Politikayı Silme

Bu politikanın silme adımları ve kullanımdayken uygulanacak işlemler için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.

## Politikayı Dışa/İçe Aktarma

Bu politikanın dışa aktarma ve içe aktarma adımları için [Export/Import](/tr/admin/secrets-management/export-import) sayfasına bakabilirsiniz.

## Politikayı API'ye Bağlama

Bu politikanın API'lere nasıl bağlanacağı için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.
