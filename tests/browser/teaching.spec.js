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
  test(`${item.id}: presets, reset and student URL settings round-trip`, async ({
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
    const configured = await state(page),
      data = await chartData(page),
      link = page.url();
    await page.goto(link);
    expect(await state(page)).toEqual(configured);
    expect(await chartData(page)).toEqual(data);
    await expect(page.locator("#lecturer, #lecturer-panel")).toHaveCount(0);
    await expect(page.locator(".page-header math")).toBeVisible();
    await page.locator("#reset").click();
    expect(await state(page)).toEqual(initial);
    await expect(page.locator("#input-warning")).toBeHidden();
  });
  test(`${item.id}: automated WCAG accessibility checks and chart data alternatives`, async ({
    page,
  }) => {
    await page.goto("/html/" + item.id + ".html");
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
  await page.locator(".input-details summary").click();
  await page.locator("#dataMode").selectOption("manual");
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
  await expect(page.locator("#lecturer, #lecturer-panel, img")).toHaveCount(0);
  expect(new URL(page.url()).searchParams.has("_lecture")).toBe(false);
  expect(new URL(page.url()).searchParams.has("_title")).toBe(false);
  await expect(page.locator("#t-value")).toHaveText("0.0000");
});

test("correlation starts with one scatterplot and offers optional calculation steps", async ({
  page,
}) => {
  await page.goto("/html/correlation.html");
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator("#data-pearson-value")).toHaveText("0.6000");
  await expect(page.locator("#correlation-working")).not.toHaveAttribute(
    "open",
    "",
  );
  await page.locator("#correlation-working > summary").click();
  await expect(
    page.locator("#correlation-final-formula math mfrac"),
  ).toHaveCount(1);
  await expect(page.locator("#correlation-rows tr")).toHaveCount(12);
  await expect(page.locator("#correlation-sums")).toContainText("r = 0.6000");
});
test("mean-test estimate bars represent the sample estimate and one SE in original units", async ({
  page,
}) => {
  for (const id of [
    "one-sample-z-test",
    "one-sample-t-test",
    "independent-samples-t-test",
  ]) {
    await page.goto(
      `/html/${id}.html?mu=2&mu0=1&mu1=2&mu2=1&sigma=2&N=25&N1=25&N2=25`,
    );
    await expect(page.locator("canvas")).toHaveCount(2);
    const independent = id.startsWith("independent");
    const estimate = independent ? 1 : 2,
      se = independent ? 2 * Math.sqrt(2 / 25) : 0.4;
    const data = await page.evaluate(() =>
      Chart.getChart("meanEstimateChart").data.datasets.map((ds) => ds.data),
    );
    const ticks = await page.evaluate(() =>
      Chart.getChart("meanEstimateChart").scales.y.ticks.map((t) => t.label),
    );
    expect(ticks).toContain("Your sample");
    expect(ticks).toContain("Null claim");
    expect(data[0]).toEqual([{ x: estimate, y: 1 }]);
    expect(data[1]).toEqual([{ x: independent ? 0 : 1, y: 0 }]);
    expect(data[2][0].x).toBeCloseTo(estimate - se, 12);
    expect(data[2][1].x).toBeCloseTo(estimate + se, 12);
    await expect(page.locator(".chart-explanation").first()).toContainText(
      "one standard error",
    );
    // Browser layout must stack a fraction, rather than printing slash notation.
    const fraction = page.locator(".page-header math > mrow > mfrac");
    const geometry = await fraction.evaluate((el) => {
      const [a, b] = [...el.children].map((c) => c.getBoundingClientRect());
      return { numerator: a.y + a.height / 2, denominator: b.y + b.height / 2 };
    });
    expect(geometry.denominator - geometry.numerator).toBeGreaterThan(8);
  }
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
  expect(download.suggestedFilename()).toBe("meanEstimateChart.csv");
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const csv = Buffer.concat(chunks).toString();
  expect(csv).toContain("series,x,y");
  expect(csv.split("\n").length).toBeGreaterThan(7);
});

test("legacy paired-data links select manual correlation data", async ({
  page,
}) => {
  await page.goto("/html/correlation.html?pairs=1,1%0A2,3%0A3,2&_lecture=1");
  await expect(page.locator("#dataMode")).toHaveValue("manual");
  await expect(page.locator("#data-pearson-value")).toHaveText("0.5000");
  expect(new URL(page.url()).searchParams.has("_lecture")).toBe(false);
});

test("restored form values cannot redefine the applet defaults", async ({
  page,
}) => {
  // Reproduce browser form restoration before the shell captures its control schema.
  await page.route("**/javascript/shell.js", async (route) => {
    const response = await route.fetch();
    const restored = `
      if (document.getElementById('dataMode')) {
        document.getElementById('dataMode').value = 'manual';
        document.getElementById('pairs').value = '10,30\\n20,10\\n30,20';
        document.getElementById('observations').value = '3';
        document.getElementById('association').value = '-0.8';
      }
      if (document.getElementById('log-axis')) document.getElementById('log-axis').checked = true;
    `;
    await route.fulfill({ response, body: restored + (await response.text()) });
  });
  await page.goto(
    "/html/correlation.html?dataMode=manual&pairs=2,-1%0A4,3%0A6,1",
  );
  await expect(page.locator("#pair-count")).toHaveText("3");
  await page.locator("#reset").click();
  await expect(page.locator("#dataMode")).toHaveValue("generated");
  await expect(page.locator("#observations")).toHaveValue("12");
  await expect(page.locator("#association")).toHaveValue("0.6");
  await expect(page.locator("#pairs")).toHaveValue("1,1\n2,3\n3,2");
  await expect(page.locator("#pair-count")).toHaveText("12");
  await page.goto("/html/f-distribution-explorer.html");
  await expect(page.locator("#log-axis")).not.toBeChecked();
});
