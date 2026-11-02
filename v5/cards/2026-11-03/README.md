# V5 Feature Form import — 3 November 2026

The active V5 card now reads the supplied Randwick and Flemington PDFs. The
existing model calculates every listed entry; no model coefficient changes or
independent selection overrides were made.

| Source | Pages | Races | Listed entries |
| --- | ---: | ---: | ---: |
| 469223(1).pdf — Randwick | 89 | 10 | 168 |
| 469224(1).pdf — Flemington | 82 | 10 | 165 |
| Total | 171 | 20 | 333 |

`research.json` retains summary/detailed-heading reconciliations, file hashes,
page references, source extracts, career/course/distance/going records, riders,
weights, claims, barriers, recent races, trials, gear notes and settling history.
It contains 1,548 historical race results: 1,511 supported flat/turf results feed
the existing recent-form parser; 37 unsupported going, jump or finish-code rows
remain visible in the source audit. The 384 trials remain separate from race
results. Nine horses are cross-entered; no final engagement is inferred.

`analysis.json` contains all 333 baseline model estimates, ten full-field
scenarios, signed separation, scenario ranges, the top-three form assessments
for each race and the existing starter-field gate. All 200 race/scenario
distributions total 100.00%.

The current strict win-first screen qualifies zero priority or review selections.
The model Top 5/10/15 is explicitly a raw model ranking, not an independently
reviewed shortlist. Estimates remain uncalibrated; sensitivity ranges are not
confidence intervals. Good 4 is an explicit comparison scenario, not a sourced
current track report. Final starters, reserve priority, scratchings and track
conditions still require current official checks.

`v5/active-card.js` selects this dated source for both site entrypoints. The
31 October card remains at `/v5/?card=2026-10-31`; its research, official overlays,
shortlists and historical results are unchanged. The old date-specific live
endpoints are disabled for this new card, preventing stale data from crossing
between dates.

## Reproduce

With the two original PDFs available locally and `requirements.txt` installed:

```bash
python scripts/import-feature-form.py --as-of 2026-11-02 \
  --output v5/cards/2026-11-03/research.json \
  --library-file-id libfile_ab74f01bd348819194467c91688c819d \
  --library-file-id libfile_9ffafbc4bb888191a95a22f49f4e5537 \
  '/path/to/469223(1).pdf' '/path/to/469224(1).pdf'
npm run card:build
npm test
npm run check
```

Validation: 170 Node tests plus the existing scratching/syntax checks pass.
The historical probability/class audits also pass. Browser QA verified both
entrypoints and a completed 10,000-draw simulation on the imported Randwick R1
field. Simulated draws do not validate the real-world estimates.
