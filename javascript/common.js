// DOM/chart helpers. Mathematical functions live in statistics.js.
function combinations(n, k) { return StatsMath.combinations(n, k); }
function normalDensity(x, mean, sd) { return StatsMath.normalDensity(x, mean, sd); }
function initializeChart(ctx, config) { return new Chart(ctx, config); }
function chartOptions(x = {}, y = {}) {
  return { animation: false, responsive: true, maintainAspectRatio: false,
    scales: { x: { ...x }, y: { ...y } } };
}
function addSliderListener(id, update) { document.getElementById(id).addEventListener('input', update); }
function formatProbability(p) { return p > 0 && p < 0.0001 ? p.toExponential(3) : p.toFixed(4); }
function curvePoints(min, max, density, count = 401) {
  return Array.from({ length: count }, (_, i) => {
    const x = min + (max - min) * i / (count - 1);
    return { x, y: density(x) };
  });
}
function lineDataset(label, data = [], color = '#2456a6') {
  return { label, data, borderColor: color, backgroundColor: color + '33',
    pointRadius: 0, borderWidth: 2, fill: false };
}
// Canvas alternatives identify the chart; numeric results and explanations remain HTML.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('canvas').forEach(canvas => {
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', canvas.closest('.chart-container')?.querySelector('h3')?.textContent || canvas.id.replace(/Chart$/, '') + ' chart');
  });
});
