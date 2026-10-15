---
title: "RAG Enjeksiyonu"
description: "İsteği modele ulaşmadan önce bilgi tabanından getirilen ilgili pasajlarla zenginleştirir"
---

:::tip

Bu doküman spesifik bir politikanın detaylı kullanımını anlatır. Eğer Apinizer politika yapısını ilk kez kullanıyorsanız veya politikaların genel çalışma prensiplerini öğrenmek istiyorsanız, öncelikle [Politika Nedir?](/tr/concepts/temel-kavramlar/politika-nedir) sayfasını okumanızı öneririz.

:::

## Genel Bakış

### Amacı Nedir?

- LLM isteğini, modele ulaşmadan önce kendi bilgi tabanınızdan getirilen pasajlarla zenginleştirir.
- Modeli yeniden eğitmeden güncel ve özel dokümanlarla yanıt üretimini sağlar.
- Halüsinasyon riskini azaltır; tümüyle ortadan kaldırmaz.

Groundedness Protection, yanıtın bağlama uygunluğunu doğrular. Bunun için **Inject via Template** modu gerekir.

### Çalışma Prensibi

1. **İstek gelir:** RAG etkin bir API proxy üzerinden.
2. **Getir:** Apinizer, vektör veritabanında bilgi tabanlarından ilgili pasajları arar.
3. **Enjekte et:** Getirilen pasajlar, model isteği almadan önce isteğe eklenir.
4. **Yanıtla:** Model kendi bilgisi ve enjekte edilen bağlamla yanıt üretir.

Bilgi tabanı, indekslenmiş doküman koleksiyonudur. Desteklenen formatlar düz metin (`.txt`, `.md`), PDF (içerik otomatik çıkarılır) ve Excel (`.xlsx`, `.xls`) şeklindedir. Excel'de her sayfa ve satır ayrı işlenir: en fazla 50 sayfa, sayfa başına 20.000 satır, toplam 5.000.000 karakter.

İşleme hattı: oluştur, yükle, otomatik parçalama, otomatik indeksleme (embedding ve vektör veritabanına yazma).

Bu politika [Prompt Şablonu](/tr/ai-gateway/politikalar/prompt-sablonu) ve [Prompt Süsleyici](/tr/ai-gateway/politikalar/prompt-susleyici) sonrasında, [Prompt Koruması](/tr/ai-gateway/politikalar/prompt-korumasi), [DLP Koruması](/tr/ai-gateway/politikalar/dlp-korumasi), [Bağlam Bütünlüğü](/tr/ai-gateway/politikalar/baglam-butunlugu) ve [Semantik Önbellek](/tr/ai-gateway/politikalar/semantik-onbellek) öncesinde çalışmalıdır. Getirilen içerik de kullanıcı girdisi gibi guardrail incelemesinden geçer. Apinizer kaydederken sıralama ihlallerini düzeltir.

## Özellikler ve Yetenekler

### Temel Özellikler

| Parametre | Amaç | Varsayılan |
|-----------|------|-----------|
| **Embedding Provider** | İsteği vektöre çevirir (OpenAI uyumlu veya Voyage AI) | — |
| **Embedding Model** | Sağlayıcıya gönderilen model adı | `text-embedding-3-small` |
| **Embedding Dimension** | Vektör boyutu; veritabanı bağlantısıyla eşleşmeli | `1536` |
| **Top K Results** | Getirilecek en fazla pasaj sayısı | `4` (en az `1`) |
| **Similarity Threshold** | En düşük cosine benzerlik skoru | `0.7` |
| **Max Context Characters** | Enjekte edilen toplam bağlam sınırı | `4096` |

### İleri Düzey Özellikler

- **Kapsam izolasyonu:** İstek yalnız kendi projesinin pasajlarını getirir.
- **Güvenli varsayılan:** Proje çözümlenemezse ve Skip RAG when Project ID unresolved açıksa getirme atlanır.
- **Fail-closed:** Vektör veritabanı veya embedding sağlayıcısı erişilemezse ya da koleksiyon yoksa istek HTTP 502 (**ERR-268**) ile reddedilir.
- **Bilgi tabanı silme:** Silme bağımlılık kontrolüyle engellenmez. Vektör kayıtları hemen temizlenir. Silinen tabana referans veren deploy edilmiş RAG politikaları bundan sonra tüm istekleri bloklayarak başarısız olur.

