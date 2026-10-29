# Racing Lab scratching calculation module

Run `node scratchings-engine.test.js` to verify.

Use `RacingLabScratchings.verify(feed, raceId, names)` to validate race-specific, timestamped source-backed scratching input, then `RacingLabScratchings.update(field, scratchings)` for a conditional normalization **only**. This is not a new independent win forecast, does not assess pace or barrier changes, and must not be displayed as a fully rerun model.

To complete live automation, integrate an authorized source of verified scratchings, implement a versioned model recalculation and pace engine, reconcile all fields, and publish a validated board. No such feed is bundled or implied here. The existing live website is unchanged.
