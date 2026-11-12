# Feature Specification: Markdown Vault → Static Site Pipeline (tabelog v3 core)

**Feature Branch**: `001-markdown-vault-pipeline` (retroactive; built on `main`)
**Created**: 2026-07-15 (reverse-engineered 2026-10-20)
**Status**: Implemented — convergence open (see tasks.md Phase 9)
**Input**: "Rebuild as markdown-first with a NanoClaw entry surface via Telegram. Editing/updating info is tough. Use a dedicated Obsidian vault 'tabelog' as the backend, and make it structured enough to search, filter (esp. by location/proximity) and hybrid search (keyword + semantic)."

## Context: v1 → v2 → v3

| | v1 | v2 | v3 (this spec) |
|---|---|---|---|
| Data | CSV (136 rows) | Postgres/Prisma on NeonDB | Markdown notes in private Obsidian vault |
| Entry | Spreadsheet | Web admin forms + Gemini receipt OCR | Telegram agent (NanoClaw) + Obsidian on any device |
| Site | — | Next.js 14 on Vercel | Astro static on Cloudflare Pages |
| Search | — | Client-side array filters | Keyword + semantic (hybrid) + proximity |
| Auth | — | NextAuth Google, admin only | None |

## User Scenarios & Testing

### User Story 1 — Owner edits an entry without friction (Priority: P1)

The owner adds or updates a restaurant by editing a markdown note (in Obsidian, or by
telling the Telegram agent "add a visit to X yesterday, $18"), and the change reaches
version control automatically.

**Why this priority**: Editing friction was the reason for v3. If this doesn't work, nothing else matters.

**Independent Test**: Edit a note on the phone; within ~10 minutes a commit appears in `ghostleek/tabelog-vault`.

**Acceptance Scenarios**:
1. **Given** a note in `restaurants/`, **When** the owner edits it on any device, **Then** the change is committed and pushed to the private vault repo without manual git.
2. **Given** a note with schema errors, **When** `node _meta/validate.mjs <note>` runs, **Then** each error is named precisely (e.g. unquoted postal code).
3. **Given** the agent receives a receipt photo for an existing place, **When** it processes it, **Then** it offers to add a visit instead of creating a duplicate.

---

### User Story 2 — Private data never reaches the public site (Priority: P1)

The vault holds everything, including do-not-recommend places, private notes, and receipts. The public site shows only what the owner marked public.

**Why this priority**: A leak is worse than a missing feature; v2 shipped one.

**Independent Test**: `npm run check` against `tests/fixture-vault` passes; the private and do-not-recommend fixtures' names appear nowhere in `dist/`.

**Acceptance Scenarios**:
1. **Given** a note with `rating: do_not_recommend` and `public: true`, **When** the site builds, **Then** no page, index, or JSON contains it, and `/restaurant/<slug>` 404s.
2. **Given** a public note with a `%%private%%` passage, **When** built, **Then** the passage is absent from all output.
3. **Given** a note listing `receipt-*.jpg` in `photos`, **When** built, **Then** the build fails.

---

### User Story 3 — Visitor finds food by place, keyword, or meaning (Priority: P2)

A visitor searches by dish, place, or vibe ("late night supper noodles"), or by proximity to their location or a postal code.

**Why this priority**: The main visitor value. The site is still useful without it, as browse pages.

**Independent Test**: On `/search`, a vibe query returns relevant results marked "hybrid"; postal 069184 orders results nearest first; with `/api/embed` down, keyword results still appear.

**Acceptance Scenarios**:
1. **Given** a keyword query, **When** typed, **Then** results appear within ~150ms with fuzzy/prefix matching weighted toward name and dish.
2. **Given** a semantic query, **When** the embedding returns, **Then** results re-rank via reciprocal-rank fusion.
3. **Given** "Near me" or a 6-digit postal code, **When** applied, **Then** results show distance and can sort by it.

---

### User Story 4 — v2 links keep working (Priority: P2)

