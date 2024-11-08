// Common mathematical utilities
function factorial(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// Efficient combinations function
function combinations(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k); // Symmetry
  let c = 1;
  for (let i = 0; i < k; i++) {
    c = c * (n - i) / (i + 1);
  }
  return c;
}

// Normal density function with σ = 0 handling
function normalDensity(x, mu, sigma) {
  if (sigma === 0) return x === mu ? Infinity : 0;
  const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const exponent = -0.5 * Math.pow((x - mu) / sigma, 2);
  return coefficient * Math.exp(exponent);
}

// // Common chart initialization
// function initializeChart(ctx, type, label, backgroundColor, borderColor, xAxisOptions, yAxisOptions) {
//   return new Chart(ctx, {
//     type: type,
//     data: {
//       labels: [],
//       datasets: [{
//         label: label,
//         data: [],
//         backgroundColor: backgroundColor,
//         borderColor: borderColor,
//         fill: type === 'line'
//       }]
//     },
//     options: {
//       scales: {
//         x: xAxisOptions,
//         y: yAxisOptions
//       },
//       responsive: true,
//       maintainAspectRatio: false
//     }
//   });
// }

// Initialize Chart.js chart with configuration
function initializeChart(ctx, chartConfig) {
  return new Chart(ctx, chartConfig);
}

// Add slider listener
function addSliderListener(id, updateFunction) {
  const slider = document.getElementById(id);
  slider.addEventListener('input', updateFunction);
}

