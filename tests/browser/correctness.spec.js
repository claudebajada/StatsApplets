const { test, expect } = require("@playwright/test");
const catalogue = require("../../javascript/catalogue.js");
const integral = (points) =>
  points
    .slice(1)
    .reduce(
      (s, p, i) => s + ((p.x - points[i].x) * (p.y + points[i].y)) / 2,
      0,
    );
async function move(page, id, value) {
  await page.locator("#" + id).evaluate((el, v) => {
    el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, String(value));
}
for (const id of ["correlation", "regression-explorer", "anova-explorer"]) {
  test(`${id}: every generated example changes the actual data after manual input`, async ({
    page,
  }) => {
    await page.goto(`/html/${id}.html`);
    const item = catalogue.find((c) => c.id === id);
    for (let i = 0; i < 4; i++) {
      await page.locator("#preset").selectOption(String(i));
      await expect(page.locator("#dataMode")).toHaveValue("generated");
      const preset = item.presets[i][1];
      if (id === "correlation")
        expect(
          Number(await page.locator("#data-pearson-value").innerText()),
        ).toBeCloseTo(preset.association, 4);
      else if (id === "regression-explorer") {
        expect(
          await page.evaluate(
            () => Chart.getChart("fitChart").data.datasets[0].data.length,
          ),
        ).toBe(preset.sampleSize);
        if (i === 1)
          expect(
            await page.evaluate(
              () =>
                Chart.getChart("fitChart").data.datasets[1].data[1].y -
                Chart.getChart("fitChart").data.datasets[1].data[0].y,
            ),
          ).toBeGreaterThan(6);
      } else
        expect(
          await page.evaluate(() =>
            Chart.getChart("groupsChart")
              .data.datasets.slice(0, 3)
              .map((d) => d.data.length),
          ),
        ).toEqual([preset.sampleSize, preset.sampleSize, preset.sampleSize]);
      await page.reload();
      await expect(page.locator("#dataMode")).toHaveValue("generated");
      await expect(page.locator("#input-warning")).toBeHidden();
    }
  });
}
test("ANOVA empty comma fields are rejected without changing the last valid result", async ({
  page,
}) => {
  await page.goto(
    "/html/anova-explorer.html?dataMode=manual&groups=" +
      encodeURIComponent("1,2,3\n4,5,6"),
  );
  const before = await page.locator(".result-card").innerText();
  await expect(page.locator(".result-card")).toContainText("13.500");
  for (const text of ["1,2,3,\n4,5,6,", ",1,2,3\n4,5,6", "1, ,3\n4,5,6"]) {
    await page.locator("#groups").fill(text);
    await expect(page.locator("#input-warning")).toBeVisible();
    expect(await page.locator(".result-card").innerText()).toBe(before);
  }
  await page.locator("#groups").fill("1,2,3\n4,5,6");
  await expect(page.locator("#input-warning")).toBeHidden();
});
test("rendered continuous histogram areas equal one at desktop and mobile sizes", async ({
  page,
}) => {
  await page.goto(
    "/html/clt-explorer.html?population=normal&sampleSize=25&traceMode=false",
  );
  await page.evaluate(() => document.fonts.ready);
  const areas = await page.evaluate(() =>
    ["populationChart", "meansChart"].map((id) => {
      const c = Chart.getChart(id),
        meta = c.getDatasetMeta(0),
        x = c.scales.x;
      return c.data.datasets[0].data.reduce(
        (s, p, i) =>
          s +
          p.y *
            (x.getValueForPixel(meta.data[i].x + meta.data[i].width / 2) -
              x.getValueForPixel(meta.data[i].x - meta.data[i].width / 2)),
        0,
      );
    }),
  );
  areas.forEach((area) => expect(area).toBeCloseTo(1, 8));
  await page.setViewportSize({ width: 620, height: 900 });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const c = Chart.getChart("meansChart"),
          m = c.getDatasetMeta(0),
          x = c.scales.x;
        return c.data.datasets[0].data.reduce(
          (s, p, i) =>
            s +
            p.y *
              (x.getValueForPixel(m.data[i].x + m.data[i].width / 2) -
                x.getValueForPixel(m.data[i].x - m.data[i].width / 2)),
          0,
        );
      }),
    )
    .toBeCloseTo(1, 8);
});
test("binary CLT uses probabilities at exact mean values with continuity-corrected comparison", async ({
  page,
}) => {
  await page.goto(
    "/html/clt-explorer.html?population=bernoulli&sampleSize=25&traceMode=false",
  );
  const data = await page.evaluate(() => {
    const c = Chart.getChart("meansChart");
    return {
      title: c.options.scales.y.title.text,
      bars: c.data.datasets[0].data,
      normal: c.data.datasets[1].data,
    };
  });
  expect(data.title).toBe("Probability");
  expect(data.bars).toHaveLength(26);
  expect(data.bars.reduce((s, p) => s + p.y, 0)).toBeCloseTo(1, 10);
  expect(data.bars[3].x).toBeCloseTo((3 / 25 - 0.1) / 0.3, 12);
  expect(data.bars[3].y).toBeCloseTo(0.233, 12);
  expect(data.normal.map((p) => p.x)).toEqual(data.bars.map((p) => p.x));
  await expect(page.locator("#meansChart-explanation")).toContainText(
    "continuity-corrected",
  );
});
test("known-SD widths form one bar and Fit axes includes all displayed t intervals", async ({
  page,
}) => {
  await page.goto("/html/confidence-interval-explorer.html?method=z");
  expect(
    await page.evaluate(
      () => Chart.getChart("widthChart").data.datasets[0].data.length,
    ),
  ).toBe(1);
  expect(
    await page.evaluate(
      () => Chart.getChart("widthChart").data.datasets[0].data[0].y,
    ),
  ).toBe(500);
  await expect(page.locator("#widthChart-explanation")).toContainText(
    "same width",
  );
  await page.goto(
    "/html/confidence-interval-explorer.html?sampleSize=2&level=0.99&method=t",
  );
  await page.locator(".plot-controls > summary").click();
  await page.locator("#fit-axes").click();
  expect(
    await page.evaluate(() => {
      const c = Chart.getChart("intervalChart");
      return c.data.datasets
        .flatMap((d) => d.data)
        .filter((p) => p.y !== null)
        .every((p) => p.x >= c.scales.x.min && p.x <= c.scales.x.max);
    }),
  ).toBe(true);
  await expect(page.locator("#scale-note")).not.toContainText("extend beyond");
});
for (const [id, query, canvas] of [
  [
    "anova-explorer",
    "dataMode=generated&sampleSize=20&separation=1&withinSD=0.1",
    "anovaChart",
  ],
  [
    "chi-squared-explorer",
    "categories=2&total-observations=1000&skew=10",
    "chiSquaredChart",
  ],
])
  test(`${id}: rendered density retains unit area with a distant statistic`, async ({
    page,
  }) => {
    await page.goto(`/html/${id}.html?${query}`);
    const points = await page.evaluate(
      (canvas) => Chart.getChart(canvas).data.datasets[0].data,
      canvas,
    );
    expect(integral(points)).toBeGreaterThan(0.994);
    expect(integral(points)).toBeLessThan(1.001);
  });
