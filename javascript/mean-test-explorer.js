// Shared rendering for one-sample z/t and equal-variance independent t tests.
function initMeanTest({ independent = false, knownSigma = false } = {}) {
  document.addEventListener("DOMContentLoaded", () => {
    const get = (id) => document.getElementById(id);
    const number = (id) => Number(get(id).value);
    const alternative = get("alternative");
    const isT = !knownSigma,
      statisticName = isT ? "t" : "z";
    const chart = (id, labels) =>
      initializeChart(get(id).getContext("2d"), {
        type: "line",
        data: {
          datasets: labels.map((label, i) =>
            lineDataset(label, [], i ? "#b24632" : "#2456a6"),
          ),
        },
        options: chartOptions(
          { type: "linear", title: { display: true, text: "Value" } },
          {
            beginAtZero: true,
            title: { display: true, text: "Probability density" },
          },
        ),
      });
    const estimateChart = initializeChart(
      get("meanEstimateChart").getContext("2d"),
      {
        type: "scatter",
        data: {
          datasets: [
            {
              ...lineDataset("Sample estimate", [], chartPalette[0]),
              pointRadius: 7,
              showLine: false,
            },
            {
              ...lineDataset("Null value", [], chartPalette[1]),
              pointRadius: 7,
              pointStyle: "rectRot",
              showLine: false,
            },
            {
              ...lineDataset("Estimate ± 1 SE", [], chartPalette[0]),
              showLine: true,
              borderWidth: 3,
            },
            {
              ...lineDataset("SE end caps", [], chartPalette[0]),
              showLine: true,
            },
          ],
        },
        options: chartOptions(
          {
            type: "linear",
            title: {
              display: true,
              text: independent
                ? "Mean difference (original units)"
                : "Mean (original units)",
            },
          },
          {
            min: -0.5,
            max: 1.5,
            ticks: {
              stepSize: 0.5,
              autoSkip: false,
              callback: (v) =>
                v === 0 ? "Null claim" : v === 1 ? "Your sample" : "",
            },
            grid: { display: false },
          },
        ),
      },
    );
    estimateChart.options.plugins.legend.display = false;
    estimateChart.options.plugins.tooltip.callbacks.label = (context) =>
      `${context.dataset.label}: ${context.parsed.x.toFixed(4)}`;
    const nullChart = chart(isT ? "tChart" : "zChart", [
      "Null sampling distribution",
      "Selected p-value region",
      "Observed statistic",
    ]);
    nullChart.data.datasets[1].fill = "origin";
    nullChart.data.datasets[1].backgroundColor = "#b2463266";
    nullChart.data.datasets[2].borderColor = "#522d80";
    nullChart.data.datasets[2].borderDash = [6, 4];
    function update() {
      const sd = number("sigma"),
        n = number(independent ? "N1" : "N");
      const mean1 = number(independent ? "mu1" : "mu");
      const mean2 = number(independent ? "mu2" : "mu0");
      const result = independent
        ? StatsMath.independentSamples(mean1, mean2, sd, n, number("N2"))
        : StatsMath.oneSample(mean1, mean2, sd, n, knownSigma);
      const { statistic, se, df, tails } = result;
      const direction = alternative.value;
      for (const id of independent
        ? ["mu1", "mu2", "sigma", "N1", "N2"]
        : ["mu", "mu0", "sigma", "N"]) {
        get(id + "-value").textContent = get(id).value;
      }
      get("cohen-d-value").textContent = result.d.toFixed(2);
      if (isT) get("df-value").textContent = df;
      get(statisticName + "-value").textContent = statistic.toFixed(4);
      get(
        independent ? "one-tailed-p-value" : "p-value-one-sided",
      ).textContent = formatProbability(tails.upper);
      get(
        independent ? "two-tailed-p-value" : "p-value-two-sided",
      ).textContent = formatProbability(tails.twoSided);
      get("p-value-lower").textContent = formatProbability(tails.lower);
      get("p-value-selected").textContent = formatProbability(tails[direction]);
      get("se-value").textContent = se.toFixed(4);
      const difference = mean1 - mean2;
      get("calculation").textContent =
        `Your ${independent ? "mean difference" : "sample mean"} ${difference === 0 ? "matches the null value" : `is ${Math.abs(difference).toFixed(2)} units ${difference < 0 ? "below" : "above"} the null value`}. Dividing the signed difference by the ${isT ? "estimated " : ""}standard error ${se.toFixed(4)} gives ${statisticName} = ${statistic.toFixed(4)}. This is ${Math.abs(statistic).toFixed(2)} standard errors from the null. The p-value is the shaded area in plot 2, assuming the null hypothesis is true.`;
      const estimate = independent ? difference : mean1;
      const nullValue = independent ? 0 : mean2;
      estimateChart.data.datasets[0].data = [{ x: estimate, y: 1 }];
      estimateChart.data.datasets[1].data = [{ x: nullValue, y: 0 }];
      estimateChart.data.datasets[2].data = [
        { x: estimate - se, y: 1 },
        { x: estimate + se, y: 1 },
      ];
      estimateChart.data.datasets[3].data = [
        { x: estimate - se, y: 0.9 },
        { x: estimate - se, y: 1.1 },
        { x: estimate, y: null },
        { x: estimate + se, y: 0.9 },
        { x: estimate + se, y: 1.1 },
      ];
      const padding = Math.max(se, Math.abs(difference) * 0.15);
      estimateChart.options.scales.x.min =
        Math.min(nullValue, estimate - se) - padding;
      estimateChart.options.scales.x.max =
        Math.max(nullValue, estimate + se) + padding;
      estimateChart.update();
      const pdf = (x) =>
        isT ? jStat.studentt.pdf(x, df) : normalDensity(x, 0, 1);
      const extent = Math.max(5, Math.abs(statistic) * 1.1);
      // Include the peak and tail boundaries exactly, even for very large statistics.
      const coordinates = new Set(
        curvePoints(-extent, extent, pdf).map((p) => p.x),
      );
      curvePoints(-5, 5, pdf).forEach((p) => coordinates.add(p.x));
      coordinates.add(statistic);
      coordinates.add(-statistic);
      const points = [...coordinates]
        .sort((a, b) => a - b)
        .map((x) => ({ x, y: pdf(x) }));
      nullChart.data.datasets[0].data = points;
      nullChart.data.datasets[0].label = isT
        ? `H₀: Student's t, df = ${df}`
        : "H₀: standard normal Z";
      nullChart.data.datasets[1].data = points.map((p) => ({
        x: p.x,
        y: (
          direction === "upper"
            ? p.x >= statistic
            : direction === "lower"
              ? p.x <= statistic
              : Math.abs(p.x) >= Math.abs(statistic)
        )
          ? p.y
          : null,
      }));
      nullChart.data.datasets[1].label = `p-value region (${alternative.selectedOptions[0].textContent})`;
      nullChart.data.datasets[2].data = [
        { x: statistic, y: 0 },
        { x: statistic, y: pdf(0) },
      ];
      nullChart.data.datasets[2].label = `Observed ${statisticName} = ${statistic.toFixed(3)}`;
      nullChart.options.scales.x.title.text = statisticName + " statistic";
      nullChart.options.scales.x.min = -extent;
      nullChart.options.scales.x.max = extent;
      // Datasets contain {x,y} objects: only numeric y values enter the maximum.
      nullChart.options.scales.y.max =
        Math.max(...points.map((p) => p.y)) * 1.1;
      nullChart.update();
    }
    document
      .querySelectorAll('input[type="range"]')
      .forEach((slider) => slider.addEventListener("input", update));
    alternative.addEventListener("change", update);
    document.addEventListener("applet:state", update);
    update();
  });
}
