document.addEventListener("DOMContentLoaded", function () {
  const dfSlider = document.getElementById("df-slider");
  const dfValue = document.getElementById("df-value");
  const chartCtx = document
    .getElementById("distributionChart")
    .getContext("2d");
  const labels = Array.from({ length: 280 }, (_, i) => -7 + (i * 14) / 279);
  let distributionChart = initializeChart(chartCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Standard normal",
          backgroundColor: chartPalette[0] + "22",
          borderColor: chartPalette[0],
          borderWidth: 2,
          data: [],
        },
        {
          label: "Student's t",
          backgroundColor: chartPalette[1] + "22",
          borderColor: chartPalette[1],
          borderWidth: 2,
          borderDash: [6, 4],
          data: [],
        },
      ],
    },
    options: chartOptions(
      {
        type: "linear",
        min: -7,
        max: 7,
        title: { display: true, text: "Standardised score" },
      },
      {
        beginAtZero: true,
        title: { display: true, text: "Probability density" },
      },
    ),
  });

  function updateChart() {
    const df = parseInt(dfSlider.value);
    dfValue.textContent = df;
    updateDistributionChart(distributionChart, df);
    document.dispatchEvent(
      new CustomEvent("applet:render", {
        detail: { kind: "t-distribution-explorer", df },
      }),
    );
  }

  dfSlider.addEventListener("input", updateChart);
  document.addEventListener("applet:state", updateChart);
  updateChart();
});

function updateDistributionChart(chart, df) {
  chart.data.datasets[0].data = chart.data.labels.map((x) =>
    normalDensity(x, 0, 1),
  );
  chart.data.datasets[1].data = chart.data.labels.map((x) =>
    tDistributionDensity(x, df),
  );
  chart.update();
}

function tDistributionDensity(t, df) {
  return jStat.studentt.pdf(t, df);
}
