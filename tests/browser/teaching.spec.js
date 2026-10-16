const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const catalogue = require("../../javascript/catalogue.js");
const fixture = require("../references/teaching-scipy.json");
async function state(page) {
  return page
    .locator("#controls input,#controls select,#controls textarea")
    .evaluateAll((els) =>
      Object.fromEntries(
        els.map((el) => [
          el.id,
          el.type === "checkbox" ? el.checked : el.value,
        ]),
      ),
    );
}
async function chartData(page) {
  return page.evaluate(() =>
    Object.values(Chart.instances).map((c) =>
      c.data.datasets.map((ds) => ds.data),
    ),
  );
}
for (const item of catalogue) {
  test(`${item.id}: presets, reset, URL settings and guided scenario round-trip`, async ({
    page,
  }) => {
    await page.goto("/html/" + item.id + ".html");
    const initial = await state(page);
    for (let i = 0; i < item.presets.length; i++) {
      await page.locator("#preset").selectOption(String(i));
      await expect(page.locator("#input-warning")).toBeHidden();
      const current = await state(page);
      for (const [key, v] of Object.entries(item.presets[i][1]))
        expect(String(current[key])).toBe(String(v));
    }
    await page.locator("#lecturer").check();
    await page.locator("#lesson-title").fill("Lecture example: <text>");
    await page
      .locator("#lesson-prompt")
      .fill("Predict what happens before moving a slider.");
    await page
      .locator("#lesson-answer")
      .fill("Discuss the mechanism and assumptions.");
    await page.locator("#student-view").check();
    const configured = await state(page),
      data = await chartData(page),
      link = page.url();
    await page.goto(link);
    expect(await state(page)).toEqual(configured);
    expect(await chartData(page)).toEqual(data);
    await expect(page.locator("#lecturer-panel")).toBeVisible();
    await expect(page.locator(".lesson-fields")).toBeHidden();
    await expect(page.locator("#exercise-title")).toHaveText(
      "Lecture example: <text>",
    );
    await expect(page.locator("#exercise-answer")).toBeHidden();
    await page.locator("#reveal-answer").click();
    await expect(page.locator("#exercise-answer")).toHaveText(
      "Discuss the mechanism and assumptions.",
    );
    await page.locator("#reset").click();
    expect(await state(page)).toEqual(initial);
    await expect(page.locator("#input-warning")).toBeHidden();
  });
  test(`${item.id}: automated WCAG accessibility checks and chart data alternatives`, async ({
    page,
  }) => {
    await page.goto("/html/" + item.id + ".html");
    await page.locator("#lecturer").check();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    const first = page.locator(".chart-data").first();
    await first.locator("summary").click();
    await expect(first.locator("table")).toBeVisible();
    await expect(first.locator("table caption")).toContainText(
      "plotted values",
    );
    await expect(page.locator("canvas").first()).toHaveAttribute(
      "aria-describedby",
      /.+-summary/,
    );
  });
}
test("catalogue accessibility and search are usable", async ({ page }) => {
  await page.goto("/");
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations.map((v) => v.id)).toEqual([]);
  await page.locator("#search").fill("not-a-statistical-topic");
  await expect(page.locator(".applet-card")).toHaveCount(0);
  await expect(page.locator("#catalogue-count")).toContainText("0 of 15");
});
test("seeded new samples change the experiment, reset restores it", async ({
  page,
}) => {
  await page.goto("/html/clt-explorer.html");
  const data = await chartData(page);
  await page.locator("#resample").click();
  expect(await chartData(page)).not.toEqual(data);
  await expect(page.locator("#seed")).toHaveValue("43");
  await page.locator("#reset").click();
  expect(await chartData(page)).toEqual(data);
});
test("correlation handles more than two observations and malformed pairs", async ({
  page,
}) => {
  await page.goto("/html/correlation.html");
  await page.locator("#pairs").fill("1,1\n2,3\n3,2");
  await expect(page.locator("#data-pearson-value")).toHaveText("0.5000");
  const data = await chartData(page);
  await page.locator("#pairs").fill("1,a\n2,3");
  await expect(page.locator("#input-warning")).toBeVisible();
  expect(await chartData(page)).toEqual(data);
  await page.locator("#pairs").fill("1,2\n1,3\n1,4");
  await expect(page.locator("#data-pearson-value")).toContainText("Undefined");
});
test("manual regression matches independent reference and detects zero x variance", async ({
  page,
}) => {
  const r = fixture.regression[0];
  await page.goto("/html/regression-explorer.html");
  await page.locator("#dataMode").selectOption("manual");
  await page.locator("#pairs").fill(r.pairs.map((p) => p.join(",")).join("\n"));
  await expect(page.locator("#calculation")).toContainText(
    "R² = 1 − SSE/SST = " + r.rSquared.toFixed(4),
  );
  await page.locator("#pairs").fill("1,1\n1,2\n1,3");
  await expect(page.locator("#calculation")).toContainText("undefined");
  await expect(page.locator("#input-warning")).toBeHidden();
});
test("manual ANOVA matches the independent F and p references", async ({
  page,
}) => {
  const r = fixture.anova[0];
  await page.goto("/html/anova-explorer.html");
  await page.locator("#dataMode").selectOption("manual");
  await page
    .locator("#groups")
    .fill(r.groups.map((g) => g.join(",")).join("\n"));
  await expect(page.locator("#calculation")).toContainText(
    "F = " + r.f.toFixed(3),
  );
  await expect(page.locator("#anova-table")).toContainText("Within groups");
  await expect(page.locator("#input-warning")).toBeHidden();
});
test("invalid URL numbers cannot create non-finite results or inject markup", async ({
  page,
}) => {
  await page.goto(
    "/html/one-sample-t-test.html?mu=Infinity&sigma=0&N=-10&_lecture=1&_title=%3Cimg%20src=x%20onerror=alert(1)%3E",
  );
  await expect(page.locator("#mu")).toHaveValue("0");
  await expect(page.locator("#sigma")).toHaveValue("1");
  await expect(page.locator("#N")).toHaveValue("30");
  await expect(page.locator("#exercise-title img")).toHaveCount(0);
  await expect(page.locator("#t-value")).toHaveText("0.0000");
});

test("geometric coordinate axes use equal pixel lengths per unit", async ({
  page,
}) => {
  await page.goto("/html/correlation.html");
  const ratios = await page.evaluate(() =>
    ["dotProductChart", "cosineChart", "pearsonNormChart"].map((id) => {
      const c = Chart.getChart(id),
        x = c.scales.x,
        y = c.scales.y;
      return Math.abs(
        (x.getPixelForValue(1) - x.getPixelForValue(0)) /
          (y.getPixelForValue(1) - y.getPixelForValue(0)),
      );
    }),
  );
  ratios.forEach((r) => expect(r).toBeCloseTo(1, 5));
});
test("plotted-value CSV download contains numerical chart data", async ({
  page,
}) => {
  await page.goto("/html/one-sample-t-test.html");
  const panel = page.locator(".chart-data").first();
  await panel.locator("summary").click();
  const downloadPromise = page.waitForEvent("download");
  await panel
    .getByRole("button", { name: "Download all plotted values" })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("populationChart.csv");
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const csv = Buffer.concat(chunks).toString();
  expect(csv).toContain("series,x,y");
  expect(csv.split("\n").length).toBeGreaterThan(400);
});
