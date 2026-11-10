# Small L5 class-context experiment — registered 10 Nov 2026

**Scope:** No change to formula coefficients, historical archives, human rankings or live site.

**Question:** Does L5 overrate strong ungraded Open/Quality results from an explicitly listed set of regional venues relative to other racing? The region dictionary is a hypothesis, not independently verified opponent strength. The model must not call these horses weak simply for racing regionally.

**Candidate:** invert L5 reserve/temperature to its unreserved shares; multiply a runner's share by `exp(-alpha * exposure / T)`, then re-normalise and restore original reserve. Exposure is the recency-weighted fraction of recent (up to five) form starts consisting of a regional ungraded OPEN/QLTY win or second within 2 lengths, using *only historical dated form strictly before archived snapshot*. Alpha 0 reproduces the model; alpha .18 primary conservative hypothesis; alpha .36 exploratory stress test. Other ingredients untouched; no horse-name, odds or winner overrides.

**Evaluation:** 91 race retrospective reproduction as in draft PR 26; 17 and 24 Oct reconstructed, 31 Oct seven field mismatches excluded, 3 Nov uses Monday saved source. Count wins gained, wins harmed, top1/3/5, Brier/log loss, coverage and leader flips per date. Do not call historical uplift genuine forward validation.

**Decision rule:** if alpha .18 does not improve or behaves inconsistently by date, reject rather than tune it to past results. Even an apparent improvement remains shadow-only until validated on truly pre-jump frozen full fields. No guarantee of improved hit rate.
