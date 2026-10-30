# V5-L5 neutral missing-class experiment — results (30 October 2026)

**Decision: NOT PROMOTED.** The active V5-L5 formula, stored research rankings and live site remain unchanged. The alternative lives only in `v5/experiments/model-neutral-class.cjs`.

## Hypothesis

The existing class proxy converts missing class recognition to numeric zero. When compared with positive observed opponents, this can impose a class penalty on horses with unavailable overseas or partially parseable historical grades. A separate candidate represents an absent grade as `null`, gives that runner zero *class-feature contribution*, and calculates class-relative anchors only from other runners with observed rated class. All other V5-L5 parameters, including temperature, uniform reserve and field inventory, remain identical.

## Paired, retrospective comparison (not an out-of-sample result)

| Historical reconstructed date | Model | Race winners correctly ranked #1 | Mean multiclass Brier ↓ | Mean log loss ↓ |
|---|---|---:|---:|---:|
| 17 Oct (30 races) | V5-L5 baseline | 13 / 30 | 0.807814 | **1.989690** |
| 17 Oct (30 races) | Neutral-class experiment | 13 / 30 | **0.807690** | 1.991032 |
| 24 Oct (19 races) | V5-L5 baseline | 4 / 19 | **0.897058** | **2.275402** |
| 24 Oct (19 races) | Neutral-class experiment | 4 / 19 | 0.897816 | 2.280045 |
| **Both dates (49 races)** | **V5-L5 baseline** | **17 / 49** | **0.842419** | **2.100476** |
| Both dates (49 races) | Neutral-class experiment | 17 / 49 | 0.842637 | 2.103098 |

The experimental change affected 16 missing-class dossiers across four of the 49 races and **changed zero race leaders**. In this limited study, the candidate did not increase the Top 1 strike rate and made both overall probability metrics slightly worse.

**Why this does not resolve the underlying problem:** Representing missing data as missing is correct metadata hygiene, but applying a neutral *score* to missing class is itself an assumption. Other treatments (evidence-coverage shrinkage or careful hierarchical imputation) would require evidence and chronological holdouts before changing winner rankings. Do not optimize solely on these two dates.

## Verification and reproducibility

- `npm test` runs seven isolated experiment-specific tests on mathematical correctness, absent-grade handling, invariance and whole-field normalization; it also retains the existing V5 suite.
- `npm run research:class` compares **both models against identical reconstructed starters and official matched winners**, and emits every change to race-leader identity.
- `npm run research:audit` retains the independent historical V5-L4 versus V5-L5 comparison.
- `npm run check` uses the actual, original `v5/model.js`, not the experiment.
- The CI workflow runs the experiment separately and fails if the comparison is invalid or full-field accounting changes.

## Next accuracy priority

1. Research more complete, independently dated form for the 23 of 372 currently included 31 Oct runners with fewer than three recognizable dated form lines.
2. Check rider-claim and race-day weight source accuracy; avoid false precision in barrier/pace assumptions.
3. Create genuinely **prospective** individual race predictions before starting, keep all changes versioned, and score against official results after racing.
4. Report both **win-first strike rate and selection coverage**; distinguish pure Top 1 every race from selective Top 3/5/10/15; no retrospective deletion of misses.
5. Only introduce new ranking coefficients if repeated forward or untouched chronological holdouts improve results with adequate sample size.

Do not imply 17/49 is a certified pre-race strike rate. This report is an engineering and retrospective research audit, not a proven model improvement.
