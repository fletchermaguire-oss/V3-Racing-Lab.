# V5-L5 incremental formula decision — 10 November 2026

**Unchanged baseline:** V5-L5. No live model coefficients or original ranked horses rewritten. **This is a decision record, not a Saturday racecard.**

## Whole-field historical comparisons

| Research-only candidate | Races | Winner ranked 1st | Winner top 3 | Winner top 5 | Mean multiclass Brier ↓ | Mean log loss ↓ |
|---|---:|---:|---:|---:|---:|---:|
| Unchanged L5 | 91 | 27 | 49 | 65 | 0.855503 | 2.209260 |
| Regional ungraded Open residual 0.18 | 91 | 27 | 49 | 65 | 0.855351 | 2.208866 |
| Regional ungraded Open residual 0.36 | 91 | 27 | 49 | 65 | 0.855217 | 2.208537 |
| Historical settling pace .30 | 91 | **28** | 49 | **66** | **0.854349** | **2.205250** |

**Regional/Open hypothesis:** 18 races had exposure. The .18 setting changed 1 winner pick without adding or removing a win; .36 changed 2 picks without gaining/loss. This is not enough evidence for a production numerical update; regional venues are not verified opposition strength.

**Pace hypothesis:** Fixed predeclared 0.30 with 70% historical settling coverage altered four first picks across 91 races: **1 gained winner, 0 lost winners, 3 changes between losing horses**. Gains concentrated in a single **3 November Flemington R3** forecast using the provisional Monday 2 November card: baseline leader Mister Whiskers, pace shadow winner Billycart. Both 17 and 24 October had insufficient historical settling coverage, so their leaders did not change. The 31 October candidate flipped two picks but did not gain a winner.

### Decision

Keep L5 as public baseline and **freeze the 0.30 pace shadow rule** as a small conditional candidate for Saturday 14 November, strictly under a complete verified official field and pre-jump data lock. Continue collecting truly comparable individual runner speed and opponent ratings. The historical 91 races are **not independent forward-locked**: earlier dates were reconstructed, 31 October excludes 7 field mismatches, 3 November uses Monday provisional fields. There is no statistically supported claim of a higher future win rate.

Evidence and executable audit: `v5/experiments/pace-map-shadow.cjs`, `v5/experiments/pace-flip-audit.cjs`, `v5/experiments/venue-open-shadow.cjs`; [GitHub Actions clean comparison](https://github.com/fletchermaguire-oss/V3-Racing-Lab./actions/runs/42725964032).

### Fixed prospective test requirements

- Confirm race date, complete official starters, emergency promotions, going and pre-race data as-of.
- Pin the model and shadow code Git blob SHAs, data snapshot hash, and actual freeze timestamp independently before each jump.
- Publish the original L5 pick as production and display experimental pace as **shadow only**, never a confident percent or override.
- Score **every eligible race**, including wrong flips and no-action races, with winner rank, Brier, log loss, data coverage and abstentions.
- Never select coefficients retrospectively from the 14 November results or import after-race race-shape observations as if known pre-jump.
