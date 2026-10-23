document.addEventListener("DOMContentLoaded", function () {
  const pSlider = document.getElementById("p");
  const nSlider = document.getElementById("n");
  const pValueDisplay = document.getElementById("p-value");
  const nValueDisplay = document.getElementById("n-value");

  const coeffCtx = document.getElementById("coeffChart").getContext("2d");
  const probTermCtx = document.getElementById("probTermChart").getContext("2d");
  const fullDistCtx = document.getElementById("fullDistChart").getContext("2d");

  // Initialize Charts
  let coeffChart = initializeChart(coeffCtx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Number of arrangements",
          data: [],
          backgroundColor: chartPalette[0] + "cc",
        },
      ],
    },
    options: commonChartOptions("Arrangements"),
  });

  let probTermChart = initializeChart(probTermCtx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Probability of one arrangement",
          data: [],
          backgroundColor: chartPalette[1] + "cc",
        },
      ],
    },
    options: commonChartOptions("Probability"),
  });

  let fullDistChart = initializeChart(fullDistCtx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Binomial probability",
          data: [],
          backgroundColor: chartPalette[2] + "cc",
        },
      ],
    },
    options: commonChartOptions("Probability"),
  });

  function commonChartOptions(yTitle) {
    return {
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: yTitle },
        },
        x: {
          type: "linear",
          title: { display: true, text: "Successes k" },
          ticks: {
            stepSize: 1,
            callback: function (val) {
              return Number.isInteger(val) ? val : null;
            },
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    };
  }

  function updateCharts() {
    const p = parseFloat(pSlider.value);
    const n = parseInt(nSlider.value);
    const selectedControl = document.getElementById("k");
    selectedControl.max = String(n);
    const selected = Math.min(n, Number(selectedControl.value));
    selectedControl.value = selected;
    document.getElementById("k-value").textContent = selected;

    pValueDisplay.textContent = p.toFixed(2);
    nValueDisplay.textContent = n;

    const kValues = Array.from({ length: n + 1 }, (_, i) => i);
    const binomialCoeff = [];
    const probabilityTerm = [];
    const fullDistribution = [];

    kValues.forEach((k) => {
      const coeff = combinations(n, k);
      const probTerm = Math.pow(p, k) * Math.pow(1 - p, n - k);
      const fullProb = coeff * probTerm;

      binomialCoeff.push(coeff);
      probabilityTerm.push(probTerm);
      fullDistribution.push(fullProb);
    });

    // Update Coefficient Chart
    coeffChart.data.labels = kValues;
    coeffChart.data.datasets[0].data = binomialCoeff;
    coeffChart.update();

    // Update Probability Term Chart
    probTermChart.data.labels = kValues;
    probTermChart.data.datasets[0].data = probabilityTerm;
    probTermChart.update();

    // Update Full Distribution Chart
    fullDistChart.data.labels = kValues;
    fullDistChart.data.datasets[0].data = fullDistribution;
    for (const chart of [coeffChart,probTermChart,fullDistChart]) {
      chart.data.datasets[0].backgroundColor = kValues.map(k => k === selected ? chartPalette[3] : chartPalette[0]+"aa");
      chart.update();
    }
    const result=LearningMath.binomialSelection(n,p,selected);
    document.dispatchEvent(new CustomEvent("applet:render",{detail:{kind:"binomial-components-explorer",n,p,k:selected,result}}));
    window.syncRangeNumbers?.();
  }

  pSlider.addEventListener("input", updateCharts);
  nSlider.addEventListener("input", updateCharts);
  document.getElementById("k").addEventListener("input", updateCharts);

  document.addEventListener("applet:state", updateCharts);
  updateCharts();
});
