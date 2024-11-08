document.addEventListener('DOMContentLoaded', function() {
  const dfSlider = document.getElementById('df-slider');
  const dfValue = document.getElementById('df-value');
  const chartCtx = document.getElementById('distributionChart').getContext('2d');

  let distributionChart = initializeChart(chartCtx);

  function updateChart() {
    const df = parseInt(dfSlider.value);
    dfValue.textContent = df;
    updateDistributionChart(distributionChart, df);
  }

  dfSlider.addEventListener('input', updateChart);
  updateChart();
});

function initializeChart(ctx) {
  // Increased number of points for smoother graph
  const labels = Array.from({length: 280}, (_, i) => -7 + (i * 14 / 279));

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Standard Normal Distribution',
        backgroundColor: 'rgba(0, 0, 255, 0.1)',
        borderColor: 'rgba(0, 0, 255, 1)',
        data: []
      },
      {
        label: 't Distribution',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderColor: 'rgba(255, 0, 0, 1)',
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
        min: -7,
        max: 7
      },
      y: {
        beginAtZero: true
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };
}

function updateDistributionChart(chart, df) {
  chart.data.datasets[0].data = chart.data.labels.map(x => normalDensity(x));
  chart.data.datasets[1].data = chart.data.labels.map(x => tDistributionDensity(x, df));
  chart.update();
}

function normalDensity(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function tDistributionDensity(t, df) {
  return jStat.studentt.pdf(t, df);
}

