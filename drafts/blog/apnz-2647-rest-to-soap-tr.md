# SOAP Servislerini REST API Olarak Sunmak: REST to SOAP Dönüşümü

Kurumlarda istemci ekipleri REST ve JSON ile çalışırken, arka plandaki birçok servis hâlâ WSDL ile tanımlı SOAP uç noktaları sunar. Bu yazı, bu iki dünya arasında neden bir köprüye ihtiyaç duyulduğunu, ne zaman mantıklı olduğunu ve Apinizer'ın bu dönüşümü nasıl yaptığını anlatıyor.

## REST to SOAP dönüşümü nedir?

**REST to SOAP**, istemciye REST/JSON bir arayüz sunulurken arkadaki SOAP servisinin değiştirilmeden kullanılmasıdır. Gateway üç iş yapar:

1. İstemciden gelen JSON isteği, SOAP servisinin beklediği XML zarfına (envelope) çevirir.
2. SOAP isteğini backend servise iletir.
3. Gelen SOAP yanıtını, hata (fault) yanıtları dahil, JSON'a çevirip istemciye döner.

Apinizer'da bu, **Rest2Soap** tipinde bir API Proxy ile yapılır. API Proxy bir WSDL'den oluşturulur; WSDL'deki her operasyon bir REST endpoint'ine karşılık gelir.

## Neden ihtiyaç duyulur?

- **İstemci tarafında SOAP zahmetlidir.** SOAP istemcisi yazmak için WSDL'den kod üretmek, zarf yapısını ve namespace'leri doğru kurmak gerekir. Mobil ve web uygulamalarında JSON ile çalışmak çok daha yaygındır.
- **Backend'i değiştirmek her zaman mümkün değildir.** SOAP servisi başka bir ekibe veya dış kuruma ait olabilir, ya da yeniden yazılması uzun sürebilir. Erişim katmanını modernleştirmek, backend'in yaşam döngüsünden bağımsız bir karar olarak alınabilir.
- **Yeni kanallar daha hızlı açılır.** Mobil uygulama, iş ortağı veya mikroservis gibi yeni istemciler, SOAP servisinin değişmesini beklemeden REST arayüzü üzerinden bağlanabilir.
- **Güvenlik ve trafik yönetimi tek yerde toplanır.** Kimlik doğrulama, yetkilendirme, kota ve loglama, her istemcide ayrı ayrı değil, gateway'de yapılandırılır.

Bu, SOAP'ın kötü bir teknoloji olduğu anlamına gelmez. Amaç, farklı protokolleri bilinçli olarak bir arada yönetmektir.

## Apinizer dönüşümü nasıl yapıyor?

JSON ile SOAP arasında dönüşüm yapmanın yaygın bir yolu, her alan için eşleme kuralı veya XSLT yazmaktır. Bu yöntem çalışır, ancak her yeni operasyon ve her şema değişikliği yeni bir eşleme işi demektir.

Apinizer eşlemeyi doğrudan WSDL sözleşmesinden çıkarır:

1. **WSDL okunur.** API Proxy oluşturulurken WSDL ve bağlı XSD şemaları ayrıştırılır; her operasyon için, doğru namespace önekleriyle örnek bir SOAP istek şablonu hazırlanır.
2. **JSON, XML'e çevrilir.** Gelen JSON gövdesindeki alanlar aynı adlı XML elemanlarına dönüştürülür.
3. **Namespace'ler şablondan eklenir.** Her elemanın öneki, operasyonun şablonundaki aynı adlı elemandan alınır. İstemcinin namespace bilmesine gerek kalmaz.
4. **Gövde zarfa yerleştirilir.** Oluşan XML, şablondaki operasyon elemanının içine konur ve SOAP servisine gönderilir.
5. **Yanıt JSON'a çevrilir.** SOAP yanıtının ilgili bölümü alınır, namespace'ler temizlenir ve JSON'a dönüştürülür. SOAP fault yanıtları da aynı şekilde JSON'a çevrilir.

Böylece yeni bir operasyon için alan alan eşleme yazmak gerekmez. WSDL değiştiğinde **Yeniden Ayrıştır (Reparse)** ile şablonlar güncellenir.

## Örnek: JSON → SOAP → JSON

*Örnekteki servis ve alan adları hayalidir.*

Bir müşteri servisi WSDL'inde `GetCustomer` operasyonu tanımlı olsun. Mobil istemci bu operasyonu REST üzerinden şöyle çağırır:

**1. İstemcinin gönderdiği JSON:**

```http
POST /customer-api/GetCustomer
Content-Type: application/json

{
  "customerId": "CUS-1001",
  "includeOrders": true,
  "segment": null
}
```

**2. Gateway'in backend'e gönderdiği SOAP isteği:**

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:cus="http://example.com/customer">
  <soapenv:Header/>
  <soapenv:Body>
    <cus:GetCustomer>
      <cus:customerId>CUS-1001</cus:customerId>
      <cus:includeOrders>true</cus:includeOrders>
      <cus:segment xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>
    </cus:GetCustomer>
  </soapenv:Body>
