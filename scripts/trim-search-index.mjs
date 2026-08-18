#!/usr/bin/env node
/**
 * Post-build: trim long preview strings inside the @easyops-cn/docusaurus-
 * search-local index shards so no single file exceeds Cloudflare Pages's
 * 25 MB per-asset limit, then rebuild each Lunr inverted index from the
 * trimmed document text (the plugin builds indexes from full section bodies,
 * which dominates file size even after preview trimming).
 *
 * Wired into `npm run build` via package.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import lunr from 'lunr';

const require = createRequire(import.meta.url);

const BUILD_DIR = path.resolve(process.cwd(), 'build');
const MAX_PREVIEW = 200; // chars per preview / indexed text field
const TRIM_FIELDS = ['p', 's', 't', 'b'];
const SEARCH_LANGUAGE = ['en', 'tr'];

let lunrPluginInitialized = false;
let lunrPlugin;

function initLunrPlugin() {
  if (lunrPluginInitialized) return;
  lunrPluginInitialized = true;

  require('lunr-languages/lunr.stemmer.support.js')(lunr);
  require('lunr-languages/lunr.tr.js')(lunr);
  require('lunr-languages/lunr.multi.js')(lunr);
  lunrPlugin = lunr.multiLanguage(...SEARCH_LANGUAGE);
}

/** Mirrors @easyops-cn/docusaurus-search-local buildIndex pipeline. */
function rebuildLunrIndex(documents) {
  initLunrPlugin();

  return lunr(function () {
    this.use(lunrPlugin);
    // removeDefaultStopWordFilter: true in docusaurus.config.ts
    this.pipeline.remove(lunr.stopWordFilter);
    if (lunr.tr?.stopWordFilter) {
      this.pipeline.remove(lunr.tr.stopWordFilter);
    }
    // removeDefaultStemmer: true
    this.pipeline.remove(lunr.stemmer);

    this.ref('i');
    this.field('t');
    this.metadataWhitelist = ['position'];

    for (const doc of documents) {
      this.add({
        ...doc,
        i: String(doc.i),
        t: typeof doc.t === 'string' ? doc.t : '',
      });
    }
  }).toJSON();
}

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

function getShards(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.documents)) return [data];
  return Object.values(data);
}

let totalBefore = 0;
let totalAfter = 0;
for (const f of files) {
  const full = path.join(BUILD_DIR, f);
  const beforeBytes = fs.statSync(full).size;
  const data = JSON.parse(fs.readFileSync(full, 'utf8'));

  for (const shard of getShards(data)) {
    if (!shard || !Array.isArray(shard.documents)) continue;

    for (const doc of shard.documents) {
      for (const field of TRIM_FIELDS) {
        if (field in doc) doc[field] = trimValue(doc[field]);
      }
    }

    shard.index = rebuildLunrIndex(shard.documents);
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

const offenders = files
  .map((f) => ({ f, size: fs.statSync(path.join(BUILD_DIR, f)).size }))
  .filter(({ size }) => size > 25 * 1024 * 1024);
if (offenders.length) {
  console.error('ERROR: search-index files still exceed 25 MB:');
  for (const { f, size } of offenders) console.error(`  ${f}: ${mb(size)} MB`);
  process.exit(1);
}
