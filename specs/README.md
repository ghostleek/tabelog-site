# tabelog specs

Spec Kit (`specify` CLI) tracks every non-trivial change here. Governing rules:
[`.specify/memory/constitution.md`](../.specify/memory/constitution.md).

**Flow for new work:** `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` →
`/speckit-implement` → `/speckit-converge` (appends what's still unbuilt to tasks.md).
The active feature is set in `.specify/feature.json`.

## Features

| # | Feature | Shipped | Status | Open tasks |
|---|---|---|---|---|
| 001 | [Markdown vault → static site pipeline](001-markdown-vault-pipeline/spec.md) | 2026-07-15 | Built; pipeline not yet automated end to end | 8 (6 owner) |
| 002 | [Landing page UX: SG default, archives spotlight, save](002-landing-page-ux/spec.md) | 2026-08-15 | Built and live on tabelog.pages.dev | 5 (2 owner) |

## Version history

| Version | When | What changed |
|---|---|---|
| v1 | 2024 | Google Sheet / CSV (136 rows), no site |
| v2 | 2026-02 | Next.js + Postgres (NeonDB) on Vercel; admin forms, Gemini receipt OCR, Leaflet map, client-side filters |
| v3.0 | 2026-07-15 | 001: Obsidian vault as database (140 notes migrated), git mirror, Astro on Cloudflare Pages, privacy gate + tripwire, hybrid search |
| v3.1 | 2026-08-15 | 002: Singapore default, `/country/*`, archives spotlight, device-local save, card redesign, touch-safe map |
| v3.1.1 | 2026-10-03 | PR #3: agent harness, `npm run check`, fixture vault, CI on PRs |
| — | 2026-10-20 | Spec Kit installed; 001/002 backfilled; constitution v1.0.0 |

## Critical path to "live on tabelog.kahhow.com and self-updating"

1. 001/T041 — add the four Actions secrets (deploys have failed since July)
2. 001/T042 — close PR #4 (it disables push deploys instead of fixing secrets)
3. 001/T040 — grant the mirror Full Disk Access (it has never run under launchd)
4. 001/T043 — flip the DNS CNAME to `tabelog.pages.dev`
5. 001/T047 — log one real visit via Telegram and watch it go live
