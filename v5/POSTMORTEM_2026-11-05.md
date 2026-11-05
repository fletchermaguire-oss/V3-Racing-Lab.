# 5 November 2026 — V5 independently sourced race-day review

This is a **post-race outcome audit**, not evidence that a new predictive formula has been calibrated.

## Verified outcomes and immutable provenance

The original Wednesday GitHub commit 1806317f5ed6589d026872020041fab17f91cc49 recorded nine qualitative research selections (Rey Magnerio R9 was a **conditional replacement** for Cavalry Girl). It published **no validated win probabilities**. That exact site selection cohort won 3/9: You're Not the King, Proxima Dea and Rey Magnerio.

Thursday's subsequent final chat selections used manual (not model-calibrated) percentages, changed R6 to Bel Mezyaan and R9 to Stokke, and won 2/9: You're Not the King and Proxima Dea. The final chat Top 5 is 1/5 and Top 10 is 3/10. These may not be aggregated with Saturday retrospective cohorts and are not comparable certification levels.

Results by race: R1 Chiringita; R2 You're Not the King; R3 Harry's Yacht; R4 Bella Verona; R5 Nobler; R6 Sulek; R7 Lady Catalina; R8 Proxima Dea; R9 Rey Magnerio. Every winner, first four, and source URL is retained in outcome-audit.json.

### Failure mechanisms to investigate prospectively

1. **Uncontrolled selection overrides.** A qualitative Wednesday R9 replacement (Rey Magnerio) was replaced with Stokke by chat after last-minute analysis, with no repeatable versioned rule; the original won.
2. **Misinterpreted track scenario.** Race-day official morning Soft 5 inspection and Wednesday rain were treated as decisive by the manual forecast, but all nine result pages report Good 4. No automatic probability update should occur without matched effective-time evidence.
3. **Insufficient danger separation.** Nobler's 2.5kg relative swing was explicitly identified, but Perisher retained a 36% judgment estimate; Nobler won.
4. **Weak wet/gear opposition adjustment.** Bella Verona, who carried 3.5kg less and had first-time blinkers, was assessed at 12% against Sass Appeal at 46%; Bella Verona won.
5. **Scratchings-driven certainty inflation.** Tavi Time's manual win estimate rose to 31% on R3 withdrawals without an independently recalculated complete Good 4 field, and Harry's Yacht won.
6. **Pace/straight-lane uncertainty.** Lady Catalina won R7 while the top picks were Sequinned and Scintillation; the actual lane/pattern must be audited from race replay, not claimed from a pre-race map.
7. **R6 lower-tier coverage.** Sulek had independently verified strong recent closing figures but wasn't the leading research pick; Sulek won.

These are observations / hypotheses, not fitted new coefficients or proven causal explanations. Do not train on one card and then cite improved success without independent forward tests.

## Mandatory publication gates for future race days

- Freeze a versioned full-field runner list and evidence timestamp before each race; verify race-start time and keep commit proof.
- Track the *effective time* of going changes; show current official going and previous grades separately. No downgrade or upgrade inferred solely from nearby weather stations.
- If final starters, active emergencies or whole-field probability normalization are unverified, show **research only**. Suppress "final certified win %" and "lock" labels.
- Never mix archived **site picks**, **final chat picks**, **model leaders**, and **Top 10 runner hit rate** in one numerator/denominator.
- For each race, compare win leader, next two dangers, weights, map, sectionals, gear and material uncertainty with a traceable decision log.
- An override needs **source, reason, revised entire race probability vector, timestamp and saved version**; no after-race silent override.
- Assess time-aware multi-class Brier/log-loss and race-leader hit rate only on genuinely locked, separately verified forward cards; disclose abstentions and coverage.

This fix records Thursday, corrects the site results UI, and enforces a regression test. It **does not** assert the predictive formula is now more accurate or change unverified model coefficients.
