# Feature Specification: Landing Page UX — Singapore Default, Archives Spotlight, Save

**Feature Branch**: `002-landing-page-ux` (retroactive; built on `main`, commit 638279f)
**Created**: 2026-08-15 (reverse-engineered 2026-10-20)
**Status**: Implemented — convergence open (see tasks.md Phase 9)
**Input**: "Not satisfied with the MVP layout. UX audit first, then push to prod. Filter by country, set SG by default. Feature a random historic record from Singapore that is highly rated; allow me to save."

## UX audit that motivated this (2026-08-15, live site at 375px and desktop)

1. Overseas entries rendered a meta line starting with an orphan "·" (empty area).
2. `$`/`$$`/`$$$` bands hid the actual per-person price the data had.
3. Categories showed as a lone emoji with no label.
4. On touch screens the map captured scroll, trapping the page.
5. Homepage mixed 28 overseas places into Singapore-first sections with no way to scope.
6. Nothing on the page rewarded a return visit; every load looked the same.

## User Scenarios & Testing

### User Story 1 — Land in Singapore by default (Priority: P1)

A visitor arriving on `/` sees Singapore only: hero count, featured, recently visited, areas, and map markers. Other countries are one tap away.

**Why this priority**: ~78% of entries are Singapore; the audience searches locally.

**Independent Test**: The hero reads "N Singapore places … Plus M beyond"; no overseas name appears in homepage sections; the country selector reaches `/country/<name>` and `/all`.

**Acceptance Scenarios**:
1. **Given** the homepage, **When** loaded, **Then** featured, recent, area chips, and map markers are Singapore-only.
2. **Given** the country selector, **When** "Japan" is chosen, **Then** the browser goes to `/country/japan` listing only Japan entries, with a link back.
3. **Given** a category page, **When** loaded, **Then** Singapore entries show first and overseas entries sit in a collapsed "N more beyond Singapore" section.
4. **Given** search with the default Singapore facet and a query matching only overseas entries, **When** zero results, **Then** a one-tap "search everywhere" appears.

---

### User Story 2 — Rediscover an overdue favourite (Priority: P1)

The homepage features one random highly-rated Singapore place not visited in 6+ months, with its review snippet and how long it's been, plus "another one".

**Why this priority**: Directly serves the site's first purpose: remembering food worth revisiting.

**Independent Test**: Reload the homepage several times; the spotlight changes, is always ⭐ + Singapore, and shows "Last visited … ago".

**Acceptance Scenarios**:
1. **Given** highly-rated Singapore entries with last visits ≥6 months ago, **When** the page loads, **Then** one is shown at random.
2. **Given** none qualify, **When** the page loads, **Then** it falls back to any highly-rated Singapore entry.
3. **Given** "🔀 another one", **When** tapped, **Then** a different entry shows.
4. **Given** the manifest fails to load, **When** the page renders, **Then** the spotlight section stays hidden (no broken card).

---

### User Story 3 — Save places to come back to (Priority: P2)

Any visitor can ♡ a place (spotlight or detail page) and see their list at `/saved`. Saves stay on that device; there are no accounts.

**Independent Test**: Save from the spotlight → header "♥ Saved" → the entry is listed; ✕ removes it; reload persists.

**Acceptance Scenarios**:
1. **Given** an unsaved place, **When** ♡ is tapped, **Then** the button reads "♥ Saved" (aria-pressed=true) and the slug is stored.
2. **Given** `/saved` with no saves, **When** opened, **Then** an empty state links to the spotlight.
3. **Given** storage blocked (private mode), **When** save is tapped, **Then** nothing breaks.

---

### User Story 4 — Cards that answer "is it worth it?" at a glance (Priority: P2)

Each card shows area (and country if not Singapore), `~$X/pax`, labelled category chips, hawker chip, and "eaten N×" when visited more than once.

**Independent Test**: An overseas card with no area has no leading "·"; a hawker card shows the chip.

### Edge Cases

- Entry with no area and no price → meta line omitted entirely.
- Touch device → map inert until "Tap to explore the map".
- Country values that aren't countries (e.g. `London`) → appear verbatim in the selector (data issue, see tasks).
- Saved slug later made private → silently dropped from `/saved` (manifest lookup misses).

## Requirements

### Functional Requirements

- **FR-001**: Homepage sections and map MUST default to `country == Singapore`.
- **FR-002**: The site MUST generate `/country/[slug]` for every non-Singapore country with public entries.
- **FR-003**: The homepage MUST offer a country selector (Singapore, each other country, Everywhere).
- **FR-004**: Search MUST include a country facet defaulting to Singapore, with a widen-on-zero-results affordance.
- **FR-005**: Category pages (except all/global) MUST list Singapore first and collapse overseas.
- **FR-006**: The homepage MUST show a client-side random spotlight from highly-rated Singapore entries not visited in ≥6 months, falling back to all highly-rated Singapore entries.
- **FR-007**: The spotlight MUST show name, rating, area, price, hawker flag, review snippet (≤180 chars), and time since last visit, with shuffle and save.
- **FR-008**: Save MUST be available on the spotlight and on every detail page, persisted in `localStorage` key `tabelog-saved`, listed at `/saved` with remove.
- **FR-009**: Cards MUST render a meta line without empty separators and show `~$X/pax`, category chips, hawker chip, and visit count when >1.
- **FR-010**: On touch devices the map MUST NOT capture scroll until explicitly activated.
- **FR-011**: The build MUST emit `public/search/manifest.json` (slug, name, area, rating, price, hawker, country, categories, lastVisit, visitCount, snippet) from sanitized data only.

### Key Entities

- **Manifest entry**: the public, sanitized summary used by the spotlight, `/saved`, and search facets.
- **Saved list**: a device-local array of slugs; no server copy.

## Success Criteria

- **SC-001**: At 375px, the first screen shows the hero, category chips, country selector, and the start of the spotlight.
- **SC-002**: Zero overseas entries in homepage sections.
- **SC-003**: Save → `/saved` round trip works with no network calls beyond the static manifest.
- **SC-004**: No layout artefacts (orphan separators, empty chips) on any card.

## Assumptions

- Device-local save is acceptable; cross-device sync is out of scope (Constitution III).
- "Historic" = last visit ≥6 months ago; the window only bites once new visits are logged.
