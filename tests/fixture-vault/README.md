Synthetic vault for `npm run check` and CI. Contains no real restaurant data.
Covers each privacy-gate path in `scripts/sync-vault.mjs`: a published SG note
with a `%%…%%` block, a published overseas note, a `public: false` note and a
`do_not_recommend` note. `scripts/check-privacy.mjs` must report zero leaks.

The London fixture uses `country: United Kingdom` and `area: London`.
`check-country-redirect.mjs` verifies both legacy country URLs redirect to a built UK page containing every UK entry.
