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
    "The circle is the sample estimate. The diamond is the null value. The horizontal bar extends one standard error on either side of the estimate. The axis uses the original measurement units. The bar shows one standard error, which is narrower than a 95% confidence interval.",
  zChart:
    "Imagine repeating the study when the null hypothesis is true. This curve shows the distribution of the resulting z scores, not the distribution of individual measurements. The vertical line marks your z score. The shaded area is the p-value for your chosen alternative.",
  tChart:
    "Imagine repeating the study when the null hypothesis is true. This curve shows the distribution of the resulting t scores, not the distribution of individual measurements. The vertical line marks your t score. The shaded area is the p-value for your chosen alternative.",
  pairsChart:
    "Each dot is one observation with an x value and a y value. An upward linear pattern gives positive r. A downward linear pattern gives negative r. Points closer to a straight line give r closer to +1 or −1.",
  binomialChart:
    "Each bar is the exact probability of a whole-number count of successes. All bar probabilities add to 1.",
  normalChart:
    "Areas under this normal curve approximate binomial probabilities. To approximate the probability of k successes, take the area between k − 0.5 and k + 0.5.",
  coeffChart:
    "For each possible count k, the bar counts the arrangements of successes and failures. These counts are not probabilities.",
  probTermChart:
    "Each bar gives the probability of one particular arrangement with k successes. It does not yet account for all the different arrangements.",
  fullDistChart:
    "Multiply each arrangement count by its probability. The resulting bars give the exact probability of each possible count of successes.",
  frequencyChart:
    "Compare the observed count in each category with the count predicted by a uniform null model. Both sets of counts add to the selected N.",
  chiSquaredChart:
    "This curve approximates the distribution of χ² from repeated studies under the null model. The line marks this example's statistic. The shaded area is the probability of a value at least as large when the null is true.",
  distributionChart:
    "The horizontal axis gives possible values of the random variable. The area under the curve between two values gives the probability of falling between them.",
  populationChart:
    "These bars summarise individual values drawn from the selected population. Compare their shape with the distribution of sample means in the next plot.",
  meansChart:
    "Each sample contributes one mean to these bars. The comparison curve is a normal distribution with the theoretical mean and standard error. Its parameters come from the population and sample size.",
  intervalChart:
    "Each horizontal segment is a confidence interval from a different sample. The vertical reference line is the fixed population mean. Dashed, triangle-marked intervals miss that mean.",
  widthChart:
    "These bars count the widths of the simulated intervals. Wider intervals express less precise estimates.",
  powerChart:
    "The null curve describes z scores when the null is true. The other curve describes z scores for the chosen true effect. The shaded area under that second curve is power. It is the probability of rejecting the null for that effect.",
  powerCurveChart:
    "Each point gives the chance of rejecting the null at that sample size, holding the true effect, significance level and alternative fixed.",
  fitChart:
    "Each dot is one x, y observation. The fitted line predicts y from x. Each vertical segment shows a residual, the observed y minus the predicted y.",
  residualChart:
    "Each dot shows one fitted value and its residual. The horizontal zero line separates over-predictions from under-predictions.",
  groupsChart:
    "Dots show individual observations in each group. Squares mark the sample means. Compare the separation between means with the variation within groups.",
  anovaChart:
    "This curve describes F statistics from repeated studies with equal population means. The vertical line marks the observed F. The shaded upper tail is its p-value.",
  familyChart:
    "The first bar gives the calculated probability of at least one false rejection without adjustment. The second gives the proportion of simulated families with a false rejection under your chosen method. The vertical axis runs from 0 to 1.",
  discoveryChart:
    "Each bar counts simulated families with that many false rejections. Every null hypothesis is true in this simulation, so every rejection is a false positive.",
};
const symbolKeys = {
  "binomial-normal-explorer":
    "n is the number of trials. p is the success probability on each trial. μ and σ² are the mean and variance of the count of successes.",
  "binomial-components-explorer":
    "k is the count of successes in n trials. The bracketed coefficient counts arrangements. p is the success probability on each trial.",
  "t-distribution-explorer":
    "x̄ is the sample mean and μ₀ is the null mean. s is the sample standard deviation and n is the sample size. The one-sample t statistic has n − 1 degrees of freedom.",
  "f-distribution-explorer":
    "U and V are independent chi-squared variables, with df₁ and df₂ degrees of freedom. F is the ratio after dividing each by its own degrees of freedom.",
  "chi-squared-explorer":
    "Oᵢ is the observed count in category i; Eᵢ is its expected count under the null. Add the contributions across all categories.",
  "clt-explorer":
    "x̄ is the mean of n observations. σ is the population standard deviation. The standard error, or SE, is the standard deviation of sample means across repeated samples.",
  "confidence-interval-explorer":
    "x̄ is the sample mean and SE is its standard error. The t interval uses the sample standard deviation s and a t critical value with n − 1 degrees of freedom. The z interval uses the known population standard deviation σ and a normal critical value.",
  "power-explorer":
    "H₀ is the null hypothesis. d is the true difference between the population mean and the null mean, divided by the population standard deviation. Power is the probability of rejecting H₀ for that effect.",
  "regression-explorer":
    "ŷ is the predicted y value. b₀ is the fitted intercept and b₁ is the fitted slope. Each residual is the observed y minus ŷ.",
  "anova-explorer":
    "SS means sum of squares. k is the number of groups and N is the total sample size. Divide each sum of squares by its degrees of freedom to get a mean square. F is the between-group mean square divided by the within-group mean square.",
  "multiple-comparisons-explorer":
    "For m independent tests of true null hypotheses, each at significance level α, FWER is the chance of at least one false rejection without adjustment.",
};
const chart = (id, title, caption = captions[id]) => {
  if (!caption) throw Error("Missing chart explanation: " + id);
  return `<figure class="chart-container"><h2 class="chart-title">${title}</h2><p class="chart-explanation" id="${id}-explanation">${caption}</p><div class="plot-frame"><canvas id="${id}" class="chart-canvas" role="img" aria-label="${title}"></canvas></div></figure>`;
};
const metric = (label, id) =>
  `<div class="metric"><span>${label}</span><strong id="${id}">...</strong></div>`;
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
        z ? "Standard error, SE" : "Estimated standard error, SE",
        "se-value",
      ),
    extraResults: `<details class="info"><summary>Effect size and other tail probabilities</summary><div class="metrics">${
      metric(
        z ? "Signed standardised difference (σ)" : "Signed Cohen's d",
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
    }</div><p>The selected p-value above uses your chosen alternative hypothesis. The other p-values use the alternatives shown here. Divide the observed difference by ${z ? "the known population standard deviation" : independent ? "the pooled sample standard deviation" : "the sample standard deviation"} to get the effect size. Its sign follows the order of subtraction.</p></details>`,
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
      ? "x̄ is the sample mean and μ₀ is the null population mean. σ is the known population standard deviation and n is the sample size. The denominator is the standard error, or SE."
      : independent
        ? "x̄₁ and x̄₂ are sample means. sₚ is the pooled sample standard deviation. n₁ and n₂ are the sample sizes. The denominator estimates the standard error of the mean difference."
        : "x̄ is the sample mean and μ₀ is the null population mean. s is the sample standard deviation and n is the sample size. The denominator estimates the standard error, or SE.",
    method: z
      ? "The test assumes independent observations and a normal sampling distribution of the mean. The standard error σ/√n describes how sample means vary across repeated studies. The z score gives the observed difference from μ₀ in standard errors. Choose the alternative before looking at the data."
      : independent
        ? "This is the pooled equal-variance test. The applet gives both groups the same sample standard deviation, so the pooled value is also s. The test has n₁ + n₂ − 2 degrees of freedom. Exact p-values assume independent observations from normal populations with equal variances. Plot 1 shows the observed mean difference and its estimated standard error. Plot 2 shows the distribution of t when the population means are equal. Choose the alternative before looking at the data."
        : "The sliders set sample statistics. Exact t-test p-values assume independent observations from a normal population. The test uses n − 1 degrees of freedom. With small samples, skewness and outliers can make its p-values unreliable. Plot 1 shows the sample mean and its estimated standard error. Plot 2 shows the distribution of t when the null is true. Choose the alternative before looking at the data.",
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
    chart("normalChart", "Normal approximation"),
  notice: "approximation-warning",
  method:
    "Each binomial bar gives the probability of one count. The normal curve is a probability density. Approximate P(X = k) using the area between k − 0.5 and k + 0.5. This is the continuity correction. Trials must be independent and have the same success probability. Having both np ≥ 5 and n(1 − p) ≥ 5 is a rough check on whether the approximation is suitable. It does not guarantee accuracy.",
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
    chart("fullDistChart", "3 · Binomial probabilities"),
  method:
    "The coefficient counts the arrangements with k successes. The factor pᵏ(1 − p)ⁿ⁻ᵏ gives the probability of each arrangement. Their product is P(X = k). The probabilities in the final plot add to 1. The first two plots show the separate factors used in that multiplication.",
  scripts: ["binomial-components-explorer"],
};
pages["chi-squared-explorer"] = {
  controls:
    range("categories", "Number of categories k", 2, 10, 1, 5) +
    range("total-observations", "Total observations N", 10, 1000, 10, 100) +
    range("skew", "Departure in count weights", 0, 10, 0.1, 5),
  metrics:
    metric("Effect size, Cohen's w", "effect-size-value") +
    metric("χ² statistic", "chi-squared-value") +
    metric("Upper-tail p", "p-value"),
  charts:
    chart(
      "frequencyChart",
      "Observed integer counts & uniform expected counts",
    ) + chart("chiSquaredChart", "Null χ² sampling distribution"),
  notice: "validity-warning",
  method:
    "The null gives each category the same probability. The test estimates no parameters from the counts, so it has k − 1 degrees of freedom. The applet constructs whole-number counts from the slider settings. It does not draw random samples. If N is not divisible by k, the observed counts cannot all be equal. Cohen's w = √(χ²/N) measures departure from the null probabilities and can exceed 1. Discrepancies in either direction increase χ², so the p-value uses the upper tail.",
  scripts: ["chi-squared-explorer"],
};
pages["t-distribution-explorer"] = {
  controls: range("df-slider", "Degrees of freedom", 1, 100, 1, 1),
  metrics: "",
  charts: chart(
    "distributionChart",
    "Standard normal & Student's t densities",
    "Both curves describe possible standardised scores. At small degrees of freedom, the t curve assigns more probability to extreme scores. As the degrees of freedom increase, it approaches the standard normal curve.",
  ),
  method:
    "Both curves are probability densities centred at zero. The t curve gives the distribution of the one-sample t statistic under the null for independent observations from a normal population. Both distributions extend beyond the plotted range. With one degree of freedom, t has no defined mean or finite variance. With two degrees of freedom, its variance is still not finite.",
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
    "The curve shows possible F values under the null hypothesis. The dashed line marks the upper 5% critical value. Values to its right make up the rejection region. This explorer shows a critical value rather than a statistic calculated from observed data.",
  ),
  notice: "plot-note",
  method:
    "F is non-negative and has no upper limit. For an upper-tail variance-ratio test or ANOVA, values above the critical value lead to rejection of the null. When the numerator has fewer than two degrees of freedom, the density grows without limit near zero. The curve omits that endpoint. The shaded area ends at the plot edge, but the critical value uses the full distribution. A logarithmic axis changes the spacing of F values. Their probabilities stay the same.",
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
    "The slider constructs points with the selected sample correlation. It does not draw a random sample from a population with that correlation. New pattern changes the points while keeping r fixed. Manual input calculates r from your paired observations. A value of zero means no linear association. A curved relationship may still exist. Outliers can change r substantially. Correlation alone cannot establish causation.",
  scripts: ["correlation-walkthrough", "correlation"],
};
pages["clt-explorer"] = {
  controls:
    select(
      "population",
      "Population shape",
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
    chart("populationChart", "Individual observations from the population") +
    chart("meansChart", "Means from repeated samples"),
  method:
    "All four populations have mean 0 and standard deviation 1. The applet draws independent samples with replacement. Both histograms summarise simulated values. The normal comparison curve has mean 0 and variance 1/n. Each population has finite variance, as required by this form of the central limit theorem. Results vary between simulations. The same random seed and settings reproduce the same values.",
  scripts: ["extensions"],
};
pages["confidence-interval-explorer"] = {
  controls:
    range("populationMean", "Fixed population mean μ", -5, 5, 0.1, 0) +
    range("populationSD", "Population SD σ", 0.1, 3, 0.1, 1) +
    range("sampleSize", "Sample size n", 2, 100, 1, 20) +
    range("repetitions", "Repeated intervals", 100, 1000, 100, 500) +
    range("level", "Confidence level", 0.8, 0.99, 0.01, 0.95) +
    select(
      "method",
      "Interval procedure",
      [
        ["t", "t interval using sample SD"],
        ["z", "z interval using known population SD"],
      ],
      "t",
    ) +
    seed,
  metrics: "",
  charts:
    chart("intervalChart", "Repeated intervals around a fixed μ") +
    chart("widthChart", "Widths of the simulated intervals"),
  method:
    "The applet draws independent samples from a normal population. Each t interval uses its sample's standard deviation and n − 1 degrees of freedom. Each z interval uses the known population standard deviation. The population mean stays fixed. The plot shows the first 80 intervals. The coverage and mean width calculations use every simulated interval. Solid intervals with circles contain μ. Dashed intervals with triangles miss it. The confidence level describes the procedure over repeated studies. It does not give a probability that the fixed mean lies inside one calculated interval.",
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
    "The calculation assumes a one-sample z test with a known population standard deviation and independent normal observations. The effect d = (μ − μ₀)/σ describes the population. The z statistic has standard deviation 1 and mean d√n under that effect. The null distribution determines the rejection region. Power is the area of the alternative distribution inside that region. A one-sided test can have power below α when the true effect points in the opposite direction. These calculations apply to z tests. A t test needs a different power calculation.",
  scripts: ["extensions"],
};
pages["regression-explorer"] = {
  controls:
    select(
      "dataMode",
      "Data source",
      [
        ["generated", "Simulated data"],
        ["manual", "Use the pairs below"],
      ],
      "generated",
    ) +
    range("sampleSize", "Generated observations n", 3, 100, 1, 30) +
    range("slope", "Population slope for simulated data", -3, 3, 0.1, 1) +
    range("noise", "Noise SD for simulated data", 0, 3, 0.1, 1) +
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
    "The simulated data use fixed x values and a population intercept of 1. The errors are independent normal values with the chosen standard deviation. The fitted line estimates the intercept and slope from the sample. Least squares minimises the sum of squared vertical residuals. This model includes an intercept. R² is undefined if y is constant, and the slope is undefined if x is constant. Fitting the line does not require normal errors. Tests and confidence intervals for its coefficients need further assumptions. The simulation controls have no effect on manual data.",
  scripts: ["extensions"],
};
pages["anova-explorer"] = {
  controls:
    select(
      "dataMode",
      "Data source",
      [
        ["generated", "Simulated three-group samples"],
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
    "The simulated groups have population means of −spacing, 0 and +spacing. They share a population standard deviation, and observations are independent normal values. ANOVA divides the total sum of squares into between-group and within-group parts. Exact F-test p-values assume independent observations, normal errors and equal population variances. Even with equal population means, random samples usually give different sample means and an F above zero. A significant result does not identify which groups differ. Manual input allows unequal group sizes. Enter at least two observations per group.",
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
        ["bonferroni", "Bonferroni, controls FWER"],
        ["holm", "Holm, controls FWER"],
        ["bh", "Benjamini-Hochberg, controls FDR"],
      ],
      "none",
    ) +
    seed,
  metrics: "",
  charts:
    chart("familyChart", "Families with at least one false discovery") +
    chart("discoveryChart", "False discoveries in each simulated family"),
  method:
    "Every null hypothesis in this simulation is true. The applet draws independent p-values uniformly between 0 and 1. This represents continuous tests whose null p-values follow that distribution. The family-wise error rate, or FWER, is the chance of any false rejection in a family. Without adjustment it is 1 − (1 − α)ᵐ. Bonferroni and Holm control FWER even for dependent tests. Benjamini-Hochberg controls the false discovery rate, or FDR, under independence or suitable positive dependence. FDR is the expected proportion of false rejections among all rejections, counting the proportion as zero if there are none. Here, every rejection is false, so FDR equals FWER. This simulation cannot show what happens when some null hypotheses are false.",
  scripts: ["extensions"],
};
async function generate() {
  for (const meta of catalogue) {
    const p = pages[meta.id];
    if (!p) throw Error("Missing page " + meta.id);
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description" content="${escape(meta.objective)}"><title>${escape(meta.title)} · StatsApplets</title><link rel="stylesheet" href="../css/styles.css"><script src="../lib/chart.min.js"></script><script src="../lib/jstat.min.js"></script></head>
<body class="applet" data-applet="${meta.id}"><a class="skip-link" href="#main">Skip to applet</a><nav class="site-nav" aria-label="Main navigation"><a href="../index.html" class="brand">Stats<span>Applets</span></a><a href="../index.html">All explorers</a></nav>
<main id="main"><header class="page-header"><p class="eyebrow">${meta.group}</p><h1>${meta.title}</h1><p class="lede applet-introduction">${escape(meta.introduction)}</p><div class="equation">${math.equation(meta.id, meta.equation)}</div><p class="symbol-key">${p.symbolKey || symbolKeys[meta.id]}</p></header>
<div id="scenario-toolbar"></div><section class="controls-panel" id="controls" aria-label="Parameters">${p.controls}</section>
<section class="result-card" aria-label="Current results"><div class="metrics">${p.metrics}</div><p id="calculation" aria-live="polite"></p><p id="input-warning" class="notice" role="status" hidden></p>${p.notice ? `<p id="${p.notice}" class="notice" role="status"></p>` : ""}${p.extraResults || ""}</section>
<section class="container" aria-label="Interactive plots">${p.charts}</section>${p.after || ""}<details class="info"><summary>Model, assumptions & interpretation</summary><p>${p.method}</p></details>
</main><footer><a href="https://github.com/claudebajada/StatsApplets">Source code and documentation</a></footer>
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
