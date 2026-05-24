#!/usr/bin/env node
/**
 * Convert Mintlify-flavored MDX to Docusaurus-flavored MDX.
 *
 * Operates in-place on tr/, en/ (and any other content dirs passed as args).
 * Idempotent-ish: re-running on already-converted files should produce no
 * further change, because Mintlify-only constructs have all been removed.
 *
 * Conversions:
 *  - Frontmatter: drop Mintlify-only keys (icon, iconType, og:*, twitter:*,
 *    canonical, openapi, mode); sidebarTitle → sidebar_label.
 *  - Admonitions: <Note>/<Tip>/<Info>/<Warning>/<Danger>/<Check> → :::note etc.
 *  - <Tabs><Tab title="X"> → @theme/Tabs <Tabs><TabItem value="x" label="X">.
 *  - <Card>/<CardGroup>     → @site/src/components/Card.
 *  - <Steps>/<Step>         → @site/src/components/Steps.
 *  - <Frame>                → @site/src/components/Frame.
 *  - <Accordion>/<AccordionGroup> → native <details>/<summary>.
 *  - <CodeGroup>            → Tabs/TabItem wrapper.
 *  - Strip <Icon /> self-closing tags (replace with text/emoji not feasible).
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const targetDirs = process.argv.slice(2).length
  ? process.argv.slice(2).map((d) => path.resolve(repoRoot, d))
  : ['tr', 'en'].map((d) => path.resolve(repoRoot, d));

const stats = {
  files: 0,
  changed: 0,
  errors: 0,
  componentCounts: {},
};

function bump(name, by = 1) {
  stats.componentCounts[name] = (stats.componentCounts[name] || 0) + by;
}

/** Walk a directory recursively and yield .mdx file paths. */
function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      yield* walk(full);
    } else if (entry.isFile() && (entry.name.endsWith('.mdx') || entry.name.endsWith('.md'))) {
      yield full;
    }
  }
}

/** ----------------- Frontmatter ----------------- */
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const DROP_KEYS = new Set([
  'icon', 'iconType', 'mode', 'noindex', 'openapi', 'canonical',
  'og:title', 'og:description', 'og:image', 'og:url',
  'twitter:title', 'twitter:description', 'twitter:image',
]);

function transformFrontmatter(src) {
  const m = src.match(FRONTMATTER_RE);
  if (!m) return src;
  const body = m[1];
  const lines = body.split(/\r?\n/);
  const out = [];
  let changed = false;
  for (const line of lines) {
    const km = line.match(/^([A-Za-z0-9_:-]+)\s*:/);
    if (km) {
      const key = km[1];
      if (DROP_KEYS.has(key)) {
        bump(`frontmatter-drop:${key}`);
        changed = true;
        continue;
      }
      if (key === 'sidebarTitle') {
        out.push(line.replace(/^sidebarTitle\s*:/, 'sidebar_label:'));
        bump('frontmatter-sidebarTitle->sidebar_label');
        changed = true;
        continue;
      }
    }
    out.push(line);
  }
  if (!changed) return src;
  return src.replace(FRONTMATTER_RE, `---\n${out.join('\n')}\n---\n`);
}

/** ----------------- Admonitions -----------------
 *  Mintlify uses <Note>...</Note> etc. Convert to Docusaurus admonition syntax.
 *  We process the block-level form (component on its own line, content following).
 *  If the component has a `title` attribute we emit it as the admonition title.
 */
const ADMONITION_MAP = {
  Note: 'note',
  Tip: 'tip',
  Info: 'info',
  Warning: 'warning',
  Danger: 'danger',
  Check: 'tip',   // closest equivalent; no native "check"
};

