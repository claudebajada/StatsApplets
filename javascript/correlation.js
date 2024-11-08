// correlation.js

// Function to calculate the dot product of two vectors
function dotProduct(vectorA, vectorB) {
  return vectorA.reduce((sum, value, index) => sum + value * vectorB[index], 0);
}

// Function to calculate the magnitude of a vector
function magnitude(vector) {
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

// Function to calculate cosine similarity between two vectors
function cosineSimilarity(vectorA, vectorB) {
  return dotProduct(vectorA, vectorB) / (magnitude(vectorA) * magnitude(vectorB));
}

// Function to center a single two-dimensional vector by subtracting the mean of each dimension
function centerVector(vector) {
  const mean = vector.reduce((sum, value) => sum + value, 0) / vector.length;
  return vector.map(component => component - mean);
}

// Function to calculate Pearson correlation between two vectors
function pearsonCorrelation(vectorA, vectorB) {
  const centeredVectorA = centerVector(vectorA);
  const centeredVectorB = centerVector(vectorB);
  const dot = dotProduct(centeredVectorA, centeredVectorB);
  const magA = magnitude(centeredVectorA);
  const magB = magnitude(centeredVectorB);

  if (magA === 0 || magB === 0) {
    return NaN; // Return NaN if one of the vectors is a zero vector after centering
  }

  return dot / (magA * magB);
}

// Function to calculate OLS coefficient
function olsCoefficient(vectorA, vectorB) {
  return dotProduct(vectorA, vectorB) / dotProduct(vectorA, vectorA);
}

// Update display values
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
}

// Function to draw axes on a canvas
function drawAxes(ctx, canvas) {
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Function to clear a canvas
function clearCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Function to draw vectors on a canvas
function drawVector(canvas, vector, color) {
  const ctx = canvas.getContext('2d');
  const originX = canvas.width / 2;
  const originY = canvas.height / 2;
  const scaleFactor = 20; // Adjust this scale factor as needed

  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(originX + vector[0] * scaleFactor, originY - vector[1] * scaleFactor);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Function to draw the dot product visualization
function drawDotProduct(vectorA, vectorB) {
  const canvas = document.getElementById('dotProductCanvas');
  clearCanvas(canvas);
  drawAxes(canvas.getContext('2d'), canvas);
  drawVector(canvas, vectorA, 'red');
  drawVector(canvas, vectorB, 'blue');
}

// Function to draw the cosine similarity visualization
function drawCosineSimilarity(vectorA, vectorB) {
  const canvas = document.getElementById('cosineCanvas');
  clearCanvas(canvas);
  drawAxes(canvas.getContext('2d'), canvas);
  drawVector(canvas, vectorA, 'red');
  drawVector(canvas, vectorB, 'blue');
}

// Function to draw the Pearson correlation visualization
function drawPearsonCorrelation(vectorA, vectorB) {
  const canvas = document.getElementById('pearsonCanvas');
  const ctx = canvas.getContext('2d');
  clearCanvas(canvas);
  drawAxes(ctx, canvas);
  
  // Draw the centered vectors for Pearson correlation
  const centeredA = centerVector(vectorA); // Center vector A
  const centeredB = centerVector(vectorB); // Center vector B
  
  // Draw the centered vectors from the origin
  drawVector(canvas, centeredA, 'red');
  drawVector(canvas, centeredB, 'blue');
}

// Function to draw the OLS coefficient visualization
function drawOLSCoefficient(vectorA, vectorB) {
  const canvas = document.getElementById('olsCanvas');
  const ctx = canvas.getContext('2d');
  clearCanvas(canvas);
  drawAxes(ctx, canvas);
  
  // Calculate the OLS regression line
  const a = olsCoefficient(vectorA, vectorB);

  // Draw the regression line through the origin
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2); // Start from the middle of the canvas on the y-axis
  ctx.lineTo(canvas.width, canvas.height / 2 - (a * canvas.width / 2)); // Passes through the origin
  ctx.strokeStyle = 'green';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw vector A as a point on the canvas
  drawVector(canvas, vectorA, 'red');
}

// Main function to update vectors and redraw all visualizations
function updateVectorsAndVisualizations() {
  const vectorAX1 = parseFloat(document.getElementById('vectorAX1').value);
  const vectorAY1 = parseFloat(document.getElementById('vectorAY1').value);
  const vectorBX1 = parseFloat(document.getElementById('vectorBX1').value);
  const vectorBY1 = parseFloat(document.getElementById('vectorBY1').value);

  const vectorA = [vectorAX1, vectorAY1];
  const vectorB = [vectorBX1, vectorBY1];

  updateDisplay(vectorA, vectorB);

  drawDotProduct(vectorA, vectorB);
  drawCosineSimilarity(vectorA, vectorB);
  drawPearsonCorrelation(vectorA, vectorB);
  drawOLSCoefficient(vectorA, vectorB);
}

// Attach event listeners to the sliders for live-updating
document.getElementById('vectorAX1').addEventListener('input', updateVectorsAndVisualizations);
document.getElementById('vectorAY1').addEventListener('input', updateVectorsAndVisualizations);
document.getElementById('vectorBX1').addEventListener('input', updateVectorsAndVisualizations);
document.getElementById('vectorBY1').addEventListener('input', updateVectorsAndVisualizations);

// Initial draw
updateVectorsAndVisualizations();
