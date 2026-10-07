#!/usr/bin/env node
/**
 * Builds src/data/hreflang-pairs.json — the TR ⇄ EN page pairs used by
 * src/theme/SiteMetadata for <link rel="alternate" hreflang> tags.
 *
 *   node scripts/gen-hreflang-pairs.mjs [--report]
 *
 * TR and EN are separate docs plugin instances without shared doc IDs, so
 * pairs are inferred structurally: sidebars-tr.ts and sidebars-en.ts are
 * walked in parallel (tab by tab, in declaration order) and two docs are
 * paired only when every level above them has the same shape — same number
 * of items and the same item kind (doc / category / link) at each position.
 * Any node whose shape differs is skipped entirely, so its pages (and their
 * descendants) self-reference only. The two home pages (/tr, /en) are paired
 * explicitly. Each permalink is checked against build/sitemap.xml when a
 * build exists.
 *
 * Output: one TR → EN map (the theme derives the reverse direction),
 *   { "/tr/x": "/en/y", ... }
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'data', 'hreflang-pairs.json');
const SITEMAP = path.join(ROOT, 'build', 'sitemap.xml');

async function loadSidebars(file) {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const {outputText} = ts.transpileModule(source, {
    compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020},
  });
  const url = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
  return (await import(url)).default;
}

function frontMatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = {};
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
    }
  }
  return fm;
}

/** Docusaurus default permalink for doc `id` of the `lang` instance. */
function permalink(lang, id) {
  const file = ['.mdx', '.md'].map((ext) => path.join(ROOT, lang, id + ext)).find((f) => fs.existsSync(f));
  if (!file) throw new Error(`${lang}: no file for doc id "${id}"`);
  const fm = frontMatter(file);
  const parts = id.split('/');
  const base = parts.pop();
  const dir = parts.join('/');
  if (fm.slug) {
    const slug = fm.slug.startsWith('/') ? fm.slug : `/${dir ? `${dir}/` : ''}${fm.slug}`;
    return `/${lang}${slug === '/' ? '' : slug}`.replace(/\/$/, '');
  }
  const collapse = base === 'index' || base === 'README' || base === parts[parts.length - 1];
  const rel = collapse ? dir : dir ? `${dir}/${base}` : base;
  return rel ? `/${lang}/${rel}` : `/${lang}`;
}

const kind = (item) => (typeof item === 'string' ? 'doc' : item.type);
const docId = (item) => (typeof item === 'string' ? item : item.id);

/*
 * Position alone is not enough: some same-length lists are ordered differently
 * in TR and EN (e.g. user-access-management, connectors). Every positional
 * candidate is therefore verified with a language-neutral similarity score —
 * shared image paths, code lines, inline-code tokens and links, plus slug/title
 * tokens after a small TR→EN glossary. Within a sidebar node of identical
 * shape, a TR doc is paired with the EN doc that is its strict best match in
 * both directions (normally the one at the same position; a reordered list is
 * still matched correctly). Docs without such a match self-reference only.
 */
