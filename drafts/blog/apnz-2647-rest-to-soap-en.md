# REST to SOAP: Why and when?

> **Draft — APNZ-2647.** Not product documentation; editorial review required before publication.

In enterprise integration, client teams often standardize on REST and JSON, while backends still expose SOAP endpoints defined by WSDL. This post outlines why a bridge is needed, when it makes sense, and how Apinizer documentation describes the flow.

## Short definition

**REST-to-SOAP** (Rest2Soap API Proxy type in Apinizer) means the gateway exposes a REST/JSON contract to clients while converting requests to SOAP/XML for the backend and mapping responses back to the client format. The source contract is usually defined from **WSDL** (and related **XSD** schemas) when the API Proxy is created; clients use REST endpoints and JSON bodies.

This pattern appears when you want to open new channels (mobile, B2B partners, microservices) without migrating the backend from SOAP overnight. The goal may be to **modernize the access layer**, not to “eliminate SOAP”; backend lifecycle remains a separate decision.

## Typical challenges

Practical topics that recur in documentation and integration work—without claiming SOAP is inherently unsafe or inferior:

- **WSDL and XSD access:** A WSDL may be served over HTTPS while internal references still point to HTTP, causing resolution errors. When the definition cannot be fixed at source, **file upload** (WSDL plus XSD files in a flat ZIP) is the documented path. Details: [Multiple Schema Port WSDL](/en/develop/api-proxy-creation/multiple-schema-port-wsdl).

- **Multiple ports and schemas:** One WSDL can contain several ports or schemas; Apinizer uses the first port by default. Other ports may require a trimmed WSDL and a separate API Proxy per port.

- **Contract updates:** When backend WSDL changes (new operations, schema revisions), **Reparse** can update the existing proxy instead of rebuilding from scratch; remember that the routing service URL is not changed automatically.

- **JSON ↔ XML mapping:** Clients send JSON; the gateway builds SOAP envelopes and XML that match WSDL/XSD rules. Field names, namespaces, and required elements must align. Request-side schema validation policies can catch mismatches early.

- **Response shaping:** SOAP responses can be large XML trees; returning only a subset (for example first and last name) may need extra transformation or scripting.

These points do not mean SOAP is “always bad”; they mean you must **manage protocol and contract layers deliberately**.

## Flow in Apinizer

The documented path typically includes:

1. **Bring the SOAP definition into Apinizer**  
   Create a SOAP or REST-to-SOAP proxy from a WSDL URL or a ZIP of WSDL and XSD files. Multi-port, XSD references, and reparse: [Multiple Schema Port WSDL](/en/develop/api-proxy-creation/multiple-schema-port-wsdl).

2. **Clarify the client contract in REST/JSON**  
   **JSON Schema Validation** can verify request bodies. Step-by-step on a REST-to-SOAP proxy: [JSON Schema Validation — REST-to-SOAP](/en/tutorials/api-proxy-scenarios/json-schema-validation-rest-to-soap).

3. **Request/response transformation and backend call**  
   The gateway converts JSON to SOAP per Rest2Soap rules, calls the backend, and maps the response back. Routing and SOAP action/namespace correction are part of proxy configuration (see HTTP routing and SOAP proxy creation docs in the product tree).

4. **Process the response (optional)**  
   To simplify the payload to clients or return a meaningful HTTP status when the backend body is empty, use a Groovy script on the response flow. Example: [JsonSlurper Rest2Soap response processing](/en/tutorials/how-to-guides/developer-guides/groovy-usage/jsonslurper-rest2soap-response-processing).

5. **Lifecycle**  
   When WSDL changes, the reparse wizard compares operations; you choose whether to refresh XSD definitions and options such as WS-Addressing. Keeping the production routing URL unchanged is an intentional operational safeguard.

In short: **WSDL → REST surface → (validation) → JSON↔SOAP conversion → (optional response shaping)**.

## Example scenario

*Fictional names; not references to real organizations or products.*

The **NovaPay Mobile** team does not want to call the **Central Address and Identity Verification Service (CAIVS)** SOAP API directly: the mobile client only speaks HTTPS and JSON. The CAIVS WSDL imports multiple XSDs, and XSD URLs are unreachable in the test environment.

The integration team uploads a ZIP with WSDL and XSDs at the same directory level, creates a REST-to-SOAP proxy, and exposes `POST /v1/identity-query`. The client sends JSON such as:

```json
{
  "Sorgula": {
    "kriterListesi": {
      "SampleIdentityQueryCriteria": {
        "DogumAy": 3,
        "DogumGun": 15,
        "DogumYil": 1985,
        "ReferansNo": "REF-00001234"
      }
    }
  }
}
```

The gateway validates fields (for example reference number length) with JSON Schema Validation, then transforms a valid request into the SOAP operation. Only `ad` and `soyad` fields are returned to the client as JSON; if the backend returns an empty or unusable payload, a response script sets an appropriate HTTP status and body—same idea as the JsonSlurper tutorial.

When the backend team adds a new operation to the WSDL, the gateway team applies **Reparse** without waiting for a mobile release; the routing URL stays unchanged on purpose.

## Security

REST-to-SOAP transformation **does not provide security by itself**. In Apinizer, authentication, authorization, message signing, IP restrictions, schema validation, and traffic policies are **configured separately** on the proxy or policy chain.

In practice:

- JSON Schema Validation helps reject malformed requests before they hit the SOAP backend; it is not a substitute for application security.
- WS-Security, mTLS, or internal header rules on the SOAP side must be defined via routing and the relevant policies.
- Do not mix test and production WSDL/reparse sources; reparse not auto-updating the service URL prevents accidental production misrouting, but correct environment URLs remain your responsibility.
- Trimming fields in a response script supports data minimization; review log and trace policies so sensitive data does not leak.

Do not treat “we exposed REST” as the end of security; document which policy runs on which flow (request/response/error).

## Conclusion + CTA

Moving from REST to SOAP—in the integration sense—is not a single converter switch but a strategy to **keep the backend on SOAP/WSDL while modernizing the access layer to REST/JSON**. It makes sense when the backend will not change soon, client diversity is growing, and your team can govern the contract at the gateway.

To import WSDL reliably, define a REST-to-SOAP proxy, validate JSON, and shape responses in Apinizer, continue with:

- [Multiple Schema Port WSDL — upload, multi-port, reparse](/en/develop/api-proxy-creation/multiple-schema-port-wsdl)
- [JSON Schema Validation — REST-to-SOAP scenario](/en/tutorials/api-proxy-scenarios/json-schema-validation-rest-to-soap)
- [JsonSlurper Rest2Soap response processing (Groovy)](/en/tutorials/how-to-guides/developer-guides/groovy-usage/jsonslurper-rest2soap-response-processing)

After creating your first proxy, complete test console and deploy steps from the relevant development sections in the product docs; this draft only frames the “why and how” of the REST/SOAP bridge.
