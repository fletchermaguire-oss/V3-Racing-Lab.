# Official-form ingestion (V5) — Saturday 7 November 2026

The dated Racing Australia **Form.aspx** pre-race snapshot now has a fail-closed importer in `v5/official-form-import.js` and an executable CLI in `scripts/import-official-form.cjs`. The automated regression tests run under `npm test` and use real dated research snapshots for Rosehill (133 acceptors) and Ascot (95).

## Usage

Export the full official Racing Australia **Form** sheet as Markdown text before race time and prepare `options.json`:

```json
{
  "date": "2026-11-07",
  "cutoff_date": "2026-11-05",
  "meeting": "ASCOT",
  "expected_races": 10,
  "expected_acceptors": 95,
  "source_url": "https://www.racingaustralia.horse/FreeFields/Form.aspx?Key=2026Nov07%2CWA%2CAscot",
  "source_checked_at": "2026-11-05",
  "scratchings": [],
  "compare_going": ["Good 4", "Soft 6"]
}
```

Run `npm run card:import-official -- official-form.md options.json`. The CLI writes dated `<meeting>-research.json` and `<meeting>-scenarios.json` under `v5/cards/<date>/`. Overwriting an existing research snapshot requires `allow_replace_research_only: true`, and must not replace signed historical selection archives.

## Guarantees and limits

- The importer reconciles every race and accepted entry, retains officially scratched horses as excluded audit entries (even when the published form omits their career details), and excludes unactivated emergencies.
- Full two-digit **Heavy 10** is recognised as one surface token, not silently discarded; the historical result remains model input coded H. The Listed Maribyrnong Trial is a **real race**, whereas starred T barrier trials are not scored as wins.
- Only completed historical races dated **before the input cutoff date** enter the model. Missing or conflicting source details fail closed where identifiable.
- Each race's experimental V5 model estimates must total 100% for each supplied going scenario; Good and Soft cases are distinct. Under the present model Soft 5/6/7 use the same pooled surface category.
- No prices, market tips, trainer comments, gear changes, trial finishes or future outcomes directly modify mathematical probability coefficients.
- Imported fields are **not** certified final starters. Model probabilities are uncalibrated. Dated official scratchings/rail/going and independent final selections still require a separately approved release. No 31 October research archive, historical win results or final Top 10 is altered.

The static Ascot analysis is accessible at `/v5/ascot-2026-11-07.html`, with a clear research-only label. Form data are stored as derived historical performance indicators rather than the entire external source page.
