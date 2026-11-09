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


## Numerical V5.1 formula correction: sparse evidence and relative class

**Candidate file:** `v5/experiments/model-v5-1.cjs`; base `v5/model.js` stays unchanged. The candidate preserves existing career, surface, course, distance, recency, class, weight, barrier and probability-normalization machinery. It introduces one new **score-level** contribution after existing race-relative class has been calculated:

```text
missingDatedShare = max(0, 5 - acceptedRecentStarts) / 5
classShortfall = class edge is known
  ? min(1, max(0, -classEdge) / max(0.5, oppositionClassAnchor))
  : 0
discount = 0.50 * missingDatedShare + 0.12 * classShortfall
recent_evidence_adjustment = recentFormScore > 0 ? -recentFormScore * discount : 0
```

The adjustment is applied **to every horse**, with fixed parameters and no horse-name exceptions, bookmaker inputs, market-derived scores, or actual results. Whole-field probabilities are recalculated using the unchanged 0.78 temperature and 15% uniform component; every field totals 100%. The new parameters are engineering hypotheses chosen after review of 7 November, not calibrated effect sizes.

**Illustration from 7 November after morning scratchings:** Cashout moves from 26.72% to 23.09% (still rank #1), Probability Theory from 12.05% to 12.75% (still #4). Lazzura 49.85% → 50.13%, Beatty 42.74% → 46.06%, King Of Light 32.89% → 33.03%. The candidate has not fixed the ranked misses against Ourgirlcanrun or Horseshoe Hill. Tempted has an evidence-only warning because a matching 7 Nov Flemington machine-readable model was not archived.

### Whole-field historical comparison (not independently forward-frozen)

| Date | Races used | V5 top-1 winners | V5.1 top-1 winners | V5 multiclass Brier ↓ | V5.1 Brier ↓ | V5 log loss ↓ | V5.1 log loss ↓ |
|---|---:|---:|---:|---:|---:|---:|---:|
| 17 Oct | 30 | 13 | 13 | 0.807814 | 0.807135 | 1.989690 | 1.983492 |
| 24 Oct | 19 | 4 | 5 | 0.897058 | 0.891223 | 2.275402 | 2.254571 |
| 31 Oct | 22 | 7 | 8 | 0.846084 | 0.841351 | 2.146979 | 2.131084 |
| **Combined** | **71** | **24** | **26** | **0.843555** | **0.840240** | **2.114886** | **2.101767** |

For 31 Oct, seven races with known model-field/official-result mismatches were excluded identically for both models. The 17/24 Oct snapshots are reconstructed, not reliably independently frozen before racing.

### 7 November complete Rosehill + Ascot day, not merely 7 shortlisted races

All 20 race winners were obtained from the [Rosehill results](https://racehub.com.au/raceday-wrap/rosehill-2026-11-07) and [Ascot results](https://www.tabtouch.com.au/racing/2026-11-07/pr), stored only in `v5/experiments/results-2026-11-07-complete.json`. This outcome file is **evaluation-only**; scoring modules never read it. Winner names were checked against the corresponding tab number in the saved official declared field.

| Meeting | Races | V5 top-1 wins | V5.1 top-1 wins | V5 Brier ↓ | V5.1 Brier ↓ | V5 log loss ↓ | V5.1 log loss ↓ |
|---|---:|---:|---:|---:|---:|---:|---:|
| Rosehill | 10 | 2 | 2 | 0.852331 | 0.841086 | 2.227604 | 2.194499 |
| Ascot | 10 | 4 | 4 | 0.756407 | 0.748837 | 1.781537 | 1.769794 |
| **Combined** | **20** | **6** | **6** | **0.804369** | **0.794961** | **2.004571** | **1.982146** |

Thus **the candidate improves the historical probability scores but not race-leader win count on 7 November**. Model inputs were dated 5 Nov and starters reconciled to the official 7 Nov morning declarations: not a certified pre-jump forecast set, and not a prospective success claim.

### Model-only Top 5/10/15 (different from the human-reviewed history record)

Across 17, 24 and 31 October, rank one candidate **per race** by the model's baseline winning probability in each date's *eligible* matched-field subset:

| Tier | V5 winners/finished | V5.1 winners/finished |
|---|---:|---:|
| Top 5 | 5/15 | 6/15 |
| Top 10 | 10/30 | 12/30 |
| Top 15 | 16/45 | 18/45 |

On the 7 Nov **Rosehill + Ascot-only** subset (20 races, no Flemington model), both versions return the same model-tier results: Top 5 **4/5**, Top 10 **5/10**, Top 15 **5/15**. Those are *not* the independently reviewed 7 Nov analyst Top 5 **4/5** / Top 10 **7/10** and do not establish a verified national 7 Nov Top 15.

### One-time ablation (diagnostic, not a fitted parameter search)

We evaluated the fixed component contributions, without changing weights after seeing the result:

| Variant | Retrospective Top-1 / 71 | Multiclass Brier ↓ | Log loss ↓ |
|---|---:|---:|---:|
| Unchanged V5 | 24 | 0.843555 | 2.114886 |
| Thin-form component only | 26 | 0.841192 | 2.105574 |
| Relative-class component only | 25 | 0.842478 | 2.110673 |
| Both as originally specified | 26 | 0.840240 | 2.101767 |

Both contributions move metrics in the expected direction on this limited sample. **This is not an unbiased model-selection exercise**: all runs are historical, and the correction followed a known poor result. We must pre-register this unchanged candidate and compare against future Saturdays before promotion.

### Reproduction and release boundary

```bash
npm run test:v5-1
npm run research:v5-1:formula
npm run research:v5-1
```

The experiment's targeted regression checks verify 100%-sum per field, runner identity and counts, deterministic row order, exclusion of market/outcome leakage, zero adjustment for complete positive-class form, venue/source matching and strict post-race result separation.

**Release decision: NOT PROMOTED.** Neither `v5/model.js`, the live site, the human-reviewed selections nor their results ledger has been changed. The newer model must first survive prospective frozen Saturday racecards and adequate comparisons of Brier/log loss, top-one hit rate, Top 5/10/15 strike and coverage, and baseline-versus-candidate per-race overlap.

## Further correction: evidence quality, selection coverage, and a rejected pace coefficient

### Reliability-screen audit with real winner coverage

The fixed V5.1 evidence screen now reports **two different reasons** for review instead of treating them as interchangeable:

- `source_data_issues`: too few recognisable form starts, low completeness, or input/parser warnings
- `racing_uncertainty_issues`: crowded field, small gap, negative class-vs-recency interaction, layoff, or unstable leader across scenarios

`data_readiness` is separately recorded, while `screen_status` remains an analyst review instruction. Incomplete historical source files are a data acquisition problem, **not evidence of a horse's inability to win**.

A results-only retrospective audit `v5/experiments/v5-1-selection-screen-audit.cjs` applies the unchanged screen to **all 42 matched race leaders** from 31 Oct (22 races) and 7 Nov Rosehill + Ascot (20 races).

| Category | Races scored | Race leaders that won | Strike rate |
|---|---:|---:|---:|
| All | 42 | 14 | 33.33% |
| Screen qualified for further human review | 21 | 12 | 57.14% |
| Further evidence needed | 21 | 2 | 9.52% |

This is a **selection-versus-coverage comparison**, not a prospective improvement. It deliberately scores **one leader from every race**, including losses. The screen was designed in light of recent results, and the 17/24 Oct reconstructed archives have systematically incomplete parsed forms. Blindly applying this screen to those older sources would flag almost everything and yield a misleading mixed-source strike rate.

The two 31 Oct winners flagged for review (Columbus and Ndola) demonstrate that caution flags **cannot imply a horse will lose**. The 7 Nov screened subset retains losing leaders So Si God and Let's Go Again, while flagging losing Cashout. Those misses still require measured tactical and opposition-strength inputs.

### Candidate shortlist infrastructure: do not pad the Top 15

`v5/experiments/v5-1-reliability-shortlist.cjs` produces one **candidate model leader per race**, sorted in descending independent model win probability. Only after ranking are source/race-suitability issues applied. Top 5/10/15 are populated **only with qualified leaders**. Any unfilled positions are explicitly reported; the algorithm will not fill them with fragile suggestions merely to reach a target count.

In the saved 7 Nov Rosehill + Ascot replay: 20 races, **10 qualified leaders and 10 flagged**, with Top 5 filled 5/5, Top 10 filled 10/10, and **Top 15 only 10/15 filled**. It marks the day **PARTIAL** because there is no equivalent numerical Flemington model dossier. This is not the archived independently reviewed 7 Nov Top 10, and no Top 15 is retrospectively inserted into the official result ledger.

### Rejected numerical pace adjustment

We tested another fixed hypothesis in `v5/experiments/model-v5-2-pace.cjs`: use normalized historical 800-metre settling tendencies to give a small generic adjustment under possible contested or lone early speed. It uses no outcome or price in features.

Paired evaluation against the V5.1 sparse-form candidate (`v5/experiments/compare-v5-2-pace.cjs`):

| Cohort | Races | V5.1 leader wins | V5.2 leader wins | V5.1 multiclass Brier ↓ | V5.2 Brier ↓ | V5.1 log loss ↓ | V5.2 log loss ↓ |
|---|---:|---:|---:|---:|---:|---:|---:|
| 17/24/31 Oct combined | 71 | 26 | 26 | 0.840240 | 0.840132 | 2.101767 | 2.101408 |
| 7 Nov Rosehill + Ascot | 20 | 6 | 6 | 0.794961 | 0.794982 | 1.982147 | 1.983722 |

**Decision: DO NOT PROMOTE V5.2.** Zero race leaders changed, and the 7 Nov overall probability metrics became slightly worse. Historic settling positions alone aren't enough to create a credible pace forecast. The 31 Oct small aggregate score improvement is not a reason to introduce an unverified coefficient.

The next substantive evidence gap is **real speed maps, sectionals, lane bias, interference and strength-of-opposition data sourced before racing**, without which the model still has no defensible numeric correction for Tempted, Ourgirlcanrun, Horseshoe Hill or improving rivals.

### New reproducible commands

```bash
npm run test:v5-1
npm run research:v5-1:screen
npm run research:v5-1:shortlist
npm run research:v5-2:pace
```

The enhanced suite includes deterministic cross-meeting shortlist sorting, one-pick-per-race enforcement, no fake Top 15 fill, fail-closed starter identities, outcome/odds injection checks, source-versus-race-risk reporting, and explicit rejection of unproven pace coefficients.

**Promotion remains blocked** pending new independently frozen pre-race cards, official matched results and a meaningful improvement in both hit rate *at comparable coverage* and probability calibration.


## Prospective matched forecast/official-result workflow

The true performance question is not whether we can explain losing horses after the event; it is whether **pre-race** model V5.1 beats *simultaneously archived* original V5 at matched race coverage. Two new strictly separated modules implement that workflow:

- `v5/experiments/v5-1-prospective-packet.cjs`: collects both models' **entire** race-field probability distributions, baseline and candidate model versions, individual runner IDs, the original one-per-race candidate rankings, selection screen status and Top 5/10/15 ranks, source hashes and full-field identity fingerprints.
- `v5/experiments/v5-1-results-score.cjs`: scores those SAME saved runner probabilities after externally sourced official results. A changed final starter list is **excluded**, not imputed. It reports matched race coverage, top-one wins, multiclass Brier score, log loss, and the candidate's **separately saved** Top 5/10/15. This does NOT replace the original analyst's human-reviewed Top 5/10/15 ledger.

The attached tests replay all 20 Rosehill/Ascot results on 7 Nov. The research packet has status `HISTORICAL_REPLAY_ONLY`, includes 197 matched runner forecasts, and deliberately leaves the Top 15 at 10/15 filled because no equivalent Flemington numerical model file was archived. The results scorer makes **zero prospective-lock claims**, even when historical results match.

### Use for a NEW future Saturday

The operator must gather full machine-readable form for each meeting, the dated official starter/withdrawal file, and genuinely sourced start times for **every** included race. Provide a `CONFIG.json`:

```json
{
  "schema": "v5-1-capture-config/v1",
  "mode": "PRE_RACE_DRAFT",
  "official_file": "official-fields.json",
  "start_times_file": "sourced-start-times.json",
  "cards": [
    {
      "meeting": "ROSEHILL",
      "research_file": "rosehill-research.json",
      "going": "Good 4"
    }
  ]
}
```

`sourced-start-times.json` needs a `v5-1-sourced-start-times/v1` schema, matching `date`, and `races` with `race_id`, `race_at_utc`, `source_url` and `observed_at_utc`. Sources must be genuine, not synthetic or inferred from bookmaker odds; do not copy the example meeting/going into a new date without checking.

```bash
npm run test:v5-1
npm run research:v5-1:capture -- CONFIG.json forecast-draft.json
# independently commit this exact draft to GitHub strictly before each included race;
# independently verify the exact committed bytes and commit date vs recorded starts.
# use the original final runners and published winner IDs in RESULTS.json:
npm run research:v5-1:score -- forecast-draft.json RESULTS.json paired-audit.json
```

The capture script uses the system clock, rejects stale timestamps and races already started, and refuses to overwrite forecast files. It issues only `UNVERIFIED_PROSPECTIVE_DRAFT`; a GitHub SHA-256 digest is **integrity evidence, not independent timestamp proof**. The existing `v5/forward.js` has stricter prospective-result attribution rules; the shadow modules deliberately never set that ledger to verified.

For final results, `RESULTS.json` must have schema `v5-1-official-outcomes/v1`, match the racing date and contain one `races` row per result with `race_id`, `winner_runner_id`, **entire** `final_starter_ids`, an actual `official_source_url`, and timezone-aware `verified_at_utc`. No result may be added to the forecast packet or original training/form data.

### Where to source future objective tactical evidence

- [Racing Queensland thoroughbred GPS sectionals and positional-map CSV files](https://www.racingqueensland.com.au/industry/thoroughbred/thoroughbred-sectionals) are an official source for *prior completed* Queensland runs; inspect race/date, measured variables and original source timestamps before joining.
- [Racing NSW Punter's Intelligence](https://www.racingnsw.com.au/punters-intelligence/?main=true) provides 3D replay and tracking including time, positioning, distance travelled and speed for completed NSW racing. App data should not be assumed to be a public programmable CSV/API.
- Neither provider currently supplies a verified future race speed map in V5.1; we **must not** label median historical position as a proven early-pace forecast.
- Any future sectional or interference signal requires a pre-race runner/race identity join, chronological source timestamp, source coverage counter, trial-vs-race distinction, and explicit missing-value handling. Do not add another numeric weight until identical paired historical and forward audits show a genuine lift in winner rate and probability calibration.

**Deployment status:** These tools remain in the experimental branch; no merge, Netlify deployment or production probability change is included.

## Sectional evidence: safe ingestion stage, no invented pace coefficient

**New research modules:** `v5/experiments/v5-1-sectional-evidence.cjs` and `v5/experiments/v5-1-sectional-evidence.qa.cjs`. All six targeted tests passed in a JavaScript harness; GitHub/Node CI still needs to run.

The public [Racing Queensland Thoroughbred Sectionals and Position Maps](https://www.racingqueensland.com.au/industry/thoroughbred/thoroughbred-sectionals) page provides historical CSV/ZIP files for Queensland thoroughbred meetings. The [Queensland open-data policy](https://www.racingqueensland.com.au/about/reports-and-data/open-data) lists thoroughbred sectionals and position maps among available racing datasets. A direct historical CSV retrieval attempt in this session was blocked by the source anti-bot/download process, **so the genuine original CSV headings and rows were NOT inspected and no production-grade source parser is claimed**. We also must not substitute greyhound or harness sectionals.

### What the validator actually does

It accepts ONLY an explicitly normalized JSON source with schema `v5-1-normalized-thoroughbred-sectionals/v1`. Each bundle specifies the source provider, real official URL, first-observed capture timestamp, and prior-race rows. Rows include past meeting date, venue, race number, horse, race distance and measured last-600m time, with optional 800-metre position, finishing position and GPS extra ground.

- Excludes any source not observed before the forecast cutoff, and any historical run dated on/after the target race date.
- Matches **horse + exact historical race date + venue + race distance** against a dated form start already present in the research dossier. A same-name match alone is insufficient. Archives not in the supported dated form format remain unjoined.
- Compares raw last-600m times **only within the same past race**. With fewer than three available past competitors, relative time and sectional rank are deliberately `null`.
- Rejects impossible split times, duplicate/conflicting rows, unsupported providers, missing provenance, and corrupt positions/extra distance.
- Reports peer count, measured past-race last-600m time, within-race relative split, position at 800m, finishing position and ground travelled, but **adds no score or win-percentage coefficient**.
- Marks source authenticity as unverified until the original official file and access time have been independently confirmed.

This is an essential first step to evaluate hidden runs, strong closing sectionals and running-cover differences that currently evade V5's position/margin-based recency signal. **It does not yet establish a numerical lift.**

### Next controlled experiment after original CSV parsing

Convert actual published Racing Queensland thoroughbred CSVs into the validator's normalized format using an inspected, version-pinned adapter, with preserved raw file/checksum and complete race coverage. Audit the number of runners with at least 2–3 genuine historical splits before devising a conditional adjustment. Compare original V5, V5.1 and a single explicitly specified sectional candidate on the exact same whole-field race cohorts; require evidence improvement without retrospective race-specific changes. Do not combine sectional metrics from different distances/surfaces without control or normalisation.

**No use of post-race winner knowledge, market prices or trainer statements is authorised inside the feature join.**
