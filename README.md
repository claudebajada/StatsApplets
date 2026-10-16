# StatsApplets

Fifteen interactive statistics explorers, built with plain HTML, CSS and JavaScript. Change parameters, inspect current calculations, compare graphs and share the exact example. Everything runs on a static host, without accounts, a backend or a production build step.

## Run locally

```sh
npm ci
npm start
```

Use Node.js 22 or newer, then open http://127.0.0.1:4173. Alternatively run `python -m http.server 4173` from the repository root. Node and Python are development conveniences; neither is needed on the production host.

## Explorers

| Category               | Explorer                                                               | Model and focus                                                                      |
| ---------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Distributions          | [Binomial & normal](html/binomial-normal-explorer.html)                | Exact binomial probabilities, continuous approximation and zero-variance limits      |
| Distributions          | [Building the binomial](html/binomial-components-explorer.html)        | Arrangements × probability factors = point probabilities                             |
| Distributions          | [Student's t](html/t-distribution-explorer.html)                       | Reference density, degrees of freedom and heavy tails                                |
| Distributions          | [F distribution](html/f-distribution-explorer.html)                    | Upper-tail critical values, dynamic extent and optional log axis                     |
| Hypothesis testing     | [One-sample z](html/one-sample-z-test.html)                            | Sample mean with known population σ; signed directional inference                    |
| Hypothesis testing     | [One-sample t](html/one-sample-t-test.html)                            | Sample mean and SD, n−1 df and signed Cohen's d                                      |
| Hypothesis testing     | [Independent t](html/independent-samples-t-test.html)                  | Pooled equal-variance test; equal sample SDs, adjustable group sizes                 |
| Hypothesis testing     | [Chi-squared GOF](html/chi-squared-explorer.html)                      | Uniform null probabilities, exact integer totals and Cohen's w                       |
| Hypothesis testing     | [One-way ANOVA](html/anova-explorer.html)                              | Between/within sums of squares, F and η²; generated or manual groups                 |
| Hypothesis testing     | [Multiple comparisons](html/multiple-comparisons-explorer.html)        | Independent all-null simulations: no adjustment, Bonferroni, Holm and BH             |
| Relationships          | [Correlation](html/correlation.html)                                   | Up to 100 paired observations; full centring/normalisation plus retained 2D geometry |
| Relationships          | [Linear regression](html/regression-explorer.html)                     | Generated or manual pairs; least squares, residuals, SSE and R²                      |
| Sampling & uncertainty | [CLT](html/clt-explorer.html)                                          | Repeated means from normal, uniform, exponential or rare binary populations          |
| Sampling & uncertainty | [Confidence interval coverage](html/confidence-interval-explorer.html) | Repeated normal-population t/z intervals and empirical coverage                      |
| Sampling & uncertainty | [Statistical power](html/power-explorer.html)                          | Exact known-σ one-sample z power, directional effects and sample-size curve          |

Every page has a learning objective, equation, current-value explanation, assumptions, four presets and reset. Result formatting distinguishes small probabilities from floating-point underflow. The static catalogue groups applets by topic and supports text search.

### Teaching distinctions

- Mean-test sliders describe **sample statistics**, except the z test's known population σ. The independent test retains the original pooled, single-SD model; it is not Welch's test. Standardised differences are signed. The illustrative model and estimated uncertainty curves are labelled separately from the null sampling distribution.
- Greater-than, less-than and different-from alternatives are available for the mean tests and power. GOF χ² and omnibus ANOVA F are upper-tailed by construction, so they do not offer mathematically inappropriate signed alternatives.
- Binomial bars are point probabilities; the normal curve is a density. Continuity-corrected **areas**, rather than curve heights, approximate binomial probabilities. At n=0, p=0 or p=1, the exact distribution remains valid and the continuous normal curve is omitted.
- GOF counts are deterministic examples. Clipped weights are normalised, then allocated to integers by largest remainders. Observed counts always sum to N; equal integer counts are impossible when N is not divisible by k. The effect is Cohen's w, not Cramér's V.
- CLT populations all have theoretical μ=0 and σ=1; only the sampling distribution of means approaches normality. Confidence intervals sample a normal population and estimate s separately in each t interval. Coverage calculations use every repetition; the interval chart shows the first 80.
- Power is for a **known-σ z test**, not t-test power or retrospective observed power. Regression is descriptive least squares with an intercept. ANOVA assumes independent normal errors with equal population variances for its exact F reference.
- Multiple comparisons simulates independent Uniform(0,1) null p-values. Every discovery is false in this experiment. BH's FDR target differs from FWER in general; they coincide in the all-null case. This simulator does not establish performance under arbitrary dependence or mixed true/false nulls.

## Shareable examples and lecturer mode

Each applet maintains its parameter state in its own direct URL. **Copy example link** copies that URL; a selectable text fallback is available when the Clipboard API is unavailable. Numeric parameters are range-checked and snapped to valid steps; unknown options and invalid values revert to defaults. Text data are length-bounded and validated before calculation.

**Lecturer mode** adds an editable scenario title, student question and discussion notes. **Student view** hides notes and edit fields until revealed. The question, notes and parameters all travel in the URL, so examples can be embedded in slides or learning platforms without storing anything on a server. Student view is a presentation aid, not secure assessment: its answers are present in the link. Avoid personal information in shared notes or data.

All simulations use an explicit integer seed and a deterministic Mulberry32 generator. **New random sample** increments the seed. Reopening a link reproduces the same numerical experiment, including population settings and repetition count. Reset restores the applet's original parameter defaults; it retains any lecturer notes you have written.

## Accessibility and visual design

The shared interface includes responsive charts, associated labels, keyboard-operable native controls, visible focus, skip links, semantic headings and live result/status text. Curves use different dash patterns or point styles in addition to colour. The 2D geometry uses equal pixel lengths per coordinate unit.

Every chart has a text summary, an inspectable table of the first 100 plotted values and a CSV download of all plotted values. CSV contains numerical plot data, not unplotted simulation records. Confidence-interval CSV therefore describes the first 80 displayed intervals; aggregate coverage uses the full simulated set.

Automated axe checks cover WCAG 2 A/AA and 2.1 AA rules across every explorer, with lecturer mode open, and the catalogue. They supplement keyboard, overflow and canvas-visibility tests and visual review. They do not certify full accessibility or substitute for testing with assistive-technology users. Mobile coverage is viewport/device emulation, not physical-device testing.

## Tests

```sh
npm run check                 # syntax, resources, IDs/labels, generated-page consistency
npm test                      # 23 Node test groups; independent numerical fixtures
npx playwright install --with-deps chromium firefox webkit
npm run test:browser           # Chromium desktop/mobile, Firefox and WebKit
npm run test:chromium          # only the two Chromium projects
npm run test:all               # checks + units + complete browser suite
```

An existing Chromium executable can be supplied using `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/absolute/path/to/chromium`; this affects only the Chromium projects. Standard CI installs all browser engines normally. Firefox and WebKit are real browser engines in automation, not emulated by Chromium; mobile viewport testing remains emulation.

The browser suite covers every explorer's initialisation, slider bounds and keyboard input, finite chart datasets/axes, every preset, reset and URL round-trip, scenario/student views, malformed data, manual regression/ANOVA references, seeded resampling, CSV export, geometric scaling and automated accessibility checks. The catalogue test visits all fifteen direct pages.

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
- `javascript/mean-test-explorer.js`: shared rendering for the three mean-test pages.
- `javascript/extensions.js`: rendering for the six new explorers; mathematical work stays in the pure modules.
- `javascript/catalogue.js`: catalogue metadata, learning content, presets and default guided questions.
- `javascript/state.js` / `shell.js`: validated URL state, reset/presets, lecturer scenarios and shared current-value explanations.
- `scripts/generate-pages.js`: optional development-time authoring helper. Generated HTML is committed; production does not run it.

Use a separate branch and PR. Keep numerical work in the pure modules, extend independent fixtures for mathematical changes, and verify both signs and boundary cases. For metadata, control, equation or method changes, edit `catalogue.js` or `generate-pages.js`, then run `npm run pages` and commit the generated HTML. `npm run check` verifies that it matches its source. Format source with the pinned formatter, run tests, and explain any changes to assumptions or interpretation explicitly. Never deploy or merge through a test workflow.

No framework, bundler, authentication or backend is required. [ROADMAP.md](ROADMAP.md) maps the original priorities to the completed work and records verification limits.

## Runtime dependencies

| Library  | Version | Distribution                                     |
| -------- | ------- | ------------------------------------------------ |
| Chart.js | 4.5.1   | Local UMD bundle, MIT license in `lib/`          |
| jStat    | 1.9.6   | Local browser/Node bundle, MIT license in `lib/` |

MathJax 3.2.0 was reviewed and removed: its former short label formulas are now native text/Unicode notation. No MathJax loader or fonts are required. Chart.js was migrated from 3.7.0 to the v4 UMD build; jStat from 1.9.5 to 1.9.6. Regressions are checked against the independent numerical fixtures and browser suite.

The matching npm packages are pinned in `package-lock.json`. `npm run vendor` refreshes the local bundles and licenses; unit tests require exact byte matches, allowing `npm audit` to cover the exact bundled versions as well as the development tooling. The advisory database reported no known vulnerabilities during this review; this is a point-in-time result, not a security guarantee. Playwright, axe and the formatter are development-only dependencies.

Upstream references: [Chart.js v4 migration](https://www.chartjs.org/docs/latest/migration/v4-migration.html), [jStat distributions](https://jstat.github.io/distributions.html), [statsmodels multiple-test adjustment](https://www.statsmodels.org/stable/generated/statsmodels.stats.multitest.multipletests.html).

## Static deployment

Copy `index.html`, `html/`, `javascript/`, `css/` and `lib/` to a static host, preserving paths. No Node/Python server, npm install or build command is required in production. Links are relative, so repository-subdirectory hosting works. The existing `Videos/` assets remain available and are optional.

Do not deploy or merge without approval. BSD-3-Clause; see [LICENSE](LICENSE). Third-party notices are in `lib/`.
