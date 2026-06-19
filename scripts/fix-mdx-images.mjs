/**
 * Normalize image tags across all MDX files:
 * - Remove fixed height (causes distortion)
 * - Remove redundant inline borderRadius styles
 * - Standardize width="1200" -> width="1100"
 * - Add width="1100" to Frame-wrapped images missing width
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function walkMdxFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'build') {
      results.push(...walkMdxFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      results.push(full);
    }
  }
  return results;
}

function fixImageTags(content) {
  let updated = content;

  // Remove fixed height attributes from img tags
  updated = updated.replace(/\s+height="[0-9]+"/g, '');

  // Remove inline borderRadius styles
  updated = updated.replace(
    /\s+style=\{\{\s*borderRadius:\s*['"]0\.5rem['"]\s*\}\}/g,
    '',
  );

  // Standardize common oversized widths
  updated = updated.replace(/width="1200"/g, 'width="1100"');

  // Add width="1100" to <img> inside <Frame> blocks that have no width
  updated = updated.replace(
    /(<Frame[^>]*>\s*<img\s+[^>]*?)(\/>|>\s*<\/img>)/gs,
    (match, prefix, suffix) => {
      if (/\bwidth=/.test(prefix)) {
        return match;
      }
      return `${prefix}\n    width="1100"\n  ${suffix}`;
    },
  );

  // Standalone <img> (not in Frame) without width: add width="1100" if looks like a screenshot
  // Skip table inline images (single-line | ... | <img ... /> |)
  updated = updated.replace(
    /^(\s*)<img\s+([^>]*?)(\/>)\s*$/gm,
    (match, indent, attrs, close) => {
      if (/\bwidth=/.test(attrs)) {
        return match;
      }
      // Skip if parent context is table row (line starts with |)
      if (match.trimStart().startsWith('|')) {
        return match;
      }
      return `${indent}<img\n${indent}  ${attrs.trim()}\n${indent}  width="1100"\n${indent}${close}`;
    },
  );

  return updated;
}

const files = walkMdxFiles(ROOT);
let changedFiles = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const updated = fixImageTags(original);
  if (updated !== original) {
    fs.writeFileSync(file, updated, 'utf8');
    changedFiles++;
    console.log(`Updated: ${path.relative(ROOT, file)}`);
  }
}

console.log(`\nDone. ${changedFiles} file(s) updated.`);
