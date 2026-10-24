const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
async function open(page) {
  await page.goto("/html/correlation.html?dataMode=generated");
  await page.locator("#correlation-working > summary").click();
}
async function step(page, index) {
  await page.locator(`[data-correlation-step="${index}"]`).click();
}
async function angle(page) {
  return Number(
    await page.locator("#correlation-angle-diagram").getAttribute("data-angle"),
  );
}
async function arrowCosine(page) {
  return page.evaluate(() => {
    const v = (id) => {
      const l = document.getElementById(id);
      return [
        Number(l.getAttribute("x2")) - 210,
        215 - Number(l.getAttribute("y2")),
      ];
    };
    const a = v("correlation-vector-x"),
      b = v("correlation-vector-y");
    return (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b));
  });
}
test("walkthrough builds the worked example from raw vectors to the 60-degree correlation angle", async ({
  page,
}) => {
  await open(page);
  await page.locator("#correlation-example").click();
  await expect(page.locator("#pair-count")).toHaveText("3");
  await expect(page.locator("#correlation-previous")).toBeDisabled();
  await expect(page.locator("#correlation-raw-values")).toContainText(
    "2.0000, 4.0000, 6.0000",
  );
  expect(await arrowCosine(page)).toBeCloseTo(16 / Math.sqrt(56 * 11), 10);
  await page.locator("#correlation-next").press("Enter");
  await expect(page.locator("#correlation-step-1")).toBeVisible();
  await expect(page.locator("#correlation-centre-values")).toContainText(
    "x̄ = 4.0000, ȳ = 1.0000",
  );
  await expect(page.locator("#correlation-rows tr")).toHaveCount(3);
  expect(await angle(page)).toBeCloseTo(60, 8);
  expect(await arrowCosine(page)).toBeCloseTo(0.5, 10);
  await step(page, 2);
  expect(await angle(page)).toBeCloseTo(60, 8);
  await expect(page.locator("#correlation-unit-values")).toContainText(
    "-0.7071",
  );
  await step(page, 3);
  await expect(page.locator("#correlation-angle-result")).toContainText(
    "r = cos(θ) = 0.5000",
  );
  await expect(page.locator("#correlation-next")).toBeDisabled();
  expect(
    await page
      .locator("#correlation-projection")
      .evaluate(
        (el) =>
          getComputedStyle(el).display !== "none" &&
          Number(el.getAttribute("y2")) > Number(el.getAttribute("y1")),
      ),
  ).toBe(true);
  await page.reload();
  await page.locator("#correlation-working > summary").click();
  await expect(page.locator("#correlation-previous")).toBeDisabled();
  await expect(page.locator("#correlation-next")).toBeEnabled();
  await expect(page.locator("#correlation-step-status")).toHaveText(
    "Step 1 of 4",
  );
});
test("shifting and stretching real observations preserve the centred angle and round-trip in URLs", async ({
  page,
}) => {
  await open(page);
  await page.locator("#correlation-example").click();
  const raw = await angle(page);
  await page.locator("#correlation-shift").click();
  expect(Math.abs((await angle(page)) - raw)).toBeGreaterThan(1);
  await expect(page.locator("#data-pearson-value")).toHaveText("0.5000");
  await step(page, 2);
  const before = await arrowCosine(page);
  await page.locator("#correlation-stretch").click();
  expect(await arrowCosine(page)).toBeCloseTo(before, 10);
  expect(await angle(page)).toBeCloseTo(60, 8);
  const points = await page.evaluate(
    () => Chart.getChart("pairsChart").data.datasets[0].data,
  );
  expect(points).toEqual([
    { x: 2, y: 18 },
    { x: 4, y: 26 },
    { x: 6, y: 22 },
  ]);
  await page.reload();
  await expect(page.locator("#dataMode")).toHaveValue("manual");
  await expect(page.locator("#data-pearson-value")).toHaveText("0.5000");
  expect(
    await page.evaluate(
      () => Chart.getChart("pairsChart").data.datasets[0].data,
    ),
  ).toEqual(points);
  await page.locator("#reset").click();
  await expect(page.locator("#pair-count")).toHaveText("5");
  await expect(page.locator("#correlation-experiment-status")).toContainText(
    "5 current observations",
  );
});
test("angle diagram handles aligned, perpendicular, opposed and undefined vectors faithfully", async ({
  page,
}) => {
  await open(page);
  await step(page, 3);
  for (const [r, degrees] of [
    [1, 0],
    [0.5, 60],
    [0, 90],
    [-0.5, 120],
    [-1, 180],
  ]) {
    await page.locator("#association").evaluate((el, v) => {
      el.value = v;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, r);
    expect(await angle(page)).toBeCloseTo(degrees, 4);
    expect(await arrowCosine(page)).toBeCloseTo(r, 10);
  }
  await page.locator(".input-details > summary").click();
  await page.locator("#dataMode").selectOption("manual");
  await page.locator("#pairs").fill("0.1,2\n0.1,3\n0.1,4");
  await expect(page.locator("#correlation-angle-diagram")).toHaveAttribute(
    "data-angle",
    "undefined",
  );
  await expect(page.locator("#correlation-angle-result")).toContainText(
    "no direction",
  );
  await expect(page.locator("#correlation-no-angle")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/NaN|Infinity/);
  await page.locator("#pairs").fill("2,3\n4,7\n6,5");
  expect(await angle(page)).toBeCloseTo(60, 8);
});
test("every walkthrough step is accessible and fits the viewport, including expanded formulas", async ({
  page,
}) => {
  await open(page);
  for (let i = 0; i < 4; i++) {
    await step(page, i);
    if (i === 3) await page.locator(".formula-details > summary").click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 2,
      ),
    ).toBe(true);
    await expect(
      page.locator(`[data-correlation-step="${i}"]`),
    ).toHaveAttribute("aria-current", "step");
    const box = await page.locator("#correlation-angle-diagram").boundingBox();
    expect(box.width / box.height).toBeCloseTo(300 / 330, 2);
  }
});
