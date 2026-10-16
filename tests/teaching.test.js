const { test } = require("node:test"),
  assert = require("node:assert/strict");
const T = require("../javascript/teaching-statistics.js"),
  S = require("../javascript/statistics.js"),
  State = require("../javascript/state.js"),
  catalogue = require("../javascript/catalogue.js"),
  r = require("./references/teaching-scipy.json");
const close = (a, b, relative = 2e-6, absolute = 1e-12) =>
  assert.ok(
    Number.isFinite(a) &&
      Math.abs(a - b) <= Math.max(absolute, Math.abs(b) * relative),
    `${a} differs from ${b}`,
  );
// Endpoints can approach zero by cancellation; retain 5e-8 absolute accuracy there.
test("confidence interval endpoints and critical values agree with SciPy", () => {
  for (const row of r.intervals) {
    const actual = T.confidenceInterval(
      row.mean,
      row.sd,
      row.n,
      row.level,
      row.method,
    );
    for (const key of ["low", "high", "critical"])
      close(actual[key], row[key], 2e-6, 5e-8);
  }
});
test("known-sigma power agrees with independent SciPy references for each direction", () => {
  for (const row of r.power)
    close(
      T.power(row.n, row.d, row.alpha, row.direction).power,
      row.power,
      2e-6,
      1e-210,
    );
  for (const direction of ["lower", "upper", "twoSided"])
    close(T.power(30, 0, 0.05, direction).power, 0.05);
  assert.ok(
    T.power(200, 0.3, 0.05, "upper").power >
      T.power(5, 0.3, 0.05, "upper").power,
  );
});
test("least squares, residual sum of squares and R² agree with SciPy", () => {
  for (const row of r.regression) {
    const actual = T.regression(row.pairs);
    assert.ok(actual.defined);
    for (const key of ["slope", "intercept", "rSquared", "sse", "df"])
      close(actual[key], row[key]);
    close(
      actual.residuals.reduce((a, b) => a + b, 0),
      0,
    );
  }
  assert.equal(
    T.regression([
      [1, 1],
      [1, 2],
      [1, 3],
    ]).defined,
    false,
  );
  assert.equal(
    T.regression([
      [1, 2],
      [2, 2],
      [3, 2],
    ]).rSquared,
    null,
  );
});
test("ANOVA partition and F tail agree with SciPy, including unequal groups and tiny tails", () => {
  for (const row of r.anova) {
    const actual = T.anova(row.groups);
    for (const key of ["f", "p", "between", "within", "total"])
      close(actual[key], row[key], 2e-6, 1e-200);
    close(actual.between + actual.within, actual.total);
  }
  assert.equal(
    T.anova([
      [1, 1],
      [2, 2],
    ]).defined,
    false,
  );
});
test("Bonferroni, Holm and BH adjusted p-values match statsmodels", () => {
  for (const row of r.adjustments) {
    const actual = T.adjustPValues(row.values, row.method);
    actual.forEach((x, i) => close(x, row.adjusted[i]));
  }
  assert.deepEqual(T.adjustPValues([0.2, 0.3], "none"), [0.2, 0.3]);
});
test("seeded simulations repeat exactly and respond to their seed", () => {
  assert.deepEqual(T.clt(10, 100, "normal", 42), T.clt(10, 100, "normal", 42));
  assert.notDeepEqual(
    T.clt(10, 100, "normal", 42).means,
    T.clt(10, 100, "normal", 43).means,
  );
  assert.deepEqual(
    T.coverage(0, 1, 10, 100, 0.95, "t", 42),
    T.coverage(0, 1, 10, 100, 0.95, "t", 42),
  );
  assert.deepEqual(
    T.multipleComparisons(10, 100, 0.05, "holm", 42),
    T.multipleComparisons(10, 100, 0.05, "holm", 42),
  );
});
test("CLT moments track population mean and σ/√n for all four populations", () => {
  for (const kind of ["normal", "uniform", "exponential", "bernoulli"]) {
    const result = T.clt(30, 5000, kind, 123);
    assert.ok(Math.abs(result.empiricalMean) < 0.02);
    assert.ok(Math.abs(result.empiricalSD - result.theoreticalSE) < 0.015);
    const h = T.histogram(result.means, 25, true);
    const width = h[1].x - h[0].x;
    close(
      h.reduce((sum, p) => sum + p.y * width, 0),
      1,
    );
  }
});
test("normal coverage procedures approach their nominal rates in a seeded experiment", () => {
  for (const method of ["z", "t"]) {
    const result = T.coverage(2, 3, 10, 2000, 0.95, method, 123);
    assert.ok(Math.abs(result.covered / 2000 - 0.95) < 0.025);
    assert.ok(
      result.intervals.every((x) => Number.isFinite(x.low) && x.low < x.high),
    );
  }
  const narrow = T.confidenceInterval(0, 1, 100, 0.95, "z"),
    wide = T.confidenceInterval(0, 1, 5, 0.95, "z");
  assert.ok(narrow.margin < wide.margin);
});
test("multiple-testing simulation agrees with the independent all-null FWER", () => {
  const raw = T.multipleComparisons(20, 5000, 0.05, "none", 123);
  close(raw.unadjustedFWER, 1 - 0.95 ** 20);
  assert.ok(Math.abs(raw.empiricalFWER - raw.unadjustedFWER) < 0.035);
  for (const method of ["holm", "bonferroni", "bh"])
    assert.ok(
      T.multipleComparisons(20, 5000, 0.05, method, 123).empiricalFWER < 0.075,
    );
});
test("paired input rejects malformed, unbounded and insufficient data", () => {
  assert.deepEqual(T.parsePairs("1,2\n3 4"), [
    [1, 2],
    [3, 4],
  ]);
  for (const bad of [
    "1,2",
    "a,2\n3,4",
    "Infinity,2\n3,4",
    "1000001,2\n3,4",
    "1,2,3\n4,5,6",
  ])
    assert.throws(() => T.parsePairs(bad));
  assert.throws(() =>
    T.anova([
      [1, 2],
      [1, NaN],
    ]),
  );
  assert.throws(() => T.confidenceInterval(0, 1, 1, 0.95));
});
test("URL state accepts only valid controls, snaps steps and bounds text", () => {
  const schema = {
    n: { type: "number", min: 2, max: 100, step: 1, default: 10 },
    p: { type: "number", min: 0, max: 1, step: 0.01, default: 0.5 },
    kind: { type: "select", options: ["a", "b"], default: "a" },
    log: { type: "checkbox", default: false },
    pairs: { type: "text", default: "1,2\n3,4" },
  };
  const state = State.decode("n=20&p=.126&kind=b&log=true&ignored=42", schema);
  assert.equal(state.n, 20);
  assert.equal(state.p, 0.13);
  assert.equal(state.kind, "b");
  assert.equal(state.log, true);
  assert.equal(Object.hasOwn(state, "ignored"), false);
  for (const invalid of ["NaN", "Infinity", "-1", "101", ""])
    assert.equal(State.decode("n=" + invalid, schema).n, 10);
  assert.deepEqual(State.decode(State.encode(state, schema), schema), state);
  assert.equal(
    State.validate("x".repeat(12001), schema.pairs),
    schema.pairs.default,
  );
});
test("every applet has learning content, four usable presets and a direct page", () => {
  assert.equal(catalogue.length, 15);
  assert.equal(new Set(catalogue.map((x) => x.id)).size, 15);
  for (const item of catalogue) {
    assert.ok(item.objective && item.equation && item.question && item.answer);
    assert.equal(item.presets.length, 4);
    assert.ok(require("node:fs").existsSync("html/" + item.id + ".html"));
  }
});
test("vendored runtime bundles exactly match their audited locked npm sources", () => {
  const fs = require("node:fs");
  for (const [source, target] of [
    ["node_modules/chart.js/dist/chart.umd.min.js", "lib/chart.min.js"],
    ["node_modules/jstat/dist/jstat.min.js", "lib/jstat.min.js"],
  ])
    assert.deepEqual(fs.readFileSync(source), fs.readFileSync(target));
});
