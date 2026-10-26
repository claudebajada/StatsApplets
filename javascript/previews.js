// Small diagrams use the same mathematical functions as the applets.
(function (root) {
  const ns = "http://www.w3.org/2000/svg";
  const blue = "#2456a6",
    orange = "#a64922",
    muted = "#8297ae";
  function element(tag, attrs) {
    const el = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs))
      el.setAttribute(key, value);
    return el;
  }
  function plot(id, width = 140, height = 82, association = 0.7) {
    const svg = element("svg", {
      viewBox: `0 0 ${width} ${height}`,
      "aria-hidden": "true",
      focusable: "false",
      class: "applet-preview",
    });
    const left = 9,
      right = width - 5,
      top = 6,
      bottom = height - 10;
    const line = (x1, y1, x2, y2, color = muted, extra = {}) =>
      svg.append(
        element("line", {
          x1,
          y1,
          x2,
          y2,
          stroke: color,
          "stroke-width": 1,
          ...extra,
        }),
      );
    const dot = (x, y, color = blue, radius = 2.5) =>
      svg.append(element("circle", { cx: x, cy: y, r: radius, fill: color }));
    const path = (points, color = blue, extra = {}) =>
      svg.append(
        element("path", {
          d: points
            .map(
              ([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`,
            )
            .join(" "),
          fill: "none",
          stroke: color,
          "stroke-width": 1.8,
          ...extra,
        }),
      );
    const scaleX = (x, min, max) =>
      left + ((x - min) / (max - min)) * (right - left);
    const scaleY = (y, max) => bottom - (y / max) * (bottom - top);
    line(left, bottom, right, bottom, "#cdd7e1");
    if (id === "correlation" || id === "regression-explorer") {
      const pairs =
        id === "correlation"
          ? TeachingMath.correlationSample(14, association, 42)
          : TeachingMath.regressionSample(14, 1, 0.65, 42);
      const xs = pairs.map((p) => p[0]),
        ys = pairs.map((p) => p[1]);
      const xMin = Math.min(...xs) - 0.2,
        xMax = Math.max(...xs) + 0.2,
        yMin = Math.min(...ys) - 0.2,
        yMax = Math.max(...ys) + 0.2;
      const px = (x) => scaleX(x, xMin, xMax),
        py = (y) => bottom - ((y - yMin) / (yMax - yMin)) * (bottom - top);
      line(left, top, left, bottom, "#cdd7e1");
      pairs.forEach(([x, y]) => dot(px(x), py(y)));
      if (id === "regression-explorer") {
        const fit = TeachingMath.regression(pairs);
        line(
          px(xMin),
          py(fit.intercept + fit.slope * xMin),
          px(xMax),
          py(fit.intercept + fit.slope * xMax),
          orange,
          { "stroke-width": 1.8 },
        );
      }
      return svg;
    }
    if (id === "confidence-interval-explorer") {
      const { intervals } = TeachingMath.coverage(0, 1, 12, 10, 0.95, "t", 42);
      const extent =
        Math.max(
          ...intervals.flatMap((i) => [Math.abs(i.low), Math.abs(i.high)]),
        ) * 1.1;
      const px = (x) => scaleX(x, -extent, extent);
      line(px(0), top, px(0), bottom, muted, { "stroke-dasharray": "2 3" });
      intervals.slice(0, 8).forEach((i, n) => {
        const y = top + 4 + (n * (bottom - top - 8)) / 7;
        line(px(i.low), y, px(i.high), y, i.covers ? blue : orange, {
          "stroke-width": 1.8,
        });
        dot(px(i.mean), y, i.covers ? blue : orange, 1.8);
      });
      return svg;
    }
    if (id === "anova-explorer") {
      const groups = TeachingMath.groupSample(6, 0.7, 0.6, 42);
      const max = Math.max(...groups.flat().map(Math.abs)) + 0.3;
      groups.forEach((group, i) => {
        const x = scaleX(i, -0.5, 2.5);
        group.forEach((value, j) =>
          dot(
            x + ((j % 3) - 1) * 3,
            bottom - ((value + max) / (2 * max)) * (bottom - top),
            i === 1 ? orange : blue,
            2,
          ),
        );
        const mean = TeachingMath.mean(group),
          y = bottom - ((mean + max) / (2 * max)) * (bottom - top);
        line(x - 9, y, x + 9, y, "#172e47", { "stroke-width": 2 });
      });
      return svg;
    }
    if (id.startsWith("binomial") || id === "multiple-comparisons-explorer") {
      const values =
        id === "multiple-comparisons-explorer"
          ? Array.from({ length: 10 }, (_, i) => 1 - 0.95 ** (i + 1))
          : Array.from({ length: 13 }, (_, k) =>
              StatsMath.binomialPMF(
                12,
                id.includes("components") ? 0.35 : 0.5,
                k,
              ),
            );
      const max = Math.max(...values) * 1.12,
        step = (right - left) / values.length;
      values.forEach((v, i) =>
        svg.append(
          element("rect", {
            x: left + i * step + 1,
            y: scaleY(v, max),
            width: Math.max(1, step - 2),
            height: bottom - scaleY(v, max),
            fill: blue,
            opacity: 0.8,
          }),
        ),
      );
      return svg;
    }
    const f = id === "f-distribution-explorer",
      chi = id === "chi-squared-explorer",
      power = id === "power-explorer",
      clt = id === "clt-explorer";
    const min = f || chi ? 0.001 : -4,
      max = f ? 4 : chi ? 14 : power ? 6 : 4;
    const normal = (x) => StatsMath.normalDensity(x, 0, 1);
    const density = f
      ? (x) => jStat.centralF.pdf(x, 5, 14)
      : chi
        ? (x) => jStat.chisquare.pdf(x, 4)
        : id.includes("t-test") || id === "t-distribution-explorer"
          ? (x) => jStat.studentt.pdf(x, 4)
          : normal;
    const xs = Array.from(
      { length: 101 },
      (_, i) => min + (i * (max - min)) / 100,
    );
    const second = power
      ? (x) => StatsMath.normalDensity(x, 1.7, 1)
      : clt
        ? (x) => StatsMath.normalDensity(x, 0, 1 / Math.sqrt(8))
        : id === "t-distribution-explorer"
          ? normal
          : null;
    const peak =
      Math.max(...xs.map(density), ...(second ? xs.map(second) : [])) * 1.1;
    const points = (fn) =>
      xs.map((x) => [scaleX(x, min, max), scaleY(fn(x), peak)]);
    path(points(density));
    if (second) path(points(second), orange, { "stroke-dasharray": "4 3" });
    if (id.includes("test")) {
      const x = scaleX(1.6, min, max);
      line(x, bottom, x, scaleY(density(1.6), peak), orange, {
        "stroke-width": 1.5,
      });
    }
    return svg;
  }
  root.AppletPreviews = { plot };
})(globalThis);
