# V5-L5 candidate — field-relative class and reproducible historical QA

**Status: research candidate; not merged, not deployed, not empirically calibrated.**
30 October 2026. The unchanged main branch remains V5-L4.

## What changed in the candidate

- Historical race grades receive transparent *ordinal hypotheses* rather than being treated as almost interchangeable. Group 1, 2, 3, Listed, BM, Class and maiden have separate level constants; unknown labels receive no made-up class advantage.
- Performance within a graded race incorporates finishing position relative to field size, beaten/winning margin, and up to five dated recent starts. The formula combines a weighted recent mean with the two strongest performances. This is intended to distinguish repeated elite performances from one short-sample lower-grade success.
- For each contender, the model computes a **target-field opponent anchor** from the three strongest other runners and their median class performer, and scores its class advantage relative to this anchor. The audit returns `grade_quality`, `opposition_class_anchor` and `opposition_class_edge` for every runner. This corrects a *current-field* opposition problem, but it is **not** an individual historic-rival quality rating: full historic rival fields are not in these dossiers.
- Recent-form scoring no longer double-counts the old class term. The coefficient (0.55), temperature (0.78), 15% uniform reserve and ordinal scale are still **untuned hypotheses**. The new percentages must not be called calibrated genuine win probabilities.
- Legacy and Friday-summary historical form formats are both parsed, with anti-leakage date cutoffs, duplicate rejection and strict source-format recognition. On reconstructed 24 October fields, **185 of 200 starters** have at least one machine-readable dated run; **15 have none**. Some career aggregates remain absent.
- Both entrypoints use the single versioned V5-L5 runtime; the simulator and multi calculator continue to consume the same provisional race distributions. Source-dated track going now defaults Ascot to **Soft 5** while Randwick and Flemington remain Good 4 in the saved 31 October scenario. User-changing a scenario still recalculates the same board.
- No price, existing pick, horse name or requested selection is a score input.

## Two-date comparison — descriptive, not valid out-of-sample backtest

Both legacy and candidate are calculated over identical retrospectively matched starters, outcomes and parser support. Official **17 October** results matched 30 races and 307 finishers from Airtable; official **24 October** Racing Australia results matched 19 races and 200 finishers. All 49 winners are matched.

| Meeting date | V5-L4 top1 | V5-L5 top1 | V5-L4 Brier | V5-L5 Brier | V5-L4 log loss | V5-L5 log loss |
|---|---:|---:|---:|---:|---:|---:|
| 17 Oct | 13 / 30 | 13 / 30 | 0.821295 | 0.807814 | 2.028018 | 1.989690 |
| 24 Oct | 3 / 19 | 4 / 19 | 0.891981 | 0.897058 | 2.258576 | 2.275402 |
| **Combined** | **16 / 49** | **17 / 49** | **0.848704** | **0.842419** | **2.117418** | **2.100476** |

These small changes are **not demonstrated win-rate improvements**. The 24 October Brier and log loss actually worsened. The source date is **not an immutable pre-race freeze**, and aggregate statistics might have been edited afterward. Neither date may be used to fit and publish confidence percentages. The 17 October retrospective archive is especially vulnerable to later source updates. Two Saturday cards are not enough to establish robust generalization.

Reproduce the descriptive calculations:

```
npm run research:audit
npm test
npm run check
```

The retrospective inputs and frozen baseline predictions live under `v5/backtests/`, explicitly marked **not eligible for production calibration**.

## Calibration gate

`v5/prospective-calibration.cjs` first calls the existing `evaluateFrozen` provenance validator. It will refuse fitting without, at minimum:

- 6 distinct *training dates* covering at least 120 races;
- 2 later, distinct *holdout dates* covering at least 40 races;
- race-level official results, exact starter fields, a version and field revision, verified time-stamped approved snapshots frozen *before* the race, and supplied freeze proof;
- an improvement in **both Brier and log loss** on held-out races.

A scalar temperature is then *experimentally selected only from the training dates*, evaluated on later dates and returned as **research-only**. It is never applied to the site and the module never changes `calibration_status='NOT_ESTABLISHED'`, publication approval or official data. Even a positive holdout needs independent replication and explicit approval before use. Temperature rescaling **cannot change the ranking of race winners**; it only targets the reliability of percentages.

## 31 October research checks

In the saved 31 October draft, L5 returns **Sheza Alibi as the cross-meeting probability leader and Randwick R8 leader**, and prefers **Lady Shenandoah ahead of Surfin' Bird in Flemington R8**, without horse-specific rules. It must not be interpreted as proof that either horse wins. Both wins and losses can remain plausible; field strength, pace, scratches and training changes still matter.

The saved 29 October dossier contains **408 entries** and **12 already marked excluded**. This candidate branch does not assert the 31 October final 7:30am AEDT scratchings or five projected emergency promotions as officially certified. Source status and track ratings require independent race-day reconciliation before any publication.

**Do not merge or deploy automatically.** The user has no available Netlify credits and has asked not to deploy. Preserve original website, existing Results & History, previous V5-L4 baseline, and field-level auditability.
