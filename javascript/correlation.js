// correlation.js
// Interactive visualizations showing how dot product, cosine similarity,
// and Pearson correlation are variations on the inner product, differing only
// by normalization and centering.

// Geometry remains two-dimensional in this initial correctness stage.
const dotProduct = StatsMath.dot;
const magnitude = StatsMath.norm;
const centerVector = StatsMath.center;
const cosineSimilarity = StatsMath.cosine;
const pearsonCorrelation = StatsMath.pearson;
function normalize(v) {
  const mag = magnitude(v);
  return mag === 0 ? v.map(() => 0) : v.map((x) => x / mag);
}

// Helper to populate ordered lists of intermediate steps
function fillSteps(id, lines) {
  const ol = document.getElementById(id);
  if (!ol) return;
  ol.innerHTML = "";
  lines.forEach((txt) => {
    const li = document.createElement("li");
    li.textContent = txt;
    ol.appendChild(li);
  });
}

function decorateGeometry(chart) {
  chart.data.datasets.forEach((ds, i) => {
    ds.label = [
      "A (solid, circles)",
      "B (dashed, triangles)",
      "Projection (dotted, squares)",
      "Residual to projection",
    ][i];
    ds.borderColor = chartPalette[i % 4];
    ds.backgroundColor = chartPalette[i % 4];
    ds.pointStyle = ["circle", "triangle", "rect", "cross"][i];
    ds.borderDash = i === 1 ? [6, 4] : i >= 2 ? [2, 3] : [];
  });
}

// Chart instances
let dotChart,
  cosineChart,
  pearsonBeforeChart,
  pearsonCenteredChart,
  pearsonNormChart;

// Plugin to draw an arc showing the angle between vectors
const anglePlugin = {
  id: "anglePlugin",
  afterDraw(chart, args, opts) {
    if (!opts || !opts.vectors) return;
    if (
      magnitude(opts.vectors.vectorA) === 0 ||
      magnitude(opts.vectors.vectorB) === 0
    )
      return;
    const { vectorA, vectorB } = opts.vectors;
    const {
      ctx,
      scales: { x, y },
    } = chart;
    const origin = { x: x.getPixelForValue(0), y: y.getPixelForValue(0) };
    const aPix = {
      x: x.getPixelForValue(vectorA[0]),
      y: y.getPixelForValue(vectorA[1]),
    };
    const bPix = {
      x: x.getPixelForValue(vectorB[0]),
      y: y.getPixelForValue(vectorB[1]),
    };
    const angleA = Math.atan2(aPix.y - origin.y, aPix.x - origin.x);
    const angleB = Math.atan2(bPix.y - origin.y, bPix.x - origin.x);
    let start = Math.min(angleA, angleB);
    let end = Math.max(angleA, angleB);
    ctx.save();
    ctx.strokeStyle = "gray";
    ctx.beginPath();
    const radius = 40;
    ctx.arc(origin.x, origin.y, radius, start, end);
    ctx.stroke();
    ctx.restore();
  },
};
// Keep one unit the same pixel length on both axes, so displayed angles are meaningful.
const geometrySquare = {
  id: "geometrySquare",
  afterLayout(chart) {
    if (!chart.options.plugins.geometrySquare) return;
    const area = chart.chartArea,
      size = Math.min(area.width, area.height),
      cx = (area.left + area.right) / 2,
      cy = (area.top + area.bottom) / 2;
    area.left = cx - size / 2;
    area.right = cx + size / 2;
    area.top = cy - size / 2;
    area.bottom = cy + size / 2;
    area.width = size;
    area.height = size;
    const x = chart.scales.x,
      y = chart.scales.y;
    x.left = area.left;
    x.right = area.right;
    x.width = size;
    y.top = area.top;
    y.bottom = area.bottom;
    y.height = size;
    x.configure();
    y.configure();
  },
};
Chart.register(anglePlugin, geometrySquare);

