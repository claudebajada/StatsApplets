/* Pure, seeded simulation and modelling functions. No DOM or Chart.js. */
(function (root, factory) {
  if (typeof module === "object" && module.exports)
    module.exports = factory(
      require("./statistics.js"),
      require("../lib/jstat.min.js"),
    );
  else root.TeachingMath = factory(root.StatsMath, root.jStat);
})(typeof globalThis !== "undefined" ? globalThis : this, function (S, jStat) {
  "use strict";
  function finite(x) {
    if (!Number.isFinite(x)) throw new RangeError("Values must be finite");
    return x;
  }
  function integer(n, min, max = 100000) {
    if (!Number.isInteger(n) || n < min || n > max)
      throw new RangeError(`Expected integer from ${min} to ${max}`);
  }
  function positive(x) {
    finite(x);
    if (x <= 0) throw new RangeError("Expected a positive value");
  }
  function rate(x) {
    finite(x);
    if (x <= 0 || x >= 1)
      throw new RangeError("Probability must be between 0 and 1");
  }
  function mean(a) {
    if (!a.length) throw new RangeError("Empty data");
    const origin = finite(a[0]);
    return origin + a.reduce((s, x) => s + (finite(x) - origin), 0) / a.length;
  }
  function variance(a) {
    integer(a.length, 2);
    const m = mean(a);
    return a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1);
  }
  function rng(seed) {
    integer(seed, 0, 4294967295);
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gaussian(random) {
    return (
      Math.sqrt(-2 * Math.log(Math.max(random(), Number.MIN_VALUE))) *
      Math.cos(2 * Math.PI * random())
    );
  }
  // All populations are standardised to population mean 0 and population SD 1.
  function draw(kind, random) {
    switch (kind) {
      case "normal":
        return gaussian(random);
      case "uniform":
        return (random() - 0.5) * Math.sqrt(12);
      case "exponential":
        return -Math.log(Math.max(random(), Number.MIN_VALUE)) - 1;
      case "bernoulli":
        return ((random() < 0.1 ? 1 : 0) - 0.1) / 0.3;
      default:
        throw new RangeError("Unknown population");
    }
  }
  function clt(n, repetitions, kind, seed) {
    integer(n, 1, 500);
    integer(repetitions, 10, 5000);
    const random = rng(seed);
    const firstSamples = [];
    const means = Array.from({ length: repetitions }, (_, index) => {
      const sample = Array.from({ length: n }, () => draw(kind, random));
      if (index < 10) firstSamples.push(sample);
      return kind === "bernoulli"
        ? (sample.filter((x) => x > 0).length / n - 0.1) / 0.3
        : mean(sample);
    });
    // Separate seed stream prevents display samples from changing the sampling experiment.
    const displayRandom = rng((seed + 1) >>> 0);
    return {
      means,
      firstSamples,
      population: Array.from({ length: 1000 }, () => draw(kind, displayRandom)),
      empiricalMean: mean(means),
      empiricalSD: Math.sqrt(variance(means)),
      theoreticalSE: 1 / Math.sqrt(n),
    };
  }
  const criticalCache = new Map();
  // Invert the tested direct survival probabilities instead of subtracting CDFs.
  function criticalForTail(tail, df = null) {
    const key = tail + ":" + df;
    if (criticalCache.has(key)) return criticalCache.get(key);
    const survival = (x) =>
      df === null ? S.zTails(x).upper : S.tTails(x, df).upper;
    let low = 0,
      high = 1;
    while (survival(high) > tail) high *= 2;
    for (let i = 0; i < 70; i++) {
      const middle = (low + high) / 2;
      if (survival(middle) > tail) low = middle;
      else high = middle;
    }
    const value = (low + high) / 2;
    if (criticalCache.size > 500)
      criticalCache.delete(criticalCache.keys().next().value);
    criticalCache.set(key, value);
    return value;
  }
  function confidenceInterval(sampleMean, sampleSD, n, level, method = "t") {
    finite(sampleMean);
    positive(sampleSD);
    integer(n, 2);
    rate(level);
    if (!["t", "z"].includes(method))
      throw new RangeError("Unknown interval method");
    const critical = criticalForTail(
      (1 - level) / 2,
      method === "t" ? n - 1 : null,
    );
    const se = sampleSD / Math.sqrt(n),
      margin = critical * se;
    return {
      low: sampleMean - margin,
      high: sampleMean + margin,
      margin,
      width: 2 * margin,
      se,
      critical,
    };
  }
  function coverage(mu, sigma, n, repetitions, level, method, seed) {
    finite(mu);
    positive(sigma);
    integer(n, 2, 500);
    integer(repetitions, 10, 2000);
    rate(level);
    const random = rng(seed);
    const intervals = Array.from({ length: repetitions }, () => {
      const sample = Array.from(
        { length: n },
        () => mu + sigma * gaussian(random),
      );
      const m = mean(sample),
        sd = method === "z" ? sigma : Math.sqrt(variance(sample));
      const interval = confidenceInterval(m, sd, n, level, method);
      return {
        ...interval,
        mean: m,
        sampleSD: Math.sqrt(variance(sample)),
        sample,
        covers: interval.low <= mu && interval.high >= mu,
      };
    });
    return {
      intervals,
      covered: intervals.filter((x) => x.covers).length,
      averageWidth: mean(intervals.map((x) => x.width)),
    };
  }
  function power(n, d, alpha, direction) {
    integer(n, 1);
    finite(d);
    rate(alpha);
    if (!["upper", "lower", "twoSided"].includes(direction))
      throw new RangeError("Unknown alternative");
    const critical = criticalForTail(
        alpha / (direction === "twoSided" ? 2 : 1),
      ),
      shift = d * Math.sqrt(n);
    const probability =
      direction === "upper"
        ? S.zTails(critical - shift).upper
        : direction === "lower"
          ? S.zTails(-critical - shift).lower
          : S.zTails(critical - shift).upper +
            S.zTails(-critical - shift).lower;
    return {
      critical,
      shift,
      power: Math.max(0, Math.min(1, probability)),
      nonRejection: Math.max(0, 1 - probability),
      beta:
        d !== 0 &&
        (direction === "twoSided" ||
          (direction === "upper" && d > 0) ||
          (direction === "lower" && d < 0))
          ? Math.max(0, 1 - probability)
          : null,
    };
  }
  function parsePairs(text, min = 2, max = 100) {
    const lines = text
      .trim()
      .split(/\n|;/)
      .filter((s) => s.trim());
    integer(lines.length, min, max);
    return lines.map((line) => {
      const parts = line.trim().split(/[\s,]+/);
      if (
        parts.length !== 2 ||
        parts.some(
          (v) =>
            v === "" ||
            !Number.isFinite(Number(v)) ||
            Math.abs(Number(v)) > 1e6,
        )
      )
        throw new RangeError(
          "Enter one numeric x, y pair per line. Each value must be between −1,000,000 and 1,000,000.",
        );
      return parts.map(Number);
    });
  }
  function parseGroups(text) {
    const lines = text
      .trim()
      .split(/\n/)
      .filter((line) => line.trim());
    integer(lines.length, 2, 20);
    return lines.map((line) => {
      if (line.split(",").some((field) => !field.trim()))
        throw new RangeError(
          "Every comma-separated field must contain a number; remove empty fields and trailing commas.",
        );
      const values = line
        .trim()
        .split(/[,\s]+/)
        .map(Number);
      integer(values.length, 2, 1000);
      if (values.some((x) => !Number.isFinite(x) || Math.abs(x) > 1e6))
        throw new RangeError(
          "Each group value must be a number between −1,000,000 and 1,000,000.",
        );
      return values;
    });
  }
  function regression(pairs) {
    integer(pairs.length, 3, 1000);
    const x = pairs.map((p) => finite(p[0])),
      y = pairs.map((p) => finite(p[1]));
    const mx = mean(x),
      my = mean(y),
      xx = x.reduce((s, v) => s + (v - mx) ** 2, 0),
      yy = y.reduce((s, v) => s + (v - my) ** 2, 0);
    if (xx === 0)
      return {
        defined: false,
        reason: "A slope is undefined when every x value is the same.",
      };
    const xy = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0),
      slope = xy / xx,
      intercept = my - slope * mx;
    const fitted = x.map((v) => intercept + slope * v),
      residuals = y.map((v, i) => v - fitted[i]),
      sse = residuals.reduce((s, v) => s + v * v, 0);
    return {
      defined: true,
      slope,
      intercept,
      fitted,
      residuals,
      sse,
      sst: yy,
      rSquared: yy === 0 ? null : Math.max(0, Math.min(1, 1 - sse / yy)),
      residualSD: Math.sqrt(sse / (x.length - 2)),
      df: x.length - 2,
    };
  }
  // Construct centred, orthogonal components with equal lengths, then mix them.
  // This fixes the displayed sample r; it is not a sample from a population with r.
  function correlationSample(n, r, seed) {
    integer(n, 3, 100);
    finite(r);
    if (Math.abs(r) > 1)
      throw new RangeError("Correlation must be from −1 to 1");
    const random = rng(seed);
    const x = Array.from({ length: n }, (_, i) => -2 + (4 * i) / (n - 1));
    const raw = x.map(() => gaussian(random));
    const centre = mean(raw);
    const xx = x.reduce((sum, v) => sum + v * v, 0);
    const projection =
      raw.reduce((sum, v, i) => sum + (v - centre) * x[i], 0) / xx;
    let orthogonal = raw.map((v, i) => v - centre - projection * x[i]);
    let length = Math.hypot(...orthogonal);
    if (length < 1e-10) {
      // The quadratic is non-constant and orthogonal to this symmetric x grid.
      const squares = x.map((v) => v * v),
        average = mean(squares);
      orthogonal = squares.map((v) => v - average);
      length = Math.hypot(...orthogonal);
    }
    const scale = Math.sqrt(xx) / length;
    return x.map((v, i) => [
      v,
      r * v + Math.sqrt(Math.max(0, 1 - r * r)) * orthogonal[i] * scale,
    ]);
  }
  // The two vectors are drawn in their own shared plane, preserving lengths/angle.
  // These coordinates are unrelated to the original scatterplot axes.
  function vectorGeometry(a, b) {
    const lengthX = S.norm(a),
      lengthY = S.norm(b);
    const cosine = S.cosine(a, b);
    return {
      x: a,
      y: b,
      lengthX,
      lengthY,
      dot: S.dot(a, b),
      cosine,
      angleDegrees:
        cosine === null ? null : (Math.acos(cosine) * 180) / Math.PI,
      tipX: cosine === null ? null : [lengthX, 0],
      tipY:
        cosine === null
          ? null
          : [
              lengthY * cosine,
              lengthY * Math.sqrt(Math.max(0, 1 - cosine * cosine)),
            ],
    };
  }
  function correlationGeometry(pairs) {
    integer(pairs.length, 3, 100);
    pairs.forEach((pair) => {
      if (!Array.isArray(pair) || pair.length !== 2)
        throw new RangeError("Expected x, y pairs");
      pair.forEach(finite);
    });
    const x = pairs.map((p) => p[0]),
      y = pairs.map((p) => p[1]);
    const a = S.center(x),
      b = S.center(y);
    const lx = S.norm(a),
      ly = S.norm(b);
    // Zero vectors cannot be given unit length. Keep zeros to expose the reason.
    const u = a.map((v) => (lx === 0 ? 0 : v / lx)),
      v = b.map((value) => (ly === 0 ? 0 : value / ly));
    return {
      meanX: mean(x),
      meanY: mean(y),
      raw: vectorGeometry(x, y),
      centred: vectorGeometry(a, b),
      unit: vectorGeometry(u, v),
    };
  }
  function regressionSample(n, slope, noise, seed) {
    integer(n, 3, 100);
    finite(slope);
    finite(noise);
    if (noise < 0) throw new RangeError("Noise SD cannot be negative");
    const random = rng(seed);
    return Array.from({ length: n }, (_, i) => {
      const x = -2 + (4 * i) / (n - 1);
      return [x, 1 + slope * x + noise * gaussian(random)];
    });
  }
  function anova(groups) {
    integer(groups.length, 2, 20);
    groups.forEach((g) => {
      integer(g.length, 2, 1000);
      g.forEach(finite);
    });
    const all = groups.flat(),
      grand = mean(all),
      means = groups.map(mean),
      between = groups.reduce(
        (s, g, i) => s + g.length * (means[i] - grand) ** 2,
        0,
      ),
      within = groups.reduce(
        (s, g, i) => s + g.reduce((t, x) => t + (x - means[i]) ** 2, 0),
        0,
      );
    const dfBetween = groups.length - 1,
      dfWithin = all.length - groups.length,
      total = between + within;
    if (within === 0)
      return {
        defined: false,
        reason:
          "The within-group variance is zero. Dividing by it cannot give a finite F statistic.",
        between,
        within,
        total,
        dfBetween,
        dfWithin,
        means,
      };
    const msBetween = between / dfBetween,
      msWithin = within / dfWithin,
      f = msBetween / msWithin;
    // F survival function as a direct incomplete beta, avoiding 1 − CDF cancellation.
    const p = jStat.ibeta(
      dfWithin / (dfWithin + dfBetween * f),
      dfWithin / 2,
      dfBetween / 2,
    );
    return {
      defined: true,
      between,
      within,
      total,
      dfBetween,
      dfWithin,
      msBetween,
      msWithin,
      f,
      p,
      means,
      grand,
      etaSquared: total === 0 ? null : between / total,
    };
  }
  function groupSample(n, separation, sd, seed) {
    integer(n, 2, 100);
    finite(separation);
    positive(sd);
    const random = rng(seed);
    return [-1, 0, 1].map((offset) =>
      Array.from(
        { length: n },
        () => offset * separation + sd * gaussian(random),
      ),
    );
  }
  function adjustPValues(values, method) {
    if (
      !values.length ||
      values.some((p) => !Number.isFinite(p) || p < 0 || p > 1)
    )
      throw new RangeError("Invalid p-values");
    const n = values.length,
      ordered = values.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p),
      result = Array(n);
    if (method === "none") return [...values];
    if (method === "bonferroni") return values.map((p) => Math.min(1, p * n));
    if (method === "holm") {
      let previous = 0;
      ordered.forEach(({ p, i }, rank) => {
        previous = Math.max(previous, Math.min(1, p * (n - rank)));
        result[i] = previous;
      });
    } else if (method === "bh") {
      let next = 1;
      for (let rank = n - 1; rank >= 0; rank--) {
        next = Math.min(next, (ordered[rank].p * n) / (rank + 1));
        result[ordered[rank].i] = next;
      }
    } else throw new RangeError("Unknown adjustment");
    return result;
  }
  function multipleComparisons(
    m,
    repetitions,
    alpha,
    method,
    seed,
    options = {},
  ) {
    integer(m, 1, 100);
    integer(repetitions, 10, 5000);
    rate(alpha);
    const signals = options.signals ?? 0,
      effect = options.effect ?? 0.8,
      sampleSize = options.sampleSize ?? 30;
    integer(signals, 0, m);
    finite(effect);
    integer(sampleSize, 2, 1000);
    const random = rng(seed);
    let families = 0,
      discoveries = 0,
      trueDiscoveries = 0,
      fdpSum = 0;
    const counts = [],
      trueCounts = [];
    let firstFamily;
    for (let i = 0; i < repetitions; i++) {
      const ps = Array.from({ length: m }, (_, j) =>
        j < signals
          ? S.zTails(gaussian(random) + effect * Math.sqrt(sampleSize)).twoSided
          : random(),
      );
      const adjusted = adjustPValues(ps, method);
      let falseCount = 0,
        trueCount = 0;
      adjusted.forEach((p, j) => {
        if (p <= alpha) {
          if (j < signals) trueCount++;
          else falseCount++;
        }
      });
      if (i === 0)
        firstFamily = ps.map((p, j) => ({
          p,
          adjusted: adjusted[j],
          isNull: j >= signals,
          rejected: adjusted[j] <= alpha,
        }));
      counts.push(falseCount);
      trueCounts.push(trueCount);
      if (falseCount) families++;
      discoveries += falseCount;
      trueDiscoveries += trueCount;
      const total = falseCount + trueCount;
      fdpSum += total ? falseCount / total : 0;
    }
    return {
      families,
      discoveries,
      trueDiscoveries,
      counts,
      trueCounts,
      firstFamily,
      signals,
      nulls: m - signals,
      empiricalFWER: families / repetitions,
      empiricalFDR: fdpSum / repetitions,
      empiricalPower: signals
        ? trueDiscoveries / (signals * repetitions)
        : null,
      unadjustedFWER: 1 - (1 - alpha) ** (m - signals),
    };
  }
  function histogram(values, bins = 25, density = false) {
    integer(bins, 1, 100);
    if (!values.length) throw new RangeError("Empty histogram data");
    values.forEach(finite);
    const min = Math.min(...values),
      max = Math.max(...values);
    if (
      max - min <=
      16 * Number.EPSILON * Math.max(1, Math.abs(min), Math.abs(max))
    ) {
      const x = mean(values),
        width = Math.max(0.1, Math.abs(x) * 0.1);
      return [
        {
          x,
          y: density ? 1 / width : values.length,
          xMin: x - width / 2,
          xMax: x + width / 2,
        },
      ];
    }
    const width = (max - min) / bins,
      start = min;
    const counts = Array(bins).fill(0);
    values.forEach(
      (v) =>
        counts[
          Math.min(bins - 1, Math.max(0, Math.floor((v - start) / width)))
        ]++,
    );
    return counts.map((count, i) => ({
      x: start + (i + 0.5) * width,
      y: density ? count / (values.length * width) : count,
      xMin: start + i * width,
      xMax: start + (i + 1) * width,
    }));
  }
  function bernoulliMass(values, n = 1) {
    integer(n, 1, 500);
    if (!values.length) throw new RangeError("Empty mass data");
    const counts = Array(n + 1).fill(0);
    for (const value of values) {
      finite(value);
      const k = Math.round(n * (0.1 + 0.3 * value));
      if (k < 0 || k > n || Math.abs(value - (k / n - 0.1) / 0.3) > 1e-10)
        throw new RangeError("Value is outside the binary sample-mean support");
      counts[k]++;
    }
    return counts.map((count, k) => ({
      x: (k / n - 0.1) / 0.3,
      y: count / values.length,
      k,
    }));
  }
  return {
    mean,
    variance,
    rng,
    gaussian,
    draw,
    clt,
    confidenceInterval,
    coverage,
    power,
    parsePairs,
    parseGroups,
    regression,
    regressionSample,
    correlationSample,
    correlationGeometry,
    anova,
    groupSample,
    adjustPValues,
    multipleComparisons,
    histogram,
    bernoulliMass,
  };
});
