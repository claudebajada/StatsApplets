document.addEventListener('DOMContentLoaded', function() {
  // Define sliders and display elements
  const mu1Slider = document.getElementById('mu1');
  const mu1Value = document.getElementById('mu1-value');
  const mu2Slider = document.getElementById('mu2');
  const mu2Value = document.getElementById('mu2-value');
  const sigmaSlider = document.getElementById('sigma');
  const sigmaValue = document.getElementById('sigma-value');
  const N1Slider = document.getElementById('N1');
  const N1Value = document.getElementById('N1-value');
  const N2Slider = document.getElementById('N2');
  const N2Value = document.getElementById('N2-value');

  // Define chart contexts
  const populationCtx = document.getElementById('populationChart').getContext('2d');
  const stderrCtx = document.getElementById('stderrChart').getContext('2d');
  const tCtx = document.getElementById('tChart').getContext('2d');

  // Initialize charts
  let populationChart = createChart(populationCtx, ['Population 1', 'Population 2'], [{r: 0, g: 0, b: 255}, {r: 255, g: 0, b: 0}]);
  let stderrChart = createChart(stderrCtx, ['SEM Over Mean Difference'], [{r: 255, g: 0, b: 0}]);
  let tChart = createChart(tCtx, ['Null Hypothesis', 'Alternative Hypothesis'], [{r: 0, g: 0, b: 255}, {r: 255, g: 0, b: 0}]);


  function updateCharts() {
    // Get slider values
    const mu1 = parseFloat(mu1Slider.value);
    const mu2 = parseFloat(mu2Slider.value);
    const sigma = parseFloat(sigmaSlider.value);
    const N1 = parseInt(N1Slider.value);
    const N2 = parseInt(N2Slider.value);

    // Calculate statistics
    const pooledSD = calculatePooledSD(sigma, N1, N2);
    const SEM = pooledSD * Math.sqrt(1/N1 + 1/N2);
    const meanDifference = mu1 - mu2;
    const tValue = meanDifference / SEM;
    const df = (N1 + N2) - 2;

    // Calculate Two-Tailed p-value
    const twoTailedPValue = jStat.ttest(tValue, df, 2);

    // Calculate One-Tailed p-value (right tail)
    let oneTailedPValue;
    if (tValue < 0) {
      oneTailedPValue = 1;
    } else {
      oneTailedPValue = twoTailedPValue / 2;
    }


    // Update chart data
    updateNormalDistributionChart(populationChart, [mu1, mu2], sigma);
    updateNormalDistributionChart(stderrChart, [meanDifference], SEM);
    updateTDistributionChart(tChart, tValue, df);
    // updateTDistributionChart(tChart, [0, tValue], df);

    // Update displayed values
    updateDisplayedValues(mu1, mu2, sigma, N1, N2, pooledSD, df, oneTailedPValue, twoTailedPValue, tValue);

  }

  // Add event listeners to sliders
  [mu1Slider, mu2Slider, sigmaSlider, N1Slider, N2Slider].forEach(slider => slider.addEventListener('input', updateCharts));

  // Initial chart update
  updateCharts();
});

function createChart(ctx, labels, colorObjects) {
  const datasets = labels.map((label, index) => {
    const color = colorObjects[index];
    return {
      label: label,
      backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, 0.1)`,
      borderColor: `rgba(${color.r}, ${color.g}, ${color.b}, 1)`,
      data: []
    };
  });

  return initializeChart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({length: 80}, (_, i) => (i - 40) * 0.5),
      datasets: datasets
    },
    options: chartOptions(
      { type: 'linear', min: -20, max: 20 },
      { beginAtZero: true }
    )
  });
}

function calculatePooledSD(sigma, N1, N2) {
  return Math.sqrt(((N1 - 1) * sigma * sigma + (N2 - 1) * sigma * sigma) / (N1 + N2 - 2));
}

function updateNormalDistributionChart(chart, means, stdDev) {
  chart.data.datasets.forEach((dataset, index) => {
    dataset.data = chart.data.labels.map(x => normalDensity(parseFloat(x), means[index], stdDev));
  });
  chart.update();
}

function updateTDistributionChart(chart, tValue, df) {
  const xMin = -40;
  const xMax = 40;
  const step = 0.1;
  const labels = [];

  for (let x = xMin; x <= xMax; x += step) {
    labels.push(x.toFixed(2));
  }

  chart.data.labels = labels;

  // Null Hypothesis Dataset
  chart.data.datasets[0].data = [{ x: tValue, y: tDistributionDensity(tValue, df) }];

  // Alternative Hypothesis Dataset (shifted by tValue)
  chart.data.datasets[1].data = labels.map(x => tDistributionDensity(parseFloat(x), df));

  let overallMaxY = chart.data.datasets.reduce((max, dataset) => Math.max(max, Math.max(...dataset.data)), 0);

  chart.options.scales.x.min = xMin;
  chart.options.scales.x.max = xMax;
  chart.options.scales.y.min = 0;
  chart.options.scales.y.max = overallMaxY * 1.1;

  chart.update();

  // Update labels with current degrees of freedom and t-value
  chart.data.datasets[0].label = `Test Statistic`;
  chart.data.datasets[1].label = `Null Hypothesis (t(${df}))`;

  chart.update();  
  
}

// function updateTDistributionChart(chart, means, df) {
//   chart.data.datasets.forEach((dataset, index) => {
//     dataset.data = chart.data.labels.map(x => tDistributionDensity(parseFloat(x) - means[index], df));
//   });
//   chart.update();
// }

// function updateDisplayedValues(mu1, mu2, sigma, N1, N2, pooledSD, df, pValue) {
//   mu1Value.textContent = mu1.toFixed(2);
//   mu2Value.textContent = mu2.toFixed(2);
//   sigmaValue.textContent = sigma.toFixed(2);
//   N1Value.textContent = N1; // Update N1 value
//   N2Value.textContent = N2; // Update N2 value
//   document.getElementById('cohen-d-value').textContent = (Math.abs(mu1 - mu2) / pooledSD).toFixed(2);
//   document.getElementById('df-value').textContent = df;
//   document.getElementById('p-value').textContent = pValue.toFixed(4);
// }


function updateDisplayedValues(mu1, mu2, sigma, N1, N2, pooledSD, df, oneTailedPValue, twoTailedPValue, tValue) {
  document.getElementById('mu1-value').textContent = mu1.toFixed(2);
  document.getElementById('mu2-value').textContent = mu2.toFixed(2);
  document.getElementById('sigma-value').textContent = sigma.toFixed(2);
  document.getElementById('N1-value').textContent = N1;
  document.getElementById('N2-value').textContent = N2;
  document.getElementById('cohen-d-value').textContent = (Math.abs(mu1 - mu2) / pooledSD).toFixed(2);
  document.getElementById('df-value').textContent = df;
  document.getElementById('one-tailed-p-value').textContent = oneTailedPValue.toFixed(4);
  document.getElementById('two-tailed-p-value').textContent = twoTailedPValue.toFixed(4);
  document.getElementById('t-value').textContent = `t-value: ${tValue.toFixed(4)}`;
}


function tDistributionDensity(t, df) {
  const numerator = jStat.gammafn((df + 1) / 2);
  const denominator = Math.sqrt(df * Math.PI) * jStat.gammafn(df / 2);
  const term = Math.pow(1 + (t * t) / df, -(df + 1) / 2);
  return numerator / denominator * term;
}

