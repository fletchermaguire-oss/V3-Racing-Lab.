# V5.1 candidate: 7 November evidence and confidence audit

**Status: experimental branch only; no production formula, website, published probability, original shortlist, results record or Netlify deployment changed.**

## Findings motivating this test

- A frozen, independently reviewed 7 November Top 10 produced seven winners; its analyst percentages are not V5 model probabilities. The reviewed Top 15 for that day has not been independently recovered.
- Research-style provisional V5 inputs from **5 November** can be recomputed for **Rosehill and Ascot only**, then restricted to the **7 November morning** official active declarations. Flemington does not have matching 7 November model input and is not silently imputed.
- Among seven races where the independently reviewed Top 10 supplies the official result and the provisional model supplies an identifiable model leader, the unchanged V5 leader won **4/7**: Lazzura, Beatty, King Of Light, and Savvy Spy. It missed Cashout, So Si God (Ourgirlcanrun won) and Let's Go Again (Horseshoe Hill won). **This is a biased, selected seven-race retrospective subset, not a 20-race win rate.**
- The evidence screen catches Cashout's sparse recent dated form (3 races, completeness 0.79) and its large recency influence despite a negative class contribution. However, it does **not** reliably distinguish all winning from losing model leaders.
- Under Good4/Soft5 with class coefficients 0.55/0.28, Lazzura remains the model leader but ranges **36.17–49.85%**; Beatty likewise **30.27–42.74%**. Those are **scenario envelopes, not confidence intervals**. They appear as warnings, not automatic disqualifications.

## Reproduction

```bash
node --test v5/experiments/v5-1-evidence-gate.qa.cjs
node v5/experiments/v5-1-shadow-review.cjs > /tmp/v5-1-shadow.json
```

The test suite covers 7 November official-inventory reconciliation, unchanged original V5 numerical scores, identification of sparse-form risks, retrospective identity preservation, stale/conflicting source rejection, scenario sensitivity, and absence of outcome/odds leakage.

## Rules and limitations

1. **Fail closed on race and runner identity**, and remove scratched declared runners only by matching the saved source sheet to the official race/number/name inventory. Morning declarations remain **not certified at jump time**.
2. Run the exact original V5 class/recency/going/distance/weight calculation. **Do not modify, retrain or automatically recalibrate probabilities**.
3. Flag thin source form (<4 accepted starts), low documented completeness (<0.85), class-negative recency dependence, small separation (<4pp), crowded fields (chaos >89), layoffs (>70 days), and ambiguous straight-course transfer. These are *research thresholds*, **not learned risk factors**.
4. Evaluate Good4 and Soft5 at both existing V5 class coefficients. Report probability ranges and leader consistency; do not interpret scenario frequencies as win confidence.
5. Identify *possible* speed pressure only from historical settling positions. The baseline formula's pace term remains zero; no reliable prospective race pressure, sectional-interference database, video replay, post-race explanation or rider intent has been encoded. **A possible lone-speed flag is not a proven tactical advantage.**
6. No reported improvement should be interpreted as independent validation: the candidate was designed after examining 7 November outcomes. A real test requires a frozen pre-race release, independent subsequent racing dates, full-field official results, Brier/log-loss and Top 1 accuracy **at matched race/field coverage and abstention rates**.

## Outcome audit on seven selected races (for diagnostic use only)

| Race | V5 model leader after morning scratchings | V5 chance | Actual winner | V5.1 screen |
|---|---|---:|---|---|
| Rosehill R3 | Savvy Spy | 28.79% | Savvy Spy | Eligible for review |
| Rosehill R5 | Cashout | 26.72% | Probability Theory | Evidence review required |
| Rosehill R7 | Lazzura | 49.85% | Lazzura | Eligible; wide scenario warning |
| Rosehill R10 | Let's Go Again | 22.10% | Horseshoe Hill | Eligible for review; **unresolved model miss** |
| Ascot R6 | Beatty | 42.74% | Beatty | Eligible; wide scenario warning |
| Ascot R7 | So Si God | 29.75% | Ourgirlcanrun | Eligible for review; **unresolved model miss** |
| Ascot R9 | King Of Light | 32.89% | King Of Light | Eligible for review |

In this subset, the quality screen excludes one losing favourite, retains four winning model leaders, **but still retains two losing model leaders**. That is a hypothesis-generating observation, **not evidence of a 66.7% prospective hit rate**. The remaining 13 races' independently verified winners have not been incorporated into this comparison.

## What to do next

- Find pre-race **measurable** tactical evidence for the two unresolved misses: reliable pace maps, expected speed pressure, gear/trainer intention, interference-aware sectionals and class-adjusted recent form.
- Construct a *separate* candidate numerical model only after sourcing these inputs reliably; do not modify the live baseline simply because a winner differed.
- Freeze a full Top 5/10/15 board and per-race ranked list before a new Saturday to measure out-of-sample results, keeping the model/analyst comparison and scratchings checkpoints separately versioned.
