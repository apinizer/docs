# Apinizer Dokümantasyonu

**Apinizer**, kurumsal şirketlerin iç ve dış sistemlerindeki API'leri güvenli, performanslı ve yönetilebilir hale getiren **Full Lifecycle API Management** platformudur.

Bu dokümantasyon, Apinizer platformunu kullanmak isteyen geliştiriciler, sistem yöneticileri ve iş analistleri için kapsamlı bir rehber sunar. Platformun tüm özelliklerini keşfetmek, API Proxy'lerinizi oluşturmak ve yönetmek, güvenlik politikalarınızı yapılandırmak ve sisteminizi optimize etmek için ihtiyacınız olan tüm bilgileri burada bulabilirsiniz.

Dokümantasyon, farklı roller ve kullanım senaryolarına göre özelleştirilmiş içerikler içerir ve [Mintlify](https://mintlify.com) kullanılarak oluşturulmuştur. Hızlı başlangıç rehberlerinden derinlemesine teknik dokümantasyona kadar, Apinizer ile çalışırken ihtiyacınız olan her şeyi kapsar.

## 🚀 Hızlı Başlangıç

### Demo Ortamı

Apinizer'ı denemek için [demo.apinizer.com](https://demo.apinizer.com/) adresindeki demo ortamını kullanabilirsiniz. Demo ortamında hesap oluşturmak için [kayıt olun](https://demo.apinizer.com/register).

### İlk API Proxy'nizi Oluşturun

1. [Hızlı Başlangıç Rehberi](/quickstart) - 5 dakikada ilk API Proxy'nizi oluşturun
2. [Rolünüze Göre Başlangıç](/tr/baslamadan-once/rolunuzu-secin) - Size en uygun başlangıç noktasını bulun

## 📖 Dokümantasyon Yapısı

### Genel Bakış
- **[Apinizer Nedir?](/tr/apinizer-anlama/apinizer-nedir)** - Platform genel bakış ve ürün ailesi
- **[Temel Kavramlar](/tr/apinizer-anlama/temel-kavramlar)** - API Proxy, Policy, Message Flow ve diğer temel kavramlar
- **[Mimari ve Deployment](/tr/apinizer-anlama/mimari)** - Sistem mimarisi ve deployment topolojileri

### Geliştirici Dokümantasyonu
- **[API Proxy Oluşturma](/tr/gelistirici/api-proxy-olusturma)** - REST, SOAP, gRPC, WebSocket API Proxy oluşturma
- **[Politika Yönetimi](/tr/gelistirici/politikalar)** - Güvenlik, doğrulama, trafik yönetimi politikaları
- **[Monitoring ve Analytics](/tr/analytic/monitoring-analytics)** - API performans izleme ve analiz

### Yönetici Dokümantasyonu
- **[Kullanıcı ve Erişim Yönetimi](/tr/admin/kullanici-erisim-yonetimi)** - Kullanıcı, rol ve izin yönetimi
- **[Sistem Ayarları](/tr/admin/sistem-ayarlari)** - Platform konfigürasyonu ve ayarlar
- **[Monitoring ve Alerting](/tr/analytic/monitoring-alerting)** - Sistem izleme ve uyarı yönetimi

### Kurulum ve Operasyon
- **[Kurulum Kılavuzu](/tr/kurulum-surum-yukseltme/kurulum)** - Kubernetes, MongoDB, Elasticsearch kurulumları
- **[Bakım ve Operasyon](/tr/operasyon)** - Veritabanı yönetimi ve yönetici kılavuzları
- **[Sorun Giderme](/tr/operasyon/sorun-giderme)** - Yaygın sorunlar ve çözümleri

## 🛠️ Yerel Geliştirme

Dokümantasyonu yerel olarak görüntülemek ve düzenlemek için:

### Gereksinimler
- Node.js (v18 veya üzeri)
- npm veya yarn

### Kurulum

1. Repository'yi klonlayın:
```bash
git clone https://github.com/apinizer/docs.git
cd docs
```

2. Mintlify CLI'yi global olarak yükleyin:
```bash
npm i -g mint
```

3. Yerel geliştirme sunucusunu başlatın:
```bash
mint dev
```

4. Tarayıcınızda `http://localhost:3000` adresini açın

### Dokümantasyon Düzenleme

- Dokümantasyon dosyaları `.mdx` formatındadır
- Ana konfigürasyon dosyası `docs.json` içindedir
- Değişiklikler otomatik olarak tarayıcıda yenilenir

## 📝 İçerik Katkısı

Dokümantasyona katkıda bulunmak için:

1. Yeni bir branch oluşturun
2. Değişikliklerinizi yapın
3. Pull request oluşturun

## 🔗 Faydalı Bağlantılar

- **Demo Ortamı**: [demo.apinizer.com](https://demo.apinizer.com/)
- **Ana Web Sitesi**: [apinizer.com](https://apinizer.com)
- **Destek**: Dokümantasyon içindeki [SSS](/tr/operasyon/sorun-giderme/sss) bölümüne bakın

## 📄 Lisans

Bu dokümantasyon Apinizer'a aittir. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🤝 Yardım

Sorularınız için:
- Dokümantasyon içindeki [Sorun Giderme](/tr/operasyon/sorun-giderme) bölümüne bakın
- [SSS](/tr/operasyon/sorun-giderme/sss) sayfasını inceleyin

---

**Not**: Bu dokümantasyon sürekli güncellenmektedir. En güncel bilgiler için dokümantasyon sitesini ziyaret edin.
