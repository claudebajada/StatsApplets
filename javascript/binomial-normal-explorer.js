document.addEventListener("DOMContentLoaded", () => {
  const get = (id) => document.getElementById(id);
  const binomial = initializeChart(get("binomialChart").getContext("2d"), {
    type: "bar",
    data: { datasets: [] },
    options: chartOptions(
      { type: "linear", title: { display: true, text: "Success count k" } },
      { beginAtZero: true, title: { display: true, text: "Probability" } },
    ),
  });
  const normal = initializeChart(get("normalChart").getContext("2d"), {
    type: "line",
    data: { datasets: [] },
    options: chartOptions(
      { type: "linear", title: { display: true, text: "Success count" } },
      {
        beginAtZero: true,
        title: { display: true, text: "Probability density" },
      },
    ),
  });
  function update() {
    const n = Number(get("N").value),
      p = Number(get("theta").value);
    get("k").max = String(n);
    const k = Math.min(n, Number(get("k").value));
    get("k").value = k;
    for (const id of ["N", "theta", "k"])
      get(id + "-value").textContent = get(id).value;
    const result = LearningMath.binomialSelection(n, p, k),
      { mean, sd } = result;
    get("mu-value").textContent = mean.toFixed(2);
    get("sigma-value").textContent = sd.toFixed(2);
    get("approximation-warning").textContent = result.warning;
    const points = Array.from({ length: n + 1 }, (_, x) => ({
      x,
      y: StatsMath.binomialPMF(n, p, x),
    }));
    binomial.data.datasets = [
      {
        label: "Exact binomial probabilities",
        data: points,
        backgroundColor: points.map((point) =>
          point.x === k ? chartPalette[1] : chartPalette[0] + "bb",
        ),
        borderColor: chartPalette[0],
        borderWidth: 1,
      },
    ];
    const lo = sd > 0 ? Math.min(-0.5, mean - 4.5 * sd) : mean - 1;
    const hi = sd > 0 ? Math.max(n + 0.5, mean + 4.5 * sd) : mean + 1;
    const density =
      sd > 0
        ? curvePoints(lo, hi, (x) => StatsMath.normalDensity(x, mean, sd), 601)
        : [];
    if (sd > 0)
      for (const x of [k - 0.5, k + 0.5])
        density.push({ x, y: StatsMath.normalDensity(x, mean, sd) });
    density.sort((a, b) => a.x - b.x);
    normal.data.datasets = [
      lineDataset("Normal density", density),
      {
        ...lineDataset(
          "Area for selected k ± 0.5",
          density.map((point) => ({
            x: point.x,
            y: point.x >= k - 0.5 && point.x <= k + 0.5 ? point.y : null,
          })),
          chartPalette[1],
        ),
        fill: "origin",
      },
    ];
    // Fit the meaningful central range; distant impossible tails need no empty canvas.
    const axisLow =
      sd > 0 ? Math.max(-0.5, Math.floor(mean - 4.5 * sd)) : mean - 1;
    const axisHigh =
      sd > 0 ? Math.min(n + 0.5, Math.ceil(mean + 4.5 * sd)) : mean + 1;
    for (const chart of [binomial, normal]) {
      chart.options.scales.x.min = Math.min(axisLow, k - 0.5);
      chart.options.scales.x.max = Math.max(axisHigh, k + 0.5);
      chart.update();
    }
    document.dispatchEvent(
      new CustomEvent("applet:render", {
        detail: { kind: "binomial-normal-explorer", n, p, k, result },
      }),
    );
    window.syncRangeNumbers?.();
  }
  for (const id of ["N", "theta", "k"])
    get(id).addEventListener("input", update);
  document.addEventListener("applet:state", update);
  update();
});