// Base chart configuration
const baseOptions = {
  type: "scatter",
  data: { datasets: [] },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: { type: "linear", min: -10, max: 10, grid: { color: "#ccc" } },
      y: { type: "linear", min: -10, max: 10, grid: { color: "#ccc" } },
    },
    plugins: { legend: { display: false }, geometrySquare: true },
  },
};

function initCharts() {
  const dotOpts = JSON.parse(JSON.stringify(baseOptions));
  dotChart = new Chart(document.getElementById("dotProductChart"), dotOpts);

  const cosineOpts = JSON.parse(JSON.stringify(baseOptions));
  cosineOpts.options.scales.x.min = -1.2;
  cosineOpts.options.scales.x.max = 1.2;
  cosineOpts.options.scales.y.min = -1.2;
  cosineOpts.options.scales.y.max = 1.2;
  cosineChart = new Chart(document.getElementById("cosineChart"), cosineOpts);

  pearsonBeforeChart = new Chart(
    document.getElementById("pearsonBeforeChart"),
    JSON.parse(JSON.stringify(baseOptions)),
  );
  pearsonCenteredChart = new Chart(
    document.getElementById("pearsonCenteredChart"),
    JSON.parse(JSON.stringify(baseOptions)),
  );

  const pearsonNormOpts = JSON.parse(JSON.stringify(baseOptions));
  pearsonNormOpts.options.scales.x.min = -1.2;
  pearsonNormOpts.options.scales.x.max = 1.2;
  pearsonNormOpts.options.scales.y.min = -1.2;
  pearsonNormOpts.options.scales.y.max = 1.2;
  pearsonNormChart = new Chart(
    document.getElementById("pearsonNormChart"),
    pearsonNormOpts,
  );
}

