# Racing Lab scratching bridge (partial, safe)

This package is NOT a live scratching feed and NOT a pace/model rerun. It shows conditional probability normalization ONLY after a human or separate verified scraper has published a dated, sourced feed. The supplied feed is intentionally empty. No fictional scratchings.

1. Upload `racing-lab-scratchings-live.js` and `scratchings-engine.js` to repository root, and `data/verified-scratchings.json` to the `data` folder. Preserve the folder path.
2. Add these two tags in `index.html` **after the existing hybrid script and before the main app inline script** (or anywhere after the page's scripts have loaded):

```html
<script src="/scratchings-engine.js" defer></script>
<script src="/racing-lab-scratchings-live.js" defer></script>
```

3. Populate `data/verified-scratchings.json` only after verifying an official source, e.g. (ILLUSTRATIVE ONLY, NOT REAL SCRATCHINGS):

```json
{"races":{"2026-10-31_RANDWICK_R01":{"scratchings":["EXAMPLE HORSE"],"asOf":"2026-10-31T08:00:00+11:00","sourceUrl":"https://official.example/scratchings"}}}
```

The example must not be published as genuine. Race IDs must match the actual board. The board still contains Oct 17 data until new Oct 31 fields and model forecasts are published. The bridge will not silently update the simulator; conditional probabilities are explicitly labeled and only affect the displayed runner board and top-three percentages. Re-ranking top three, re-running pace, sourcing live scratchings, and auto-publishing still need implementation.
