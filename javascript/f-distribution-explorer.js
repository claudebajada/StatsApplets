(function() {
  function updateCriticalValue(criticalValueDisplay, df1, df2) {
    // jStat.centralF.inv takes quantile, df1, df2
    // Since we want the critical value for α=0.05, we use 0.95 for the quantile
  
    const criticalValue = jStat.centralF.inv(0.95, df1, df2);
    criticalValueDisplay.textContent = criticalValue.toFixed(3);
  }

  function initializeChart(ctx) {
    // Adjust the range of x-axis labels to fit the F-distribution
    const labels = Array.from({length: 200}, (_, i) => i * 5 / 199);

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'F Distribution',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          borderColor: 'rgba(0, 123, 255, 1)',  
          data: []
        }]
      },
      options: chartOptions()
    });
  }

  function chartOptions() {
    return {
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: 'F Value'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Probability Density'
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }

  function updateDistributionChart(chart, df1, df2) {
    // Calculate the F-distribution data
    const fDistData = chart.data.labels.map(x => fDistributionDensity(x, df1, df2));
    chart.data.datasets[0].data = fDistData;
    chart.update();
  }

  function fDistributionDensity(x, df1, df2) {
    // Ensure x is within the range of the F-distribution
    if (x <= 0) return 0;
    // Calculate the F-distribution probability density
    return jStat.centralF.pdf(x, df1, df2);  
  }



  document.addEventListener('DOMContentLoaded', function() {
    // Define criticalValueDisplay here, at the top level of the IIFE
    const criticalValueDisplay = document.getElementById('critical-value');
    const df1Slider = document.getElementById('df1-slider');
    const df1Value = document.getElementById('df1-value');
    const df2Slider = document.getElementById('df2-slider');
    const df2Value = document.getElementById('df2-value');
    const chartCtx = document.getElementById('distributionChart').getContext('2d');

    let distributionChart = initializeChart(chartCtx);

    function updateChart() {
      const df1 = parseInt(df1Slider.value);
      const df2 = parseInt(df2Slider.value);
      df1Value.textContent = df1;
      df2Value.textContent = df2;
      // Pass criticalValueDisplay as an argument to the function
      updateCriticalValue(criticalValueDisplay, df1, df2);
      updateDistributionChart(distributionChart, df1, df2);
    }

    df1Slider.addEventListener('input', updateChart);
    df2Slider.addEventListener('input', updateChart);
    updateChart(); // This call will initialize everything including the critical value
  });

})();