const GLOSSARY = Object.fromEntries(
  `ve:and genel:general,overview bakis:overview konnektor:connector konnektoru:connector temizleme:cleanup
  olusturma:creation,create olusturucu:creator surum:version,release ayarlari:settings ayari:setting ayarlar:settings
  yonetimi:management yonetim:management,admin trafigi:traffic trafik:traffic mesaj:message mesajlari:messages
  izleme:monitoring,monitor,tracking metrikleri:metrics metrik:metrics ekleme:add,adding eklenmesi:adding,add
  notlari:notes raporu:report raporlar:reports rapor:report kullanimi:usage yonlendirme:routing zaman:time
  uygulama:application,apply,implementation uygulamalar:applications,practices destek:support entegrasyonu:integration
  entegrasyon:integration nedir:what yukseltme:upgrade kontrolu:control,check kontrol:control,check erisim:access
  erisimi:access kimlik:identity,credential,authentication proje:project istek:request,requests istekleri:requests
  bazli:based politika:policy politikasi:policy politikalar:policies yukleme:deployment,upload yedekleme:backup
  sorunlari:issues,troubleshooting,problems sorunu:issue,problem deger:value degeri:value degerleri:values
  kota:quota kotalari:quotas yapilandirma:configuration yapilandirmasi:configuration konfigurasyonu:configuration
  hata:error hatalari:errors ile:with giris:login,introduction rol:role,roles rolleri:roles veri:data urun:product
  urunu:product kayitlari:records,logs kayit:record paketi:package paketleri:packages topoloji:topology
  desteklenen:supported icerik:content icerigi:content listesi:list liste:list cagrisi:call
  donusturme:transformation,conversion,convert donusum:transformation,conversion cevirme:convert,conversion
  dogrulama:validation,verification,authentication calistirma:execution,run bilgileri:information,info
  protokoller:protocols is:job,jobs isler:jobs baglanti:connection baglantisi:connection baglantilari:connections
  baslik:header basliklari:headers yetki:permission matrisi:matrix varlik:asset bilgi:knowledge,information
  coklu:multi,multiple tekrar:retry,replay onbellek:cache istemci:client loglari:logs loglarini:logs loglar:logs
  log:log sss:faq,frequently,questions sonuclari:results sonuc:result ag:network faydalar:benefits bileseni:component
  bilesenler:components kosullu:conditional isleme:processing manuel:manual guvenlik:security versiyon:version
  adresleri:addresses belirli:specific geri:restore kaldirma:remove,uninstall,removal degistirme:change
  birlestirme:combine,merge silme:remove,delete duzenleme:edit ornekleri:examples ornek:example
  aktarma:transfer,forwarding,export aktarimi:transfer,export iyi:best hesap:account hesaplar:accounts grup:group
  gruplari:groups guruplari:groups uyarilar:alerts kurumlar:organizations sozlesmeler:contracts saklama:hold,retention
  yasal:legal uyeleri:members anahtar:key ozel:private,custom sertifikalar:certificates sertifika:certificate
  dagitik:distributed ortamlarina:environments ortamlari:environments ortam:environment yukleri:workloads testi:test
  lisans:license orijin:origin filtre:filter filtreler:filters kurallari:rules adlari:names sistem:system
  limitler:limits kullanicilar:users kullanici:user profilim:profile,my detaylari:details takimlar:teams
  yetkilendirme:authorization zamanlanmis:scheduled telemetri:telemetry acik:open envanteri:inventory
  tabanlari:bases modalite:modality korumalar:guardrails,protections gelismis:advanced hizli:quick
  baslangic:start,quickstart saglayicilari:providers katalogu:catalog katalog:catalog semantik:semantic
  vektor:vector veritabani:database veritabanlari:databases degiskenleri:variables degiskenler:variables
  senaryolari:scenarios kilavuzlari:guides yonetici:administrator gelistirici:developer tasarimi:design
  tasarim:design sablonlari:templates susleyici:decorator planlari:plans maliyet:cost gozlemlenebilirlik:observability
  analitik:analytics analitigi:analytics pano:dashboard sorgu:query olaylari:events denetim:audit
  uyumluluk:compliance imza:signature sifreleme:encryption cozme:decryption sadelestirme:simplify yanit:response
  alan:field alani:field seviyesi:level dongusu:loop giden:outgoing gelen:incoming yasakli:blocked izin:allowed
  verilen:allowed boyut:size uzunlugu:size maksimum:max minimum:min dosya:file dosyasi:file kurulum:installation
  kurulumu:installation yeni:new eski:old otomatik:automatic gecmisi:history temel:basic,core kavramlar:concepts
  mimari:architecture sozluk:glossary faydalari:benefits ozellikler:features teknik:technical sektorel:industry
  yonetici:administrator onay:approval talepleri:requests organizasyon:organization organizasyonlari:organizations
  gorunurlugu:visibility uyelik:membership davet:invitation tema:theme gorunum:appearance,theme araclar:tools
  abonelik:subscription aboneler:subscribers aktif:active olmayan:inactive,not tuketim:consumption trendi:trend
  goruntulenme:view kategorileri:categories sorumlu:responsible birim:unit cok:most kullanilan:used
  promote:promote uygulamalari:applications kesif:discovery iptal:revocation sorgulama:query alma:obtain,get
  yontemleri:methods uretimi:generation dagitim:deployment bulut:cloud cevrimdisi:offline internetsiz:offline
  kapasite:capacity planlama:planning yol:roadmap haritasi:roadmap en:top,most cok:top,most urunler:products
  metod:method tanim:definition,specification dosyasi:file,specification`
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [tr, en] = pair.split(':');
      return [tr, en.split(',')];
    }),
);

