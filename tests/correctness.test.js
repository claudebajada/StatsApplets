const { test } = require("node:test");
const assert = require("node:assert/strict");
const T = require("../javascript/teaching-statistics.js");
const S = require("../javascript/statistics.js");
const J = require("../lib/jstat.min.js");
const C = require("../javascript/catalogue.js");
const close = (a, b, tol = 1e-10) =>
  assert.ok(Math.abs(a - b) < tol, `${a} != ${b}`);
const integral = (points) =>
  points
    .slice(1)
    .reduce(
      (sum, p, i) => sum + ((p.x - points[i].x) * (p.y + points[i].y)) / 2,
      0,
    );

test("generated presets explicitly select generated data after a manual worked example", () => {
  for (const id of ["correlation", "regression-explorer", "anova-explorer"]) {
    for (const [, state] of C.find((c) => c.id === id).presets.slice(0, 4))
      assert.equal(state.dataMode, "generated", id);
  }
});
test("ANOVA input rejects empty comma fields and never inserts zero observations", () => {
  const expected = [
    [1, 2, 3],
    [4, 5, 6],
  ];
  assert.deepEqual(T.parseGroups("1, 2, 3\n4 5 6"), expected);
  for (const bad of [
    "1,2,3,\n4,5,6,",
    ",1,2\n3,4",
    "1,,2\n3,4",
    "1, ,2\n3,4",
    "1,a\n3,4",
    "1,Infinity\n3,4",
    "1,1000001\n3,4",
  ])
    assert.throws(() => T.parseGroups(bad), RangeError);
  const r = T.anova(T.parseGroups("1,2,3\n4,5,6"));
  close(r.f, 13.5);
  close(r.p, 0.021311641128756713, 1e-8);
});
test("histogram bin areas integrate to one and constant data has one centred bin", () => {
  const h = T.histogram([-2, -1, -1, 0, 1, 3], 7, true);
  close(
    h.reduce((sum, p) => sum + p.y * (p.xMax - p.xMin), 0),
    1,
  );
  h.forEach((p, i) => {
    close(p.x, (p.xMin + p.xMax) / 2);
    if (i) close(h[i - 1].xMax, p.xMin);
  });
  const constant = T.histogram(Array(500).fill(0.8765225405765732), 25);
  assert.equal(constant.length, 1);
  assert.equal(constant[0].y, 500);
  close(constant[0].x, 0.8765225405765732);
  assert.throws(() => T.histogram([], 25));
});
test("binary CLT mass uses exact count support without floating point splitting", () => {
  for (const n of [1, 5, 25, 100]) {
    const result = T.clt(n, 1000, "bernoulli", 42),
      mass = T.bernoulliMass(result.means, n);
    assert.equal(mass.length, n + 1);
    close(
      mass.reduce((s, p) => s + p.y, 0),
      1,
    );
    assert.equal(
      new Set(result.means).size,
      mass.filter((p) => p.y > 0).length,
    );
    mass.forEach((p, k) => {
      assert.equal(p.k, k);
      close(p.x, (k / n - 0.1) / 0.3);
    });
    if (n === 25) close(mass[3].y, 0.233);
  }
  const mass = T.bernoulliMass([0.06666666666666665, 0.06666666666666643], 25);
  assert.equal(mass.filter((p) => p.y).length, 1);
  close(mass[3].y, 1);
});
test("known-SD interval width is invariant to the random mean and population location", () => {
  for (const mu of [0, 5])
    for (const n of [2, 20, 100]) {
      const r = T.coverage(mu, 1, n, 500, 0.95, "z", 42);
      assert.equal(new Set(r.intervals.map((i) => i.width)).size, 1);
      close(r.averageWidth, (2 * 1.959963984540054) / Math.sqrt(n));
    }
});
test("ANOVA density retains its area when an extreme observed F extends the axis", () => {
  for (const [df1, df2, observed] of [
    [2, 57, 1612.2207059557838],
    [2, 297, 88661.59943225294],
    [1, 4, 13.5],
    [19, 20, 1e6],
  ]) {
    const r = S.densityPlot(
      (x) => J.centralF.pdf(x, df1, df2),
      (p) => J.centralF.inv(p, df1, df2),
      observed,
    );
    const expected =
      J.centralF.cdf(r.max, df1, df2) - J.centralF.cdf(r.points[0].x, df1, df2);
    close(integral(r.points), expected, 0.0003);
    assert.ok(r.points.some((p) => p.x === observed));
  }
});
test("chi-square densities retain their area at large statistics and singular endpoints", () => {
  for (const df of [1, 2, 4, 9])
    for (const observed of [0, 100, 1000]) {
      const r = S.densityPlot(
        (x) => J.chisquare.pdf(x, df),
        (p) => J.chisquare.inv(p, df),
        observed,
      );
      close(
        integral(r.points),
        J.chisquare.cdf(r.max, df) - J.chisquare.cdf(r.points[0].x, df),
        0.0003,
      );
      assert.ok(r.points.every((p) => Number.isFinite(p.y)));
    }
});
