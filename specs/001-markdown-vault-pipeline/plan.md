# Implementation Plan: Markdown Vault → Static Site Pipeline

**Branch**: `001-markdown-vault-pipeline` | **Date**: 2026-07-15 (backfilled 2026-10-20) | **Spec**: [spec.md](spec.md)

## Summary

Replace Postgres + Next.js with a private Obsidian vault as the only database, a
launchd git mirror that publishes it to a private repo, and an Astro static build
that passes vault content through one privacy gate (`sync-vault.mjs`) before
generating pages and a prebuilt hybrid search index. Deployed to Cloudflare Pages
with two stateless Functions.

## Technical Context

**Language/Version**: Node 22 (CI), ESM scripts; TypeScript in Astro components
**Primary Dependencies**: Astro 7, Tailwind 4 (+typography), Leaflet + markercluster, MiniSearch, js-yaml, @astrojs/sitemap, wrangler
**Storage**: Markdown files (vault); build artifacts in `public/search/`; embeddings cache in `.cache/`
**Testing**: `npm run check` (Function syntax + full build against `tests/fixture-vault` + privacy tripwire); browser verification
**Target Platform**: Cloudflare Pages + Pages Functions (Workers AI binding `AI`)
**Project Type**: Static web site plus build scripts
**Performance Goals**: Keyword results < 150ms; search artifacts < 500KB at 1k notes (actual: 60KB index + 47KB embeddings at 125 notes)
**Constraints**: No runtime DB; no secrets in the site repo; the vault repo stays private
**Scale/Scope**: ~140 notes now, designed for ≤1,000

## Constitution Check

| Principle | Status |
|---|---|
| I. Vault is the only database | ✅ No DB or auth; schema mirrored in `content.config.ts` |
| II. Privacy by construction | ✅ Single gate + tripwire + fixtures (fixtures added in PR #3) |
| III. Static first | ✅ Static output; Functions stateless + cached. ⚠️ `/api/embed` has no rate limit (SHOULD) |
| IV. Stable URLs | ✅ v2 slugs preserved. ⚠️ Domain not yet cut over |
| V. SG/hawker/mobile first | ✅ (expanded in 002) |
| VI. Smallest useful version | ✅ One Worker folded into Pages Functions; no separate service |
| VII. Verify, then claim | ⚠️ The mirror was declared working from a manual run; launchd runs have failed since day one (see T040) |

## Architecture

```
phone/laptop ⇄ iCloud Drive ⇄ Mac vault (…/iCloud~md~obsidian/Documents/tabelog/tabelog)
                                 ├── NanoClaw (owner-managed) — follows vault CLAUDE.md
                                 └── launchd com.kahhow.tabelog-mirror (300s)
                                     git --git-dir ~/.tabelog-vault.git → ghostleek/tabelog-vault (private)
                                        └── .github/workflows/dispatch.yml → repository_dispatch vault-updated
ghostleek/tabelog-site (public) deploy.yml:
   checkout site + vault (VAULT_PAT) → sync-vault → build-search → astro build → check-privacy
   → wrangler pages deploy → Cloudflare Pages "tabelog" (+ /api/embed, /api/postal)
```

## Key Decisions (research)

| Decision | Chosen | Rejected because |
|---|---|---|
| Framework | Astro content collections | Next.js: carries v2 scaffolding; overkill for static content |
| Device sync | iCloud Drive (vault already lived there) | Obsidian Sync: needs the app running on the Mac |
| Git in iCloud | Detached git dir `~/.tabelog-vault.git` | `.git` inside iCloud: known corruption source |
| Search store | Static artifacts, no DB | Turso / SQLite FTS: unnecessary at <1k notes |
| Query embeddings | Pages Function + Workers AI (same model as build) | transformers.js: ~35MB model download on mobile |
| Fusion | Reciprocal-rank fusion (k=60) | Weighted score blend: needs tuning |
| Repo topology | Two repos; CI does a second checkout with a PAT | Submodule: leaks the private URL; Pages can't fetch it |
| Accounts | None | v2 user features were never used |

## Data Model

See vault `_meta/SCHEMA.md` (source of truth) and `src/content.config.ts` (mirror).
The site schema deliberately narrows `rating` to `highly_recommend | recommend` and
`public` to `literal(true)`: a do-not-recommend note that slips through the gate is
a type error.

## Project Structure

```text
tabelog-site/
├── scripts/
│   ├── sync-vault.mjs        # privacy gate: vault → src/data/
│   ├── build-search.mjs      # → public/search/{manifest,keyword-index,search-meta}.json, embeddings.bin
│   └── check-privacy.mjs     # tripwire on dist/
├── functions/api/
│   ├── embed.js              # GET ?q= → bge-small vector (cached 24h)
│   └── postal.js             # GET ?code= → OneMap lat/lng (cached 7d)
├── src/
│   ├── content.config.ts
│   ├── lib/{restaurants,taxonomy,saved}.ts
│   ├── layouts/Base.astro
│   ├── components/{Map,RestaurantCard,Spotlight}.astro
│   └── pages/{index,search,404}.astro, [category]/, restaurant/[slug], area/[area]/,
│         country/[country]/, saved/, search/geo.json.ts
├── tests/fixture-vault/      # synthetic notes for each gate path
├── .github/workflows/{ci,deploy}.yml
└── wrangler.jsonc            # AI binding

tabelog-vault/ (private, separate repo)
├── CLAUDE.md, Welcome.md
├── restaurants/<slug>.md, attachments/<slug>/
├── templates/restaurant.md, bases/*.base
├── _meta/{SCHEMA.md, validate.mjs, postal-areas.json, lib/js-yaml.mjs, archive/}
└── .github/workflows/dispatch.yml

Mac: ~/bin/tabelog-git-mirror.sh, ~/Library/LaunchAgents/com.kahhow.tabelog-mirror.plist
v2 repo: scripts/export-to-vault.ts (one-time migration)
```

## Complexity Tracking

None. No constitution violations require justification.
