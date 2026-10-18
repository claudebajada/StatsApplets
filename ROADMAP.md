# Planned work and verification limits

The original correctness stage and the requested follow-up stages are implemented on `fix/statistical-correctness`, in the existing PR. Nothing is merged or deployed.

| Original priorities | Completed work                                                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1–10               | All original numerical/initialisation/boundary fixes retained and regression-tested                                                                            |
| #11–13              | Consistent mean-test alternatives, signed effects and sample/population notation; valid upper-tail-only GOF/ANOVA interpretation                               |
| #14                 | Student scatterplot with selectable sample r, manual pairs and optional centring/dot-product calculation                                                       |
| #15–17              | Sample estimate/SE and null reference plots, explicit chart explanations, validity messages and independent numerical fixtures                                 |
| #18–21              | Grouped searchable catalogue, shared responsive layout, standard charts, focus/labels, data alternatives and automated accessibility/browser checks            |
| #22–24              | Four presets and reset on all 15 applets, validated URL state, worked explanations, equations and learning objectives                                          |
| #25–32              | DOM-free numerical modules, common rendering/control/state helpers, unit/browser tests, CI, authoring checks, documentation and audited pinned runtime bundles |
| #33                 | CLT repeated sampling: normal, uniform, exponential and rare binary populations                                                                                |
| #34                 | Repeated t/z confidence intervals, widths and empirical coverage                                                                                               |
| #35                 | Known-σ one-sample z power, sample-size curve, significance and rejection areas                                                                                |
| #36                 | Least-squares regression with generated/manual data, residuals, SSE and R²                                                                                     |
| #37                 | One-way ANOVA with generated/manual groups, SS partition, F and η²                                                                                             |
| #38                 | All-null multiple-comparison simulation with no adjustment, Bonferroni, Holm and BH                                                                            |
| #39                 | Removed following student-focused feedback; simple presets and shareable parameter links retained                                                              |

## Student-focused revision

The home-page “Understand what changes.” panel and all lecturer controls have been removed. Equations are native MathML rather than code-like text. The three mean tests now use two distinct plots: an estimate with a ±1 standard-error bar in original units, then the null distribution of the test statistic. Correlation starts with one scatterplot; centring and normalisation are explained on request. All chart panels explain what their marks and axes represent.

## Deliberate model boundaries

- The independent t-test remains the original pooled equal-variance model with a single sample SD; it is not Welch's test.
- Power is an exact known-σ z model. A t-power extension would require a separately validated noncentral t implementation.
- Confidence intervals use normal-population samples. The CLT explorer supplies the separate non-normal-population experiment.
- Multiple comparisons uses independent, continuous, all-null p-values. Its BH illustration does not claim arbitrary-dependence control or demonstrate the mixed-null power trade-off.
- The site is for students. Lecturer mode and lesson metadata have been removed. Legacy lesson URL parameters are ignored.
- Correlation sliders construct points with a selected sample r; they do not simulate population inference. Detailed vector calculations remain optional.
- Seeds reproduce numerical experiments. Exact canvas pixels can vary by browser/font.

## Verification scope

- Numerical tests use independent SciPy 1.17.0 and statsmodels 0.14.6 fixtures; simulation tests check deterministic reproduction and finite-sample tolerances.
- Browser projects cover desktop/mobile Chromium, Firefox and WebKit. Mobile is emulated; physical devices and real assistive-technology users were not available in this execution environment.
- Automated axe WCAG checks, native keyboard tests, data tables/CSV alternatives and visual review improve accessibility without constituting a full conformance certification.
- Pinned npm versions and exact vendor-bundle checks make advisory review repeatable. No-known-advisory results are time-dependent and should be rechecked when updating dependencies.

Further work should follow teaching feedback and independently validated model extensions. The original staged scope is complete; the boundaries above describe what each implementation teaches.