Existing URLs and SEO equity survive the cutover.

**Independent Test**: Every `/restaurant/<slug>` URL from the v2 database resolves on the v3 build (excluding non-public entries).

**Acceptance Scenarios**:
1. **Given** a public v2 slug, **When** requested on v3, **Then** HTTP 200 with the same restaurant.
2. **Given** `tabelog.kahhow.com`, **When** DNS resolves, **Then** it serves the v3 Pages deployment.

### Edge Cases

- Unclosed `%%` → build fails (would otherwise leak trailing content).
- Note missing `public` → not published (default private).
- Postal code written unquoted in YAML (leading zero lost) → validator error.
- Overseas entries without postal codes → no coordinates; excluded from map and proximity, still listed.
- iCloud evicts files from the Mac → mirror must download them before committing.
- Embedding service down → keyword-only search.

## Requirements

### Functional Requirements

- **FR-001**: The vault MUST hold one note per restaurant; filename = slug (v2 slug rule).
- **FR-002**: Frontmatter MUST follow `_meta/SCHEMA.md` (name, rating, categories, address, postal_code, area, country, lat/lng, price_per_pax, is_hawker, public, website, google_maps, dishes[], visits[], prior_visits, photos[], cover, created, updated).
- **FR-003**: `_meta/validate.mjs` MUST validate one note or all notes, with a `--digest` summary for a weekly owner report.
- **FR-004**: All v2 rows MUST be migrated (140 notes), geocoding missing coordinates via OneMap where a postal code exists.
- **FR-005**: Vault changes MUST be mirrored to `ghostleek/tabelog-vault` automatically, with the git directory kept outside iCloud.
- **FR-006**: The site build MUST publish only notes with `public: true` and rating ≠ `do_not_recommend`, strip `%%` blocks, and refuse receipt images.
- **FR-007**: A post-build tripwire MUST fail the build if any private string appears in output.
- **FR-008**: The site MUST provide `/`, `/[category]` (mains, desserts, coffee, cakes, alcohol, all, featured, global), `/restaurant/[slug]`, `/area/[area]`, `/search`, sitemap, robots.txt, and JSON-LD Restaurant markup.
- **FR-009**: Search MUST support keyword (MiniSearch), semantic (bge-small embeddings, int8), and proximity (geolocation or postal → OneMap → haversine), fused by RRF.
- **FR-010**: Semantic search MUST degrade to keyword-only on failure.
- **FR-011**: A vault push MUST trigger a site rebuild and deploy (`repository_dispatch: vault-updated`).
- **FR-012**: `tabelog.kahhow.com` MUST serve the v3 deployment after cutover; v2 (Vercel, NeonDB) is then decommissioned, with a final DB dump archived in the vault.
- **FR-013**: The Telegram agent MUST follow the vault's `CLAUDE.md` contract (dedupe before create, never guess rating, validate after write, receipts private).

### Key Entities

- **Restaurant note**: one markdown file; frontmatter is the structured record, body is the public review, `%%` blocks are private notes.
- **Visit**: `{date, spend?, note?}` appended to `visits[]`; total visits = `prior_visits + visits.length`.
- **Dish**: `{name, price?, signature?}`.
- **Search artifacts**: `manifest.json`, `keyword-index.json`, `embeddings.bin` + `search-meta.json`, `geo.json`.

## Success Criteria

- **SC-001**: An edit to a note is live on the site within 15 minutes, with no manual step.
- **SC-002**: Zero private strings in any build (tripwire green on every deploy).
- **SC-003**: 100% of public v2 slugs resolve on v3.
- **SC-004**: Search artifacts under 500KB total at 1,000 notes.
- **SC-005**: No server, database, or paid service required to run the site.

## Assumptions

- The owner runs NanoClaw separately; this repo only ships the contract it follows (in the vault).
- The Mac hosting the vault is usually awake.
- Saved lists and accounts are out of scope (see 002 for device-local save).
