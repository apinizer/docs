#!/usr/bin/env node
/**
 * Generates static/_redirects (Cloudflare Pages) from the curated map in
 * scripts/legacy-redirects.tsv and validates it against a fresh build.
 *
 *   npm run build && node scripts/gen-legacy-redirects.mjs [--write-build]
 *
 * Every rule is emitted as a static 301. The script fails when:
 *   - a target is not a built page (build/sitemap.xml or an unlisted page's HTML),
 *   - a source is itself a live page (Pages applies _redirects before assets, so
 *     the rule would hide the page),
 *   - a target is also a source (redirect chain), or two rules collide,
 *   - Cloudflare limits are exceeded (2000 static rules, 1000 chars per line).
 *
 * Path normalisation mirrors Cloudflare's own _redirects parser
 * (workers-shared validateURL → `new URL('//' + path, 'relative://').pathname`),
 * which percent-encodes non-ASCII characters. Raw UTF-8 and %-encoded spellings
 * of e.g. "yaygın" in the TSV therefore collapse into one rule, written in
 * encoded form (plus a lower-case-hex copy, see sourceVariants). Characters the
 * URL parser leaves alone (' & ;) are emitted raw and %-encoded, because those
 * are different request paths.
 *
 * --write-build also copies the result to build/_redirects so a local
 * `wrangler pages dev build` can be tested without rebuilding.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TSV = path.join(ROOT, 'scripts', 'legacy-redirects.tsv');
const OUT = path.join(ROOT, 'static', '_redirects');
const BUILD = path.join(ROOT, 'build');
const SITE = 'https://docs.apinizer.com';
const MAX_STATIC = 2000;
const MAX_LINE = 1000;

const errors = [];
const warnings = [];

/** Cloudflare's pathname normalisation for _redirects sources/targets. */
function normalise(p) {
  if (!p.startsWith('/')) p = `/${p}`;
  return new URL(`//${p}`, 'relative://').pathname;
}

function safeDecode(p) {
  try {
    return decodeURIComponent(p);
  } catch {
    return p;
  }
}

/** Live pages of the current build: sitemap URLs + every non-redirect HTML file. */
function loadPages() {
  const sitemapFile = path.join(BUILD, 'sitemap.xml');
  if (!fs.existsSync(sitemapFile)) {
    console.error('build/sitemap.xml not found — run `npm run build` first.');
    process.exit(2);
  }
  const unescapeXml = (s) =>
    s.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const pages = new Set();
  for (const m of fs.readFileSync(sitemapFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
    pages.add(safeDecode(unescapeXml(m[1]).replace(SITE, '') || '/'));
  }
  const skipDirs = new Set(['assets', 'images', 'img', 'files']);
  const walk = (dir, rel) => {
    for (const ent of fs.readdirSync(dir, {withFileTypes: true})) {
      if (ent.isDirectory()) {
        if (rel === '' && skipDirs.has(ent.name)) continue;
        walk(path.join(dir, ent.name), `${rel}/${ent.name}`);
      } else if (ent.name.endsWith('.html')) {
        const head = fs.readFileSync(path.join(dir, ent.name), 'utf8').slice(0, 4000);
        if (/http-equiv=["']?refresh/i.test(head)) continue; // client-side redirect stub, not a page
        const route = ent.name === 'index.html' ? rel || '/' : `${rel}/${ent.name.slice(0, -5)}`;
        if (route !== '/404') pages.add(route.normalize('NFC'));
      }
    }
  };
  walk(BUILD, '');
  return pages;
}

function parseTsv() {
  const rules = [];
  const lines = fs.readFileSync(TSV, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (!line.trim() || line.startsWith('#')) return;
    const [from, to, note = ''] = line.split('\t').map((s) => s.trim());
    if (from === 'from' && to === 'to') return; // header
    if (!from || !to) {
      errors.push(`legacy-redirects.tsv:${i + 1}: expected "from<TAB>to<TAB>note"`);
      return;
    }
    rules.push({from: from.normalize('NFC'), to: to.normalize('NFC'), note, line: i + 1});
  });
  return rules;
}

/**
 * Spellings Cloudflare treats as distinct request paths for one source:
 * the normalised form, the %-encoded form of ' & ;, and a lower-case-hex copy
 * of any %XX escape (clients that send raw UTF-8 bytes reach the matcher as
 * lower-case escapes, e.g. "yayg%c4%b1n" — verified with `wrangler pages dev`).
 */
function sourceVariants(from) {
  const base = normalise(from);
  const variants = [base];
  if (/['&;]/.test(base)) {
    variants.push(base.replace(/'/g, '%27').replace(/&/g, '%26').replace(/;/g, '%3B'));
  }
  for (const v of [...variants]) {
    const lower = v.replace(/%[0-9A-F]{2}/g, (m) => m.toLowerCase());
    if (lower !== v) variants.push(lower);
  }
  return variants;
}

const pages = loadPages();
const rules = parseTsv();
const sources = new Set(rules.map((r) => safeDecode(normalise(r.from))));
const emitted = new Map(); // normalised source -> rule
const out = [];
const byCategory = {};

for (const r of rules) {
  const target = safeDecode(normalise(r.to));
  const decodedSource = safeDecode(normalise(r.from));
  if (!pages.has(target)) errors.push(`tsv:${r.line}: target is not a built page: ${r.to}`);
  if (pages.has(decodedSource)) errors.push(`tsv:${r.line}: source is a live page (would be shadowed): ${r.from}`);
  if (sources.has(target)) errors.push(`tsv:${r.line}: target is itself redirected (chain): ${r.to}`);
  for (const src of sourceVariants(r.from)) {
    const prev = emitted.get(src);
    if (prev) {
      if (normalise(prev.to) !== normalise(r.to)) {
        errors.push(`tsv:${r.line}: ${r.from} conflicts with line ${prev.line} (${prev.to} vs ${r.to})`);
      } else {
        warnings.push(`tsv:${r.line}: duplicate of line ${prev.line}, skipped: ${r.from}`);
      }
      continue;
    }
    emitted.set(src, r);
    const line = `${src} ${normalise(r.to)} 301`;
    if (line.length > MAX_LINE) errors.push(`tsv:${r.line}: line longer than ${MAX_LINE} chars`);
    out.push(line);
    const cat = r.note.split(':')[0] || 'uncategorised';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }
}

if (out.length > MAX_STATIC) errors.push(`${out.length} static rules exceed Cloudflare's limit of ${MAX_STATIC}`);

for (const w of warnings) console.warn(`warn  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error ${e}`);
  console.error(`\n${errors.length} error(s); static/_redirects not written.`);
  process.exit(1);
}

const header = [
  '# GENERATED by scripts/gen-legacy-redirects.mjs from scripts/legacy-redirects.tsv — do not edit by hand.',
  '# Cloudflare Pages: static 301 rules only (limit 2000 static + 100 dynamic). Sources are written in',
  "# Cloudflare's normalised (percent-encoded) form plus a lower-case-hex copy; ' & ; sources are",
  '# emitted raw and %-encoded.',
  '',
];
const content = `${header.join('\n')}${out.join('\n')}\n`;
fs.writeFileSync(OUT, content);
if (process.argv.includes('--write-build') && fs.existsSync(BUILD)) {
  fs.writeFileSync(path.join(BUILD, '_redirects'), content);
}

console.log(`static/_redirects: ${out.length} rules (${rules.length} map entries)`);
for (const [cat, n] of Object.entries(byCategory)) console.log(`  ${cat.padEnd(14)} ${n}`);
