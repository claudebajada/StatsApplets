# StatsApplets

Fifteen interactive statistics explorers for students, built with plain HTML, CSS and JavaScript. Change parameters, inspect current calculations, compare graphs and share the exact example. Everything runs on a static host, without accounts, a backend or a production build step.

## Run locally

```sh
npm ci
npm start
```

Use Node.js 22 or newer, then open http://127.0.0.1:4173. Alternatively run `python -m http.server 4173` from the repository root. Node and Python are development conveniences; neither is needed on the production host.

## Explorers

| Category               | Explorer                                                               | Model and focus                                                                     |
| ---------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Distributions          | [Binomial & normal](html/binomial-normal-explorer.html)                | Exact binomial probabilities, continuous approximation and zero-variance limits     |
| Distributions          | [Building the binomial](html/binomial-components-explorer.html)        | Arrangements × probability factors = point probabilities                            |
| Distributions          | [Student's t](html/t-distribution-explorer.html)                       | Reference density, degrees of freedom and heavy tails                               |
| Distributions          | [F distribution](html/f-distribution-explorer.html)                    | Upper-tail critical values, dynamic extent and optional log axis                    |
| Hypothesis testing     | [One-sample z](html/one-sample-z-test.html)                            | Sample mean with known population σ; signed directional inference                   |
| Hypothesis testing     | [One-sample t](html/one-sample-t-test.html)                            | Sample mean and SD, n−1 df and signed Cohen's d                                     |
| Hypothesis testing     | [Independent t](html/independent-samples-t-test.html)                  | Pooled equal-variance test; equal sample SDs, adjustable group sizes                |
| Hypothesis testing     | [Chi-squared GOF](html/chi-squared-explorer.html)                      | Uniform null probabilities, exact integer totals and Cohen's w                      |
| Hypothesis testing     | [One-way ANOVA](html/anova-explorer.html)                              | Between/within sums of squares, F and η²; generated or manual groups                |
| Hypothesis testing     | [Multiple comparisons](html/multiple-comparisons-explorer.html)        | Independent mixed-truth simulations: discoveries, FWER, FDR and corrections         |
| Relationships          | [Correlation](html/correlation.html)                                   | One scatterplot, constructed/manual pairs and optional centring/normalisation steps |
| Relationships          | [Linear regression](html/regression-explorer.html)                     | Generated or manual pairs; least squares, residuals, SSE and R²                     |
| Sampling & uncertainty | [CLT](html/clt-explorer.html)                                          | Repeated means from normal, uniform, exponential or rare binary populations         |
| Sampling & uncertainty | [Confidence interval coverage](html/confidence-interval-explorer.html) | Repeated normal-population t/z intervals and empirical coverage                     |
| Sampling & uncertainty | [Statistical power](html/power-explorer.html)                          | Exact known-σ one-sample z power, directional effects and sample-size curve         |

Every page has a learning objective, equation, current-value explanation, assumptions, at least four presets and reset. Result formatting distinguishes small probabilities from floating-point underflow. The static catalogue groups applets by topic and supports text search.

### Teaching distinctions

- Mean-test sliders describe **sample statistics**, except the z test's known population σ. The independent test retains the original pooled, single-SD model; it is not Welch's test. Standardised differences are signed. Two plots connect the sample estimate in original units (with a ±1 SE bar and a separate two-sided 95% confidence interval) to the null distribution of z/t scores. The bar is explicitly not a confidence interval; individual measurements are not represented by a synthetic population curve.
- Greater-than, less-than and different-from alternatives are available for the mean tests and power. GOF χ² and omnibus ANOVA F are upper-tailed by construction, so they do not offer mathematically inappropriate signed alternatives.
- Binomial bars are point probabilities; the normal curve is a density. Continuity-corrected **areas**, rather than curve heights, approximate binomial probabilities. At n=0, p=0 or p=1, the exact distribution remains valid and the continuous normal curve is omitted.
- GOF counts are deterministic examples. Dimensionless category proportions are normalised, then allocated to integers by largest remainders. Changing N holds the underlying proportions fixed. Observed counts always sum to N; equal integer counts are impossible when N is not divisible by k. The effect is Cohen's w, not Cramér's V.
- CLT populations all have theoretical μ=0 and σ=1; only the sampling distribution of means approaches normality. Confidence intervals sample a normal population and estimate s separately in each t interval. Coverage calculations use every repetition; the interval chart shows the first 80.
- Power is for a **known-σ z test**, not t-test power or retrospective observed power. Regression is descriptive least squares with an intercept. ANOVA assumes independent normal errors with equal population variances for its exact F reference.
- Multiple comparisons simulates independent Uniform(0,1) null p-values and optional real effects using two-sided known-SD z-test p-values. It counts correct and false discoveries separately and estimates FDR by averaging each family's false-discovery proportion, including zero-discovery families. BH's FDR target differs from FWER in general; they coincide in the all-null case. This simulator supports mixed truth under independence; it does not establish performance under arbitrary dependence.

## Shareable student examples

Each applet maintains its parameter state in its own direct URL. **Copy example link** copies that URL; a selectable text fallback is available when the Clipboard API is unavailable. Numeric parameters are range-checked and snapped to valid steps; unknown options and invalid values revert to defaults. Text data are length-bounded and validated before calculation.

The interface is designed for students. Presets, reset and sharing are available directly; there is no lecturer mode, editable lesson metadata or student/lecturer view switch. Legacy lecturer URL fields are ignored and removed from the canonical example link. Avoid personal information in shared data.

Correlation starts with a single scatterplot and Pearson’s r. Its sliders construct a sample with a specified r; **New pattern** changes the seed while preserving that sample correlation. This is a constructed example, not sampling from a population with a specified correlation. Manual paired data (3–100 observations) are optional. Older paired-data URLs automatically select manual data. The optional **How is r calculated?** walkthrough has four steps: treat columns as vectors, centre them, normalise their lengths, and interpret their angle. It follows the current data, or loads a three-observation example with r = 0.5 and θ = 60°. Buttons add 10 to all y values or double them, updating the actual observations and shareable URL. The SVG preserves the full vectors’ lengths and angle in their shared plane; it does not select two components or use the scatterplot slope. Each view rescales to fit, with numerical lengths shown. The final view marks the signed projection onto the first unit vector. Constant variables receive an undefined-angle explanation.

Conceptual inspiration and further reading: [Brendan O’Connor (2012), Cosine similarity, Pearson correlation, and OLS coefficients](https://brenocon.com/oldblog/brenocon.com/blog/2012/03/cosine-similarity-pearson-correlation-and-ols-coefficients/index.html). The student explanations, example and graphics were authored for StatsApplets. Positive changes of scale preserve r; negative changes of scale reverse its sign.

All simulations use an explicit integer seed and a deterministic Mulberry32 generator. Each applet labels its resampling action for the experiment; it increments the seed. Reopening a link reproduces the same numerical experiment, including population settings and repetition count. Reset restores the starting worked comparison. These authored settings also supply defaults for incomplete shared URLs.

## Accessibility and visual design

The shared interface includes responsive charts, associated labels, keyboard-operable native controls, visible focus, skip links, semantic headings and live result/status text. Curves use different dash patterns or point styles in addition to colour. Every plot has a short explanation of what its marks, axes and reference curves represent. Detailed numerical range summaries remain available to screen readers without crowding the visual display.

Every chart has a text summary, an inspectable table of the first 100 plotted values and a CSV download of all plotted values. CSV contains numerical plot data, not unplotted simulation records. Confidence-interval CSV therefore describes the first 80 displayed intervals; aggregate coverage uses the full simulated set.

Automated axe checks cover WCAG 2 A/AA and 2.1 AA rules across every explorer, and the catalogue. They supplement keyboard, overflow and canvas-visibility tests and visual review. They do not certify full accessibility or substitute for testing with assistive-technology users. Mobile coverage is viewport/device emulation, not physical-device testing.

## Tests

```sh
npm run check                 # syntax, resources, IDs/labels, generated-page consistency
npm test                      # numerical and invariant tests; independent fixtures
npx playwright install --with-deps chromium firefox webkit
npm run test:browser           # Chromium desktop/mobile, Firefox and WebKit
npm run test:chromium          # only the two Chromium projects
npm run test:all               # checks + units + complete browser suite
```

An existing Chromium executable can be supplied using `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/absolute/path/to/chromium`; this affects only the Chromium projects. Standard CI installs all browser engines normally. Firefox and WebKit are real browser engines in automation, not emulated by Chromium; mobile viewport testing remains emulation.

The browser suite covers every explorer's initialisation, slider bounds and keyboard input, finite chart datasets/axes, every preset, reset and URL round-trip, MathML fraction layout, absence of lecturer controls, malformed data, manual regression/ANOVA references, seeded resampling, CSV export, estimate/error-bar positions, geometric angle/length/projection checks, every walkthrough step and automated accessibility checks. The catalogue test visits all fifteen direct pages.

Numerical references were generated independently with **SciPy 1.17.0** and, for multiplicity corrections, **statsmodels 0.14.6**. Tests include both statistic signs, zero and extreme tails, low/large df, unequal group sizes, binomial boundaries, F quantiles, interval endpoints, regression, ANOVA and adjusted p-values. Tiny probability tests use relative error so an incorrect zero cannot pass a loose absolute tolerance. Near-zero interval endpoints allow 5e-8 absolute error from the upstream incomplete-beta calculation.

Additional invariant/moment checks cover all **90,900** chi-squared slider combinations for integer conservation of N, binomial probability sums, simulation determinism, empirical moments/coverage and family-wise error. Seeded Monte Carlo checks use tolerances rather than expecting every experiment to equal the theoretical rate exactly.

To regenerate numerical fixtures (Python is optional and needed only for this step):

```sh
python -m pip install scipy==1.17.0 statsmodels==0.14.6
python scripts/generate-references.py
python scripts/generate-teaching-references.py
npm test
```

GitHub Actions runs checks, unit tests and the complete browser suite on pull requests. It never merges or deploys.

## Code and contribution guide

- `javascript/statistics.js`: DOM-free inference and distribution calculations; usable in a browser or Node.
- `javascript/teaching-statistics.js`: seeded sampling, interval/power calculations, regression, ANOVA, multiplicity and histogram helpers. No Chart.js or DOM dependency.
- `javascript/common.js`: chart creation/styles, data alternatives, result formatting and control binding.
- `javascript/correlation-walkthrough.js`: staged explanation and SVG rendering; `TeachingMath.correlationGeometry` supplies independently tested geometry.
- `javascript/mean-test-explorer.js`: shared rendering for the three mean-test pages.
- `javascript/extensions.js`: rendering for the six new explorers; mathematical work stays in the pure modules.
- `javascript/catalogue.js`: catalogue metadata, learning content, presets and explanatory content.
- `javascript/state.js` / `shell.js`: validated URL state, reset/presets and shared current-value explanations.
- `scripts/generate-pages.js`: optional development-time authoring helper. Generated HTML is committed; production does not run it.

Use a separate branch and PR. Keep numerical work in the pure modules, extend independent fixtures for mathematical changes, and verify both signs and boundary cases. For metadata, control, equation or method changes, edit `catalogue.js`, `generate-pages.js` or `scripts/mathml.js`, then run `npm run pages` and commit the generated HTML. `npm run check` verifies that it matches its source. Format source with the pinned formatter, run tests, and explain any changes to assumptions or interpretation explicitly. Never deploy or merge through a test workflow.

No framework, bundler, authentication or backend is required. [ROADMAP.md](ROADMAP.md) maps the original priorities to the completed work and records verification limits.

## Runtime dependencies

| Library  | Version | Distribution                                     |
| -------- | ------- | ------------------------------------------------ |
| Chart.js | 4.5.1   | Local UMD bundle, MIT license in `lib/`          |
| jStat    | 1.9.6   | Local browser/Node bundle, MIT license in `lib/` |

MathJax 3.2.0 was reviewed and removed. Equations now use native MathML with stacked fractions, roots, subscripts and accessible names. `scripts/mathml.js` authors the committed markup; no typesetting loader, downloaded fonts or production build is required. [MathML Core](https://www.w3.org/TR/mathml-core/) defines the notation used here. Chart.js was migrated from 3.7.0 to the v4 UMD build; jStat from 1.9.5 to 1.9.6. Regressions are checked against the independent numerical fixtures and browser suite.

The matching npm packages are pinned in `package-lock.json`. `npm run vendor` refreshes the local bundles and licenses; unit tests require exact byte matches, allowing `npm audit` to cover the exact bundled versions as well as the development tooling. The advisory database reported no known vulnerabilities during this review; this is a point-in-time result, not a security guarantee. Playwright, axe and the formatter are development-only dependencies.

Upstream references: [Chart.js v4 migration](https://www.chartjs.org/docs/latest/migration/v4-migration.html), [jStat distributions](https://jstat.github.io/distributions.html), [statsmodels multiple-test adjustment](https://www.statsmodels.org/stable/generated/statsmodels.stats.multitest.multipletests.html).

## Static deployment

Copy `index.html`, `html/`, `javascript/`, `css/` and `lib/` to a static host, preserving paths. No Node/Python server, npm install or build command is required in production. Links are relative, so repository-subdirectory hosting works. The existing `Videos/` assets remain available and are optional.

Do not deploy or merge without approval. BSD-3-Clause; see [LICENSE](LICENSE). Third-party notices are in `lib/`.

## Worked comparisons

The starting route connects sampling and standard error to confidence intervals, t tests and power. Each applet opens with one worked comparison for all learners: a concrete question, a named change and the plots to inspect. One reversible action changes the settings; a live explanation beside the plots interprets the actual result. Examples are selected for the statistical idea they expose. There is no cohort selector or separate prediction form. Shared URLs preserve canonical parameter values; exact-number partners edit the same sliders rather than adding duplicate parameters.

- Mean tests default to two-sided alternatives, show the estimate, 95% interval and effect size, and offer fixed axes with an explicit fit action. A staged calculation connects the difference, SE, standardisation and null-tail interpretation.
- The CLT comparison keeps 1,000 repeated studies fixed and increases observations per study from 1 to 25. The separate sample trace follows the actual observations feeding the histogram; students can start with one study, add one or ten studies, or reveal the full run. The mean axis stays fixed as n changes.
- Confidence interval inspection follows the original sample, estimated SD, critical value and endpoints. The plot states how many intervals it shows and how many the coverage calculation uses.
- Selected binomial counts link highlighted factors, enumerated arrangements for small n, exact probability and continuity-corrected normal area. The approximation explorer supports n up to 1000, with stable log probabilities.
- The t sampling experiment compares known-SD Z and estimated-SD t for each identical sample. Centred deviations and signed products introduce the existing geometric correlation walkthrough; nonlinear and outlier examples expose limitations.
- Regression supports candidate lines, squared-error areas and a revealable least-squares solution. Curvature, unequal-spread and influential-observation examples support residual interpretation.
- ANOVA inspection follows an observation to its group mean and the grand mean, showing both deviation components and the sample-size weighting of between-group SS.
- Mixed-truth multiple-testing experiments expose FWER, FDR, correct discoveries and detection rate. The first family includes known truth, raw and adjusted p-values and decisions.
- The logarithmic F view removes tail area fill because screen area is no longer proportional to probability. At a true null, the power explorer calls 1−α a non-rejection probability and marks Type II error inapplicable.

Core scientific parameter state is shareable. Temporary inspection selections and walkthrough tabs are interface state. Simulation seeds remain explicit and reproducible, inside an optional disclosure.

The derivation follows the plots in an open section. The equation, stage controls, sample inspectors and worked numbers are visible along that path. Assumptions and the full reference calculation share one disclosure. Related topics appear together at the end. The sample-mean comparison holds a 3 mmHg reduction fixed while n grows from 25 to 100; the ANOVA comparison holds group means fixed while within-group deviations triple. These are controlled teaching examples, not clinical evidence.
