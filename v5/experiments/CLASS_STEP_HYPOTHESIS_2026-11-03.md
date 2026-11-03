# Racing Lab V5 — independent race-class evidence challenger

**Status:** research-only, no output used to publish selections or alter live V5 coefficients. This stage is additive to the 91-race rank-driver audit in PR #25.

## Question

Does V5 miss winners because it does not explicitly compare the **class of today's race** with **the class level in which a runner previously performed competitively**?

The existing `classQuality()` compares historical grade-weighted performances against other entrants, but doesn't explicitly compare them to the current race's required class. This module tests a bounded candidate class-step adjustment. This is an unvalidated hypothesis, not an official ability metric.

## Locked candidate rule

The target grade must be explicit in saved source `race_class` (3 November PDF and 31 October saved card) or `class` (17 October retrospective dataset). No recognition => neutral (including 24 October, whose 19 races lack an explicit source class). No race-title guessing, future result lookup or unverified grade inference.

For each entrant, use only five latest readable **pre-race** dated starts with recognised grades. A historical start counts as *competitive* if the entrant finished Top 3, Top Half or within two lengths. The highest such class is treated as a provisional proven-class proxy. The class-step gap is `max(0, target_grade - highest_competitive_historical_grade)`. Missing evidence => unknown/null, **not** an assumed penalty. Candidate scoring applies a fixed class-rise logit penalty of `alpha * min(2.5, class_step_gap)`, with predeclared `alpha = 0, 0.2, 0.4`; the unchanged V5-L5 temperature/uniform reserve and actual saved runners preserve 100% full-field totals.

## Explicit exclusion: invalid individual speed

The 3 November Feature Form import includes `sectional_evidence[].race_time_last_split_seconds`, but its records are `horse_specific:false`. That is a **race-level** split, not a runner-specific speed/last-600 measure. No speed figure or time-based boost may be derived from it. The same source contains 384 separate barrier trials, which must not be treated as official race wins.

## Validation

- Use 30 reconstructed 17 Oct races, 19 reconstructed 24 Oct, 22 of 29 31 Oct races after excluding 7 known full-starter mismatches, and 20 saved 2 Nov provisional-source races for 3 Nov.
- Winner matching occurs in the evaluator **after** the source-only class feature and probabilities are computed.
- For every fixed candidate report first-ranked winners, Top 3/5, average Brier and log loss by date and aggregate. Missing class target coverage must also be reported rather than treating untested races as improved.
- None of the samples is a verified chronological independent holdout. A good 3 Nov score cannot justify a post-result weight update.
- Hold off any actual production release until full fields, pre-jump code/snapshot proof and meaningful later genuine out-of-sample gains.

Run `npm test && npm run check && npm run research:rank-driver && npm run research:class-step`.

No Netlify deployment; archived selections and results unchanged.
