---
title: "MCP Çağrısı"
description: "Yöneticinin belirlediği MCP aracını her uygun istekte sabit olarak çağırır; araç seçimini modele bırakmaz"
---

:::tip

Bu doküman spesifik bir politikanın detaylı kullanımını anlatır. Eğer Apinizer politika yapısını ilk kez kullanıyorsanız veya politikaların genel çalışma prensiplerini öğrenmek istiyorsanız, öncelikle [Politika Nedir?](/tr/concepts/temel-kavramlar/politika-nedir) sayfasını okumanızı öneririz.

:::

## Genel Bakış

### Amacı Nedir?

- Yöneticinin belirlediği MCP aracını her uygun istekte sabit olarak çağırır.
- Araç seçimini LLM'e bırakmaz.
- Argüman şablonunu çözüp kısıtları doğruladıktan sonra aracı çalıştırır.

### Çalışma Prensibi

1. MCP server endpoint'ine bağlanılır.
2. Capability discovery ile araç kataloğu alınır.
3. `targetToolName` sabit hedef olarak seçilir.
4. `argumentsTemplate` çözülerek JSON argümanları üretilir.
5. Argüman kısıtları doğrulanır ve araç çağrılır.

## Özellikler ve Yetenekler

### Temel Özellikler

- **Sabit araç:** Fixed varyantında `targetToolName` zorunludur.
- **Argüman şablonu:** Değişkenler çözüldükten sonra geçerli JSON üretmelidir.
- **Kısıtlar:** REQUIRED, REGEX, ENUM ve MAX_LENGTH uygulanabilir.
- **Fail-closed:** Discovery veya allow-list boşsa her araç serbest olmaz.

### İleri Düzey Özellikler

- **Bağlantı:** Endpoint ve transport MCP server ile uyumlu olmalıdır. Authentication, mTLS ve private egress hedef ortama göre yapılandırılır.
- **Önbellek:** Capability Cache TTL, araç kataloğunun yenilenme süresidir.
- **Drift:** `FAIL_CLOSED`, katalog değişiminde çağrıyı durdurur.
- **Hata:** `connectionConfigMcpRef or targetToolName not configured`, runtime yapılandırmasında server veya hedef araç bulunmadığını gösterir.

## Kullanım Senaryoları

| Senaryo | Durum | Çözüm (Politika Uygulaması) | Beklenen Davranış / Sonuç |
|---------|-------|----------------------------|---------------------------|
| Sabit müşteri araması | Destek asistanına gelen her istekte aynı araç çağrılmalı | `search_customer` seçilir; header'daki e-posta JSON argument template üzerinden araca gönderilir | Sonuç gateway değişkenine yazılır |

## Politika Parametrelerini Yapılandırma

### MCP Server ve Discovery

- Endpoint ve transport MCP server ile uyumlu olmalıdır.
- Authentication, mTLS ve private egress hedef ortama göre yapılandırılır.
- Discovery sonrasında araç sayısı sıfırdan büyük olmalıdır.

### Hedef Araç ve Argüman Şablonu

- `targetToolName` Fixed varyantında zorunludur.
- Şablon, değişkenler çözüldükten sonra geçerli JSON üretmelidir.
- REQUIRED, REGEX, ENUM ve MAX_LENGTH kısıtları uygulanabilir.
- Düzenleme ekranında hedef araç seçiminin korunduğu doğrulanmalıdır.

### Önbellek ve Drift

- Capability Cache TTL, araç kataloğunun yenilenme süresidir.
- `FAIL_CLOSED`, katalog değişiminde çağrıyı durdurur.

### Fail-Closed Davranış

Discovery veya allow-list boşsa her araç serbest olmaz.

## Kontrol Listesi

- Endpoint ve transport doğru mu?
- Authentication ve mTLS doğru mu?
- Araç discovery başarılı mı?
- Hedef araç seçilip kaydedildi mi?
- Argüman şablonu geçerli JSON mu?
- Düzenleme ekranında seçim korunuyor mu?
- API Proxy yeniden deploy edildi mi?

## Politikayı Silme

Bu politikanın silme adımları ve kullanımdayken uygulanacak işlemler için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.

## Politikayı Dışa/İçe Aktarma

Bu politikanın dışa aktarma ve içe aktarma adımları için [Export/Import](/tr/admin/secrets-management/export-import) sayfasına bakabilirsiniz.

## Politikayı API'ye Bağlama

Bu politikanın API'lere nasıl bağlanacağı için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.