test("regression curvature is visible against observed x and candidate residuals agree across plots", async ({
  page,
}) => {
  await page.goto("/html/regression-explorer.html");
  await page.locator("#preset").selectOption("4");
  expect(
    await page.evaluate(
      () => Chart.getChart("residualChart").data.datasets[0].data,
    ),
  ).toEqual([
    { x: -2, y: 2 },
    { x: -1, y: -1 },
    { x: 0, y: -2 },
    { x: 1, y: -1 },
    { x: 2, y: 2 },
  ]);
  await page.locator("#reset").click();
  await page.locator(".candidate-controls > summary").click();
  await page.locator("#candidateSlope-number").fill("1");
  const data = await page.evaluate(() => ({
    segments: Chart.getChart("fitChart").data.datasets[2].data,
    residuals: Chart.getChart("residualChart").data.datasets[0].data,
    shown: Chart.getChart("fitChart").isDatasetVisible(2),
  }));
  expect(data.shown).toBe(true);
  data.residuals.forEach((p, i) => {
    expect(data.segments[3 * i].x).toBe(p.x);
    expect(data.segments[3 * i].y - data.segments[3 * i + 1].y).toBeCloseTo(
      p.y,
      12,
    );
  });
});
test("squared-error areas keep the same scale while changing the candidate line", async ({
  page,
}) => {
  await page.goto("/html/regression-explorer.html");
  const read = () =>
    page.evaluate(() => ({
      area: [...document.querySelectorAll(".squared-errors rect")].reduce(
        (s, r) =>
          s +
          Number(r.getAttribute("width")) * Number(r.getAttribute("height")),
        0,
      ),
      svgWidth: document
        .querySelector(".squared-errors svg")
        .getBoundingClientRect().width,
      viewWidth: document.querySelector(".squared-errors svg").viewBox.baseVal
        .width,
    }));
  const before = await read();
  await move(page, "candidateSlope", 1);
  const after = await read();
  expect(after.area / before.area).toBeCloseTo(49 / 10, 10);
  expect(after.svgWidth).toBeCloseTo(after.viewWidth, 6);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