function transformAdmonitions(src) {
  let out = src;
  for (const [Comp, kind] of Object.entries(ADMONITION_MAP)) {
    // Match opening tag (with optional title attribute), capture inner, then close.
    const re = new RegExp(
      `<${Comp}(\\s+title=("[^"]*"|'[^']*'|\\{[^}]*\\}))?\\s*>([\\s\\S]*?)</${Comp}>`,
      'g',
    );
    out = out.replace(re, (_full, _attrs, titleRaw, inner) => {
      let title = '';
      if (titleRaw) {
        title = titleRaw.replace(/^['"]|['"]$/g, '').replace(/^\{|\}$/g, '');
      }
      const body = inner.trim();
      bump(`admonition:${Comp}->${kind}`);
      const head = title ? `:::${kind}[${title}]` : `:::${kind}`;
      return `${head}\n\n${body}\n\n:::`;
    });
  }
  return out;
}

/** ----------------- Tabs / Tab -----------------
 *  <Tabs><Tab title="A">...</Tab>...</Tabs>
 *  →
 *  <Tabs><TabItem value="a" label="A">...</TabItem>...</Tabs>
 *  (plus an import for @theme/Tabs and @theme/TabItem, added later.)
 */
function slugifyValue(label) {
  return label
    .toLowerCase()
    .replace(/[ığüşöç]/g, (c) => ({ı: 'i', ğ: 'g', ü: 'u', ş: 's', ö: 'o', ç: 'c'}[c] || c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'tab';
}

function transformTabs(src) {
  let out = src;
  let usesTabs = false;
  out = out.replace(/<Tab(\s+title=("[^"]*"|'[^']*'))\s*>/g, (_m, _, titleRaw) => {
    const label = titleRaw.replace(/^['"]|['"]$/g, '');
    const value = slugifyValue(label);
    usesTabs = true;
    bump('tab-open');
    return `<TabItem value="${value}" label="${label}">`;
  });
  if (usesTabs || /<\/Tab>/.test(out) || /<Tabs[\s>]/.test(out)) {
    out = out.replace(/<\/Tab>/g, '</TabItem>');
    bump('tab-close', (src.match(/<\/Tab>/g) || []).length);
  }
  return {out, usesTabs: usesTabs || /<Tabs[\s>]/.test(out)};
}

/** ----------------- Accordion → custom React component -----------------
 * We keep the <Accordion> tag (mapped to @site/src/components/Accordion).
 * Reasons:
 *  - Native <details> is HTML, and MDX gets confused when it sits inside a
 *    list item (lazy continuation rules eat the closing tag).
 *  - JSX is parsed as a self-contained block and survives nesting.
 * We only strip <AccordionGroup> which is just a wrapper.
 */
function transformAccordion(src) {
  let out = src;
  // <AccordionGroup> is a wrapper; just remove the tags (children carry).
  out = out.replace(/<AccordionGroup\s*>/g, '');
  out = out.replace(/<\/AccordionGroup>/g, '');
  // Count for stats only — Accordion tags themselves are preserved and the
  // component import will be auto-added by ensureImports().
  const count = (out.match(/<Accordion\b/g) || []).length;
  if (count) bump('accordion', count);
  return out;
}

/** ----------------- CodeGroup → Tabs of code blocks ----------------- */
function transformCodeGroup(src) {
  let out = src;
  let usesTabs = false;
  out = out.replace(/<CodeGroup\s*>([\s\S]*?)<\/CodeGroup>/g, (_m, inner) => {
    // Inner usually has multiple ``` fenced blocks with optional titles.
    const blocks = [];
    const re = /```(\w+)?(?:\s+([^\n]+))?\n([\s\S]*?)```/g;
    let bm;
    while ((bm = re.exec(inner)) !== null) {
      const lang = bm[1] || '';
      const title = (bm[2] || lang || 'Code').trim();
      const body = bm[3];
      blocks.push({lang, title, body});
    }
    if (!blocks.length) return inner;
    usesTabs = true;
    bump('codegroup');
    const tabs = blocks
      .map((b) => {
        const val = slugifyValue(b.title);
        return `<TabItem value="${val}" label="${b.title}">\n\n\`\`\`${b.lang}\n${b.body}\`\`\`\n\n</TabItem>`;
      })
      .join('\n');
    return `<Tabs>\n${tabs}\n</Tabs>`;
  });
  return {out, usesTabs};
}

/** ----------------- Component detection for imports ----------------- */
function needsImport(src, tag) {
  const re = new RegExp(`<${tag}[\\s/>]`);
  return re.test(src);
}

function ensureImports(src) {
  const needs = {
    tabs: needsImport(src, 'Tabs') || needsImport(src, 'TabItem'),
    card: needsImport(src, 'Card') || needsImport(src, 'CardGroup'),
    steps: needsImport(src, 'Steps') || needsImport(src, 'Step'),
    frame: needsImport(src, 'Frame'),
    accordion: needsImport(src, 'Accordion'),
  };

  const importLines = [];
  if (needs.tabs && !/from '@theme\/Tabs'/.test(src)) {
    importLines.push(`import Tabs from '@theme/Tabs';`);
    importLines.push(`import TabItem from '@theme/TabItem';`);
  }
  if (needs.card && !/from '@site\/src\/components\/Card'/.test(src)) {
    importLines.push(`import {Card, CardGroup} from '@site/src/components/Card';`);
  }
  if (needs.steps && !/from '@site\/src\/components\/Steps'/.test(src)) {
    importLines.push(`import {Steps, Step} from '@site/src/components/Steps';`);
  }
  if (needs.frame && !/from '@site\/src\/components\/Frame'/.test(src)) {
    importLines.push(`import {Frame} from '@site/src/components/Frame';`);
  }
  if (needs.accordion && !/from '@site\/src\/components\/Accordion'/.test(src)) {
    importLines.push(`import {Accordion} from '@site/src/components/Accordion';`);
  }
  if (!importLines.length) return src;

  // Insert imports right after the frontmatter block (if any) or at top.
  // MDX requires a blank line separating import statements from markdown
  // content, otherwise the parser treats the body as part of the import.
  const fm = src.match(FRONTMATTER_RE);
  if (fm) {
    const before = src.slice(0, fm[0].length);
    let after = src.slice(fm[0].length).replace(/^\r?\n+/, '');
    return `${before}\n${importLines.join('\n')}\n\n${after}`;
  }
  return `${importLines.join('\n')}\n\n${src.replace(/^\r?\n+/, '')}`;
}

/** ----------------- Misc cleanup ----------------- */
function miscCleanup(src) {
  // <Columns> is a Mintlify multi-column layout — same role as <CardGroup>.
  src = src.replace(/<Columns(\s+cols=\{(\d+)\})?\s*>/g, (_m, _a, cols) => {
    bump('columns->cardgroup');
    return `<CardGroup cols={${cols || 2}}>`;
  });
  src = src.replace(/<\/Columns>/g, '</CardGroup>');
  // Drop self-closing <Icon ... /> tags — no Docusaurus equivalent without
  // bringing in an icon library; emojis would be lossy. Comment them out
  // so authors can revisit if needed.
  src = src.replace(/<Icon\b[^/>]*\/>/g, '{/* Icon removed during migration */}');
  // Drop self-closing <Update /> tags (Mintlify-specific change-log tag).
  src = src.replace(/<Update\b[^/>]*\/>/g, '');
  // <ParamField .../> and <ResponseField .../> are uncommon — leave a comment.
  src = src.replace(/<(ParamField|ResponseField)\b[^>]*>([\s\S]*?)<\/\1>/g, (m) => {
    bump('paramfield-marker');
    return `{/* TODO: migrate ParamField/ResponseField below to a markdown table */}\n${m}`;
  });
  return src;
}

/** ----------------- Whole-file pipeline ----------------- */
function convertFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let src = original;

  src = transformFrontmatter(src);
  src = transformAdmonitions(src);
  src = transformAccordion(src);
  {
    const r = transformCodeGroup(src);
    src = r.out;
  }
  {
    const r = transformTabs(src);
    src = r.out;
  }
  // <Frame> wrapper: keep the component (we have a Frame React component).
  // <Card>/<CardGroup>: keep tags; imports added below.
  // <Steps>/<Step>: keep tags; imports added below.
  src = miscCleanup(src);
  src = ensureImports(src);

  if (src !== original) {
    fs.writeFileSync(filePath, src);
    stats.changed++;
  }
}

for (const dir of targetDirs) {
  for (const file of walk(dir)) {
    stats.files++;
    try {
      convertFile(file);
    } catch (e) {
      stats.errors++;
      console.error(`Error in ${file}:`, e.message);
    }
  }
}

console.log('--- MDX conversion summary ---');
console.log(`Files scanned: ${stats.files}`);
console.log(`Files changed: ${stats.changed}`);
console.log(`Errors:        ${stats.errors}`);
console.log('Component transforms:');
for (const [k, v] of Object.entries(stats.componentCounts).sort()) {
  console.log(`  ${k}: ${v}`);
}
