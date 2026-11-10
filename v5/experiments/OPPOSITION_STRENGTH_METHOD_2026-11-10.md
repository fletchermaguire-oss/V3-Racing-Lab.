# V5-L5 targeted opponent-strength shadow

**Research only. L5 unchanged. No forecast or win-rate claim.**

The existing class feature scores grades (G1, G2, BM, etc.) and anchors to the **current** rival class-quality proxies. It does not measure the actual *historical opponents* that runners faced. The three archived source cards on 17, 24, 31 October have 1,052 runner entries and **zero structured historical opponent-rating links**. No valid real-race opponent-weight uplift can be measured on these cards.

## What qualifies as independent new evidence

For each included runner of a future full field, provide at least two historical race entries that **match a dated/form-place/field-size record in the archived source**, each with:
- Exact historical race ID/date/start time, field size and runner identity.
- Officially published original source URL, source content SHA256, publication and capture timestamp.
- At least 60% of the *other historical starters* individually linked by stable runner ID with numeric official ratings and proof their rating timestamp pre-dates that historical race.
- A single comparable, explicitly stated **rating scale** across the current field. Australian jurisdictions may use different handicap scales: do not blend unproven cross-jurisdiction ratings.
- A target race scheduled start UTC and a **strictly earlier** evidence as-of UTC. The source code only checks syntax and self-reported timestamps. A separate independent external process must confirm source authenticity and frozen provenance.

Missing or incomparable evidence for **any active runner** makes the race abstain: exact L5 forecast remains unchanged. No fabricated speeds, fallback grade ratings, zero-imputation, odds or winner labels are permitted.

## Bounded provisional candidate

Per historical run, peer difficulty = 70% median of verified opponent ratings + 30% median of upper quartile. Across two to five recent runs, use 0.82 recency decay. For a current race, regress these opponent-difficulty scores on the **already measured L5 class grade-quality** across the full field, and use *only the capped residual*, not the class-correlated component. Every runner's shadow unreserved L5 weight is multiplied by \`exp(0.10 * residual / 0.78)\`, re-normalized, then original 15% uniform reserve is restored. This is **not a trained or calibrated coefficient**, and exact 0 strength reproduces L5. It cannot create huge favourite flips.

This is an experimental scoring definition, not evidence of predictive gain. Run synthetic QA only until enough genuine, independent, date-stamped opponent rating fields can be obtained. Once available, score every unchanged L5 and shadow race pair on a genuinely later untouched holdout (win picks gained vs harmed, Brier, log loss, coverage, abstentions). Do not select this adjustment because it retrospectively helps one winner.

## Integration decision

Keep existing V5-L5 main model, model percentages and archived human rankings unchanged. The optional shadow can run **only off formally sourced new historical opposition fields**, and must be rejected or left inactive without them. This is a small incremental formula candidate, not a V6 rebuild.

**Cross-runner QA:** When two current horses reference the same historical race ID, their historical field size, date, venue, rating scale and any overlapping rated opponent identities must agree. Conflicting finish places are withheld (unless an independently verified dead-heat treatment is added later). The entire current race abstains rather than treating contradictory input as an ability signal.
