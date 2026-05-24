#!/usr/bin/env node
/**
 * Post-build: trim long preview strings inside the @easyops-cn/docusaurus-
 * search-local index shards so no single file exceeds Cloudflare Pages's
 * 25 MB per-asset limit.
 *
 * Each `search-index-*.json` is a tuple of shards (0..N), each shaped like
 * `{ documents: [{ i, t, u, h, p, s, b }, ...], index: <lunr-data> }`.
 * The Lunr index (`index`) is untouched — that drives the actual search;
 * we only shorten the user-visible preview fields (`p`, `s`, `t`, `b`)
 * to MAX_PREVIEW chars, which is enough for the dropdown snippet.
 *
 * Wired into `npm run build` via package.json.
 */
import fs from 'node:fs';
import path from 'node:path';

const BUILD_DIR = path.resolve(process.cwd(), 'build');
const MAX_PREVIEW = 200; // chars per preview field
const TRIM_FIELDS = ['p', 's', 't', 'b'];

if (!fs.existsSync(BUILD_DIR)) {
  console.log('No build/ directory — skipping search-index trim.');
  process.exit(0);
}

const files = fs
  .readdirSync(BUILD_DIR)
  .filter((f) => f.startsWith('search-index') && f.endsWith('.json'));

if (files.length === 0) {
  console.log('No search-index*.json files found — skipping.');
  process.exit(0);
}

function trimValue(v) {
  if (typeof v === 'string' && v.length > MAX_PREVIEW) return v.slice(0, MAX_PREVIEW);
  if (Array.isArray(v)) return v.map(trimValue);
  return v;
}

let totalBefore = 0;
let totalAfter = 0;
for (const f of files) {
  const full = path.join(BUILD_DIR, f);
  const beforeBytes = fs.statSync(full).size;
  const data = JSON.parse(fs.readFileSync(full, 'utf8'));

  // The top-level object can be either a plain `{documents, index}` shape
  // or a numeric-keyed shard map (`{0: {...}, 1: {...}}`). Walk both.
  const shards = Array.isArray(data.documents) ? [data] : Object.values(data);
  for (const shard of shards) {
    if (!shard || !Array.isArray(shard.documents)) continue;
    for (const doc of shard.documents) {
      for (const field of TRIM_FIELDS) {
        if (field in doc) doc[field] = trimValue(doc[field]);
      }
    }
  }

  fs.writeFileSync(full, JSON.stringify(data));
  const afterBytes = fs.statSync(full).size;
  totalBefore += beforeBytes;
  totalAfter += afterBytes;
  const mb = (n) => (n / 1024 / 1024).toFixed(2);
  console.log(`  ${f}: ${mb(beforeBytes)} MB → ${mb(afterBytes)} MB`);
}

const mb = (n) => (n / 1024 / 1024).toFixed(2);
console.log(`Total: ${mb(totalBefore)} MB → ${mb(totalAfter)} MB`);

// Hard guard: if any single file is still over 25 MB, fail loudly so we
// catch the regression before the Pages deploy does.
const offenders = files
  .map((f) => ({f, size: fs.statSync(path.join(BUILD_DIR, f)).size}))
  .filter(({size}) => size > 25 * 1024 * 1024);
if (offenders.length) {
  console.error('ERROR: search-index files still exceed 25 MB:');
  for (const {f, size} of offenders) console.error(`  ${f}: ${mb(size)} MB`);
  process.exit(1);
}
