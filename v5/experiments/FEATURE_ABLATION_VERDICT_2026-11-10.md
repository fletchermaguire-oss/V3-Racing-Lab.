# V5-L5 factor ablation verdict — 10 November 2026

**Keep every existing coefficient as-is.** This report is a retrospective QA result, not a prospective calibration or automatic model-promotion policy.

The full-field V5-L5 baseline correctly ranked **27 of 91 winners first**, with Brier **0.855503** and mean log loss **2.209260** across four retrospectively reconstructed/provisional race days. We reduced *one* existing factor at a time to half strength or zero: career, recency, distance, surface, course, class, barrier, weight and layoff (18 tests). Every forecast was re-normalised using L5's original softmax temperature and uniform reserve.

Key comparisons:
| Historical change | Top-one winners | Brier (lower better) | Individual first-pick changes |
| --- | ---: | ---: | --- |
| L5 untouched | 27/91 | 0.855503 | None |
| Recency half | 23/91 | 0.863866 | 1 winner gained; 5 damaged |
| Recency removed | 21/91 | 0.876337 | 5 gained; 11 damaged |
| Class half | 26/91 | 0.860555 | 2 gained; 3 damaged |
| Class removed | 26/91 | 0.869097 | 4 gained; 5 damaged |
| Course removed | 28/91 | 0.857021 | 2 gained; 1 damaged |
| Surface removed | 25/91 | 0.857899 | 1 gained; 3 damaged |

The *extra course-ablation winner* is tempting, but its Brier error got worse and the gains occurred only on **3 November**, while a correct leader was lost on **31 October**. No coefficient met a conservative multi-metric historical gate: more winners, lower Brier, lower log loss and improvements on at least two dates without a damaged date. Even meeting those requirements would only justify a future shadow test, not live adoption.

**Decision:** avoid tinkering with the L5 model coefficients before Saturday 14 November. Preserve researched Top 5/10/15 and all archived outcomes. Next material opportunity is *data quality* (individual horse sectionals, verified opponent ability, actual going) and *selection reliability* (one per race, strict confidence abstentions, official field checks). The existing frozen pace (.30) and quality-ordering challengers remain separate, not production replacements.

Caveats: 17/24 October cards reconstructed retrospectively, 31 October omits seven field mismatches, 3 November uses Monday provisional field. The 91 races are not an independent forward holdout; model accuracy is uncalibrated. A passing code test means the comparison method works, not that accuracy improves.

Run `npm run research:ablation` and `npm run research:ablation-decision`. Full GitHub regression and recorded outcomes: [workflow run 42802535571](https://github.com/fletchermaguire-oss/V3-Racing-Lab./actions/runs/42802535571).
