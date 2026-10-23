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
    '<div class="preset-picker"><label for="preset">Example</label><select id="preset"><option value="">Custom settings</option></select></div><div class="experiment-actions"><button id="reset" type="button">Reset</button><button id="share" type="button">Copy link</button><button id="resample" type="button" hidden>New sample</button></div><p id="share-status" role="status"></p>';
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
      out.textContent = `For k = ${k} successes, there are C(${n},${k}) = ${coefficient.toFixed(0)} arrangements. Each has probability pᵏ(1 − p)ⁿ⁻ᵏ = ${term.toPrecision(4)}. Multiply them to get P(X = ${k}) = ${StatsMath.binomialPMF(n, p, k).toPrecision(4)}. Changing p changes the probability of each arrangement. Changing n also changes how many arrangements are possible.`;
    } else if (meta.id === "binomial-normal-explorer") {
      const n = get("N"),
        p = get("theta");
      out.textContent = `With n = ${n} and p = ${p.toFixed(2)}, the mean count is np = ${(n * p).toFixed(2)}. Its variance is np(1 − p) = ${(n * p * (1 - p)).toFixed(3)}. Compare the exact probabilities with the normal curve. The approximation usually improves with more trials when p is away from 0 and 1.`;
    } else if (meta.id === "t-distribution-explorer") {
      const df = get("df-slider");
      out.textContent = `With ${df} degrees of freedom, the two-sided 5% critical values are ±${jStat.studentt.inv(0.975, df).toFixed(3)}. The standard normal values are ±1.960. ${df <= 2 ? "The t distribution has no finite variance at these degrees of freedom." : "The t variance is df/(df − 2) = " + (df / (df - 2)).toFixed(3) + "."} Increasing the degrees of freedom brings the t curve closer to the standard normal curve.`;
    } else if (meta.id === "f-distribution-explorer")
      out.textContent = `The numerator has ${get("df1-slider")} degrees of freedom and the denominator has ${get("df2-slider")}. The dashed line marks the critical value with 5% of the null distribution to its right. Changing either set of degrees of freedom changes the curve and that threshold.`;
    else if (meta.id === "chi-squared-explorer")
      out.textContent = `With ${get("total-observations")} observations in ${get("categories")} categories, each expected count under the null is ${(get("total-observations") / get("categories")).toFixed(2)}. The test has ${get("categories") - 1} degrees of freedom. χ² = ${document.getElementById("chi-squared-value").textContent} and Cohen's w = ${document.getElementById("effect-size-value").textContent}. Counts above or below their expected values both increase χ². The shaded upper tail gives the p-value.`;
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
