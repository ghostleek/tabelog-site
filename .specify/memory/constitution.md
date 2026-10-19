<!--
Sync Impact Report
- Version: (template) → 1.0.0 — initial ratification, reverse-engineered from the
  v3 build (2026-07-15) and UX round 2 (2026-08-15).
- Principles added: I–VII (all new).
- Sections added: Technology & Hosting Constraints, Development Workflow, Governance.
- Templates: plan-template.md Constitution Check gates map 1:1 to principles below ✅;
  spec-template.md, tasks-template.md unchanged (compatible) ✅.
- Deferred TODOs: none.
-->

# tabelog Constitution

tabelog (tabelog.kahhow.com) is one person's food journal published as a public,
static, search-first site. Primarily Singapore, hawkers first, worldwide second.
Its reason to exist: remember food worth revisiting, and let others find it.

## Core Principles

### I. The Vault Is the Only Database

All restaurant data lives as one markdown note per restaurant (YAML frontmatter +
body) in the private Obsidian vault `ghostleek/tabelog-vault`. The vault's
`_meta/SCHEMA.md` is the data contract; `src/content.config.ts` MUST mirror it.

- There MUST be no runtime database, CMS, admin UI, or auth system.
- Data is changed by editing notes (Obsidian or the Telegram agent), never by the site.
- A schema change MUST land in `_meta/SCHEMA.md`, `_meta/validate.mjs`, and
  `src/content.config.ts` together.

*Rationale:* v2's pain was editing friction through web forms backed by Postgres.
Plain files are editable from any device, diffable, and versioned in git.

### II. Privacy by Construction (NON-NEGOTIABLE)

Private data MUST be unrepresentable in the published site, not merely hidden.

- `scripts/sync-vault.mjs` is the only reader of the vault and the only gate.
  A note publishes iff `public: true` AND `rating != do_not_recommend`.
- `%%…%%` blocks MUST be stripped; an unclosed `%%` MUST fail the build.
- Images publish only if listed in `photos`/`cover`; any `receipt-*` path MUST fail the build.
- `scripts/check-privacy.mjs` MUST run after every build and fail on any leak.
- Every change to the gate MUST add a fixture note in `tests/fixture-vault/` exercising it.
- Nothing may be committed from `src/data/`, `public/search/`, or the real vault.

*Rationale:* v2 leaked do-not-recommend entries through a single `&&`/`||` bug in a
page component. Filtering at one chokepoint, plus a tripwire, removes that bug class.

### III. Static First, Stateless Edges

The site MUST build to static files. Server code is limited to Cloudflare Pages
Functions that are stateless, cached, and side-effect free (`/api/embed`, `/api/postal`).

- No server-side user state. Per-visitor features (e.g. saved places) MUST use
  browser storage and degrade gracefully when it is unavailable.
- Every client feature that depends on a Function MUST degrade silently
  (e.g. hybrid search falls back to keyword-only).
- Public Functions SHOULD be rate-limited and cached.

### IV. Stable URLs

Public URLs are SEO equity. The note filename IS the slug IS the URL
(`/restaurant/<slug>`), using v2's slug rule exactly. v2 URL shapes
(`/restaurant/[slug]`, `/[category]`, `/all`, `/featured`, `/global`) MUST keep
resolving. Renaming a note requires an explicit redirect.

### V. Singapore First, Hawkers First, Mobile First

Default scope everywhere is Singapore; other countries are one deliberate tap away,
never silently dropped (zero-result states MUST offer "search everywhere").
Hawker stalls get visible priority. Every UI change MUST be verified at 375px width.
Ratings shown publicly are only `highly_recommend` and `recommend`.

### VI. Smallest Useful Version

Ship the smallest version that changes the outcome; prove a need manually before
automating it. New infrastructure (services, stores, pipelines) MUST name the
recurring need it serves and who maintains it. Prefer deleting scaffolding over
carrying it (v2 carried unused Cloudinary, tables, and forms).

### VII. Verify, Then Claim

A change is done only when observed working:

- `npm run check` MUST pass (syntax-checks Functions, builds against the fixture
  vault, runs the privacy tripwire). CI runs it on every PR.
- UI changes MUST be checked in a browser at mobile and desktop widths.
- Status reports MUST distinguish verified, inferred, and owner-side steps.

## Technology & Hosting Constraints

- Astro 7 static output + Tailwind 4; Leaflet/OSM for maps; MiniSearch for keyword
  search; `@cf/baai/bge-small-en-v1.5` embeddings, the same model at build and query time.
- Hosting: Cloudflare Pages project `tabelog`, Pages Functions with a Workers AI binding.
- Geocoding: OneMap (Singapore, keyless). Postal → area via vault `_meta/postal-areas.json`.
- Two repos: `tabelog-site` (public, code only) and `tabelog-vault` (private, data only).
  CI joins them at build time with a read-only token.

## Development Workflow

- Spec Kit flow for any non-trivial change: specify → plan → tasks → implement →
  converge. Specs live in `specs/NNN-name/`.
- Branch from `main`; PRs must pass CI (`npm run check`).
- `deploy.yml` builds with the real vault and deploys. A failing deploy is a defect,
  not noise: fix the cause (e.g. missing secret), not the trigger.
- Owner-side steps (DNS, secrets, macOS permissions) are tracked as tasks marked
  `[OWNER]` so they don't disappear between sessions.

## Governance

This constitution supersedes other conventions in this repo. `AGENTS.md` holds
runtime guidance and MUST NOT contradict it. Amendments: edit this file, bump the
version (MAJOR: principle removed/redefined; MINOR: principle added/expanded;
PATCH: wording), update the Sync Impact Report, and update any spec/plan that a
change invalidates. `/speckit-converge` treats every MUST here as a gate.

**Version**: 1.0.0 | **Ratified**: 2026-07-15 | **Last Amended**: 2026-10-20
