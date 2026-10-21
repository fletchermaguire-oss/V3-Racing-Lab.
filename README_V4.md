# Racing Lab V4 — secure read-only publishing foundation

This is an **incremental upgrade of the uploaded full-feature V3 site**, not a replacement UI. The original index.html remains in place. A Netlify Function now serves `/api/v1/snapshot` from Airtable using server-only credentials.

## What is implemented
- Existing V3 screens, simulator and bundled October 17 archive preserved.
- Read-only server-side Airtable fetch with pagination.
- Only forecasts matching the explicitly configured version **and** marked Reviewed and Frozen are considered.
- Incomplete races, duplicated runners, missing runner forecasts, and probability totals outside 100 ±0.05 percentage points are withheld.
- Browser syncs on load and checks again every 15 minutes when active; it retains the archive if the endpoint is unavailable.
- Client-side import validation no longer requires exactly 30 races and 250 runners.
- Safety unit tests in `tests/snapshot.test.js`.

## Setup on Netlify
1. Deploy this folder or ZIP as the website source. Do not expose tokens in index.html.
2. Under Site configuration > Environment variables, set:
   - `AIRTABLE_PAT`: Airtable Personal Access Token with **data.records:read** on the racing base.
   - `AIRTABLE_BASE_ID`: `appEBALFjxF1Uxqfj`
   - `PUBLISHED_FORECAST_VERSION`: exact value from the approved Forecasts `Version` field.
3. Deploy the site with Netlify Functions support (a plain drag-and-drop static ZIP may not build functions; connect a Git repository or use Netlify CLI/build deployment).
4. Test `/api/v1/snapshot` and confirm its `races`/`records` reflect the correct approved version; then use the site's Data & Integrations screen.

## Limitations — not yet implemented
- **No write/publish approval endpoint**: this is a read-only bridge. Changing the published version requires updating the server configuration. The final goal is a protected publication pointer that can be updated without redeploying.
- Only race boards that pass the strict checks appear; partial meetings can be withheld. No auto-scratching provider, PDF parser, calibrated wet-track recalculation or AI Digital Twin.
- Existing site uses hard-coded three-meeting navigation and historical race-specific conditional adjustments; additional meetings require a careful frontend refactor before production.
- Netlify Function must be tested against real Airtable responses before claiming a working live sync. No production deployment was performed.
- Current bundled forecasts are historical and must never be presented as current Saturday forecasts.

## Tests
`node tests/snapshot.test.js`

## Security
Never place AIRTABLE_PAT in a client-side file, ZIP README with its value, or chat. The endpoint is public **read-only** and must contain only data explicitly approved for public display.

## Deployment readiness gate (21 October)
Run `node tests/snapshot.test.js` and `node tests/site-regression.test.js`.
**Do not deploy this package as a live Saturday publisher yet.** It requires a verified Netlify Functions deployment and a publication pointer that can change without rebuilding the site. The existing `PUBLISHED_FORECAST_VERSION` environment variable is fixed until changed through Netlify configuration.

Before deployment, obtain the exact existing Netlify deployment method (Git-connected or manual), then verify server functions and real Airtable records in a staging site. Never place the PAT in frontend code or share it in chat.
V4 staging deployment test — October 2026
