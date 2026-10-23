/* Small, pure calculations used by the guided experiments. */
(function(root, factory) {
  if (typeof module === "object" && module.exports)
    module.exports = factory(require("./statistics.js"), require("./teaching-statistics.js"));
  else root.LearningMath = factory(root.StatsMath, root.TeachingMath);
})(typeof globalThis !== "undefined" ? globalThis : this, function(S, T) {
  "use strict";
  function binomialSelection(n, p, k) {
    const approximation = S.binomialApproximation(n, p), { mean, sd } = approximation;
    let normalArea = null;
    if (sd > 0) {
      const low = (k - 0.5 - mean) / sd, high = (k + 0.5 - mean) / sd;
      normalArea = low >= 0
        ? S.zTails(low).upper - S.zTails(high).upper
        : S.zTails(high).lower - S.zTails(low).lower;
      normalArea = Math.max(0, Math.min(1, normalArea));
    }
    const arrangements = [];
    if (n <= 6) for (let mask = 0; mask < 2 ** n; mask++) {
      const pattern = Array.from({length:n}, (_, i) => mask & (1 << i) ? "S" : "F");
      if (pattern.filter(x => x === "S").length === k) arrangements.push(pattern.join(""));
    }
    return { k, coefficient: n <= 30 ? S.combinations(n,k) : null,
      term: p ** k * (1-p) ** (n-k), exact: S.binomialPMF(n,p,k),
      normalArea, arrangements, ...approximation };
  }
  function candidateLine(pairs, intercept, slope) {
    const residuals = pairs.map(([x,y]) => y - (intercept + slope*x));
    return { residuals, sse: residuals.reduce((sum, v) => sum + v*v, 0) };
  }
  function anovaObservation(groups, groupIndex, observationIndex) {
    const result = T.anova(groups), group = groups[groupIndex];
    const grand = T.mean(groups.flat()), groupMean = T.mean(group);
    const observed = group[observationIndex];
    return { observed, grand, groupMean, n:group.length,
      within: observed-groupMean, between:groupMean-grand,
      withinSquare:(observed-groupMean)**2,
      groupBetweenSquare:group.length*(groupMean-grand)**2, result };
  }
  function tMechanism(df, seed, repetitions = 100) {
    const random = T.rng(seed), n = df + 1;
    return Array.from({length:repetitions}, () => {
      const sample = Array.from({length:n}, () => T.gaussian(random));
      const mean = T.mean(sample), sd = Math.sqrt(T.variance(sample));
      return { sample, mean, sd, n, z:mean*Math.sqrt(n), t:mean/(sd/Math.sqrt(n)) };
    });
  }
  function sampleSequence(n, count, kind, seed) {
    const random = T.rng(seed);
    return Array.from({length:count}, () => {
      const sample = Array.from({length:n}, () => T.draw(kind, random));
      return { sample, mean:T.mean(sample) };
    });
  }
  return { binomialSelection, candidateLine, anovaObservation, tMechanism, sampleSequence };
});
