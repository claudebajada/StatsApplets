# Improvement stages

## Stage 1: correctness and regression protection (this PR)

- [x] Priority 1 #1–10: z initialisation/directional probabilities; one/independent t probabilities; finite chart scaling; integer chi-squared counts and Cohen's w; degenerate binomial handling; dynamic F extent; undefined correlation explanations.
- [x] Independent SciPy numerical fixtures, Node tests, browser tests on all nine applets and CI (#17, #25, #27–29).
- [x] Shared mean-test rendering, corrected labels/df, signed effects, hypothesis alternatives and matching tail shading for mean tests (#11–13 and parts of #15, #20, #26).
- [x] Binomial/chi-squared validity messages and explanatory equations (#16 and parts of #24).
- [x] Static-site README, dependency inventory, missing MathJax fonts, syntax/resource/label checks (#30–32; major dependency upgrades remain separate).

## Stage 2: statistical and teaching review

- [ ] Extend correlation beyond two observations while preserving the geometric explanation (#14). The current two-element version correctly produces ±1 for non-constant pairs; continuous correlations need more observations.
- [ ] Complete a systematic review of every sampling-distribution label, uncertainty explanation and assumption (#15).
- [ ] Add worked current-value explanations and explicit learning objectives to every applet (#24).
- [ ] Review current upstream Chart.js, jStat and MathJax releases/advisories; update in isolation and rerun regression tests (#32).

## Stage 3: consistent interface and reusable scenarios

- [ ] Grouped landing page and consistent visual design (#18–19).
- [ ] Complete interaction/accessibility audit: colour-independent chart distinctions, legends, screen-reader equivalents, keyboard and multiple real devices/browsers (#20–21). Initial canvas names, labels, focus styles and mobile regression coverage are present, but are not a complete accessibility certification.
- [ ] Reset controls, standard examples and presets on all applets (#22).
- [ ] Validated URL state and direct share links suitable for lecture slides (#23).
- [ ] Further common chart/event/formatting extraction where it reduces duplication (#26).

## Stage 4: future educational extensions

Only after the existing tools have completed the statistical and interface review:

- [ ] CLT repeated-sampling simulator (#33).
- [ ] Confidence interval coverage explorer (#34).
- [ ] Power and sample-size explorer (#35).
- [ ] Linear regression, residuals and R² (#36).
- [ ] ANOVA sums of squares and within/between variance (#37).
- [ ] Multiple-comparisons simulation and corrections (#38).
- [ ] Lecturer scenarios and guided exercises (#39).

Each stage should be a separate reviewable PR. No backend or large framework is required by these goals. Deployment and merging require approval.
