/* Rendering for the six additional explorers. Calculations are in TeachingMath. */
document.addEventListener("DOMContentLoaded", () => {
  const id = document.body.dataset.applet,
    T = TeachingMath,
    S = StatsMath;
  const el = (id) => document.getElementById(id),
    num = (id) => Number(el(id).value),
    value = (id) => el(id).value;
  const f = (x, digits = 3) =>
    Number.isFinite(x) ? x.toFixed(digits) : "Undefined";
  const percent = (x) => (100 * x).toFixed(1) + "%";
  const setCalculation = (text) => {
    el("calculation").textContent = text;
  };
  const chart = (id, title, xTitle, yTitle, type = "line") =>
    initializeChart(el(id).getContext("2d"), {
      type,
      data: { datasets: [lineDataset(title)] },
      options: chartOptions(
        { type: "linear", title: { display: true, text: xTitle } },
        { beginAtZero: type === "bar", title: { display: true, text: yTitle } },
      ),
    });
  const bars = (label, data, color = chartPalette[0]) => ({
    type: "bar",
    label,
    data,
    backgroundColor: color + "aa",
    borderColor: color,
    borderWidth: 1,
  });
  const point = (label, data, color = chartPalette[0], style = "circle") => ({
    label,
    data,
    borderColor: color,
    backgroundColor: color,
    showLine: false,
    pointRadius: 4,
    pointStyle: style,
  });
  const marker = (label, x, height, color = chartPalette[3]) => ({
    ...lineDataset(
      label,
      [
        { x, y: 0 },
        { x, y: height },
      ],
      color,
    ),
    borderDash: [5, 4],
  });
  const xy = (x, y) => ({ x, y });
  let update;
  if (id === "clt-explorer") {
    const population = chart(
      "populationChart",
      "Population histogram",
      "Individual observation",
      "Empirical density",
      "bar",
    );
    const means = chart(
      "meansChart",
      "Means histogram",
      "Sample mean x̄",
      "Empirical density",
    );
    update = () => {
      const n = num("sampleSize"),
        reps = num("repetitions"),
        result = T.clt(n, reps, value("population"), num("seed"));
      population.data.datasets = [
        bars(
          "Population sample histogram",
          T.histogram(result.population, 30, true),
        ),
      ];
      population.update();
      const data = T.histogram(result.means, 30, true),
        extent = Math.max(4 / Math.sqrt(n), ...data.map((p) => Math.abs(p.x)));
      means.data.datasets = [
        bars("Repeated sample means", data),
        lineDataset(
          "Normal CLT reference",
          curvePoints(-extent, extent, (x) =>
            S.normalDensity(x, 0, result.theoreticalSE),
          ),
          chartPalette[1],
        ),
      ];
      means.update();
      resultMetrics([
        ["Population μ", 0],
        ["Population σ", 1],
        ["Theoretical SE", f(result.theoreticalSE)],
        ["Empirical mean of x̄", f(result.empiricalMean)],
        ["Empirical SD of x̄", f(result.empiricalSD)],
      ]);
      setCalculation(
        `${reps} independent samples of size ${n} were drawn from the ${value("population")} population. SD(x̄) = 1/√${n} = ${f(result.theoreticalSE)}; the observed SD across repeated means is ${f(result.empiricalSD)}. The population does not change when n changes. The normal overlay is a reference, not a fit to the simulated means. Seed ${num("seed")} reproduces the experiment.`,
      );
    };
  } else if (id === "confidence-interval-explorer") {
    const intervals = chart(
      "intervalChart",
      "Intervals",
      "Interval endpoints",
      "Repetition",
    );
    const widths = chart(
      "widthChart",
      "Interval widths",
      "Interval width",
      "Frequency",
      "bar",
    );
    update = () => {
      const mu = num("populationMean"),
        sigma = num("populationSD"),
        n = num("sampleSize"),
        reps = num("repetitions"),
        level = num("level"),
        method = value("method");
      const result = T.coverage(mu, sigma, n, reps, level, method, num("seed")),
        display = result.intervals.slice(0, 80),
        covered = [],
        missed = [];
      display.forEach((interval, i) => {
        const points = [
          xy(interval.low, i + 1),
          xy(interval.high, i + 1),
          xy(interval.high, null),
        ];
        (interval.covers ? covered : missed).push(...points);
      });
      intervals.data.datasets = [
        {
          ...lineDataset("Covers μ: solid / circles", covered),
          pointRadius: 2,
        },
        {
          ...lineDataset(
            "Misses μ: dashed / triangles",
            missed,
            chartPalette[1],
          ),
          pointRadius: 3,
        },
        {
          ...lineDataset(
            "Fixed population μ",
            [xy(mu, 0), xy(mu, display.length + 1)],
            chartPalette[3],
          ),
          borderDash: [2, 3],
        },
      ];
      intervals.options.scales.y.min = 0;
      intervals.options.scales.y.max = display.length + 1;
      intervals.update();
      widths.data.datasets = [
        bars(
          "All interval widths",
          T.histogram(
            result.intervals.map((i) => i.high - i.low),
            25,
          ),
        ),
      ];
      widths.update();
      resultMetrics([
        ["Nominal coverage", percent(level)],
        ["Observed coverage", percent(result.covered / reps)],
        ["Intervals covering μ", `${result.covered} / ${reps}`],
        ["Average width", f(result.averageWidth)],
      ]);
      const first = result.intervals[0];
      setCalculation(
        `For the first sample, x̄ = ${f(first.mean)}, ${method === "t" ? "estimated s/√n" : "known σ/√n"} = ${f(first.se)} and critical = ${f(first.critical)}. Its interval is [${f(first.low)}, ${f(first.high)}] and ${first.covers ? "covers" : "misses"} the fixed μ = ${f(mu)}. Across ${reps} intervals, ${result.covered} cover μ. Monte Carlo SE of a coverage estimate near the nominal level is about ${f(Math.sqrt((level * (1 - level)) / reps))}; empirical coverage need not equal the nominal rate exactly.`,
      );
    };
  } else if (id === "power-explorer") {
    const density = chart(
      "powerChart",
      "Sampling densities",
      "Z statistic",
      "Probability density",
    );
    const curve = chart(
      "powerCurveChart",
      "Power",
      "Sample size n",
      "Probability",
    );
    update = () => {
      const n = num("sampleSize"),
        d = num("effect"),
        alpha = num("alpha"),
        direction = value("alternative"),
        result = T.power(n, d, alpha, direction);
      const lo = Math.min(-4, result.shift - 4, -result.critical - 1),
        hi = Math.max(4, result.shift + 4, result.critical + 1);
      const xs = [
        ...new Set([
          ...curvePoints(lo, hi, () => 0).map((p) => p.x),
          result.critical,
          -result.critical,
        ]),
      ].sort((a, b) => a - b);
      const rejects = (x) =>
        direction === "twoSided"
          ? Math.abs(x) >= result.critical
          : direction === "upper"
            ? x >= result.critical
            : x <= -result.critical;
      density.data.datasets = [
        lineDataset(
          "H₀: N(0,1)",
          xs.map((x) => xy(x, S.normalDensity(x, 0, 1))),
        ),
        lineDataset(
          "Specified H₁: shifted Z",
          xs.map((x) => xy(x, S.normalDensity(x, result.shift, 1))),
          chartPalette[1],
        ),
        {
          ...lineDataset(
            "Power area under H₁",
            xs.map((x) =>
              xy(x, rejects(x) ? S.normalDensity(x, result.shift, 1) : null),
            ),
            chartPalette[2],
          ),
          fill: "origin",
        },
        marker(
          "Critical boundary",
          direction === "lower" ? -result.critical : result.critical,
          0.4,
        ),
      ];
      if (direction === "twoSided")
        density.data.datasets.push(
          marker("Lower critical boundary", -result.critical, 0.4),
        );
      density.update();
      const powerData = Array.from({ length: 299 }, (_, i) =>
        xy(i + 2, T.power(i + 2, d, alpha, direction).power),
      );
      curve.data.datasets = [
        lineDataset("Power at specified effect", powerData),
        point("Current n", [xy(n, result.power)], chartPalette[1], "triangle"),
      ];
      curve.options.scales.y.min = 0;
      curve.options.scales.y.max = 1;
      curve.update();
      resultMetrics([
        ["Power", percent(result.power)],
        ["Type II error β", percent(result.beta)],
        ["Significance α", percent(alpha)],
        ["H₁ mean of Z", f(result.shift)],
      ]);
      setCalculation(
        `At n = ${n}, the true effect d = ${f(d)} shifts Z by d√n = ${f(result.shift)}. The ${direction === "twoSided" ? "two-sided" : direction === "upper" ? "greater-than" : "less-than"} rejection boundary is ${direction === "twoSided" ? "±" : direction === "lower" ? "−" : ""}${f(result.critical)}. Integrating the specified alternative density in the rejection region gives power ${f(result.power, 4)} and β = ${f(result.beta, 4)}. For d = 0 the rejection probability is α. The observed-statistic marker used in the test applets is deliberately absent: this is a prospective probability calculation.`,
      );
    };
  } else if (id === "regression-explorer") {
    const fit = chart("fitChart", "Data and fit", "x", "y", "scatter");
    const residual = chart(
      "residualChart",
      "Residuals",
      "Fitted value ŷ",
      "Residual y − ŷ",
      "scatter",
    );
    update = () => {
      const pairs =
        value("dataMode") === "manual"
          ? T.parsePairs(value("pairs"), 3)
          : T.regressionSample(
              num("sampleSize"),
              num("slope"),
              num("noise"),
              num("seed"),
            );
      const result = T.regression(pairs),
        xs = pairs.map((p) => p[0]),
        min = Math.min(...xs),
        max = Math.max(...xs);
      fit.data.datasets = [
        point(
          "Observed sample",
          pairs.map(([x, y]) => xy(x, y)),
        ),
      ];
      if (!result.defined) {
        fit.update();
        residual.data.datasets = [];
        residual.update();
        resultMetrics([["Fit", "Undefined"]]);
        setCalculation(result.reason);
        return;
      }
      const segments = pairs.flatMap(([x, y], i) => [
        xy(x, y),
        xy(x, result.fitted[i]),
        xy(x, null),
      ]);
      fit.data.datasets.push(
        lineDataset(
          "Least-squares fit",
          [
            xy(min, result.intercept + result.slope * min),
            xy(max, result.intercept + result.slope * max),
          ],
          chartPalette[1],
        ),
        {
          ...lineDataset("Vertical residuals", segments, chartPalette[2]),
          borderDash: [2, 3],
        },
      );
      fit.update();
      const fittedMin = Math.min(...result.fitted),
        fittedMax = Math.max(...result.fitted);
      residual.data.datasets = [
        point(
          "Residuals",
          result.fitted.map((x, i) => xy(x, result.residuals[i])),
        ),
        {
          ...lineDataset(
            "Zero residual",
            [xy(fittedMin, 0), xy(fittedMax, 0)],
            chartPalette[1],
          ),
          borderDash: [6, 4],
        },
      ];
      residual.update();
      resultMetrics([
        ["Fitted slope b₁", f(result.slope)],
        ["Fitted intercept b₀", f(result.intercept)],
        [
          "R²",
          result.rSquared === null
            ? "Undefined (constant y)"
            : f(result.rSquared, 4),
        ],
        ["Residual SD", f(result.residualSD)],
        ["SSE", f(result.sse)],
      ]);
      setCalculation(
        `For ${pairs.length} observations, ŷ = ${f(result.intercept)} + ${f(result.slope)}x. The least-squares residual sum is ${f(
          result.residuals.reduce((s, x) => s + x, 0),
          8,
        )} (rounding aside); SSE = ${f(result.sse)} and SST = ${f(result.sst)}. ${result.rSquared === null ? "SST is zero, so R² is undefined." : `R² = 1 − SSE/SST = ${f(result.rSquared, 4)}.`} Residual SD uses n − 2 = ${result.df} degrees of freedom. This is an illustrative in-sample fit, not a causal conclusion.`,
      );
    };
  } else if (id === "anova-explorer") {
    const groupsChart = chart(
      "groupsChart",
      "Groups",
      "Group",
      "Observed value",
      "scatter",
    );
    const fChart = chart(
      "anovaChart",
      "Null F",
      "F statistic",
      "Probability density",
    );
    const table = document.createElement("div");
    table.id = "anova-table";
    table.className = "table-scroll";
    document.querySelector(".result-card").append(table);
    update = () => {
      let groups;
      if (value("dataMode") === "manual") {
        groups = value("groups")
          .trim()
          .split(/\n/)
          .filter((s) => s.trim())
          .map((line) =>
            line
              .trim()
              .split(/[,\s]+/)
              .map(Number),
          );
      } else
        groups = T.groupSample(
          num("sampleSize"),
          num("separation"),
          num("withinSD"),
          num("seed"),
        );
      const result = T.anova(groups);
      groupsChart.data.datasets = groups.map((group, i) =>
        point(
          "Group " + (i + 1),
          group.map((y, j) => xy(i + 1 + ((j % 7) - 3) * 0.015, y)),
          chartPalette[i % chartPalette.length],
          ["circle", "triangle", "rect"][i % 3],
        ),
      );
      groupsChart.data.datasets.push({
        ...lineDataset(
          "Sample group means",
          result.means.map((y, i) => xy(i + 1, y)),
          chartPalette[3],
        ),
        pointRadius: 6,
        pointStyle: "rect",
      });
      groupsChart.options.scales.x.ticks = { stepSize: 1, precision: 0 };
      groupsChart.update();
      table.replaceChildren();
      const t = document.createElement("table");
      t.innerHTML =
        '<caption>ANOVA partition of observed variability</caption><thead><tr><th scope="col">Source</th><th scope="col">SS</th><th scope="col">df</th><th scope="col">MS</th></tr></thead>';
      const body = document.createElement("tbody");
      for (const row of [
        ["Between groups", result.between, result.dfBetween, result.msBetween],
        ["Within groups", result.within, result.dfWithin, result.msWithin],
        ["Total", result.total, result.dfBetween + result.dfWithin, null],
      ]) {
        const tr = document.createElement("tr");
        row.forEach((v, i) => {
          const td = document.createElement(i ? "td" : "th");
          if (!i) td.scope = "row";
          td.textContent =
            v === null
              ? "—"
              : typeof v === "number"
                ? f(v)
                : (v ?? "Undefined");
          tr.append(td);
        });
        body.append(tr);
      }
      t.append(body);
      table.append(t);
      if (!result.defined) {
        fChart.data.datasets = [];
        fChart.update();
        resultMetrics([["F statistic", "Undefined"]]);
        setCalculation(result.reason);
        return;
      }
      const max = Math.max(
          jStat.centralF.inv(0.995, result.dfBetween, result.dfWithin),
          result.f * 1.15,
        ),
        pdf = (x) => jStat.centralF.pdf(x, result.dfBetween, result.dfWithin);
      const points = curvePoints(max / 10000, max, pdf);
      if (result.f > 0) points.push(xy(result.f, pdf(result.f)));
      points.sort((a, b) => a.x - b.x);
      fChart.data.datasets = [
        lineDataset(`H₀: F(${result.dfBetween}, ${result.dfWithin})`, points),
        {
          ...lineDataset(
            "Upper-tail p area",
            points.map((p) => xy(p.x, p.x >= result.f ? p.y : null)),
            chartPalette[1],
          ),
          fill: "origin",
        },
        marker("Observed F", result.f, Math.max(...points.map((p) => p.y))),
      ];
      fChart.options.scales.x.min = 0;
      fChart.options.scales.x.max = max;
      fChart.update();
      resultMetrics([
        ["F statistic", f(result.f)],
        ["Upper-tail p", formatProbability(result.p)],
        ["η²", f(result.etaSquared, 4)],
        ["Within-group df", result.dfWithin],
      ]);
      setCalculation(
        `SSbetween ${f(result.between)} + SSwithin ${f(result.within)} = SStotal ${f(result.total)}. Dividing by df gives MSbetween = ${f(result.msBetween)} and MSwithin = ${f(result.msWithin)}; their ratio F = ${f(result.f)} has an upper-tail p-value of ${formatProbability(result.p)} under equal population means. η² = SSbetween/SStotal = ${f(result.etaSquared, 4)} describes the observed proportion of variability attributed to group membership.`,
      );
    };
  } else if (id === "multiple-comparisons-explorer") {
    const family = initializeChart(el("familyChart").getContext("2d"), {
      type: "bar",
      data: {
        labels: ["No adjustment: theory", "Selected procedure: simulation"],
        datasets: [],
      },
      options: chartOptions(
        {},
        {
          min: 0,
          max: 1,
          title: { display: true, text: "Probability of any false discovery" },
        },
      ),
    });
    const discoveries = chart(
      "discoveryChart",
      "False discoveries",
      "Number of false discoveries",
      "Number of families",
      "bar",
    );
    update = () => {
      const m = num("tests"),
        reps = num("repetitions"),
        alpha = num("alpha"),
        method = value("correction"),
        result = T.multipleComparisons(m, reps, alpha, method, num("seed"));
      family.data.datasets = [
        {
          label: "Family-wise error rate",
          data: [result.unadjustedFWER, result.empiricalFWER],
          backgroundColor: [chartPalette[0], chartPalette[1]],
          borderColor: chartPalette[0],
          borderWidth: 2,
        },
        {
          type: "line",
          label: "Nominal α",
          data: [alpha, alpha],
          borderColor: chartPalette[3],
          borderDash: [5, 4],
          pointRadius: 0,
        },
      ];
      family.update();
      const counts = Array(m + 1).fill(0);
      result.counts.forEach((c) => counts[c]++);
      discoveries.data.datasets = [
        bars(
          "Simulated families",
          counts.map((y, x) => xy(x, y)),
        ),
      ];
      discoveries.options.scales.x.ticks = { precision: 0 };
      discoveries.update();
      resultMetrics([
        ["Theoretical unadjusted FWER", percent(result.unadjustedFWER)],
        ["Empirical selected FWER", percent(result.empiricalFWER)],
        ["Families with false discoveries", `${result.families} / ${reps}`],
        ["Total false discoveries", result.discoveries],
      ]);
      setCalculation(
        `With ${m} independent true nulls, unadjusted FWER = 1 − (1 − ${alpha})^${m} = ${f(result.unadjustedFWER, 4)}. The selected ${method} procedure produced at least one false discovery in ${result.families} of ${reps} simulated families. All discoveries in this experiment are false. The empirical rate varies with the random seed; this is not evidence that a nominally controlled procedure is invalid when one simulation lies slightly above α.`,
      );
    };
  }
  if (!update) return;
  function safeUpdate() {
    try {
      update();
      inputWarning();
    } catch (error) {
      inputWarning(
        "Check the inputs: " +
          error.message +
          " The plots retain the last valid result.",
      );
    }
  }
  watchControls(safeUpdate);
  safeUpdate();
});
