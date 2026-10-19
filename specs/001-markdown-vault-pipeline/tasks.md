---
description: "Tasks for 001 — reverse-engineered from what shipped (2026-07-15 → 2026-10-03)"
---

# Tasks: Markdown Vault → Static Site Pipeline

**Input**: [spec.md](spec.md), [plan.md](plan.md)
**Legend**: `[x]` done and verified · `[ ]` open · `[OWNER]` needs the owner (credentials, DNS, macOS permissions) · *ref* = commit or PR

## Phase 1: Setup

- [x] T001 Create private repo `ghostleek/tabelog-vault` and the detached git dir `~/.tabelog-vault.git` *(vault 479ab16)*
- [x] T002 Scaffold Astro project `tabelog-site` with Tailwind, sitemap, Leaflet, MiniSearch *(c5a47e5)*
- [x] T003 [P] Create Cloudflare Pages project `tabelog` with an AI binding in `wrangler.jsonc` *(c5a47e5)*

## Phase 2: Foundational (vault contract)

- [x] T004 Write `_meta/SCHEMA.md` frontmatter contract (vault)
- [x] T005 [P] Write `_meta/validate.mjs` with vendored js-yaml, `--all` and `--digest` (vault)
- [x] T006 [P] Export v2 postal mapping to `_meta/postal-areas.json` (vault)
- [x] T007 [P] Add `templates/restaurant.md` and `bases/{all,needs-attention,by-area}.base` (vault)

## Phase 3: US1 — Frictionless owner edits (P1)

- [x] T010 [US1] Write `scripts/export-to-vault.ts` in the v2 repo; migrate 140 rows (OneMap geocode pass, js-yaml dump)
- [x] T011 [US1] Write vault `CLAUDE.md` agent contract (add/edit flows, dedupe, receipts private, validate after write)
- [x] T012 [US1] Write `~/bin/tabelog-git-mirror.sh` (60s debounce, iCloud download, `cd` into work tree, pull --rebase -X theirs) and launchd plist
- [x] T013 [US1] Vault `.github/workflows/dispatch.yml` → `vault-updated` (skips without `SITE_DISPATCH_PAT`) *(vault ab116a8)*

## Phase 4: US2 — Privacy by construction (P1)

- [x] T020 [US2] `scripts/sync-vault.mjs`: public + rating gate, `%%` strip, unclosed-`%%` failure, receipt refusal *(c5a47e5)*
- [x] T021 [US2] `src/content.config.ts` narrowed schema; `getPublicRestaurants()` re-asserts filters *(c5a47e5)*
- [x] T022 [US2] `scripts/check-privacy.mjs` tripwire wired into `npm run build` *(c5a47e5)*
- [x] T023 [US2] `tests/fixture-vault/` (public hawker, private, do-not-recommend, abroad) + `npm run check` + CI on PRs *(PR #3)*

## Phase 5: US3 — Search (P2)

- [x] T030 [US3] `scripts/build-search.mjs`: MiniSearch index, bge-small int8 embeddings with hash cache *(c5a47e5)*
- [x] T031 [P] [US3] `functions/api/embed.js` (Workers AI, cached) and `functions/api/postal.js` (OneMap proxy)
- [x] T032 [US3] `src/pages/search.astro`: RRF fusion, proximity, facets, keyword-only fallback
- [x] T033 [US3] `src/pages/search/geo.json.ts` shared by the map and proximity search

## Phase 6: US4 — Stable URLs (P2)

- [x] T034 [US4] `/restaurant/[slug]`, `/[category]` (incl. all/featured/global), `/area/[area]`, JSON-LD, sitemap, robots.txt *(c5a47e5, d731087)*
- [x] T035 [US4] Attach custom domain `tabelog.kahhow.com` to Pages project (status: pending validation)
- [x] T036 [US4] Archive final NeonDB `pg_dump` + v1 CSV to vault `_meta/archive/` *(vault 11edace)*

## Phase 7: Polish

- [x] T037 [P] Fix v2 leak `&&`→`||` in v2 `app/restaurant/[slug]/page.tsx:25` (edited, **not committed or deployed**; moot after T043)
- [x] T038 [P] `npm audit fix` *(7f6856f)*

---

## Phase 9: Convergence (2026-10-20)

Assessment of the code and live state against spec/plan/constitution. Each task names the requirement it closes and the gap type.

- [ ] T040 [OWNER] [US1] **contradicts FR-005 / SC-001.** The launchd mirror has never succeeded: macOS blocks launchd's `/bin/bash` from reading `~/Library/Mobile Documents` ("Operation not permitted", exit 128, 17k log lines). The July "verified" run was manual from Terminal. Fix: System Settings → Privacy & Security → Full Disk Access → add `/bin/bash` (broad grant), **or** wrap the script in a small Automator/Shortcuts app and grant FDA to that only (narrower; recommended). Verify: edit `Welcome.md`, wait 6 min, see a `vault sync` commit.
- [ ] T041 [OWNER] [US1] **missing FR-011.** No Actions secrets exist on either repo, so every Deploy run since 2026-07-15 has failed in ~6s and vault pushes trigger nothing. Add `VAULT_PAT` (fine-grained, contents:read on tabelog-vault), `CLOUDFLARE_API_TOKEN` (Pages:Edit + Workers AI:Read), `CLOUDFLARE_ACCOUNT_ID` to tabelog-site, and `SITE_DISPATCH_PAT` (contents:write on tabelog-site) to tabelog-vault. Verify: `gh workflow run deploy.yml` goes green.
- [ ] T042 [Workflow] **contradicts Constitution → Development Workflow.** Close draft PR #4 ("Restrict Deploy workflow to vault updates"): it removes the `push` trigger to silence the missing-secret failure, which would stop site-code changes from ever deploying. The fix is T041. Optionally, add a first step in `.github/workflows/deploy.yml` that fails with "VAULT_PAT not set" instead of an opaque checkout error.
- [ ] T043 [OWNER] [US4] **missing FR-012 / US4-AC2.** `tabelog.kahhow.com` still CNAMEs to Vercel (`…vercel-dns-017.com`). In Cloudflare DNS for kahhow.com, set `tabelog` CNAME → `tabelog.pages.dev`, proxied. Verify: `curl -sI https://tabelog.kahhow.com` shows `server: cloudflare` and the "Singapore places" hero.
- [ ] T044 [OWNER] [US4] **partial FR-012.** After T043 is stable for a week: delete the Vercel project and NeonDB (dump already archived, T036). Until then, the 15 do-not-recommend pages are reachable on v2 (T037 is uncommitted).
- [ ] T045 [P] [US3] **partial — Constitution III (SHOULD rate-limit).** `functions/api/embed.js` is cached but unlimited. Add a per-IP limit (Cloudflare Rate Limiting rule on `/api/embed*`, e.g. 30 req/min) or an in-function check; reject over-limit with 429 so the client falls back to keyword-only.
- [ ] T046 [OWNER] [US1] **missing FR-003 (scheduled digest).** Schedule NanoClaw to run `node _meta/validate.mjs --all --digest` weekly and send the output to Telegram. Also doubles as a heartbeat for T040.
- [ ] T047 [US1] **unverified FR-013 / SC-001.** The vault has had zero commits since 2026-07-15, so the Telegram/Obsidian edit loop has never run end-to-end. After T040–T041: add one real visit via the bot and confirm it appears on the live site within 15 minutes. This is the acceptance test for the whole v3 premise.