## Kullanım Senaryoları

| Senaryo | Durum | Çözüm (Politika Uygulaması) | Beklenen Davranış / Sonuç |
|---------|-------|----------------------------|---------------------------|
| Ürün dokümantasyonu | Destek chatbot'u yüzlerce sayfa PDF'e dayanarak yanıt vermeli | PDF'ler bilgi tabanına yüklenir. Top K 4, eşik 0.7, mod Inject via Template | En ilgili 4 pasaj `<CONTEXT>...</CONTEXT>` şablonuyla enjekte edilir. İsteğe bağlı Groundedness Protection yanıtın bağlama dayandığını doğrular |

## Politika Parametrelerini Yapılandırma

### Bağlantı ve Bilgi Tabanı

| Alan | Zorunlu | Varsayılan |
|------|---------|-----------|
| **Knowledge Base** | Hayır | — |
| **Vector DB Connection** | Evet | — |
| **Embedding Provider** | Evet | — |
| **Collection Name** | Evet | — |
| **Embedding Model** | Hayır | `text-embedding-3-small` |
| **Embedding Dimension** | Hayır | `1536` |
| **Top K Results** | Hayır | `4` |
| **Similarity Threshold** | Hayır | `0.7` |
| **Max Context Characters** | Hayır | `4096` |
| **On No Match** | Hayır | Pass Through |
| **Injection Mode** | Hayır | Prepend to User Message |
| **Injection Template** | Yalnız Template modunda | `<CONTEXT>{{context}}</CONTEXT>{{prompt}}` |
| **Target Variable** | Hayır | — |
| **Skip RAG when Project ID unresolved** | Hayır | Açık |

Embedding Dimension, vektör veritabanı bağlantısındaki boyutla birebir eşleşmelidir.

### Enjeksiyon Modu

| Mod | Yerleşim | Önbellek etkisi |
|-----|----------|-----------------|
| **Prepend to User Message** (varsayılan) | Kullanıcı mesajının önüne | Etkisiz |
| **Prepend to System Message** | Sistem prompt'unun önüne | Sağlayıcı prompt önbelleğini bozar |
| **Append After System Message** | Mevcut sistem mesajından sonra | Önbellek dostu |
| **Inject via Template** | `{{context}}` nerede ise oraya | Şablona bağlı |

Groundedness Protection için Inject via Template zorunludur.

### Eşleşme Olmadığında

Varsayılan **Pass Through** bağlam olmadan devam eder. İhtiyaca göre istek reddedilebilir veya uyarı üretilebilir.

### Getirme Kalitesi

- **Top K Results:** Çok yüksek değer gürültülü bağlam, çok düşük değer eksik bilgi üretir. Genelde 3-5 dengelidir.
- **Similarity Threshold:** Yüksek eşik az ama isabetli pasaj getirir. Düşük eşik daha çok pasaj getirir ve alakasız içerik riskini artırır.
- **Max Context Characters:** Bağlamın model penceresini ve maliyeti aşmamasını sağlar.

## Kontrol Listesi

- Vector DB Connection, Embedding Provider ve Collection Name tanımlı mı?
- Embedding Dimension vektör veritabanı bağlantısıyla eşleşiyor mu?
- Bilgi tabanı yüklendi, parçalandı ve indekslendi mi?
- Top K ve Similarity Threshold ayarlandı mı?
- Max Context Characters model penceresine ve maliyete uygun mu?
- Injection Mode doğru mu?
- On No Match ihtiyaca uygun mu?
- Politika şablon ve süsleyiciden sonra, guardrail ve önbellekten önce mi?
- Bilgi tabanı silmenin deploy edilmiş politikaları bloklayacağı ekibe bildirildi mi?

## Politikayı Silme

Bu politikanın silme adımları ve kullanımdayken uygulanacak işlemler için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.

## Politikayı Dışa/İçe Aktarma

Bu politikanın dışa aktarma ve içe aktarma adımları için [Export/Import](/tr/admin/secrets-management/export-import) sayfasına bakabilirsiniz.

## Politikayı API'ye Bağlama

Bu politikanın API'lere nasıl bağlanacağı için [Politika Yönetimi](/tr/develop/api-proxy-konfigurasyonu/politika-yonetimi) sayfasına bakabilirsiniz.
