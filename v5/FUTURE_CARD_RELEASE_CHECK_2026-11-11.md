# V5 last-mile future-card release rehearsal — 11 November 2026

**Purpose:** Stop a new, explicitly Soft-rated racecard from being silently validated as the model default Good 4. This changes **no formula coefficient**, no historical results and no live Saturday selections.

The `scripts/v5-safe-build.cjs` gate now calls `future-card-preflight.checkResearch` using `active.going` for any new date other than the archived 3 November card. It then regenerates the full field probabilities with the **same explicit going**, checking every race's modelled grade equals what the page will display. Missing a meeting, invalid track grade, source inventory mismatch or unmodelled race blocks the build. The old 3 November active-card path keeps its historical handling, and the original 31 October archive remains unchanged.

A synthetic two-meeting 14 November test exercises: different going on two tracks, exact inventory including scratched and unactivated emergencies, full-field 100% distributions, staging dry-run then local apply, normal browser selection, archive query routing and official scratching effects. **Synthetic test horses are not real racing form.** The Saturday actual fields are still absent and the publication approval remains false.

Run `npm test` (which includes `v5/future-card-rehearsal.qa.cjs`) and `npm run check` with the existing archived active card. Future actual activation requires complete official sourced fields, track grade, source cutoff and a new independent pre-race lock. Do not automatically deploy, promote uncalibrated model chances or rewrite Top 5/10/15 human research records.

Netlify deployment is separate; this commit is for GitHub QA only.
