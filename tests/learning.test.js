const { test } = require("node:test");
const assert = require("node:assert/strict");
const S = require("../javascript/statistics.js"),
  T = require("../javascript/teaching-statistics.js"),
  L = require("../javascript/learning-math.js"),
  C = require("../javascript/learning-content.js");
const close = (a, b, tolerance = 1e-10) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${a} differs from ${b}`);
test("chi-squared size experiment scales counts at fixed proportions and effect", () => {
  const a = S.generateFrequencies(5, 100, 10),
    b = S.generateFrequencies(5, 1000, 10);
  assert.deepEqual(a.observed, [0, 10, 20, 30, 40]);
  assert.deepEqual(b.observed, [0, 100, 200, 300, 400]);
  const ra = S.chiSquared(a.expected, a.observed),
    rb = S.chiSquared(b.expected, b.observed);
  close(ra.w, Math.SQRT1_2);
  close(rb.w, ra.w);
  close(rb.statistic, 10 * ra.statistic);
  assert.ok(rb.p < ra.p);
});
test("large binomial probabilities agree with independent exact integer arithmetic", () => {
  let coefficient = 1n;
  for (let k = 1n; k <= 500n; k++)
    coefficient = (coefficient * (1001n - k)) / k;
  close(S.binomialPMF(1000, 0.5, 500), Number(coefficient) / 2 ** 1000, 1e-12);
  for (const [n, p] of [
    [500, 0.05],
    [1000, 0.5],
    [1000, 0.01],
  ]) {
    const sum = Array.from({ length: n + 1 }, (_, k) =>
      S.binomialPMF(n, p, k),
    ).reduce((a, b) => a + b, 0);
    close(sum, 1, 2e-10);
  }
});
test("selected binomial count enumerates arrangements and continuity-corrected area", () => {
  const result = L.binomialSelection(3, 0.5, 2);
  assert.deepEqual([...result.arrangements].sort(), ["FSS", "SFS", "SSF"]);
  close(result.exact, 0.375);
  close(result.coefficient, 3);
  close(result.term, 0.125);
  const normal = L.binomialSelection(100, 0.5, 50);
  close(normal.normalArea, 0.07965567455405798, 1e-10);
  assert.equal(L.binomialSelection(0, 0.5, 0).normalArea, null);
});
test("power distinguishes non-rejection at the null from Type II error at an alternative", () => {
  const nullResult = T.power(30, 0, 0.05, "twoSided");
  close(nullResult.power, 0.05);
  close(nullResult.nonRejection, 0.95);
  assert.equal(nullResult.beta, null);
  const alternative = T.power(30, 0.5, 0.05, "twoSided");
  close(alternative.beta, 1 - alternative.power);
  assert.equal(T.power(30, -0.5, 0.05, "upper").beta, null);
});
test("traced studies are the actual samples that feed the CLT distribution", () => {
  for (const kind of ["normal", "uniform", "exponential", "bernoulli"]) {
    const trace = L.sampleSequence(10, 100, kind, 42),
      all = T.clt(10, 100, kind, 42);
    trace.forEach((study, i) => close(study.mean, all.means[i]));
    assert.deepEqual(trace[0].sample, all.firstSamples[0]);
  }
});
test("confidence interval inspection retains each sample and its estimated SD", () => {
  const result = T.coverage(3, 2, 10, 100, 0.95, "t", 42);
  for (const interval of result.intervals) {
    close(T.mean(interval.sample), interval.mean);
    close(Math.sqrt(T.variance(interval.sample)), interval.sampleSD);
    close(interval.sampleSD / Math.sqrt(10), interval.se);
  }
});
test("candidate-line SSE is computed from vertical errors and exceeds the minimum", () => {
  const pairs = [
    [1, 1],
    [2, 3],
    [3, 2],
  ];
  const candidate = L.candidateLine(pairs, 0, 1);
  assert.deepEqual(candidate.residuals, [0, 1, -1]);
  close(candidate.sse, 2);
  close(T.regression(pairs).sse, 1.5);
  assert.ok(candidate.sse > T.regression(pairs).sse);
});
test("ANOVA observation components and sample-size weighting agree with hand calculations", () => {
  const groups = [
    [1, 3],
    [6, 8, 10],
  ];
  const a = L.anovaObservation(groups, 0, 0);
  close(a.grand, 5.6);
  close(a.groupMean, 2);
  close(a.within, -1);
  close(a.between, -3.6);
  close(a.within + a.between, 1 - 5.6);
  close(a.withinSquare, 1);
  close(a.groupBetweenSquare, 25.92);
  close(a.result.between, 43.2);
  close(a.result.within, 10);
  close(a.result.total, 53.2);
});
test("underestimating sigma stretches the absolute t score for the same sample mean", () => {
  const samples = L.tMechanism(4, 42);
  assert.ok(samples.some((sample) => sample.sd < 1));
  for (const sample of samples.filter((sample) => sample.sd < 1))
    assert.ok(Math.abs(sample.t) > Math.abs(sample.z));
});
test("mixed-truth experiments distinguish FDR, FWER and correct discoveries", () => {
  const options = { signals: 6, effect: 0.5, sampleSize: 30 };
  const bh = T.multipleComparisons(20, 5000, 0.05, "bh", 123, options);
  const bon = T.multipleComparisons(20, 5000, 0.05, "bonferroni", 123, options);
  assert.ok(bh.trueDiscoveries > bon.trueDiscoveries);
  assert.ok(bh.empiricalFWER > bh.empiricalFDR);
  assert.ok(bh.empiricalFDR < 0.075);
  assert.ok(bon.empiricalFWER < 0.075);
  const nulls = T.multipleComparisons(20, 500, 0.05, "bh", 42);
  close(nulls.empiricalFDR, nulls.empiricalFWER);
  const allSignals = T.multipleComparisons(20, 100, 0.05, "bh", 42, {
    ...options,
    signals: 20,
  });
  close(allSignals.empiricalFWER, 0);
  close(allSignals.empiricalFDR, 0);
  assert.equal(allSignals.nulls, 0);
});
test("every applet has one worked comparison shared by all learners", () => {
  assert.equal(Object.keys(C).length, 15);
  for (const lesson of Object.values(C)) {
    assert.ok(
      lesson.role && lesson.question && lesson.plain && lesson.related.length,
    );
    assert.equal(lesson.cases, undefined);
    for (const key of [
      "heading",
      "story",
      "instruction",
      "action",
      "baseline",
      "change",
    ])
      assert.ok(lesson.experiment[key]);
    lesson.related.forEach((id) => assert.ok(C[id]));
  }
});
test("all worked comparisons contain valid data rows", () => {
  for (const [id, lesson] of Object.entries(C)) {
    const settings = [
      lesson.experiment.baseline,
      { ...lesson.experiment.baseline, ...lesson.experiment.change },
    ];
    for (const values of settings) {
      if (values.pairs) {
        const pairs = T.parsePairs(values.pairs, 3);
        assert.ok(pairs.length >= 3, id);
        if (id === "regression-explorer")
          assert.ok(T.regression(pairs).defined);
      }
      if (values.groups) {
        const groups = values.groups
          .trim()
          .split(/\n/)
          .map((row) =>
            row
              .trim()
              .split(/[,\s]+/)
              .map(Number),
          );
        assert.ok(T.anova(groups).dfBetween >= 1, id);
      }
    }
  }
});

test("worked comparisons isolate precision and within-group variability", () => {
  const e = C["one-sample-t-test"].experiment;
  const before = S.oneSample(
    e.baseline.mu,
    e.baseline.mu0,
    e.baseline.sigma,
    e.baseline.N,
  );
  const after = S.oneSample(
    e.baseline.mu,
    e.baseline.mu0,
    e.baseline.sigma,
    e.change.N,
  );
  close(before.d, after.d);
  close(after.se, before.se / 2);
  const a = C["anova-explorer"].experiment;
  const groups = (text) =>
    text.split("\n").map((row) => row.split(",").map(Number));
  const x = T.anova(groups(a.baseline.groups)),
    y = T.anova(groups(a.change.groups));
  assert.deepEqual(x.means, y.means);
  close(y.within, 9 * x.within);
  close(y.f, x.f / 9);
});