</soapenv:Envelope>
```

`cus:` önekini istemci göndermedi; gateway bunu WSDL'den üretilen şablondan aldı. JSON'daki `null` değeri, ilgili seçenek açıksa `xsi:nil="true"` olarak gönderilir.

**3. Backend'in döndüğü SOAP yanıtı:**

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:cus="http://example.com/customer">
  <soapenv:Body>
    <cus:GetCustomerResponse>
      <cus:name>Ayşe Yılmaz</cus:name>
      <cus:orders>
        <cus:order><cus:id>ORD-1</cus:id></cus:order>
        <cus:order><cus:id>ORD-2</cus:id></cus:order>
      </cus:orders>
    </cus:GetCustomerResponse>
  </soapenv:Body>
</soapenv:Envelope>
```

**4. İstemciye dönen JSON:**

```json
{
  "name": "Ayşe Yılmaz",
  "orders": {
    "order": [
      { "id": "ORD-1" },
      { "id": "ORD-2" }
    ]
  }
}
```

Namespace'ler temizlenir; tekrar eden `order` elemanları JSON dizisi olur.

**5. Hata durumu:** Backend bir SOAP fault dönerse istemci yine JSON alır:

```json
{
  "Fault": {
    "faultcode": "soapenv:Client",
    "faultstring": "Customer not found"
  }
}
```

İstemcinin hiçbir aşamada XML veya namespace ile uğraşması gerekmez. JSON çıktısının tam biçimi, operasyonun dönüşüm ayarlarına (yanıtın hangi bölümünün alınacağı, null/nil seçeneği) göre değişir; yukarıdaki çıktılar açıklama amaçlıdır.

> **Yayın öncesi:** Bu örnekler bir test API Proxy'si üzerinde çalıştırılıp gerçek çıktılarla güncellenmelidir.

## Sahada karşılaşılan konular

- **WSDL ve XSD erişimi:** WSDL HTTPS üzerinden açılsa bile içindeki XSD referansları erişilemeyen adreslere işaret edebilir. Bu durumda WSDL ve XSD dosyaları aynı seviyede bir ZIP içinde yüklenebilir. Ayrıntılar: [Çoklu Schema Port WSDL](/tr/develop/api-proxy-olusturma/coklu-schema-port-wsdl).
- **Çoklu port:** Bir WSDL'de birden fazla port varsa Apinizer ilkini kullanır. Diğer portlar için WSDL'in yalnızca o portu içerecek şekilde ayrılıp ayrı bir API Proxy oluşturulması gerekir.
- **Sözleşme güncellemeleri:** Backend WSDL'i değiştiğinde (yeni operasyon, şema değişikliği) API Proxy'yi baştan kurmak yerine **Yeniden Ayrıştır** kullanılır. Bu işlem backend adresini otomatik değiştirmez.
- **İstek doğrulama:** Hatalı JSON isteklerinin SOAP servisine ulaşmadan reddedilmesi için **JSON Schema Validation** politikası kullanılabilir: [JSON Schema Validation — REST-to-SOAP](/tr/tutorials/api-proxy-senaryolari/json-schema-validation-rest-to-soap).
- **Yanıtı sadeleştirme:** SOAP yanıtı istemcinin ihtiyacından büyükse, yanıt hattında bir Groovy script ile yalnızca gerekli alanlar dönülebilir: [JsonSlurper ile Rest2Soap yanıt işleme](/tr/tutorials/nasil-yapilir-kilavuzlari/develop-kilavuzlari/groovy-kullanimi/jsonslurper-rest2soap-yanit-isleme).

## Güvenlik

Protokol dönüşümü tek başına güvenlik sağlamaz. Güvenlik ayarları API Proxy'nin politika zincirinde ayrıca yapılandırılır:

- İstemci tarafı kimlik doğrulama ve yetkilendirme, REST arayüzüne uygulanan politikalarla yapılır.
- SOAP servisinin beklediği WS-Security, mTLS veya özel başlıklar, yönlendirme ve ilgili politikalarla tanımlanır.
- Yanıttan gereksiz alanları çıkarmak veri paylaşımını azaltır. Hassas alanların loglara düşmemesi için log ayarları ayrıca gözden geçirilmelidir.
- Test ve üretim WSDL'leri karıştırılmamalıdır. Reparse backend adresini değiştirmez; doğru ortam adresinin yönetimi sizin sorumluluğunuzdadır.

## Sonuç

REST to SOAP dönüşümü, SOAP servisini değiştirmeden ona modern bir REST arayüzü kazandırır. Backend kısa vadede değişmeyecekse ve istemci çeşitliliği artıyorsa iyi bir seçenektir.

Apinizer bu dönüşümü WSDL sözleşmesini okuyarak yapar: namespace'ler ve zarf yapısı şablondan gelir, alan alan eşleme yazmak gerekmez. Başlamak için:

- [Çoklu Schema Port WSDL — WSDL/XSD yükleme, çoklu port, reparse](/tr/develop/api-proxy-olusturma/coklu-schema-port-wsdl)
- [JSON Schema Validation — REST-to-SOAP API Proxy senaryosu](/tr/tutorials/api-proxy-senaryolari/json-schema-validation-rest-to-soap)
- [JsonSlurper ile Rest2Soap yanıt işleme (Groovy)](/tr/tutorials/nasil-yapilir-kilavuzlari/develop-kilavuzlari/groovy-kullanimi/jsonslurper-rest2soap-yanit-isleme)
