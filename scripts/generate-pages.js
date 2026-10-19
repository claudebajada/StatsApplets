// Optional authoring helper. Generated HTML is committed; production needs no build.
const fs = require("node:fs");
const catalogue = require("../javascript/catalogue.js");
const math = require("./mathml.js");
const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const range = (id, label, min, max, step, value) =>
  `<div class="control-field"><label for="${id}">${label}: <output id="${{ "df-slider": "df-value", "df1-slider": "df1-value", "df2-slider": "df2-value" }[id] || id + "-value"}" for="${id}">${value}</output></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
const select = (id, label, options, value) =>
  `<div class="control-field"><label for="${id}">${label}</label><select id="${id}">${options.map(([key, text]) => `<option value="${key}"${key === value ? " selected" : ""}>${text}</option>`).join("")}</select></div>`;
const text = (id, label, value) =>
  `<div class="control-field wide"><label for="${id}">${label}</label><textarea id="${id}" rows="6" maxlength="12000" spellcheck="false">${escape(value)}</textarea></div>`;
const seed =
  '<div class="control-field"><label for="seed">Random seed</label><input type="number" id="seed" min="0" max="2147483647" step="1" value="42"></div>';
const directions = [
  ["upper", "greater than"],
  ["lower", "less than"],
  ["twoSided", "different from"],
];
const captions = {
  meanEstimateChart:
    "The circle is the sample estimate; the diamond is the value claimed by the null hypothesis. The horizontal bar extends one standard error either side of the estimate. Read the horizontal axis in the original measurement units. This bar is not a confidence interval.",
  zChart:
    "Imagine repeating the study when the null hypothesis is true. This curve shows the distribution of the resulting z scores, not the distribution of individual measurements. The vertical line marks your z score. The shaded area is the p-value for your chosen alternative.",
  tChart:
    "Imagine repeating the study when the null hypothesis is true. This curve shows the distribution of the resulting t scores, not the distribution of individual measurements. The vertical line marks your t score. The shaded area is the p-value for your chosen alternative.",
  pairsChart:
    "Each dot is one observation with an x value and a y value. An upward pattern gives positive r; a downward pattern gives negative r. A tighter straight-line pattern puts r closer to +1 or −1.",
  binomialChart:
    "Each bar is the exact probability of a whole-number count of successes. All bar probabilities add to 1.",
  normalChart:
    "This smooth curve approximates the binomial probabilities. Probabilities are areas under the curve; a curve height is not a probability.",
  coeffChart:
    "For each possible count k, the bar counts the arrangements of successes and failures. These counts are not probabilities.",
  probTermChart:
    "Each bar gives the probability of one particular arrangement with k successes. It does not yet account for all the different arrangements.",
  fullDistChart:
    "Multiply each arrangement count by its probability. The resulting bars give the exact probability of each possible count of successes.",
  frequencyChart:
    "Compare the observed count in each category with the count predicted by a uniform null model. Both sets of counts add to the selected N.",
  chiSquaredChart:
    "Under the null model, repeated studies produce these χ² statistics approximately. The line marks this example’s statistic; the shaded area is the chance of a value at least as large under the null.",
  distributionChart:
    "The horizontal axis gives a possible value of the random variable. Probability is area under a density curve, not its height.",
  populationChart:
    "These bars summarise individual values drawn from the selected population. Compare their shape with the distribution of sample means in the next plot.",
  meansChart:
    "Each sample contributes one mean to these bars. The normal curve has the theoretical mean and standard error of the sample mean; it is a comparison, not a fitted curve.",
  intervalChart:
    "Each horizontal segment is a confidence interval from a different sample. The vertical reference line is the fixed population mean. Dashed, triangle-marked intervals miss that mean.",
  widthChart:
    "These bars count the widths of the simulated intervals. Wider intervals express less precise estimates.",
  powerChart:
    "The null curve describes z scores when the null is true. The other curve describes z scores for the chosen true effect. The shaded area under the latter is power: the chance of rejecting the null for that effect.",
  powerCurveChart:
    "Each point gives the chance of rejecting the null at that sample size, holding the true effect, significance level and alternative fixed.",
  fitChart:
    "Each dot is one x, y observation. The fitted line predicts y from x. Vertical segments are residuals: observed y minus predicted y.",
  residualChart:
    "Each dot shows one fitted value and its residual. The horizontal zero line separates over-predictions from under-predictions.",
  groupsChart:
    "Dots show individual observations in each group; the separate mean markers summarise those groups. Compare separation between groups with variation inside groups.",
  anovaChart:
    "This curve describes F statistics from repeated studies with equal population means. The vertical line is the observed F; the shaded upper tail is its p-value.",
  familyChart:
    "Compare the theoretical chance of at least one false rejection without adjustment with the simulated proportion for your chosen procedure. The vertical axis is a probability, not a number of tests.",
  discoveryChart:
    "Each bar counts simulated families with that many false rejections. Every null hypothesis is true in this simulation, so every rejection is a false positive.",
};
const symbolKeys = {
  "binomial-normal-explorer":
    "n is the number of trials; p is the success probability. μ and σ² are the mean and variance of the binomial count.",
  "binomial-components-explorer":
    "k is a count of successes out of n trials. The bracketed coefficient counts arrangements; p is the success probability on each trial.",
  "t-distribution-explorer":
    "x̄ is a sample mean; μ₀ is the null mean; s is the sample SD; n is the sample size. A one-sample t statistic has n − 1 degrees of freedom.",
  "f-distribution-explorer":
    "U and V are independent chi-squared variables, with df₁ and df₂ degrees of freedom. F is the ratio after dividing each by its own degrees of freedom.",
  "chi-squared-explorer":
    "Oᵢ is the observed count in category i; Eᵢ is its expected count under the null. Add the contributions across all categories.",
  "clt-explorer":
    "x̄ is the mean of n observations. σ is the population SD; SE is the standard deviation of sample means across repeated samples.",
  "confidence-interval-explorer":
    "x̄ is the sample mean. The t procedure uses SE = s/√n and a t critical value with n − 1 degrees of freedom. The z procedure uses known σ/√n and a normal critical value.",
  "power-explorer":
    "H₀ is the null hypothesis. μ₁ is the specified true population mean. Power is the chance of rejecting H₀ when this true mean applies.",
  "regression-explorer":
    "ŷ is the predicted y value; b₀ is the fitted intercept; b₁ is the fitted slope. Each residual is the observed y minus ŷ.",
  "anova-explorer":
    "SS measures sums of squared deviations; k is the number of groups and N is the total sample size. Divide each SS by its degrees of freedom to form the two mean squares.",
  "multiple-comparisons-explorer":
    "For m independent tests of true null hypotheses, each at significance level α, FWER is the chance of at least one false rejection without adjustment.",
};
const chart = (id, title, caption = captions[id]) => {
  if (!caption) throw Error("Missing chart explanation: " + id);
  return `<figure class="chart-container"><h2 class="chart-title">${title}</h2><p class="chart-explanation" id="${id}-explanation">${caption}</p><div class="plot-frame"><canvas id="${id}" class="chart-canvas" role="img" aria-label="${title}"></canvas></div></figure>`;
};
const metric = (label, id) =>
  `<div class="metric"><span>${label}</span><strong id="${id}">—</strong></div>`;
const pages = {};
for (const id of [
  "one-sample-z-test",
  "one-sample-t-test",
  "independent-samples-t-test",
]) {
  const independent = id.startsWith("independent"),
    z = id.includes("z-test");
  pages[id] = {
    controls:
      (independent
        ? range("mu1", "Sample 1 mean x̄₁", -10, 10, 0.1, 0) +
          range("mu2", "Sample 2 mean x̄₂", -10, 10, 0.1, 0)
        : range("mu", "Sample mean x̄", -10, 10, 0.1, 0) +
          range("mu0", "Null population mean μ₀", -10, 10, 0.1, 0)) +
      range(
        "sigma",
        z
          ? "Known population SD σ"
          : independent
            ? "Common sample SD s₁ = s₂ = s"
            : "Sample SD s",
        0.1,
        5,
        0.1,
        1,
      ) +
      (independent
        ? range("N1", "Sample size n₁", 5, 100, 1, 30) +
          range("N2", "Sample size n₂", 5, 100, 1, 30)
        : range("N", "Sample size n", 5, 100, 1, 30)) +
      select(
        "alternative",
        independent ? "H₁: μ₁ − μ₂ is … 0" : "H₁: μ is … μ₀",
        directions,
        "upper",
      ),
    metrics:
      metric("Selected p-value", "p-value-selected") +
      metric(z ? "z score" : "t score", z ? "z-value" : "t-value") +
      metric(
        z ? "Standard error (SE)" : "Estimated standard error (SE)",
        "se-value",
      ),
    extraResults: `<details class="info"><summary>Effect size and other tail probabilities</summary><div class="metrics">${
      metric(
        z ? "Signed standardised difference (σ)" : "Signed Cohen’s d",
        "cohen-d-value",
      ) +
      (z ? "" : metric("Degrees of freedom", "df-value")) +
      metric("Lower-tail p", "p-value-lower") +
      metric(
        "Upper-tail p",
        independent ? "one-tailed-p-value" : "p-value-one-sided",
      ) +
      metric(
        "Two-sided p",
        independent ? "two-tailed-p-value" : "p-value-two-sided",
      )
    }</div><p>The selected p-value above corresponds to your alternative hypothesis. These other probabilities answer different directional questions. The signed effect size divides the observed difference by ${z ? "the known population SD" : "the sample SD"}; its sign follows the order of subtraction.</p></details>`,
    charts:
      chart(
        "meanEstimateChart",
        "1 · Compare the sample estimate with the null value",
      ) +
      chart(
        z ? "zChart" : "tChart",
        "2 · Read the p-value under the null hypothesis",
      ),
    symbolKey: z
      ? "x̄ is your sample mean; μ₀ is the null population mean; σ is the known population SD; n is the sample size. The denominator is the standard error (SE)."
      : independent
        ? "x̄₁ and x̄₂ are sample means; sₚ is the pooled sample SD; n₁ and n₂ are the sample sizes. The denominator estimates the standard error of the mean difference."
        : "x̄ is your sample mean; μ₀ is the null population mean; s is the sample SD; n is the sample size. The denominator estimates the standard error (SE).",
    method: z
      ? "Independent observations and a normal sampling distribution of the mean are assumed. The standard error σ/√n describes how sample means vary across repeated studies. The z score expresses the observed difference from μ₀ in standard-error units. Choose the alternative before looking at the data."
      : independent
        ? "This is the pooled equal-variance test with s₁ = s₂ = s, so sₚ = s. Degrees of freedom are n₁ + n₂ − 2. Groups and observations must be independent; exact inference assumes normal populations with equal variances. The first chart displays the observed mean difference and its estimated standard error. The second chart is the null reference distribution of t scores."
        : "The sliders specify sample statistics. Exact t inference assumes independent normal observations and uses n − 1 degrees of freedom. Small samples are sensitive to skewness and outliers. The first chart displays your sample mean and its estimated standard error. The second chart is the null reference distribution of t scores. Choose the alternative before looking at the data.",
    scripts: ["mean-test-explorer", id],
  };
}
pages["binomial-normal-explorer"] = {
  controls:
    range("theta", "Success probability p", 0, 1, 0.01, 0.5) +
    range("N", "Number of trials n", 0, 30, 1, 15),
  metrics:
    metric("Population mean μ = np", "mu-value") +
    metric("Population SD σ", "sigma-value"),
  charts:
    chart("binomialChart", "Exact binomial probabilities") +
    chart("normalChart", "Normal approximation: probability density"),
  notice: "approximation-warning",
  method:
    "Binomial bars are point probabilities; the normal curve is a density. Approximate P(X = k) by the normal area from k − 0.5 to k + 0.5 (continuity correction), not by the curve height. Trials must be independent with a common success probability. The rule np ≥ 5 and n(1 − p) ≥ 5 is a rough approximation check, not a guarantee.",
  scripts: ["binomial-normal-explorer"],
};
pages["binomial-components-explorer"] = {
  controls:
    range("p", "Success probability p", 0, 1, 0.01, 0.5) +
    range("n", "Number of trials n", 1, 30, 1, 10),
  metrics: "",
  charts:
    chart("coeffChart", "1 · Number of arrangements C(n,k)") +
    chart("probTermChart", "2 · Probability of each arrangement") +
    chart("fullDistChart", "3 · Product: binomial probabilities"),
  method:
    "The coefficient counts how many arrangements give k successes. The probability factor pᵏ(1 − p)ⁿ⁻ᵏ gives the probability of each arrangement. Their product is P(X = k); only this final distribution must sum to 1. The first two panels are factors, not probability distributions.",
  scripts: ["binomial-components-explorer"],
};
pages["chi-squared-explorer"] = {
  controls:
    range("categories", "Number of categories k", 2, 10, 1, 5) +
    range("total-observations", "Total observations N", 10, 1000, 10, 100) +
    range("skew", "Departure in count weights", 0, 10, 0.1, 5),
  metrics:
    metric("Effect size (Cohen's w)", "effect-size-value") +
    metric("χ² statistic", "chi-squared-value") +
    metric("Upper-tail p", "p-value"),
  charts:
    chart(
      "frequencyChart",
      "Observed integer counts & uniform expected counts",
    ) + chart("chiSquaredChart", "Null χ² sampling distribution"),
  notice: "validity-warning",
  method:
    "The null category probabilities are uniform; no parameters are estimated from the data, so df = k − 1. Counts are deterministic teaching examples, allocated by clipping weights, normalising and assigning largest remainders. They are not simulated random samples. When N is not divisible by k, a perfectly uniform integer allocation is impossible. Cohen’s w = √(χ²/N) measures departure from the null probabilities and need not be ≤ 1. This goodness-of-fit test is upper-tailed: large non-negative χ² values indicate any departure.",
  scripts: ["chi-squared-explorer"],
};
pages["t-distribution-explorer"] = {
  controls: range("df-slider", "Degrees of freedom", 1, 100, 1, 1),
  metrics: "",
  charts: chart(
    "distributionChart",
    "Standard normal & Student’s t densities",
    "Both curves describe possible standardised scores. Compare their tail areas: a t curve assigns more probability to extreme scores at small degrees of freedom. As df increases, it approaches the normal reference.",
  ),
  method:
    "Both curves are probability densities centred at zero; neither is an observed sample histogram. The t curve is the null reference for (x̄ − μ₀)/(s/√n) under independent normal sampling. The plotted range is finite; t with df = 1 has no finite mean or variance. With df = 2 its variance is also not finite.",
  scripts: ["t-distribution-explorer"],
};
pages["f-distribution-explorer"] = {
  controls:
    range("df1-slider", "Numerator df₁", 1, 100, 1, 1) +
    range("df2-slider", "Denominator df₂", 1, 100, 1, 1) +
    '<div class="control-field"><label><input type="checkbox" id="log-axis"> Logarithmic F axis</label></div>',
  metrics: metric("Upper 5% critical F", "critical-value"),
  charts: chart(
    "distributionChart",
    "Null F density & rejection region",
    "The curve shows possible F values under the null hypothesis. The dashed line is the upper 5% critical value, not an observed statistic. Values to its right form the rejection region; the plot extends far enough to show that threshold.",
  ),
  notice: "plot-note",
  method:
    "F is non-negative and extends to infinity. Large F values reject an upper-tail variance-ratio or ANOVA null. For df₁ < 2 its density diverges at zero, so that endpoint is omitted from the curve. Shading is truncated at the plot edge, while critical values refer to the full distribution. A log axis changes spacing, not the probabilities.",
  scripts: ["f-distribution-explorer"],
};
pages.correlation = {
  controls:
    range("association", "Linear association r", -1, 1, 0.05, 0.6) +
    range("observations", "Number of observations", 3, 30, 1, 12) +
    `<details class="wide input-details"><summary>Use your own paired observations</summary><p>Choose manual data, then enter one x, y pair per line. The sliders apply only to constructed examples.</p>${select(
      "dataMode",
      "Data source",
      [
        ["generated", "Constructed example"],
        ["manual", "My paired observations"],
      ],
      "generated",
    )}${text("pairs", "x, y pairs", "1,1\n2,3\n3,2")}${seed}</details>`,
  metrics:
    metric("Pearson correlation r", "data-pearson-value") +
    metric("Observations", "pair-count"),
  charts: chart(
    "pairsChart",
    "Look for the direction and closeness of a straight-line pattern",
  ),
  after: require("./correlation-walkthrough.js")(math),
  symbolKey:
    "r measures the direction and strength of a straight-line association. It has no units. It is undefined if either variable has no variation.",
  method:
    "The slider constructs a set of points with the selected Pearson r; it does not simulate a population correlation or a hypothesis test. New pattern rearranges the constructed points while keeping r fixed. Manual input calculates r from your own paired observations. A value of zero means no linear association, but other relationships can still exist. Outliers can strongly affect r, and correlation does not imply causation.",
  scripts: ["correlation-walkthrough", "correlation"],
};
pages["clt-explorer"] = {
  controls:
    select(
      "population",
      "Standardised population",
      [
        ["normal", "Normal"],
        ["uniform", "Uniform"],
        ["exponential", "Right-skewed exponential"],
        ["bernoulli", "Rare binary event (p = 0.1)"],
      ],
      "exponential",
    ) +
    range("sampleSize", "Observations per sample n", 1, 100, 1, 10) +
    range("repetitions", "Repeated samples", 100, 2000, 100, 1000) +
    seed,
  metrics: "",
  charts:
    chart(
      "populationChart",
      "Empirical population sample: individual observations",
    ) + chart("meansChart", "Empirical sampling distribution of x̄"),
  method:
    "All four populations are standardised to μ = 0 and σ = 1. Sampling is independent and with replacement. Bars are empirical densities, not the exact population densities; the mean histogram uses repeated independent samples. The normal overlay is N(0, 1/n). Each population has finite variance, as required by the classical CLT. Repeated simulations have Monte Carlo variation; a seed makes the current example reproducible.",
  scripts: ["extensions"],
};
pages["confidence-interval-explorer"] = {
  controls:
    range("populationMean", "Fixed population mean μ", -5, 5, 0.1, 0) +
    range("populationSD", "Population SD σ", 0.1, 3, 0.1, 1) +
    range("sampleSize", "Sample size n", 2, 100, 1, 20) +
    range("repetitions", "Repeated intervals", 100, 1000, 100, 500) +
    range("level", "Nominal coverage", 0.8, 0.99, 0.01, 0.95) +
    select(
      "method",
      "Interval procedure",
      [
        ["t", "t interval (estimate s)"],
        ["z", "z interval (known σ)"],
      ],
      "t",
    ) +
    seed,
  metrics: "",
  charts:
    chart("intervalChart", "Repeated intervals around a fixed μ") +
    chart("widthChart", "Empirical distribution of interval widths"),
  method:
    "Independent samples come from a normal population. The t procedure estimates s separately for each sample and uses df = n − 1; the z procedure uses known σ. The population mean stays fixed. The chart displays the first 80 intervals, whereas coverage and mean width use every simulated interval. Circle-marked solid intervals cover μ; triangle-marked dashed intervals miss it. The procedure’s long-run coverage is a property of repeated sampling, not a posterior probability that μ lies inside one realised interval.",
  scripts: ["extensions"],
};
pages["power-explorer"] = {
  controls:
    range("sampleSize", "Sample size n", 2, 300, 1, 30) +
    range("effect", "True signed standardised effect d", -2, 2, 0.05, 0.5) +
    range("alpha", "Significance level α", 0.01, 0.2, 0.01, 0.05) +
    select("alternative", "H₁: μ is … μ₀", directions, "twoSided"),
  metrics: "",
  charts:
    chart("powerChart", "Null & specified alternative sampling densities") +
    chart("powerCurveChart", "Power as sample size changes"),
  method:
    "This explorer uses an exact one-sample z test with known population σ and independent normal observations. d = (μ − μ₀)/σ is the specified population effect, not an estimated sample effect. The sampling SD of Z is 1; its mean under the specified alternative is d√n. Rejection regions are determined under H₀ before power is calculated under H₁. These calculations are not t-test power; a directional alternative can have power below α when the true effect points the other way.",
  scripts: ["extensions"],
};
pages["regression-explorer"] = {
  controls:
    select(
      "dataMode",
      "Data source",
      [
        ["generated", "Seeded illustrative data"],
        ["manual", "Use the pairs below"],
      ],
      "generated",
    ) +
    range("sampleSize", "Generated observations n", 3, 100, 1, 30) +
    range("slope", "Generating population slope", -3, 3, 0.1, 1) +
    range("noise", "Generating noise SD", 0, 3, 0.1, 1) +
    seed +
    text(
      "pairs",
      "Manual x, y pairs: one pair per line",
      "1,1\n2,3\n3,2\n4,5\n5,4",
    ),
  metrics: "",
  charts:
    chart("fitChart", "Observations, least-squares line & residual segments") +
    chart("residualChart", "Residuals against fitted values"),
  method:
    "Generated data use fixed x values, population intercept 1 and independent normal errors with the chosen SD. The fitted line estimates intercept and slope from the displayed sample. Least squares minimises the sum of squared vertical residuals. R² uses a model with an intercept and is undefined for constant y. Slope is undefined for constant x. Descriptive fitting itself needs no normality assumption; the familiar normal-theory inference would require additional assumptions. Generating controls have no effect when manual data are selected.",
  scripts: ["extensions"],
};
pages["anova-explorer"] = {
  controls:
    select(
      "dataMode",
      "Data source",
      [
        ["generated", "Seeded three-group samples"],
        ["manual", "Use the groups below"],
      ],
      "generated",
    ) +
    range("sampleSize", "Generated sample size per group", 2, 100, 1, 20) +
    range("separation", "Spacing between population means", 0, 3, 0.1, 1) +
    range("withinSD", "Common population SD", 0.1, 3, 0.1, 1) +
    seed +
    text(
      "groups",
      "Manual groups: one line per group, values separated by commas",
      "1,2,3\n2,3,4\n4,5,6",
    ),
  metrics: "",
  charts:
    chart("groupsChart", "Individual observations & sample group means") +
    chart("anovaChart", "Null F density & observed F"),
  method:
    "Generated groups have population means −spacing, 0 and +spacing, a common population SD, and independent normal observations. ANOVA partitions the observed total sum of squares into between-group and within-group parts. Its exact F reference assumes independent observations, normally distributed errors and equal population variances. A zero population spacing need not give an observed F of zero. A significant omnibus F does not identify particular pairs. Manual input supports unequal group sizes; at least two observations per group are required.",
  scripts: ["extensions"],
};
pages["multiple-comparisons-explorer"] = {
  controls:
    range("tests", "Independent tests per family m", 1, 100, 1, 20) +
    range("repetitions", "Simulated families", 100, 2000, 100, 1000) +
    range("alpha", "Error-rate threshold α", 0.01, 0.2, 0.01, 0.05) +
    select(
      "correction",
      "Adjustment",
      [
        ["none", "None"],
        ["bonferroni", "Bonferroni (FWER)"],
        ["holm", "Holm (FWER)"],
        ["bh", "Benjamini–Hochberg (FDR)"],
      ],
      "none",
    ) +
    seed,
  metrics: "",
  charts:
    chart("familyChart", "Families with at least one false discovery") +
    chart("discoveryChart", "False discoveries in each simulated family"),
  method:
    "Every null hypothesis is true. Each test is represented by an independent Uniform(0,1) p-value, which is exact for a continuous correctly calibrated null test. The unadjusted theoretical FWER is 1 − (1 − α)ᵐ. Bonferroni and Holm control FWER without requiring independent tests. BH controls FDR under independence or suitable positive dependence; arbitrary dependence is outside this simulation. Because every discovery here is false, FDR equals FWER in this all-null experiment. This does not demonstrate the mixed-null power trade-off.",
  scripts: ["extensions"],
};
async function generate() {
  for (const meta of catalogue) {
    const p = pages[meta.id];
    if (!p) throw Error("Missing page " + meta.id);
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description" content="${escape(meta.objective)}"><title>${escape(meta.title)} · StatsApplets</title><link rel="stylesheet" href="../css/styles.css"><script src="../lib/chart.min.js"></script><script src="../lib/jstat.min.js"></script></head>
<body class="applet" data-applet="${meta.id}"><a class="skip-link" href="#main">Skip to applet</a><nav class="site-nav" aria-label="Main navigation"><a href="../index.html" class="brand">Stats<span>Applets</span></a><a href="../index.html">All explorers</a></nav>
<main id="main"><header class="page-header"><p class="eyebrow">${meta.group}</p><h1>${meta.title}</h1><p class="lede">${meta.objective}</p><div class="equation">${math.equation(meta.id, meta.equation)}</div><p class="symbol-key">${p.symbolKey || symbolKeys[meta.id]}</p></header>
<div id="scenario-toolbar"></div><section class="controls-panel" id="controls" aria-label="Parameters">${p.controls}</section>
<section class="result-card" aria-label="Current results"><div class="metrics">${p.metrics}</div><p id="calculation" aria-live="polite"></p><p id="input-warning" class="notice" role="status" hidden></p>${p.notice ? `<p id="${p.notice}" class="notice" role="status"></p>` : ""}${p.extraResults || ""}</section>
<section class="container" aria-label="Interactive plots">${p.charts}</section>${p.after || ""}<details class="info"><summary>Model, assumptions & interpretation</summary><p>${p.method}</p></details>
</main><footer>Explore, compare and learn. <a href="https://github.com/claudebajada/StatsApplets">Source & documentation</a></footer>
<script src="../javascript/statistics.js"></script><script src="../javascript/teaching-statistics.js"></script><script src="../javascript/catalogue.js"></script><script src="../javascript/state.js"></script><script src="../javascript/common.js"></script><script src="../javascript/shell.js"></script>${p.scripts.map((s) => `<script src="../javascript/${s}.js"></script>`).join("")}
</body></html>\n`;
    const formatted = await require("prettier").format(html, {
      parser: "html",
    });
    if (process.argv.includes("--check"))
      require("node:assert/strict").equal(
        fs.readFileSync(`html/${meta.id}.html`, "utf8"),
        formatted,
        meta.id + " needs regeneration",
      );
    else fs.writeFileSync(`html/${meta.id}.html`, formatted);
  }
  console.log(
    "Wrote " +
      catalogue.length +
      " static pages. No production build is needed.",
  );
}
generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
