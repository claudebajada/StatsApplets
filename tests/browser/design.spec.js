const { test, expect } = require("@playwright/test");

test("catalogue diagrams load and the three displayed samples have their labelled correlations", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".applet-entry")).toHaveCount(15);
  await expect(page.locator(".applet-entry svg")).toHaveCount(15);
  const correlations = await page.evaluate(() =>
    [...document.querySelectorAll("#demonstration-plots svg")].map((svg) => {
      const dots = [...svg.querySelectorAll("circle")];
      return StatsMath.pearson(
        dots.map((dot) => Number(dot.getAttribute("cx"))),
        dots.map((dot) => -Number(dot.getAttribute("cy"))),
      );
    }),
  );
  [-0.8, 0, 0.8].forEach((r, i) => expect(correlations[i]).toBeCloseTo(r, 9));
  await page.locator("#search").fill("unmatched topic");
  await expect(page.locator(".catalogue-empty")).toContainText(
    "clear the search",
  );
  await page.locator("#search").fill("");
  await expect(page.locator(".applet-entry")).toHaveCount(15);
  expect(errors).toEqual([]);
});

test("the mean-test workspace keeps plots near the controls and aligns its result values", async ({
  page,
  isMobile,
}) => {
  await page.goto("/html/one-sample-t-test.html");
  await page.evaluate(() => document.fonts.ready);
  const layout = await page.evaluate(() => {
    const chart = document.querySelector("canvas").getBoundingClientRect();
    const controls = document
      .getElementById("controls")
      .getBoundingClientRect();
    const values = [
      ...document.querySelectorAll(".result-card .metric strong"),
    ].map((el) => el.getBoundingClientRect().bottom);
    return {
      width: innerWidth,
      chartTop: chart.top,
      chartLeft: chart.left,
      controlsRight: controls.right,
      controlsBottom: controls.bottom,
      values,
    };
  });
  expect(layout.chartTop).toBeLessThan(layout.width >= 1000 ? 700 : 1300);
  if (layout.width >= 1000)
    expect(layout.chartLeft).toBeGreaterThan(layout.controlsRight);
  else expect(layout.chartTop).toBeGreaterThan(layout.controlsBottom);
  expect(Math.max(...layout.values) - Math.min(...layout.values)).toBeLessThan(
    2,
  );
  await page.locator(".symbol-details > summary").click();
  await expect(page.locator(".symbol-key")).toBeVisible();
  await page.locator(".calculation-details > summary").click();
  await expect(page.locator("#calculation")).toBeVisible();
  if (isMobile) {
    const slider = page.locator("#N");
    await slider.scrollIntoViewIfNeeded();
    const box = await slider.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    const before = await slider.inputValue();
    await page.touchscreen.tap(box.x + box.width * 0.8, box.y + box.height / 2);
    expect(await slider.inputValue()).not.toBe(before);
  }
});

test("regression and ANOVA reveal the selected data controls without losing manual observations", async ({
  page,
}) => {
  for (const [id, input, data] of [
    ["regression-explorer", "pairs", "1,2\n2,4\n3,5"],
    ["anova-explorer", "groups", "1,2,3\n3,4,5\n6,7,8"],
  ]) {
    await page.goto(`/html/${id}.html`);
    await expect(page.locator(`#${input}`)).toBeHidden();
    await expect(page.locator("#sampleSize")).toBeVisible();
    await page.locator("#dataMode").selectOption("manual");
    await expect(page.locator(`#${input}`)).toBeVisible();
    await expect(page.locator("#sampleSize")).toBeHidden();
    await expect(page.locator("#resample")).toBeHidden();
    await page.locator(`#${input}`).fill(data);
    await page.locator("#dataMode").selectOption("generated");
    await expect(page.locator(`#${input}`)).toBeHidden();
    await expect(page.locator("#resample")).toBeVisible();
    await page.locator("#dataMode").selectOption("manual");
    await expect(page.locator(`#${input}`)).toHaveValue(data);
    await page.reload();
    await expect(page.locator(`#${input}`)).toBeVisible();
    await expect(page.locator(`#${input}`)).toHaveValue(data);
    await expect(page.locator("#input-warning")).toBeHidden();
  }
});

test("regression renders its fitted line, residual segments and zero reference in both data modes", async ({
  page,
}) => {
  await page.goto("/html/regression-explorer.html");
  for (const mode of ["generated", "manual"]) {
    await page.locator("#dataMode").selectOption(mode);
    const lines = await page.evaluate(() => {
      const fit = Chart.getChart("fitChart"),
        residual = Chart.getChart("residualChart");
      return [
        [fit, 1],
        [fit, 2],
        [residual, 1],
      ].map(([chart, index]) => {
        const line = chart.getDatasetMeta(index).dataset;
        return {
          visible: chart.isDatasetVisible(index),
          segments: line?.segments.length ?? 0,
        };
      });
    });
    expect(lines).toHaveLength(3);
    for (const line of lines) {
      expect(line.visible).toBe(true);
      expect(line.segments).toBeGreaterThan(0);
    }
  }
});
