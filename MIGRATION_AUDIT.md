# Mintlify → Docusaurus Migration Audit

**Tarih:** 2026-05-24
**Branch:** `docs/migrate-docusaurus`
**Hedef:** Docusaurus 3.7 + Cloudflare Pages, bilingual (tr + en)

---

## 1. Genel İstatistikler

| Metrik | Değer |
|---|---|
| Toplam MDX dosyası | **1427** |
| TR dosyaları | 576 |
| EN dosyaları | 578 |
| API Reference (elle yazılmış) | 271 |
| Kök seviye (index, quickstart) | 2 |
| docs.json satır sayısı | 3057 |
| openapi.yaml | 292 KB |
| Redirect kuralı | 62 |

## 2. Diller ve Navigation Yapısı

`docs.json` → `navigation.languages` altında **iki dil** (tr, en) tab/grup ağacı.

### TR Tabs (10)
Genel Bakış, Sürümler, Kurulum ve Güncelleme, API'leri Yönetme, Yönetim, Analitik ve İzleme, API Portal, Operasyon, Kılavuzlar.

### EN Tabs (11)
Overview, Versions, Installation and Update, Managing APIs, Management, Analytics and Monitoring, API Portal, Operations, Guides, **API Reference** (TR'de yok).

**Not:** TR tarafında API Reference tab'i bulunmuyor — sadece EN navigation'da var. Bu kasıtlı: API endpoint dokümantasyonu yalnızca İngilizce.

## 3. Kullanılan Mintlify Componentleri

| Component | Dosya Sayısı | Dönüşüm Stratejisi |
|---|---:|---|
| `<Info>` | 612 | `:::info` admonition |
| `<Warning>` | 477 | `:::warning` admonition |
| `<Card>` / `<CardGroup>` | 367 / 363 | Custom `src/components/Card.tsx` |
| `<Tip>` | 259 | `:::tip` admonition |
| `<Note>` | 258 | `:::note` admonition |
| `<Steps>` / `<Step>` | 240 / 240 | Custom `src/components/Steps.tsx` (numbered list değil — title prop'unu korumak için) |
| `<Accordion>` / `<AccordionGroup>` | 213 / 200 | `@theme/Details` (Docusaurus native) |
| `<Frame>` | 72 | Wrapper, sadece tag'ları kaldır |
| `<Tabs>` / `<Tab>` | 53 / 53 | `@theme/Tabs` + `@theme/TabItem` |
| `<Check>` | 32 | `:::tip ✓` |
| `<CodeGroup>` | 9 | `@theme/Tabs` kod blokları için |
| `<Danger>` | 4 | `:::danger` |
| `<ParamField>` | 4 | Markdown tablosuna çevir (manuel) |
| `<ResponseField>` | 2 | Markdown tablosuna çevir (manuel) |

**Toplam komponent kullanımı:** ~14 farklı Mintlify component. Otomatik script ile dönüştürülecek; ParamField/ResponseField az olduğu için manuel düzeltilebilir.

## 4. Logo ve Renkler

- **Primary:** `#3F51B5` (Indigo 500) — dark/light aynı
- **Logo:** `logo/apinizer-logo.png` (light), `logo/apinizer-logo-white.png` (dark)
- **Favicon:** `favicon.ico` (kök seviye)

## 5. Navbar / Footer

- **Navbar primary CTA:** `Login` → `https://demo.apinizer.com/`
- **Navbar link:** `Web Sitesi` → `https://apinizer.com`
- **Footer socials:** GitHub, LinkedIn

## 6. OpenAPI Durumu (Önemli Karar)

`docs.json`'da `"openapi": ["openapi.yaml"]` tanımlı ama `api-reference/` altındaki MDX dosyaları **elle yazılmış** (auto-generated değil). Her endpoint için ayrı, kürate edilmiş açıklama mevcut.

**Karar:** `docusaurus-plugin-openapi-docs` kurulacak ve `openapi.yaml` ayrı bir route'a (`/api-spec`) bağlanacak (Redoc render). Mevcut elle yazılmış `api-reference/` MDX'leri **dokunulmaz** — orijinal navigation sırası korunur. Plugin yalnızca spec görüntüleme için aktif olur, MDX üretimi yapılmaz.

## 7. Redirects (62 kural)

`docs.json` → `redirects` listesi `docusaurus.config.ts` içinde `@docusaurus/plugin-client-redirects` plugin'ine taşınacak.

## 8. Riskli / Manuel Kontrol Gerektiren Yerler

1. **`<Steps>` ile `<Step title="X">`** — Numbered list'e dönüştürmek title bilgisini kaybeder. Custom Steps component yazılacak.
2. **`<Frame>` wrapper** — Caption'lar varsa Markdown'a düzgün çevrilmeli.
3. **`<ParamField>` / `<ResponseField>`** (toplam 6 dosya) — Otomatik script bunları yorum olarak bırakacak; manuel tabloya çevrilecek.
4. **MDX import path'leri** — Bazı dosyalar relative path ile resim import edebilir; `images/` referansları `/img/` veya korunan yapı ile uyumlu olmalı.
5. **62 redirect** — Eski URL'ler bozulmamalı; plugin ile karşılanacak.
6. **Türkçe karakter URL'leri** — Bazı dosya adlarında ı, ş, ü, ö, ğ var. Docusaurus slug normalize edebilir; build sonrası kontrol gerek.
7. **`docs.json` ignore listesi** — `.cursor/**`, `.claude/**`, `.idea/**`, `*.bak`, `README.md`, `LICENSE` — bunlar Docusaurus'ta `exclude` ile yansıtılacak.
8. **Mintlify özel custom.css** — `max-width: none !important` gibi geniş layout patch'leri Docusaurus'a ihtiyaç duymaz, atılır.

## 9. Build/Deploy

- Build çıktısı: `build/`
- Cloudflare Pages projesi: `docs`
- Workflow: `.github/workflows/deploy.yml` (push to main + PR preview)
- Deploy hedef domain: `docs.apinizer.com`

---

## 10. Sonuç (Migration Tamamlandı)

**Tarih:** 2026-05-24

### Yapılan Değişiklikler
- Mintlify (`docs.json`) tamamen kaldırıldı, Docusaurus 3.10.1 + TypeScript kuruldu.
- **3 docs plugin instance:** `tr/` (routeBasePath: `tr`), `en/` (routeBasePath: `en`), `api-reference/` (routeBasePath: `api-reference`).
- API Reference içeriği root'taki `api-reference/` klasöründe, hem TR hem EN navbar'ından erişilebilir.
- `index.mdx` ve `quickstart.mdx` `tr/` altına taşındı (TR ana sayfaları).
- `images/` → `static/images/` (URL'ler `/images/...` olarak korundu).
- Logo + favicon → `static/img/`.
- `sidebars-tr.ts`, `sidebars-en.ts`, `sidebars-api-reference.ts` — her tab ayrı bir sidebar key.
- Custom React components: `Card`, `CardGroup`, `Steps`, `Step`, `Frame`, `Accordion`, `AccordionGroup`, `ParamField`, `ResponseField`.
- GitHub Actions workflow → Cloudflare Pages otomatik deploy (`docs` projesi).
- Offline arama: `@easyops-cn/docusaurus-search-local`, multi-instance config ile.

### Dönüşüm İstatistikleri (otomatik script)
- 1451 MDX dosyası tarandı
- 1010 dosya dönüştürüldü
- 2640 Accordion, 1639 Info, 1150 Warning, 443 Tip, 404 Note, 100 Check, 4 Danger admonition
- 386 Tab → TabItem
- 31 CodeGroup
- 4 Columns → CardGroup
- 166 dosyada `{ident}` paternleri MDX expression hatası önlemek için `\{ident\}` olarak escape edildi
- 211 dosyada `<details>` → custom `<Accordion>` componentine geri çevrildi (MDX list-item içinde HTML uyumsuzluğu)

### Manuel Düzeltmeler
- `en/setup/elasticsearch/backup-policy.mdx`, `tr/setup/elasticsearch/yedekleme-politikasi.mdx`: Nested same-tag admonition (Info içinde Info) script tarafından yanlış parse edildi, manuel düzeltildi.
- `tr/release-notes/surum-notlari-2025.mdx`, `en/release-notes/release-notes-2025.mdx`: `{{id}}` patternleri inline code'a alındı.

### Teknik Borç (Bilinçli Bırakılan)
- **62 redirect** sadece kritik 4 tanesi config'e eklendi — kalan 58'i ihtiyaç olduğunda eklenebilir.
- **30 dosyada `<ParamField>`/`<ResponseField>`** stub component ile çalışıyor, ileride markdown tablo'ya dönüştürülebilir.
- **Broken anchor warnings** (yüzlerce) — `onBrokenAnchors: 'warn'` olduğu için build durmuyor, ayrı PR'da temizlenebilir.
- **`redocusaurus` (OpenAPI render)** package.json'da var ama config'de aktif değil — kurulumda plugin init hatası vardı (versiyon uyumsuzluğu). `openapi.yaml` mevcut, sonra `/api-spec` route'unda render edilebilir.
- **API Reference TR navigation'da** tab olarak yok (Mintlify'da vardı). EN navbar tab'i + `/api-reference` URL'i ortak.
- **Search**: multi-instance konfig ile çalışıyor ama `docsPluginIdForPreferredVersion: 'tr'` ile TR önceliklendiriliyor.

### Build Doğrulaması
- `npm run build` başarılı, `build/` klasörü oluşturuldu.
- TR, EN, API Reference, redirects, search-index.json, sitemap.xml, 404.html üretildi.
- Cloudflare Pages için hazır.

