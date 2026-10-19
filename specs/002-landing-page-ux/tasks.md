---
description: "Tasks for 002 — reverse-engineered from commit 638279f (2026-08-15)"
---

# Tasks: Landing Page UX

**Input**: [spec.md](spec.md), [plan.md](plan.md)
**Legend**: `[x]` done and verified · `[ ]` open · `[OWNER]` needs the owner

## Phase 1: Foundational

- [x] T001 Emit `public/search/manifest.json` (+ lastVisit, visitCount, snippet) in `scripts/build-search.mjs`
- [x] T002 [P] Add `src/lib/saved.ts` (localStorage wrapper with try/catch)

## Phase 2: US1 — Singapore by default (P1) 🎯

- [x] T010 [US1] Scope `src/pages/index.astro` sections to Singapore; hero "N Singapore … Plus M beyond"
- [x] T011 [US1] Country selector on homepage → `/country/[slug]` or `/all`
- [x] T012 [P] [US1] `src/pages/country/[country]/index.astro`
- [x] T013 [P] [US1] `Map.astro` `country` prop filters markers
- [x] T014 [US1] `[category]` pages: Singapore first, overseas in `<details>`
- [x] T015 [US1] Search country facet (default Singapore) + "search everywhere" on zero results

## Phase 3: US2 — Archives spotlight (P1)

- [x] T020 [US2] `src/components/Spotlight.astro`: ⭐ + Singapore + ≥6 months pool, fallback, shuffle, hidden on fetch failure
- [x] T021 [US2] Place the spotlight under the hero in `index.astro`

## Phase 4: US3 — Save (P2)

- [x] T030 [US3] Save button on the spotlight and on `restaurant/[slug].astro` (aria-pressed)
- [x] T031 [US3] `src/pages/saved/index.astro` with remove + empty state; header "♥ Saved" link

## Phase 5: US4 — Cards & map (P2)

- [x] T040 [US4] `RestaurantCard.astro`: no orphan separators, `~$X/pax`, labelled chips, hawker chip, "eaten N×"
- [x] T041 [P] [US4] Map touch unlock overlay; height reduced to 340px on mobile
- [x] T042 Deploy to Cloudflare Pages and verify at 375px (spotlight, save → /saved, /country/united-states)

---

## Phase 9: Convergence (2026-10-20)

- [ ] T050 [OWNER] [US1] **contradicts FR-003 intent.** The selector lists `🌏 London` because 3 notes store a city as the country (`dishoom-35`, `halfcup-33`, `speedy-s-sandwich-cafe-and-bar-34`). Change to `country: United Kingdom` (optionally keep the city in `area: London`) in the vault. Then `/country/london` becomes `/country/united-kingdom`; nothing links to the old path yet, so no redirect is needed.
- [ ] T051 [P] [US1] **partial SC-001 / link sharing.** The homepage emits no `og:image` (verified on the live HTML), so a shared link has no preview image, and no entry has a `cover`. Add a static default OG image at `public/og-default.png` (1200×630) and pass it from `Base.astro` when a page provides none.
- [ ] T052 [US2] **partial FR-006 (data-dependent).** The "≥6 months" filter currently excludes nothing: all 42 highly-rated Singapore entries qualify because no visit has been logged since July (depends on 001/T040–T047). No code change; re-check once visits flow. If the pool is still the whole set after a month of logging, shorten the window to 3 months.
- [ ] T053 [P] [US1] **partial FR-001 (area quality).** Area chips come from the coarse 2-digit postal map (e.g. one-north shows as "Tiong Bahru"). Refine vault `_meta/postal-areas.json` toward the 28 postal districts, or override `area` in the affected notes. Visible on the homepage "By area" row.
- [ ] T054 [US3] **missing — Edge case "saved slug made private".** Not a bug; already handled by the manifest lookup. Verify once with a fixture: save `fixture-public-hawker`, flip it private in a local fixture copy, rebuild, and confirm `/saved` drops it without errors. Close this task if it passes.
