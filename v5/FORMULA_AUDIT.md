# V5 formula audit — 30 October 2026

Model version: **V5-L4-20261030**. Source baseline: GitHub commit
dde69847b724f7952f612759d04f25fea6294e4b.

The formula now corrects two performance-sign errors, removes the separate
elite-selection promotion, handles dates and inventories dynamically, and
checks whole-field arithmetic and source inputs. It remains an experimental,
uncalibrated research model. No historical improvement in win rate has been
established. Displaying these provisional model estimates does not approve forecasts or establish calibration.

## Scoring

For each runner and each race, the field prior is 1 / included field size.
A historical record has wins W, other placings P and starts N. Records with
negative counts, W + P > N, or conflicting counts are flagged and excluded
from that feature. No sample is neutral; it is not a zero-ability estimate.

Smoothed record rate:

    q = (W + 0.33 P + 4 / field_size) / (N + 4)

The score is the sum of the following contributions. These coefficients are
explicit hypotheses retained from L3, not fitted effect estimates.

| Contribution | Calculation |
| --- | --- |
| Career | 0.24 × log(q_career / field_prior) |
| Recent performance | 0.76 × weighted recent performance |
| Distance | 0.19 × log(q_distance / field_prior) |
| Surface | 0.22 × log(q_surface / field_prior) |
| Course | 0.12 × log(q_course / field_prior) |
| Class performance | 0.55 × recent class-quality proxy; 0.28 in conservative variants |
| Weight | 0.025 × median-relative kg, capped at ±6 kg |
| Barrier | Existing wide-draw penalty; neutral for missing draws and Flemington straight sprint assumptions |
| Layoff | Existing capped penalty above 120 days since an accepted start |
| Pace / draw stress | Small, explicitly hypothetical perturbations; absent from baseline |

Rate logarithms retain the existing 0.02 floor. This floor, the coefficients,
the ordinal race-class mapping, and the uniform reserve all require
out-of-sample testing before they can be treated as statistically justified.

Recent performance uses the same finish fraction, class proxy, trip
relevance and recency decay as L3. It now **adds** a capped winning-margin
contribution for a winner and **subtracts** beaten margin for other runners.
The class-quality proxy treats a winner's beaten margin as zero.
For negative class proxies, a better performance now improves rather than
reduces the class contribution. Race labels without a recognised grade
receive no invented class grade.

Given scores S, whole-field probabilities are:

    z_i = exp((S_i - max(S)) / 0.78)
    p_i = 100 × (0.85 × z_i / sum(z) + 0.15 / field_size)

These are conditional model estimates. The 15% uniform reserve is an
unfitted modelling choice; it is not an established uncertainty correction.
The displayed percentages are rounded using largest remainders to exactly
100.00% per modelled race. Equal remainders use stable runner IDs, so
reordering source rows cannot change the outcome. Fair odds use the
unrounded probability.

## Integrity and explanations

- All source entries receive an inclusion/exclusion audit.
- Scratched/withdrawn runners and unactivated emergencies are excluded.
  An explicitly activated emergency can enter a provisional field.
- Unverified listed runners can receive a conditional research estimate;
  their inclusion is never called an officially certified starter field.
- A race with fewer than two included runners is NO_CONTEST, with no
  artificial probability distribution. The card is INCOMPLETE_INPUT.
- Unique race IDs, runner IDs and horse identities within a race are
  required. Orphan runners, impossible card dates and unsupported going
  scenarios are rejected.
- Date-only historical starts must precede both race day and the saved
  snapshot day. An earlier explicit cutoff can restrict them further.
  Impossible dates and finishing positions are flagged. Identical dated
  starts are deduplicated; conflicting same-day starts are removed.
- Historical aggregate records remain dependent on their source's
  prospective provenance. Filtering dated starts alone cannot prove
  that an aggregate source contained no later information.
- Empty/null weights are missing, never zero-kilogram advantages.
  Missing weights and barriers contribute no inferred advantage.
