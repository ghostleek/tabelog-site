/**
 * Privacy gate: vault markdown → src/data/ (the ONLY content source for the site).
 *
 * A note is published iff `public: true` AND `rating !== do_not_recommend`.
 * Published bodies have `%%…%%` private blocks stripped and wikilinks flattened.
 * Only images listed in `photos`/`cover` are copied; `receipt-*` anywhere is a
 * hard build failure. Private content is unrepresentable downstream by construction.
 *
 * Usage: VAULT_PATH=/path/to/vault node scripts/sync-vault.mjs   (default: ./vault, the CI checkout)
 */

import fs from 'node:fs';
import path from 'node:path';
import { load as yamlLoad, dump as yamlDump } from 'js-yaml';

const VAULT = process.env.VAULT_PATH || 'vault';
const OUT = 'src/data';
const NOTES_IN = path.join(VAULT, 'restaurants');
const NOTES_OUT = path.join(OUT, 'restaurants');
const ATTACH_OUT = path.join(OUT, 'attachments');

if (!fs.existsSync(NOTES_IN)) {
  console.error(`sync-vault: vault not found at "${VAULT}" (set VAULT_PATH)`);
  process.exit(1);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(NOTES_OUT, { recursive: true });

const stats = { total: 0, published: 0, excludedPrivate: 0, excludedDnr: 0, photosCopied: 0, photosMissing: 0 };

for (const file of fs.readdirSync(NOTES_IN).filter((f) => f.endsWith('.md')).sort()) {
  stats.total++;
  const slug = path.basename(file, '.md');
  const raw = fs.readFileSync(path.join(NOTES_IN, file), 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!m) { console.warn(`sync-vault: skipping ${file} (no frontmatter)`); continue; }

  const fm = yamlLoad(m[1]);
  if (fm?.rating === 'do_not_recommend') { stats.excludedDnr++; continue; }
  if (fm?.public !== true) { stats.excludedPrivate++; continue; }

  // Body sanitation: strip private blocks, flatten wikilinks, drop embeds
  let body = raw.slice(m[0].length);
  body = body.replace(/%%[\s\S]*?%%/g, '');
  if (body.includes('%%')) {
    console.error(`sync-vault: ${file} has an unclosed %% private block — refusing to publish it`);
    process.exit(1);
  }
  body = body
    .replace(/!\[\[[^\]]*\]\]/g, '') // embeds
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2') // [[target|alias]] → alias
    .replace(/\[\[([^\]]*)\]\]/g, '$1') // [[target]] → target
    .trim();

  // Attachments: copy only what's listed, refuse receipts, rewrite to note-relative paths
  const publishImage = (p) => {
    if (typeof p !== 'string') return null;
    if (path.basename(p).startsWith('receipt-')) {
      console.error(`sync-vault: ${file} lists a receipt image (${p}) in photos/cover — receipts are never published`);
      process.exit(1);
    }
    const src = path.join(VAULT, p);
    if (!fs.existsSync(src)) {
      console.warn(`sync-vault: ${file} photo not found, dropping: ${p}`);
      stats.photosMissing++;
      return null;
    }
    const rel = path.relative('attachments', p); // <slug>/<name>
    const dest = path.join(ATTACH_OUT, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    stats.photosCopied++;
    return `../attachments/${rel}`; // relative to the note file, for astro:assets image()
  };

  const photos = (Array.isArray(fm.photos) ? fm.photos : []).map(publishImage).filter(Boolean);
  const cover = fm.cover ? publishImage(fm.cover) : undefined;

  const out = { ...fm, photos };
  delete out.cover;
  if (cover) out.cover = cover;

  fs.writeFileSync(
    path.join(NOTES_OUT, `${slug}.md`),
    `---\n${yamlDump(out, { flowLevel: 2, lineWidth: -1, noRefs: true })}---\n${body ? body + '\n' : ''}`
  );
  stats.published++;
}

console.log(
  `sync-vault: ${stats.published}/${stats.total} notes published ` +
    `(${stats.excludedDnr} do_not_recommend + ${stats.excludedPrivate} private excluded), ` +
    `${stats.photosCopied} photos copied${stats.photosMissing ? `, ${stats.photosMissing} missing/dropped` : ''}`
);
