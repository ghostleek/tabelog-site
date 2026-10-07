## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Verify every change

```bash
npm ci
npm run check   # syntax-checks functions/api, then the full build against tests/fixture-vault
```

`npm run check` needs no secrets: it runs sync-vault → build-search
(keyword-only, no embeddings) → `astro build` → `check-privacy.mjs` on a
synthetic vault. CI runs it on every PR (`.github/workflows/ci.yml`).
`npm run build` alone needs the private vault (`./vault` or `VAULT_PATH`);
`deploy.yml` handles that on push to main.

## Where things live

| Path | What |
|---|---|
| `scripts/sync-vault.mjs` | Privacy gate: vault → `src/data/` (the only content source) |
| `scripts/build-search.mjs` | `public/search/`: manifest, keyword index, embeddings |
| `scripts/check-privacy.mjs` | Tripwire: fails the build if private strings reach `dist/` |
| `src/content.config.ts` | Restaurant schema (mirrors the vault's `_meta/SCHEMA.md`) |
| `src/lib/restaurants.ts` | `getPublicRestaurants()` — the only accessor pages should use |
| `functions/api/` | Cloudflare Pages Functions (`/api/embed`, `/api/postal`) |
| `tests/fixture-vault/` | Synthetic notes covering each privacy-gate path |
| `README.md` | Content flow, CI secrets, search design |

## Rules

- Nothing reads `vault/` except `scripts/sync-vault.mjs` and `check-privacy.mjs`.
  Pages and build scripts read `src/data/` or `getPublicRestaurants()`.
- Never commit `src/data/`, `public/search/` or real vault content. Fixtures are synthetic.
- When the sync gate changes, add a fixture note that exercises it.
