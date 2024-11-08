document.addEventListener('DOMContentLoaded', function() {
  const categoriesSlider = document.getElementById('categories');
  const totalObservationsSlider = document.getElementById('total-observations');
  const skewSlider = document.getElementById('skew');
  const frequencyChartCtx = document.getElementById('frequencyChart').getContext('2d');
  const chiSquaredChartCtx = document.getElementById('chiSquaredChart').getContext('2d');

  let frequencyChart = initializeFrequencyChart(frequencyChartCtx);
  let chiSquaredChart = initializeChiSquaredChart(chiSquaredChartCtx);

  function updateCharts() {
    const numCategories = parseInt(categoriesSlider.value);
    const totalObservations = parseInt(totalObservationsSlider.value);
    const skew = parseFloat(skewSlider.value);
  
    const { expected, observed } = generateFrequencies(numCategories, totalObservations, skew);
    const chiSquared = calculateChiSquared(expected, observed);
    const df = numCategories - 1;

    updateFrequencyChart(frequencyChart, expected, observed);
    updateChiSquaredChart(chiSquaredChart, chiSquared, df);

    // Calculate effect size and p-value
    const effectSize = Math.sqrt(chiSquared / (totalObservations * (Math.min(numCategories, 2) - 1)));
    const pValue = 1 - jStat.chisquare.cdf(chiSquared, df);

    // Update displayed values
    updateDisplayedValues(effectSize, chiSquared, pValue, numCategories, totalObservations);
  }

  [categoriesSlider, totalObservationsSlider, skewSlider].forEach(slider => slider.addEventListener('input', updateCharts));

  // Initial call to update charts and displayed values
  updateCharts();

  function updateDisplayedValues(effectSize, chiSquared, pValue, numCategories, totalObservations) {
    document.getElementById('effect-size-value').textContent = effectSize.toFixed(4);
    document.getElementById('chi-squared-value').textContent = chiSquared.toFixed(4);
    document.getElementById('p-value').textContent = pValue.toFixed(4);
    document.getElementById('categories-value').textContent = numCategories.toString();
    document.getElementById('total-observations-value').textContent = totalObservations.toString();
  }

  updateCharts();
});

  function initializeFrequencyChart(ctx) {
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Expected',
          backgroundColor: 'rgba(0, 123, 255, 0.5)',
          data: []
        }, {
          label: 'Observed',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          data: []
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  function initializeChiSquaredChart(ctx) {
      return new Chart(ctx, {
          type: 'line',
          data: {
              labels: [],  
              datasets: [
                  {
                      label: 'Chi-Squared Statistic',
                      backgroundColor: 'rgba(255, 99, 132, 1)',
                      borderColor: 'rgba(255, 99, 132, 1)',
                      data: [],
                      // pointRadius: 10,  // Increased radius
                      // borderWidth: 3,   // Increased border width
                      // fill: false
                  },
                  {
                      label: 'Chi-Squared Distribution',
                      backgroundColor: 'rgba(0, 123, 255, 0.1)',
                      borderColor: 'rgba(0, 123, 255, 1)',
                      data: []
                  }
              ]
          },
          options: {
              plugins: {
                  afterDraw: chart => {
                      // Custom drawing logic here
                  }
              },
              // ... other options ...
          }
      });
  }

  function generateFrequencies(numCategories, totalObservations, skew) {
    const expected = new Array(numCategories).fill(totalObservations / numCategories);
    let observed = expected.map((e, i) => e + skew * (i - (numCategories - 1) / 2));
    
    // Ensure that observed frequencies are non-negative and sum to totalObservations
    let sumObserved = observed.reduce((a, b) => a + b, 0);
    observed = observed.map(o => Math.max(0, o * totalObservations / sumObserved));
  
    return { expected, observed };
  }  

  function calculateChiSquared(expected, observed) {
    return observed.reduce((sum, o, i) => sum + ((o - expected[i]) ** 2) / expected[i], 0);
  }

  function updateFrequencyChart(chart, expected, observed) {
    chart.data.labels = expected.map((_, i) => `Category ${i + 1}`);
    chart.data.datasets[0].data = expected;
    chart.data.datasets[1].data = observed;
    chart.update();
  }

  function updateChiSquaredChart(chart, chiSquared, df) {
    const xMin = 0;
    const xMax = 200; // Math.max(20, chiSquared + 10);
    const step = 0.1;  
    const labels = [];
    const chiSquaredData = [];
    const tolerance = 0.05; // Define a tolerance for comparison

    for (let x = xMin; x <= xMax; x += step) {
      labels.push(x.toFixed(2));  
      chiSquaredData.push(jStat.chisquare.pdf(x, df));
    }

    // Update data for Chi-Squared Statistic (point)
    // chart.data.datasets[0].data = labels.map(x => parseFloat(x) === chiSquared ? jStat.chisquare.pdf(chiSquared, df) : null);
    chart.data.datasets[0].data = labels.map(x => {
        const xFloat = parseFloat(x);
        return Math.abs(xFloat - chiSquared) <= tolerance ? jStat.chisquare.pdf(chiSquared, df) : null;
    });
    
    // Update data for Chi-Squared Distribution
    chart.data.labels = labels;
    chart.data.datasets[1].data = chiSquaredData;

    // Update the label for the chi-squared distribution dataset
    chart.data.datasets[1].label = `Null Hypothesis Chi-Squared Distribution (χ²(${df}))`;

    chart.update();
}