function updateCharts(vectorA, vectorB) {
  // Dot Product chart showing projection of A onto B
  const dotProd = dotProduct(vectorA, vectorB);
  const magB = magnitude(vectorB);
  const projLen = magB === 0 ? 0 : dotProd / magB;
  const unitB = magB === 0 ? [0, 0] : vectorB.map((val) => val / magB);
  const projVec = unitB.map((val) => val * projLen);
  dotChart.data.datasets = [
    {
      data: [
        { x: 0, y: 0 },
        { x: vectorA[0], y: vectorA[1] },
      ],
      borderColor: "red",
      showLine: true,
      fill: false,
    },
    {
      data: [
        { x: 0, y: 0 },
        { x: vectorB[0], y: vectorB[1] },
      ],
      borderColor: "blue",
      showLine: true,
      fill: false,
    },
    {
      data: [
        { x: 0, y: 0 },
        { x: projVec[0], y: projVec[1] },
      ],
      borderColor: "green",
      showLine: true,
      fill: false,
    },
    {
      data: [
        { x: vectorA[0], y: vectorA[1] },
        { x: projVec[0], y: projVec[1] },
      ],
      borderColor: "gray",
      borderDash: [5, 5],
      showLine: true,
      fill: false,
      pointRadius: 0,
    },
  ];
  decorateGeometry(dotChart);
  dotChart.update();

  // Cosine similarity as dot product of normalized vectors
  const normA = normalize(vectorA);
  const normB = normalize(vectorB);
  const cosProjLen = dotProduct(normA, normB);
  const cosProjVec = normB.map((val) => val * cosProjLen);
  cosineChart.data.datasets = [
    {
      data: [
        { x: 0, y: 0 },
        { x: normA[0], y: normA[1] },
      ],
      borderColor: "red",
      showLine: true,
      fill: false,
    },
    {
      data: [
        { x: 0, y: 0 },
        { x: normB[0], y: normB[1] },
      ],
      borderColor: "blue",
      showLine: true,
      fill: false,
    },
    {
      data: [
        { x: 0, y: 0 },
        { x: cosProjVec[0], y: cosProjVec[1] },
      ],
      borderColor: "green",
      showLine: true,
      fill: false,
    },
    {
      data: [
        { x: normA[0], y: normA[1] },
        { x: cosProjVec[0], y: cosProjVec[1] },
      ],
      borderColor: "gray",
      borderDash: [5, 5],
      showLine: true,
      fill: false,
      pointRadius: 0,
    },
  ];
  cosineChart.options.plugins.anglePlugin = {
    vectors: { vectorA: normA, vectorB: normB },
  };
  decorateGeometry(cosineChart);
  cosineChart.update();

  // Pearson Correlation - before centering
  pearsonBeforeChart.data.datasets = [
    {
      data: [
        { x: 0, y: 0 },
        { x: vectorA[0], y: vectorA[1] },
      ],
      borderColor: "red",
      showLine: true,
      fill: false,
    },
    {
      data: [
        { x: 0, y: 0 },
        { x: vectorB[0], y: vectorB[1] },
      ],
      borderColor: "blue",
      showLine: true,
      fill: false,
    },
  ];
  decorateGeometry(pearsonBeforeChart);
  pearsonBeforeChart.update();

  // Pearson Correlation - after centering
  const centeredA = centerVector(vectorA);
  const centeredB = centerVector(vectorB);
  pearsonCenteredChart.data.datasets = [
    {
      data: [
        { x: 0, y: 0 },
        { x: centeredA[0], y: centeredA[1] },
      ],
      borderColor: "red",
      showLine: true,
      fill: false,
    },
    {
      data: [
        { x: 0, y: 0 },
        { x: centeredB[0], y: centeredB[1] },
      ],
      borderColor: "blue",
      showLine: true,
      fill: false,
    },
  ];
  decorateGeometry(pearsonCenteredChart);
  pearsonCenteredChart.update();

  // Pearson Correlation - centered and normalized with projection
  const normCenteredA = normalize(centeredA);
  const normCenteredB = normalize(centeredB);
  const corrProjLen = dotProduct(normCenteredA, normCenteredB);
  const corrProjVec = normCenteredB.map((val) => val * corrProjLen);
  pearsonNormChart.data.datasets = [
    {
      data: [
        { x: 0, y: 0 },
        { x: normCenteredA[0], y: normCenteredA[1] },
      ],
      borderColor: "red",
      showLine: true,
      fill: false,
    },
    {
      data: [
        { x: 0, y: 0 },
        { x: normCenteredB[0], y: normCenteredB[1] },
      ],
      borderColor: "blue",
      showLine: true,
      fill: false,
    },
    {
      data: [
        { x: 0, y: 0 },
        { x: corrProjVec[0], y: corrProjVec[1] },
      ],
      borderColor: "green",
      showLine: true,
      fill: false,
    },
    {
      data: [
        { x: normCenteredA[0], y: normCenteredA[1] },
        { x: corrProjVec[0], y: corrProjVec[1] },
      ],
      borderColor: "gray",
      borderDash: [5, 5],
      showLine: true,
      fill: false,
      pointRadius: 0,
    },
  ];
  pearsonNormChart.options.plugins.anglePlugin = undefined;
  decorateGeometry(pearsonNormChart);
  pearsonNormChart.update();
}

