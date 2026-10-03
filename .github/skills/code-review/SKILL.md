---
name: code-review
description: Review pull requests for tabelog-site, the public Astro + Cloudflare Pages site built from a private Obsidian restaurant vault (privacy-gated sync, hybrid search, Leaflet map). Use when reviewing any PR in this repo.
---

# Reviewing tabelog-site PRs

The site is published from a **private** vault. The worst bug here is a
private note, `%%…%%` aside or receipt photo reaching `dist/`. Rank that
above everything else.

Read `AGENTS.md` first and check every changed line against its Rules.
Don't repeat what CI already enforces (`npm run check`: functions syntax,
full build on `tests/fixture-vault`, `check-privacy.mjs` tripwire).

## Bug classes from this repo's history — check each one

1. **Privacy bypass via a new output.** `638279f` added `public/search/manifest.json`
   (name, snippet, visits) next to the keyword index and `geo.json`. Every new
   output must be built from `src/data/` or `getPublicRestaurants()`, never from
   `vault/`. Snippets and body text must come after `%%` stripping. New fields
   copied from frontmatter (e.g. `spend`, `note` on visits) must be safe to
   publish. If `sync-vault.mjs` changes, ask for a fixture note that exercises it.
2. **Orphaned separators and empty fragments in meta lines.** `638279f` fixed
   card meta rendering ` · Japan` when `area` was missing. Build such lines as
   `[a, b, c].filter(Boolean).join(' · ')`, and check what renders when optional
   fields (`area`, `price_per_pax`, `country`, `visits`) are absent or `0`.
3. **Map hijacking page scroll on touch.** `638279f` made the Leaflet map inert
   on `(pointer: coarse)` until tapped. Flag changes that re-enable `dragging`
   or `scrollWheelZoom` by default, or a second map that skips the unlock chip.
4. **Country filter inconsistency.** `638279f` made Singapore the default on
   the home page, map (`country` prop), search facet and category pages. A new
   list or view must apply the same default, offer a way to widen to
   everywhere, and not dead-end on zero results. Removing a link must not
   remove a route: `/all`, `/featured`, `/global` stay for v2 URL parity.
5. **Dependency and lockfile drift.** `7f6856f` (npm audit fix) and the
   Dependabot bumps (astro, svgo) touch only `package-lock.json`. Check
   `package.json` and the lockfile agree (`npm ci` fails otherwise) and that a
   major Astro bump keeps `astro:content` loaders and `image()` schema working.

## Also flag

- Search code that assumes `embeddings.bin` or `/api/embed` exists. CI builds
  keyword-only; search must degrade silently.
- Pages Functions that cache on unnormalized input, or skip input validation
  (`/api/postal` requires a 6-digit code before calling OneMap).
- A new secret or env var missing from the README "CI secrets" table, or
  passed to a step that doesn't need it.

## Using context

The GitHub MCP server is available read-only. Use it to read the full file
around a change, the linked issue, and earlier PRs on the same files.

## Style of comments

One finding per comment, with the concrete input that breaks (a note's
frontmatter, a viewport, a URL). Skip formatting and naming nits; there is no
linter here.
