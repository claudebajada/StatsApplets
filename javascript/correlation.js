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

function normalize(v) {
  const mag = magnitude(v);
  return mag === 0 ? [0, 0] : v.map(val => val / mag);
}

function cosineSimilarity(a, b) {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return NaN;
  const normA = a.map(val => val / magA);
  const normB = b.map(val => val / magB);
  return dotProduct(normA, normB);
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
let dotChart, cosineChart, pearsonBeforeChart, pearsonCenteredChart, pearsonNormChart, olsChart;

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
  const dotOpts = JSON.parse(JSON.stringify(baseOptions));
  dotChart = new Chart(document.getElementById('dotProductChart'), dotOpts);

  const cosineOpts = JSON.parse(JSON.stringify(baseOptions));
  cosineOpts.options.scales.x.min = -1.2;
  cosineOpts.options.scales.x.max = 1.2;
  cosineOpts.options.scales.y.min = -1.2;
  cosineOpts.options.scales.y.max = 1.2;
  cosineChart = new Chart(document.getElementById('cosineChart'), cosineOpts);

  pearsonBeforeChart = new Chart(document.getElementById('pearsonBeforeChart'), JSON.parse(JSON.stringify(baseOptions)));
  pearsonCenteredChart = new Chart(document.getElementById('pearsonCenteredChart'), JSON.parse(JSON.stringify(baseOptions)));

  const pearsonNormOpts = JSON.parse(JSON.stringify(baseOptions));
  pearsonNormOpts.options.scales.x.min = -1.2;
  pearsonNormOpts.options.scales.x.max = 1.2;
  pearsonNormOpts.options.scales.y.min = -1.2;
  pearsonNormOpts.options.scales.y.max = 1.2;
  pearsonNormChart = new Chart(document.getElementById('pearsonNormChart'), pearsonNormOpts);

  olsChart = new Chart(document.getElementById('olsChart'), JSON.parse(JSON.stringify(baseOptions)));
}

