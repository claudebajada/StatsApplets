// A geometric view of the current paired data, revealed one step at a time.
function createCorrelationWalkthrough() {
  const get = (id) => document.getElementById(id);
  const set = (id, text) => {
    get(id).textContent = text;
  };
  const format = (n) => (Math.abs(n) < 0.00005 ? "0.0000" : n.toFixed(4));
  const vector = (values) =>
    `(${values.slice(0, 6).map(format).join(", ")}${values.length > 6 ? `, …; ${values.length} components` : ""})`;
  const dotTerms = (a, b) =>
    a
      .slice(0, 6)
      .map((v, i) => `(${format(v)} × ${format(b[i])})`)
      .join(" + ") + (a.length > 6 ? " + …" : "");
  let step = 0,
    currentPairs = [],
    geometry;
  function setStep(index, focus = true) {
    step = Math.max(0, Math.min(3, index));
    for (let i = 0; i < 4; i++) {
      get(`correlation-step-${i}`).hidden = step !== i;
      const button = document.querySelector(`[data-correlation-step="${i}"]`);
      if (step === i) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    }
    get("correlation-previous").disabled = step === 0;
    get("correlation-next").disabled = step === 3;
    set("correlation-step-status", `Step ${step + 1} of 4`);
    if (geometry) draw();
    if (focus)
      get(`correlation-heading-${step}`).focus({ preventScroll: true });
  }
  function attributes(id, values) {
    for (const [key, value] of Object.entries(values))
      get(id).setAttribute(key, value);
  }
  function draw() {
    const g =
      step === 0 ? geometry.raw : step === 1 ? geometry.centred : geometry.unit;
    const names =
      step === 0 ? ["x", "y"] : step === 1 ? ["a", "b"] : ["u", "v"];
    const undefinedAngle = g.cosine === null;
    get("correlation-vector-drawing").style.display = undefinedAngle
      ? "none"
      : "";
    get("correlation-no-angle").style.display = undefinedAngle ? "" : "none";
    const summary = undefinedAngle
      ? "At least one vector has length zero, so it has no direction. Its angle and cosine are undefined. After centring, this means at least one variable has no variation: Pearson’s r is undefined."
      : `${step === 0 ? "Before centring" : step === 1 ? "After centring" : "After setting both lengths to 1"}: ${names[0]} length = ${format(g.lengthX)}, ${names[1]} length = ${format(g.lengthY)}; angle = ${g.angleDegrees.toFixed(1)}°; ${step === 0 ? "raw cosine similarity" : "r"} = ${format(g.cosine)}. ${step === 0 ? "The raw cosine need not equal Pearson’s r." : step === 3 ? `The signed projection of v onto u is ${format(g.cosine)}.` : "Centring determines the angle used by Pearson’s r."}`;
    set("correlation-diagram-summary", summary);
    set(
      "correlation-svg-description",
      summary +
        " Blue solid arrow is " +
        names[0] +
        "; orange dashed arrow is " +
        names[1] +
        ".",
    );
    attributes("correlation-angle-diagram", {
      "data-stage": step,
      "data-angle": g.angleDegrees ?? "undefined",
      "data-cosine": g.cosine ?? "undefined",
    });
    if (undefinedAngle) return;
    const scale = 120 / Math.max(g.lengthX, g.lengthY);
    const tipX = [210 + g.tipX[0] * scale, 215];
    const tipY = [210 + g.tipY[0] * scale, 215 - g.tipY[1] * scale];
    attributes("correlation-vector-x", { x2: tipX[0], y2: tipX[1] });
    attributes("correlation-vector-y", { x2: tipY[0], y2: tipY[1] });
    attributes("correlation-label-x", { x: tipX[0] + 8, y: 239 });
    attributes("correlation-label-y", {
      x: tipY[0] + (g.cosine < 0 ? -8 : 8),
      y: tipY[1] - 12,
      "text-anchor": g.cosine < 0 ? "end" : "start",
    });
    set("correlation-label-x", names[0]);
    set("correlation-label-y", names[1]);
    const radians = (g.angleDegrees * Math.PI) / 180;
    attributes("correlation-angle-arc", {
      d:
        g.angleDegrees < 0.00001
          ? ""
          : `M 246 215 A 36 36 0 0 0 ${210 + 36 * Math.cos(radians)} ${215 - 36 * Math.sin(radians)}`,
    });
    set("correlation-theta-label", `θ = ${g.angleDegrees.toFixed(1)}°`);
    get("correlation-unit-circle").style.display = step >= 2 ? "" : "none";
    for (const id of [
      "correlation-projection",
      "correlation-projection-segment",
      "correlation-projection-foot",
      "correlation-projection-label",
    ])
      get(id).style.display = step === 3 ? "" : "none";
    attributes("correlation-projection-segment", { x2: tipY[0] });
    attributes("correlation-projection-foot", { cx: tipY[0] });
    attributes("correlation-projection-label", { x: (210 + tipY[0]) / 2 });
    set("correlation-projection-label", `r = ${format(g.cosine)}`);
    attributes("correlation-projection", {
      x1: tipY[0],
      y1: tipY[1],
      x2: tipY[0],
      y2: 215,
    });
  }
  function update(pairs) {
    currentPairs = pairs;
    set(
      "correlation-experiment-status",
      `Following the ${pairs.length} current observations. Experiment buttons change these paired values and their shared link; Reset restores the original example.`,
    );
    geometry = TeachingMath.correlationGeometry(pairs);
    const { raw, centred: c, unit, meanX, meanY } = geometry;
    set(
      "correlation-raw-values",
      `x = ${vector(raw.x)}; y = ${vector(raw.y)}.`,
    );
    set(
      "correlation-raw-dot",
      `x · y = ${dotTerms(raw.x, raw.y)} = ${format(raw.dot)}.`,
    );
    set(
      "correlation-centre-values",
      `x̄ = ${format(meanX)}, ȳ = ${format(meanY)}. a = ${vector(c.x)}; b = ${vector(c.y)}.`,
    );
    set(
      "correlation-sums",
      `Sum of centred products a · b = ${format(c.dot)}; centred sums of squares = ${format(c.lengthX ** 2)} and ${format(c.lengthY ** 2)}. ${c.cosine === null ? "A centred length is zero, so r is undefined." : `After normalising, r = ${format(c.cosine)}.`}`,
    );
    set(
      "correlation-length-values",
      `Lx = √${format(c.lengthX ** 2)} = ${format(c.lengthX)}; Ly = √${format(c.lengthY ** 2)} = ${format(c.lengthY)}.`,
    );
    set(
      "correlation-unit-values",
      `u = ${c.lengthX === 0 ? "undefined (zero length)" : vector(unit.x)}; v = ${c.lengthY === 0 ? "undefined (zero length)" : vector(unit.y)}.`,
    );
    set(
      "correlation-angle-result",
      c.cosine === null
        ? "A constant variable becomes a zero vector when centred. There is no direction to normalise, so neither the angle nor Pearson’s r is defined."
        : `For these observations, θ = ${c.angleDegrees.toFixed(1)}° and r = cos(θ) = ${format(c.cosine)}. ${Math.abs(c.cosine) < 1e-10 ? "The centred directions are perpendicular: their deviations have zero net linear alignment." : c.cosine > 0 ? "The angle is less than 90°: the deviations tend to point together." : "The angle is greater than 90°: the deviations tend to point in opposite directions."}`,
    );
    set(
      "correlation-unit-dot",
      c.cosine === null
        ? "Division by a zero vector length is undefined."
        : `u · v = ${dotTerms(unit.x, unit.y)} = ${format(unit.dot)}. Calculations use full precision; the displayed components and angles are rounded.`,
    );
    const rows = get("correlation-rows");
    rows.replaceChildren();
    pairs.slice(0, 30).forEach(([x, y], i) => {
      const tr = document.createElement("tr");
      [x, y, c.x[i], c.y[i], c.x[i] * c.y[i]].forEach((value) => {
        const td = document.createElement("td");
        td.textContent = format(value);
        tr.append(td);
      });
      rows.append(tr);
    });
    draw();
  }
  function usePairs(pairs, message) {
    if (pairs.flat().some((v) => !Number.isFinite(v) || Math.abs(v) > 1e6)) {
      set(
        "correlation-experiment-status",
        "This change would exceed the allowed measurement range. Load the worked example or use smaller values.",
      );
      return;
    }
    AppletPage.apply({
      dataMode: "manual",
      pairs: pairs.map((p) => p.join(",")).join("\n"),
    });
    get("preset").value = "";
    AppletPage.sync();
    set(
      "correlation-experiment-status",
      message +
        " The scatterplot and shared link now use these manual observations.",
    );
  }
  document
    .querySelectorAll("[data-correlation-step]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        setStep(Number(button.dataset.correlationStep)),
      ),
    );
  get("correlation-previous").addEventListener("click", () =>
    setStep(step - 1),
  );
  get("correlation-next").addEventListener("click", () => setStep(step + 1));
  get("correlation-example").addEventListener("click", () => {
    usePairs(
      [
        [2, -1],
        [4, 3],
        [6, 1],
      ],
      "Loaded x = (2, 4, 6), y = (−1, 3, 1). Follow the steps to find r = 0.5.",
    );
    setStep(0, false);
  });
  get("correlation-shift").addEventListener("click", () =>
    usePairs(
      currentPairs.map(([x, y]) => [x, y + 10]),
      "Added 10 to each y value. Its centred deviations and r stay the same.",
    ),
  );
  get("correlation-stretch").addEventListener("click", () =>
    usePairs(
      currentPairs.map(([x, y]) => [x, 2 * y]),
      "Doubled each y value. Its centred length doubles, but its direction and r stay the same.",
    ),
  );
  setStep(0, false);
  return { update };
}
