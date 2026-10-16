// Refresh the committed browser bundles from the pinned, audited npm dependencies.
const fs = require("node:fs");
for (const [source, dest] of [
  ["node_modules/chart.js/dist/chart.umd.min.js", "lib/chart.min.js"],
  ["node_modules/chart.js/LICENSE.md", "lib/chart-LICENSE.md"],
  ["node_modules/jstat/dist/jstat.min.js", "lib/jstat.min.js"],
  ["node_modules/jstat/LICENSE", "lib/jstat-LICENSE"],
])
  fs.copyFileSync(source, dest);
console.log("Vendored Chart.js and jStat from the lockfile.");
