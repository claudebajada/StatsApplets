// Shared authoring template for the overview and static relationship lessons.
const {
  modes,
  lessons,
  byMode,
} = require("../javascript/relationship-content.js");
const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
const explorer = {
  squares: ["chi-squared-explorer", "Explore χ² goodness of fit"],
  t: ["t-distribution-explorer", "Explore the t curve"],
  f: ["f-distribution-explorer", "Explore the F curve"],
  tSquared: ["f-distribution-explorer", "Explore the F curve"],
  normalLimit: ["t-distribution-explorer", "Compare t and normal"],
  sampleVariance: [
    "confidence-interval-explorer",
    "Explore confidence intervals",
  ],
  oneSampleT: ["one-sample-t-test", "Use the one-sample t test"],
  pooledT: ["independent-samples-t-test", "Use the pooled t test"],
  anova: ["anova-explorer", "Use the ANOVA explorer"],
  gof: ["chi-squared-explorer", "Use the goodness-of-fit explorer"],
};
const lessonLink = (key, label) =>
  `<a href="${byMode[key].id}.html">${label}</a>`;

function family(active = "") {
  const edge = (key, source, label, result, extra = "") => {
    const className = `family-edge edge-${key} ${extra}`.trim();
    return `<a class="${className}" href="${byMode[key].id}.html" aria-label="${byMode[key].title}. ${label}" ${key === active ? 'aria-current="page"' : ""}><span class="family-source" aria-hidden="true">${source}</span><span class="family-operation">${label}</span><span class="edge-arrow" aria-hidden="true">→</span><span class="family-result" aria-hidden="true">${result}</span></a>`;
  };
  return `<nav class="family-map" id="map-title" aria-label="Distribution family map">
    ${edge("squares", "Normal", "Square and add", "χ²", active ? "" : "primary-action")}
    ${edge("t", "Normal + χ²", "Divide by an independent scale", "t")}
    ${edge("f", "χ² + χ²", "Divide two independent scaled χ² values", "F")}
    ${edge("tSquared", "t", "Square t", "F")}
    ${edge("normalLimit", "t", "Increase t’s degrees of freedom", "Normal")}
  </nav>`;
}

