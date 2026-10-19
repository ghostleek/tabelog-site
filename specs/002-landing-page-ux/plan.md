# Implementation Plan: Landing Page UX

**Branch**: `002-landing-page-ux` | **Date**: 2026-08-15 (backfilled 2026-10-20) | **Spec**: [spec.md](spec.md)

## Summary

Scope the homepage to Singapore at build time; add static per-country pages; add a
client-side "From the archives" spotlight and device-local save, both fed by a new
sanitized `manifest.json` emitted by `build-search.mjs`; redesign cards; make the map
touch-safe.

## Technical Context

**Language/Version**: TypeScript in Astro `<script>` islands; Node ESM build script
**Primary Dependencies**: Existing (Astro 7, Tailwind 4, Leaflet). No new dependencies.
**Storage**: `localStorage["tabelog-saved"]` (device-local); `public/search/manifest.json` (static)
**Testing**: `npm run check`; browser verification at 375px and desktop
**Target Platform**: Static pages on Cloudflare Pages
**Constraints**: No server state (Constitution III); manifest built only from `src/data/` (Constitution II)
**Scale/Scope**: Manifest ~30KB at 125 entries

## Constitution Check

| Principle | Status |
|---|---|
| II. Privacy by construction | ✅ Manifest is built from sanitized `src/data/`; tripwire scans it |
| III. Static first | ✅ Save is localStorage-only; spotlight is client-side random over a static file |
| IV. Stable URLs | ✅ Additive routes only (`/country/*`, `/saved`) |
| V. SG first / mobile first | ✅ This feature *is* principle V; verified at 375px |
| VI. Smallest useful version | ✅ No accounts or sync; reuses the existing build step |

## Key Decisions

| Decision | Chosen | Rejected because |
|---|---|---|
| Country default | Build-time filter on `/` + static `/country/*` pages | Client-side filter: worse SEO, flash of unfiltered content |
| Spotlight randomness | Client-side per pageview | Build-time pick: same item until the next deploy |
| "Historic" | Last visit ≥ 6 months, fall back to all ⭐ SG | Never-revisited only: pool too small |
| Save | `localStorage`, public to any visitor | Owner-only gate: cosmetic, not security; sync needs state |
| Map on touch | Inert + "Tap to explore" overlay | Two-finger gesture: undiscoverable |

## Project Structure (touch points)

```text
scripts/build-search.mjs                 # + manifest.json (lastVisit, visitCount, snippet)
src/lib/saved.ts                         # NEW getSaved / isSaved / toggleSaved
src/components/Spotlight.astro           # NEW archives spotlight island
src/components/RestaurantCard.astro      # meta-line fix, chips, ~$X/pax, eaten N×
src/components/Map.astro                 # country prop, touch unlock overlay
src/layouts/Base.astro                   # header ♥ Saved link
src/pages/index.astro                    # SG scope, country selector, spotlight placement
src/pages/[category]/index.astro         # SG first, overseas in <details>
src/pages/country/[country]/index.astro  # NEW
src/pages/saved/index.astro              # NEW
src/pages/restaurant/[slug].astro        # save button
src/pages/search.astro                   # country facet + widen-on-zero
```

## Complexity Tracking

None.
