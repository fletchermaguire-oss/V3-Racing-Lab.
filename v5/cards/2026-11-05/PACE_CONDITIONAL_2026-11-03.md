# Flemington V5 — Provisional pace-conditional reweight, 3 Nov 2026

**Meeting:** Thursday 5 November 2026. **Status:** RESEARCH-ONLY experimental percentage revision, not a new production model, calibrated winning probability, or final field.

## Nine-race board

| R | Old V5 Good 4 full PDF | Good 4 after listed scratchings, no pace | **Good 4 after scratchings + fixed pace** | Soft 5 after scratchings + fixed pace | Historical settling scenario |
|---:|---|---|---|---|---|
| 1 | Miss Stalwart 10.18% | Miss Stalwart 10.61% | **Cute Girl 10.26%** | Cute Girl 12.36% | Contested |
| 2 | Alabama Fox 15.93% | Alabama Fox 15.93% | **Alabama Fox 15.58%** | Alabama Fox 17.20% | Contested |
| 3 | Buccleuch 18.14% | Buccleuch 18.14% | **Buccleuch 18.14%** | Buccleuch 21.61% | Neutral |
| 4 | Sass Appeal 21.35% | Sass Appeal 22.62% | **Sass Appeal 22.62%** | Sass Appeal 15.90% | Neutral |
| 5 | Single Choice 16.83% | Single Choice 17.55% | **Single Choice 17.55%** | Single Choice 20.28% | Neutral |
| 6 | Our Justify 11.11% | Our Justify 11.11% | **Our Justify 11.58%** | Our Justify 12.22% | Contested |
| 7 | Scintillation 16.33% | Scintillation 17.66% | **Scintillation 16.58%** | Scintillation 18.84% | Contested |
| 8 | Proxima Dea 19.50% | Proxima Dea 19.50% | **Proxima Dea 19.18%** | Proxima Dea 19.95% | Contested |
| 9 | Cavalry Girl 38.36% | Cavalry Girl 40.24% | **Cavalry Girl 36.88%** | Cavalry Girl 38.21% | Contested |

**What changed:** The original source-only analysis was calculated on 149 PDF entrants. Racing & Sports' [5 November meeting](https://www.racingandsports.com.au/form-guide/thoroughbred/australia/flemington/2026-11-05) lists six scratched entries: Grand Omaha R1, Snitzel Dancer and Miss Hades R4, Haaracaine R5, Parcae R7, Pallaton R9. The remaining **143 names** are *listed*, not independently attested final starters. Tuesday two-day backups are still unresolved. Oaks R8 still has all 20 entries and uncertain four emergencies; no fabricated 16-runner field.

Percentages reflect a **conditional shadow transformation** of the unchanged V5-L5 original scores. We invert the original uniform-reserve probability transform, remove the six listed scratched entries, and apply a historical settling contest adjustment using the preregistered fixed coefficient **0.30** only where ≥70% historical 800m data is available and ≥4 runners ordinarily settle in the front ~third. Then renormalise across every listed remaining entrant. Exact unrounded race totals equal **100%**; displayed 2-decimal percentages may differ by 0.01 because of rounding. No model coefficients were retrained and **field-relative V5 features have not been recalculated**.

This predeclared contesting-pace hypothesis improved historical top-1 only 27/91 → 28/91 in a *retrospective* audit, and has **not been validated prospectively**. These are not known true win chances.

## Important horses and interpretation

- **R9 Cavalry Girl:** Old Good4 full PDF **38.36%**; after Pallaton listed scratching, no pace **40.24%**; after pace pressure **36.88%** (Soft5 **38.21%**). Her model lead remains intact, but R&S shows Ice Kool and Don't Hope Do both AES 17.4 m/s, Bev's Nine 17.2, Cavalry Girl 17.1. A shared lead is a material risk; a 3.36 pp pace-only reduction is more defensible than an arbitrary cut.
- **R7 Scintillation:** After Parcae listed scratching, no pace **17.66%**; after contested-pace adjustment **16.58%** (Soft5 **18.84%**). **Sequinned** rises from scratch-only **11.35% → 12.42%** (Soft5 **14.02%**). Scintillation is still top; the gap narrows. Fovea/Sanctuary's Tuesday engagements mean the Thursday field is not final.
- **R1 Miss Stalwart → Cute Girl:** With Grand Omaha excluded and multiple historical leaders, **Cute Girl 10.26%** narrowly exceeds **Miss Stalwart 10.09%** on Good4. Soft5 Cute Girl **12.36%**. This is not a robust win recommendation; it is a crowded BM70 and sensitive to ground.
- **R2 Alabama Fox:** Contested historical early tempo reduces her Good4 share to **15.58%** (from 15.93%); Keitel's closing profile improves to **11.33%**. Alabama Fox remains first.
- **R3 Buccleuch / Enxuto:** The predeclared settling rule is **neutral** (only 2 early-third historical runners). It does not invent extra percentage for Enxuto merely because R&S AES/AFS looks appealing. Buccleuch remains incorrectly *source-current* at 18.14% because Tuesday's poor result and doubtful Thursday backup were **not rescorings** in the original analysis. **Withhold R3 priority designation and do not use 18.14% as a final selection.** The separate what-if scenario without him remains unverified.
- **R4 Sass Appeal:** No numerical pace modifier justified; the Good4 move **21.35% → 22.62%** arises only from two listed scratchings. On Soft5 the leading share falls to **15.90%**, close to Gold Medallist **15.61%**. Gold Medallist raced on Tuesday; verify backing-up status.
- **R5 Single Choice / Fiorenot / Perisher:** Only the listed Haaracaine scratching affects the numerical shadow. No pace coefficient justified. Single Choice **17.55%**, Fiorenot **17.02%**, Perisher **7.83%** Good4. The qualitative challenge to Single Choice's 187-day spell and class-grade strength remains unresolved, **not silently embedded** as an invented coefficient.
- **R6 Our Justify / Bel Mezyaan:** Eight of the twenty runners historically settle toward the front third. Our Justify Good4 **11.58%**, Bel Mezyaan **9.36%** versus 8.06% original, making the class challenge more credible without inventing a new winner.
- **R8 Crown Oaks:** Historical pace pressure slightly reduces Proxima Dea Good4 to **19.18%**, De Armas **16.02%**, Quick Finish **13.19%**. **R&S numerical AES and AFS cover only 2/20 Oaks PDF entries**; these numerical changes rely on 800m settling positions extracted from the Feature Form, *not* missing horse-specific speed figures. Actual four emergency promotions/removals could materially change the race.

## Evidence and blockers

- Full [race-specific pace/speed sources](./pace-speedmap-source-20261103.json): 143 current source rows mapped to the original 149; AES/AFS **121/143** available overall (Oaks only 2/20).
- [Full original V5 analysis](./analysis.json), [frozen provisional shadow](./pace-conditional-20261103.json), and [deterministic formula](./pace-conditional.cjs); [QA](./pace-conditional.qa.cjs) independently reconciles all 72 exact whole-field totals.
- Treat R&S AES/AFS as horse-level historical averages and diagnostics only. **No new untested numerical AES/AFS coefficient has been inserted.**
- **Final releases blocked:** confirmed race-day starters, actual going, 2500m Oaks emergencies, Tuesday-backup horses, rider/gear changes and the race-day lane pattern. This is an explicitly dated Good4/Soft5 shadow, not a new site deployment, and neither historical results nor prior manual shortlist positions were overwritten.

**Publication:** `publication_approved: false`; `calibrated: false`; `site_deployed: false`. This report does not authorize a live auto-update.
