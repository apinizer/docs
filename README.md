# Apinizer Dokümantasyonu

**Apinizer**, kurumsal şirketlerin iç ve dış sistemlerindeki API'leri güvenli, performanslı ve yönetilebilir hale getiren **Full Lifecycle API Management** platformudur.

Bu dokümantasyon, Apinizer platformunu kullanmak isteyen geliştiriciler, sistem yöneticileri ve iş analistleri için kapsamlı bir rehber sunar. Platformun tüm özelliklerini keşfetmek, API Proxy'lerinizi oluşturmak ve yönetmek, güvenlik politikalarınızı yapılandırmak ve sisteminizi optimize etmek için ihtiyacınız olan tüm bilgileri burada bulabilirsiniz.

Dokümantasyon, farklı roller ve kullanım senaryolarına göre özelleştirilmiş içerikler içerir ve [Docusaurus](https://docusaurus.io) kullanılarak oluşturulmuştur. Hızlı başlangıç rehberlerinden derinlemesine teknik dokümantasyona kadar, Apinizer ile çalışırken ihtiyacınız olan her şeyi kapsar.

## 🚀 Hızlı Başlangıç

### Demo Ortamı

Apinizer'ı denemek için [demo.apinizer.com](https://demo.apinizer.com/) adresindeki demo ortamını kullanabilirsiniz. Demo ortamında hesap oluşturmak için [kayıt olun](https://demo.apinizer.com/register).

### İlk API Proxy'nizi Oluşturun

1. [Hızlı Başlangıç Rehberi](/quickstart) - 5 dakikada ilk API Proxy'nizi oluşturun ve rolünüze göre başlangıç noktası bulun

## 📖 Dokümantasyon Yapısı

### Genel Bakış
- **[Apinizer Nedir?](/tr/concepts/apinizer-nedir)** - Platform genel bakış ve ürün ailesi
- **[Temel Kavramlar](/tr/concepts/temel-kavramlar/api-proxy-group.mdx)** - API Proxy, Policy, Message Flow ve diğer temel kavramlar
- **[Mimari ve Deployment](/tr/concepts/mimari)** - Sistem mimarisi ve deployment topolojileri

### Geliştirici Dokümantasyonu
- **[API Proxy Oluşturma](/tr/develop/api-proxy-olusturma/api-creator-db-api-olusturma.mdx)** - REST, SOAP, gRPC, WebSocket API Proxy oluşturma
- **[Politika Yönetimi](/tr/develop/politikalar/plain-text)** - Güvenlik, doğrulama, trafik yönetimi politikaları
- **[Monitoring ve Analytics](/tr/analytic/analytics)** - API performans izleme ve analiz

### Yönetici Dokümantasyonu
- **[Kullanıcı ve Erişim Yönetimi](/tr/admin/user-access-management/genel-bakis.mdx)** - Kullanıcı, rol ve izin yönetimi
- **[Sistem Ayarları](/tr/admin/system-settings/genel-bakis.mdx)** - Platform konfigürasyonu ve ayarlar
- **[Monitoring ve Alerting](/tr/monitor/izleme-genel-bakis)** - Sistem izleme ve uyarı yönetimi

### Kurulum ve Operasyon
- **[Kurulum Kılavuzu](/tr/setup/genel-bakis)** - Kubernetes, MongoDB, Elasticsearch kurulumları
- **[Bakım ve Operasyon](/tr/operations/genel-bakis.mdx)** - Veritabanı yönetimi ve yönetici kılavuzları
- **[Sorun Giderme](/tr/operations/sorun-giderme/kubernetes-docker-containerd-sorunlari.mdx)** - Yaygın sorunlar ve çözümleri

## 🛠️ Yerel Geliştirme

Dokümantasyonu yerel olarak görüntülemek ve düzenlemek için:

### Gereksinimler
- Node.js (v20 veya üzeri)
- npm

### Kurulum

1. Repository'yi klonlayın:
```bash
git clone https://github.com/apinizer/docs.git
cd docs
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Yerel geliştirme sunucusunu başlatın:
```bash
npm run start        # Türkçe (port 3000)
npm run start:en     # İngilizce
```

4. Tarayıcınızda `http://localhost:3000` adresini açın

### Dokümantasyon Düzenleme

- Dokümantasyon dosyaları `.mdx` formatındadır
- Ana konfigürasyon `docusaurus.config.ts`; navigasyon `sidebars-tr.ts` / `sidebars-en.ts` / `sidebars-api-reference.ts` dosyalarındadır
- Üretim derlemesi: `npm run build`
- Değişiklikler otomatik olarak tarayıcıda yenilenir

## 📝 İçerik Katkısı

Dokümantasyona katkıda bulunmak için:

1. Yeni bir branch oluşturun
2. Değişikliklerinizi yapın
3. Pull request oluşturun

## 🔗 Faydalı Bağlantılar

- **Demo Ortamı**: [demo.apinizer.com](https://demo.apinizer.com/)
- **Ana Web Sitesi**: [apinizer.com](https://apinizer.com)
- **Destek**: Dokümantasyon içindeki [Sorun Giderme](/tr/operations/sorun-giderme/kubernetes-docker-containerd-sorunlari.mdx) bölümüne bakın

## 📄 Lisans

Bu dokümantasyon Apinizer'a aittir. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🤝 Yardım

Sorularınız için:
- Dokümantasyon içindeki [Sorun Giderme](/tr/operations/sorun-giderme/kubernetes-docker-containerd-sorunlari.mdx) bölümüne bakın
- [Sorun Giderme](/tr/operations/sorun-giderme/kubernetes-docker-containerd-sorunlari.mdx) sayfasını inceleyin

---

**Not**: Bu dokümantasyon sürekli güncellenmektedir. En güncel bilgiler için dokümantasyon sitesini ziyaret edin.
