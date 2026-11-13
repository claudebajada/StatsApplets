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
  let previousKey = null,
    records = [],
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
  function workedExample(c, record, step) {
    const r = record.trace,
      kind = c.relationship;
    const list = (values) =>
      values.slice(0, 4).map(fmt).join(", ") + (values.length > 4 ? " …" : "");
    let items;
    if (kind === "squares") {
      items =
        step === 1
          ? [
              [
                `${c.df1} standard normal draw${c.df1 === 1 ? "" : "s"}`,
                list(r.sample),
              ],
            ]
          : step === 2
            ? [
                ["Normal draws", list(r.sample)],
                ["Square each", list(r.squares)],
              ]
            : step === 3
              ? [
                  ["Independent squares", list(r.squares)],
                  ["Add them", fmt(r.u)],
                ]
              : [
                  ["Sum of squares", fmt(r.u)],
                  ["Reference distribution", `χ²(${c.df1})`],
                ];
    } else if (kind === "t") {
      items =
        step === 1
          ? [
              ["Standard normal Z", fmt(r.z)],
              ["Independent χ² value U", fmt(r.u)],
            ]
          : step === 2
            ? [
                ["χ² value U", fmt(r.u)],
                [`Divide by ν = ${c.df2}`, fmt(r.scaled)],
              ]
            : step === 3
              ? [
                  ["Normal Z", fmt(r.z)],
                  ["SD scale √(U/ν)", fmt(Math.sqrt(r.scaled))],
                  ["Z ÷ scale", fmt(r.t)],
                ]
              : [
                  ["Constructed t score", fmt(r.t)],
                  ["Reference distribution", `t(${c.df2})`],
                ];
    } else if (kind === "f") {
      items =
        step === 1
          ? [
              ["First χ² value U", fmt(r.u)],
              ["Independent χ² value V", fmt(r.v)],
            ]
          : step === 2
            ? [
                [`U ÷ ${c.df1}`, fmt(r.scaledU)],
                [`V ÷ ${c.df2}`, fmt(r.scaledV)],
              ]
            : step === 3
              ? [
                  ["Scaled numerator", fmt(r.scaledU)],
                  ["Scaled denominator", fmt(r.scaledV)],
                  ["Divide", fmt(record.value)],
                ]
              : [
                  ["Constructed F ratio", fmt(record.value)],
                  ["Reference distribution", `F(${c.df1}, ${c.df2})`],
                ];
    } else if (kind === "tSquared") {
      items =
        step === 1
          ? [
              ["Start with a t score", fmt(r.t)],
              ["Degrees of freedom", c.df2],
            ]
          : step === 2
            ? [
                ["t score", fmt(r.t)],
                ["Square it", fmt(record.value)],
              ]
            : step === 3
              ? [
                  ["Squared t", fmt(record.value)],
                  ["F from the same ingredients", fmt(r.f)],
                ]
              : [
                  ["Squared result", fmt(record.value)],
                  ["Reference distribution", `F(1, ${c.df2})`],
                ];
    } else if (kind === "normalLimit") {
      items =
        step === 1
          ? [
              ["Normal numerator", fmt(r.z)],
              ["Random SD scale", fmt(Math.sqrt(r.scaled))],
              ["t score", fmt(r.t)],
            ]
          : step === 2
            ? [
                ["Degrees of freedom ν", c.df2],
                ["Variance of U/ν = 2/ν", fmt(2 / c.df2)],
              ]
            : [
                ["Actual SD scale", fmt(Math.sqrt(r.scaled))],
                ["Normal numerator", fmt(r.z)],
                ["t score", fmt(r.t)],
              ];
    } else if (kind === "sampleVariance" || kind === "oneSampleT") {
      items =
        step === 1
          ? [
              [`${r.n} normal observations`, list(r.sample)],
              ["Sample mean", fmt(r.mean)],
            ]
          : step === 2
            ? [
                ["Residual sum of squares", fmt(r.ss)],
                ["Free directions n − 1", r.df],
                ["Scaled sum U", fmt(r.u)],
              ]
            : step === 3
              ? kind === "oneSampleT"
                ? [
                    ["Sample mean", fmt(r.mean)],
                    ["Estimated SE", fmt(r.sd / Math.sqrt(r.n))],
                    ["Divide to get t", fmt(r.t)],
                  ]
                : [
                    ["Sample variance S²", fmt(r.sd ** 2)],
                    ["Scaled sum U", fmt(r.u)],
                  ]
              : [
                  [
                    kind === "oneSampleT" ? "t statistic" : "χ² statistic",
                    fmt(record.value),
                  ],
                  [
                    "Reference distribution",
                    `${kind === "oneSampleT" ? "t" : "χ²"}(${r.df})`,
                  ],
                ];
    } else if (kind === "pooledT") {
      items =
        step === 1
          ? [
              ["Group means", list(r.parts.map((p) => p.mean))],
              ["Mean difference", fmt(r.difference)],
            ]
          : step === 2
            ? [
                ["Within-group sum of squares", fmt(r.within)],
                ["Combined degrees of freedom", r.df],
              ]
            : step === 3
              ? [
                  ["Mean difference", fmt(r.difference)],
                  ["Estimated SE", fmt(r.se)],
                  ["Divide to get t", fmt(r.t)],
                ]
              : [
                  ["Pooled t statistic", fmt(r.t)],
                  ["Reference distribution", `t(${r.df})`],
                ];
    } else if (kind === "anova") {
      items =
        step === 1
          ? [
              [
                "Normal group means",
                list(r.groups.map((g) => TeachingMath.mean(g))),
              ],
              ["Total sum of squares", fmt(r.total)],
            ]
          : step === 2
            ? [
                ["Between-group SS", fmt(r.between)],
                ["Within-group SS", fmt(r.within)],
              ]
            : step === 3
              ? [
                  ["Between mean square", fmt(r.between / r.dfBetween)],
                  ["Within mean square", fmt(r.within / r.dfWithin)],
                  ["Divide to get F", fmt(record.value)],
                ]
              : [
                  ["ANOVA F statistic", fmt(record.value)],
                  [
                    "Reference distribution",
                    `F(${r.dfBetween}, ${r.dfWithin})`,
                  ],
                ];
    } else {
      items =
        step === 1
          ? [
              ["Observed category counts", list(r.counts)],
              ["Expected per category", fmt(r.expected)],
            ]
          : step === 2
            ? [
                ["Squared discrepancies", list(r.contributions)],
                ["Add them", fmt(record.value)],
              ]
            : [
                ["Sum Q", fmt(record.value)],
                ["Free directions c − 1", r.df],
                ["Approximate reference", `χ²(${r.df})`],
              ];
    }
    const root = get("worked-example");
    root.replaceChildren();
    for (const [label, value] of items) {
      const item = node("div", null, root, { class: "worked-item" });
      node("span", label, item);
      node("strong", String(value), item);
    }
  }
  function theory(kind, step) {
    const mode = modes[kind];
    const currentStep = mode.steps[step - 1];
    get("trace-title").textContent = currentStep.title;
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
      sets =
        step === 1
          ? [trace.counts]
          : step === 2
            ? [trace.residuals]
            : [trace.contributions];
      labels = [
        step === 1
          ? "Observed category counts"
          : step === 2
            ? "Count residuals: sum = 0"
            : "Squared category discrepancies",
      ];
    } else if (kind === "squares") {
      sets = step === 1 ? [trace.sample] : [trace.sample, trace.squares];
      labels =
        step === 1
          ? ["Independent standard normal draws"]
          : ["Independent normal draws", "Squared normal draws"];
    } else if (kind === "sampleVariance" || kind === "oneSampleT") {
      sets = step === 1 ? [trace.sample] : [trace.residuals];
      labels = [
        step === 1
          ? "Normal observations in this sample"
          : "Centred residuals: sum = 0",
      ];
    } else if (kind === "f") {
      sets =
        step === 1
          ? [[trace.u], [trace.v]]
          : [[trace.scaledU], [trace.scaledV]];
      labels =
        step === 1
          ? ["First χ² value", "Independent second χ² value"]
          : ["Scaled numerator", "Scaled denominator"];
    } else if (trace.groups) {
      sets = trace.groups;
      labels = sets.map((_, i) => `Group ${i + 1}: normal observations`);
    } else if (kind === "tSquared") {
      sets =
        step === 1
          ? [[trace.t]]
          : [[trace.t], [trace.t === null ? null : trace.t ** 2]];
      labels =
        step === 1 ? ["Signed t score"] : ["Signed t score", "Squared t score"];
    } else {
      sets = [[trace.z], [trace.u]];
      labels = ["Standard normal numerator Z", "Independent χ² denominator U"];
    }
    sets = sets.map((values) => values.filter(Number.isFinite));
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
        headings = ["Free contrast direction", "Coordinate A", "A²"];
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
    get("relationship-classification").textContent = mode.type;
    get("trace-title").tabIndex = -1;
    get("trace-position").textContent =
      `Step ${state.traceStep} of 4 · Repetition ${state.inspected}`;
    get("inspect-repetition").max = state.shown;
    get("inspect-repetition").value = state.inspected;
    get("previous-step").disabled = state.traceStep === 1;
    get("next-step").disabled = state.traceStep === 4;
    get("next-draw").disabled = state.inspected === state.repetitions;
    get("all-repetitions").disabled = get("add-repetitions").disabled =
      state.shown === state.repetitions;
    get("all-repetitions").textContent =
      `Simulate ${state.repetitions.toLocaleString("en")} repetitions`;
    get("repeated-sampling").hidden = state.traceStep < 4 && state.shown === 1;
    workedExample(c, record, state.traceStep);
    arithmetic(c, record, state.traceStep);
    theory(c.relationship, state.traceStep);
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
  function navigateStep(delta) {
    set({ traceStep: Math.max(1, Math.min(4, read().traceStep + delta)) });
    get("trace-title").focus({ preventScroll: true });
    get("relationship-trace").scrollIntoView({
      block: "start",
      behavior: "instant",
    });
  }
  get("previous-step").addEventListener("click", () => navigateStep(-1));
  get("next-step").addEventListener("click", () => navigateStep(1));
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
  if (location.hash === "#map-title") {
    document.querySelector(".family-details").open = true;
    get("map-title").scrollIntoView({ block: "start" });
  }
});
