// binomial-normal-explorer.js
document.addEventListener('DOMContentLoaded', function() {
  const thetaSlider = document.getElementById('theta');
  const NSlider = document.getElementById('N');
  const thetaValue = document.getElementById('theta-value');
  const NValue = document.getElementById('N-value');
  const muText = document.getElementById('mu-value');
  const sigmaText = document.getElementById('sigma-value');
  const ctx = document.getElementById('binomialChart').getContext('2d');
  const normalCtx = document.getElementById('normalChart').getContext('2d');

  // Initialize the binomial chart
  let binomialChart = initializeChart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Probability',
        data: [],
        backgroundColor: 'blue'
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 1
        },
        x: {
          type: 'linear',
          ticks: {
            stepSize: 1,
            callback: function(val, index) {
              return Number.isInteger(val) ? val : null;
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });

  // Initialize the normal chart
  let normalChart = initializeChart(normalCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Normal Approximation',
        data: [],
        backgroundColor: 'rgba(0, 0, 255, 0.4)',
        borderColor: 'blue',
        fill: true
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 1
        },
        x: {
          type: 'linear',
          ticks: {
            stepSize: 1,
            callback: function(val, index) {
              return Number.isInteger(val) ? val : null;
            }
          }          
        },
        yAxes: [{
          ticks: {
            suggestedMax: 1
          }
        }]
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });

  function updateDisplayedValues() {
    thetaValue.textContent = thetaSlider.value; // Update displayed theta value
    NValue.textContent = NSlider.value; // Update displayed N value
  }

  function updateCharts() {
    updateDisplayedValues();
    const N = parseInt(NSlider.value);
    const theta = parseFloat(thetaSlider.value);
    const mu = N * theta;
    const sigma = Math.sqrt(N * theta * (1 - theta));
    const xMin = mu - 5 * sigma;  
    const xMax = mu + 5 * sigma;
    const normalStep = 0.1;
    const normalLabels = [];
    const normalData = [];
    const binomialLabels = Array.from({ length: N + 1 }, (_, i) => i);
    const binomialData = [];  

    // Generate data for normal distribution
    for (let x = xMin; x <= xMax; x += normalStep) {  
      normalLabels.push(x.toFixed(2));
      normalData.push(normalDensity(x, mu, sigma));  
    }

    // Generate data for binomial distribution
    for (let x = 0; x <= N; x++) {
      binomialData.push(combinations(N, x) * Math.pow(theta, x) * Math.pow(1 - theta, N - x));  
    }

    // Set the same x-axis min and max for both charts
    const commonXAxis = {
      min: Math.floor(xMin),
      max: Math.ceil(xMax),
      type: 'linear',
      ticks: {
        stepSize: 1,
        callback: function(val, index) {
          return Number.isInteger(val) ? val : null;
        }  
      }
    };

    // Update binomial chart
    binomialChart.data.labels = binomialLabels;
    binomialChart.data.datasets[0].data = binomialData;
    binomialChart.options.scales.x = commonXAxis;
    binomialChart.update();

    // Update normal chart  
    normalChart.data.labels = normalLabels;  
    normalChart.data.datasets[0].data = normalData;
    normalChart.options.scales.x = commonXAxis;
    normalChart.update();

    // Update displayed mu and sigma
    muText.textContent = mu.toFixed(2);
    sigmaText.textContent = sigma.toFixed(2);  
  }

  // Attach event listeners to sliders
  thetaSlider.addEventListener('input', updateCharts);
  NSlider.addEventListener('input', updateCharts);

  // Initialize charts
  updateCharts();
});

