# V5 Saturday 7 November release-quality checkpoint

This 29-race source checkpoint is a research-only record, not a final field or selection list. Flemington current official track N/A, Rosehill Soft 6, Ascot Soft 5. Sources and published scratching totals are included in the dated JSON. No post-race winner information is used for Saturday.

The new release-gate module validates every field's official going, source timing, verified active runner list, full-field 100% distribution, strongest rival comparison and pace evidence, and logs the exact source/time/reason for a changed winner pick. It explicitly permits zero high-conviction selections and refuses to call uncalibrated figures certified. This does not reweight the V5 formula or prove a higher hit rate.

Run node --test v5/release-gate.qa.cjs, npm test and npm run check. Do not freeze or submit picks before actual final fields and pre-race proof.
