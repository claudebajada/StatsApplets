# StatsApplets

Interactive statistics teaching tools using plain HTML, CSS, JavaScript and locally bundled libraries. All nine applets work on a static host. No backend, authentication, build step or university infrastructure is required.

## Run locally

With Node.js 22 or newer:

```sh
npm ci
npm start
```

Open http://127.0.0.1:4173. Node is needed only for development and testing. Alternatively run `python -m http.server 4173` from the repository root. Each page in `html/` also has its own direct URL.

## Applets

| Page | Teaching focus |
| --- | --- |
| `binomial-normal-explorer.html` | Exact binomial probabilities, normal density approximation and degenerate limits |
| `binomial-components-explorer.html` | Binomial coefficients, probability factors and their product |
| `chi-squared-explorer.html` | Uniform-null goodness of fit, observed/expected counts, χ² and Cohen's w |
| `f-distribution-explorer.html` | Degrees of freedom, upper 5% rejection region, critical F and long tails |
| `correlation.html` | Two-dimensional dot products, normalisation, centring and undefined similarities |
| `one-sample-z-test.html` | Sample mean with known population σ; directional and two-sided inference |
| `one-sample-t-test.html` | Sample mean and sample SD; Student's t with n−1 degrees of freedom |
| `independent-samples-t-test.html` | Pooled equal-variance t test with equal sample SDs and independently adjustable n₁/n₂ |
| `t-distribution-explorer.html` | Student's t density versus the standard normal density |

The mean-test sliders specify **sample statistics**, except the z-test's known population standard deviation. The independent t-test retains the original single-SD teaching model; it is not Welch's test. Standardised differences are signed. See each applet's explanation for assumptions, equations and the distinction between illustrative population models, estimated uncertainty and null sampling distributions.

The binomial normal curve is a **density**, whereas binomial bars are **point probabilities**. Approximate point probabilities using continuity-corrected areas. At n=0, p=0 or p=1 the binomial remains valid, but no continuous normal approximation is plotted. Chi-squared observed counts are deterministic examples allocated to integers with the largest remainder method; they always sum exactly to N. The goodness-of-fit effect size is Cohen's w, not Cramér's V.

## Tests

```sh
npm run check                     # JS syntax, local resources, IDs and HTML label targets
npm test                          # Node's built-in unit test runner; no browser needed
npx playwright install chromium   # one-time browser installation
npm run test:browser               # real Chromium, desktop and mobile viewports
npm run test:all                   # all of the above checks (browser must be installed)
```

