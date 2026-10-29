# Racing Lab — weekly PDF evidence pipeline

This is **an honest, conservative foundation**, not a completed automatic form-analysis model. It does not calculate or modify win probabilities, pick the top three, scrape Racing & Sports, or alter the simulator. It extracts documented race results from runner-specific PDF sections, flags possible positives/risks and writes them to the existing Airtable Runners table. Missing evidence remains missing.

## Exact locations in your existing GitHub repo

- `.github/workflows/weekly-research.yml` — scheduled GitHub Actions job
- `scripts/weekly_research.py` — PDF extractor, conservative evidence rules, Airtable sync, optional scratchings
- `scripts/requirements.txt` — Python dependency
- `incoming/runners.csv` — manifest; upload PDF files into `incoming/`

## Set up

1. Add these files to your **existing** GitHub repo, preserving directory names. Do **not** replace `index.html`, `netlify.toml`, or the simulator.
2. In **GitHub → Settings → Secrets and variables → Actions**, add repository secret `AIRTABLE_PAT`. This is **separate** from the existing Netlify environment variable; paste the token directly into GitHub's secret UI, never into code or chat. The PAT needs `data.records:read`, `data.records:write` for the existing Airtable base.
3. Upload each Racing & Sports PDF you have the right to use into `incoming/` and fill one `incoming/runners.csv` row **per horse**. Use exact Airtable race IDs, e.g. `2026-10-31_RANDWICK_R01` (illustrative only). `page` is 1-based. `start_marker` and `end_marker` must be **unique, literal strings appearing in the extracted text on that page**; the runner's form must lie between them. This avoids accidentally assigning one horse's form to another.
4. GitHub Actions → **Racing Lab weekly PDF research** → **Run workflow**. It also runs after `incoming/` changes and at the scheduled Brisbane times. Open the run log and download `racing-lab-research` artifact for error details.
5. Check the Runners table in Airtable. Existing runner records must already exist with matching `Race ID` and `Horse`. The script will not create unknown runners or silently overwrite ambiguous matches.

## Optional live scratching feed

Add GitHub Actions secret `SCRATCHINGS_JSON_URL` only after you have a legitimate provider URL with an accessible JSON endpoint returning this exact schema:

```json
{
  "asOf": "2026-10-31T06:00:00+10:00",
  "scratchings": [
    {"raceId":"2026-10-31_RANDWICK_R01","horse":"Example Horse","status":"Scratched"}
  ]
}
```

The example is **not a real feed**. Without this secret, the pipeline still processes PDFs, but does **not** verify scratchings. It never marks horses active based on an absent scratching notice. The feed is not scraped or fabricated.

## Important limits

- Some Racing & Sports PDFs use tables, layouts, or scanned pages that cannot be reliably extracted. Check the generated JSON; failures block the workflow rather than inventing evidence.
- Generic lines are **not** transformed into unverified claims about distance, track, or class suitability. Verified positives/negatives require supported race results. A winning scenario and pace forecast require richer data and a real modelling step.
- `generated/weekly-research.json` is a GitHub Actions artifact, **not automatically deployed to Netlify**. The existing `/api/runner-research` function can read the saved Airtable fields when its `raceId` matches the date-specific ID.
- The existing Race Centre top-three UI and ranking model are **not yet connected** to this new pipeline. That is a separate integration, and the currently installed older evidence cards may still appear.
- Avoid importing post-race results into a pre-race forecast. Use only pre-race PDF snapshots, and preserve original source timestamps.
