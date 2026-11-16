/* Focused lessons, inspectable arithmetic and stable repeated sampling. */
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
  const tooltip = chart.options.plugins.tooltip.callbacks;
  const densityLabel = tooltip.label;
  tooltip.label = (context) =>
    context.dataset.label === "Worked result"
      ? `Worked result: ${fmt(context.parsed.x)}`
      : densityLabel(context);
  let previousKey = null,
    records = [],
    current,
    currentConfig,
    pendingRender;
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
  const short = (x) =>
    x === null || !Number.isFinite(x)
      ? "Undefined"
      : Number(x.toPrecision(3)).toString().replace(/^-/, "−");
  function workedExample(c, record) {
    const r = record.trace;
    const list = (values) =>
      values.slice(0, 5).map(short).join(", ") +
      (values.length > 5 ? " …" : "");
    const ratio = (a, b) => `${short(a)} ÷ ${short(b)}`;
    let items, result;
    switch (c.relationship) {
      case "squares":
        items = [
          ["Independent standard normal draws", list(r.sample)],
          ["Square each draw", list(r.squares)],
        ];
        result = ["Sum of squares", short(record.value)];
        break;
      case "t":
        items = [
          ["Standard normal numerator", short(r.z)],
          ["Independent SD scale √(U/ν)", short(Math.sqrt(r.scaled))],
          [
            "Same numerator with a divisor of 0.5",
            `${ratio(r.z, 0.5)} ≈ ${short(r.z / 0.5)}`,
          ],
        ];
        result = [
          "t from the drawn scale",
          `${ratio(r.z, Math.sqrt(r.scaled))} ≈ ${short(record.value)}`,
        ];
        break;
      case "f":
        items = [
          ["First pool of standard normal draws", list(r.numerator)],
          [
            "Its sum of squares ÷ df",
            `${ratio(r.u, c.df1)} ≈ ${short(r.scaledU)}`,
          ],
          ["Independent second pool", list(r.denominator)],
          [
            "Its sum of squares ÷ df",
            `${ratio(r.v, c.df2)} ≈ ${short(r.scaledV)}`,
          ],
        ];
        result = [
          "F from the two scaled sums",
          `${ratio(r.scaledU, r.scaledV)} ≈ ${short(record.value)}`,
        ];
        break;
      case "tSquared":
        items = [
          ["Signed t score", short(r.t)],
          [
            "F built from the same draws",
            `${ratio(r.z ** 2, r.scaled)} ≈ ${short(r.f)}`,
          ],
        ];
        result = [
          "Squared t score",
          r.t === null
            ? "Undefined"
            : `(${short(r.t)})² ≈ ${short(record.value)}`,
        ];
        break;
      case "normalLimit":
        items = [
          ["Normal score when the scale is 1", short(r.z)],
          ["Drawn SD scale √(U/ν)", short(Math.sqrt(r.scaled))],
        ];
        result = [
          "t from the drawn scale",
          `${ratio(r.z, Math.sqrt(r.scaled))} ≈ ${short(record.value)}`,
        ];
        break;
      case "sampleVariance":
        items = [
          ["Normal observations", list(r.sample)],
          ["Subtract the sample mean of " + short(r.mean), list(r.residuals)],
          ["Square the deviations", list(r.residuals.map((x) => x * x))],
        ];
        result = [
          "Sum of squares ÷ population variance (1 here)",
          short(record.value),
        ];
        break;
      case "oneSampleT":
        items = [
          ["Normal observations", list(r.sample)],
          ["Sample mean minus the null mean of 0", short(r.mean)],
          [
            "Using population SD (known to the simulation)",
            `z ≈ ${short(r.z)} · SE ≈ ${short(1 / Math.sqrt(r.n))}`,
          ],
        ];
        result = [
          "Using estimated SD (calculated from the sample)",
          `t ≈ ${short(record.value)} · SE ≈ ${short(r.sd / Math.sqrt(r.n))}`,
        ];
        break;
      case "pooledT":
        items = [
          [
            "Group 1 − group 2 sample mean",
            `${short(r.parts[0].mean)} − ${short(r.parts[1].mean)} ≈ ${short(r.difference)}`,
          ],
          [
            "Pool the residual sums of squares",
            `(${short(r.parts[0].ss)} + ${short(r.parts[1].ss)}) ÷ ${r.df} ≈ ${short(r.variance)}`,
          ],
          ["Estimated SE of the difference", short(r.se)],
        ];
        result = [
          "Pooled t",
          `${ratio(r.difference, r.se)} ≈ ${short(record.value)}`,
        ];
        break;
      case "anova":
        items = [
          ["Group means", list(r.means)],
          [
            "Between-group variation per degree of freedom",
            `${ratio(r.between, r.dfBetween)} ≈ ${short(r.between / r.dfBetween)}`,
          ],
          [
            "Within-group variation per degree of freedom",
            `${ratio(r.within, r.dfWithin)} ≈ ${short(r.within / r.dfWithin)}`,
          ],
        ];
        if (r.pooled?.t != null)
          items.push([
            "Pooled t squared for these two groups",
            short(r.pooled.t ** 2),
          ]);
        result = [
          "ANOVA F",
          `${ratio(r.between / r.dfBetween, r.within / r.dfWithin)} ≈ ${short(record.value)}`,
        ];
        break;
      case "gof":
        items = [
          ["Observed counts by category", list(r.counts)],
          ["Expected count in each category", short(r.expected)],
          [
            "Squared discrepancies divided by expected counts",
            list(r.contributions),
          ],
        ];
        result = ["Pearson’s χ² statistic", short(record.value)];
        break;
    }
    const root = get("worked-example");
    root.replaceChildren();
    root.dataset.repetition = record.index + 1;
    for (const [label, value] of [...items, result]) {
      const item = node("div", null, root, {
        class:
          label === result[0] ? "worked-item worked-result" : "worked-item",
      });
      node("dt", label, item);
      node("dd", value, item);
    }
  }
  function theory(kind, step) {
    const mode = modes[kind];
    const currentStep = mode.steps[step - 1];
    get("trace-instruction").textContent = currentStep.text;
    const mainMath =
      kind === "sampleVariance" && step === 2
        ? mode.steps[2].math
        : kind === "gof" && step === 3
          ? mode.steps[3].math
          : currentStep.math;
    equation(
      document.querySelector(".guided-lab .equation"),
      mainMath,
      `${currentStep.title} equation`,
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
    } else if (kind === "tSquared") {
      rows =
        step === 1
          ? [
              ["Signed t score", r.t],
              ["Normal numerator Z", r.z],
              ["SD scale √(U/ν)", Math.sqrt(r.scaled)],
            ]
          : step === 2
            ? [
                ["t score", r.t],
                ["t²", record.value],
              ]
            : step === 3
              ? [
                  ["t²", record.value],
                  ["F from the same ingredients", r.f],
                ]
              : [
                  ["Squared t statistic", record.value],
                  ["F numerator df", 1],
                  ["F denominator df", c.df2],
                ];
      working =
        step === 2
          ? `${fmt(r.t)} × ${fmt(r.t)} = ${fmt(record.value)}. Squaring removes the sign.`
          : "The squared t score equals the F ratio from the same independent ingredients. Its numerator has one degree of freedom.";
    } else if (kind === "normalLimit") {
      rows =
        step === 2
          ? [
              ["Degrees of freedom ν", c.df2],
              ["Var(U/ν) = 2/ν", 2 / c.df2],
              ["Realised U/ν", r.scaled],
            ]
          : step === 3
            ? [
                ["Realised U/ν", r.scaled],
                ["Realised SD scale", Math.sqrt(r.scaled)],
                ["Limiting scale", 1],
              ]
            : [
                ["t score", r.t],
                ["Normal numerator Z", r.z],
                ["Actual scale √(U/ν)", Math.sqrt(r.scaled)],
              ];
      working =
        "The histogram and solid line describe finite-df t; the dashed curve is the standard normal limit. Increasing degrees of freedom stabilises the scale. More repetitions alone do not change the law.";
    } else if (kind === "t") {
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
        rows = [
          ["t score", r.t],
          ["Degrees of freedom ν", c.df2],
          ["Normal numerator Z", r.z],
          ["Independent variance scale U/ν", r.scaled],
        ];
        working =
          "The exact law is t. Its degrees of freedom come from the independently estimated denominator.";
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
        headings = ["Observation", "Xᵢ"];
        rows = r.sample.map((x, i) => [i + 1, x]);
        working = `n = ${r.n}, sample mean = ${fmt(r.mean)}, known-SD SE = ${fmt(1 / Math.sqrt(r.n))}, so Z = ${fmt(r.z)}. The observations come from N(0,1).`;
      } else if (step === 2) {
        rows = [
          ["Residual sum of squares", r.ss],
          ["Degrees of freedom n − 1", r.df],
          ["Sample variance S²", r.sd ** 2],
          ["Scaled sum U = (n − 1)S²/σ²", r.u],
        ];
        working = `With σ = 1, (${r.n} − 1) × ${fmt(r.sd ** 2)} = ${fmt(r.u)}. Under normal sampling U follows χ²(${r.df}) and is independent of the sample mean. Open the proof below to inspect the independent directions.`;
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
        headings = ["Quantity", "Value"];
        rows = [
          ["Sum of squared discrepancies Q", r.value],
          ["Free directions c − 1", r.df],
          ["Expected count per category", r.expected],
        ];
        working = `There are ${r.df} free directions because the counts must add to ${r.n}. With large expected counts, their squared length is approximately χ²(${r.df}). Open the proof to inspect the rotated coordinates; they are not independent normal draws at finite N.`;
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
    const proof = get("trace-proof");
    proof.hidden =
      !(["sampleVariance", "oneSampleT"].includes(kind) && step === 2) &&
      !(kind === "gof" && step === 3);
    if (!proof.hidden) {
      const isCounts = kind === "gof";
      proof.querySelector("summary").textContent = isCounts
        ? "Why is χ² an approximation here?"
        : "Why are these squared directions χ²?";
      get("proof-explanation").textContent = isCounts
        ? "The count residuals sum to zero. Rotating their sum-zero subspace preserves squared length and leaves c − 1 coordinates. Their joint distribution approaches independent standard normals as the expected counts grow. At finite counts this is an approximation."
        : "The centred residuals sum to zero and are dependent. An orthonormal rotation preserves squared length and gives n − 1 independent normal coordinates after standardisation. Under the normal model, those directions are independent of the sample mean. These are Helmert coordinates.";
      table(
        ["Free direction", "Coordinate Aᵢ", "Aᵢ²"],
        r.contrasts.map((value, i) => [i + 1, value, value * value]),
        "Independent coordinate calculation",
        get("proof-calculation"),
      );
      get("proof-working").textContent = isCounts
        ? `Sum Aᵢ² = ${fmt(M.sumSquares(r.contrasts))} = Q. The normality and independence are approximate.`
        : `Aᵢ = √(i/(i+1)) × (mean of the first i observations − observation i+1)/σ. Sum Aᵢ² = ${fmt(M.sumSquares(r.contrasts))} = SS/σ².`;
      let formula = proof.querySelector(".proof-equation");
      if (!formula)
        formula = node("div", null, proof, {
          class: "equation proof-equation",
        });
      const proofMode = modes[isCounts ? "gof" : "sampleVariance"];
      equation(
        formula,
        proofMode.steps[isCounts ? 2 : 1].math,
        "Independent directions proof equation",
      );
    }
    table(
      headings,
      rows,
      `${modes[kind].steps[step - 1].title}: repetition ${record.index + 1}`,
    );
    get("trace-working").textContent = record.reason || working;
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
  function render() {
    clearTimeout(pendingRender);
    const state = read();
    const c = M.config(state);
    const key = JSON.stringify(c);
    state.shown = Math.min(state.repetitions, Math.max(1, state.shown));
    state.inspected = Math.min(state.shown, Math.max(1, state.inspected));
    get("shown").value = state.shown;
    get("inspected").max = state.shown;
    get("inspected").value = state.inspected;
    if (key !== previousKey) records = [];
    previousKey = key;
    while (records.length < state.shown) {
      const { index, value, companion } = M.draw(c, records.length);
      records.push({ index, value, companion });
    }
    const displayed = records.slice(0, state.shown);
    const record = M.draw(c, state.inspected - 1);
    const mode = modes[c.relationship];
    current = displayed;
    currentConfig = c;
    get("next-draw").disabled = state.inspected === state.repetitions;
    const allShown = state.shown === state.repetitions;
    const count = state.shown.toLocaleString("en");
    const target = state.repetitions.toLocaleString("en");
    const repeat = get("all-repetitions");
    repeat.disabled = get("add-repetitions").disabled = allShown;
    repeat.textContent = allShown
      ? "All results shown"
      : state.shown === 1
        ? "Repeat the calculation"
        : `Show all ${target} results`;
    get("sampling-status").textContent =
      state.shown === 1 ? "1 result" : `${count} results`;
    workedExample(c, record);
    if (get("relationship-trace").open) {
      arithmetic(c, record, state.traceStep);
      theory(c.relationship, state.traceStep);
    }

    const compareNormal = ["t", "normalLimit"].includes(c.relationship);
    const ref = M.reference(c);
    const plot = M.plot(c, displayed, 40, compareNormal ? [-6, 6] : undefined);
    const approximate = c.relationship === "gof";
    const singular = ref.family !== "t" && ref.df1 === 1;
    const highestBar =
      state.shown > 1 ? Math.max(...plot.bars.map(({ y }) => y)) : 0;
    const yMax = compareNormal
      ? Math.max(0.46, 1.08 * highestBar)
      : singular
        ? 1.2 *
          Math.max(ref.cdf(plot.bars[0].xMax) / plot.bars[0].xMax, highestBar)
        : undefined;

    const referenceLabel = approximate ? `${ref.label} approx.` : ref.label;
    chart.data.datasets = [
      {
        ...lineDataset(referenceLabel, plot.points, chartPalette[2]),
        borderDash: [],
        order: 1,
      },
    ];
    if (state.shown > 1)
      chart.data.datasets.push({
        ...histogramDataset("Simulated", plot.bars),
        order: 2,
      });
    if (compareNormal)
      chart.data.datasets.push({
        ...lineDataset(
          "Normal",
          plot.points.map(({ x }) => ({ x, y: normalDensity(x, 0, 1) })),
          chartPalette[1],
        ),
        order: 1,
      });
    const inRange =
      record.value !== null &&
      record.value >= plot.min &&
      record.value <= plot.max;
    if (inRange)
      chart.data.datasets.push({
        ...lineDataset(
          "Worked result",
          [{ x: record.value, y: 0 }],
          chartPalette[3],
        ),
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: chartPalette[3],
        order: 0,
        clip: 8,
      });
    chart.options.scales.x.min = plot.min;
    chart.options.scales.x.max = plot.max;
    chart.options.scales.x.title.text = approximate
      ? "Goodness-of-fit statistic Q"
      : c.relationship === "sampleVariance"
        ? "Standardised residual sum of squares"
        : ref.family === "chi"
          ? "Sum of squares"
          : ref.family === "t"
            ? "t score"
            : "F ratio";
    chart.options.scales.y.max = yMax;
    chart.update("none");

    const explanation = [
      inRange
        ? `The purple point marks worked result ${short(record.value)}.`
        : record.value === null
          ? "This repetition has an undefined result."
          : `Worked result ${short(record.value)} lies ${record.value < plot.min ? "to the left" : "to the right"} of the plotted range.`,
      state.shown > 1 ? "Bars show the density of simulated results." : "",
      approximate
        ? `The curve is the approximate ${ref.label} reference.`
        : `The solid curve is the ${ref.label} reference.`,
      singular ? "The curve rises off scale near zero." : "",
    ]
      .filter(Boolean)
      .join(" ");
    get("relationshipChart-explanation").textContent = explanation;
    const comparison = get("comparison-note");
    comparison.hidden = !compareNormal;
    if (compareNormal) {
      const tTail = 100 * 2 * ref.cdf(-2);
      const normalTail = 100 * 2 * jStat.normal.cdf(-2, 0, 1);
      comparison.textContent = `Beyond ±2: ${tTail.toFixed(1)}% for ${ref.label}, ${normalTail.toFixed(1)}% for standard normal.`;
    }
    get("scale-note").textContent =
      `${plot.outside} of ${state.shown} results outside the plot and ${plot.undefinedCount} undefined. The export includes every repetition. Histogram density uses the full displayed count, without renormalising the visible bars.`;
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
  for (const control of document.querySelectorAll(
    "#controls input, #controls select",
  )) {
    if (control.hidden || control.dataset.range || control.id === "inspected")
      continue;
    const change = (event) => {
      if (control.id !== "seed" && !control.checkValidity()) return;
      if (
        event.type === "input" &&
        control.type === "range" &&
        Number(get("shown").value) >= 1000
      ) {
        clearTimeout(pendingRender);
        pendingRender = setTimeout(render, 100);
        return;
      }
      render();
    };
    control.addEventListener("input", change);
    control.addEventListener("change", change);
  }
  document.addEventListener("applet:state", render);
  get("relationship-trace").addEventListener("toggle", () => {
    if (get("relationship-trace").open) render();
  });
  get("next-draw").addEventListener("click", () => {
    const s = read();
    const next = Math.min(s.repetitions, s.inspected + 1);
    set({ inspected: next, shown: Math.max(s.shown, next) });
  });
  get("inspected").addEventListener("change", () => {
    const input = get("inspected");
    if (input.value === "" || !input.checkValidity()) {
      input.value = get("worked-example").dataset.repetition;
      return;
    }
    set({ inspected: Number(input.value) });
  });
  get("add-repetitions").addEventListener("click", () =>
    set({ shown: Math.min(read().repetitions, read().shown + 100) }),
  );
  get("all-repetitions").addEventListener("click", () => {
    const { shown, repetitions } = read();
    set({ shown: shown === 1 ? Math.min(25, repetitions) : repetitions });
  });
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
  const mode = modes[read().relationship];
  equation(
    document.querySelector(".relationship-formula"),
    mode.steps[mode.formula - 1].math,
    "Relationship equation",
  );
  if (["#relationship-trace", "#guided-lab"].includes(location.hash))
    get("relationship-trace").open = true;
  render();
  if (location.hash === "#guided-lab") get("guided-lab").scrollIntoView();
  if (location.hash === "#map-title") {
    document.querySelector(".family-details").open = true;
    get("map-title").scrollIntoView({ block: "start" });
  }
});
