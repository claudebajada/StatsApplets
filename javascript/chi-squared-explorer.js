document.addEventListener("DOMContentLoaded", () => {
  const get = (id) => document.getElementById(id);
  const frequencyChart = initializeChart(
    get("frequencyChart").getContext("2d"),
    {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Expected under uniform H₀",
            backgroundColor: "#2456a6",
            data: [],
          },
          {
            label: "Observed integer counts",
            backgroundColor: chartPalette[1],
            data: [],
          },
        ],
      },
      options: chartOptions(
        {},
        { beginAtZero: true, title: { display: true, text: "Frequency" } },
      ),
    },
  );
  const distribution = initializeChart(
    get("chiSquaredChart").getContext("2d"),
    {
      type: "line",
      data: {
        datasets: [
          lineDataset("Null χ² distribution"),
          {
            ...lineDataset("Upper-tail p-value", [], chartPalette[1]),
            fill: "origin",
          },
          {
            ...lineDataset("Observed χ²", [], chartPalette[3]),
            borderDash: [6, 4],
          },
        ],
      },
      options: chartOptions(
        {
          type: "linear",
          min: 0,
          title: { display: true, text: "χ² statistic" },
        },
        {
          beginAtZero: true,
          title: { display: true, text: "Probability density" },
        },
      ),
    },
  );
  function update() {
    const categories = Number(get("categories").value),
      n = Number(get("total-observations").value),
      skew = Number(get("skew").value);
    const { expected, observed } = StatsMath.generateFrequencies(
      categories,
      n,
      skew,
    );
    const { statistic, df, w, p } = StatsMath.chiSquared(expected, observed);
    for (const [id, value] of Object.entries({
      "categories-value": categories,
      "total-observations-value": n,
      "skew-value": skew,
      "effect-size-value": w.toFixed(4),
      "chi-squared-value": statistic.toFixed(4),
      "p-value": formatProbability(p),
    }))
      get(id).textContent = value;
    get("validity-warning").textContent = expected.some((e) => e < 5)
      ? "Expected counts are below 5. The chi-squared approximation may give an unreliable p-value. Consider an exact multinomial test or a simulation-based goodness-of-fit test."
      : "Expected counts are all at least 5. The χ² approximation also assumes independent observations and categories fixed in advance.";
    frequencyChart.data.labels = expected.map((_, i) => `Category ${i + 1}`);
    frequencyChart.data.datasets[0].data = expected;
    frequencyChart.data.datasets[1].data = observed;
    frequencyChart.update();
    const max = Math.max(jStat.chisquare.inv(0.995, df), statistic * 1.15);
    // χ² with df=1 has infinite density at zero. Start just above zero.
    const points = curvePoints(max / 10000, max, (x) =>
      jStat.chisquare.pdf(x, df),
    );
    if (statistic > 0)
      points.push({ x: statistic, y: jStat.chisquare.pdf(statistic, df) });
    points.sort((a, b) => a.x - b.x);
    const height = Math.max(...points.map((p) => p.y));
    distribution.data.datasets[0].data = points;
    distribution.data.datasets[0].label = `H₀: χ² with df = ${df}`;
    distribution.data.datasets[1].data = points.map((p) => ({
      x: p.x,
      y: p.x >= statistic ? p.y : null,
    }));
    distribution.data.datasets[2].data = [
      { x: statistic, y: 0 },
      { x: statistic, y: height },
    ];
    distribution.options.scales.x.max = max;
    distribution.update();
    document.dispatchEvent(new CustomEvent("applet:render",{detail:{kind:"chi-squared-explorer",categories,n,skew,expected,observed,result:{statistic,df,w,p}}}));
  }
  ["categories", "total-observations", "skew"].forEach((id) =>
    addSliderListener(id, update),
  );
  document.addEventListener("applet:state", update);
  update();
});
