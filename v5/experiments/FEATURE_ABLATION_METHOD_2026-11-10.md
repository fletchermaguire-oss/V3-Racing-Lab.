# V5-L5 single-factor ablation research (10 November 2026)

**Purpose:** Detect existing components which make retrospective forecasting worse, without rewriting core L5 or fitting new horse-by-horse adjustments. Independent evidence may not yet exist. The experiment *only* scales each pre-existing feature contribution of every full-field horse to half strength (0.5) or off (0), one factor at a time. The original softmax temperature and 15% uniform reserve remain unchanged, and no extra information or postrace data enters the scoring step.

**Frozen candidate families:** career, recency, distance, surface, course, class, barrier, weight, layoff. Default pace/draw stress contribution is zero and is tested separately. Compare 18 full-field scenarios against original L5 over the exact same 91 historical races: 17/24 October reconstructed, 31 October seven field-mismatch races excluded, 3 November from provisional Monday card.

**Outcomes tracked:** Top 1/3/5, Brier and log loss, number of leader changes, individual winning flips gained, winning picks damaged and flips between losing horses, by race date. A feature that appears harmful in aggregate but changes highly different days cannot be automatically removed. These outcomes cannot establish a genuinely independent holdout; use them only to identify prospective tests.

**Production rule:** No coefficient change from any historical ablation alone. Improve input accuracy/coverage first; lock frozen before-race forecasts on 14 Nov and subsequent meetings, then compare targeted, predeclared candidates without hindsight edits.
