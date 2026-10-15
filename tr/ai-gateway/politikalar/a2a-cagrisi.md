---
title: "A2A Çağrısı"
description: "Yöneticinin seçtiği A2A skill'ini her uygun istekte sabit olarak çağırır; skill seçimini modele bırakmaz"
---

:::tip

Bu doküman spesifik bir politikanın detaylı kullanımını anlatır. Eğer Apinizer politika yapısını ilk kez kullanıyorsanız veya politikaların genel çalışma prensiplerini öğrenmek istiyorsanız, öncelikle [Politika Nedir?](/tr/concepts/temel-kavramlar/politika-nedir) sayfasını okumanızı öneririz.

:::

## Genel Bakış

### Amacı Nedir?

- Yöneticinin önceden seçtiği A2A skill'ini her uygun istekte sabit olarak çağırır.
- Skill seçimini LLM'e bırakmaz.
- Sonucu beklemeden devam edebilir veya sonucu bir değişkene yazabilir.

### Çalışma Prensibi

1. Agent endpoint'inden Agent Card alınır.
2. Skill'ler keşfedilir ve `targetSkillName` seçilir.
3. Message Template içindeki gateway değişkenleri çözülür.
4. Mesaj hedef skill'e gönderilir.
5. `FIRE_AND_FORGET` akışı bekletmez; `SYNC_TO_VARIABLE` sonucu bekleyip değişkene yazar.

## Özellikler ve Yetenekler

### Temel Özellikler

- **Sabit skill:** Fixed varyantında `targetSkillName` zorunludur.
- **Mesaj şablonu:** Request body, header ve correlationId değişkenleri kullanılabilir.
- **Bekleme modu:** Sonucu beklemeden devam veya çıktı değişkenine yazma.
- **Fail-closed:** Discovery boşsa veya hedef skill kaydedilmemişse çağrıya izin verilmez.

### İleri Düzey Özellikler

- **Private ağ:** Private ağ hedefinde **Allow Private-Network Egress** açılmalıdır. Loopback, link-local ve metadata adresleri her durumda yasaktır.
- **Zaman aşımı:** Call Timeout her HTTP gönderimini; Task Wait Timeout tüm görev bekleme süresini sınırlar.
- **Hata:** `connectionConfigA2aRef or targetSkillName not configured`, runtime yapılandırmasında ajan veya hedef skill bulunmadığını gösterir.

## Kullanım Senaryoları

| Senaryo | Durum | Çözüm (Politika Uygulaması) | Beklenen Davranış / Sonuç |
|---------|-------|----------------------------|---------------------------|
| Sabit özet skill'i | Her chat isteğinde aynı skill çağrılmalı | `summarize_report` seçilir; mesaj şablonu request body'deki kullanıcı metnini ajana aktarır | Fire-and-forget ise ana istek ajan sonucunu beklemeden devam eder |

## Politika Parametrelerini Yapılandırma

### Agent Endpoint ve Discovery

- Endpoint'e çözülebilen taban URL yazılır; Agent Card yolu eklenmez.
- Discover sonrasında skill sayısı sıfırdan büyük olmalıdır.
- Private ağ hedefinde **Allow Private-Network Egress** açılmalıdır.
- Loopback, link-local ve metadata adresleri her durumda yasaktır.

### Hedef Skill ve Mesaj Şablonu

- `targetSkillName` Fixed varyantında zorunludur.
- Message Template içinde request body, header ve correlationId değişkenleri kullanılabilir.
- Düzenleme ekranı tekrar açıldığında seçilen skill'in korunduğu doğrulanmalıdır.

### Bekleme Modu ve Zaman Aşımı

- **FIRE_AND_FORGET:** Sonucu beklemez.
- **SYNC_TO_VARIABLE:** Sonucu bekler ve output değişkenine yazar.
- Call Timeout her HTTP gönderimini; Task Wait Timeout tüm görev bekleme süresini sınırlar.

### Fail-Closed Davranış

Discovery boşsa veya hedef skill kaydedilmemişse çağrıya izin verilmez.

## Kontrol Listesi

- Endpoint çözülebiliyor mu?
- Gerekliyse private egress açık mı?
- Skill discovery başarılı mı?
- Target Skill seçilip kaydedildi mi?
- Düzenleme ekranında seçim korunuyor mu?
- Bekleme modu ve zaman aşımları doğru mu?
- API Proxy yeniden deploy edildi mi?

## Politikayı Silme

Bu politikanın silme adımları ve kullanımdayken uygulanacak işlemler için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.

## Politikayı Dışa/İçe Aktarma

Bu politikanın dışa aktarma ve içe aktarma adımları için [Export/Import](/tr/admin/secrets-management/export-import) sayfasına bakabilirsiniz.

## Politikayı API'ye Bağlama

Bu politikanın API'lere nasıl bağlanacağı için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.
