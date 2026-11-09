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
