// Start with paired observations; expose the vector calculation only on request.
document.addEventListener("DOMContentLoaded", () => {
  const get = (id) => document.getElementById(id);
  const walkthrough = createCorrelationWalkthrough();
  const scatter = initializeChart(get("pairsChart").getContext("2d"), {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Paired observation",
          data: [],
          pointRadius: 6,
          pointHoverRadius: 8,
          backgroundColor: chartPalette[0],
        },
      ],
    },
    options: chartOptions(
      { type: "linear", title: { display: true, text: "x" } },
      { type: "linear", title: { display: true, text: "y" } },
    ),
  });
  scatter.options.plugins.legend.display = false;
  scatter.options.plugins.tooltip.callbacks.label = (c) =>
    `x = ${c.parsed.x.toFixed(3)}, y = ${c.parsed.y.toFixed(3)}`;
  get("resample").textContent = "New pattern";
  const format = (n) => (Math.abs(n) < 0.00005 ? "0.0000" : n.toFixed(4));
  function update() {
    const manual = get("dataMode").value === "manual";
    for (const id of ["association", "observations", "seed"])
      get(id).disabled = manual;
    get("pairs").disabled = !manual;
    get("resample").hidden = manual;
    let pairs;
    try {
      pairs = manual
        ? TeachingMath.parsePairs(get("pairs").value, 3)
        : TeachingMath.correlationSample(
            Number(get("observations").value),
            Number(get("association").value),
            Number(get("seed").value),
          );
    } catch (error) {
      inputWarning("Enter at least three valid x, y pairs. " + error.message);
      return;
    }
    inputWarning();
    const x = pairs.map((p) => p[0]),
      y = pairs.map((p) => p[1]);
    const r = StatsMath.pearson(x, y);
    get("data-pearson-value").textContent =
      r === null ? "Undefined" : format(r);
    get("pair-count").textContent = pairs.length;
    get("calculation").textContent =
      r === null
        ? "Pearson's r is undefined because at least one variable has zero variance. All its values are equal. There is no variation to compare. Change those values to explore an association."
        : Math.abs(r) < 1e-10
          ? "r = 0. These points have no linear association. This does not rule out a curved relationship. Correlation alone cannot show that one variable causes the other."
          : `r = ${format(r)}. ${r > 0 ? "Higher x values tend to go with higher y values" : "Higher x values tend to go with lower y values"}. ${Math.abs(r) > 0.999999 ? "All points lie on a straight line." : "Values closer to −1 or +1 indicate a tighter straight-line pattern."} Correlation alone cannot show causation.`;
    walkthrough.update(pairs);
    scatter.data.datasets[0].data = pairs.map(([x, y]) => ({ x, y }));
    scatter.update();
  }
  watchControls(update);
  update();
});
