// Shared presets, URL state, lecturer scenarios and current-value explanations.
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
        default:
          el.type === "checkbox"
            ? el.checked
            : el.tagName === "SELECT" || el.tagName === "TEXTAREA"
              ? el.value
              : Number(el.value),
        options: [...(el.options || [])].map((o) => o.value),
        min: Number(el.min),
        max: Number(el.max),
        step: Number(el.step || 1),
      },
    ]),
  );
  const params = new URLSearchParams(location.search);
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
    '<div class="preset-picker"><label for="preset">Teaching example</label><select id="preset"><option value="">Custom settings</option></select></div><button id="reset" type="button">Reset</button><button id="share" type="button">Copy example link</button><button id="resample" type="button" hidden>New random sample</button><label class="check-label"><input id="lecturer" type="checkbox"> Lecturer mode</label><p id="share-status" role="status"></p>';
  const preset = document.getElementById("preset");
  meta.presets.forEach(([label], index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = label;
    preset.appendChild(option);
  });
  const panel = document.getElementById("lecturer-panel");
  panel.className = "lecturer-card";
  panel.hidden = true;
  panel.innerHTML =
    '<h2>Lecturer scenario</h2><p>Notes, a guided question and the current settings travel together in the example link. Keep shared notes free of personal information.</p><div class="lesson-fields"><div><label for="lesson-title">Scenario title</label><input id="lesson-title" maxlength="120"></div><div><label for="lesson-prompt">Student question</label><textarea id="lesson-prompt" rows="3" maxlength="800"></textarea></div><div><label for="lesson-answer">Teaching notes / answer</label><textarea id="lesson-answer" rows="3" maxlength="1200"></textarea></div></div><label class="check-label"><input type="checkbox" id="student-view"> Present student view (hide answers and editing fields)</label><section class="exercise"><h3 id="exercise-title"></h3><p id="exercise-prompt"></p><button id="reveal-answer" type="button">Reveal discussion notes</button><p id="exercise-answer" hidden></p></section><p class="small">Student view hides the answer on screen; it is still included in the URL. This is for teaching, not secure assessment.</p>';
  const lecturer = document.getElementById("lecturer"),
    student = document.getElementById("student-view");
  const lessonFields = [
    ["lesson-title", "_title", meta.title],
    ["lesson-prompt", "_prompt", meta.question],
    ["lesson-answer", "_answer", meta.answer],
  ];
  for (const [id, key, fallback] of lessonFields) {
    const el = document.getElementById(id),
      raw = params.get(key);
    el.value = raw && raw.length <= el.maxLength ? raw : fallback;
  }
  lecturer.checked = params.get("_lecture") === "1";
  student.checked = params.get("_student") === "1";
  function updateLesson() {
    panel.hidden = !lecturer.checked;
    document.getElementById("exercise-title").textContent =
      document.getElementById("lesson-title").value;
    document.getElementById("exercise-prompt").textContent =
      document.getElementById("lesson-prompt").value;
    document.getElementById("exercise-answer").textContent =
      document.getElementById("lesson-answer").value;
    panel.querySelector(".lesson-fields").hidden = student.checked;
    if (student.checked)
      document.getElementById("exercise-answer").hidden = true;
  }
  function url() {
    const target = new URL(location.pathname, location.href),
      query = AppletState.encode(read(), schema);
    if (lecturer.checked) {
      query.set("_lecture", "1");
      for (const [id, key] of lessonFields)
        query.set(key, document.getElementById(id).value);
      if (student.checked) query.set("_student", "1");
    }
    target.search = query;
    return target;
  }
  function sync() {
    settings.forEach((el) => {
      const out = document.querySelector(`output[for="${el.id}"]`);
      if (out) out.value = el.value;
      if (el.type === "range") el.setAttribute("aria-valuetext", el.value);
    });
    updateLesson();
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
  for (const el of [
    lecturer,
    student,
    ...lessonFields.map(([id]) => document.getElementById(id)),
  ])
    el.addEventListener("input", () => {
      updateLesson();
      sync();
    });
  document.getElementById("reveal-answer").addEventListener("click", () => {
    const answer = document.getElementById("exercise-answer");
    answer.hidden = !answer.hidden;
  });
  document.addEventListener("DOMContentLoaded", () => {
    sync();
    explain();
  });
  window.AppletPage = { meta, read, sync, explain, apply: assign };
})();
