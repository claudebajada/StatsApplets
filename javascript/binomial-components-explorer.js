document.addEventListener('DOMContentLoaded', function() {
  const pSlider = document.getElementById('p');
  const nSlider = document.getElementById('n');
  const pValueDisplay = document.getElementById('p-value');
  const nValueDisplay = document.getElementById('n-value');

  const coeffCtx = document.getElementById('coeffChart').getContext('2d');
  const probTermCtx = document.getElementById('probTermChart').getContext('2d');
  const fullDistCtx = document.getElementById('fullDistChart').getContext('2d');

  // Initialize Charts
  let coeffChart = initializeChart(coeffCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Binomial Coefficient',
        data: [],
        backgroundColor: 'rgba(0, 123, 255, 0.7)'
      }]
    },
    options: commonChartOptions()
  });

  let probTermChart = initializeChart(probTermCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Probability Term',
        data: [],
        backgroundColor: 'rgba(255, 193, 7, 0.7)'
      }]
    },
    options: commonChartOptions()
  });

  let fullDistChart = initializeChart(fullDistCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Binomial Distribution',
        data: [],
        backgroundColor: 'rgba(40, 167, 69, 0.7)'
      }]
    },
    options: commonChartOptions()
  });

  function commonChartOptions() {
    return {
      scales: {
        y: {
          beginAtZero: true
        },
        x: {
          type: 'linear',
          ticks: {
            stepSize: 1,
            callback: function(val) {
              return Number.isInteger(val) ? val : null;
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }

  function updateCharts() {
    const p = parseFloat(pSlider.value);
    const n = parseInt(nSlider.value);

    pValueDisplay.textContent = p.toFixed(2);
    nValueDisplay.textContent = n;

    const kValues = Array.from({ length: n + 1 }, (_, i) => i);
    const binomialCoeff = [];
    const probabilityTerm = [];
    const fullDistribution = [];

    kValues.forEach(k => {
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
    fullDistChart.update();
  }

  pSlider.addEventListener('input', updateCharts);
  nSlider.addEventListener('input', updateCharts);

  updateCharts();
});

