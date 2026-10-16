# V3.1.1 Simulator hotfix

- Fixed HTML canvas recreation so playback always sizes and draws to the active DOM canvas, including after Run, Pause, camera changes, replay and viewport resize.
- Fixed a variable-shadowing error which made all horse positions invalid (NaN) in the Broadcast and Photo Finish views.
- Added automated browser regression for mobile + desktop, all four cameras and playback operations.
- Original racing probabilities, race boards, Multi Lab, QA, weather and Netlify Function behavior are preserved. Not calibrated; no results in historical validation table.

Deployment: the drag-and-drop ZIP delivers the static app only. Use this full source with Netlify Git/CLI deployment plus AIRTABLE_PAT as a private environment variable to activate server-side Airtable sync. DO NOT put secrets in the HTML or git repository.
