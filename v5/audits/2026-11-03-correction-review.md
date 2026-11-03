# V5 3 November review — missing-class evidence reliability gate

**Status:** Draft quality-control fix, not a model improvement or production deployment.

## The verified modelling defect
The existing V5-L5 model maps *unrecognised race class* to a numeric quality of zero and compares that zero with positive observed rivals. This can produce an unjustified negative class component. It is a **data interpretation defect**, not proof that the horse should be upgraded. The source backtests are not independent enough to justify altering win probabilities after reviewing winners.

## What this branch actually fixes
- Keep the original L5 numerical scoring and model version completely unchanged so saved October and 3 November comparisons, historical Top 15, and race source archive remain reproducible.
- Flag model leaders with no recognised graded class evidence as `UNKNOWN_GRADED_CLASS` and **exclude them from the win-first priority and conditional-review lists**; no automatic replacement horse is invented.
- Explain the unrecognised grade and resulting uncertainty in the Race Centre instead of presenting the legacy zero as a verified poor-quality class rating.
- Add automated QA for the unknown-class status, no priority promotion, unchanged 100% whole-field accounting and unchanged calibration status.

## Why not change coefficients now?
Existing isolated `v5/experiments/model-neutral-class.cjs` was assessed on 49 reconstructed October races. It changed **zero leaders** (17/49 correct both) and made the total Brier and log loss slightly worse (see `v5/experiments/NEUTRAL_CLASS_RESULT_2026-10-30.md`). The source reconstructions lack independent pre-race freeze proof, so even improvement would not demonstrate a genuine future increase. The newer temperature audit also found worse holdout performance. A prospective challenge and sufficient new days are needed before promoting any alternative.

## Remaining tasks to raise true win rate
1. Complete official starter and reserve validation and independently dated historical class form before any new recommendation release.
2. Identify low-evidence runners and improve source extraction **before the race**, rather than penalising or rewarding unknown data arbitrarily.
3. Run original L5 and isolated neutral-class candidate in parallel using exactly the same pre-race locked fields and track scenarios.
4. Score unmodified raw top-one per race, stricter win-first selections and coverage, plus Brier/log loss on later officially verified results.
5. Only change production probability weights or graduate a model with genuinely independent holdout/forward evidence.

**No altered historical results, selection ranks, source dossiers, probability coefficients or original model version. No approval or live-site deployment.**
