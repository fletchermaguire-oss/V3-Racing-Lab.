# V5.1 candidate: 7 November evidence and confidence audit

**Status: experimental branch only; no production formula, website, published probability, original shortlist, results record or Netlify deployment changed.**

## Findings motivating this test

- A frozen, independently reviewed 7 November Top 10 produced seven winners; its analyst percentages are not V5 model probabilities. The reviewed Top 15 for that day has not been independently recovered.
- Research-style provisional V5 inputs from **5 November** can be recomputed for **Rosehill and Ascot only**, then restricted to the **7 November morning** official active declarations. Flemington does not have matching 7 November model input and is not silently imputed.
- Among seven races where the independently reviewed Top 10 supplies the official result and the provisional model supplies an identifiable model leader, the unchanged V5 leader won **4/7**: Lazzura, Beatty, King Of Light, and Savvy Spy. It missed Cashout, So Si God (Ourgirlcanrun won) and Let's Go Again (Horseshoe Hill won). **This is a biased, selected seven-race retrospective subset, not a 20-race win rate.**
- The evidence screen catches Cashout's sparse recent dated form (3 races, completeness 0.79) and its large recency influence despite a negative class contribution. However, it does **not** reliably distinguish all winning from losing model leaders.
- Under Good4/Soft5 with class coefficients 0.55/0.28, Lazzura remains the model leader but ranges **36.17–49.85%**; Beatty likewise **30.27–42.74%**. Those are **scenario envelopes, not confidence intervals**. They appear as warnings, not automatic disqualifications.

## Flemington R6 — Tempted correction (source-only, not a numeric V5 replay)

**Tempted remains in the 7 November analyst Top 10 at rank 3 with an uncalibrated 52.9% working chance, finishing fifth.** The 7 November Flemington full-field form model was not saved in a matching format, so the research engine cannot honestly replay its numerical score. A separate dated evidence gate has been implemented instead.

The gate uses documented source information published before the race, but its structured record was **assembled on 9 November**. Consequently this is a retrospective diagnostic, **not proof of what an independently frozen pre-race algorithm would have flagged**.

| Pre-race evidence | Code treatment |
|---|---|
| Flemington straight race debut; no prior recorded Flemington straight race start | `FIRST_RACE_DOWN_STRAIGHT_CONFIGURATION` |
| Everest Group 1 victory on 17 October, 21 days earlier | `RECENT_MAJOR_TARGET_FITNESS_REVIEW`, not a diagnosis of fatigue |
| Joliestar had a proven straight course record (1 win from 2) | `PROVEN_SAME_CONFIGURATION_OPPONENT` |
| Point Barrow entered with two consecutive Group 3 wins and was omitted from the top-three named danger list | `IMPROVING_GRADED_RIVAL_OMITTED_FROM_MAIN_DANGERS` |
| Ciaron Maher's 6 November statement was positive about travel, work and retained peak | `PRE_RACE_TRAINER_REPORTED_HORSE_WELL` — mandatory contrary evidence |

**Crucial hindsight boundary:** the exercise-induced pulmonary haemorrhage, the lane Tempted ended up in, the jockey's post-race fitness assessment, and Point Barrow's actual victory are *all post-race information*. None is an input to the gate, nor do we reduce the original 52.9% analyst estimate retrospectively.

Pre-race sources (6 November):
- [VRC Champions Sprint preview](https://www.vrc.com.au/latest-news/vrc-champions-sprint-preview/)
- [VRC trainer interview](https://www.vrc.com.au/latest-news/tempted-to-see-her-shine-again/)
- [Racing.com preview](https://www.racing.com/news/2026/11/06/news-preview-judgement-champions-sprint-071126)
- [Pre-race competitor form](https://www.ladbrokes.com.au/blog/2026/11/06/champions-sprint-predictions/)
- [V5 race selections, timestamped before scheduled jump](https://github.com/fletchermaguire-oss/V3-Racing-Lab./blob/main/v5/cards/2026-11-07/race-selections.json)

**No inference that a course debut or recent big race should automatically disqualify a strong horse.** These risk flags demand comparative evidence and human review.

## Tactical uncertainty correction

The original evidence gate counted *absolute* historic 800-metre settling positions 1 or 2. V5.1 now uses `settle_fraction <= 0.34` (field-size-normalized early position) and requires at least 60% historical settling coverage. This agrees with the existing research-only `v5/pace-class.js` pressure assessment. It is still a **possible pace pressure** marker, never a certified speed map.

Cashout's Rosehill R5 and So Si God's Ascot R7 now both show `POSSIBLE_PACE_CONTEST_FROM_HISTORICAL_SETTLING` as an uncertainty warning. Their underlying model probabilities and rankings do not change, and the warning alone does not distinguish an eventual winner from a loser.

We also removed the misleading experimental inference that a positive or negative generic `course` feature can establish Flemington **straight** experience. That classification must come from dated, configuration-specific evidence.

## Reproduction

```bash
node --test v5/experiments/v5-1-evidence-gate.qa.cjs v5/experiments/v5-1-course-prep.qa.cjs
node v5/experiments/v5-1-shadow-review.cjs > /tmp/v5-1-shadow.json
```

The **15 targeted tests** cover 7 November official-inventory reconciliation, unchanged original V5 numerical scores, identification of sparse-form risks, date-gated straight/fitness/rival evidence, generic naming invariance, normalised tactical position, retrospective identity preservation, stale/conflicting source rejection, scenario sensitivity, and absence of outcome/odds leakage. These passed through a JavaScript execution harness; the full repository test suite remains to be run in CI/Node.

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

- For Tempted, retain the source-only straight/course/preparation rival audit and acquire the 7 November Flemington full-form input before attempting any numeric model comparison. 
- Find pre-race **measurable** tactical evidence for the two unresolved misses: reliable pace maps, expected speed pressure, gear/trainer intention, interference-aware sectionals and class-adjusted recent form.
- Construct a *separate* candidate numerical model only after sourcing these inputs reliably; do not modify the live baseline simply because a winner differed.
- Freeze a full Top 5/10/15 board and per-race ranked list before a new Saturday to measure out-of-sample results, keeping the model/analyst comparison and scratchings checkpoints separately versioned.
