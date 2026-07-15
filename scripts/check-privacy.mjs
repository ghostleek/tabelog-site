/**
 * CI tripwire: assert that nothing private from the vault appears in dist/.
 *
 * Private strings = names+slugs of unpublished notes (public!=true or
 * do_not_recommend) and the contents of %%…%% blocks in ALL notes.
 * Any hit in dist/ fails the build. Run after `astro build`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { load as yamlLoad } from 'js-yaml';

const VAULT = process.env.VAULT_PATH || 'vault';
const DIST = 'dist';
const NOTES = path.join(VAULT, 'restaurants');

const needles = new Set();

for (const file of fs.readdirSync(NOTES).filter((f) => f.endsWith('.md'))) {
  const raw = fs.readFileSync(path.join(NOTES, file), 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!m) continue;
  const fm = yamlLoad(m[1]) ?? {};
  const body = raw.slice(m[0].length);

  if (fm.public !== true || fm.rating === 'do_not_recommend') {
    if (typeof fm.name === 'string' && fm.name.trim().length >= 4) needles.add(fm.name.trim().toLowerCase());
    needles.add(path.basename(file, '.md').toLowerCase());
  }
  for (const block of body.match(/%%([\s\S]*?)%%/g) ?? []) {
    for (const line of block.replace(/%%/g, '').split('\n')) {
      const t = line.trim();
      if (t.length >= 10) needles.add(t.toLowerCase());
    }
  }
}

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(html|json|js|xml|txt)$/.test(e.name)) files.push(p);
  }
})(DIST);

let hits = 0;
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8').toLowerCase();
  for (const needle of needles) {
    if (content.includes(needle)) {
      console.error(`PRIVACY LEAK: "${needle}" found in ${f}`);
      hits++;
    }
  }
}

if (hits > 0) {
  console.error(`\ncheck-privacy: FAILED — ${hits} private string(s) leaked into dist/`);
  process.exit(1);
}
console.log(`check-privacy: OK — ${needles.size} private strings checked against ${files.length} built files, zero leaks`);