- Good, Soft and Heavy scenarios use their corresponding record.
  Per-race or per-meeting going maps are supported; typos do not become
  Good automatically.
- Every modelled runner retains feature contributions, positive and
  negative drivers, input issues, completeness and accepted-form counts.
  Completeness is a data-coverage rubric, not a calibrated confidence score.

The eight variants comprise baseline and Soft 5, each under the base and
conservative class coefficient, plus baseline fast/slow pace and
inside/outside draw stresses. Pace uses only dated, matched historical
settling positions. Draw stresses stay neutral for the straight-sprint
assumption. Sensitivity ranges are **not confidence intervals**, and the
eight variant frequencies are not event probabilities.

## Rankings, prices, simulation and multis

Top 5, Top 10 and Top 15 use one common order of race leaders, sorted first
by unrounded baseline probability, then completeness, robustness floor,
separation and stable ID for exact ties. The robustness board and
evidence-qualified subset remain separate diagnostics. An elite-form flag
cannot move a horse above a higher-probability horse.

Bookmaker quotes, market benchmarks, original assistant picks and horse
names do not enter scores, rankings, quality flags or publication status.
External price disagreement is returned as a separate diagnostic only.

The simulator samples the same whole-field distribution, accepts a seed,
and conserves its run count. It illustrates the model assumptions; it is
not extra independent evidence. The multi calculator accepts two or three
unique selections from distinct races in the same versioned board. It
multiplies the same scenario probabilities and states the independence
assumption explicitly. The site now uses one shared board through `site-state.js`. The original
homepage shell and the V5 studio both load this runtime. Rankings, source
dossiers, local exclusions, simulator draws and distinct-race multis read
the same version and probabilities. Per-meeting going changes recalculate
the shared board; no workshop form-score heuristic remains.

## Historical diagnostics

evaluateFrozen accepts one approved, frozen pre-race snapshot per race,
with explicit timestamps, version, field revision and a supplied freeze
proof URL. A verified result must have an official source URL, the same
field revision and the identical active runner IDs. Duplicate versions,
duplicate results, post-race snapshots, missing provenance and field
mismatches are excluded rather than silently selected.

It returns multiclass Brier score, clipped log-loss, Top 1 hit rate,
reliability bins with Wilson intervals, ECE and per-version diagnostics.
These calculations trust the supplied upstream verification; URL syntax
alone cannot establish that a source is official or immutable.
No calibration coefficients are fitted. Existing results/history were not
reconstructed or changed to make an accuracy claim.

## Verification

Command:

    npm test
    npm run check

There are 21 formula regression tests. They cover the two margin/class
bugs, all eight whole-field scenarios, price/name/pick blindness,
deterministic rounding, future evidence exclusion, statistics validation,
emergencies and scratchings, missing measurements, dynamic dates,
simulation conservation, distinct-race multis, pre-race historical
diagnostics, and browser/Node parity.

Snapshot tested: 29 races, 408 source dossiers, 396 conditional estimates,
12 saved exclusions. The exclusions are the saved 29 October records,
not a fresh 30/31 October official scratching check. This audit verifies
formula behaviour, not completion of trainer interviews, replay review,
individual sectionals, late gear or race-day starter verification.

The existing build preflight, scratchings tests and manual-scratching
tests also pass. The original navigation and visual theme are retained. The shared views
replace the disconnected workshop logic, stale pick queue and legacy DOM
rewriters. Source research, historical selections, `results.html`, and
`results-history.json` remain unchanged. Seven additional integration tests
exercise shared rows, cross-screen scenario/exclusion updates, atomic live
evidence, saved multi pruning, persisted scenarios across entrypoints and script order. Browser checks
cover Top 15, two/three-leg calculations, deterministic 10,000-draw totals,
playback, source exclusions and the existing results page. These checks do
not certify fresh official scratchings or improve model calibration.
