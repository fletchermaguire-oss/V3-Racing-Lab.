# V5 source import — Flemington Crown Oaks Day, Thursday 5 November 2026

**Status:** PDF source imported and structurally reconciled; field/starter and track condition publication gate **not approved**. Data source `469539.pdf` supplied by the user, 79 pages, SHA-256 `192a7b461e6fdc62e0babf6c87b80ebe31f2d8c0ac2d03e847794f12fcde27ce`. Source saved as of 2026-11-03.

This date is **not** the Tuesday 3 November Melbourne Cup Day card, nor the Saturday 7 November Champions Day card. Do not overwrite either.

| Race | Distance | Entries in PDF | Race |
| --- | ---: | ---: | --- |
| 1 | 1700m | 20 | TCL Trophy |
| 2 | 1400m | 15 | Sharp EIT Subzero Handicap |
| 3 | 1600m | 13 | Channel 9 Chester Manifold Stakes |
| 4 | 1600m | 12 | Inglis Bracelet (QC) |
| 5 | 1800m | 19 | Sigma Trophy |
| 6 | 1600m | 20 | Cirka Melbourne Cup Carnival Country Final |
| 7 | 1100m | 16 | Crown Red Roses Stakes |
| 8 | 2500m | 20 | Crown Oaks (Group 1) |
| 9 | 1000m | 14 | G.H.Mumm Century Stakes |
| **Total** | | **149** | **9 races** |

## Extracted evidence and safeguards

- 708 historical race-result entries, **691** eligible under the existing flat/race-going/finish parser; 17 excluded from model input but preserved in source detail.
- **217 barrier trials**, each `used_in_model:false`; no trial wins are race wins.
- **701 race-level** 600m/other split entries, all `horse_specific:false`: DO NOT interpret them as individual closing speeds.
- Runner identities, career summaries, detailed histories, date cutoffs and all field inventories were checked; no same-horse cross entries across the nine published PDF fields.
- Race-level `race_class` and per-start `race_class` are preserved, rather than inferred from prize money or betting odds.
- The user-uploaded PDF's 149 entrants are **not certified final starters**. Ten runner rows have blank jockey fields in this PDF, to be checked against official declarations.
- Published source timing: Flemington local AEDT (UTC+11) Nov 5, 2026, 1:00pm to 5:50pm.
- All probability estimates from the existing V5 model are **uncalibrated provisional conditional calculations**, if/when generated. Good 4 is only a comparison scenario until externally verified. `publication_approved=false`.

Official VRC meeting schedule: https://www.vrc.com.au/race-days-and-events/2026-2027/crown-oaks-day/

## Reproduction

```sh
python scripts/import-feature-form.py --as-of 2026-11-03 --output v5/cards/2026-11-05/research.json 469539.pdf
node v5/cards/2026-11-05/check-card.cjs
node scripts/build-feature-card.cjs v5/cards/2026-11-05/research.json
node v5/cards/2026-11-05/check-card.cjs --with-analysis
```

No entrypoint, shortlist, archived results, official overlay or production formula altered. Pending full race-day field verification, scratchings, rail and going.