module.exports = function ({ range, seed, chart }) {
  function document(title, description, body, scripts, attributes = "") {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${escape(description)}"><title>${escape(title)} · StatsApplets</title><link rel="icon" href="../favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="../css/styles.css">${scripts.includes("shell") ? '<script src="../lib/chart.min.js"></script><script src="../lib/jstat.min.js"></script>' : ""}</head><body class="applet connection-page" ${attributes}><a class="skip-link" href="#main">Skip to lesson</a><nav class="site-nav" aria-label="Main navigation"><a class="brand" href="../index.html">StatsApplets</a><a href="../index.html#explorers">All applets</a></nav><main id="main">${attributes ? '<nav class="lesson-breadcrumbs" aria-label="Breadcrumb"><a href="distribution-relationships.html">How distributions connect</a></nav>' : ""}${body}</main><footer><a href="https://github.com/claudebajada/StatsApplets">Source code and documentation</a></footer>${scripts.map((s) => `<script src="../javascript/${s}.js"></script>`).join("")}</body></html>`;
  }
  return {
    overview() {
      return document(
        "How distributions connect",
        "Start with normal draws and build chi-squared, t and F. See where the same calculations appear in statistical tests.",
        `<header class="lesson-intro overview-intro"><h1>How distributions connect</h1><p class="lede">Start by squaring and adding a few normal draws. Repeat the calculation to see a distribution take shape, then follow the same ingredients into t and F.</p></header>
          <div class="connection-overview"><section aria-labelledby="connections-heading"><h2 id="connections-heading">Build distributions</h2><p class="connection-section-intro">Choose an operation to see it take shape.</p>${family()}</section>
          <section class="derivation-overview" aria-labelledby="derivations-heading"><h2 id="derivations-heading">From data to test statistics</h2><p>Start with observations and see where the reference distribution comes from.</p>
          <ul class="lesson-list">${lessons
            .slice(5)
            .map(
              (l) =>
                `<li>${lessonLink(l.relationship, `<span>${l.title}</span>`)}</li>`,
            )
            .join("")}</ul></section></div>`,
        ["relationship-content", "relationship-redirect"],
      );
    },
    lesson(meta) {
      const kind = meta.relationship,
        mode = modes[kind],
        derivation = meta.section === "Test derivations";
      const parameters = {
        df1: [
          kind === "squares"
            ? "Normal draws per sum"
            : "Numerator degrees of freedom",
          1,
          100,
          1,
        ],
        df2: [
          kind === "f"
            ? "Denominator degrees of freedom"
            : "Degrees of freedom ν",
          1,
          100,
          1,
        ],
        sampleSize: [
          kind === "pooledT"
            ? "Observations in group 1"
            : kind === "anova"
              ? "Observations per group"
              : "Observations per sample",
          2,
          100,
          1,
        ],
        sampleSize2: ["Observations in group 2", 2, 100, 1],
        groups: ["Number of groups", 2, 6, 1],
        categories: ["Number of categories", 2, 10, 1],
        observations: ["Observations per sample", 10, 1000, 10],
      };
      const controls = mode.params
        .map(
          (name) =>
            `<div class="relationship-parameter">${range(name, ...parameters[name], meta.baseline[name])}</div>`,
        )
        .join("");
      const [explorerId, explorerLabel] = explorer[kind];
      const related = [
        ...mode.links.map(([target, label]) => lessonLink(target, label)),
        `<a href="${explorerId}.html">${explorerLabel}</a>`,
      ];
      const plotTitle = derivation
        ? "Across repeated samples"
        : "Across repeated calculations";
      return document(
        meta.title,
        meta.question,
        `<header class="lesson-intro"><h1>${meta.title}</h1><p class="lede">${meta.question}</p></header>
        <div id="controls">
          <select id="relationship" aria-label="Lesson relationship" hidden><option value="${kind}" selected>${meta.title}</option></select>
          <input type="number" id="shown" min="1" max="5000" step="1" value="1" hidden>
          <div class="relationship-workspace">
            <section class="relationship-example" aria-labelledby="worked-title">
              <h2 id="worked-title">${derivation ? "One sample" : "One calculation"}</h2>
              <dl id="worked-example" class="worked-example"></dl>
            </section>
            <section id="repeated-sampling" class="repeated-sampling" aria-label="Repeated sampling">
              <p class="sample-bridge">Each ${derivation ? "sample" : "calculation"} gives one result. Repeat to see how the results are distributed.</p>
              <div class="sampling-action"><button type="button" id="all-repetitions" class="primary-action">Repeat the calculation</button><span id="sampling-status" role="status"></span></div>
              ${chart("relationshipChart", plotTitle, "The purple point marks the result from the worked example. The bars show simulated results. The curve shows the reference distribution.", "plot-data")}
              <p id="comparison-note" class="relationship-comparison" hidden></p>
              <div class="relationship-controls">
                ${controls}
                <p class="relationship-prompt">${mode.try}</p>
                <p id="input-warning" class="notice" role="status" hidden></p>
              </div>
            </section>
            <div class="relationship-explanation">
              <p class="relationship-insight">${mode.insight}</p>
              <div class="relationship-formula equation">${mode.steps[mode.formula - 1].math}</div>
              <p class="essential-condition">${meta.condition}</p>
            </div>
          </div>
          <details id="relationship-trace" class="relationship-details">
            <summary>Calculation, settings and data</summary>
            <div class="trace-navigation">
              <label for="inspected">Inspect repetition</label><input type="number" id="inspected" min="1" max="5000" step="1" value="1">
              <button type="button" id="next-draw">Next draw</button>
              <button type="button" id="add-repetitions">Add 100 repetitions</button>
            </div>
            <div class="trace-navigation">
              <label for="traceStep">Calculation detail</label>
              <select id="traceStep">${mode.steps.map((step, i) => `<option value="${i + 1}">${step.title}</option>`).join("")}</select>
            </div>
            <div class="guided-lab" id="guided-lab"><p id="trace-instruction"></p><div class="equation"></div><p class="symbol-key">${mode.symbols}</p></div>
            <div id="trace-calculation"></div><p id="trace-working"></p>
            <details id="trace-proof" hidden><summary>Why are these squared directions χ²?</summary><p id="proof-explanation"></p><div id="proof-calculation"></div><p id="proof-working"></p></details>
            <details id="trace-input-details" hidden><summary>Inspect all observations in this repetition</summary><div id="trace-inputs"></div></details>
            <details class="assumption-details"><summary>Full conditions and assumptions</summary><p id="calculation">${mode.assumptions}</p></details>
            <details class="lesson-options"><summary>Presets and simulation settings</summary><div id="scenario-toolbar"></div>${range("repetitions", "Target repetitions", 100, 5000, 100, 1000)}${seed}</details>
            <div id="plot-data"></div><p id="scale-note" class="small"></p>
            <button type="button" id="download-repetitions">Download all simulated results</button>
          </details>
        </div>
        <nav class="related-learning" aria-label="Related lessons"><h2>Where to go next</h2><ul class="related-links">${related.map((link) => `<li>${link}</li>`).join("")}</ul><details class="family-details"><summary>See the distribution family map</summary>${family(kind)}</details></nav>`,
        [
          "statistics",
          "teaching-statistics",
          "relationship-content",
          "catalogue",
          "state",
          "learning-math",
          "learning-content",
          "common",
          "shell",
          "relationship-math",
          "distribution-relationships",
        ],
        `data-applet="${meta.id}" data-relationship-lesson="${kind}"`,
      );
    },
  };
};