On a minimal Linux system, use `npx playwright install --with-deps chromium` to install system dependencies too. An already-installed Chromium binary can be supplied with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/absolute/path/to/chromium`. This override is optional; CI uses Playwright's standard browser installation.

Numerical fixtures in `tests/references/scipy.json` were generated independently using **SciPy 1.17.0**. They include positive/negative/zero and extreme statistics, df=1 and large df, unequal group sizes, binomial boundaries, chi-squared goodness of fit and F quantiles. Tests check relative error in tiny probabilities rather than allowing an incorrect zero to pass a broad absolute tolerance. The suite also checks all 90,900 combinations of chi-squared sliders for integer counts and conservation of N, plus binomial probability sums throughout the UI range.

To regenerate the reference file from the repository root (Python is only needed for this step):

```sh
python -m pip install scipy==1.17.0
python scripts/generate-references.py
npm test
```

The browser suite loads every applet and exercises every slider at both bounds, checks that chart updates actually occur, verifies finite datasets and scales, and rejects browser exceptions, console errors and missing assets. Focused tests check directional probabilities and tail shading, zero-variance binomials, χ² counts, F critical values, undefined correlations and landing-page navigation. Mobile tests use Chromium's Pixel 7 viewport emulation, not a physical device or a separate browser engine.

GitHub Actions runs syntax/static checks, unit tests and browser tests for pull requests. It does not deploy or merge anything.

## Code layout

- `javascript/statistics.js`: DOM-free calculations, usable as browser global `StatsMath` or via Node `require`. Tail calculations use direct survival probabilities to avoid cancellation near CDF=1; Student t tails use the regularized incomplete beta, with explicit df. Zero statistics have exact symmetric tails.
- `javascript/common.js`: small DOM, chart and formatting helpers.
- `javascript/mean-test-explorer.js`: shared rendering and controls for the three mean tests. T densities use jStat's log-domain implementation rather than overflowing raw gamma functions.
- Other `javascript/*.js`: applet-specific rendering; `html/`: individual pages; `css/`: shared styles.
- `lib/`: checked-in runtime dependencies and MathJax fonts; `tests/`: Node and Playwright tests; `scripts/`: local server, checks and reference generator.

There is deliberately no bundler or large framework. Charts consume finite values or explicit `null` gaps. A point mass has no finite continuous density, so it is explained in HTML instead of plotted as infinity. F and χ² density curves omit a singular zero endpoint where necessary; tail shading on a finite plot necessarily truncates some probability mass, while numerical p-values use the full distribution.

## Static deployment

Copy `index.html`, `html/`, `javascript/`, `css/` and **all of `lib/`** to any static host, preserving their relative paths. No `node_modules`, Python, npm server or build command is needed in production. A repository subdirectory works because links are relative. Existing `Videos/` assets can also be served if wanted; current applets do not require them.

## Dependencies

Runtime bundles are kept unchanged in this correctness PR. Their versions and provenance were checked:

| Library | Bundled version | Review and compatibility |
| --- | --- | --- |
| Chart.js | 3.7.0 | Version embedded in file header; existing v3 API retained. Obsolete v2 `yAxes` option removed. A v4 upgrade requires a separate compatibility review. |
| jStat | 1.9.5 | Exact byte match against npm `jstat@1.9.5/dist/jstat.min.js`; MIT license included. Distribution CDF/PDF/inverse APIs tested against SciPy. |
| MathJax | 3.2.0 | Embedded runtime version. Missing CHTML fonts restored from npm `mathjax@3.2.0/es5/output/chtml/fonts/woff-v2/`; Apache-2.0 license included. |

Upstream references: [jStat distributions](https://jstat.github.io/distributions.html), [Chart.js v3 migration](https://www.chartjs.org/docs/latest/migration/v3-migration.html), [Chart.js v4 migration](https://www.chartjs.org/docs/latest/migration/v4-migration.html), [MathJax local hosting](https://docs.mathjax.org/en/v3.2/web/hosting.html).

These are older vendored releases. `npm audit` covers the locked development tooling, **not** manually vendored browser libraries; it cannot certify that these bundles are free of vulnerabilities. A dependency-refresh PR should evaluate current upstream releases and advisories, retain notices and rerun the complete numerical/browser suite. This PR deliberately avoids an untested major-version upgrade.

Development tooling is pinned in `package-lock.json`: Playwright is the only added test dependency; unit tests use Node itself. `npm audit` reported no known vulnerabilities in the locked development tree during implementation.

## Contributing and staged work

Use a separate branch and pull request. Put statistical calculations in `statistics.js`, add independent reference values for numerical changes, and test both signs and boundaries. Keep rendering tests separate from numerical tests. Explain changes to assumptions, model interpretation or count generation explicitly. Run `npm run test:all` before submitting. Never deploy or merge as part of a test workflow.

The initial PR addresses all ten Priority 1 defects, adjacent statistical labels/warnings and shared test infrastructure. [ROADMAP.md](ROADMAP.md) records the larger design and teaching stages, including higher-dimensional correlation, presets, reset controls and shareable state. Those features are intentionally separate from the correctness review.

BSD-3-Clause; see [LICENSE](LICENSE). Third-party notices are in `lib/` and the upstream bundles.
