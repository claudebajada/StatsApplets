// Shared student examples, URL state and current-value explanations.
(function () {
  const meta = AppletCatalogue.find(
    (item) => item.id === document.body.dataset.applet,
  );
  if (!meta) return;
  const settings = [
    ...document.querySelectorAll(
      "#controls input, #controls select, #controls textarea",
    ),
  ];
  function authoredDefault(el) {
    // Firefox can restore live form values on reload. Reset must use the HTML defaults.
    if (el.type === "checkbox") return el.defaultChecked;
    if (el.tagName === "SELECT")
      return (
        [...el.options].find((option) => option.defaultSelected)?.value ??
        el.options[0]?.value ??
        ""
      );
    if (el.tagName === "TEXTAREA") return el.defaultValue;
    return Number(el.defaultValue);
  }
  const schema = Object.fromEntries(
    settings.map((el) => [
      el.id,
      {
        type:
          el.tagName === "SELECT"
            ? "select"
            : el.tagName === "TEXTAREA"
              ? "text"
              : el.type === "checkbox"
                ? "checkbox"
                : "number",
        default: authoredDefault(el),
        options: [...(el.options || [])].map((o) => o.value),
        min: Number(el.min),
        max: Number(el.max),
        step: Number(el.step || 1),
      },
    ]),
  );
  const params = new URLSearchParams(location.search);
  // Earlier paired-data links predate the explicit manual/generated switch.
  if (
    meta.id === "correlation" &&
    params.has("pairs") &&
    !params.has("dataMode")
  )
    params.set("dataMode", "manual");
  const initial = AppletState.decode(params, schema);
  const read = () =>
    Object.fromEntries(
      settings.map((el) => [
        el.id,
        el.type === "checkbox" ? el.checked : el.value,
      ]),
    );
  function assign(state, notify = true) {
    for (const el of settings)
      if (Object.hasOwn(state, el.id)) {
        const value = AppletState.validate(String(state[el.id]), schema[el.id]);
        if (el.type === "checkbox") el.checked = value;
        else el.value = value;
      }
    if (notify) document.dispatchEvent(new Event("applet:state"));
  }
  assign(initial, false);
  const toolbar = document.getElementById("scenario-toolbar");
  toolbar.className = "toolbar";
  toolbar.innerHTML =
    '<div class="preset-picker"><label for="preset">Example</label><select id="preset"><option value="">Custom settings</option></select></div><button id="reset" type="button">Reset</button><button id="share" type="button">Copy example link</button><button id="resample" type="button" hidden>New random sample</button><p id="share-status" role="status"></p>';
  const preset = document.getElementById("preset");
  meta.presets.forEach(([label], index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = label;
    preset.appendChild(option);
  });
  function url() {
    const target = new URL(location.pathname, location.href),
      query = AppletState.encode(read(), schema);
    target.search = query;
    return target;
  }
  function sync() {
    settings.forEach((el) => {
      const out = document.querySelector(`output[for="${el.id}"]`);
      if (out) out.value = el.value;
      if (el.type === "range") el.setAttribute("aria-valuetext", el.value);
    });
    history.replaceState(null, "", url());
  }
  function explain() {
    const get = (id) => Number(document.getElementById(id)?.value),
      out = document.getElementById("calculation");
    if (meta.id === "binomial-components-explorer") {
      const n = get("n"),
        p = get("p"),
        k = Math.floor(n * p),
        coefficient = StatsMath.combinations(n, k),
        term = p ** k * (1 - p) ** (n - k);
      out.textContent = `At k = ${k}, C(${n},${k}) = ${coefficient.toFixed(0)} and pᵏ(1 − p)ⁿ⁻ᵏ = ${term.toPrecision(4)}. Their product P(X = ${k}) = ${StatsMath.binomialPMF(n, p, k).toPrecision(4)}. Moving p changes the probability factors; moving n also changes the number of arrangements.`;
    } else if (meta.id === "binomial-normal-explorer") {
      const n = get("N"),
        p = get("theta");
      out.textContent = `n = ${n}, p = ${p.toFixed(2)}: mean np = ${(n * p).toFixed(2)}, variance np(1 − p) = ${(n * p * (1 - p)).toFixed(3)}. Increasing n spreads individual counts over a wider range while usually improving the relative normal approximation away from p = 0 and 1.`;
    } else if (meta.id === "t-distribution-explorer") {
      const df = get("df-slider");
      out.textContent = `At df = ${df}, the two-sided 5% critical values are ±${jStat.studentt.inv(0.975, df).toFixed(3)}, compared with ±1.960 for Z. ${df <= 2 ? "The t variance is not finite at these degrees of freedom." : "The t variance is df/(df − 2) = " + (df / (df - 2)).toFixed(3) + "."} Increasing df reduces tail heaviness; the central normal reference stays fixed.`;
    } else if (meta.id === "f-distribution-explorer")
      out.textContent = `df₁ = ${get("df1-slider")}, df₂ = ${get("df2-slider")}; P(F > Fcritical | H₀) = 0.05. The dashed vertical line is a critical value, not an observed F statistic. Changing df changes both the shape and the critical threshold.`;
    else if (meta.id === "chi-squared-explorer")
      out.textContent = `N = ${get("total-observations")}, k = ${get("categories")}; each null expected count is ${(get("total-observations") / get("categories")).toFixed(2)} and df = ${get("categories") - 1}. χ² = ${document.getElementById("chi-squared-value").textContent}, w = ${document.getElementById("effect-size-value").textContent}. The shaded upper tail includes departures in either direction among categories; χ² itself has no signed lower-tail alternative.`;
  }
  function afterChange() {
    preset.value = "";
    sync();
    explain();
  }
  document.getElementById("reset").addEventListener("click", () => {
    assign(
      Object.fromEntries(
        Object.entries(schema).map(([key, spec]) => [key, spec.default]),
      ),
    );
    afterChange();
  });
  preset.addEventListener("change", () => {
    if (preset.value === "") return;
    const selected = preset.value;
    assign({
      ...Object.fromEntries(
        Object.entries(schema).map(([key, spec]) => [key, spec.default]),
      ),
      ...meta.presets[Number(selected)][1],
    });
    sync();
    explain();
    preset.value = selected;
  });
  const resample = document.getElementById("resample");
  resample.hidden = !schema.seed;
  resample.addEventListener("click", () => {
    assign({ seed: (Number(read().seed) + 1) % 2147483648 });
    afterChange();
  });
  document.getElementById("share").addEventListener("click", async () => {
    const status = document.getElementById("share-status");
    try {
      await navigator.clipboard.writeText(url().href);
      status.textContent = "Example link copied.";
    } catch {
      status.replaceChildren();
      const field = document.createElement("input");
      field.setAttribute("aria-label", "Example link to copy");
      field.readOnly = true;
      field.value = url().href;
      status.append("Copy this link: ", field);
      field.select();
    }
  });
  for (const el of settings) {
    el.addEventListener("input", () => {
      if (el.type === "number" && !el.checkValidity()) return;
      queueMicrotask(afterChange);
    });
    el.addEventListener("change", () => queueMicrotask(afterChange));
  }
  document.addEventListener("DOMContentLoaded", () => {
    sync();
    explain();
  });
  window.AppletPage = { meta, read, sync, explain, apply: assign };
})();
