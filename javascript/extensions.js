/* Rendering for the six additional explorers. Calculations are in TeachingMath. */
document.addEventListener("DOMContentLoaded", () => {
  const id = document.body.dataset.applet,
    T = TeachingMath,
    S = StatsMath;
  const el = (id) => document.getElementById(id),
    num = (id) => Number(el(id).value),
    value = (id) => el(id).value;
  function showDataControls(manualInput, simulationInputs) {
    const manual = value("dataMode") === "manual";
    el(manualInput).closest(".control-field").hidden = !manual;
    for (const input of simulationInputs)
      el(input).closest(".control-field").hidden = manual;
    el("resample").hidden = manual;
    el("seed")?.closest(".seed-details")?.toggleAttribute("hidden", manual);
    return manual;
  }
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
      "Density",
      "bar",
    );
    const means = chart(
      "meansChart",
      "Means histogram",
      "Sample mean x̄",
      "Density",
    );
    update = () => {
      const n = num("sampleSize"),
        reps = num("repetitions"),
        result = T.clt(n, reps, value("population"), num("seed"));
      const discrete = value("population") === "bernoulli";
      population.options.scales.y.title.text = discrete
        ? "Probability"
        : "Probability density";
      means.options.scales.y.title.text = discrete
        ? "Probability"
        : "Probability density";
      population.data.datasets = [
        discrete
          ? bars(
              "Observed binary probabilities",
              T.bernoulliMass(result.population),
            )
          : histogramDataset(
              "Population sample histogram",
              T.histogram(result.population, 30, true),
            ),
      ];
      population.update();
      el("populationChart-explanation").textContent = discrete
        ? "The two bars show observed probabilities of the standardised binary outcomes −1/3 and 3. Their heights add to 1."
        : "Individual values are drawn from a population with mean 0 and SD 1. Each bar's area is its observed fraction; height is that fraction divided by bin width. Total histogram area is 1.";
      const shown = el("traceMode").checked
        ? Math.min(reps, num("traceCount"))
        : reps;
      const displayedMeans = result.means.slice(0, shown);
      const data = discrete
          ? T.bernoulliMass(displayedMeans, n)
          : T.histogram(displayedMeans, 30, true),
        extent = Math.max(4 / Math.sqrt(n), ...data.map((p) => Math.abs(p.x)));
      means.data.datasets = [
        shown < 20
          ? point(
              "One point per study mean",
              displayedMeans.map((x) => xy(x, 0)),
            )
          : discrete
            ? bars("Observed sample-mean probabilities", data)
            : histogramDataset("Repeated sample means", data),
        discrete
          ? lineDataset(
              "Normal interval probabilities",
              data.map(({ x, k }) =>
                xy(x, LearningMath.binomialSelection(n, 0.1, k).normalArea),
              ),
              chartPalette[1],
            )
          : lineDataset(
              "Normal approximation",
              curvePoints(-extent, extent, (x) =>
                S.normalDensity(x, 0, result.theoreticalSE),
              ),
              chartPalette[1],
            ),
      ];
      means.options.scales.y.min = 0;
      if (discrete) means.options.scales.y.max = 1;
      else delete means.options.scales.y.max;
      if (el("lockScale").checked) {
        means.options.scales.x.min = -4;
        means.options.scales.x.max = 4;
      } else {
        delete means.options.scales.x.min;
        delete means.options.scales.x.max;
      }
      means.update();
      el("scale-note").textContent = el("lockScale").checked
        ? "The means use a fixed −4 to +4 axis. Increasing n makes their spread visibly narrower. " +
          (discrete
            ? "Bar heights are probabilities."
            : "Density heights may rescale.")
        : "The mean axis resizes. Compare tick values as well as the shape.";
      el("meansChart-explanation").textContent =
        "Showing " +
        shown +
        " of " +
        reps +
        " study means. Each study adds one mean, rather than all its observations. " +
        (shown === 1
          ? "One mean cannot yet reveal a sampling distribution."
          : "As more studies accumulate, their sampling distribution becomes visible.") +
        (discrete
          ? " Each bar height is an observed probability at an exact binary sample mean. The normal comparison uses continuity-corrected interval probabilities, not density heights; it may be poor for small n."
          : " Bar areas are observed probabilities. The comparison density uses the population mean and theoretical SE.");
      resultMetrics([
        ["Population μ", 0],
        ["Population σ", 1],
        ["Theoretical SE", f(result.theoreticalSE)],
        ["Mean of displayed study means", f(T.mean(displayedMeans))],
        [
          "SD of displayed study means",
          shown > 1
            ? f(Math.sqrt(T.variance(displayedMeans)))
            : "Need 2 studies",
        ],
      ]);
      setCalculation(
        `The applet drew ${reps} independent samples of ${n} observations from the chosen population. The theoretical standard error is 1/√${n} = ${f(result.theoreticalSE)}. The standard deviation of the simulated sample means is ${f(result.empiricalSD)}. Changing n affects the sample means, while the population stays the same. The comparison curve uses the theoretical standard error. Random seed ${num("seed")} reproduces these samples with the same settings.`,
      );
      document.dispatchEvent(
        new CustomEvent("applet:render", {
          detail: {
            kind: id,
            n,
            reps,
            shown,
            population: value("population"),
            seed: num("seed"),
            result,
          },
        }),
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
    let intervalBounds;
    el("fit-axes").addEventListener("click", () => {
      intervalBounds = undefined;
      update();
    });
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
          ...lineDataset("Contains μ, solid with circles", covered),
          pointRadius: 2,
        },
        {
          ...lineDataset(
            "Misses μ, dashed with triangles",
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
      if (!intervalBounds) {
        const low = Math.min(mu, ...display.map((i) => i.low)),
          high = Math.max(mu, ...display.map((i) => i.high)),
          padding = Math.max((high - low) * 0.05, sigma * 0.05);
        intervalBounds = [low - padding, high + padding];
      }
      if (el("lockScale").checked) {
        intervals.options.scales.x.min = intervalBounds[0];
        intervals.options.scales.x.max = intervalBounds[1];
      } else {
        delete intervals.options.scales.x.min;
        delete intervals.options.scales.x.max;
      }
      const clipped = display.filter(
        (i) => i.low < intervalBounds[0] || i.high > intervalBounds[1],
      ).length;
      el("intervalChart-explanation").textContent =
        "Showing the first " +
        display.length +
        " of " +
        reps +
        " intervals; coverage uses all " +
        reps +
        ". Each horizontal segment comes from a different sample. The vertical line is fixed μ. Dashed triangles mark misses.";
      el("scale-note").textContent = el("lockScale").checked
        ? "Interval axis fixed for comparison." +
          (clipped
            ? " " +
              clipped +
              " displayed intervals extend beyond it; use Plot axes to fit this example."
            : "")
        : "Interval axis resizes; compare its tick values when changing sample size.";
      intervals.update();
      widths.data.datasets = [
        histogramDataset(
          "All interval widths",
          T.histogram(
            result.intervals.map((i) => i.width),
            25,
          ),
        ),
      ];
      widths.update();
      el("widthChart-explanation").textContent =
        method === "z"
          ? "With known population SD and fixed n and confidence level, every interval has the same width. This single bar counts all simulated intervals."
          : "These bars count interval widths. Estimated sample SD varies between studies, so t interval widths vary too.";
      resultMetrics([
        ["Confidence level", percent(level)],
        ["Observed coverage", percent(result.covered / reps)],
        ["Intervals covering μ", `${result.covered} / ${reps}`],
        ["Average width", f(result.averageWidth)],
      ]);
      const first = result.intervals[0];
      setCalculation(
        `The first sample has mean ${f(first.mean)} and ${method === "t" ? "an estimated" : "a known"} standard error of ${f(first.se)}. Its critical value is ${f(first.critical)}. The interval is [${f(first.low)}, ${f(first.high)}], which ${first.covers ? "contains" : "misses"} the population mean μ = ${f(mu)}. In total, ${result.covered} of ${reps} intervals contain μ. Random sampling makes this proportion vary. Near the chosen confidence level, its standard error across simulations is about ${f(Math.sqrt((level * (1 - level)) / reps))}.`,
      );
      document.dispatchEvent(
        new CustomEvent("applet:render", {
          detail: {
            kind: id,
            mu,
            sigma,
            n,
            reps,
            level,
            method,
            seed: num("seed"),
            result,
          },
        }),
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
          d === 0
            ? "True null: N(0,1)"
            : result.beta === null
              ? "Specified true effect (outside chosen H₁)"
              : "Specified H₁: shifted Z",
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
        [
          d === 0
            ? "Rejection probability at the null"
            : "Power at specified effect",
          percent(result.power),
        ],
        [
          "Type II error β",
          result.beta === null ? "Not applicable" : percent(result.beta),
        ],
        ["Non-rejection probability", percent(result.nonRejection)],
        ["Significance α", percent(alpha)],
        ["H₁ mean of Z", f(result.shift)],
      ]);
      setCalculation(
        `At n = ${n}, the true effect d = ${f(d)} gives the alternative z distribution a mean of d√n = ${f(result.shift)}. The ${direction === "twoSided" ? "two-sided" : direction === "upper" ? "greater-than" : "less-than"} rejection boundary is ${direction === "twoSided" ? "±" : direction === "lower" ? "−" : ""}${f(result.critical)}. The area under the alternative curve inside the rejection region gives power = ${f(result.power, 4)}. The remaining area is the non-rejection probability ${f(result.nonRejection, 4)}. ${result.beta === null ? "This specified value is not in the chosen alternative, so non-rejection is not labelled Type II error." : "At this alternative it is Type II error β."} When d = 0, the rejection probability equals α and non-rejection is a correct decision.`,
      );
      document.dispatchEvent(
        new CustomEvent("applet:render", {
          detail: { kind: id, n, d, alpha, direction, result },
        }),
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
      const manual = showDataControls("pairs", [
        "sampleSize",
        "slope",
        "noise",
        "seed",
      ]);
      const pairs = manual
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
        document.dispatchEvent(
          new CustomEvent("applet:render", {
            detail: { kind: id, pairs, result, manual },
          }),
        );
        return;
      }
      const tryLine = el("tryLine").checked,
        reveal = el("revealFit").checked,
        candidate = LearningMath.candidateLine(
          pairs,
          num("candidateIntercept"),
          num("candidateSlope"),
        ),
        activeFitted = tryLine
          ? pairs.map(
              ([x]) => num("candidateIntercept") + num("candidateSlope") * x,
            )
          : result.fitted,
        activeResiduals = tryLine ? candidate.residuals : result.residuals;
      const segments = pairs.flatMap(([x, y], i) => [
        xy(x, y),
        xy(x, activeFitted[i]),
        xy(x, null),
      ]);
      fit.data.datasets.push(
        {
          ...lineDataset(
            "Least-squares fit",
            [
              xy(min, result.intercept + result.slope * min),
              xy(max, result.intercept + result.slope * max),
            ],
            chartPalette[1],
          ),
          showLine: true,
        },
        {
          ...lineDataset(
            tryLine ? "Candidate-line residuals" : "Least-squares residuals",
            segments,
            chartPalette[2],
          ),
          borderDash: [2, 3],
          showLine: true,
        },
      );
      fit.data.datasets[1].hidden = !reveal;
      fit.data.datasets[2].hidden = !(tryLine || reveal);
      if (tryLine)
        fit.data.datasets.push({
          ...lineDataset(
            "Your candidate line",
            [
              xy(min, num("candidateIntercept") + num("candidateSlope") * min),
              xy(max, num("candidateIntercept") + num("candidateSlope") * max),
            ],
            chartPalette[3],
          ),
          showLine: true,
        });
      if (!manual && reveal)
        fit.data.datasets.push({
          ...lineDataset(
            "Population generating line",
            [xy(min, 1 + num("slope") * min), xy(max, 1 + num("slope") * max)],
            chartPalette[4],
          ),
          showLine: true,
          borderDash: [3, 5],
        });
      fit.update();
      residual.data.datasets = [
        point(
          tryLine ? "Candidate-line residuals" : "Least-squares residuals",
          xs.map((x, i) => xy(x, activeResiduals[i])),
        ),
        {
          ...lineDataset(
            "Zero residual",
            [xy(min, 0), xy(max, 0)],
            chartPalette[1],
          ),
          borderDash: [6, 4],
          showLine: true,
        },
      ];
      residual.options.scales.x.title.text = "Observed x";
      residual.update();
      el("residualChart-explanation").textContent =
        (tryLine
          ? "This plot follows your candidate line. "
          : "This plot follows the least-squares fit. ") +
        "Each point shows an observed x and its vertical residual. This reveals curved patterns even when the fitted line is horizontal. The zero reference separates over-predictions from under-predictions.";
      el("fitChart-explanation").textContent =
        "Each dot is one observed x, y pair. " +
        (tryLine
          ? "The candidate line and its vertical residual segments match the residual panel."
          : "The least-squares line and its vertical residual segments match the residual panel.");
      resultMetrics(
        reveal
          ? [
              ["Fitted slope b₁", f(result.slope)],
              ["Fitted intercept b₀", f(result.intercept)],
              [
                "R²",
                result.rSquared === null
                  ? "Undefined, y is constant"
                  : f(result.rSquared, 4),
              ],
              ["Residual SD", f(result.residualSD)],
              ["SSE", f(result.sse)],
              ...(tryLine ? [["Your line SSE", f(candidate.sse)]] : []),
            ]
          : [
              ["Your line SSE", f(candidate.sse)],
              ["Minimum possible SSE", f(result.sse)],
            ],
      );
      setCalculation(
        reveal
          ? `For ${pairs.length} observations, the fitted line is ŷ = ${f(result.intercept)} + ${f(result.slope)}x. The residuals sum to ${f(
              result.residuals.reduce((s, x) => s + x, 0),
              8,
            )}, which is zero apart from rounding. Squaring the residuals and adding them gives SSE = ${f(result.sse)}. The total sum of squares is SST = ${f(result.sst)}. ${result.rSquared === null ? "SST is zero, so R² is undefined." : `R² = 1 − SSE/SST = ${f(result.rSquared, 4)}.`} The residual standard deviation uses n − 2 = ${result.df} degrees of freedom. These results describe the fitted sample. They do not establish causation or guarantee accurate predictions for new observations.`
          : "Try a line before revealing the solution. For each observation, calculate the residual y − ŷ, square it, then add all the squares. Adjust slope and intercept to reduce this sum of squared errors (SSE). Reveal the fit to see the least-squares calculation.",
      );
      document.dispatchEvent(
        new CustomEvent("applet:render", {
          detail: {
            kind: id,
            pairs,
            result,
            manual,
            candidate,
            tryLine,
            reveal,
          },
        }),
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
    document.querySelector(".calculation-details").append(table);
    update = () => {
      const manual = showDataControls("groups", [
        "sampleSize",
        "separation",
        "withinSD",
        "seed",
      ]);
      let groups;
      if (manual) {
        groups = T.parseGroups(value("groups"));
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
      groupsChart.data.datasets.push({
        ...lineDataset(
          "Grand mean",
          [
            xy(0.6, T.mean(groups.flat())),
            xy(groups.length + 0.4, T.mean(groups.flat())),
          ],
          chartPalette[4],
        ),
        showLine: true,
        borderDash: [5, 4],
      });
      groupsChart.options.scales.x.ticks = { stepSize: 1, precision: 0 };
      groupsChart.update();
      table.replaceChildren();
      const t = document.createElement("table");
      t.innerHTML =
        '<caption>ANOVA sums of squares and mean squares</caption><thead><tr><th scope="col">Source</th><th scope="col">Sum of squares</th><th scope="col">Degrees of freedom</th><th scope="col">Mean square</th></tr></thead>';
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
              ? "Not applicable"
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
        document.dispatchEvent(
          new CustomEvent("applet:render", {
            detail: { kind: id, groups, result },
          }),
        );
        return;
      }
      const { max, points } = S.densityPlot(
        (x) => jStat.centralF.pdf(x, result.dfBetween, result.dfWithin),
        (p) => jStat.centralF.inv(p, result.dfBetween, result.dfWithin),
        result.f,
      );
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
        `The between-group sum of squares ${f(result.between)} plus the within-group sum of squares ${f(result.within)} gives the total ${f(result.total)}. Divide each by its degrees of freedom to get the mean squares ${f(result.msBetween)} and ${f(result.msWithin)}. Their ratio F = ${f(result.f)} has an upper-tail p-value of ${formatProbability(result.p)} under equal population means. The effect size η² = ${f(result.etaSquared, 4)} is the between-group sum of squares divided by the total. It describes the proportion of sample variation accounted for by differences between group means.`,
      );
      document.dispatchEvent(
        new CustomEvent("applet:render", {
          detail: { kind: id, groups, result },
        }),
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
      "Discoveries per family",
      "Number of families",
      "bar",
    );
    update = () => {
      const m = num("tests"),
        reps = num("repetitions"),
        alpha = num("alpha"),
        method = value("correction"),
        signals = Math.round(m * num("signalFraction")),
        result = T.multipleComparisons(m, reps, alpha, method, num("seed"), {
          signals,
          effect: num("signalEffect"),
          sampleSize: num("signalN"),
        });
      family.data.labels = ["Unadjusted FWER", "Chosen FWER", "Chosen FDR"];
      family.options.scales.y.title.text =
        "Probability / expected false fraction";
      family.data.datasets = [
        {
          label: "Error-rate estimates",
          data: [
            result.unadjustedFWER,
            result.empiricalFWER,
            result.empiricalFDR,
          ],
          backgroundColor: [chartPalette[0], chartPalette[1], chartPalette[2]],
          borderColor: chartPalette[0],
          borderWidth: 2,
        },
        {
          type: "line",
          label: "Nominal error-rate threshold",
          data: [alpha, alpha, alpha],
          borderColor: chartPalette[3],
          borderDash: [5, 4],
          pointRadius: 0,
        },
      ];
      family.update();
      const counts = Array(m + 1).fill(0),
        correctCounts = Array(m + 1).fill(0);
      result.counts.forEach((c) => counts[c]++);
      result.trueCounts.forEach((c) => correctCounts[c]++);
      discoveries.data.datasets = [
        bars(
          "False discoveries per family",
          counts.map((y, x) => xy(x, y)),
        ),
        bars(
          "Correct discoveries per family",
          correctCounts.map((y, x) => xy(x, y)),
          chartPalette[2],
        ),
      ];
      discoveries.options.scales.x.ticks = { precision: 0 };
      discoveries.update();
      resultMetrics([
        ["Simulated FWER", percent(result.empiricalFWER)],
        ["Simulated FDR", percent(result.empiricalFDR)],
        ["Correct discoveries", result.trueDiscoveries],
        ["False discoveries", result.discoveries],
      ]);
      setCalculation(
        `With ${m} independent tests, ${result.nulls} nulls are true and ${signals} effects are real. Without adjustment, the chance of at least one false rejection is 1 − (1 − ${alpha})^${result.nulls} = ${f(result.unadjustedFWER, 4)}. The chosen method made false discoveries in ${result.families} of ${reps} families (FWER), and its mean false fraction across all families was ${f(result.empiricalFDR, 4)} (FDR). Families with no discoveries contribute zero to that average. It made ${result.trueDiscoveries} correct and ${result.discoveries} false discoveries in total. ${signals === 0 ? "With every null true, FDR and FWER coincide." : "With real effects, FDR and FWER can differ."} Random variation can put estimates above a controlled threshold in one simulation.`,
      );
      el("familyChart-explanation").textContent =
        "Compare unadjusted theoretical FWER, chosen-method simulated FWER, and chosen-method simulated FDR. With real effects these are different targets. α is a long-run target for FWER methods; for BH the threshold targets FDR.";
      document.dispatchEvent(
        new CustomEvent("applet:render", {
          detail: { kind: id, m, reps, alpha, method, signals, result },
        }),
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
