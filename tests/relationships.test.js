const { test } = require("node:test");
const assert = require("node:assert/strict");
const M = require("../javascript/relationship-math.js");
const T = require("../javascript/teaching-statistics.js");
const S = require("../javascript/statistics.js");
const content = require("../javascript/relationship-content.js");
const fixture = require("./references/relationships-scipy.json");
function close(actual, expected, tolerance = 2e-7) {
  assert.ok(
    Number.isFinite(actual) &&
      Math.abs(actual - expected) <=
        tolerance * Math.max(1, Math.abs(expected)),
    `${actual} ≠ ${expected}`,
  );
}
function optionsForLaw(law) {
  return law.family === "chi"
    ? { relationship: "squares", df1: law.dfs[0] }
    : law.family === "t"
      ? law.dfs[0] > 100
        ? { relationship: "pooledT", sampleSize: 100, sampleSize2: 100 }
        : { relationship: "t", df2: law.dfs[0] }
      : law.dfs[1] > 100
        ? { relationship: "anova", groups: 6, sampleSize: 100 }
        : { relationship: "f", df1: law.dfs[0], df2: law.dfs[1] };
}
test("construction reference laws match independent SciPy densities, CDFs and quantiles", () => {
  for (const law of fixture.laws) {
    const ref = M.reference(optionsForLaw(law));
    for (const p of law.points) {
      close(ref.pdf(p.x), p.pdf);
      close(ref.cdf(p.x), p.cdf);
    }
    for (const q of law.quantiles) close(ref.quantile(q.p), q.x, 2e-6);
  }
});
test("sample variance, mean numerator and orthonormal residual directions agree with SciPy", () => {
  for (const f of fixture.variance) {
    const r = M.sampleVariance(f.sample, f.mu, f.sigma);
    for (const key of ["mean", "sd", "u", "z", "t"])
      close(r[key], f[key], 1e-12);
    close(M.sumSquares(r.contrasts), r.u, 1e-12);
    close(
      r.residuals.reduce((a, b) => a + b, 0),
      0,
      1e-12,
    );
    assert.equal(r.contrasts.length, f.sample.length - 1);
    close(r.t, r.z / Math.sqrt(r.u / r.df), 1e-12);
  }
});
test("pooled unequal-size and unequal observed-SD samples give t² = ANOVA F and matching tails", () => {
  for (const f of fixture.pooled) {
    const r = M.pooled(f.groups);
    close(r.t, f.t, 1e-12);
    close(r.anova.f, f.f, 1e-12);
    close(r.t ** 2, r.anova.f, 1e-12);
    close(S.tTails(r.t, r.df).twoSided, f.p, 2e-9);
    close(r.anova.p, f.fp, 2e-9);
    close(r.within / r.df, r.variance, 1e-12);
  }
});
test("the residual rotation is orthonormal and separates the sample mean direction", () => {
  for (const n of [2, 5, 100]) {
    const columns = Array.from({ length: n }, (_, i) => {
      const basis = Array.from({ length: n }, (_, j) => Number(i === j));
      const r = M.sampleVariance(basis);
      return [r.z, ...r.contrasts];
    });
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const inner = columns.reduce((s, c) => s + c[i] * c[j], 0);
        close(inner, Number(i === j), 1e-12);
      }
  }
});
test("constrained category residuals preserve Q under rotation and agree with SciPy", () => {
  for (const f of fixture.gof) {
    const r = M.goodnessOfFit(f.counts);
    close(r.value, f.q, 1e-12);
    close(M.sumSquares(r.contrasts), r.value, 1e-12);
    close(
      r.residuals.reduce((a, b) => a + b, 0),
      0,
      1e-12,
    );
    close(
      S.chiSquared(Array(f.counts.length).fill(r.expected), f.counts).p,
      f.p,
      1e-12,
    );
    assert.equal(r.df, f.counts.length - 1);
  }
});
test("all constructions use the displayed ingredients and preserve their random sequence", () => {
  assert.deepEqual(Object.keys(content.modes), M.kinds);
  for (const relationship of M.kinds) {
    const options = { relationship };
    const short = M.simulate(options, 100),
      long = M.simulate(options, 200);
    assert.deepEqual(long.slice(0, 100), short);
    assert.notDeepEqual(short, M.simulate({ ...options, seed: 43 }, 100));
    const d = M.draw(options, 57);
    assert.equal(d.value, long[57].value);
    assert.deepEqual(M.draw(options, 57), d);
    assert.equal(content.modes[relationship].steps.length, 4);
    if (relationship === "tSquared") close(d.value, d.trace.f, 1e-12);
    if (relationship === "sampleVariance")
      close(d.value, M.sumSquares(d.trace.contrasts), 1e-12);
    if (relationship === "oneSampleT")
      close(d.value, d.trace.mean / (d.trace.sd / Math.sqrt(d.trace.n)), 1e-12);
    if (relationship === "f")
      close(d.value, d.trace.scaledU / d.trace.scaledV, 1e-12);
  }
  const a = M.draw({ relationship: "t", df2: 1 }, 3);
  const b = M.draw({ relationship: "normalLimit", df2: 100 }, 3);
  assert.equal(a.trace.z, b.trace.z);
  const d = M.draw({ relationship: "anova", groups: 2 }, 7);
  close(d.value, d.trace.pooled.t ** 2, 1e-12);
  close(d.trace.total, d.trace.between + d.trace.within, 1e-12);
});
test("seeded empirical CDFs match independent quantiles even where moments do not exist", () => {
  for (const law of fixture.laws.filter((l) => l.dfs[0] <= 4)) {
    const records = M.simulate(optionsForLaw(law), 5000);
    for (const q of law.quantiles.filter((q) =>
      [0.1, 0.5, 0.9].includes(q.p),
    )) {
      const fraction =
        records.filter((r) => r.value <= q.x).length / records.length;
      assert.ok(
        Math.abs(fraction - q.p) < 0.035,
        `${JSON.stringify(law.dfs)}: empirical ${fraction} vs ${q.p}`,
      );
    }
  }
  const c = { relationship: "gof", observations: 1000, categories: 5 };
  const records = M.simulate(c, 5000);
  const law = fixture.laws.find((l) => l.family === "chi" && l.dfs[0] === 4);
  for (const q of law.quantiles.filter((q) => [0.1, 0.5, 0.9].includes(q.p)))
    close(
      records.filter((r) => r.value <= q.x).length / records.length,
      q.p,
      0.04,
    );
});
test("plots keep overflow counts, finite curves and full-count histogram normalisation", () => {
  const records = [
    { value: -1e100 },
    { value: 1 },
    { value: 1e100 },
    { value: null },
  ];
  const p = M.plot({ relationship: "f", df1: 1, df2: 1 }, records);
  assert.equal(p.outside, 2);
  assert.equal(p.undefinedCount, 1);
  close(
    p.bars.reduce((a, b) => a + b.y * (b.xMax - b.xMin), 0),
    0.25,
    1e-12,
  );
  for (const relationship of M.kinds) {
    const c = { relationship, df1: 1, df2: 1 },
      plot = M.plot(c, M.simulate(c, 100));
    assert.ok(plot.max > plot.min);
    assert.ok(
      plot.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    );
  }
});
test("invalid parameters are rejected and zero variance is explicitly undefined", () => {
  for (const c of [
    { relationship: "unknown" },
    { df1: 0 },
    { df2: Infinity },
    { sampleSize: 101 },
    { groups: 7 },
    { observations: 9 },
    { seed: -1 },
  ])
    assert.throws(() => M.draw(c));
  assert.throws(() => M.draw({}, 5000));
  assert.throws(() => M.simulate({}, 5001));
  assert.throws(() => M.sampleVariance([1, NaN]));
  assert.throws(() => M.sampleVariance([1, 2], 0, 0));
  assert.throws(() => M.goodnessOfFit([0, 0]));
  assert.throws(() => M.goodnessOfFit([1, 0.5]));
  assert.equal(M.sampleVariance([1, 1]).t, null);
  assert.equal(
    M.pooled([
      [1, 1],
      [2, 2],
    ]).t,
    null,
  );
  assert.equal(
    M.pooled([
      [1, 1],
      [2, 2],
    ]).anova.defined,
    false,
  );
});
