# V5-L6 candidate — 3 November 2026 model integrity correction

**Status:** Code review / test candidate only. This is a mathematical missing-data repair, **not a demonstrated increase in real win strike rate**. Do not modify the immutable October 17/24/31 result files, the archived 3 November research, independently reviewed selections, or the public site until an independent forward review.

## Issue fixed
Prior V5-L5 `classQuality()` returned numeric zero when no historical class label could be parsed. In a field with recognised graded rivals, class-relative scoring then applied `classWeight*(0 - peerAnchor)` — a negative rating that asserted poor ability for horses with *unknown* race class. This is a systematic unverified inference.

The V5-L6 candidate represents unrecognised graded class as `null`, computes rival benchmarks exclusively from observed graded peers, and sets the unknown horse's class contribution to **zero** (neither bonus nor penalty). If there is no observed rival peer, the class edge is also unknown, not fabricated. It does not alter temperatures, existing coefficients, source form, market policy, or previously frozen published results.

The strict research filter now disqualifies a runner with no recognised graded evidence from both the priority and conditional review lists. Raw model estimates are still available for diagnosis but never certified as true probabilities. Race-detail display handles absent class evidence without throwing an error.

## Accuracy and leakage controls
- Current baseline: V5-L5, `V5-L5-CANDIDATE-20261030`, must remain available as the archived research comparator, including `v5/cards/2026-11-03/analysis.json` and `v5/backtests/*`.
- Corrected code: V5-L6 candidate, `v5/model.js` on this review branch; no merge or deployment to the live site.
- Isolated neutral-class experiment already exists at `v5/experiments/model-neutral-class.cjs`; the fixture QA checks matching results, neutral missing-class scoring, finite whole-field probabilities, ordering invariance, and no race winner leakage.
- Retrospective 17/24 October studies do not establish real-world superiority: these source reconstructions do not have pre-jump freeze proof. The open temperature audit PR #23 reported worsened holdout Brier and log loss when refitting temperature.
- No 3 November winners or market odds were consulted when choosing **any** class coefficient, scoring constant, or runner-specific override. This correction follows the semantic distinction between *unknown* and *poor*.
- Production acceptance still requires passing full CI, complete official starter fields, new pre-jump locked forecasts, several independent forward race days, and a meaningful improvement on both accuracy and calibrated forecast metrics.

## Reproducibility
```
npm test
npm run check
npm run research:class
```

Decision: **do not claim 60%**, do not auto-generate a 10/15-leg selection list from unqualified race leaders, and never mix retrospective historical backtests with true prospective hit rates.
