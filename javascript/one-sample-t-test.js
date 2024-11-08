document.addEventListener('DOMContentLoaded', function() {
  // Define sliders and display elements
  const muSlider = document.getElementById('mu');
  const muValue = document.getElementById('mu-value');
  const sigmaSlider = document.getElementById('sigma');
  const sigmaValue = document.getElementById('sigma-value'); 
  const NSlider = document.getElementById('N');
  const NValue = document.getElementById('N-value');
  const mu0Slider = document.getElementById('mu0');
  const mu0Value = document.getElementById('mu0-value');

  // Define chart contexts
  const populationCtx = document.getElementById('populationChart').getContext('2d');
  const stderrCtx = document.getElementById('stderrChart').getContext('2d');
  const tCtx = document.getElementById('tChart').getContext('2d');

  let xAxisOptions = { type: 'linear', min: -10, max: 10 };
  let yAxisOptions = { beginAtZero: true, max: 0.42 };

  // Initialize charts
  let populationChart = initializeChart(populationCtx, 'Estimated Population', 'rgba(0, 0, 255, 0.5)', 'blue', xAxisOptions, yAxisOptions);
  let stderrChart = initializeChart(stderrCtx, 'Standard Error', 'rgba(255, 0, 0, 0.5)', 'red', xAxisOptions, yAxisOptions);
  
  // Initialize tChart with Null Hypothesis and Test Statistic
  let tChart = new Chart(tCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Test Statistic',
          backgroundColor: 'rgba(255, 0, 255, 0.1)',
          borderColor: 'rgba(255, 0, 255, 1)',
          pointRadius: 5,  // Visible point for Test Statistic
          showLine: false, // Disable line for this dataset
          data: []         // Single point for the Test Statistic
                    
        },
        {
          label: 'Null Hypothesis',
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

  function updateCharts() {
    const mu = parseFloat(muSlider.value);
    const sigma = parseFloat(sigmaSlider.value);
    const N = parseInt(NSlider.value);
    const SEM = sigma / Math.sqrt(N);
    const mu0 = parseFloat(mu0Slider.value);
    const df = N - 1;

    const tValue = (mu - mu0) / SEM;
    const cohenD = calculateCohensD(mu, mu0, sigma);

    // Update displayed values
    document.getElementById('cohen-d-value').textContent = cohenD.toFixed(2);
    document.getElementById('df-value').textContent = df;
    muValue.textContent = mu.toFixed(2);
    mu0Value.textContent = mu0.toFixed(2);
    sigmaValue.textContent = sigma.toFixed(2);
    NValue.textContent = N;

    // Update charts
    updateNormalDistributionChart(populationChart, mu, sigma, 0);
    updateNormalDistributionChart(stderrChart, (mu - mu0), SEM, 0);
    updateTDistributionChart(tChart, tValue, df);

    // Calculate and display p-values
    const { oneTailedPValue, twoTailedPValue } = calculatePValue(tValue, df);
    document.getElementById('t-value').textContent = `t-value: ${tValue.toFixed(4)}`;
    document.getElementById('p-value-one-sided').textContent = oneTailedPValue.toFixed(4);
    document.getElementById('p-value-two-sided').textContent = twoTailedPValue.toFixed(4);
  }

  function calculateCohensD(mu, mu0, sigma) {
    return Math.abs(mu - mu0) / sigma;
  }

  function calculatePValue(tScore, df) {
    const oneTailedPValue = tScore >= 0 ? 1 - jStat.studentt.cdf(tScore, df) : 1;
    const twoTailedPValue = tScore >= 0 ? 2 * (1 - jStat.studentt.cdf(tScore, df)) : 2 * jStat.studentt.cdf(tScore, df);
    return { oneTailedPValue, twoTailedPValue };
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

  function updateTDistributionChart(chart, tValue, df) {
    const xMin = -40;
    const xMax = 40;
    const step = 0.1;
    const labels = [];
    const nullHypothesisData = [];

    for (let x = xMin; x <= xMax; x += step) {
      labels.push(x.toFixed(2));
      nullHypothesisData.push(tDistributionDensity(x, df));
    }

    // Set Test Statistic as a single point
    chart.data.datasets[0].data = [{ x: tValue, y: tDistributionDensity(tValue, df) }];
    
    chart.data.labels = labels;
    chart.data.datasets[1].data = nullHypothesisData;


    chart.update();
  }

  function tDistributionDensity(t, df) {
    const numerator = jStat.gammafn((df + 1) / 2);
    const denominator = Math.sqrt(df * Math.PI) * jStat.gammafn(df / 2);
    const term = Math.pow(1 + (t * t) / df, -(df + 1) / 2);
    return numerator / denominator * term;
  }

  function initializeChart(ctx, label, backgroundColor, borderColor, xAxisOptions, yAxisOptions) {
    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: label,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          data: []
        }]
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
  }

  function addSliderListener(id, updateFunction) {
    document.getElementById(id).addEventListener('input', updateFunction);
  }

  function normalDensity(x, mean, stdDev) {
    const exponent = -((x - mean) ** 2) / (2 * stdDev ** 2);
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
  }

  // Attach event listeners to sliders
  addSliderListener('mu', updateCharts);
  addSliderListener('sigma', updateCharts);
  addSliderListener('N', updateCharts);
  addSliderListener('mu0', updateCharts);

  updateCharts();
});

