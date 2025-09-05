// correlation.js
// Interactive visualizations showing how dot product, cosine similarity,
// Pearson correlation, and OLS regression coefficient are variations on the
// inner product, differing only by normalization and centering.

// Basic vector operations (inner product and norms)
function dotProduct(a, b) {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function magnitude(v) {
  return Math.sqrt(v.reduce((s, val) => s + val * val, 0));
}

function cosineSimilarity(a, b) {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return NaN;
  return dotProduct(a, b) / (magA * magB);
}

// Centers a vector by subtracting its own mean from each component
function centerVector(v) {
  const mean = v.reduce((s, val) => s + val, 0) / v.length;
  return v.map(val => val - mean);
}

// Pearson correlation is cosine similarity of centered vectors
function pearsonCorrelation(a, b) {
  const centeredA = centerVector(a);
  const centeredB = centerVector(b);
  return cosineSimilarity(centeredA, centeredB);
}

// OLS coefficient normalizes the dot product by A's magnitude squared
function olsCoefficient(a, b) {
  const denom = magnitude(a) ** 2;
  return denom === 0 ? NaN : dotProduct(a, b) / denom;
}

// Helper to populate ordered lists of intermediate steps
function fillSteps(id, lines) {
  const ol = document.getElementById(id);
  if (!ol) return;
  ol.innerHTML = '';
  lines.forEach(txt => {
    const li = document.createElement('li');
    li.textContent = txt;
    ol.appendChild(li);
  });
}

// Chart instances
let dotChart, cosineChart, pearsonBeforeChart, pearsonChart, olsChart;

// Plugin to draw an arc showing the angle between vectors
const anglePlugin = {
  id: 'anglePlugin',
  afterDraw(chart, args, opts) {
    if (!opts || !opts.vectors) return;
    const { vectorA, vectorB } = opts.vectors;
    const { ctx, scales: { x, y } } = chart;
    const origin = { x: x.getPixelForValue(0), y: y.getPixelForValue(0) };
    const aPix = { x: x.getPixelForValue(vectorA[0]), y: y.getPixelForValue(vectorA[1]) };
    const bPix = { x: x.getPixelForValue(vectorB[0]), y: y.getPixelForValue(vectorB[1]) };
    const angleA = Math.atan2(aPix.y - origin.y, aPix.x - origin.x);
    const angleB = Math.atan2(bPix.y - origin.y, bPix.x - origin.x);
    let start = Math.min(angleA, angleB);
    let end = Math.max(angleA, angleB);
    ctx.save();
    ctx.strokeStyle = 'gray';
    ctx.beginPath();
    const radius = 40;
    ctx.arc(origin.x, origin.y, radius, start, end);
    ctx.stroke();
    ctx.restore();
  }
};
Chart.register(anglePlugin);

// Base chart configuration
const baseOptions = {
  type: 'scatter',
  data: { datasets: [] },
  options: {
    responsive: false,
    animation: false,
    scales: {
      x: { type: 'linear', min: -10, max: 10, grid: { color: '#ccc' } },
      y: { type: 'linear', min: -10, max: 10, grid: { color: '#ccc' } }
    },
    plugins: { legend: { display: false } }
  }
};

function initCharts() {
  dotChart = new Chart(document.getElementById('dotProductChart'), JSON.parse(JSON.stringify(baseOptions)));
  cosineChart = new Chart(document.getElementById('cosineChart'), JSON.parse(JSON.stringify(baseOptions)));
  pearsonBeforeChart = new Chart(document.getElementById('pearsonBeforeChart'), JSON.parse(JSON.stringify(baseOptions)));
  pearsonChart = new Chart(document.getElementById('pearsonChart'), JSON.parse(JSON.stringify(baseOptions)));
  olsChart = new Chart(document.getElementById('olsChart'), JSON.parse(JSON.stringify(baseOptions)));
}

function updateCharts(vectorA, vectorB) {
  // Dot Product chart with projection
  const denom = dotProduct(vectorB, vectorB);
  const projScalar = denom === 0 ? 0 : dotProduct(vectorA, vectorB) / denom;
  const projection = [projScalar * vectorB[0], projScalar * vectorB[1]];
  dotChart.data.datasets = [
    { data: [{ x: 0, y: 0 }, { x: vectorA[0], y: vectorA[1] }], borderColor: 'red', showLine: true, fill: false },
    { data: [{ x: 0, y: 0 }, { x: vectorB[0], y: vectorB[1] }], borderColor: 'blue', showLine: true, fill: false },
    { data: [{ x: vectorA[0], y: vectorA[1] }, { x: projection[0], y: projection[1] }], borderColor: 'gray', borderDash: [5, 5], showLine: true, fill: false, pointRadius: 0 }
  ];
  dotChart.update();

  // Cosine Similarity chart with angle arc
  cosineChart.data.datasets = [
    { data: [{ x: 0, y: 0 }, { x: vectorA[0], y: vectorA[1] }], borderColor: 'red', showLine: true, fill: false },
    { data: [{ x: 0, y: 0 }, { x: vectorB[0], y: vectorB[1] }], borderColor: 'blue', showLine: true, fill: false }
  ];
  cosineChart.options.plugins.anglePlugin = { vectors: { vectorA, vectorB } };
  cosineChart.update();

  // Pearson Correlation - before centering
  pearsonBeforeChart.data.datasets = [
    { data: [{ x: 0, y: 0 }, { x: vectorA[0], y: vectorA[1] }], borderColor: 'red', showLine: true, fill: false },
    { data: [{ x: 0, y: 0 }, { x: vectorB[0], y: vectorB[1] }], borderColor: 'blue', showLine: true, fill: false }
  ];
  pearsonBeforeChart.update();

  // Pearson Correlation - after centering
  const centeredA = centerVector(vectorA);
  const centeredB = centerVector(vectorB);
  pearsonChart.data.datasets = [
    { data: [{ x: 0, y: 0 }, { x: centeredA[0], y: centeredA[1] }], borderColor: 'red', showLine: true, fill: false },
    { data: [{ x: 0, y: 0 }, { x: centeredB[0], y: centeredB[1] }], borderColor: 'blue', showLine: true, fill: false }
  ];
  pearsonChart.options.plugins.anglePlugin = { vectors: { vectorA: centeredA, vectorB: centeredB } };
  pearsonChart.update();

  // OLS Coefficient visualization
  const points = vectorA.map((x, i) => ({ x, y: vectorB[i] }));
  const slope = olsCoefficient(vectorA, vectorB);
  const minX = Math.min(...vectorA) - 1;
  const maxX = Math.max(...vectorA) + 1;
  const line = [
    { x: minX, y: slope * minX },
    { x: maxX, y: slope * maxX }
  ];
  olsChart.data.datasets = [
    { type: 'scatter', data: points, backgroundColor: 'red' },
    { type: 'line', data: line, borderColor: 'green', fill: false }
  ];
  olsChart.update();
}

function updateDisplay(vectorA, vectorB) {
  const dotProd = dotProduct(vectorA, vectorB);
  const cosSim = cosineSimilarity(vectorA, vectorB);
  const pearsonCorr = pearsonCorrelation(vectorA, vectorB);
  const olsCoeff = olsCoefficient(vectorA, vectorB);

  document.getElementById('dotProductValue').textContent = dotProd.toFixed(2);
  document.getElementById('cosineSimilarityValue').textContent = cosSim.toFixed(2);
  document.getElementById('pearsonCorrelationValue').textContent = isNaN(pearsonCorr) ? 'NaN' : pearsonCorr.toFixed(2);
  document.getElementById('olsCoefficientValue').textContent = olsCoeff.toFixed(2);

  document.getElementById('vectorAOutput').textContent = `(${vectorA.join(', ')})`;
  document.getElementById('vectorBOutput').textContent = `(${vectorB.join(', ')})`;

  // Intermediate steps for dot product
  const [a1, a2] = vectorA;
  const [b1, b2] = vectorB;
  fillSteps('dotProductSteps', [
    `x₁y₁ = ${a1} × ${b1} = ${(a1 * b1).toFixed(2)}`,
    `x₂y₂ = ${a2} × ${b2} = ${(a2 * b2).toFixed(2)}`,
    `Sum = ${(dotProd).toFixed(2)}`
  ]);

  // Steps for cosine similarity
  const magA = magnitude(vectorA);
  const magB = magnitude(vectorB);
  fillSteps('cosineSteps', [
    `Dot = ${dotProd.toFixed(2)}`,
    `‖x‖ = √(${a1}² + ${a2}²) = ${magA.toFixed(2)}`,
    `‖y‖ = √(${b1}² + ${b2}²) = ${magB.toFixed(2)}`,
    `Dot/(‖x‖‖y‖) = ${dotProd.toFixed(2)} / (${magA.toFixed(2)} × ${magB.toFixed(2)})`
  ]);

  // Steps for Pearson correlation
  const meanA = (a1 + a2) / 2;
  const meanB = (b1 + b2) / 2;
  const centeredA = [a1 - meanA, a2 - meanA];
  const centeredB = [b1 - meanB, b2 - meanB];
  const dotCentered = dotProduct(centeredA, centeredB);
  const magCenteredA = magnitude(centeredA);
  const magCenteredB = magnitude(centeredB);
  fillSteps('pearsonSteps', [
    `x̄ = (${a1} + ${a2}) / 2 = ${meanA.toFixed(2)}`,
    `ȳ = (${b1} + ${b2}) / 2 = ${meanB.toFixed(2)}`,
    `Centered x = [${centeredA[0].toFixed(2)}, ${centeredA[1].toFixed(2)}]`,
    `Centered y = [${centeredB[0].toFixed(2)}, ${centeredB[1].toFixed(2)}]`,
    `Dot = ${dotCentered.toFixed(2)}`,
    `‖x_c‖ = ${magCenteredA.toFixed(2)}, ‖y_c‖ = ${magCenteredB.toFixed(2)}`,
    `Dot/(‖x_c‖‖y_c‖) = ${dotCentered.toFixed(2)} / (${magCenteredA.toFixed(2)} × ${magCenteredB.toFixed(2)})`
  ]);

  // Steps for OLS coefficient
  const denom = magA ** 2;
  fillSteps('olsSteps', [
    `Σxᵢyᵢ = ${dotProd.toFixed(2)}`,
    `Σxᵢ² = ${denom.toFixed(2)}`,
    `a = Σxᵢyᵢ / Σxᵢ² = ${dotProd.toFixed(2)} / ${denom.toFixed(2)}`
  ]);
}

function updateAll() {
  const vectorAX1 = parseFloat(document.getElementById('vectorAX1').value);
  const vectorAY1 = parseFloat(document.getElementById('vectorAY1').value);
  const vectorBX1 = parseFloat(document.getElementById('vectorBX1').value);
  const vectorBY1 = parseFloat(document.getElementById('vectorBY1').value);

  const vectorA = [vectorAX1, vectorAY1];
  const vectorB = [vectorBX1, vectorBY1];

  updateDisplay(vectorA, vectorB);
  updateCharts(vectorA, vectorB);
}

document.getElementById('vectorAX1').addEventListener('input', updateAll);
document.getElementById('vectorAY1').addEventListener('input', updateAll);
document.getElementById('vectorBX1').addEventListener('input', updateAll);
document.getElementById('vectorBY1').addEventListener('input', updateAll);

initCharts();
updateAll();
