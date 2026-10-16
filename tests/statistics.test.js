const { test } = require("node:test");
const assert = require("node:assert/strict");
const s = require("../javascript/statistics.js");
const jStat = require("../lib/jstat.min.js");
const reference = require("./references/scipy.json");
function close(actual, expected, relative = 2e-7, absolute = 1e-14) {
  assert.ok(Number.isFinite(actual), `Non-finite result: ${actual}`);
  assert.ok(
    Math.abs(actual - expected) <=
      Math.max(absolute, Math.abs(expected) * relative),
    `${actual} differs from SciPy ${expected}`,
  );
}
function checkTails(actual, expected) {
  for (const key of ["lower", "upper", "twoSided"])
    close(actual[key], expected[key], 2e-7, 1e-305);
  close(actual.lower + actual.upper, 1);
}
test("normal tails agree with SciPy, including signed and extreme statistics", () => {
  for (const r of reference.z) checkTails(s.zTails(r.value), r);
});
test("Student t tails and densities agree with SciPy across df and signs", () => {
  for (const r of reference.t) {
    checkTails(s.tTails(r.value, r.df), r);
    close(jStat.studentt.pdf(r.value, r.df), r.density);
  }
});
test("one sample calculations use sample SD, n−1 df and signed effects", () => {
  for (const r of reference.oneSample) {
    const actual = s.oneSample(r.mean, r.null, r.sd, r.n);
    for (const k of ["se", "statistic", "df", "d"]) close(actual[k], r[k]);
    checkTails(actual.tails, r);
    checkTails(
      s.oneSample(r.mean, r.null, r.sd, r.n, true).tails,
      s.zTails(r.statistic),
    );
  }
});
test("independent pooled t uses n₁+n₂−2 df, including unequal sample sizes", () => {
  for (const r of reference.independent) {
    const actual = s.independentSamples(r.m1, r.m2, r.sd, r.n1, r.n2);
    for (const k of ["se", "statistic", "df", "d"]) close(actual[k], r[k]);
    checkTails(actual.tails, r);
  }
});
test("exact binomial PMF agrees with SciPy at all supported boundaries", () => {
  for (const r of reference.binomial)
    close(s.binomialPMF(r.n, r.p, r.k), r.probability, 2e-12, 1e-305);
  for (let n = 0; n <= 30; n++)
    for (let p = 0; p <= 100; p++) {
      close(
        Array.from({ length: n + 1 }, (_, k) =>
          s.binomialPMF(n, p / 100, k),
        ).reduce((a, b) => a + b, 0),
        1,
      );
    }
  for (const [n, p] of [
    [0, 0.5],
    [30, 0],
    [30, 1],
  ]) {
    assert.equal(s.binomialApproximation(n, p).sd, 0);
    assert.match(s.binomialApproximation(n, p).warning, /zero/);
    assert.equal(s.normalDensity(n * p, n * p, 0), null);
  }
  assert.match(s.binomialApproximation(10, 0.01).warning, /poor/);
  close(s.normalDensity(0, 0, 1), 1 / Math.sqrt(2 * Math.PI));
});
test("observed counts are non-negative integers summing to exactly N throughout UI domain", () => {
  for (let k = 2; k <= 10; k++)
    for (let n = 10; n <= 1000; n += 10)
      for (let v = 0; v <= 100; v++) {
        const { expected, observed } = s.generateFrequencies(k, n, v / 10);
        assert.equal(
          observed.reduce((a, b) => a + b, 0),
          n,
        );
        assert.ok(observed.every((x) => Number.isInteger(x) && x >= 0));
        close(
          expected.reduce((a, b) => a + b, 0),
          n,
        );
      }
});
test("chi-squared GOF and Cohen w agree with SciPy", () => {
  for (const r of reference.chi) {
    const actual = s.chiSquared(r.expected, r.observed);
    for (const k of ["statistic", "w", "p"])
      close(actual[k], r[k], 2e-7, 1e-305);
  }
});
test("F critical values agree with SciPy and all plotted densities are finite", () => {
  for (const r of reference.f) {
    const actual = s.fPlot(r.df1, r.df2);
    close(actual.critical, r.critical, 2e-6);
    assert.ok(actual.max >= r.q99 * (1 - 2e-6));
    assert.ok(actual.max > actual.critical);
    assert.ok(
      actual.points.every(
        (p) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.y >= 0,
      ),
    );
  }
});
test("inner products, Pearson r and undefined vector cases", () => {
  for (const r of reference.correlation) {
    close(s.dot(r.a, r.b), r.dot);
    close(s.pearson(r.a, r.b), r.r);
  }
  assert.equal(s.cosine([0, 0], [1, 2]), null);
  assert.equal(s.pearson([1, 1], [1, 2]), null);
  assert.equal(s.dot([0, 0], [0, 0]), 0);
});
test("invalid test parameters are rejected", () => {
  assert.throws(() => s.tTails(1, 0), RangeError);
  assert.throws(() => s.zTails(NaN), RangeError);
  assert.throws(() => s.oneSample(0, 0, 0, 5), RangeError);
  assert.throws(() => s.independentSamples(0, 0, 1, 1, 5), RangeError);
  assert.throws(() => s.binomialPMF(-1, 0.5, 0), RangeError);
  assert.throws(() => s.binomialPMF(1, 2, 0), RangeError);
});
