# REST'ten SOAP'a: Neden ve ne zaman?

> **Taslak — APNZ-2647.** Ürün dokümantasyonu değildir; yayın öncesi editoryal kontrol gerekir.

Kurumsal entegrasyonlarda istemci ekipleri REST ve JSON ile çalışmaya alışırken, arka plandaki servisler hâlâ WSDL ile tanımlı SOAP uç noktaları sunmaya devam eder. Bu yazı, neden böyle bir köprüye ihtiyaç duyulduğunu, hangi koşullarda mantıklı olduğunu ve Apinizer dokümantasyonunda anlatılan akışla bunun nasıl ele alınabileceğini özetler.

## Kısa tanım

**REST-to-SOAP** (Apinizer’da Rest2Soap tipi API Proxy), istemciye REST/JSON sözleşmesi sunarken gateway’in isteği SOAP/XML biçimine dönüştürüp backend SOAP servisine iletmesini ve yanıtı tekrar istemcinin beklediği forma getirmesini ifade eder. Kaynak sözleşme genellikle **WSDL** (ve ilişkili **XSD** şemaları) üzerinden API Proxy oluşturulurken tanımlanır; istemci tarafında ise OpenAPI benzeri REST uç noktaları ve JSON gövdeler kullanılır.

Bu model, backend’i aynı gün SOAP’tan REST’e taşımadan yeni kanalları (mobil uygulama, B2B partner, mikro servis) açmak istediğinizde sık görülür. Amaç “SOAP’ı bitirmek” değil, **erişim katmanını modernleştirmek** olabilir; backend yaşam döngüsü ayrı bir karar olarak kalır.

## Tipik zorluklar

Abartılı iddialar yerine, dokümantasyonda ve sahadaki entegrasyonlarda tekrar eden pratik konular:

- **WSDL ve XSD erişimi:** WSDL HTTPS üzerinden açılsa bile iç referanslar HTTP’de kalabilir; dosya çözümleme hataları oluşabilir. Bu durumda tanım dosyasını düzeltme imkânı yoksa **dosya yükleme** (WSDL + XSD’lerin aynı seviyede ZIP içinde) devreye girer. Ayrıntılar: [Çoklu Schema Port WSDL](/tr/develop/api-proxy-olusturma/coklu-schema-port-wsdl).

- **Çoklu port ve şema:** Tek WSDL içinde birden fazla port veya şema olabilir; Apinizer varsayılan olarak ilk portu kullanır. Diğer portlar için WSDL’in yalnızca ilgili portu içerecek şekilde ayrıştırılıp ayrı API Proxy oluşturulması gerekebilir.

- **Sözleşme güncellemeleri:** Backend WSDL’i değiştiğinde (yeni operasyon, şema revizyonu) proxy’yi sıfırdan kurmak yerine **Yeniden Ayrıştır (Reparse)** ile mevcut tanım güncellenebilir; routing adresinin otomatik değişmediği unutulmamalıdır.

- **JSON ↔ XML eşlemesi:** İstemci JSON gönderir; gateway SOAP envelope ve şema kurallarına uygun XML üretir. Alan adları, namespace’ler ve zorunlu elemanlar WSDL/XSD ile uyumlu olmalıdır. İstek tarafında şema doğrulama politikaları bu uyumu erken aşamada yakalayabilir.

- **Yanıt sadeleştirme:** SOAP yanıtı geniş bir XML ağacı olabilir; istemciye yalnızca bir alt küme (örneğin ad/soyad) dönülmesi ek dönüşüm veya script gerektirebilir.

Bu maddeler SOAP’ın “her zaman kötü” olduğu anlamına gelmez; farklı protokol ve sözleşme katmanlarını **bilinçli olarak bir arada yönetmek** zorunludur.

## Apinizer'da akış

Dokümantasyondaki tipik yol şu bileşenlerden oluşur:

1. **SOAP tanımını Apinizer’a taşımak**  
   WSDL URL’si veya ZIP içinde WSDL + XSD dosyaları ile SOAP API Proxy / REST-to-SOAP proxy oluşturma. Çoklu port, XSD referansları ve reparse adımları için: [Çoklu Schema Port WSDL](/tr/develop/api-proxy-olusturma/coklu-schema-port-wsdl).

2. **İstemci sözleşmesini REST/JSON’da netleştirmek**  
   İstek gövdesinin JSON şemasına uygunluğu **JSON Schema Validation** politikası ile kontrol edilebilir. REST-to-SOAP tipinde bir proxy üzerinde adım adım örnek: [JSON Schema Validation — REST-to-SOAP](/tr/tutorials/api-proxy-senaryolari/json-schema-validation-rest-to-soap).

3. **İstek/yanıt dönüşümü ve backend çağrısı**  
   Gateway, Rest2Soap dönüşüm kurallarına göre JSON isteği SOAP isteğine çevirir, backend’e iletir ve yanıtı istemci formatına geri dönüştürür. Routing ve SOAP action/namespace düzeltmeleri proxy yapılandırmasının parçasıdır (HTTP yönlendirme ve SOAP proxy oluşturma dokümanlarıyla birlikte düşünülmelidir).

4. **Yanıtı işlemek (isteğe bağlı)**  
   Backend’den dönen JSON/XML yanıtı istemci için sadeleştirmek veya boş yanıtta anlamlı HTTP durum kodu dönmek için response hattında Groovy script kullanılabilir. Örnek akış: [JsonSlurper ile Rest2Soap yanıt işleme](/tr/tutorials/nasil-yapilir-kilavuzlari/develop-kilavuzlari/groovy-kullanimi/jsonslurper-rest2soap-yanit-isleme).

