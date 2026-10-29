# V5 win-first research repair — 30 October 2026

**This is a staged, research-only repair. It is not a deployed site update, a calibrated win-probability model, or an established improvement in hit rate.**

## What changed

- The existing 408-runner, 29-race source dossier is retained intact; a separate dated official source overlay applies scratchings without deleting horses or replacing historical forecasts.
- Friday scratching sheets identified 12 Randwick, 3 Flemington and 5 Ascot scratches. The overlay matches all 20 by **race ID and normalized horse identity**. All 29 whole-field race sums are rechecked after exclusions.
- Published working surfaces: Randwick Good 4, Flemington Good 4, Ascot Soft 5. These are dated sheets; 31 October race-day updates remain necessary.
- 21 named emergencies are treated as emergencies. Five field-limit promotions are **conditional projections**, not certified starters. Others are excluded. Working snapshot: 372 included, 36 excluded.
- The model's raw probabilities and its price-independent ranking are unchanged. It remains **V5-L4-20261030**, experimental and **uncalibrated**.
- A separate **win-first abstention screen** prevents unstable races from being pushed into Top 5/10/15 just to fill an arbitrary quota. The original homepage and standalone studio default to this selectable view; raw model ranking remains available.
- The 31 October screen yields **6 research priority candidates, 4 review-only candidates and 19 races to avoid**, using the stated thresholds. There are **10** eligible research candidates, not 15 invented recommendations.
- Short backups (<=7 days), breaks (>=70 days), no direct going sample and unusually large distance jumps trigger explicit review. These are not fitted negative coefficients.

## Deterministic screening checks (research hypotheses, not established predictors)

From each race's market-blind model leader:

- Model probability at least 17%, scenario floor at least 15%.
- Evidence coverage at least 78% (coverage is **not** confidence).
- At least 3 machine-readable dated starts.
- Lead over second place at least 4 percentage points; race chaos below 90.
- Remains first in at least 6 of the 8 saved stress scenarios.
- Scenario probability spread below 6 percentage points; no parsing/input errors.
- Race-day track and field conditions still separately require verification.

**PRIORITY_RESEARCH** has no screening or context flags. **REVIEW_ONLY** has no more than one screening and one contextual flag, excluding combined chaos+weak gap or unstable+weak gap. All others are **AVOID_RACE**. The filter abstains; it does not artificially boost anyone's win percentage.

These thresholds are conservative *workflow choices*. They have **not** been trained, backtested or demonstrated to improve winning outcomes. Do not advertise priority status as a high probability of winning.

## The class-weight problem

Holding the same 31 October fields fixed and varying only the independent model's class coefficient between 0.28 and 2.0 changes Sheza Alibi's computed win share from approximately **16.17% to 30.79%**. Across that range, the strongest candidates also change substantially. This is sensitivity, not a valid uncertainty interval. Simply increasing class weight until a preferred horse looks stronger would manufacture confidence.

The screen retains class diagnostic flags and requires validation on frozen, pre-race snapshots before any coefficient changes. Odds, bookmakers and historical assistant picks cannot influence its research ranking.

Historical archive: 17 October contains 7 winners among 28 verified race leaders, but the archive is explicitly retrospective rather than a clean out-of-sample evaluation. 24 October results are not fully verified in the repository. Neither supplies valid production calibration.

## Sources for Friday reconciliation

- Randwick: https://mdata.racingnsw.com.au/FreeFields/Scratchings.aspx?Key=2026Oct31%2CNSW%2CRoyal+Randwick — listed last publication 30 October, 06:25 AEDT.
- Flemington: https://www.racingaustralia.horse/FreeFields/Scratchings.aspx?Key=2026Oct31%2CVIC%2CFlemington — listed last publication 29 October, 20:58 AEDT.
- Ascot: https://www.racingaustralia.horse/FreeFields/Scratchings.aspx?Key=2026Oct31%2CWA%2CAscot — listed last publication 29 October, 15:12 AEDT.

These pages can change. The 31 October final scratchings, promoted emergencies, riders and track ratings must be reconciled again. Never silently publish the projected field as an official race-day lock.

## Verification

```sh
npm test
npm run check
```

Existing 28 formula/integration tests are preserved, with 4 new regression tests for overlay safety, inventory totals, abstention and scenario invalidation. The original Results & History files remain untouched.

Deployment is **intentionally deferred** until Netlify credits are available. This repair is isolated on a GitHub branch/PR; do not merge or deploy until QA is green and official final fields are checked.
