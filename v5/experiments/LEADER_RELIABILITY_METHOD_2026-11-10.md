# V5-L5 selection reliability diagnostic

**Research only**: exactly the unchanged L5 leader from every race is chosen first, then independent risk filters and leaderboard reorderings are evaluated after the winner is matched. No formula weights, winner picks or archives are modified. Fixed predeclared screens are `p>=20`, `p>=20 && lead gap>=5pp`, evidence with 3 dated starts and 70% completeness, field under 15 runners, and a strict combination. A quality-adjusted leaderboard subtracts fixed points for missing class, thin history, incomplete dossiers and 15+ runner fields, but it does **not** change the underlying model probabilities.

Report **all races**, date-level winners, pick coverage, Top 5/10/15 under unchanged versus quality-aware ranking, and Wilson uncertainty intervals. A selective hit rate is not comparable to the full-card raw hit rate without the selection count. No threshold is automatically promoted: 91 retrospectively reconstructed/provisional races with known outcomes are not enough to promise future accuracy. This experiment tests screening/ordering, not new horse ability or a calibrated probability.

Caveat: the current `chaos` variable is mathematically constructed from entropy and the lead gap, therefore it must **not** be credited as an independent third predictive feature in any future rank-score model.