function updateDisplay(vectorA, vectorB) {
  const dotProd = dotProduct(vectorA, vectorB);
  const cosSim = cosineSimilarity(vectorA, vectorB);
  const pearsonCorr = pearsonCorrelation(vectorA, vectorB);

  document.getElementById("dotProductValue").textContent = dotProd.toFixed(2);
  document.getElementById("cosineSimilarityValue").textContent =
    cosSim === null
      ? "Undefined: cosine similarity divides by vector lengths; a zero vector has no direction."
      : cosSim.toFixed(2);
  document.getElementById("pearsonCorrelationValue").textContent =
    pearsonCorr === null
      ? "Undefined: Pearson r divides by centred vector lengths; at least one vector is constant (zero variance)."
      : pearsonCorr.toFixed(2);

  document.getElementById("vectorAOutput").textContent =
    `(${vectorA.join(", ")})`;
  document.getElementById("vectorBOutput").textContent =
    `(${vectorB.join(", ")})`;

  // Intermediate steps for dot product
  const [a1, a2] = vectorA;
  const [b1, b2] = vectorB;
  const magB = magnitude(vectorB);
  const projLen = magB === 0 ? 0 : dotProd / magB;
  fillSteps("dotProductSteps", [
    `A₁B₁ = ${a1} × ${b1} = ${(a1 * b1).toFixed(2)}`,
    `A₂B₂ = ${a2} × ${b2} = ${(a2 * b2).toFixed(2)}`,
    `ΣAᵢBᵢ = ${dotProd.toFixed(2)}`,
    `‖B‖ = ${magB.toFixed(2)}`,
    `Projection length = ΣAᵢBᵢ / ‖B‖ = ${projLen.toFixed(2)}`,
    `Dot product = Projection × ‖B‖ = ${(projLen * magB).toFixed(2)}`,
  ]);

  // Steps for cosine similarity (normalize then dot)
  const magA = magnitude(vectorA);
  const normA = normalize(vectorA);
  const normB = normalize(vectorB);
  const cosDot = dotProduct(normA, normB);
  fillSteps("cosineSteps", [
    `‖A‖ = √(${a1}² + ${a2}²) = ${magA.toFixed(2)}`,
    `‖B‖ = √(${b1}² + ${b2}²) = ${magB.toFixed(2)}`,
    `Â = [${normA[0].toFixed(2)}, ${normA[1].toFixed(2)}]`,
    `B̂ = [${normB[0].toFixed(2)}, ${normB[1].toFixed(2)}]`,
    `Projection length = Dot(Â,B̂) = ${cosDot.toFixed(2)}`,
    `cos θ = Projection length = ${cosDot.toFixed(2)}`,
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
  fillSteps("pearsonSteps", [
    `Ā = (${a1} + ${a2}) / 2 = ${meanA.toFixed(2)}`,
    `B̄ = (${b1} + ${b2}) / 2 = ${meanB.toFixed(2)}`,
    `Centered A = [${centeredA[0].toFixed(2)}, ${centeredA[1].toFixed(2)}]`,
    `Centered B = [${centeredB[0].toFixed(2)}, ${centeredB[1].toFixed(2)}]`,
    `‖A_c‖ = ${magCenteredA.toFixed(2)}, ‖B_c‖ = ${magCenteredB.toFixed(2)}`,
    `Normalized A_c = [${normCenteredA[0].toFixed(2)}, ${normCenteredA[1].toFixed(2)}]`,
    `Normalized B_c = [${normCenteredB[0].toFixed(2)}, ${normCenteredB[1].toFixed(2)}]`,
    `Projection length = Dot(Â_c,B̂_c) = ${dotNormCentered.toFixed(2)}`,
    `r = Projection length = ${dotNormCentered.toFixed(2)}`,
  ]);
  if (magB === 0)
    fillSteps("dotProductSteps", [
      "Dot product = 0. The projection onto B is undefined because B is the zero vector.",
    ]);
  if (cosSim === null)
    fillSteps("cosineSteps", [
      "A zero vector cannot be normalised: dividing by its length would divide by zero.",
      "No angle or cosine similarity is defined. The plot uses the origin as a placeholder.",
    ]);
  if (pearsonCorr === null)
    fillSteps("pearsonSteps", [
      `Centred A = [${centeredA.join(", ")}]; centred B = [${centeredB.join(", ")}].`,
      "At least one centred vector has length zero. Pearson correlation is undefined because a constant vector has no variation.",
      "Move a component slider so that each vector has two different values.",
    ]);
}

function updateAll() {
  const vectorAX1 = parseFloat(document.getElementById("vectorAX1").value);
  const vectorAY1 = parseFloat(document.getElementById("vectorAY1").value);
  const vectorBX1 = parseFloat(document.getElementById("vectorBX1").value);
  const vectorBY1 = parseFloat(document.getElementById("vectorBY1").value);

  const vectorA = [vectorAX1, vectorAY1];
  const vectorB = [vectorBX1, vectorBY1];

  updateDisplay(vectorA, vectorB);
  updateCharts(vectorA, vectorB);
}

document.getElementById("vectorAX1").addEventListener("input", updateAll);
document.getElementById("vectorAY1").addEventListener("input", updateAll);
document.getElementById("vectorBX1").addEventListener("input", updateAll);
document.getElementById("vectorBY1").addEventListener("input", updateAll);

initCharts();
updateAll();

// More than two paired observations: show complete indexed vectors and a scatterplot.
const pairChart = initializeChart(
  document.getElementById("pairsChart").getContext("2d"),
  {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Paired observations",
          data: [],
          backgroundColor: chartPalette[0],
          pointRadius: 5,
          pointStyle: "circle",
        },
      ],
    },
    options: chartOptions(
      { type: "linear", title: { display: true, text: "A" } },
      { title: { display: true, text: "B" } },
    ),
  },
);
const componentChart = (id) =>
  initializeChart(document.getElementById(id).getContext("2d"), {
    type: "line",
    data: {
      datasets: [
        { ...lineDataset("A", [], chartPalette[0]), pointRadius: 3 },
        { ...lineDataset("B", [], chartPalette[1]), pointRadius: 3 },
      ],
    },
    options: chartOptions(
      {
        type: "linear",
        title: { display: true, text: "Observation index" },
        ticks: { precision: 0 },
      },
      { title: { display: true, text: "Component value" } },
    ),
  });
