# Racing Lab V5 — Saturday final data handover (31 October 2026)

**Status:** Prepared, not deployed. Do not claim the Saturday fields are final while only the Friday source is loaded.

## Which files change Saturday morning

- `v5/official-latest.json` — the ONE replaceable official sheet overlay. Friday source is archived in `v5/official-snapshot-20261030.json` and must not be overwritten. The date must remain `2026-10-31`.
- `v5/shortlists/current.json` — the ONE replaceable *independent, human-reviewed* Top 5/10/15 / A-tier checkpoint. Keep the previous 30 October checkpoint `v5/shortlists/2026-10-30-independent-top10.json` intact. If the top ten stays the same, there is no reason to rewrite it.
- `v5/research.json` — update only with newly verified form/gear/trainer evidence that can be sourced and audited; NEVER introduce post-race results into pre-race form.

The website loads the two replaceable files. A changed official overlay must not silently erase the human Top 10 or change original form A grades. When a runner is scratched, it retains its archival ranking but displays **OUT OF FIELD**; it cannot be part of an automatically filled multi. Model percentages recalculate across the included runners.

## Race-day timing (Brisbane time)

- Randwick and Flemington official scratchings close **6:30am Brisbane** on Saturday 31 October (7:30am AEDT).
- Ascot official scratchings close **10:00am Brisbane** (11:00am AEDT, 8:00am AWST).
- Check official race sheets and track grades after these deadlines. Late scratchings remain possible after the initial close.
- Official published grades on 30 October were Randwick Good 4, Flemington Good 4, Ascot Soft 5. Re-check before claiming any rating is current.
- Final *official* starters and emergency promotions require direct separate confirmation; the Friday projected emergency counts **are not certified**.

## Race-day overlay schema

Friday snapshot uses `racing-lab-friday-field-overlay/v1`, `checked_date: "2026-10-30"`. A Saturday replacement should use `racing-lab-racecard-overlay/v2`, `checked_date: "2026-10-31"`, and `checked_at: "2026-10-31THH:MM:SS+11:00"` for a time checked in NSW/VIC daylight time (or proper explicit source offset). A date-only race-day snapshot is rejected. Keep `publication_approved: false`, `scratchings`, `emergency_order`, `projected_promotions`, `source_documents`, `going` and `notice` present.

The source-matching engine rejects unknown/double-counted scratches. **Do not invent emergency activations**. A newer `v5-official` serverless endpoint also reads each official published sheet, verifies their claimed totals and records published timestamps. It only works **after a Netlify deployment** and is no substitute for actual field verification.

The automatic refresh is conditional on the site being open, with approximately five-minute intervals; it cannot run on an undeployed GitHub branch. A stale/invalid or inaccessible source leaves the prior field data in place and displays a refresh error. Local manually chosen going scenarios are preserved while an official update is noted. A timestamp on a scraped sheet reflects publication, not certification that the field is final.

## Selection rules

1. Preserve Sheza Alibi, Regal Ambition and Hot And High **original A-tier form profiles** independently from their current *race-day confidence*; they were not assigned calibrated 80% probabilities.
2. The independent Top 10 stays in original rank order until a documented human research update with source, timestamp and before/after reason. Recalculated percentages and scratchings alone do **not** silently reorder that research list.
3. The strict *model-only* win-first screen is a separate view. It can abstain on contested races and need not provide ten names.
4. Model probabilities are uncalibrated. Neither historical V5-L4 nor V5-L5 has proven a large hit-rate gain. Do not claim a verified betting edge.
5. Manual browser edits are local to that device, not automatically published to GitHub/Airtable. The history survives an updated frozen checkpoint, but old manual overrides are not silently applied to an independently updated research snapshot.
6. The existing Results & History page must remain unchanged; do not replace genuine results or retrospectively revised selection logs with a newly computed Top 10.

## Deployment gate

Run `npm test`, `npm run check`, `npm run research:audit`; confirm all three complete successfully, race/runner totals reconcile, review form and track ratings, then obtain the user's approval to merge/deploy. **Netlify deployment credits remain unavailable until the user upgrades.** Do not merge or deploy the experimental draft branch without express authorization.

GitHub draft: https://github.com/fletchermaguire-oss/V3-Racing-Lab./pull/3

## 30 October final engineering changes before Saturday

- The independently researched Top 10 remains archived at `v5/shortlists/2026-10-30-independent-top10.json`.
- The live candidate `v5/shortlists/current.json` has **15 ranked names**. Ranks 11–15 are Bridal Waltz, Afireofgidgeecoals, Anaconda Jones, Where'stheprofit and In Confidence. They are clearly marked `CONDITIONAL_REVIEW`, not promoted as high-confidence bets. Backup archive: `v5/shortlists/2026-10-30-independent-top15-review.json`.
- V5 still preserves original Sheza Alibi, Regal Ambition and Hot And High A-tier form grades separately from conditional race-day confidence.
- Unconfirmed emergency activations are flagged per race. The official scratching feed may remove runners but **does not confirm or automatically promote emergencies**.
- `v5/prospective-record.json` is **intentionally empty** until a real pre-race GitHub commit and independently checked race times are available. The separate forward-only Results panel must display zero, not extrapolate a winning record from the retrospective 49 races.
- Do not treat an automatic model refresh as a new pre-race locked selection. Pre-race selected identities and rank must be preserved and versioned before the jump. Individually verified official outcomes can be added only *after* those races.
- Repeated unchanged Airtable or official-sheet refreshes must not reset the simulator/playback. Model and UI tests cover first-page rendering, simulator draws and ranking integrity.
- Last code checks run in GitHub Actions: `npm test`, `npm run check`, `npm run research:audit` (all must be green on the newest commit). No live browser/device visual QA or Netlify deploy has been performed.
