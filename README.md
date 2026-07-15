# tabelog-site

Public static site for [tabelog.kahhow.com](https://tabelog.kahhow.com) — built with Astro from a **private Obsidian vault** of restaurant notes (`ghostleek/tabelog-vault`). This repo contains no restaurant data; content is synced at build time.

## How content flows

```
Obsidian vault (private repo) ──push──▶ repository_dispatch ──▶ this repo's deploy workflow
  └─ scripts/sync-vault.mjs   sanitizes: drops private + do_not_recommend notes,
     strips %%…%% blocks, copies only allow-listed photos → src/data/
  └─ scripts/build-search.mjs builds keyword index + embeddings + geo.json
  └─ astro build → scripts/check-privacy.mjs (tripwire: greps dist/ for private strings)
  └─ wrangler pages deploy
```

## Local development

```sh
npm install
ln -s "/path/to/tabelog/vault" vault   # or export VAULT_PATH
npm run dev                            # sync + astro dev
npm run build                          # sync + build + privacy check
```

## CI secrets (GitHub Actions)

| Secret | Purpose |
|---|---|
| `VAULT_PAT` | Fine-grained PAT, contents:read on `tabelog-vault` only |
| `CLOUDFLARE_API_TOKEN` | Pages deploy + Workers AI (embeddings at build time) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account |

The vault repo needs a `SITE_DISPATCH_PAT` secret (repo scope on this repo) for its push → `vault-updated` dispatch.

## Search

`/search` is hybrid: MiniSearch (keyword, instant) + bge-small-en-v1.5 embeddings (semantic re-rank via `/api/embed`, a Pages Function with a Workers AI binding), fused with reciprocal-rank fusion. Proximity uses browser geolocation or a typed postal code (OneMap) + haversine. If the embed call fails, search silently degrades to keyword-only.
