// Authoring definition; generated HTML remains usable on static hosting.
const { modes } = require("../javascript/relationship-content.js");
module.exports = function ({ range, select, seed, chart }) {
  const control = (id, html) =>
    `<div class="relationship-parameter" data-parameter="${id}">${html}</div>`;
  const mapButton = (id, label) =>
    `<button type="button" data-relationship="${id}" aria-pressed="false"><span class="relationship-kind">${modes[id].type}</span><strong>${label}</strong><span>${modes[id].recipe}</span></button>`;
  return {
    beforeWorkspace: `<section class="distribution-map" aria-labelledby="map-title"><h2 id="map-title">One family, different operations</h2><p>Choose a connector to follow its recipe. Each recipe names all its inputs; separate random ingredients must be independent.</p><div class="map-grid"><nav class="distribution-nodes" aria-label="Distribution explorers"><a class="distribution-node node-normal" href="clt-explorer.html?population=normal"><strong>Normal</strong><span>Standard normal: mean 0, SD 1</span></a><a class="distribution-node node-chi" href="chi-squared-explorer.html"><strong>χ²</strong><span>Explore its goodness-of-fit application</span></a><a class="distribution-node node-t" href="t-distribution-explorer.html"><strong>Student’s t</strong><span>A signed ratio with a random scale</span></a><a class="distribution-node node-f" href="f-distribution-explorer.html"><strong>F</strong><span>A ratio of scaled sums of squares</span></a></nav><ol class="relationship-connectors" aria-label="Distribution relationships"><li class="connector-squares">${mapButton("squares", "Normal → χ²")}</li><li class="connector-t">${mapButton("t", "Normal + independent χ² → t")}</li><li class="connector-f">${mapButton("f", "Two independent χ² → F")}</li><li class="connector-square-t">${mapButton("tSquared", "t² → F(1, ν)")}</li><li class="connector-limit">${mapButton("normalLimit", "t → normal as degrees of freedom grow")}</li></ol></div><h3>Follow the test derivations</h3><ul class="test-pathways">${["sampleVariance", "oneSampleT", "pooledT", "anova", "gof"].map((id) => `<li>${mapButton(id, modes[id].title)}</li>`).join("")}</ul></section>`,
    controls:
      select(
        "relationship",
        "Selected relationship",
        Object.entries(modes).map(([id, mode]) => [id, mode.title]),
        "squares",
      ) +
      control(
        "df1",
        range("df1", "Normal squares / numerator df", 1, 100, 1, 1),
      ) +
      control(
        "df2",
        range("df2", "Denominator degrees of freedom ν", 1, 100, 1, 4),
      ) +
      control(
        "sampleSize",
        range("sampleSize", "Observations per sample / group", 2, 100, 1, 5),
      ) +
      control(
        "sampleSize2",
        range("sampleSize2", "Observations in group 2", 2, 100, 1, 5),
      ) +
      control("groups", range("groups", "Number of groups g", 2, 6, 1, 3)) +
      control(
        "categories",
        range("categories", "Number of categories c", 2, 10, 1, 5),
      ) +
      control(
        "observations",
        range("observations", "Categorical observations N", 10, 1000, 10, 100),
      ) +
      range("repetitions", "Available repetitions", 100, 5000, 100, 1000) +
      seed +
      '<input type="number" id="shown" min="1" max="5000" step="1" value="1" hidden><input type="number" id="inspected" min="1" max="5000" step="1" value="1" hidden><input type="number" id="traceStep" min="1" max="4" step="1" value="1" hidden>',
    metrics: "",
    symbolKey: modes.squares.symbols,
    beforePlots: `<section class="relationship-trace" id="relationship-trace" aria-labelledby="trace-title"><p id="relationship-classification" class="relationship-kind"></p><h2 id="trace-title">Follow one repetition</h2><p id="trace-instruction"></p><a href="#map-title">Back to the map</a><div class="trace-navigation"><label for="inspect-repetition">Inspect repetition</label><input type="number" id="inspect-repetition" min="1" max="1" value="1"><button type="button" id="next-draw">Next draw</button><button type="button" id="next-step">Next step</button></div><p id="trace-position" role="status"></p><div id="trace-diagram" class="learning-svg"></div><div id="trace-calculation"></div><p id="trace-working" role="status"></p><details id="trace-input-details" hidden><summary>Inspect all observations in this repetition</summary><div id="trace-inputs"></div></details><div class="lab-actions"><button type="button" id="add-repetitions">Add 100 repetitions</button><button type="button" id="all-repetitions">Show all repetitions</button><button type="button" id="download-repetitions">Download simulated results</button></div></section>`,
    charts: chart(
      "relationshipChart",
      "Repeated results and their reference distribution",
      "Bars collect the final statistic from each displayed repetition. Their height is density, not a count. The solid curve is the exact reference for normal constructions, or the asymptotic χ² reference for categorical goodness of fit. The inspected result is marked when it lies within the plotted range.",
    ),
    method:
      "Each repetition uses a separate seeded random stream. Increasing the displayed count preserves earlier values; inspecting a repetition never changes them. All normal-model test simulations use independent N(0,1) observations with their null hypotheses true. Goodness of fit instead uses independent categorical observations with fixed equal probabilities. Its χ² reference is approximate. Results outside the plotted range remain in the simulation and its results CSV. A zero denominator is reported as undefined and is never redrawn.",
    scripts: [
      "relationship-content",
      "relationship-math",
      "distribution-relationships",
    ],
  };
};