const fold = (s) =>
  s
    .toLowerCase()
    .replace(/ı/g, 'i')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');

const featureCache = new Map();
function features(lang, id, link) {
  const key = `${lang}:${id}`;
  if (featureCache.has(key)) return featureCache.get(key);
  const file = ['.mdx', '.md'].map((ext) => path.join(ROOT, lang, id + ext)).find((f) => fs.existsSync(f));
  const text = fs.readFileSync(file, 'utf8');
  const fm = frontMatter(file);
  const body = text.replace(/^---[\s\S]*?---/, '');
  const f = new Set();
  for (const m of body.matchAll(/\/images\/[^\s)"']+/g)) f.add(`img:${m[0]}`);
  for (const m of body.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) {
    for (const line of m[1].split('\n')) {
      const l = line.trim();
      if (l.length > 8 && !l.startsWith('#') && !l.startsWith('//')) f.add(`code:${l.slice(0, 120)}`);
    }
  }
  for (const m of body.matchAll(/`([^`\n]{3,60})`/g)) f.add(`tick:${m[1]}`);
  for (const m of body.matchAll(/\]\((https?:\/\/[^)\s]+|\/api-reference\/[^)\s#]+)/g)) f.add(`url:${m[1]}`);
  const words = [...fold(link.split('/').pop()).split(/[-_.]/), ...fold(fm.title ?? '').split(/[^a-z0-9]+/)];
  for (const w of words) {
    if (w.length < 2) continue;
    const translated = lang === 'tr' ? GLOSSARY[w] ?? [w] : [w];
    for (const t of translated) f.add(`tok:${t.replace(/s$/, '')}`);
  }
  featureCache.set(key, f);
  return f;
}

function similarity(a, b) {
  let shared = 0;
  for (const x of a) if (b.has(x)) shared += 1;
  return shared / (a.size + b.size - shared || 1);
}

const stats = {pairs: 0, skippedNodes: 0, rejected: 0, reordered: 0};
const pairs = [];
const rejected = [];

function walk(trItems, enItems, trail) {
  if (trItems.length !== enItems.length || trItems.some((it, i) => kind(it) !== kind(enItems[i]))) {
    stats.skippedNodes += 1;
    return;
  }
  // Doc-like entries of this node: plain docs and category landing docs.
  const entries = [];
  trItems.forEach((tr, i) => {
    const en = enItems[i];
    if (kind(tr) === 'doc') entries.push([docId(tr), docId(en)]);
    if (kind(tr) === 'category' && tr.link?.type === 'doc' && en.link?.type === 'doc') {
      entries.push([tr.link.id, en.link.id]);
    }
  });
  const links = entries.map(([t, e]) => [permalink('tr', t), permalink('en', e)]);
  const feats = entries.map(([t, e], i) => [features('tr', t, links[i][0]), features('en', e, links[i][1])]);
  const score = feats.map(([trF]) => feats.map(([, enF]) => similarity(trF, enF)));
  entries.forEach((_, i) => {
    // Best EN candidate for TR item i within this node; usually i itself.
    const j = score[i].indexOf(Math.max(...score[i]));
    const own = score[i][j];
    const bestInRow = score[i].every((s, x) => x === j || s < own);
    const bestInCol = score.every((row, k) => k === i || row[j] < own);
    if (own > 0 && bestInRow && bestInCol) {
      if (j !== i) stats.reordered += 1;
      pairs.push([links[i][0], links[j][1], trail]);
    } else {
      stats.rejected += 1;
      rejected.push(`${links[i][0]} ⇄ ${links[i][1]} (score ${score[i][i].toFixed(2)})`);
    }
  });
  trItems.forEach((tr, i) => {
    if (kind(tr) === 'category') walk(tr.items ?? [], enItems[i].items ?? [], `${trail} › ${tr.label}`);
  });
}

const trSidebars = await loadSidebars('sidebars-tr.ts');
const enSidebars = await loadSidebars('sidebars-en.ts');
const trTabs = Object.keys(trSidebars);
const enTabs = Object.keys(enSidebars);
if (trTabs.length !== enTabs.length) {
  console.error(`sidebar tab count differs: tr=${trTabs.length} en=${enTabs.length}`);
  process.exit(1);
}
trTabs.forEach((tab, i) => walk(trSidebars[tab], enSidebars[enTabs[i]], `${tab}|${enTabs[i]}`));
pairs.push(['/tr', '/en', 'home']);

// Validate against the build and drop pages that are not one-to-one.
let known = null;
if (fs.existsSync(SITEMAP)) {
  known = new Set(
    [...fs.readFileSync(SITEMAP, 'utf8').matchAll(/<loc>https:\/\/docs\.apinizer\.com([^<]*)<\/loc>/g)].map(
      (m) => m[1].replace(/&apos;/g, "'").replace(/&amp;/g, '&') || '/',
    ),
  );
}
// The same doc can sit in two sidebars; identical pairs are fine, conflicting ones are not.
const unique = [...new Map(pairs.map((p) => [`${p[0]} ${p[1]}`, p])).values()];
const count = new Map();
for (const [tr, en] of unique) {
  count.set(tr, (count.get(tr) || 0) + 1);
  count.set(en, (count.get(en) || 0) + 1);
}
const map = {};
const dropped = [];
for (const [tr, en, trail] of unique) {
  if (count.get(tr) > 1 || count.get(en) > 1) {
    dropped.push(`ambiguous (listed more than once): ${tr} ⇄ ${en}`);
    continue;
  }
  if (known && (!known.has(tr) || !known.has(en))) {
    dropped.push(`not in sitemap: ${tr} ⇄ ${en} (${trail})`);
    continue;
  }
  map[tr] = en;
}
stats.pairs = Object.keys(map).length;

const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
fs.mkdirSync(path.dirname(OUT), {recursive: true});
fs.writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`);

let trTotal = null;
let enTotal = null;
if (known) {
  trTotal = [...known].filter((p) => p === '/tr' || p.startsWith('/tr/')).length;
  enTotal = [...known].filter((p) => p === '/en' || p.startsWith('/en/')).length;
}
console.log(`src/data/hreflang-pairs.json: ${stats.pairs} TR⇄EN pairs`);
if (known) {
  console.log(`  TR pages in sitemap: ${trTotal} (paired ${stats.pairs}, unpaired ${trTotal - stats.pairs})`);
  console.log(`  EN pages in sitemap: ${enTotal} (paired ${stats.pairs}, unpaired ${enTotal - stats.pairs})`);
} else {
  console.log('  (no build/sitemap.xml — permalinks not validated)');
}
console.log(`  sidebar nodes skipped for shape mismatch: ${stats.skippedNodes}`);
console.log(`  matched within a node but not at the same position: ${stats.reordered}`);
console.log(`  docs left unpaired by the similarity check: ${stats.rejected}`);
if (dropped.length) console.log(`  dropped: ${dropped.length}`);
if (process.argv.includes('--report')) {
  for (const r of rejected) console.log(`    rejected ${r}`);
  for (const d of dropped) console.log(`    dropped ${d}`);
}
