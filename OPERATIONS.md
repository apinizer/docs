# Apinizer Docs — Sistem Dokümantasyonu

**Canlı:** https://docs.apinizer.com
**Repo:** https://github.com/apinizer/docs
**Stack:** Docusaurus 3.10 + TypeScript + Cloudflare Pages

Bu dosya, dokümantasyon sitesinin **şu anki canlı mimarisini, operasyonel akışını ve günlük bakım komutlarını** anlatır.

---

## 1. Genel Mimari

```
   ┌────────────────────────────────────────────────────────────┐
   │  Geliştirici  →  git push                                  │
   └────────────────────────────────────────────────────────────┘
                            │
                            ▼
   ┌────────────────────────────────────────────────────────────┐
   │  GitHub (apinizer/docs)                                    │
   │  - main      → production                                  │
   │  - PR branch → preview                                     │
   └────────────────────────────────────────────────────────────┘
                            │ webhook
                            ▼
   ┌────────────────────────────────────────────────────────────┐
   │  Cloudflare Pages (project: docs, host: docs-ce5.pages.dev)│
   │  Git integration build:                                    │
   │    • npm ci                                                │
   │    • npm run build                                         │
   │       (docusaurus build + scripts/trim-search-index.mjs)  │
   │  Output: build/ → uploaded                                 │
   └────────────────────────────────────────────────────────────┘
                            │
                            ▼
   ┌────────────────────────────────────────────────────────────┐
   │  Cloudflare Edge (proxy + SSL)                             │
   │    docs.apinizer.com    →  son production deployment       │
   │    <hash>.docs-ce5.pages.dev →  o spesifik deploy          │
   │    <branch>.docs-ce5.pages.dev → branch'in son preview'u   │
   └────────────────────────────────────────────────────────────┘
                            │
                            ▼
   ┌────────────────────────────────────────────────────────────┐
   │  Son kullanıcı                                              │
   └────────────────────────────────────────────────────────────┘
```

Cloudflare Pages Git integration ile bağlı: GitHub'a push → Pages otomatik build çalıştırır. `.github/workflows/deploy.yml` aynı işi yapan wrangler-tabanlı bir alternatif olarak tutuluyor (Git integration kapanırsa veya manuel deploy gerekirse).

---

## 2. URL'ler

