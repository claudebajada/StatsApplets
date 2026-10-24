document.addEventListener("DOMContentLoaded", () => {
  const get = (id) => document.getElementById(id);
  const chart = initializeChart(get("distributionChart").getContext("2d"), {
    type: "line",
    data: {
      datasets: [
        lineDataset("Null F distribution"),
        {
          ...lineDataset("Upper 5% rejection region", [], chartPalette[1]),
          fill: "origin",
        },
        {
          ...lineDataset("Critical F at α = 0.05", [], chartPalette[3]),
          borderDash: [6, 4],
        },
      ],
    },
    options: chartOptions(
      {
        type: "linear",
        min: 0,
        title: {
          display: true,
          text: "F statistic",
        },
      },
      {
        beginAtZero: true,
        title: { display: true, text: "Probability density" },
      },
    ),
  });
  function update() {
    const df1 = Number(get("df1-slider").value),
      df2 = Number(get("df2-slider").value);
    const { critical, max, points } = StatsMath.fPlot(df1, df2);
    get("df1-value").textContent = df1;
    get("df2-value").textContent = df2;
    get("critical-value").textContent = critical.toFixed(3);
    chart.data.datasets[0].data = points;
    chart.data.datasets[1].data = points.map((p) => ({
      x: p.x,
      y: p.x >= critical ? p.y : null,
    }));
    chart.data.datasets[2].data = [
      { x: critical, y: 0 },
      { x: critical, y: Math.max(...points.map((p) => p.y)) },
    ];
    const log = get("log-axis").checked;
    chart.data.datasets[1].fill = log ? false : "origin";
    chart.data.datasets[1].label = log
      ? "Upper tail (screen area is not probability)"
      : "Upper 5% rejection region";
    chart.options.scales.x.type = log ? "logarithmic" : "linear";
    chart.options.scales.x.min = log ? points[0].x : 0;
    chart.options.scales.x.max = max;
    chart.options.scales.x.title.text = log
      ? "F statistic, logarithmic scale"
      : "F statistic";
    chart.update();
    document.dispatchEvent(
      new CustomEvent("applet:render", {
        detail: { kind: "f-distribution-explorer", df1, df2, critical, log },
      }),
    );
    get("plot-note").textContent =
      `The plot extends to F = ${max.toFixed(2)}, at least the 99th percentile. The critical value ${critical.toFixed(3)} leaves 5% probability to its right, including the tail beyond the plot. With fewer than two numerator degrees of freedom, the density grows without limit near zero. The curve omits that endpoint. Select a logarithmic axis to inspect the long tail. ${log ? "Logarithmic spacing changes screen areas, so the tail fill is removed: the visible area is not a probability." : "On this linear axis, probability corresponds to area under the density."}`;
  }
  ["df1-slider", "df2-slider"].forEach((id) => addSliderListener(id, update));
  get("log-axis").addEventListener("change", update);
  document.addEventListener("applet:state", update);
  update();
});
