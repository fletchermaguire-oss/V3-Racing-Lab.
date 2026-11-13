# Racing Lab V5 — Saturday 14 November 2026 research checkpoint

## Meeting scope
Sandown Hillside (R7 on Lakeside), Ascot, Doomben and Newcastle; 10 programmed races at each meeting.

- Research data: `research-checkpoint.json` — 62 individually attributed observations across four meetings.
- Readable board: `/v5/saturday-2026-11-14.html`; linked from `/v5/`.
- Created 13 November 2026 (Brisbane time), **RESEARCH_ONLY_UNFROZEN_NOT_LIVE_MODEL**.

## Verification warnings
- Newcastle was not previously the subject of full V5 field-by-field analysis. Its Racing NSW preview, stable interviews, provisional runners and notable gear angles are now included as a **starting checkpoint**, not completed analysis.
- Pericles appears in older Newcastle acceptances but was reported scratched from The Hunter on 11 November; a Sandown Orr Stakes start is listed. **Do not treat him as active at Newcastle pending final official reconciliation**.
- Doomben Friday reports have shifted to **Soft 6**, whereas older meeting previews carried Good 4. Racing Queensland's 13 Nov calendar publishes Soft 6 with rail true. Recheck race-day conditions.
- Ascot Friday lists Soft 5; Sandown and Newcastle Friday listings Good 4. All conditions may change before the jump.
- Sandown R7 uses Lakeside; do not copy Hillside bias assumptions.
- Some previous conversation insights lack independently checked individual horse splits or primary stewards sheets and are labelled `PREVIOUS_RESEARCH_RECHECK`. Source URLs support the underlying racecards; they do not automatically prove the prior inference.
- Trainer $100 survey is published opinion, **not** model calibration.

## Explicitly not completed
No official complete-starter attestation for all 40 races, no finished individual form import, no full horse-level sectional or speed map audit, no frozen independent Top 5/10/15 for 14 Nov, no complete V5 probabilities, no live model activation and no validated winning multi.

## Preservation
No change to `v5/official-latest.json`, `v5/shortlists/current.json`, `v5/research.json`, `v5/active-card.js`, `v5/model.js`, old dated card archives, results histories or mathematical coefficients. The original live dashboard is still its older archived model until a separately verified and approved card is built.

## Checklist to release
1. Obtain full official starters, jockeys, withdrawals, reserve activations and updated track grades by race.
2. Import all runner dossiers and individual sectionals, with source-date cutoffs and no future information.
3. Build whole-field race probabilities using same-version V5 and confirmed surface scenarios (100% each).
4. Independently review, freeze and publish only source-reconciled 14 Nov selections, with clear abstentions and raw uncalibrated percentage labels.
5. Pass `npm test`, `npm run check`, and `npm run preflight:future-card -- v5/cards/2026-11-14/research.json v5/cards/2026-11-14/going.json` **only after those files exist**.
6. Verify any Netlify build/deployment and page visibility before claiming the site is live.

## Key public sources
- Sandown form and gear: https://www.racingandsports.com.au/form-guide/thoroughbred/australia/sandown-hillside/2026-11-14
- Stable survey: https://sen.com.au/news/2026/11/12/horse-racing-tips-2026-how-key-trainers-would-spend-100-at-caulfield-more-29-08-copy-copy-copy-2-copy-copy-copy-copy-copy-copy
- Concord Connie: https://www.racingandsports.com.au/news/racing/news/2026-11-13/connie-summoned-for-one-last-spring-fling/725012
- Newcastle Racing NSW preview: https://www.racingnsw.com.au/news/latest-racing-news/newcastle-preview-tips-for-the-hunter-race-day-saturday-14th-november/
- Racing Queensland: https://www.racingqueensland.com.au/racing/full-calendar/2026/11
- Ascot Perth Racing digital race book: https://www.fanverse.com.au/race-books/ascot-2026-11-14/
