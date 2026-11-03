# V5 ranking repair audit — 3 November 2026

**Status:** Reproducible retrospective error analysis, **not** a new formula and **not** evidence of a forward win-rate improvement. Current production formula / coefficients, published forecasts, archived selections and results are unchanged. Execute `npm run research:rank-driver`.

## Four dated cohorts — fixed saved baseline (alpha = 1.00)

| Event date | Races evaluated | Winner ranked #1 | Winner ranked top 3 | Winner ranked top 5 | Provenance |
| --- | ---: | ---: | ---: | ---: | --- |
| 17 Oct | 30 | 13 | 18 | 22 | Retrospective reconstruction, not pre-race freeze |
| 24 Oct | 19 | 4 | 8 | 13 | Retrospective reconstruction, not pre-race freeze |
| 31 Oct | 22 | 7 | 13 | 17 | Saved pre-race source, **7 field-mismatch races excluded** |
| 3 Nov | 20 | 3 | 10 | 13 | **2 Nov provisional 333-runner source**, not final 3 Nov scratchings |
| **Combined diagnostic** | **91** | **27** | **49** | **65** | Not a clean independent holdout |

This **does not replace** the separately discussed 3 November after-scratch diagnostic, which found **5/20** raw leaders after changes to actual going and withdrawals. The saved Monday 2 November model initially ranked only 3 of those winners first.

### Why exactly did 3 November fail to produce a dominant leaderboard?

The archived 2 November model leaders collectively carried only **3.13 expected wins** (sum of the 20 uncalibrated leader shares), and **three** actually won on the untouched Monday board. Its average raw model first-ranked share was **15.63%**, not remotely close to a 60% reliability claim.

Of the 20 races:
- **11** had chaos ≥90 (very little model separation),
- **10** had a highest-rated runner below 15%,
- the seven winners that the model ranked outside the Top 5 all came from fields **at least 15 horses**,
- in 12 large fields (15+ runners), **seven winners were ranked outside Top 5**; in the eight smaller fields, **zero** were outside Top 5.

These are *descriptive* findings on one date, not evidence for a fitted field-size cutoff or a recommendation to reject all big fields.

## Fixed recency-weight multiplier experiment

The original recent-form coefficient is 0.76. This test preserves all other components, runner identities, uniform reserve (15%), and temperature (0.78). The old multinomial logits are reconstructed from saved whole-field probabilities and multiplied by `exp((alpha-1)*recency/temperature)`. The test does **not** modify stored predictions.

| Weight multiplier | All 91 Top-1 winners | All 91 Top-5 winners | Multiclass Brier ↓ | Mean log loss ↓ |
| --- | ---: | ---: | ---: | ---: |
| 0.00 | 21 | 63 | 0.876337 | 2.284263 |
| 0.50 | 23 | 67 | 0.863866 | 2.232879 |
| 0.75 | 27 | 69 | 0.859151 | 2.217861 |
| **1.00 (unchanged)** | **27** | **65** | 0.855503 | 2.209260 |
| 1.25 | 27 | 64 | 0.852949 | **2.206415** |
| 1.50 | 27 | 64 | **0.851491** | 2.208610 |

**Important:** No multiplier beats the original's **27/91 Top-1 record** across these four cohorts. A lower recent-form weight worsens the mean probability metrics; higher recent-form weight helps probability scores by tiny amounts but **does not improve Top-1 count** and has date-to-date regressions.

Notable inconsistency: at alpha 1.50, **24 Oct** log loss worsens **2.275402 → 2.337353**, and **31 Oct** Top-1 hits fall **7 → 6**. On the post-race 3 Nov provisional dataset, Top-1 increases **3 → 4**. This is exactly why tuning to a single day's apparent improvement is not acceptable.

## Next action required for genuine better selections

The strongest evidence-backed engineering priorities are not a new slider:
1. **Complete, verified starter fields before the jump** — missing starters and emergency changes make any numeric ranking suspect. Preserve official source publication times and late scratchings.
2. **Richer performance variables, recorded before the race** — comparable race class and opponent strength, actual adjusted speed/sectionals when available, going, pace and relevant rider/claim information. The current last-start finish is a crude proxy.
3. **Rankings, not only calibration** — evaluate challenger Top-1, Top-3, race chaos, Brier and log loss on identical starters, with ranking **and** percentage accuracy reported separately.
4. **Only high-conviction selections when evidence supports them** — a raw Top 10 chosen from 15%-chance race leaders must not be labelled a list of locks; report number selected and coverage as well as strike rate.
5. **Genuinely forward evaluation** — timestamped full-field inputs and rankings locked before race starts; subsequent scores independently matched to results. Neither 60% nor any numeric improvement is defensible yet.

Source results: [Flemington TABtouch](https://www.tabtouch.com.au/racing/2026-11-03/mr/expanded) and [Randwick TABtouch](https://www.tabtouch.com.au/racing/2026-11-03/sr/expanded).

**No production weights adjusted, no after-results re-ranking, no website deployment, no invented improvement.**
