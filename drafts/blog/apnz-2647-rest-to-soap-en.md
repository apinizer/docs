# Exposing SOAP Services as REST APIs: REST to SOAP Transformation

In many organizations, client teams work with REST and JSON, while many backend services still expose SOAP endpoints defined by WSDL. This post explains why a bridge between the two is needed, when it makes sense, and how Apinizer performs the transformation.

## What is REST to SOAP transformation?

**REST to SOAP** means offering clients a REST/JSON interface while the SOAP service behind it stays unchanged. The gateway does three things:

1. It converts the client's JSON request into the XML envelope the SOAP service expects.
2. It forwards the SOAP request to the backend service.
3. It converts the SOAP response, including fault responses, back to JSON for the client.

In Apinizer, this is done with an API Proxy of type **Rest2Soap**. The API Proxy is created from a WSDL; each operation in the WSDL becomes a REST endpoint.

## Why is it needed?

- **SOAP is hard on the client side.** Writing a SOAP client means generating code from the WSDL and building the envelope and namespaces correctly. Mobile and web applications work with JSON far more often.
- **Changing the backend is not always possible.** The SOAP service may belong to another team or an external organization, or rewriting it may take a long time. Modernizing the access layer can be decided independently of the backend's lifecycle.
- **New channels open faster.** New clients such as mobile apps, partners, or microservices can connect through the REST interface without waiting for the SOAP service to change.
- **Security and traffic management live in one place.** Authentication, authorization, quotas, and logging are configured on the gateway rather than in every client.

This does not mean SOAP is a bad technology. The goal is to manage different protocols side by side, on purpose.

## How does Apinizer do the transformation?

A common way to convert between JSON and SOAP is to write a mapping rule or XSLT for each field. That works, but every new operation and every schema change means more mapping work.

Apinizer derives the mapping directly from the WSDL contract:

1. **The WSDL is read.** When the API Proxy is created, the WSDL and its XSD schemas are parsed, and a sample SOAP request template with the correct namespace prefixes is prepared for each operation.
2. **JSON is converted to XML.** Fields in the incoming JSON body become XML elements with the same names.
3. **Namespaces come from the template.** Each element's prefix is taken from the element with the same name in the operation's template. The client does not need to know any namespaces.
4. **The body is placed in the envelope.** The resulting XML is placed inside the operation element of the template and sent to the SOAP service.
5. **The response is converted to JSON.** The relevant part of the SOAP response is taken, namespaces are removed, and it is converted to JSON. SOAP fault responses are converted to JSON the same way.

As a result, a new operation does not need field-by-field mapping. When the WSDL changes, **Reparse** updates the templates.

## Example: JSON → SOAP → JSON

*The service and field names in this example are fictional.*

Suppose a customer service WSDL defines a `GetCustomer` operation. A mobile client calls it over REST like this:

**1. JSON sent by the client:**

```http
POST /customer-api/GetCustomer
Content-Type: application/json

{
  "customerId": "CUS-1001",
  "includeOrders": true,
  "segment": null
}
```

**2. SOAP request the gateway sends to the backend:**

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

The client did not send the `cus:` prefix; the gateway took it from the template generated from the WSDL. A JSON `null` is sent as `xsi:nil="true"` when the related option is enabled.

**3. SOAP response returned by the backend:**

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:cus="http://example.com/customer">
  <soapenv:Body>
    <cus:GetCustomerResponse>
      <cus:name>Jane Doe</cus:name>
      <cus:orders>
        <cus:order><cus:id>ORD-1</cus:id></cus:order>
        <cus:order><cus:id>ORD-2</cus:id></cus:order>
      </cus:orders>
    </cus:GetCustomerResponse>
  </soapenv:Body>
</soapenv:Envelope>
```

**4. JSON returned to the client:**

```json
{
  "name": "Jane Doe",
  "orders": {
    "order": [
      { "id": "ORD-1" },
      { "id": "ORD-2" }
    ]
  }
}
```

Namespaces are removed; repeated `order` elements become a JSON array.

**5. Error case:** If the backend returns a SOAP fault, the client still receives JSON:

```json
{
  "Fault": {
    "faultcode": "soapenv:Client",
    "faultstring": "Customer not found"
  }
}
```

At no point does the client have to deal with XML or namespaces. The exact JSON shape depends on the operation's transformation settings (which part of the response is taken, the null/nil option); the outputs above are illustrative.

> **Before publishing:** Run these examples on a test API Proxy and update them with the real outputs.

## Common issues in practice

- **WSDL and XSD access:** Even when the WSDL is served over HTTPS, its XSD references may point to unreachable addresses. In that case, upload the WSDL and XSD files in a ZIP at the same level. Details: [Multiple Schema Port WSDL](/en/develop/api-proxy-creation/multiple-schema-port-wsdl).
- **Multiple ports:** If a WSDL has more than one port, Apinizer uses the first one. For other ports, split the WSDL so it contains only that port and create a separate API Proxy.
- **Contract updates:** When the backend WSDL changes (a new operation, a schema change), use **Reparse** instead of rebuilding the API Proxy. Reparse does not change the backend address automatically.
- **Request validation:** Use the **JSON Schema Validation** policy to reject invalid JSON requests before they reach the SOAP service: [JSON Schema Validation — REST-to-SOAP](/en/tutorials/api-proxy-scenarios/json-schema-validation-rest-to-soap).
- **Simplifying the response:** If the SOAP response is larger than the client needs, a Groovy script on the response pipeline can return only the required fields: [Processing Rest2Soap responses with JsonSlurper](/en/tutorials/how-to-guides/developer-guides/groovy-usage/jsonslurper-rest2soap-response-processing).

## Security

Protocol transformation does not provide security by itself. Security settings are configured separately in the API Proxy's policy chain:

- Client-side authentication and authorization are done with policies applied to the REST interface.
- WS-Security, mTLS, or custom headers the SOAP service expects are defined with routing and the related policies.
- Removing unneeded fields from the response reduces data exposure. Review log settings separately so sensitive fields do not end up in logs.
- Do not mix test and production WSDLs. Reparse does not change the backend address; managing the correct environment address is your responsibility.

## Conclusion

REST to SOAP transformation gives a SOAP service a modern REST interface without changing it. It is a good option when the backend will not change in the short term and the variety of clients is growing.

Apinizer performs this transformation by reading the WSDL contract: namespaces and the envelope structure come from the template, so no field-by-field mapping is needed. To get started:

- [Multiple Schema Port WSDL — WSDL/XSD upload, multiple ports, reparse](/en/develop/api-proxy-creation/multiple-schema-port-wsdl)
- [JSON Schema Validation — REST-to-SOAP API Proxy scenario](/en/tutorials/api-proxy-scenarios/json-schema-validation-rest-to-soap)
- [Processing Rest2Soap responses with JsonSlurper (Groovy)](/en/tutorials/how-to-guides/developer-guides/groovy-usage/jsonslurper-rest2soap-response-processing)
