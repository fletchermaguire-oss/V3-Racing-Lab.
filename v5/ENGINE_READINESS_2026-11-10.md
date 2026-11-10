# V5 engine readiness repair (10 November 2026)

This branch fixes racecard integrity and publishing checks, not horse research or the mathematical L5 weight coefficients.

- No silent Good 4 default for future card loading.
- No reuse of 29 October track assumptions on future dates.
- Generalized cumulative scratching date checks.
- Active + excluded runner inventory integrity.
- Future-date pre-race proposal gate; late approvals and overrides are blocked.
- Reject multiple main selections in the same race.
- Legacy dated horse-name override writer disabled.
- Date-agnostic new-card preflight with whole-field 100% checks.
- Input diagnostics warn where sector context for generic OPEN form is unknown, without changing existing class coefficients.

No model probabilities are certified. Source URLs and asserted timestamps still require external verification. No new selections, results, training or deployments are included.

Run `npm test`, `npm run check`, `npm run preflight:future-card -- v5/cards/YYYY-MM-DD/research.json v5/cards/YYYY-MM-DD/going.json`.

V5-L6 is *shadow only* until independently frozen forward paired results support an upgrade.

Future staging is dry-run by default: `npm run card:stage-reviewed -- . v5/cards/YYYY-MM-DD/research.json v5/cards/YYYY-MM-DD/going.json`. A reviewed, explicitly authorized local activation additionally uses `--apply`; this is NOT a deploy.

## Missing-class reliability protection

Ported the tested quality-only protection from the earlier draft PR #24: leaders with zero recognised class evidence receive `UNKNOWN_GRADED_CLASS` and cannot be promoted into strict win-first priority/review without source validation. The raw L5 score, formula coefficients and race probabilities are unchanged; a withheld leader is not replaced by a different horse. Dashboard discloses the missing grade as uncertainty, not weak class.

## L6 historical evidence integrity

New `v5/l6-evidence-gate.cjs` blocks race-level last-600 timings from being labelled horse-specific, rejects mismatched runner identities, same-day results, late source captures, unknown adjustment methods and incomplete opponent measurements. Returns per-race source coverage, never invented speed scores. It **never adjusts probabilities** and never claims that URLs or hashes prove source authenticity. Sources still need independent pre-race attestation before L6 can be scored.

## Small class-context experiment

Run `npm run research:regional-open` to compare unchanged L5 vs two **non-production** class-context residuals across 91 retrospectively reconstructed/modelled races. Results never rewrite L5 coefficients, probability forecasts or outcomes. Detailed method: `v5/experiments/REGIONAL_OPEN_SHADOW_METHOD.md`.

## Pace leader-flip audit

Run `npm run research:pace-flips`. This extends the earlier fixed 0.30 historical settling pressure research (draft PR #26) with an honest race-by-race list of changed leaders, additional winners and correct picks damaged. Reuses original L5 scenario probabilities and changes no baseline score. A 14 November preregistration manifest freezes the rule before the next card, but contains NO actual forecasts.