const centeredComponentsChart = componentChart("centeredComponentsChart");
const normalisedComponentsChart = componentChart("normalisedComponentsChart");
function updatePairs() {
  try {
    const pairs = TeachingMath.parsePairs(
        document.getElementById("pairs").value,
      ),
      a = pairs.map((p) => p[0]),
      b = pairs.map((p) => p[1]);
    const centered = [centerVector(a), centerVector(b)],
      normalised = centered.map(normalize);
    const cosine = cosineSimilarity(a, b),
      pearson = pearsonCorrelation(a, b);
    document.getElementById("data-dot-value").textContent = dotProduct(
      a,
      b,
    ).toFixed(3);
    document.getElementById("data-cosine-value").textContent =
      cosine === null ? "Undefined (zero vector)" : cosine.toFixed(4);
    document.getElementById("data-pearson-value").textContent =
      pearson === null ? "Undefined (constant vector)" : pearson.toFixed(4);
    pairChart.data.datasets[0].data = pairs.map(([x, y]) => ({ x, y }));
    pairChart.update();
    for (const [chart, vectors] of [
      [centeredComponentsChart, centered],
      [normalisedComponentsChart, normalised],
    ]) {
      chart.data.datasets.forEach(
        (ds, i) =>
          (ds.data = vectors[i].map((y, index) => ({
            x: index + 1,
            y:
              chart === normalisedComponentsChart &&
              magnitude(centered[i]) === 0
                ? null
                : y,
          }))),
      );
      chart.update();
    }
    document.getElementById("calculation").textContent =
      `For ${pairs.length} pairs, Ā = ${TeachingMath.mean(a).toFixed(3)} and B̄ = ${TeachingMath.mean(b).toFixed(3)}. The centred dot product is ${dotProduct(...centered).toFixed(3)}; centred lengths are ${magnitude(centered[0]).toFixed(3)} and ${magnitude(centered[1]).toFixed(3)}. ${pearson === null ? "A centred vector has length zero, so division and Pearson r are undefined." : `Their normalised dot product gives r = ${pearson.toFixed(4)}. Changing offsets can change cosine while leaving Pearson r unchanged.`} The five 2D geometry panels below use their separate component sliders.`;
    inputWarning();
  } catch (error) {
    inputWarning(
      "Enter 2–100 valid paired observations, one pair per line. " +
        error.message +
        " The plots retain the last valid data.",
    );
  }
}
document.getElementById("pairs").addEventListener("input", updatePairs);
document.getElementById("observations").addEventListener("input", () => {
  const n = Number(document.getElementById("observations").value);
  document.getElementById("pairs").value = TeachingMath.regressionSample(
    n,
    0.5,
    1,
    42,
  )
    .map((p) => p.map((v) => v.toFixed(3)).join(","))
    .join("\n");
  updatePairs();
});
document.addEventListener("applet:state", () => {
  updateAll();
  updatePairs();
});
updatePairs();
