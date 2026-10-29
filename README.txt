RACING LAB — MANUAL SCRATCHINGS & FINAL FIELD REVIEW (v1.0)

INSTALL (one file + one line):
1. Unzip this package.
2. Upload racing-lab-manual-scratch.js to the ROOT of the GitHub repository.
3. Open index.html and insert this line immediately BEFORE </body>:
   <script src="/racing-lab-manual-scratch.js" defer></script>
4. Commit. Netlify should deploy if automatic deployment is configured.

HOW TO USE:
- Open Racing Lab > Races and choose a race.
- At the top of the race details, tick horses to mark as scratched.
- Tap Apply scratchings. The page reloads to clear any previous simulator run.
- Confirm the remaining field with Confirm field reviewed.
- For multi selections, go to Multi Lab; a Final Selection Checkpoint appears.
  The reviewed selection sheet can be saved only when every selected race is confirmed.
- To restore a horse, untick it, tap Apply scratchings, and confirm the field again.

WHAT IT DOES:
- Excludes manually scratched horses from the in-memory race records, top-three
  rankings, daily selections and simulator; updates adjusted percentages across
  remaining runners when the ORIGINAL full field totals approximately 100%.
- Leaves source snapshots, published files and Airtable untouched.
- Automatically clears previously saved multi selections for horses you scratch.
- Records a per-race manual confirmation and allows a reviewed selection sheet.

IMPORTANT LIMITATIONS:
- Manual changes are saved in this browser only (localStorage), NOT to GitHub,
  Airtable, Netlify, or other devices. Clearing browser storage removes them.
- This is NOT a live scratching feed and does NOT check whether horses are
  officially scratched. Verify all manual changes against official race data.
- Conditional probability redistribution is NOT a fresh model or pace rerun.
- The existing site's original download/export controls are unchanged;
  the NEW 'Save reviewed selections' checkpoint is gated on manual review.
- The October 17 archive is still an archive until new meeting data is imported.
- A race with incomplete original probabilities is NOT normalized; its simulator
  may remain unavailable. At least two active runners are required.
- The old October 17 historical R4/R6 variants are recalculated separately where
  their own original field totals support it.

ROLLBACK: Remove the new script tag from index.html. Original site logic is unchanged.
