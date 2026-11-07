/* Map, inspectable arithmetic and prefix-stable repeated sampling. */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const M = RelationshipMath,
    modes = RelationshipContent.modes;
  const get = (id) => document.getElementById(id);
  const fmt = (x) =>
    x === null || !Number.isFinite(x)
      ? "Undefined"
      : x !== 0 && (Math.abs(x) < 0.0001 || Math.abs(x) >= 1e6)
        ? x.toExponential(5)
        : Number(x.toFixed(5)).toString();
  const node = (tag, text, parent, attrs = {}) => {
    const el = document.createElement(tag);
    if (text !== null) el.textContent = text;
    for (const [key, value] of Object.entries(attrs))
      el.setAttribute(key, value);
    parent.append(el);
    return el;
  };
  function table(headings, rows, caption, root = get("trace-calculation")) {
    root.replaceChildren();
    const wrap = node("div", null, root, {
      class: "table-scroll",
      tabindex: "0",
      role: "region",
      "aria-label": caption,
    });
    const table = node("table", null, wrap);
    node("caption", caption, table);
    const head = node("tr", null, node("thead", null, table));
    headings.forEach((h) => node("th", h, head, { scope: "col" }));
    const body = node("tbody", null, table);
    for (const row of rows) {
      const tr = node("tr", null, body);
      row.forEach((value) =>
        node(
          "td",
          typeof value === "number" || value === null ? fmt(value) : value,
          tr,
        ),
      );
    }
  }
  const chart = initializeChart(get("relationshipChart").getContext("2d"), {
    type: "line",
    data: { datasets: [] },
    options: chartOptions(
      { type: "linear", title: { display: true, text: "Constructed value" } },
      {
        beginAtZero: true,
        title: { display: true, text: "Probability density" },
      },
    ),
  });
  let previousKey = null,
    records = [],
    theoryKind = null,
    current,
    currentConfig;
  const read = () =>
    Object.fromEntries(
      Object.entries(AppletPage.read()).map(([key, value]) => [
        key,
        key === "relationship"
          ? value
          : key === "seed"
            ? AppletState.validate(value, {
                type: "number",
                default: M.defaults.seed,
                min: Number(get("seed").min),
                max: Number(get("seed").max),
                step: 1,
              })
            : Number(value),
      ]),
    );
  const set = (patch) => {
    AppletPage.apply(patch);
    AppletPage.sync();
  };
  function equation(element, markup, label) {
    element.innerHTML = markup;
    element.tabIndex = 0;
    element.setAttribute("role", "region");
    element.setAttribute("aria-label", label);
    // Mobile Chromium does not natively scroll focused regions with arrow keys.
    element.onkeydown = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
        return;
      if (
        ["ArrowLeft", "ArrowRight"].includes(event.key) &&
        element.scrollWidth > element.clientWidth
      ) {
        event.preventDefault();
        element.scrollLeft += event.key === "ArrowRight" ? 40 : -40;
      }
    };
  }
  function theory(kind) {
    const mode = modes[kind];
    get("guided-title").textContent = "Why this relationship works";
    const referenceEquation = document.querySelector(".guided-lab .equation");
    equation(
      referenceEquation,
      mode.steps[3].math,
      "Reference distribution equation",
    );
    document.querySelector(".symbol-key").textContent = mode.symbols;
    get("guided-content").replaceChildren();
    for (const [i, step] of mode.steps.entries()) {
      const section = node("section", null, get("guided-content"), {
        class: "relationship-derivation",
      });
      node("h3", `${i + 1}. ${step.title}`, section);
      node("p", step.text, section);
      equation(
        node("div", null, section, { class: "equation" }),
        step.math,
        `${step.title} equation`,
      );
    }
    const follow = node("nav", null, get("guided-content"), {
      class: "derivation-links",
      "aria-label": "Continue this derivation",
    });
    for (const [target, label] of mode.links) {
      const b = node("button", label, follow, { type: "button" });
      b.addEventListener("click", () => select(target));
    }
    const existing = {
      squares: ["chi-squared-explorer", "Explore χ² goodness of fit"],
      t: ["t-distribution-explorer", "Explore the t curve"],
      f: ["f-distribution-explorer", "Explore the F curve"],
      tSquared: ["f-distribution-explorer", "Explore the F curve"],
      normalLimit: ["t-distribution-explorer", "Compare t and normal"],
      sampleVariance: [
        "confidence-interval-explorer",
        "Explore uncertainty in normal samples",
      ],
      oneSampleT: ["one-sample-t-test", "Use the one-sample t test"],
      pooledT: ["independent-samples-t-test", "Use the pooled t test"],
      anova: ["anova-explorer", "Use the ANOVA explorer"],
      gof: ["chi-squared-explorer", "Use the goodness-of-fit explorer"],
    }[kind];
    node("a", existing[1], follow, { href: `${existing[0]}.html` });
    get("calculation").textContent = mode.assumptions;
  }
  function select(kind) {
    set({ relationship: kind, shown: 1, inspected: 1, traceStep: 1 });
    get("trace-title").focus({ preventScroll: true });
    get("relationship-trace").scrollIntoView({
      block: "start",
      behavior: "instant",
    });
  }
  function diagram(kind, trace, step) {
    const ns = "http://www.w3.org/2000/svg",
      root = get("trace-diagram");
    root.replaceChildren();
    const svg = document.createElementNS(ns, "svg");
    const width = Math.min(640, root.clientWidth || 640);
    svg.setAttribute("role", "img");
    const add = (tag, attrs, text) => {
      const el = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      if (text) el.textContent = text;
      svg.append(el);
    };
    let sets, labels;
    if (kind === "gof") {
      sets = [trace.residuals, trace.contrasts];
      labels = [
        "Count residuals: sum = 0",
        `${trace.df} free contrast directions`,
      ];
    } else if (kind === "squares") {
      sets = [trace.sample, trace.squares];
      labels = [
        "Independent normal draws",
        step > 1 ? "Squared normal draws" : "Next: square each draw",
      ];
    } else if (kind === "sampleVariance" || kind === "oneSampleT") {
      sets = [trace.residuals, trace.contrasts];
      labels = [
        "Centred residuals: sum = 0",
        `${trace.df} independent residual directions`,
      ];
    } else if (kind === "f") {
      sets = [trace.numerator, trace.denominator];
      labels = [
        "Independent numerator normals",
        "Independent denominator normals",
      ];
    } else if (trace.groups) {
      sets = trace.groups;
      labels = sets.map((_, i) => `Group ${i + 1}: normal observations`);
    } else {
      sets = [[trace.z], trace.denominator];
      labels = [
        "Standard normal numerator Z",
        "Independent denominator normals",
      ];
    }
    const rowHeight = 62;
    svg.setAttribute("viewBox", `0 0 ${width} ${sets.length * rowHeight}`);
    const bound = Math.max(1, ...sets.flat().map(Math.abs)) * 1.08;
    const x = (v) => width / 2 + (v / bound) * (width / 2 - 20);
    svg.setAttribute(
      "aria-label",
      labels.join(". ") +
        ". All values appear in the calculation tables as you advance the steps.",
    );
    for (const [i, values] of sets.entries()) {
      const y = 16 + i * rowHeight;
      add("text", { x: 12, y, fill: "#172e47", "font-size": 12 }, labels[i]);
      add("line", {
        x1: 25,
        x2: width - 20,
        y1: y + 21,
        y2: y + 21,
        stroke: "#a8b8c8",
      });
      add("line", {
        x1: width / 2,
        x2: width / 2,
        y1: y + 12,
        y2: y + 30,
        stroke: "#485c70",
      });
      values.forEach((value, j) =>
        add("circle", {
          cx: x(value),
          cy: y + 17 - (j % 3) * 4,
          r: 3,
          fill: i % 2 ? "#a64922" : "#2456a6",
        }),
      );
    }
    root.append(svg);
    node(
      "p",
      "Tick marks indicate zero; each row uses the same numeric scale." +
        (kind === "gof"
          ? " The contrast directions become normal only in the large-count limit."
          : ""),
      root,
      { class: "small" },
    );
  }
  function arithmetic(c, record, step) {
    const kind = c.relationship,
      r = record.trace;
    let headings = ["Quantity", "Value"],
      rows = [],
      working = "";
    if (kind === "squares") {
      if (step <= 2) {
        headings = step === 1 ? ["Draw", "Z"] : ["Draw", "Z", "Z²"];
        rows = r.sample.map((z, i) =>
          step === 1 ? [i + 1, z] : [i + 1, z, r.squares[i]],
        );
        working =
          step === 1
            ? `This repetition contains ${c.df1} independent normal draw${c.df1 === 1 ? "" : "s"}.`
            : "Squaring removes the sign; it does not average the observations.";
      } else {
        rows = [
          ["Sum of the squares U", r.u],
          ["Degrees of freedom k", c.df1],
        ];
        working = `${r.squares.map(fmt).join(" + ")} = ${fmt(r.u)}. Each independent normal square contributes one degree of freedom.`;
      }
    } else if (["t", "tSquared", "normalLimit"].includes(kind)) {
      if (step === 1) {
        headings = ["Source", "Draw", "Value"];
        rows = [
          ["Numerator Z", 1, r.z],
          ...r.denominator.map((z, i) => [
            "Independent denominator normals",
            i + 1,
            z,
          ]),
        ];
        working = "The numerator is not reused in the denominator.";
      } else if (step === 2) {
        rows = [
          ["χ² sum U", r.u],
          ["Denominator df ν", c.df2],
          ["Scaled variance U/ν", r.scaled],
          ["Theoretical Var(U/ν) = 2/ν", 2 / c.df2],
        ];
        working = `${fmt(r.u)} / ${c.df2} = ${fmt(r.scaled)}. Its population mean is 1, but this particular repetition need not equal 1.`;
      } else if (step === 3) {
        rows = [
          ["Normal numerator Z", r.z],
          ["SD scale √(U/ν)", Math.sqrt(r.scaled)],
          ["T = Z / √(U/ν)", r.t],
        ];
        working = `${fmt(r.z)} / ${fmt(Math.sqrt(r.scaled))} = ${fmt(r.t)}.`;
      } else {
        rows =
          kind === "tSquared"
            ? [
                ["T", r.t],
                ["T²", record.value],
                ["F = (Z²/1)/(U/ν), same ingredients", r.f],
                ["F numerator df", 1],
                ["F denominator df", c.df2],
              ]
            : [
                ["T with random denominator", r.t],
                ["Z if denominator were exactly 1", r.z],
                ["Actual scale √(U/ν)", Math.sqrt(r.scaled)],
                ["t degrees of freedom", c.df2],
              ];
        working =
          kind === "tSquared"
            ? "The two computed squared ratios agree within floating-point precision. Squaring loses the t score's sign."
            : kind === "normalLimit"
              ? "The histogram and solid line describe finite-df t; the dashed curve is the standard normal limit. A single repetition can still differ from its Z numerator."
              : "The exact law is t. Its degrees of freedom come from the independently estimated denominator.";
      }
    } else if (kind === "f") {
      if (step === 1) {
        headings = ["Source", "Draw", "Standard normal value"];
        rows = [
          ...r.numerator.map((z, i) => ["Numerator", i + 1, z]),
          ...r.denominator.map((z, i) => ["Independent denominator", i + 1, z]),
        ];
        working =
          "Two separate sets of independent normal draws supply the two sums of squares.";
      } else if (step === 2) {
        rows = [
          ["Numerator sum U", r.u],
          ["Numerator df d₁", c.df1],
          ["Scaled U/d₁", r.scaledU],
          ["Denominator sum V", r.v],
          ["Denominator df d₂", c.df2],
          ["Scaled V/d₂", r.scaledV],
        ];
        working =
          "Divide each sum by its own degrees of freedom before taking the ratio.";
      } else {
        rows = [
          ["Scaled numerator U/d₁", r.scaledU],
          ["Scaled denominator V/d₂", r.scaledV],
          ["F", record.value],
          ["Bare U/V (different scaling)", r.v > 0 ? r.u / r.v : null],
        ];
        working = `${fmt(r.scaledU)} / ${fmt(r.scaledV)} = ${fmt(record.value)}. The reference law is F(${c.df1}, ${c.df2}).`;
      }
    } else if (kind === "sampleVariance" || kind === "oneSampleT") {
      if (step === 1) {
        headings = ["Observation", "Xᵢ", "Sample mean", "Centred residual"];
        rows = r.sample.map((x, i) => [i + 1, x, r.mean, r.residuals[i]]);
        working = `n = ${r.n}, mean = ${fmt(r.mean)}, known-SD Z = √n × mean = ${fmt(r.z)}. The centred residuals sum to ${fmt(r.residuals.reduce((a, b) => a + b, 0))}.`;
      } else if (step === 2) {
        headings = [
          "Independent residual direction",
          "Helmert coordinate Aᵢ",
          "Aᵢ²",
        ];
        rows = r.contrasts.map((a, i) => [i + 1, a, a * a]);
        working = `Sum Aᵢ² = ${fmt(M.sumSquares(r.contrasts))} = SS/σ² = ${fmt(r.u)}. The ${r.df} residual directions are independent of the normal mean direction. Each Aᵢ = √(i/(i+1)) × (mean of first i observations − observation i+1)/σ.`;
      } else if (step === 3) {
        rows = [
          ["Residual SS", r.ss],
          ["Residual df n − 1", r.df],
          ["Sample variance S²", r.sd ** 2],
          ["U = (n − 1)S²/σ²", r.u],
          ["Z", r.z],
          ["T = Z / √(U/(n − 1))", r.t],
        ];
        working = `σ = 1 in this experiment. U/${r.df} = S²/σ² = ${fmt(r.sd ** 2)}. Cancelling σ gives mean/(S/√n) = ${fmt(r.t)}.`;
      } else {
        rows = [
          ["Sample mean", r.mean],
          ["Sample SD S", r.sd],
          ["χ² statistic U", r.u],
          ["Degrees of freedom", r.df],
          ["One-sample T", r.t],
          [
            "Two-sided t p-value",
            r.t === null ? null : StatsMath.tTails(r.t, r.df).twoSided,
          ],
        ];
        working =
          kind === "sampleVariance"
            ? `The histogram collects U and compares it with χ²(${r.df}). The same sample also supplies the t denominator.`
            : `The histogram collects T under the true null and compares it with t(${r.df}). The individual observations are normal.`;
      }
    } else if (kind === "pooledT") {
      if (step === 1) {
        headings = ["Group", "n", "Mean", "Sample SD", "Residual SS"];
        rows = r.parts.map((p, i) => [i + 1, p.n, p.mean, p.sd, p.ss]);
        working = `Difference = ${fmt(r.difference)}. Using σ = 1, Z = difference/√(1/n₁ + 1/n₂) = ${fmt(r.z)}.`;
      } else if (step === 2) {
        rows = [
          ["Group 1 residual SS", r.parts[0].ss],
          ["Group 2 residual SS", r.parts[1].ss],
          ["Combined within SS", r.within],
          ["Combined df n₁+n₂−2", r.df],
        ];
        working =
          "Independent residual sums add. Their total is independent of the difference between sample means under the normal model.";
      } else if (step === 3) {
        rows = [
          ["Pooled variance Sₚ² = SSwithin/ν", r.variance],
          ["Estimated SE of mean difference", r.se],
          ["Difference of sample means", r.difference],
          ["Pooled T", r.t],
        ];
        working = `${fmt(r.difference)} / ${fmt(r.se)} = ${fmt(r.t)}. Two realised sample SDs may differ even when their population variances are equal.`;
      } else {
        rows = [
          ["Pooled T", r.t],
          ["T²", r.t === null ? null : r.t ** 2],
          [
            "ANOVA F on the same observations",
            r.anova.defined ? r.anova.f : null,
          ],
          [
            "Two-sided t p-value",
            r.t === null ? null : StatsMath.tTails(r.t, r.df).twoSided,
          ],
          ["Upper F p-value", r.anova.defined ? r.anova.p : null],
        ];
        working = `ν = ${r.df}. F(1, ${r.df}) and squared t(${r.df}) are the same reference law; the two-group statistics agree for these same data.`;
      }
    } else if (kind === "anova") {
      if (step === 1) {
        headings = [
          "Group",
          "n",
          "Group mean",
          "Within SS",
          "n × (group mean − grand mean)²",
        ];
        rows = r.groups.map((g, i) => [
          i + 1,
          g.length,
          TeachingMath.mean(g),
          M.sumSquares(g.map((x) => x - TeachingMath.mean(g))),
          g.length *
            (TeachingMath.mean(g) - TeachingMath.mean(r.groups.flat())) ** 2,
        ]);
        working = `SSbetween ${fmt(r.between)} + SSwithin ${fmt(r.within)} = SStotal ${fmt(r.total)}. Squared distances partition after summing because cross terms cancel.`;
      } else if (step === 2) {
        headings = [
          "Independent component",
          "SS/σ² (σ = 1)",
          "Degrees of freedom",
        ];
        rows = [
          ["Between group contrasts", r.between, r.dfBetween],
          ["Within group residuals", r.within, r.dfWithin],
        ];
        working = `${c.groups} groups use ${c.groups} fitted means within groups and one grand mean between groups. Under the equal-means null, these are independent central χ² components.`;
      } else if (step === 3) {
        rows = [
          [
            "Between mean square",
            r.defined ? r.msBetween : r.between / r.dfBetween,
          ],
          ["Within mean square", r.within / r.dfWithin],
          ["F = MSbetween/MSwithin", record.value],
        ];
        working = `(${fmt(r.between)}/${r.dfBetween}) / (${fmt(r.within)}/${r.dfWithin}) = ${fmt(record.value)}. The common population variance cancels.`;
      } else {
        rows = [
          ["F", record.value],
          ["Numerator df g − 1", r.dfBetween],
          ["Denominator df N − g", r.dfWithin],
          ["Upper-tail p-value", r.defined ? r.p : null],
        ];
        if (r.pooled)
          rows.push(
            ["Pooled t on the same two groups", r.pooled.t],
            ["Pooled t²", r.pooled.t === null ? null : r.pooled.t ** 2],
          );
        working = r.pooled
          ? "With two groups, the same observations give F = pooled t². Use the existing ANOVA explorer to change population means and study departures from H₀."
          : "Large F values provide evidence against equal population means. Use two groups to see the exact pooled-t² identity.";
      }
    } else {
      if (step <= 2) {
        headings =
          step === 1
            ? ["Category", "Observed O", "Expected E"]
            : ["Category", "Observed O", "Expected E", "Residual R", "R²"];
        rows = r.counts.map((o, i) =>
          step === 1
            ? [i + 1, o, r.expected]
            : [i + 1, o, r.expected, r.residuals[i], r.contributions[i]],
        );
        working = `Total count = ${r.n}. Expected per category = ${fmt(r.expected)}. Residuals sum to zero and are dependent; more repetitions do not change this constraint.`;
      } else if (step === 3) {
        headings = ["Free contrast direction", "Coordinate A", "A²"];
        rows = r.contrasts.map((a, i) => [i + 1, a, a * a]);
        working = `The ${r.df} coordinates preserve the squared length: ${fmt(M.sumSquares(r.contrasts))} = ${fmt(r.value)}. Their normality and independence are approximate, improving as expected counts grow. They are not independent normal draws at finite N.`;
      } else {
        rows = [
          ["Sum of category contributions Q", r.value],
          ["Reference df c − 1", r.df],
          ["Expected count per category", r.expected],
          [
            "Approximate upper-tail χ² p-value",
            StatsMath.chiSquared(
              Array(r.counts.length).fill(r.expected),
              r.counts,
            ).p,
          ],
        ];
        working = `This histogram is the actual finite-count null experiment; χ²(${r.df}) is a continuous approximation. ${r.expected < 5 ? "Expected counts are below 5. The approximation can be unreliable." : "Expected counts are at least 5; this heuristic does not guarantee an exact approximation."}`;
      }
    }
    table(
      headings,
      rows,
      `${modes[kind].steps[step - 1].title}: repetition ${record.index + 1}`,
    );
    get("trace-working").textContent = record.reason || working;
    diagram(kind, r, step);
    get("trace-input-details").hidden = !r.groups;
    if (r.groups)
      table(
        ["Group", "Observation", "Input value"],
        r.groups.flatMap((group, gi) =>
          group.map((value, oi) => [gi + 1, oi + 1, value]),
        ),
        "All normal observations in this repetition",
        get("trace-inputs"),
      );
  }
  function render(restart = false) {
    const state = read();
    const c = M.config(state),
      key = JSON.stringify(Object.keys(M.defaults).map((k) => c[k]));
    const changed = previousKey !== null && previousKey !== key;
    if (changed && restart) {
      state.shown = state.inspected = state.traceStep = 1;
    }
    state.shown = Math.min(state.repetitions, Math.max(1, state.shown));
    state.inspected = Math.min(state.shown, Math.max(1, state.inspected));
    for (const name of ["shown", "inspected", "traceStep"])
      get(name).value = state[name];
    if (key !== previousKey) records = [];
    previousKey = key;
    while (records.length < state.shown) {
      const { index, value, companion } = M.draw(c, records.length);
      records.push({ index, value, companion });
    }
    const displayed = records.slice(0, state.shown);
    const record = M.draw(c, state.inspected - 1),
      mode = modes[c.relationship];
    current = displayed;
    currentConfig = c;
    for (const el of document.querySelectorAll("[data-parameter]"))
      el.hidden = !mode.params.includes(el.dataset.parameter);
    for (const b of document.querySelectorAll("[data-relationship]"))
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.relationship === c.relationship),
      );
    const dfLabel = document.querySelector('label[for="df1"]');
    dfLabel.firstChild.textContent =
      c.relationship === "squares"
        ? "Independent normal squares k: "
        : "Numerator degrees of freedom d₁: ";
    get("relationship-classification").textContent = mode.type;
    get("trace-title").textContent = mode.title;
    get("trace-title").tabIndex = -1;
    get("trace-instruction").textContent =
      mode.recipe +
      ". Follow the arithmetic for one repetition; the full derivation is below the plot.";
    get("trace-position").textContent =
      `Repetition ${state.inspected} of ${state.shown} displayed · Step ${state.traceStep} of 4: ${mode.steps[state.traceStep - 1].title}`;
    get("inspect-repetition").max = state.shown;
    get("inspect-repetition").value = state.inspected;
    get("next-step").disabled = state.traceStep === 4;
    get("next-draw").disabled = state.inspected === state.repetitions;
    get("all-repetitions").disabled = get("add-repetitions").disabled =
      state.shown === state.repetitions;
    arithmetic(c, record, state.traceStep);
    if (theoryKind !== c.relationship) {
      theory(c.relationship);
      theoryKind = c.relationship;
    }
    const plot = M.plot(c, displayed),
      ref = M.reference(c);
    chart.data.datasets = [
      histogramDataset(`${state.shown} simulated results`, plot.bars),
      {
        ...lineDataset(
          `${c.relationship === "gof" ? "Approximate" : "Exact"} ${ref.label} reference`,
          plot.points,
          chartPalette[2],
        ),
        borderDash: [],
      },
    ];
    if (c.relationship === "normalLimit")
      chart.data.datasets.push({
        ...lineDataset(
          "Standard normal limit",
          plot.points.map(({ x }) => ({ x, y: normalDensity(x, 0, 1) })),
          chartPalette[1],
        ),
        borderDash: [6, 4],
      });
    if (
      record.value !== null &&
      record.value >= plot.min &&
      record.value <= plot.max
    ) {
      const peak = Math.max(...plot.points.map((p) => p.y));
      chart.data.datasets.push({
        ...lineDataset(
          "Inspected result",
          [
            { x: record.value, y: 0 },
            { x: record.value, y: peak },
          ],
          chartPalette[3],
        ),
        borderDash: [3, 3],
      });
    }
    chart.options.scales.x.min = plot.min;
    chart.options.scales.x.max = plot.max;
    chart.options.scales.x.title.text =
      c.relationship === "gof"
        ? "Goodness-of-fit Q statistic"
        : `${ref.family === "chi" ? "Sum of standardised squares" : ref.family === "t" ? "Signed t score" : "F ratio"}`;
    chart.update("none");
    const note = `Displaying ${state.shown} of ${state.repetitions} available repetitions. ${plot.outside} result${plot.outside === 1 ? " lies" : "s lie"} outside the plotted range; ${plot.undefinedCount} undefined. The axis covers ${ref.family === "t" ? "the central 99%" : "0 to the 99th percentile"} of the reference law. All simulated results remain in the results CSV. Histogram density uses the full displayed count, without renormalising the visible bars. Singular density endpoints at zero are omitted.`;
    get("scale-note").textContent = note;
    resultMetrics([
      ["Displayed repetitions", state.shown],
      ["Inspected result", fmt(record.value)],
      [
        c.relationship === "gof" ? "Approximate reference" : "Exact reference",
        ref.label,
      ],
    ]);
    const warning =
      c.relationship === "gof" && c.observations / c.categories < 5
        ? "Expected counts are below 5. The χ² approximation may be unreliable. Increasing repetitions does not fix sparse expected counts."
        : record.reason;
    const seedInput = get("seed");
    const seedWarning =
      seedInput.value === "" || !seedInput.checkValidity()
        ? `Enter a whole-number seed from 0 to 2147483647. Using ${c.seed === M.defaults.seed ? "default " : ""}seed ${c.seed} until the input is valid.`
        : "";
    inputWarning([warning, seedWarning].filter(Boolean).join(" "));
    const interpretation = `${mode.type}: ${mode.recipe}. ${state.shown} displayed repetitions; the inspected value is ${fmt(record.value)}. ${c.relationship === "normalLimit" ? "Finite-df t is exact; the dashed normal curve is its limit as degrees of freedom grow." : c.relationship === "gof" ? "The histogram shows finite categorical samples, while the χ² curve is an asymptotic reference." : "Changing repetitions reveals the same law; changing the number of ingredients changes its degrees of freedom."}`;
    document.dispatchEvent(
      new CustomEvent("applet:render", {
        detail: {
          kind: "distribution-relationships",
          config: c,
          shown: state.shown,
          inspected: state.inspected,
          traceStep: state.traceStep,
          result: record,
          interpretation,
        },
      }),
    );
    AppletPage.sync();
  }
  document
    .querySelectorAll("[data-relationship]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        select(button.dataset.relationship),
      ),
    );
  for (const control of document.querySelectorAll(
    "#controls input, #controls select",
  )) {
    if (control.dataset.range) continue;
    const change = () => {
      if (control.id !== "seed" && !control.checkValidity()) return;
      render(true);
    };
    control.addEventListener("input", change);
    control.addEventListener("change", change);
  }
  document.addEventListener("applet:state", (event) =>
    render(!Object.hasOwn(event.detail?.state || {}, "shown")),
  );
  get("next-step").addEventListener("click", () =>
    set({ traceStep: Math.min(4, read().traceStep + 1) }),
  );
  get("next-draw").addEventListener("click", () => {
    const s = read(),
      next = Math.min(s.repetitions, s.inspected + 1);
    set({ inspected: next, shown: Math.max(s.shown, next), traceStep: 1 });
  });
  get("inspect-repetition").addEventListener("change", () => {
    if (!get("inspect-repetition").checkValidity()) return;
    set({ inspected: Number(get("inspect-repetition").value), traceStep: 1 });
  });
  get("add-repetitions").addEventListener("click", () =>
    set({ shown: Math.min(read().repetitions, read().shown + 100) }),
  );
  get("all-repetitions").addEventListener("click", () =>
    set({ shown: read().repetitions }),
  );
  get("download-repetitions").addEventListener("click", () => {
    const ref = M.reference(currentConfig);
    exportText(
      "distribution-relationships-results.csv",
      "repetition,relationship,value,normal_numerator_if_limit,defined,reference\n" +
        current
          .map(
            (r) =>
              `${r.index + 1},${currentConfig.relationship},${r.value ?? ""},${r.companion ?? ""},${r.value !== null},"${ref.label}"`,
          )
          .join("\n"),
      "text/csv",
    );
  });
  render();
});
