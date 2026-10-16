# Calibration evidence audit — 16 October 2026

**Airtable data checked via connected Airtable tool:**

- Base: Australian Racing — V3 Analysis (`appEBALFjxF1Uxqfj`).
- Forecasts: 1,420 versioned records, concentrated on the 17 October 2026 three-meeting card.
- Results & Validation: **0 records**. No previous scored race outcomes are available in this base.
- Current 30-race / 341-runner snapshot: Friday archival model, **uncalibrated**; no historical accuracy metric available.

**Conclusion:** Actual historical calibration is **not established**; any displayed success percentage today would be invented. A ready-to-run results validator/calibration engine is built, but will display `NO_VERIFIED_BACKTEST` until adequate historical frozen forecasts and verified race results exist. 2026-10-17 race results will not exist until after the race date. No calibration mapping has been fitted; V3 probabilities are unchanged.

**Checks implemented:** original frozen/reviewed forecast IDs, pre-race creation-date proof, unique starter identities, one winner, official URLs, finish positions, observed-probability agreement, whole-field total, single version per race, exclusions for scratches/abandonments, Brier/log-loss/reliability/ECE and Wilson bin uncertainty. Missing or contradictory evidence causes rejection, not invented values.

**Study caveat:** Independently verifiable frozen snapshots and time-aware held-out backtesting remain required. The `validation/` hash manifest documents the packaged October 17 archival snapshot but isn't immutable external proof.
