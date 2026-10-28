RACING LAB V4.2 — SATURDAY TOP 10 LOCK

Upload BOTH files preserving their paths into the root of your existing GitHub repository:
  .github/workflows/saturday-top10-lock.yml
  scripts/lock-top10.cjs

The GitHub Action attempts to run at 07:30 Saturday Brisbane time. GitHub scheduled workflows can be delayed, so 07:30 is a target, NOT a guaranteed exact lock timestamp. A snapshot records its actual UTC creation time. It refuses to lock unpublished/unreviewed/unfrozen boards or boards without at least 10 valid selections.

IMPORTANT: Existing published-board.json currently has status NOT_PUBLISHED and no selections. To enable locking, your publication pipeline must publish an APPROVED board with this schema:
{
  "publication": {"status":"PUBLISHED","reviewed":true,"frozen":true,"date":"2026-10-31"},
  "selections": [
    {"meeting":"Randwick","race":1,"horse":"EXAMPLE ONLY","model":"V4","predicted_win_pct":42.1}
  ]
}
Include at least ten distinct race selections; replace all example values with verified pre-race data. The script never generates or fabricates forecasts.

Existing historical results are untouched. Each lock is a new dated file in locked-selections/YYYY-MM-DD.json. Re-runs cannot overwrite an existing lock. This package does not yet add locks to the Results UI, ingest official results, or guarantee exact-time execution. Review repository GitHub Actions permissions if commit push is blocked.
