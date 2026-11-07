/* Distribution constructions from their ingredients, shared by Node and the browser. */
(function (root, factory) {
  if (typeof module === "object" && module.exports)
    module.exports = factory(
      require("./teaching-statistics.js"),
      require("../lib/jstat.min.js"),
    );
  else root.RelationshipMath = factory(root.TeachingMath, root.jStat);
})(globalThis, function (T, jStat) {
  "use strict";
  const kinds = [
    "squares",
    "t",
    "f",
    "tSquared",
    "normalLimit",
    "sampleVariance",
    "oneSampleT",
    "pooledT",
    "anova",
    "gof",
  ];
  const defaults = {
    relationship: "squares",
    df1: 1,
    df2: 4,
    sampleSize: 5,
    sampleSize2: 5,
    groups: 3,
    categories: 5,
    observations: 100,
    seed: 42,
  };
  function integer(value, min, max) {
    if (!Number.isInteger(value) || value < min || value > max)
      throw new RangeError(`Expected integer from ${min} to ${max}`);
  }
  function config(options = {}) {
    const c = { ...defaults, ...options };
    if (!kinds.includes(c.relationship))
      throw new RangeError("Unknown relationship");
    for (const key of ["df1", "df2"]) integer(c[key], 1, 100);
    for (const key of ["sampleSize", "sampleSize2"]) integer(c[key], 2, 100);
    integer(c.groups, 2, 6);
    integer(c.categories, 2, 10);
    integer(c.observations, 10, 1000);
    integer(c.seed, 0, 2147483647);
    return c;
  }
  const sumSquares = (values) => values.reduce((sum, x) => sum + x * x, 0);
  function sampleVariance(sample, mu = 0, sigma = 1) {
    integer(sample.length, 2, 100);
    if (![...sample, mu, sigma].every(Number.isFinite) || sigma <= 0)
      throw new RangeError(
        "Finite observations and a positive population SD are required",
      );
    const n = sample.length,
      mean = T.mean(sample);
    const residuals = sample.map((x) => x - mean);
    const ss = sumSquares(residuals),
      df = n - 1;
    // Helmert contrasts rotate the residual subspace into n−1 orthonormal directions.
    // For a normal population these coordinates are independent N(0,1), and are
    // independent of the mean coordinate. Raw centred residuals are dependent.
    let running = sample[0];
    const contrasts = sample.slice(1).map((x, j) => {
      const i = j + 1,
        value = (Math.sqrt(i / (i + 1)) * (running / i - x)) / sigma;
      running += x;
      return value;
    });
    const sd = Math.sqrt(ss / df),
      z = (Math.sqrt(n) * (mean - mu)) / sigma;
    const t = sd > 0 ? (Math.sqrt(n) * (mean - mu)) / sd : null;
    return {
      sample,
      n,
      mean,
      residuals,
      ss,
      df,
      sd,
      z,
      t,
      contrasts,
      u: ss / sigma ** 2,
    };
  }
  function pooled(groups) {
    if (groups.length !== 2) throw new RangeError("Two groups are required");
    const parts = groups.map((g) => sampleVariance(g));
    const [a, b] = parts,
      df = a.df + b.df,
      within = a.ss + b.ss;
    const variance = within / df,
      difference = a.mean - b.mean;
    const z = difference / Math.sqrt(1 / a.n + 1 / b.n);
    const se = Math.sqrt(variance * (1 / a.n + 1 / b.n));
    const t = se > 0 ? difference / se : null;
    return {
      groups,
      parts,
      df,
      within,
      variance,
      difference,
      se,
      z,
      t,
      anova: T.anova(groups),
    };
  }
  function goodnessOfFit(counts) {
    integer(counts.length, 2, 10);
    counts.forEach((x) => integer(x, 0, 1000));
    const n = counts.reduce((a, b) => a + b, 0);
    if (n === 0 || n > 1000)
      throw new RangeError("The total count must be from 1 to 1000");
    const expected = n / counts.length;
    const residuals = counts.map((o) => (o - expected) / Math.sqrt(expected));
    return {
      counts,
      n,
      expected,
      residuals,
      contrasts: sampleVariance(residuals).contrasts,
      contributions: residuals.map((r) => r * r),
      df: counts.length - 1,
      value: sumSquares(residuals),
    };
  }
  function construct(c, index) {
    // One reproducible stream per repetition makes both extensions and random
    // access prefix-stable. Inspecting a draw never changes the sampling stream.
    const random = T.rng((c.seed + Math.imul(index + 1, 0x9e3779b9)) >>> 0);
    const normals = (n) => Array.from({ length: n }, () => T.gaussian(random));
    let trace,
      value,
      companion = null;
    switch (c.relationship) {
      case "squares": {
        const sample = normals(c.df1),
          squares = sample.map((z) => z * z);
        value = sumSquares(sample);
        trace = { sample, squares, u: value };
        break;
      }
      case "t":
      case "tSquared":
      case "normalLimit": {
        const z = T.gaussian(random),
          denominator = normals(c.df2);
        const u = sumSquares(denominator),
          scaled = u / c.df2;
        const t = scaled > 0 ? z / Math.sqrt(scaled) : null;
        value = c.relationship === "tSquared" && t !== null ? t * t : t;
        companion = c.relationship === "normalLimit" ? z : null;
        trace = {
          z,
          denominator,
          u,
          scaled,
          t,
          f: t === null ? null : (z * z) / scaled,
        };
        break;
      }
      case "f": {
        const numerator = normals(c.df1),
          denominator = normals(c.df2);
        const u = sumSquares(numerator),
          v = sumSquares(denominator);
        value = v > 0 ? u / c.df1 / (v / c.df2) : null;
        trace = {
          numerator,
          denominator,
          u,
          v,
          scaledU: u / c.df1,
          scaledV: v / c.df2,
        };
        break;
      }
      case "sampleVariance":
      case "oneSampleT": {
        trace = sampleVariance(normals(c.sampleSize));
        value = c.relationship === "sampleVariance" ? trace.u : trace.t;
        break;
      }
      case "pooledT": {
        trace = pooled([normals(c.sampleSize), normals(c.sampleSize2)]);
        value = trace.t;
        break;
      }
      case "anova": {
        const groups = Array.from({ length: c.groups }, () =>
          normals(c.sampleSize),
        );
        trace = { groups, ...T.anova(groups) };
        if (c.groups === 2) trace.pooled = pooled(groups);
        value = trace.defined ? trace.f : null;
        break;
      }
      case "gof": {
        const counts = Array(c.categories).fill(0);
        for (let i = 0; i < c.observations; i++)
          counts[Math.floor(random() * c.categories)]++;
        trace = goodnessOfFit(counts);
        value = trace.value;
        break;
      }
    }
    if (!Number.isFinite(value)) value = null;
    return {
      index,
      value,
      companion,
      trace,
      reason:
        value === null
          ? "A zero denominator or a result outside floating-point range makes this repetition undefined. It is retained in the export and is not redrawn."
          : "",
    };
  }
  function draw(options, index = 0) {
    integer(index, 0, 4999);
    return construct(config(options), index);
  }
  function simulate(options, repetitions) {
    integer(repetitions, 1, 5000);
    const c = config(options);
    return Array.from({ length: repetitions }, (_, i) => {
      const { value, companion } = construct(c, i);
      return { index: i, value, companion };
    });
  }
  function reference(options) {
    const c = config(options);
    let family, df1, df2;
    switch (c.relationship) {
      case "squares":
        family = "chi";
        df1 = c.df1;
        break;
      case "sampleVariance":
        family = "chi";
        df1 = c.sampleSize - 1;
        break;
      case "gof":
        family = "chi";
        df1 = c.categories - 1;
        break;
      case "f":
        family = "f";
        df1 = c.df1;
        df2 = c.df2;
        break;
      case "tSquared":
        family = "f";
        df1 = 1;
        df2 = c.df2;
        break;
      case "anova":
        family = "f";
        df1 = c.groups - 1;
        df2 = c.groups * (c.sampleSize - 1);
        break;
      default:
        family = "t";
        df1 =
          c.relationship === "oneSampleT"
            ? c.sampleSize - 1
            : c.relationship === "pooledT"
              ? c.sampleSize + c.sampleSize2 - 2
              : c.df2;
    }
    const law =
      family === "chi"
        ? jStat.chisquare
        : family === "f"
          ? jStat.centralF
          : jStat.studentt;
    const args = family === "f" ? [df1, df2] : [df1];
    return {
      family,
      df1,
      df2,
      label:
        family === "chi"
          ? `χ²(${df1})`
          : family === "f"
            ? `F(${df1}, ${df2})`
            : `t(${df1})`,
      pdf: (x) => law.pdf(x, ...args),
      cdf: (x) => law.cdf(x, ...args),
      quantile: (p) => law.inv(p, ...args),
    };
  }
  function plot(options, records, bins = 40) {
    integer(bins, 5, 100);
    const ref = reference(options),
      isT = ref.family === "t";
    // Central 99% for heavy signed tails, lower 99% for nonnegative laws.
    // No sample is clamped or discarded from the exported records.
    const min = isT ? ref.quantile(0.005) : 0;
    const max = ref.quantile(isT ? 0.995 : 0.99),
      width = (max - min) / bins;
    const counts = Array(bins).fill(0);
    let outside = 0,
      undefinedCount = 0;
    for (const { value } of records) {
      if (!Number.isFinite(value)) {
        undefinedCount++;
        continue;
      }
      if (value < min || value > max) {
        outside++;
        continue;
      }
      counts[Math.min(bins - 1, Math.floor((value - min) / width))]++;
    }
    const bars = counts.map((count, i) => ({
      x: min + (i + 0.5) * width,
      xMin: min + i * width,
      xMax: min + (i + 1) * width,
      y: records.length ? count / (records.length * width) : 0,
    }));
    const points = Array.from({ length: 401 }, (_, i) => {
      // Avoid an infinite endpoint at zero without replacing its density by zero.
      const x =
        min + ((i + (isT ? 0 : 0.2)) / (isT ? 400 : 400.2)) * (max - min);
      return { x, y: ref.pdf(x) };
    }).filter((p) => Number.isFinite(p.y));
    return {
      min,
      max,
      bars,
      points,
      outside,
      undefinedCount,
      reference: ref.label,
    };
  }
  return {
    kinds,
    defaults,
    config,
    sumSquares,
    sampleVariance,
    pooled,
    goodnessOfFit,
    draw,
    simulate,
    reference,
    plot,
  };
});
