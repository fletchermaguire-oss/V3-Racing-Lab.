# V5-L5 source-locked preliminary board — 5 November 2026 Flemington

> **Newer provisional pace-adjusted research (3 Nov):** See [dated pace shadow and Good4/Soft5 board](./PACE_CONDITIONAL_2026-11-03.md) and [whole-field conditional percentages](./pace-conditional-20261103.json). The table below is the **immutable original PDF-field baseline** and must not be confused with the latest conditional research, verified final starters, or published live selections. No live model or site has been replaced.

**Status: MODEL GENERATED / SOURCE QA PASSED / FINAL PUBLICATION BLOCKED.** Model version: `V5-L5-CANDIDATE-20261030`. As-of 2026-11-03. The exact 149-runner PDF source and 9 races have been processed with the unchanged V5 engine in this isolated branch. All 90 race/scenario whole-field probability totals equal 100%. Neither these raw estimates nor their scenario ranges are calibrated win probabilities or confidence intervals.

Scenario: **Flemington Good 4 comparison only**; it is NOT an official race-day going observation. Every one of the nine races is awaiting a complete, attested official final-starter list. The Crown Oaks PDF lists 20 including potential reserves/emergencies, so the final-publish figures must be recalculated with the actual starting field.

## Race leaders and independent fixed-gate screening

| R | PDF entries | Raw model leader | Raw L5 share | Separation | Chaos | Win-first gate |
|---|---:|---|---:|---:|---:|---|
| 1 | 20 | Miss Stalwart | 10.18% | 0.15 pp | 98 | NO_SELECTION |
| 2 | 15 | Alabama Fox | 15.93% | 2.42 pp | 91 | NO_SELECTION |
| 3 | 13 | Buccleuch | 18.14% | 7.70 pp | 83 | PRIORITY_RESEARCH |
| 4 | 12 | Sass Appeal | 21.35% | 9.32 pp | 80 | NO_SELECTION |
| 5 | 19 | Single Choice | 16.84% | 0.52 pp | 93 | NO_SELECTION |
| 6 | 20 | Our Justify | 11.11% | 3.05 pp | 92 | NO_SELECTION |
| 7 | 16 | Scintillation | 16.33% | 5.83 pp | 86 | NO_SELECTION |
| 8 | 20 | Proxima Dea | 19.49% | 4.17 pp | 82 | REVIEW_ONLY |
| 9 | 14 | Cavalry Girl | 38.36% | 28.89 pp | 59 | PRIORITY_RESEARCH |

**Priority research candidates** from the unchanged V5-L5 fixed Good4/Soft5/conservative-class gate:
- Cavalry Girl, **Flemington R9**, raw baseline **38.36%**, conservative floor **27.94%**, minimum scenario gap 28.89 pp, maximum scenario chaos 59. Previous five source form lines include four wins and a G1 second, but barrier 12, Flemington straight lane/pace and latest official field must be verified.
- Buccleuch, **Flemington R3**, raw baseline **18.14%**, conservative floor **18.14%**, 7.70 pp minimum scenario gap, maximum chaos 83. The fixed gate marks this research priority due to separation and consistency; it is **not** a high-probability certainty.

**Review only (not a priority):** Proxima Dea, Flemington R8 Crown Oaks, raw **19.49%**, floor 16.73%, 5 historical race wins from 5 starts in uploaded PDF. PDF source also shows barrier 19 in a 20-entry field, which may include reserves. Comparative figures must change with actual starters; no claim that 19.49% is its final true winning probability.

**Explicit abstentions:** R1, R2, R4, R5, R6, R7. Example: R4 Sass Appeal is 21.35% raw but below the robustness threshold with `CLASS_ASSUMPTION_CHANGES_RANK`, weak/unstable field separation and a four-day backup. R5 Single Choice 16.84% is virtually tied with Fiorenot 16.32%; it is not a standout.

## Integrity and release conditions

- Full field checked **not approved**: 9/9; official counts, emergency eligibility and reliable going/rail still required.
- Historical source count: 149 (all PDF listed; 10 blank jockeys need official rider checks).
- No prices, race winners or market trends entered pre-race scoring.
- Source PDF has **701 race-level sectionals**, all labelled `horse_specific:false`; they are not individual 600m speed ratings. Trial finishes are excluded from race wins.
- Never silently promote raw model top picks into curated Top 5/10/15. There are only **two** priority research candidates plus one review-only horse, and zero publication-approved final selections.
- All analysis and research files are isolated to `v5/cards/2026-11-05/` on `data/v5-flemington-oaks-20261105`. Neither `v5/active-card.js` nor the Netlify production deployment was changed. The historical 31 October and 3 November data remain intact.
- V5 source and model reproduction: `node scripts/build-feature-card.cjs v5/cards/2026-11-05/research.json` and `node v5/cards/2026-11-05/check-card.cjs --with-analysis`.

**Decision:** this is a source-complete provisional model board, not a verified Oaks Day final board. Recheck official scratches, starting field and track status before authorising publication; any subsequent changes must be timestamped and separately versioned.