function updateCharts(vectorA, vectorB) {
  // Dot Product chart showing projection of A onto B
  const dotProd = dotProduct(vectorA, vectorB);
  const magB = magnitude(vectorB);
  const projLen = magB === 0 ? 0 : dotProd / magB;
  const unitB = magB === 0 ? [0, 0] : vectorB.map(val => val / magB);
  const projVec = unitB.map(val => val * projLen);
  dotChart.data.datasets = [
    { data: [{ x: 0, y: 0 }, { x: vectorA[0], y: vectorA[1] }], borderColor: 'red', showLine: true, fill: false },
    { data: [{ x: 0, y: 0 }, { x: vectorB[0], y: vectorB[1] }], borderColor: 'blue', showLine: true, fill: false },
    { data: [{ x: 0, y: 0 }, { x: projVec[0], y: projVec[1] }], borderColor: 'green', showLine: true, fill: false },
    { data: [{ x: vectorA[0], y: vectorA[1] }, { x: projVec[0], y: projVec[1] }], borderColor: 'gray', borderDash: [5, 5], showLine: true, fill: false, pointRadius: 0 }
  ];
  dotChart.update();

  // Cosine similarity as dot product of normalized vectors
  const normA = normalize(vectorA);
  const normB = normalize(vectorB);
  const cosProjLen = dotProduct(normA, normB);
  const cosProjVec = normB.map(val => val * cosProjLen);
  cosineChart.data.datasets = [
    { data: [{ x: 0, y: 0 }, { x: normA[0], y: normA[1] }], borderColor: 'red', showLine: true, fill: false },
    { data: [{ x: 0, y: 0 }, { x: normB[0], y: normB[1] }], borderColor: 'blue', showLine: true, fill: false },
    { data: [{ x: 0, y: 0 }, { x: cosProjVec[0], y: cosProjVec[1] }], borderColor: 'green', showLine: true, fill: false },
    { data: [{ x: normA[0], y: normA[1] }, { x: cosProjVec[0], y: cosProjVec[1] }], borderColor: 'gray', borderDash: [5, 5], showLine: true, fill: false, pointRadius: 0 }
  ];
  cosineChart.options.plugins.anglePlugin = { vectors: { vectorA: normA, vectorB: normB } };
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
  pearsonCenteredChart.data.datasets = [
    { data: [{ x: 0, y: 0 }, { x: centeredA[0], y: centeredA[1] }], borderColor: 'red', showLine: true, fill: false },
    { data: [{ x: 0, y: 0 }, { x: centeredB[0], y: centeredB[1] }], borderColor: 'blue', showLine: true, fill: false }
  ];
  pearsonCenteredChart.update();

  // Pearson Correlation - centered and normalized with projection
  const normCenteredA = normalize(centeredA);
  const normCenteredB = normalize(centeredB);
  const corrProjLen = dotProduct(normCenteredA, normCenteredB);
  const corrProjVec = normCenteredB.map(val => val * corrProjLen);
  pearsonNormChart.data.datasets = [
    { data: [{ x: 0, y: 0 }, { x: normCenteredA[0], y: normCenteredA[1] }], borderColor: 'red', showLine: true, fill: false },
    { data: [{ x: 0, y: 0 }, { x: normCenteredB[0], y: normCenteredB[1] }], borderColor: 'blue', showLine: true, fill: false },
    { data: [{ x: 0, y: 0 }, { x: corrProjVec[0], y: corrProjVec[1] }], borderColor: 'green', showLine: true, fill: false },
    { data: [{ x: normCenteredA[0], y: normCenteredA[1] }, { x: corrProjVec[0], y: corrProjVec[1] }], borderColor: 'gray', borderDash: [5,5], showLine: true, fill: false, pointRadius: 0 }
  ];
  pearsonNormChart.options.plugins.anglePlugin = undefined;
  pearsonNormChart.update();

  // OLS Coefficient - scatter with regression line through origin
  const slope = olsCoefficient(vectorA, vectorB);
  const scatterPoints = [
    { x: vectorA[0], y: vectorB[0] },
    { x: vectorA[1], y: vectorB[1] }
  ];
  const minX = Math.min(vectorA[0], vectorA[1]);
  const maxX = Math.max(vectorA[0], vectorA[1]);
  const linePoints = [
    { x: minX, y: slope * minX },
    { x: maxX, y: slope * maxX }
  ];
  olsChart.data.datasets = [
    { type: 'scatter', data: scatterPoints, borderColor: 'blue', backgroundColor: 'blue' },
    { type: 'line', data: linePoints, borderColor: 'red', fill: false, showLine: true, pointRadius: 0 }
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
  const magB = magnitude(vectorB);
  const projLen = magB === 0 ? 0 : dotProd / magB;
  fillSteps('dotProductSteps', [
    `A₁B₁ = ${a1} × ${b1} = ${(a1 * b1).toFixed(2)}`,
    `A₂B₂ = ${a2} × ${b2} = ${(a2 * b2).toFixed(2)}`,
    `ΣAᵢBᵢ = ${dotProd.toFixed(2)}`,
    `‖B‖ = ${magB.toFixed(2)}`,
    `Projection length = ΣAᵢBᵢ / ‖B‖ = ${(projLen).toFixed(2)}`,
    `Dot product = Projection × ‖B‖ = ${(projLen * magB).toFixed(2)}`
  ]);

  // Steps for cosine similarity (normalize then dot)
  const magA = magnitude(vectorA);
  const normA = normalize(vectorA);
  const normB = normalize(vectorB);
  const cosDot = dotProduct(normA, normB);
  fillSteps('cosineSteps', [
    `‖A‖ = √(${a1}² + ${a2}²) = ${magA.toFixed(2)}`,
    `‖B‖ = √(${b1}² + ${b2}²) = ${magB.toFixed(2)}`,
    `Â = [${normA[0].toFixed(2)}, ${normA[1].toFixed(2)}]`,
    `B̂ = [${normB[0].toFixed(2)}, ${normB[1].toFixed(2)}]`,
    `Projection length = Dot(Â,B̂) = ${cosDot.toFixed(2)}`,
    `cos θ = Projection length = ${cosDot.toFixed(2)}`
  ]);

  // Steps for Pearson correlation
  const meanA = (a1 + a2) / 2;
  const meanB = (b1 + b2) / 2;
  const centeredA = [a1 - meanA, a2 - meanA];
  const centeredB = [b1 - meanB, b2 - meanB];
  const magCenteredA = magnitude(centeredA);
  const magCenteredB = magnitude(centeredB);
  const normCenteredA = normalize(centeredA);
  const normCenteredB = normalize(centeredB);
  const dotNormCentered = dotProduct(normCenteredA, normCenteredB);
  fillSteps('pearsonSteps', [
    `Ā = (${a1} + ${a2}) / 2 = ${meanA.toFixed(2)}`,
    `B̄ = (${b1} + ${b2}) / 2 = ${meanB.toFixed(2)}`,
    `Centered A = [${centeredA[0].toFixed(2)}, ${centeredA[1].toFixed(2)}]`,
    `Centered B = [${centeredB[0].toFixed(2)}, ${centeredB[1].toFixed(2)}]`,
    `‖A_c‖ = ${magCenteredA.toFixed(2)}, ‖B_c‖ = ${magCenteredB.toFixed(2)}`,
    `Normalized A_c = [${normCenteredA[0].toFixed(2)}, ${normCenteredA[1].toFixed(2)}]`,
    `Normalized B_c = [${normCenteredB[0].toFixed(2)}, ${normCenteredB[1].toFixed(2)}]`,
    `Projection length = Dot(Â_c,B̂_c) = ${dotNormCentered.toFixed(2)}`,
    `r = Projection length = ${dotNormCentered.toFixed(2)}`
  ]);

  // Steps for OLS coefficient
  const denom = magA ** 2;
  fillSteps('olsSteps', [
    `ΣAᵢBᵢ = ${dotProd.toFixed(2)}`,
    `ΣAᵢ² = ${denom.toFixed(2)}`,
    `a = ΣAᵢBᵢ / ΣAᵢ² = ${dotProd.toFixed(2)} / ${denom.toFixed(2)}`
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
