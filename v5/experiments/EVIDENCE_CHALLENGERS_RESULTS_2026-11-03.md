# V5 evidence challengers — actual comparative results (3 November 2026)

**Experiment run:** GitHub Actions, `npm test`, `npm run check`, `npm run research:rank-driver`, `npm run research:class-step`, `npm run research:pace-map` (all successful). **Scope:** read-only retrospective source analysis, **NOT** a verified forward/backtested improvement or production release.

## Four-date result table

| Frozen-source diagnostic | Races | Winner first | Winner top 3 | Winner top 5 | Brier ↓ | Log loss ↓ |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Unchanged V5-L5 | 91 | **27** | 49 | 65 | 0.855503 | 2.209260 |
| Class step penalty = 0.2 | 91 | 27 | 48 | 65 | 0.855700 | 2.210264 |
| Class step penalty = 0.4 | 91 | 27 | 49 | 62 | 0.856775 | 2.214681 |
| Historical pace pressure = 0.12 | 91 | 27 | 49 | 66 | 0.855025 | 2.207414 |
| Historical pace pressure = 0.30 | 91 | **28** | 49 | 66 | **0.854349** | **2.205250** |

These are **not** clean unseen evaluations. The 17 and 24 October archives were reconstructed; seven 31 October races with actual/model starter-field mismatches were excluded; the 3 November source was frozen from **Monday 2 November** and still had provisional final starters and going.

### Class progression — rejected

- 17 October (30 races): baseline 13 Top-1; both class-step variants 13.
- 24 October (19 races): **no explicit target race class** in the saved input; unchanged 4 Top-1.
- 31 October (22 retained races): **no explicit target race class** in the saved input; unchanged 7 Top-1.
- 3 November (20 races): baseline 3 Top-1, both class-step variants 3; the strongest variant worsened Brier 0.897921 → 0.905843, log loss 2.544289 → 2.581996.
- Across all dates, **41/91 races have no explicitly stored current race-class designation**. The adjustment thus has effective source coverage for only 50/91. Do not fill in race class by guesses from a sponsor's race name.

**Decision:** do NOT promote class-step adjustment. Existing race-relative grade assessment remains an imperfect ordinal proxy; simply penalising unproven class rises is not demonstrated to improve winning picks.

### Historical pace map — cautiously interesting, not promoted

Using pre-existing median historical 800m settling positions, a fixed map labels a race as likely early-pressure if ≥70% of the modelled runners have settling evidence and at least four settle in the early third. A hypothetical fast pace gives a bounded boost to historically later-settling runners and a bounded negative to early-settling runners. There is **no manual per-race winner override**.

- 17 Oct: 30/30 fields lacked enough settling evidence; all variants unchanged at 13 winners.
- 24 Oct: 19/19 lacked enough settling evidence; all variants unchanged at 4 winners.
- 31 Oct: 11 pressure contests and eight insufficient races; baseline 7/22, both variants 7/22, Brier marginally lower.
- 3 Nov: 17 pressure contests and one insufficient race; baseline 3/20 and 0.30 strength 4/20; Brier 0.897921 → 0.893721 and log loss 2.544289 → 2.528933.

Overall **58/91** lacked enough settling evidence and the detector identified **no slow-pace races at all**. The same retrospective card that was examined to build the hypothesis supplied the only additional Top-1 winner. That cannot be called an honest uplift, calibration, safe multi or reliable winner-separation.

**Decision:** keep as a *read-only shadow challenger* for the **next genuinely frozen race day**. Predefine the exact thresholds and strength before knowing its results. Do not tune thresholds to the 3 November winners.

### The input-quality fix that matters

The 3 November Racing & Sports Feature Form research source contains **333 runners**; **321** contain `sectional_evidence`, and **zero of the 333** contain a `horse_specific:true` split. Those race-level closing times are NOT the runner's personal sprint/last-600. They cannot feed a horse-speed rating.

Genuine horse-specific data sources to verify independently:
- [Racing NSW Punter's Intelligence](https://www.racingnsw.com.au/punters-intelligence/) — official individual horse timing, tracking, distance travelled and positioning (via the dedicated application).
- [Racing Queensland — Thoroughbred Sectionals and Position Maps](https://www.racingqueensland.com.au/industry/thoroughbred/thoroughbred-sectionals) — official downloadable sectional CSVs for selected Queensland meetings.

These sources are not automatically ingested or assumed to cover all races; data licences, format, track-specific comparability, horse/date/race identity and snapshot timestamps must be verified before using any row. A bare 600m value from generic race form **must not be promoted to horse-specific performance evidence**.

## Next practical checkpoint — Saturday 7 November

Official fixtures: Flemington TAB Champions Stakes Day (Champions Sprint/Mile/Stakes) and Rosehill Five Diamonds Day. References:
- [Victoria Racing Club](https://vrc-prod-cdn-cxdkhbhwgvh3e0g5.z01.azurefd.net/race-days-and-events/2026-2027/tab-champions-stakes-day/)
- [Australian Turf Club](https://www.australianturfclub.com.au/races/five-diamonds-ladies-day/)

Before a prediction or shortlist is released:
1. Import complete dated runner form for **every** accepted runner and serious rival; preserve official track, rail, final scratches/emergencies, equipment, rider and claim, and source publication timestamps.
2. Require explicit, race-level grade and horse-specific sectionals with provenance. Missing remains *unknown*, never assumed.
3. Calculate baseline L5 and the **predeclared**, fixed historical pace shadow candidate on *identical* starters and conditions; freeze both pre-jump in GitHub with source hashes. **Do not auto-publish shadow picks**.
4. After results, compare Top-1, Top-3, Top-5, Brier/log loss, field verification, coverage and abstention; record every selection rank before results. No retrospective exclusion of losses.

**No production model or coefficient change is supported today. Historical results and the current live site have not been rewritten.**
