// Shared authoring template for the overview and focused, static relationship lessons.
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
function family(active = "") {
  const highlights =
    {
      squares: ["normal", "chi"],
      t: ["normal", "chi", "t"],
      f: ["chi", "f"],
      tSquared: ["t", "f"],
      normalLimit: ["t", "normal"],
      sampleVariance: ["normal", "chi"],
      oneSampleT: ["normal", "chi", "t"],
      pooledT: ["normal", "chi", "t"],
      anova: ["normal", "chi", "f"],
      gof: ["chi"],
    }[active] || [];
  const edges =
    {
      squares: ["squares"],
      t: ["t"],
      f: ["f"],
      tSquared: ["tSquared"],
      normalLimit: ["normalLimit"],
      sampleVariance: ["squares"],
      oneSampleT: ["squares", "t"],
      pooledT: ["squares", "t"],
      anova: ["squares", "f"],
    }[active] || [];
  const arrow = (key, path) =>
    `<path class="${edges.includes(key) ? "connection-active" : ""}" d="${path}"/>`;
  const boxes = [
    ["normal", "Normal", 10, 12],
    ["chi", "χ²", 290, 12],
    ["t", "t", 10, 130],
    ["f", "F", 290, 130],
  ];
  return `<figure class="family-map" id="map-title"><svg viewBox="0 0 420 192" role="img" aria-label="${active === "normalLimit" ? "t approaches the standard normal as degrees of freedom increase. " : "Standard normal builds χ² by squaring and adding. Normal with independent χ² builds t. "}Two independent scaled χ² variables build F. Squared t gives F with numerator df 1."><defs><marker id="family-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs><g fill="none" stroke="currentColor" marker-end="url(#family-arrow)">${arrow("squares", "M130 34 H280")}${active === "normalLimit" ? arrow("normalLimit", "M70 120 V65") : arrow("t", "M70 57 V120")}${arrow("f", "M350 57 V120")}${arrow("tSquared", "M130 152 H280")}</g><g class="family-labels" text-anchor="middle"><text x="210" y="23">square + add</text><text x="70" y="83">${active === "normalLimit" ? "df increases" : "+ independent χ²"}</text><text x="70" y="101">${active === "normalLimit" ? "normal limit" : "scale + divide"}</text><text x="350" y="83">+ independent χ²</text><text x="350" y="101">scale + divide</text><text x="210" y="141">square t</text></g>${boxes.map(([key, label, x, y]) => `<g class="${highlights.includes(key) ? "family-active" : ""}"><rect x="${x}" y="${y}" width="120" height="44" rx="5"/><text class="family-node" x="${x + 60}" y="${y + 29}" text-anchor="middle">${label}</text></g>`).join("")}</svg><figcaption>${active === "normalLimit" ? "As its degrees of freedom grow, t approaches Normal." : active === "gof" ? "Category counts reach χ² through a large-sample approximation." : "Standard normal ingredients connect the family."}</figcaption></figure>`;
}
function cards(items, numbered = false) {
  return `<${numbered ? "ol" : "ul"} class="lesson-list ${numbered ? "suggested-route" : ""}">${items.map((l) => `<li><a href="${l.id}.html"><span class="relationship-kind">${modes[l.relationship].type}</span><strong>${l.title}</strong><span>${l.question}</span></a></li>`).join("")}</${numbered ? "ol" : "ul"}>`;
}
module.exports = function ({ range, seed, chart }) {
  function document(title, description, body, scripts, attributes = "") {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${escape(description)}"><title>${escape(title)} · StatsApplets</title><link rel="icon" href="../favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="../css/styles.css">${scripts.includes("shell") ? '<script src="../lib/chart.min.js"></script><script src="../lib/jstat.min.js"></script>' : ""}</head><body class="applet connection-page" ${attributes}><a class="skip-link" href="#main">Skip to lesson</a><nav class="site-nav" aria-label="Main navigation"><a class="brand" href="../index.html">StatsApplets</a><a href="../index.html#distribution-connections">All applets</a></nav><main id="main">${attributes ? `<nav class="lesson-breadcrumbs" aria-label="Breadcrumb"><a href="distribution-relationships.html">Distribution connections</a><span aria-hidden="true">›</span><span aria-current="page">${escape(title)}</span></nav>` : ""}${body}</main><footer><a href="https://github.com/claudebajada/StatsApplets">Source code and documentation</a></footer>${scripts.map((s) => `<script src="../javascript/${s}.js"></script>`).join("")}</body></html>`;
  }
  return {
    overview() {
      return document(
        "How distributions connect",
        "Explore five distribution connections and five test derivations, one lesson at a time.",
        `<header class="connection-intro"><div><h1>How distributions connect</h1><p class="lede">Start with normal random values. See how squaring, adding and dividing produces other distributions.</p><a class="primary-action lesson-start" href="${lessons[0].id}.html">Start with Normal → χ²</a><nav class="journey-links" aria-label="Choose a learning route"><a href="#connections-heading">Build distributions</a><a href="#derivations-heading">From data to test statistics</a></nav></div>${family()}</header><section aria-labelledby="connections-heading"><h2 id="connections-heading">Build distributions</h2><p>Start with random ingredients, apply an operation, then repeat to see the resulting distribution.</p>${cards(lessons.slice(0, 3), true)}<h3>Further connections</h3>${cards(lessons.slice(3, 5))}</section><section class="derivation-overview" aria-labelledby="derivations-heading"><h2 id="derivations-heading">From data to test statistics</h2><p>Start with observations, calculate a statistic, then establish its reference distribution. Sample variance supplies a building block for the tests.</p>${cards(lessons.slice(5))}</section>`,
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
            ? "Number of normal draws"
            : "Numerator degrees of freedom",
          1,
          100,
          1,
          1,
        ],
        df2: [
          kind === "f"
            ? "Denominator degrees of freedom"
            : "Degrees of freedom ν",
          1,
          100,
          1,
          4,
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
          5,
        ],
        sampleSize2: ["Observations in group 2", 2, 100, 1, 5],
        groups: ["Number of groups", 2, 6, 1, 3],
        categories: ["Number of categories", 2, 10, 1, 5],
        observations: ["Categorical observations", 10, 1000, 10, 100],
      };
      const controls =
        `<select id="relationship" aria-label="Lesson relationship" hidden><option value="${kind}" selected>${meta.title}</option></select>` +
        mode.params
          .map(
            (name) =>
              `<div class="relationship-parameter" data-parameter="${name}">${range(name, ...parameters[name])}</div>`,
          )
          .join("");
      const [explorerId, explorerLabel] = explorer[kind];
      const next =
        !derivation && meta.order < 4 ? lessons[meta.order + 1] : null;
      const primary = derivation
        ? `<a class="primary-action" href="${explorerId}.html">${explorerLabel}</a>`
        : next
          ? `<a class="primary-action" href="${next.id}.html">Next connection: ${next.title}</a>`
          : '<a class="primary-action" href="distribution-relationships.html#derivations-heading">Explore test derivations</a>';
      const related = mode.links
        .map(
          ([target, label]) =>
            `<a href="${byMode[target].id}.html">${label}</a>`,
        )
        .join("");
      const proofLink =
        kind === "oneSampleT"
          ? `<a href="${byMode.sampleVariance.id}.html">Why does sample variance follow χ²?</a>`
          : "";
      return document(
        meta.title,
        meta.question,
        `<header class="lesson-intro"><p class="eyebrow">${derivation ? "From data to test statistics" : "Build distributions"} · <span id="relationship-classification">${mode.type}</span></p><h1>${meta.title}</h1><p class="lede">${meta.question}</p><p class="active-recipe">${meta.recipe}</p></header>
        <section class="relationship-trace" id="relationship-trace" aria-labelledby="trace-title"><p class="step-progress" id="trace-position" role="status"></p><h2 id="trace-title">${mode.steps[0].title}</h2>
        <div class="example-workspace"><div class="example-main"><div id="worked-example" class="worked-example" role="status" aria-label="Worked example"></div><div id="trace-diagram" class="learning-svg"></div><p class="essential-condition">${meta.condition}</p></div>
        <aside class="experiment" aria-labelledby="parameters-heading"><h3 id="parameters-heading">${derivation ? "Change the sample" : "Change the ingredients"}</h3><section id="controls" class="controls-panel" aria-label="Parameters">${controls}<details class="wide lesson-options"><summary>Other examples and settings</summary><div id="scenario-toolbar"></div>${range("repetitions", "Repetitions available", 100, 5000, 100, 1000)}${seed}</details><input type="number" id="shown" min="1" max="5000" step="1" value="1" hidden><input type="number" id="inspected" min="1" max="5000" step="1" value="1" hidden><input type="number" id="traceStep" min="1" max="4" step="1" value="1" hidden></section><p id="input-warning" class="notice" role="status" hidden></p></aside></div>
        <p id="trace-instruction"></p><div class="guided-lab" id="guided-lab"><div class="equation"></div><details class="symbol-details"><summary>What the symbols mean</summary><p class="symbol-key">${mode.symbols}</p></details></div>
        <details id="trace-numbers" class="trace-numbers" ${derivation ? "open" : ""}><summary>Inspect the numbers</summary><div id="trace-calculation"></div><p id="trace-working" role="status"></p></details>
        <details id="trace-proof" hidden><summary>Why are these squared directions χ²?</summary><p id="proof-explanation"></p><div id="proof-calculation"></div><p id="proof-working"></p>${proofLink}</details>
        <details id="trace-input-details" hidden><summary>Inspect all observations in this repetition</summary><div id="trace-inputs"></div></details>
        <details class="assumption-details"><summary>Full conditions and assumptions</summary><p id="calculation">${mode.assumptions}</p></details>
        <div class="trace-navigation"><button type="button" id="previous-step">Back</button><button type="button" id="next-step" class="primary-action">Next step</button></div></section>
        <section id="repeated-sampling" class="repeated-sampling" aria-labelledby="sampling-title" hidden><h2 id="sampling-title">Repeat to reveal the distribution</h2><p>Each repetition contributes one final result. More repetitions reveal the same law; they do not change its degrees of freedom.</p><div class="lab-actions"><button type="button" id="all-repetitions" class="primary-action">Simulate 1,000 repetitions</button><button type="button" id="add-repetitions">Add 100 repetitions</button></div><section class="result-card" aria-label="Current results"><div class="metrics"></div></section>${chart("relationshipChart", "Repeated results and their reference distribution", "Bars collect the final statistic from each displayed repetition. Height is density, not a count. The solid curve is the reference distribution; the inspected result is marked when it lies in the plotted range.")}<div class="trace-navigation"><label for="inspect-repetition">Inspect repetition</label><input type="number" id="inspect-repetition" min="1" max="1" value="1"><button type="button" id="next-draw">Next draw</button><a href="#relationship-trace">Follow this result’s calculation</a></div><details class="plot-details"><summary>Plotting details and simulated results</summary><p id="scale-note" class="small" role="status"></p><p>Results outside the plotted range remain in the CSV. A zero denominator is undefined and is never redrawn. More repetitions keep earlier values from the same seeded sequence.</p><button type="button" id="download-repetitions">Download simulated results</button></details></section>
        <nav class="related-learning" aria-label="Continue learning"><h2>Continue exploring</h2><p class="next-lesson">${primary}</p>${related ? `<details class="related-derivations"><summary>${derivation ? "Related derivations" : "Use this connection in a test"}</summary><div class="derivation-links">${related}</div></details>` : ""}${!derivation ? `<p><a href="${explorerId}.html">${explorerLabel}</a></p>` : ""}<details class="family-details"><summary>See the full distribution family</summary>${family(kind)}</details><p><a href="distribution-relationships.html">All distribution connections and derivations</a></p></nav>`,
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
        `data-applet="${meta.id}" data-relationship-lesson="${kind}" data-lesson-type="${derivation ? "derivation" : "connection"}"`,
      );
    },
  };
};