5. **Yaşam döngüsü**  
   WSDL güncellendiğinde reparse sihirbazı operasyonları karşılaştırır; XSD şemalarının güncellenip güncellenmeyeceği ve WS-Addressing gibi seçenekler adım adım seçilir. Üretim routing adresinin korunması bilinçli bir güvenlik/operasyon tercihidir.

Özetle: **WSDL → REST yüzeyi → (doğrulama) → JSON↔SOAP dönüşümü → (isteğe bağlı yanıt zenginleştirme/sadeleştirme)**.

## Örnek senaryo

*Hayali isimler; gerçek kurum veya ürün referansı değildir.*

**NovaPay Mobil** ekibi, **Merkezi Adres ve Kimlik Doğrulama Servisi (MAKDS)** adlı legacy SOAP servisini doğrudan çağırmak istemiyor: mobil istemci yalnızca HTTPS + JSON biliyor. MAKDS WSDL’i çoklu XSD import’u içeriyor ve test ortamında XSD adresleri erişilemiyor.

Entegrasyon ekibi Apinizer’da WSDL ve XSD’leri aynı dizin seviyesinde ZIP’leyerek yükler, REST-to-SOAP proxy oluşturur. İstemci `POST /v1/kimlik-sorgula` ile aşağıdaki gibi JSON gönderir:

```json
{
  "Sorgula": {
    "kriterListesi": {
      "OrnekKimlikSorguKriteri": {
        "DogumAy": 3,
        "DogumGun": 15,
        "DogumYil": 1985,
        "ReferansNo": "REF-00001234"
      }
    }
  }
}
```

Gateway, JSON Schema Validation ile alanları (örneğin referans numarası uzunluğu) doğrular; geçerli istek SOAP operasyonuna dönüştürülür. Yanıt XML ağacından yalnızca `ad` ve `soyad` alanları istemciye JSON olarak döner; backend boş veya anlamsız bir yanıt verdiğinde response script ile uygun HTTP durum kodu ve sadeleştirilmiş gövde üretilir — tutorial’daki JsonSlurper örneğiyle aynı mantık.

Backend ekibi aynı yıl WSDL’e yeni bir operasyon eklediğinde, mobil uygulama sürümü beklemeden gateway tarafında **Yeniden Ayrıştır** ile yeni operasyon proxy’ye alınır; routing URL’si bilerek aynı bırakılır.

## Güvenlik

REST-to-SOAP dönüşümü **tek başına güvenlik sağlamaz**. Apinizer’da kimlik doğrulama, yetkilendirme, mesaj imzalama, IP kısıtlama, şema/doğrulama ve trafik politikaları **proxy veya politika zincirinde ayrı** yapılandırılır.

Pratikte:

- JSON Schema Validation, hatalı veya eksik isteklerin backend SOAP katmanına ulaşmadan reddedilmesine yardımcı olur; bu, uygulama güvenliğinin yerine geçmez.
- SOAP tarafında WS-Security, mTLS veya kurum içi header kuralları routing ve ilgili politikalarla tanımlanmalıdır.
- Test ve üretim WSDL/reparse kaynakları karıştırılmamalı; reparse sırasında servis adresinin otomatik değişmemesi üretim yanlış yönlendirmelerini önler, ancak doğru ortam URL’sinin bilinçli yönetimi sizin sorumluluğunuzdadır.
- Response script ile dönen alanları kıstıklamak veri minimizasyonuna katkı sağlar; hassas alanların log/trace’e düşmemesi için log politikaları ayrıca gözden geçirilmelidir.

Güvenlik gereksinimlerini “REST yüzeyi açtık, bitti” diye daraltmayın; gateway katmanında hangi politikanın hangi akışta (request/response/error) devreye girdiğini dokümante edin.

## Sonuç + CTA

REST’ten SOAP’a geçiş tek bir “dönüştürücü” kararı değil, **erişim katmanını REST/JSON’a taşırken backend sözleşmesini SOAP/WSDL’de tutma** stratejisidir. Ne zaman mantıklı? Backend kısa vadede değişmeyecek, istemci çeşitliliği artacak ve entegrasyon ekibi sözleşmeyi gateway’de yönetebilecekse.

Apinizer tarafında WSDL’i sağlam şekilde içeri almak, REST-to-SOAP proxy tanımlamak, JSON doğrulamak ve gerektiğinde yanıtı sadeleştirmek için aşağıdaki dokümanlarla devam edebilirsiniz:

- [Çoklu Schema Port WSDL — WSDL/XSD yükleme, çoklu port, reparse](/tr/develop/api-proxy-olusturma/coklu-schema-port-wsdl)
- [JSON Schema Validation — REST-to-SOAP API Proxy senaryosu](/tr/tutorials/api-proxy-senaryolari/json-schema-validation-rest-to-soap)
- [JsonSlurper ile Rest2Soap yanıt işleme (Groovy)](/tr/tutorials/nasil-yapilir-kilavuzlari/develop-kilavuzlari/groovy-kullanimi/jsonslurper-rest2soap-yanit-isleme)

İlk proxy’nizi oluşturduktan sonra test konsolu ve deploy adımlarını ürün dokümantasyonundaki ilgili geliştirme bölümlerinden tamamlayın; bu taslak yalnızca REST/SOAP köprüsünün “neden ve nasıl” çerçevesini verir.
