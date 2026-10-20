---
title: "Döngü Koruması"
description: "Kısa bir zaman penceresinde aynı isteğin tekrarını tespit eder ve retry fırtınası ile agent döngüsünü sınırlar"
---

:::tip

Bu doküman spesifik bir politikanın detaylı kullanımını anlatır. Eğer Apinizer politika yapısını ilk kez kullanıyorsanız veya politikaların genel çalışma prensiplerini öğrenmek istiyorsanız, öncelikle [Politika Nedir?](/tr/concepts/temel-kavramlar/politika-nedir) sayfasını okumanızı öneririz.

:::

## Genel Bakış

### Amacı Nedir?

- Kısa bir zaman penceresinde aynı isteğin tekrar tekrar gönderilmesini tespit eder.
- Takılıp sürekli yeniden deneyen bir istemciyi veya kontrolden çıkmış bir agent döngüsünü sınırlar.
- Maliyet, kaynak ve kararlılık riskini azaltır.

### Çalışma Prensibi

Politika, kayan bir zaman penceresi içinde tekrarlanan özdeş istekleri sayar. Bir istek, şu üç koşul aynıysa özdeş sayılır:

1. Aynı credential veya çağıran kimliği
2. Aynı AI Gateway ve model
3. Bayt bayt aynı prompt içeriği

Tekrar sayısı eşiği aşınca seçilen aksiyon uygulanır. Küçük bir fark isteği farklı yapar. Döngü Koruması yalnız birebir aynı istekleri hedefler. Anlamsal benzerlik [Semantik Önbellek](/tr/ai-gateway/politikalar/semantik-onbellek) politikasının konusudur.

Çalışma modu yalnız **Inline** olabilir. Asenkron veya Observe-Only yoktur.

## Özellikler ve Yetenekler

### Temel Özellikler

- **`Window (seconds)`:** Tekrarların sayıldığı kayan pencere. Kısa pencere ani patlamaları, uzun pencere ısrarlı tekrarları yakalar.
- **`Max Repeats`:** Aşıldığında aksiyonu tetikleyen eşik.
- **Counting Mode:** All requests (varsayılan) her isteği sayar. Accepted only yalnız diğer kontrollerden geçmiş istekleri sayar.
- **Aksiyon:** FLAG (varsayılan) isteği geçirir ve kaydeder. BLOCK isteği HTTP 429 ile reddeder.

### İleri Düzey Özellikler

- **Limit Change Action:** Max Repeats değişince sayaç Leave unchanged (varsayılan), Clamp to previous limit veya Reset olabilir. Reset, limit yükseltildiğinde sayacı sıfırlar; düşürmede asla sıfırlamaz.
- **Anonim istekler:** Politikayı uygulama, ortak sayaç havuzundan tüket veya HTTP 401 ile reddet. Bu seçim, proxy seviyesindeki anonim engellemeden ayrıdır.
- **Kapsam:** Hem istek hem yanıt yönünde çalışır. AI Gateway yanında MCP ve A2A Gateway'lerde de aynı politika hattı üzerinden kullanılabilir.

## Kullanım Senaryoları

| Senaryo | Durum | Çözüm (Politika Uygulaması) | Beklenen Davranış / Sonuç |
|---------|-------|----------------------------|---------------------------|
| Agent döngüsü | Araç yanıtını işleyemeyen agent aynı LLM isteğini sürekli yeniden deniyor | Window içindeki tekrarlar sayılır; Max Repeats aşılınca aksiyon uygulanır | BLOCK ise sonraki istekler HTTP 429 ile reddedilir. FLAG ise istekler geçer ve durum kaydedilir. Pencere bitince sayaç normale döner |

Eşiği kalibre etmek için önce FLAG ile izleyin. Meşru birkaç yeniden denemeyi bloklamayacak, kaçak döngüyü ise hızlı yakalayacak bir denge kurun.

## Politika Parametrelerini Yapılandırma

### Pencere ve Eşik

- **`Window (seconds)`:** Tekrarların sayıldığı saniye cinsinden kayan pencere.
- **`Max Repeats`:** Çok düşük değer meşru yeniden denemeleri de yakalayabilir. Çok yüksek değer döngüyü geç yakalar.

### Sayma Modu

- **`All requests`:** Diğer guardrail'ler tarafından reddedilenler dahil her istek sayılır.
- **Accepted only:** Yalnız diğer kontrollerden geçmiş istekler sayılır.

Kötü niyetli veya hatalı trafiği de saymak için All requests uygundur.

### Limit Değişince Sayaç

- **`Leave unchanged`:** Sayaç korunur; yeni limit mevcut pencere bitince geçerli olur.
- **Clamp to previous limit:** Sayaç eski limit değerine sabitlenir.
- **Reset:** Limit yükseltildiğinde sayaç sıfırlanır. Düşürmede asla sıfırlanmaz.

### Anonim İstekler

- **Do not apply the policy:** Anonim isteklerde guardrail devre dışıdır.
- **Consume from a shared pool:** Tüm anonim trafik tek bir ortak sayaç kovasını paylaşır.
- **Reject the request:** Anonim istekler HTTP 401 ile reddedilir.

### Aksiyon

- **FLAG:** İstek geçer; eşleşme izleme için kaydedilir.
- **BLOCK:** İstek HTTP 429 ile reddedilir.

## Kontrol Listesi

- Window beklenen tekrar davranışına uygun mu?
- Max Repeats meşru yeniden denemeleri bloklamadan döngüyü yakalıyor mu?
- Counting Mode doğru mu?
- Aksiyon ihtiyaca uygun mu?
- Anonim istek davranışı güvenlik ihtiyacına uygun mu?
- Limit Change Action operasyonel beklentiye uygun mu?
- Eşik kalibrasyonu için önce FLAG ile izleme yapıldı mı?
- Çalışma modunun yalnız Inline olduğu biliniyor mu?

## Politikayı Silme

Bu politikanın silme adımları ve kullanımdayken uygulanacak işlemler için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.

## Politikayı Dışa/İçe Aktarma

Bu politikanın dışa aktarma ve içe aktarma adımları için [Export/Import](/tr/admin/secrets-management/export-import) sayfasına bakabilirsiniz.

## Politikayı API'ye Bağlama

Bu politikanın API'lere nasıl bağlanacağı için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.
