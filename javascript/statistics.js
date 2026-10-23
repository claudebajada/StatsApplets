/* Pure statistical calculations shared by the static pages and Node tests. */
(function (root, factory) {
  if (typeof module === "object" && module.exports)
    module.exports = factory(require("../lib/jstat.min.js"));
  else root.StatsMath = factory(root.jStat);
})(typeof globalThis !== "undefined" ? globalThis : this, function (jStat) {
  "use strict";
  function positive(value, name) {
    if (!Number.isFinite(value) || value <= 0)
      throw new RangeError(`${name} must be positive`);
  }
  function probability(p) {
    return Math.max(0, Math.min(1, p));
  }

  // Upper regularized gamma: continued fraction avoids subtracting a CDF near 1.
  function gammaSurvival(a, x) {
    if (x === 0) return 1;
    if (x === Infinity) return 0;
    if (x < a + 1) return probability(1 - jStat.lowRegGamma(a, x));
    const tiny = 1e-300;
    let b = x + 1 - a,
      c = 1 / tiny,
      d = 1 / b,
      h = d;
    for (let i = 1; i <= 1000; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < tiny) d = tiny;
      c = b + an / c;
      if (Math.abs(c) < tiny) c = tiny;
      d = 1 / d;
      const delta = d * c;
      h *= delta;
      if (Math.abs(delta - 1) < 2e-15) break;
    }
    return probability(Math.exp(-x + a * Math.log(x) - jStat.gammaln(a)) * h);
  }
  function symmetricTails(statistic, smallTail) {
    if (!Number.isFinite(statistic))
      throw new RangeError("Statistic must be finite");
    if (statistic === 0) return { lower: 0.5, upper: 0.5, twoSided: 1 };
    const small = probability(smallTail);
    return {
      lower: statistic < 0 ? small : 1 - small,
      upper: statistic > 0 ? small : 1 - small,
      twoSided: probability(2 * small),
    };
  }
  function zTails(z) {
    return symmetricTails(z, gammaSurvival(0.5, (z * z) / 2) / 2);
  }
  function tTails(t, df) {
    positive(df, "Degrees of freedom");
    return symmetricTails(t, jStat.ibeta(df / (df + t * t), df / 2, 0.5) / 2);
  }
  function normalDensity(x, mean, sd) {
    // A point mass has no ordinary density. Omit it from a continuous curve.
    if (!(sd > 0)) return null;
    return (
      Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI))
    );
  }
  function oneSample(mean, nullMean, sd, n, knownSigma = false) {
    positive(sd, "Standard deviation");
    if (!Number.isInteger(n) || n < 2)
      throw new RangeError("Sample size must be an integer ≥ 2");
    const se = sd / Math.sqrt(n),
      statistic = (mean - nullMean) / se,
      df = n - 1;
    return {
      se,
      statistic,
      df,
      d: (mean - nullMean) / sd,
      tails: knownSigma ? zTails(statistic) : tTails(statistic, df),
    };
  }
  function independentSamples(mean1, mean2, sd, n1, n2) {
    positive(sd, "Common sample standard deviation");
    if (![n1, n2].every((n) => Number.isInteger(n) && n >= 2))
      throw new RangeError("Sample sizes must be integers ≥ 2");
    // Existing single-SD model: equal sample SDs and equal population variances.
    const se = sd * Math.sqrt(1 / n1 + 1 / n2),
      df = n1 + n2 - 2;
    const statistic = (mean1 - mean2) / se;
    return {
      se,
      df,
      statistic,
      d: (mean1 - mean2) / sd,
      tails: tTails(statistic, df),
    };
  }
  function combinations(n, k) {
    if (k < 0 || k > n) return 0;
    k = Math.min(k, n - k);
    let result = 1;
    for (let i = 0; i < k; i++) result *= (n - i) / (i + 1);
    return result;
  }
  function binomialPMF(n, p, k) {
    if (!Number.isInteger(n) || n < 0 || !Number.isFinite(p) || p < 0 || p > 1)
      throw new RangeError("Invalid binomial parameters");
    if (!Number.isInteger(k) || k < 0 || k > n) return 0;
    if (p === 0) return k === 0 ? 1 : 0;
    if (p === 1) return k === n ? 1 : 0;
    if (n <= 100) return combinations(n, k) * p ** k * (1 - p) ** (n - k);
    // Log probabilities avoid overflowing C(n,k) in large-sample examples.
    let logCoefficient = 0, compensation = 0;
    for (let i = 1; i <= Math.min(k,n-k); i++) {
      const term = Math.log((n-i+1)/i) - compensation;
      const next = logCoefficient + term;
      compensation = (next-logCoefficient)-term;
      logCoefficient = next;
    }
    return Math.exp(logCoefficient + k * Math.log(p) + (n-k) * Math.log1p(-p));
  }
  function binomialApproximation(n, p) {
    binomialPMF(n, p, 0); // Validate parameters even at a boundary.
    const mean = n * p,
      sd = Math.sqrt(n * p * (1 - p));
    const warning =
      sd === 0
        ? `All probability is at X = ${mean}. Variance is zero, so there is no continuous normal approximation.`
        : Math.min(n * p, n * (1 - p)) < 5
          ? "The normal approximation may be poor. A common rule of thumb requires both np and n(1 − p) to be at least 5."
          : "Both np and n(1 − p) are at least 5. The normal curve gives an approximation. The binomial bars give exact probabilities.";
    return { mean, sd, warning };
  }
  function generateFrequencies(categories, n, skew) {
    if (
      !Number.isInteger(categories) ||
      categories < 2 ||
      !Number.isInteger(n) ||
      n < 1 ||
      !Number.isFinite(skew)
    )
      throw new RangeError("Invalid frequency parameters");
    const expected = Array(categories).fill(n / categories);
    // Dimensionless departure fixes the category proportions as N changes.
    // The original 0–10 slider now interpolates from uniform to a linear ramp.
    const departure = Math.max(0, Math.min(1, skew / 10));
    const weights = expected.map((_, i) =>
      1 + departure * (2 * i / (categories - 1) - 1),
    );
    const sum = weights.reduce((a, b) => a + b, 0);
    const quotas = weights.map((w) => (w / sum) * n);
    const observed = quotas.map(Math.floor);
    // Largest remainder allocation preserves exactly N integer observations.
    const order = quotas
      .map((q, i) => ({ i, remainder: q - observed[i] }))
      .sort((a, b) => b.remainder - a.remainder || a.i - b.i);
    const remaining = n - observed.reduce((a, b) => a + b, 0);
    for (let i = 0; i < remaining; i++) observed[order[i].i]++;
    return { expected, observed };
  }
  function chiSquared(expected, observed) {
    if (
      expected.length !== observed.length ||
      expected.length < 2 ||
      expected.some((e) => !(e > 0)) ||
      observed.some((o) => !Number.isFinite(o) || o < 0)
    )
      throw new RangeError("Invalid frequencies");
    const statistic = observed.reduce(
      (sum, o, i) => sum + (o - expected[i]) ** 2 / expected[i],
      0,
    );
    const n = observed.reduce((a, b) => a + b, 0),
      df = expected.length - 1;
    positive(n, "Total observed count");
    return {
      statistic,
      df,
      w: Math.sqrt(statistic / n),
      p: gammaSurvival(df / 2, statistic / 2),
    };
  }
  function fPlot(df1, df2) {
    positive(df1, "Numerator degrees of freedom");
    positive(df2, "Denominator degrees of freedom");
    const critical = jStat.centralF.inv(0.95, df1, df2);
    const max = Math.max(5, jStat.centralF.inv(0.99, df1, df2), critical * 1.2);
    // Quadratic spacing retains resolution near the mode for long-tailed F(1,1).
    const points = Array.from({ length: 601 }, (_, i) => {
      const x = max * ((i + 1) / 601) ** 2;
      return { x, y: jStat.centralF.pdf(x, df1, df2) };
    });
    points.push({ x: critical, y: jStat.centralF.pdf(critical, df1, df2) });
    points.sort((a, b) => a.x - b.x);
    return { critical, max, points };
  }
  function dot(a, b) {
    return a.reduce((s, v, i) => s + v * b[i], 0);
  }
  function norm(v) {
    return Math.hypot(...v);
  }
  function center(v) {
    // Translate before summing: constant decimal vectors then centre to exact zero.
    const offsets = v.map((x) => x - v[0]);
    const mean = offsets.reduce((s, x) => s + x, 0) / v.length;
    return offsets.map((x) => x - mean);
  }
  function cosine(a, b) {
    const denominator = norm(a) * norm(b);
    return denominator === 0
      ? null
      : Math.max(-1, Math.min(1, dot(a, b) / denominator));
  }
  function pearson(a, b) {
    return cosine(center(a), center(b));
  }
  return {
    zTails,
    tTails,
    normalDensity,
    oneSample,
    independentSamples,
    combinations,
    binomialPMF,
    binomialApproximation,
    generateFrequencies,
    chiSquared,
    fPlot,
    dot,
    norm,
    center,
    cosine,
    pearson,
  };
});