| URL | Ne |
|---|---|
| https://docs.apinizer.com | Canlı production (main branch'in son deploy'u) |
| https://docs.apinizer.com/tr/ | Türkçe içerik |
| https://docs.apinizer.com/en/ | İngilizce içerik |
| https://docs.apinizer.com/api-reference/ | API Reference (paylaşılan) |
| `https://<hash>.docs-ce5.pages.dev` | Belirli bir deploy (Cloudflare dashboard'dan) |
| `https://docs-ce5.pages.dev` | Production deploy (custom domain'in arkasındaki) |

> **Not:** `*.pages.dev` URL'leri Türkiye'deki bazı ISP'lerde DNS hijacking nedeniyle erişilemiyor. Custom domain (`docs.apinizer.com`) Cloudflare proxy üzerinden geçtiği için bu sorundan etkilenmez. Test/preview için yurtdışı VPN veya Cloudflare WARP gerekebilir.

---

## 3. Repo Yapısı

```
apinizer-docs-mintlify/docs/
├── tr/                       # Türkçe içerik (docs plugin instance: tr)
│   ├── index.mdx             #   /tr ana sayfası
│   ├── quickstart.mdx
│   ├── concepts/             #   Kavramlar
│   ├── develop/              #   Geliştirici tarafı
│   ├── admin/                #   System admin
│   ├── api-portal/
│   ├── analytic/
│   ├── installation/
│   ├── operations/
│   ├── release-notes/
│   ├── setup/
│   └── tutorials/
├── en/                       # İngilizce içerik (docs plugin instance: en)
│   └── (aynı yapı + index.mdx)
├── api-reference/            # Paylaşılan API ref (docs plugin instance: apiReference)
│   ├── api-proxies/, policies/, projects/, ...
│   └── getting-started/
├── static/
│   ├── img/                  # Logo + favicon (referans: /img/...)
│   └── images/               # MDX içeriği için (referans: /images/...)
├── src/
│   ├── clientModules/
│   │   └── pathnameWatcher.ts # <body data-pathname> setter (locale-aware navbar)
│   ├── components/
│   │   ├── Card.tsx           # Card + CardGroup (Lucide icon resolver dahil)
│   │   ├── Steps.tsx          # Steps + Step
│   │   ├── Frame.tsx          # Frame (caption'lı image wrapper)
│   │   ├── Accordion.tsx      # Accordion + AccordionGroup
│   │   └── ParamField.tsx     # ParamField + ResponseField
│   └── css/
│       └── custom.css        # Tüm UI tweakleri (navbar, sidebar, headings, tablo)
├── scripts/
│   └── trim-search-index.mjs # Cloudflare 25 MB asset limit'i için post-build
├── sidebars-tr.ts            # TR navigasyon (her tab = bir sidebar key)
├── sidebars-en.ts            # EN navigasyon
├── sidebars-api-reference.ts # API Ref navigasyon
├── docusaurus.config.ts      # Tek config (multi-instance docs, plugins, theme)
├── package.json
├── tsconfig.json
├── openapi.yaml              # API spec kaynak dosya
├── .github/workflows/deploy.yml  # Yedek deploy workflow
└── .claude/                  # Claude Code rehberi (CLAUDE.md + commands/)
```

---

## 4. Multi-Instance Docs Mimarisi

URL'lerin (`/tr/...`, `/en/...`, `/api-reference/...`) ayrı kalması için **üç ayrı `@docusaurus/plugin-content-docs` instance** kullanılıyor:

```ts
// docusaurus.config.ts (plugins[])
[
  '@docusaurus/plugin-content-docs',
  { id: 'tr',           path: 'tr',            routeBasePath: 'tr',            sidebarPath: './sidebars-tr.ts' },
],
[
  '@docusaurus/plugin-content-docs',
  { id: 'en',           path: 'en',            routeBasePath: 'en',            sidebarPath: './sidebars-en.ts' },
],
[
  '@docusaurus/plugin-content-docs',
  { id: 'apiReference', path: 'api-reference', routeBasePath: 'api-reference', sidebarPath: './sidebars-api-reference.ts' },
],
```

Her instance'ın **bağımsız sidebar yapısı** var. Navbar item her birinin spesifik bir tab'ine `docsPluginId` ile bağlanır:

```ts
{ type: 'docSidebar', sidebarId: 'overview', docsPluginId: 'en', label: 'Overview', position: 'left', className: 'navbar__item--en' }
```

**Locale-aware navbar:**
1. `src/clientModules/pathnameWatcher.ts` her route değişikliğinde `<body data-pathname="...">` set ediyor
2. `src/css/custom.css` `body[data-pathname^="/en"]` selector'ı ile EN tab'lerini gösteriyor, TR tab'lerini gizliyor (TR varsayılan)
3. Locale dropdown da aynı mekanizmayla "Türkçe" veya "English" trigger label'ı gösteriyor

### Yeni dil eklemek
1. Klasör oluştur: `de/`
2. `docusaurus.config.ts`'e 4. plugin instance ekle: `id: 'de'`, `path: 'de'`, `routeBasePath: 'de'`
3. `sidebars-de.ts` oluştur (her tab için bir key)
4. Navbar items'a tab'leri `docsPluginId: 'de'` + `className: 'navbar__item--de'` ile ekle
5. CSS'te yeni locale rules ekle (`body[data-pathname^="/de"] ...`)
6. Locale dropdown'a yeni satır ekle
7. `search-local` `docsRouteBasePath` ve `searchContextByPaths`'a `/de` ekle

---

## 5. Build Pipeline

`npm run build` zinciri:

```
docusaurus build              # MDX → HTML, /tr, /en, /api-reference
                              # search-index dosyalarını üret (3 shard + global)
node scripts/trim-search-index.mjs   # search-index içindeki preview text'leri
                                     # 200 karaktere kısalt → her shard <25 MB
```

**`scripts/trim-search-index.mjs` ne yapıyor:**
- `@easyops-cn/docusaurus-search-local` her doc için Lunr index + preview snippet (`p`, `s`, `t`, `b` alanları) yazıyor.
- Preview snippet'leri 200 char'a indiriliyor; Lunr index'i (asıl arama gücü) dokunulmuyor.
- Sonuç: TR shard 26 MB → 22.2 MB; EN 24.6 MB → 21.2 MB; tüm dosyalar 25 MB altında.
- **Hard guard:** Herhangi bir shard hâlâ 25 MB üstünde ise `process.exit(1)` ile build başarısız olur, Cloudflare'e gitmeden hata yakalanır.

**Build çıktısı:** `build/` (gitignore'da, Cloudflare upload ediyor).

---

## 6. Deploy Pipeline

### Otomatik akış (Cloudflare Pages Git integration)
- Cloudflare Pages webhook'u GitHub'a kayıtlı.
- **`main` branch'e push** → production deployment → `docs.apinizer.com` güncellenir.
- **Diğer branch'lere push** → preview deployment (sadece deploy URL'i ile erişilebilir).
- **PR açıldığında** → preview deploy + PR sayfasında check linki.

### Cloudflare Pages konfigürasyonu
Dashboard'da değiştirilebilir → https://dash.cloudflare.com/2a5727daad33e5729c153ded00b0f9be/pages/view/docs/settings/builds-deployments

| Alan | Değer |
|---|---|
| Production branch | `main` |
| Build command | `npm run build` |
| Build output | `build` |
| Root directory | `/` |
| Node version | `20` |

### Custom domain (`docs.apinizer.com`)
- Cloudflare Pages > docs > Custom domains'da bağlı.
- `apinizer.com` zone'u Cloudflare'de olduğu için CNAME (`docs → docs-ce5.pages.dev`, proxied) otomatik kuruldu.
- SSL: Cloudflare Universal SSL — otomatik yenilenir.

### Yedek workflow (`.github/workflows/deploy.yml`)
```yaml
- uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: pages deploy build --project-name=docs --branch=${{ github.head_ref || github.ref_name }}
```

GitHub Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

### Rollback
Cloudflare dashboard → Pages > docs > Deployments → eski bir deployment > **"Rollback to this deployment"**. DNS değişmiyor, sadece edge cache yeni deployment'a yönlendiriliyor. ~10 saniye.

---

## 7. İçerik Yönetimi

### Yeni sayfa eklemek (TR örneği)
1. `tr/<klasor>/<dosya>.mdx` oluştur:
   ```mdx
   ---
   title: "Sayfa Başlığı"
   description: "1-2 cümle SEO açıklaması"
   ---

   # İçerik
   ```
2. `sidebars-tr.ts` içinde uygun tab + grup altına ekle (locale-prefix yok, örn `"concepts/yeni-sayfa"`).
3. `npm run build` ile test et.
4. Commit + PR.

### Custom React Component'ler
| Tag | Dosya | Açıklama |
|---|---|---|
| `<Card>`, `<CardGroup>` | `src/components/Card.tsx` | Lucide icon prop'u + grid layout |
| `<Steps>`, `<Step>` | `src/components/Steps.tsx` | Numaralı adım listesi |
| `<Frame>` | `src/components/Frame.tsx` | Caption'lı image wrapper |
| `<Accordion>`, `<AccordionGroup>` | `src/components/Accordion.tsx` | Collapsible details |
| `<ParamField>`, `<ResponseField>` | `src/components/ParamField.tsx` | API parametre/response kartları |

Component kullanan MDX dosyasının başına ilgili import eklenmeli:
```mdx
import {Card, CardGroup} from '@site/src/components/Card';
import {Steps, Step} from '@site/src/components/Steps';
import {Accordion} from '@site/src/components/Accordion';
```

**Card icon resolver** (`Card.tsx`):
- `icon="shield"` → `<Shield />` (Lucide, kebab→PascalCase)
- `icon="wand-magic-sparkles"` → `<Sparkles />` (alias map)
- Tanınmayan icon → silent drop

### Admonition kullanımı
```mdx
:::note
Bilgi notu
:::

:::tip
İpucu
:::

:::info[Başlık]
Başlıklı bilgi
:::

:::warning
Uyarı
:::

:::danger
Tehlikeli durum
:::
```

### Görseller
- MDX içinde: `![alt](/images/foo.png)` (URL root-relative)
- Dosya yeri: `static/images/foo.png`
- Logo + favicon: `static/img/`

### MDX'te `{ident}` karakteri
MDX `{variable}` ifadelerini JSX expression olarak parse eder. Düz metinde `{token}` gibi placeholder yazmak istiyorsan:
- `\{token\}` olarak escape et, veya
- Backtick ile inline code yap: `` `{token}` ``

---

## 8. Search

**Plugin:** `@easyops-cn/docusaurus-search-local` v0.55 (offline, build'de oluşturuluyor)

**Konfigürasyon** (`docusaurus.config.ts`):
```ts
{
  language: ['en'],
  docsRouteBasePath: ['/tr', '/en', '/api-reference'],
  searchContextByPaths: ['tr', 'en', 'api-reference'],
  useAllContextsWithNoSearchContext: false,
  removeDefaultStopWordFilter: true,
  removeDefaultStemmer: true,
  docsPluginIdForPreferredVersion: 'tr',
}
```

İndex dosyaları (`build/search-index-tr.json`, `search-index-en.json`, `search-index-api-reference.json`) build sırasında oluşturulur ve `trim-search-index.mjs` ile 25 MB altına indirilir.

### Search çalışmıyorsa
1. `build/search-index-*.json` dosyalarının var olduğunu kontrol et.
2. Trim script çıktısında "Total: ... → ..." göründü mü?
3. Tarayıcı console'da search request'lerini izle — 404 veriyorsa dosya upload olmadı.

---

## 9. Sidebar Yönetimi

**Üç sidebar dosyası, her biri TypeScript:**
- `sidebars-tr.ts` — TR navbar tab'leri için sidebar'lar
- `sidebars-en.ts` — EN navbar tab'leri için sidebar'lar
- `sidebars-api-reference.ts` — paylaşılan API ref tab'i için sidebar

**Yapı:**
```ts
const sidebars: SidebarsConfig = {
  "genel-bakis": [                       // Her key = bir navbar tab
    {
      type: 'category',
      label: 'Başlangıç',
      collapsed: false,                   // Top-level collapsed: false (default açık)
      collapsible: true,
      items: ['index', 'quickstart']      // doc IDs (locale prefix YOK)
    },
    { type: 'category', label: 'Apinizer'ı Anlamak', collapsed: false, items: [...] },
  ],
  "surumler": [...],
}
```

**Üst seviye (depth-0) kategoriler `collapsed: false`** — sayfa açılışında açık gelir, alt kategoriler `collapsed: true` (kapalı).

CSS'te top-level kategori başlıkları **bold + 0.91rem** (`.theme-doc-sidebar-menu > .menu__list-item > ...`); alt itemler **0.825rem regular**.

---

## 10. UI Tasarım Değerleri (`src/css/custom.css`)

| Öğe | Değer |
|---|---|
| Brand renk | `#3F51B5` (Indigo 500) |
| Navbar font | 0.825rem, weight 500 |
| Navbar yükseklik | 56px |
| Sidebar font (alt) | 0.825rem |
| Sidebar bold üst başlık | 0.91rem |
| H1 | 1.4rem |
| H2 | 1.12rem |
| H3 | 0.91rem |
| H4 / H5 / H6 | 0.77 / 0.67 / 0.6rem |
| Body text | 0.9rem (paragraf, list) |
| Tablo font | 0.78rem |
| Tab başlıkları (content) | 0.88rem bold |
| Search input | 0.77rem, 240px width |
| Locale dropdown | 0.74rem |
| Theme toggle icon | 19px |

Navbar sağ sırası flex `order` ile: `search → theme toggle → locale dropdown → Web Sitesi → Login`.

---

## 11. Operasyonel Komutlar

```bash
# Lokal geliştirme
npm install                    # Bir kez
npm run start                  # TR dev server (port 3000)
npm run start:en               # EN dev server
npm run typecheck              # TS validation
npm run build                  # Production build (build/ + trim search)
npm run serve                  # Build'i lokalde serve et
npm run clear                  # .docusaurus cache temizle (sorun çıkarsa)
```

---

## 12. Erişim ve Hesaplar

| Servis | Lokasyon |
|---|---|
| GitHub repo | https://github.com/apinizer/docs |
| Cloudflare Pages projesi | https://dash.cloudflare.com/2a5727daad33e5729c153ded00b0f9be/pages/view/docs |
| Cloudflare DNS (apinizer.com) | Aynı account |
| Cloudflare Account ID | `2a5727daad33e5729c153ded00b0f9be` |
| GitHub Secrets | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |

---

## 13. Sık Karşılaşılan Sorunlar ve Çözümler

| Belirti | Sebep | Çözüm |
|---|---|---|
| Build'de `MDX compilation failed` + `Expected component X` | Custom component import edilmemiş | Dosyaya `import {X} from '@site/src/components/...'` ekle |
| Build'de `ReferenceError: <name> is not defined` (render aşaması) | Markdown'da `{name}` JSX expression olarak parse edildi | `\{name\}` olarak escape et veya inline code (backtick) içine al |
| Build'de `Expected a closing tag for <details>` | List item içinde nested `<details>` (HTML) | `<Accordion>` (JSX) kullan |
| Cloudflare deploy `25 MB exceeded` | search-index shard'ı büyüdü | `scripts/trim-search-index.mjs` çalıştığından emin ol; gerekirse `MAX_PREVIEW` düşür |
| `pages.dev` URL'i TR'den açılmıyor | TR ISP DNS hijacking | `docs.apinizer.com` üzerinden test et; ya da Cloudflare WARP / yurtdışı VPN |
| Top-level kategori kapalı geliyor | `collapsed: true` olarak yazılmış | `sidebars-*.ts` içinde top-level kategori için `collapsed: false` yap |
| EN locale dropdown'da caret kayık | CSS `display` override sorunu | `body[data-pathname^="/en"] .navbar__locale--en { display: revert; }` |

---

## 14. Hızlı Referans

**Claude rehberi:** `.claude/CLAUDE.md`
**Slash komutlar:** `.claude/commands/new-page.md`, `.claude/commands/fix-build.md`

**Karar matrisi:**
- *Yeni sayfa nereye?* → `tr/` veya `en/` altına; `api-reference/` sadece API endpoint dokümanları için.
- *Sayfa için ayrı bir kategori mi açayım yoksa mevcut bir gruba mı eklesem?* → Aynı temada ≥3 sayfa varsa kategori; aksi halde mevcut gruba.
- *Build kırıldı, ne yaparım?* → `.claude/commands/fix-build.md`'ye bak veya `/fix-build` slash komutu çalıştır.
- *Acil rollback?* → Cloudflare dashboard > Deployments > eski deploy > "Rollback to this deployment".

---

_Bu dosya canlı dokümandır. Mimari değişikliklerinde güncellenmelidir._
