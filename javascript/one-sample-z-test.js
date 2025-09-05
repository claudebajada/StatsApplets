document.addEventListener('DOMContentLoaded', function() {
  const muSlider = document.getElementById('mu');
  const muValue = document.getElementById('mu-value');
  const sigmaSlider = document.getElementById('sigma');
  const sigmaValue = document.getElementById('sigma-value'); 
  const NSlider = document.getElementById('N');
  const NValue = document.getElementById('N-value');
  const populationCtx = document.getElementById('populationChart').getContext('2d');
  const stderrCtx = document.getElementById('stderrChart').getContext('2d');
  const zCtx = document.getElementById('zChart').getContext('2d');
  const mu0Slider = document.getElementById('mu0');
  const mu0Value = document.getElementById('mu0-value');

  let xAxisOptions = { type: 'linear', min: -10, max: 10 };
  let yAxisOptions = { beginAtZero: true, max: 0.5 };

  let populationChart = initializeChart(populationCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Population with Estimated Mean',
        backgroundColor: 'rgba(0, 0, 255, 0.5)',
        borderColor: 'blue',
        data: []
      }]
    },
    options: chartOptions(xAxisOptions, yAxisOptions)
  });
  let stderrChart = initializeChart(stderrCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Standard Error (around mean difference)',
        backgroundColor: 'rgba(255, 0, 0, 0.5)',
        borderColor: 'red',
        data: []
      }]
    },
    options: chartOptions(xAxisOptions, yAxisOptions)
  });
 
  let zChart = new Chart(zCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Test Statistic',
          backgroundColor: 'rgba(255, 0, 255, 0.1)',
          borderColor: 'rgba(255, 0, 255, 1)',
          pointRadius: 5,   // Visible point for z-value
          showLine: false,  // Disable line for this dataset (single point)
          data: []          // Single point for the z-value                 
        },
        {
          label: 'Null Hypothesis ~ Normal(0,1)',
          backgroundColor: 'rgba(0, 255, 0, 0.1)',
          borderColor: 'rgba(0, 255, 0, 1)',
          data: []
        }
      ]
    },
    options: {
      scales: {
        x: xAxisOptions,
        y: yAxisOptions
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });

  function calculateCohensD(mu, mu0, sigma) {
    return Math.abs(mu - mu0) / sigma;
  }

  function updateCharts() {
    const mu = parseFloat(muSlider.value);
    const sigma = parseFloat(sigmaSlider.value);
    const N = parseInt(NSlider.value);
    const SEM = sigma / Math.sqrt(N);
    const mu0 = parseFloat(mu0Slider.value);

    const zValue = (mu - mu0) / SEM;
    const cohenD = calculateCohensD(mu, mu0, sigma);

    // Update displayed values
    document.getElementById('cohen-d-value').textContent = cohenD.toFixed(2);
    muValue.textContent = mu.toFixed(2);
    mu0Value.textContent = mu0.toFixed(2);
    sigmaValue.textContent = sigma.toFixed(2);
    NValue.textContent = N;

    // Update charts
    updateNormalDistributionChart(populationChart, mu, sigma, 0);
    updateNormalDistributionChart(stderrChart, (mu - mu0), SEM, 0);
    updateZDistributionChart(zChart, zValue);

    // Calculate and display p-values
    const { pValueOneTailed, pValueTwoTailed } = calculatePValue(zValue);
    document.getElementById('z-value').textContent = `z-value: ${zValue.toFixed(4)}`;
    document.getElementById('p-value-one-sided').textContent = pValueOneTailed.toFixed(4);
    document.getElementById('p-value-two-sided').textContent = pValueTwoTailed.toFixed(4);
  }

  function calculatePValue(zScore) {
    const pValueOneTailed = 1 - jStat.normal.cdf(Math.abs(zScore), 0, 1);
    const pValueTwoTailed = 2 * (1 - jStat.normal.cdf(Math.abs(zScore), 0, 1));
    return { pValueOneTailed, pValueTwoTailed };
  }

  function updateNormalDistributionChart(chart, mean, stdDev, datasetIndex) {
    const xMin = -40;
    const xMax = 40;
    const step = 0.1;
    const labels = [];
    const data = [];

    for (let x = xMin; x <= xMax; x += step) {
      labels.push(x.toFixed(2));
      data.push(normalDensity(x, mean, stdDev));
    }

    chart.data.labels = labels;
    chart.data.datasets[datasetIndex].data = data;
    let overallMaxY = Math.max(...data);
    chart.options.scales.y.max = overallMaxY * 1.1;

    chart.update();
  }

  function updateZDistributionChart(chart, zValue) {
    const xMin = -40;
    const xMax = 40;
    const step = 0.1;
    const labels = [];
    const nullHypothesisData = [];

    for (let x = xMin; x <= xMax; x += step) {
      labels.push(x.toFixed(2));
      nullHypothesisData.push(normalDensity(x, 0, 1));
    }

    chart.data.labels = labels;

    // Set z-value as a single point
    chart.data.datasets[0].data = [{ x: zValue, y: normalDensity(zValue, 0, 1) }];
    chart.data.datasets[0].label = `Test Statistic z = ${zValue.toFixed(2)}`;

    chart.data.datasets[1].data = nullHypothesisData;

    chart.update();
  }

  // Attach event listeners to sliders
  addSliderListener('mu', updateCharts);
  addSliderListener('sigma', updateCharts);
  addSliderListener('N', updateCharts);
  addSliderListener('mu0', updateCharts);

  updateCharts();
});

