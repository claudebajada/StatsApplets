document.addEventListener('DOMContentLoaded', function() {
  const dfSlider = document.getElementById('df-slider');
  const dfValue = document.getElementById('df-value');
  const chartCtx = document.getElementById('distributionChart').getContext('2d');
  const labels = Array.from({length: 280}, (_, i) => -7 + (i * 14 / 279));
  let distributionChart = initializeChart(chartCtx, {
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
    options: chartOptions(
      { type: 'linear', min: -7, max: 7 },
      { beginAtZero: true }
    )
  });

  function updateChart() {
    const df = parseInt(dfSlider.value);
    dfValue.textContent = df;
    updateDistributionChart(distributionChart, df);
  }

  dfSlider.addEventListener('input', updateChart);
  updateChart();
});

function updateDistributionChart(chart, df) {
  chart.data.datasets[0].data = chart.data.labels.map(x => normalDensity(x, 0, 1));
  chart.data.datasets[1].data = chart.data.labels.map(x => tDistributionDensity(x, df));
  chart.update();
}

function tDistributionDensity(t, df) {
  return jStat.studentt.pdf(t, df);
}

