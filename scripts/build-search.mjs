/**
 * Build search artifacts from sanitized src/data/ → public/search/
 *   keyword-index.json  MiniSearch serialized index
 *   search-meta.json    { model, dims, slugs[], scales[], stored{} }
 *   embeddings.bin      int8-quantized unit vectors, N × dims bytes
 *
 * Embedding provider (build-time, bge-small-en-v1.5 384d):
 *   1. CF_API_TOKEN + CF_ACCOUNT_ID  → Workers AI REST (batched)
 *   2. EMBED_URL                     → deployed /api/embed function (one by one)
 *   3. neither                       → skip embeddings (search degrades to keyword-only)
 *
 * Embeddings are cached in .cache/embeddings.json keyed by sha256 of the embed
 * text — a typical build re-embeds only changed notes.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { load as yamlLoad } from 'js-yaml';
import MiniSearch from 'minisearch';

const NOTES = 'src/data/restaurants';
const OUT = 'public/search';
const CACHE_FILE = '.cache/embeddings.json';
const MODEL = '@cf/baai/bge-small-en-v1.5';
const DIMS = 384;

if (!fs.existsSync(NOTES)) {
  console.error('build-search: run scripts/sync-vault.mjs first');
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

// ---------------- parse docs ----------------
const docs = [];
for (const file of fs.readdirSync(NOTES).filter((f) => f.endsWith('.md')).sort()) {
  const raw = fs.readFileSync(path.join(NOTES, file), 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!m) continue;
  const fm = yamlLoad(m[1]);
  const body = raw.slice(m[0].length).trim();
  docs.push({
    id: path.basename(file, '.md'),
    name: fm.name,
    dishNames: (fm.dishes ?? []).map((d) => d.name).join(', '),
    area: fm.area ?? '',
    categories: (fm.categories ?? []).join(' '),
    body,
    // stored for result cards:
    rating: fm.rating,
    price: fm.price_per_pax ?? null,
    hawker: fm.is_hawker ?? false,
    country: fm.country ?? 'Singapore',
    cats: fm.categories ?? [],
  });
}

// ---------------- keyword index ----------------
const mini = new MiniSearch({
  fields: ['name', 'dishNames', 'area', 'categories', 'body'],
  storeFields: ['name', 'area', 'rating', 'price', 'hawker', 'country', 'cats'],
  searchOptions: { boost: { name: 3, dishNames: 2 }, prefix: true, fuzzy: 0.2 },
});
mini.addAll(docs);
fs.writeFileSync(path.join(OUT, 'keyword-index.json'), JSON.stringify(mini));

// ---------------- embeddings ----------------
const embedText = (d) =>
  `${d.name}. ${d.categories}. ${d.area}. ${d.country}. Dishes: ${d.dishNames}. ${d.body}`.slice(0, 1500);
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

let cache = {};
if (fs.existsSync(CACHE_FILE)) cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));

async function embedBatchRest(texts) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/${MODEL}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texts }),
    }
  );
  const json = await res.json();
  if (!json.success) throw new Error(`Workers AI: ${JSON.stringify(json.errors)}`);
  return json.result.data;
}

async function embedOneUrl(text) {
  const res = await fetch(`${process.env.EMBED_URL}?q=${encodeURIComponent(text.slice(0, 800))}`);
  if (!res.ok) throw new Error(`embed url ${res.status}`);
  return (await res.json()).embedding;
}

const provider =
  process.env.CF_API_TOKEN && process.env.CF_ACCOUNT_ID ? 'rest' : process.env.EMBED_URL ? 'url' : null;

const meta = { model: null, dims: DIMS, slugs: docs.map((d) => d.id), scales: [] };

if (!provider) {
  console.log('build-search: no embedding provider configured (CF_API_TOKEN or EMBED_URL) — keyword-only');
  fs.writeFileSync(path.join(OUT, 'search-meta.json'), JSON.stringify(meta));
  fs.rmSync(path.join(OUT, 'embeddings.bin'), { force: true });
} else {
  const texts = docs.map(embedText);
  const hashes = texts.map(sha);
  const missing = hashes.map((h, i) => (cache[h] ? null : i)).filter((i) => i !== null);
  console.log(`build-search: embedding ${missing.length}/${docs.length} notes (rest cached) via ${provider}`);

  if (provider === 'rest') {
    for (let i = 0; i < missing.length; i += 90) {
      const idxs = missing.slice(i, i + 90);
      const vecs = await embedBatchRest(idxs.map((j) => texts[j]));
      idxs.forEach((j, k) => (cache[hashes[j]] = vecs[k]));
    }
  } else {
    for (const j of missing) {
      cache[hashes[j]] = await embedOneUrl(texts[j]);
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));

  // normalize → int8 quantize with per-vector scale
  const bin = Buffer.alloc(docs.length * DIMS);
  docs.forEach((d, i) => {
    const v = cache[hashes[i]];
    if (!Array.isArray(v) || v.length !== DIMS) throw new Error(`bad vector for ${d.id}`);
    const norm = Math.hypot(...v);
    const unit = v.map((x) => x / norm);
    const scale = Math.max(...unit.map(Math.abs)) / 127;
    meta.scales.push(scale);
    unit.forEach((x, k) => bin.writeInt8(Math.max(-127, Math.min(127, Math.round(x / scale))), i * DIMS + k));
  });
  meta.model = MODEL;
  fs.writeFileSync(path.join(OUT, 'embeddings.bin'), bin);
  fs.writeFileSync(path.join(OUT, 'search-meta.json'), JSON.stringify(meta));
  console.log(`build-search: embeddings.bin ${(bin.length / 1024).toFixed(0)}KB for ${docs.length} notes`);
}

console.log(`build-search: keyword index ${(fs.statSync(path.join(OUT, 'keyword-index.json')).size / 1024).toFixed(0)}KB`);
