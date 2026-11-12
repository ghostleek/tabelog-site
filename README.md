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

## Verify a publication

1. Check the note in Obsidian. The public site takes entries with `public: true` and a `recommend` or `highly_recommend` rating. The build strips private comments and copies the listed photos.
2. Confirm the Mac mirror pushed the note to `ghostleek/tabelog-vault`. An `Operation not permitted` in `~/Library/Logs/tabelog-mirror.log` means the mirror process needs macOS access to the iCloud vault.
3. Check the **Deploy** workflow in `ghostleek/tabelog-site`. Its first step names any missing site secrets. If a vault push produces no run, check `SITE_DISPATCH_PAT` in the vault repo.
4. Open the restaurant URL on the Cloudflare Pages deployment. Before changing the custom domain, check the page, the `/search/geo.json` response, and the privacy check from the same build. The custom domain needs to route to Pages for those changes to appear there.

## Search

`/search` is hybrid: MiniSearch (keyword, instant) + bge-small-en-v1.5 embeddings (semantic re-rank via `/api/embed`, a Pages Function with a Workers AI binding), fused with reciprocal-rank fusion. Proximity uses browser geolocation or a typed postal code (OneMap) + haversine. If the embed call fails, search silently degrades to keyword-only.
