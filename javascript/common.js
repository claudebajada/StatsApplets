// Shared chart styles, numerical formatting and accessible data alternatives.
function combinations(n, k) {
  return StatsMath.combinations(n, k);
}
function normalDensity(x, mean, sd) {
  return StatsMath.normalDensity(x, mean, sd);
}
const chartPalette = ["#2456a6", "#a64922", "#006b69", "#793d91", "#6b5910"];
Chart.defaults.color = "#485c70";
Chart.defaults.font.family = '"Source Sans 3", sans-serif';
Chart.defaults.font.size = 13;
Chart.defaults.animation = false;
Chart.defaults.elements.point.radius = 0;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.boxHeight = 8;
Chart.defaults.plugins.legend.labels.padding = 14;
Chart.defaults.plugins.tooltip.backgroundColor = "#172e47";
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 3;
Chart.defaults.scale.grid.color = "#e3e9ef";
Chart.defaults.scale.border.color = "#a8b8c8";
Chart.defaults.scale.title.color = "#334c65";
Chart.defaults.scale.title.font = { size: 13, weight: "600" };
function initializeChart(ctx, config) {
  return new Chart(ctx, config);
}
function chartOptions(x = {}, y = {}) {
  return {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { ...x }, y: { ...y } },
    plugins: {
      legend: { labels: { boxWidth: 12, padding: 14 } },
      tooltip: {
        callbacks: {
          label(context) {
            const p = context.parsed;
            return `${context.dataset.label}: ${Number(p.y).toPrecision(5)}`;
          },
        },
      },
    },
  };
}
function addSliderListener(id, update) {
  document.getElementById(id).addEventListener("input", update);
}
function formatProbability(p) {
  if (p === 0) return "Below floating-point range";
  return p > 0 && p < 0.0001 ? p.toExponential(3) : p.toFixed(4);
}
function curvePoints(min, max, density, count = 401) {
  return Array.from({ length: count }, (_, i) => {
    const x = min + ((max - min) * i) / (count - 1);
    return { x, y: density(x) };
  });
}
function lineDataset(label, data = [], color = chartPalette[0]) {
  const i = Math.max(0, chartPalette.indexOf(color));
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: color + "33",
    pointRadius: 0,
    borderWidth: 2,
    borderDash: i === 1 ? [6, 4] : i === 2 ? [2, 3] : [],
    pointStyle: ["circle", "triangle", "rect"][i % 3],
    fill: false,
  };
}
function watchControls(update) {
  document
    .querySelectorAll("#controls input,#controls select,#controls textarea")
    .forEach((el) => {
      const handle = () => {
        if (el.type === "number" && !el.checkValidity()) return;
        update();
      };
      el.addEventListener("input", handle);
      el.addEventListener("change", handle);
    });
  document.addEventListener("applet:state", update);
}
function inputWarning(message = "") {
  const el = document.getElementById("input-warning");
  if (el) {
    el.textContent = message;
    el.hidden = !message;
  }
}
function resultMetrics(entries) {
  const container = document.querySelector(".result-card .metrics");
  container.replaceChildren();
  for (const [label, value] of entries) {
    const box = document.createElement("div");
    box.className = "metric";
    const text = document.createElement("span");
    text.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    box.append(text, strong);
    container.append(box);
  }
}
function exportText(filename, text, type = "text/plain") {
  const a = document.createElement("a"),
    url = URL.createObjectURL(new Blob([text], { type }));
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function chartRows(chart) {
  return chart.data.datasets.flatMap((ds) =>
    ds.data
      .map((p, i) =>
        p === null
          ? null
          : {
              series: ds.label || "Data",
              x: typeof p === "object" ? p.x : (chart.data.labels?.[i] ?? i),
              y: typeof p === "object" ? p.y : p,
            },
      )
      .filter((p) => p && p.y !== null && Number.isFinite(Number(p.y))),
  );
}
const accessibleCharts = {
  id: "accessibleCharts",
  afterUpdate(chart) {
    const figure = chart.canvas.closest("figure");
    if (!figure) return;
    chart.canvas.setAttribute("tabindex", "0");
    let caption = figure.querySelector(".chart-summary");
    if (!caption) {
      caption = document.createElement("figcaption");
      caption.className = "chart-summary visually-hidden";
      caption.id = chart.canvas.id + "-summary";
      figure.append(caption);
      chart.canvas.setAttribute(
        "aria-describedby",
        chart.canvas.id + "-explanation " + caption.id,
      );
      const details = document.createElement("details");
      details.className = "chart-data";
      const summary = document.createElement("summary");
      summary.textContent = "Inspect data or download CSV";
      details.append(summary);
      const tableWrap = document.createElement("div");
      tableWrap.className = "table-scroll";
      details.append(tableWrap);
      const download = document.createElement("button");
      download.type = "button";
      download.textContent = "Download all plotted values";
      details.append(download);
      figure.append(details);
      download.addEventListener("click", () => {
        const rows = chartRows(chart),
          quote = (v) => '"' + String(v).replaceAll('"', '""') + '"';
        exportText(
          chart.canvas.id + ".csv",
          "series,x,y\n" +
            rows.map((p) => [quote(p.series), p.x, p.y].join(",")).join("\n"),
          "text/csv",
        );
      });
      details.addEventListener("toggle", () => {
        if (!details.open) return;
        tableWrap.replaceChildren();
        const table = document.createElement("table"),
          cap = document.createElement("caption");
        cap.textContent =
          "First 100 plotted values. CSV contains all plotted values.";
        table.append(cap);
        const head = document.createElement("thead"),
          tr = document.createElement("tr");
        for (const title of ["Series", "x", "y"]) {
          const th = document.createElement("th");
          th.scope = "col";
          th.textContent = title;
          tr.append(th);
        }
        head.append(tr);
        table.append(head);
        const body = document.createElement("tbody");
        for (const row of chartRows(chart).slice(0, 100)) {
          const tr = document.createElement("tr");
          for (const value of [row.series, row.x, row.y]) {
            const td = document.createElement("td");
            td.textContent =
              typeof value === "number" ? Number(value.toPrecision(6)) : value;
            tr.append(td);
          }
          body.append(tr);
        }
        table.append(body);
        tableWrap.append(table);
      });
    }
    // Descriptive ranges provide a text alternative even when the canvas is not seen.
    const summaries = chart.data.datasets.slice(0, 5).map((ds, i) => {
      const values = chartRows(chart)
        .filter((p) => p.series === (ds.label || "Data"))
        .map((p) => Number(p.y));
      if (!values.length)
        return `${ds.label || "Series " + (i + 1)}: no defined curve.`;
      return `${ds.label}: ${values.length} values, y from ${Number(Math.min(...values).toPrecision(3))} to ${Number(Math.max(...values).toPrecision(3))}.`;
    });
    caption.textContent = summaries.join(" ");
    const details = figure.querySelector(".chart-data");
    if (details?.open) {
      details.open = false;
    }
  },
};
Chart.register(accessibleCharts);
// Canvas text does not automatically repaint when a web font finishes loading.
document.fonts.ready.then(() => {
  for (const chart of Object.values(Chart.instances)) chart.update("none");
});
document.addEventListener("DOMContentLoaded", () =>
  document.querySelectorAll("canvas").forEach((canvas) => {
    canvas.setAttribute("role", "img");
    if (!canvas.getAttribute("aria-label"))
      canvas.setAttribute(
        "aria-label",
        canvas.closest("figure")?.querySelector("h2")?.textContent ||
          "Statistical chart",
      );
  }),
);

/* Exact-value partners are views of canonical sliders, not additional URL parameters. */
window.syncRangeNumbers = function() {
  for (const number of document.querySelectorAll("[data-range]")) {
    const slider = document.getElementById(number.dataset.range);
    number.min = slider.min; number.max = slider.max; number.step = slider.step;
    number.disabled = slider.disabled;
    if (document.activeElement !== number) number.value = slider.value;
  }
};
document.addEventListener("DOMContentLoaded", () => {
  for (const number of document.querySelectorAll("[data-range]")) {
    const slider = document.getElementById(number.dataset.range);
    number.addEventListener("input", (event) => {
      event.stopImmediatePropagation();
      if (!number.checkValidity() || number.value === "") return;
      slider.value = number.value;
      slider.dispatchEvent(new Event("input", { bubbles:true }));
    });
    number.addEventListener("change", (event) => {
      event.stopImmediatePropagation();
      if (number.value !== "" && Number.isFinite(Number(number.value))) {
        const lo = Number(slider.min), hi = Number(slider.max), step = Number(slider.step);
        slider.value = Math.max(lo, Math.min(hi, lo + Math.round((Number(number.value)-lo)/step)*step));
        slider.dispatchEvent(new Event("input", {bubbles:true}));
      }
      number.value = slider.value;
    });
    slider.addEventListener("input", () => { number.value = slider.value; });
  }
  window.syncRangeNumbers();
});
document.addEventListener("applet:state", window.syncRangeNumbers);
