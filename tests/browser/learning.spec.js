const { test, expect } = require("@playwright/test");
const C = require("../../javascript/learning-content.js");
async function move(page, id, value) {
  await page.locator("#" + id).evaluate((el, v) => {
    el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, String(value));
}
test("fixed mean-test axes reveal the expected halving of standard-error width", async ({
  page,
}) => {
  await page.goto("/html/one-sample-t-test.html?N=25");
  await expect(page.locator("#alternative")).toHaveValue("twoSided");
  const width = () =>
    page.evaluate(() => {
      const c = Chart.getChart("meanEstimateChart"),
        d = c.data.datasets[2].data;
      return {
        min: c.scales.x.min,
        max: c.scales.x.max,
        width:
          c.scales.x.getPixelForValue(d[1].x) -
          c.scales.x.getPixelForValue(d[0].x),
      };
    });
  const before = await width();
  await move(page, "N", 100);
  const after = await width();
  expect(after.min).toBe(before.min);
  expect(after.max).toBe(before.max);
  expect(after.width / before.width).toBeCloseTo(0.5, 8);
  await page.locator("#N-number").fill("25");
  await expect(page.locator("#N")).toHaveValue("25");
  await expect(page.locator("#N-value")).toHaveText("25");
  await expect(page.locator("#ci-value")).toContainText("[");
});
test("chi-squared proportional departure stays fixed across sample sizes", async ({
  page,
}) => {
  await page.goto("/html/chi-squared-explorer.html?skew=10");
  const before = Number(await page.locator("#effect-size-value").innerText());
  await move(page, "total-observations", 1000);
  expect(Number(await page.locator("#effect-size-value").innerText())).toBe(
    before,
  );
  await expect(page.locator("#chi-squared-value")).toHaveText("500.0000");
});
test("F log view removes area fill without changing its critical value", async ({
  page,
}) => {
  await page.goto("/html/f-distribution-explorer.html");
  const before = await page.locator("#critical-value").innerText();
  await page.locator("#log-axis").check();
  expect(await page.locator("#critical-value").innerText()).toBe(before);
  expect(
    await page.evaluate(
      () => Chart.getChart("distributionChart").data.datasets[1].fill,
    ),
  ).toBe(false);
  await expect(page.locator("#plot-note")).toContainText("not a probability");
});
test("power at the true null labels the correct decision rate", async ({
  page,
}) => {
  await page.goto("/html/power-explorer.html?effect=0");
  await expect(page.locator(".result-card")).toContainText("Not applicable");
  await expect(page.locator(".result-card")).toContainText("95.0%");
});
test("CLT traces actual studies into its displayed sampling distribution", async ({
  page,
}) => {
  await page.goto(
    "/html/clt-explorer.html?traceMode=true&traceCount=1&sampleSize=10",
  );
  await expect(page.locator("#trace-status")).toContainText("Study 1:");
  await expect(page.locator("#meansChart-explanation")).toContainText(
    "Showing 1 of 1000",
  );
  await page.locator("#trace-one").click();
  await expect(page.locator("#trace-status")).toContainText("Study 2:");
  await page.locator("#trace-ten").click();
  await expect(page.locator("#trace-status")).toContainText("Study 12:");
  await page.locator("#trace-all").click();
  await expect(page.locator("#meansChart-explanation")).toContainText(
    "Showing 1000 of 1000",
  );
  await page.reload();
  await expect(page.locator("#meansChart-explanation")).toContainText(
    "Showing 1000 of 1000",
  );
});
test("candidate regression line reaches a known least-squares solution", async ({
  page,
}) => {
  await page.goto("/html/regression-explorer.html?dataMode=manual");
  await page.getByRole("link", { name: "Follow the maths" }).click();
  await page.locator("#start-line-challenge").click();
  await page.locator("#candidateSlope-number").fill("0.8");
  await page.locator("#candidateIntercept-number").fill("0.6");
  await expect(page.locator("#candidate-working")).toContainText(
    "Your line SSE = 3.600",
  );
  expect(
    await page.evaluate(() => Chart.getChart("fitChart").isDatasetVisible(1)),
  ).toBe(false);
  await expect(page.locator("#calculation")).toContainText(
    "Try a line before revealing",
  );
  await page.locator("#reveal-line-solution").click();
  expect(
    await page.evaluate(() => Chart.getChart("fitChart").isDatasetVisible(1)),
  ).toBe(true);
  await expect(page.locator("#input-warning")).toBeHidden();
});
test("loading a confidence-interval comparison fits the locked axis", async ({
  page,
}) => {
  await page.goto(
    "/html/confidence-interval-explorer.html?populationMean=5&populationSD=2",
  );
  await page.locator("#experiment-action").click();
  const bounds = await page.evaluate(() => {
    const x = Chart.getChart("intervalChart").scales.x;
    return [x.min, x.max];
  });
  expect(bounds[0]).toBeLessThan(0);
  expect(bounds[1]).toBeGreaterThan(0);
  await page.locator(".plot-controls > summary").click();
  await page.locator("#lockScale").uncheck();
  await expect(page.locator("#scale-note")).toContainText("resizes");
});
test("ANOVA inspector connects observations, group means and weighted between SS", async ({
  page,
}) => {
  await page.goto("/html/anova-explorer.html?dataMode=manual");
  await page.getByRole("link", { name: "Follow the maths" }).click();
  await expect(page.locator("#anova-working")).toContainText(
    "Observation 1.000",
  );
  await page.locator("#inspect-group").selectOption("2");
  await page.locator("#inspect-observation").selectOption("2");
  await expect(page.locator("#anova-working")).toContainText(
    "Observation 6.000",
  );
  await expect(page.locator("#guided-content table")).toContainText("n ×");
});
test("correlation exposes a curved zero-r relationship and reversible influential point", async ({
  page,
}) => {
  await page.goto(
    "/html/correlation.html?dataMode=manual&pairs=-2,4%0A-1,1%0A0,0%0A1,1%0A2,4",
  );
  await page.getByRole("link", { name: "Follow the maths" }).click();
  await expect(page.locator("#data-pearson-value")).toHaveText("0.0000");
  await page.locator("#toggle-outlier").click();
  expect(
    Number(await page.locator("#data-pearson-value").innerText()),
  ).toBeLessThan(-0.5);
  await page.locator("#toggle-outlier").click();
  await expect(page.locator("#data-pearson-value")).toHaveText("0.0000");
});
test("selected binomial count links arrangements and a continuity-corrected area", async ({
  page,
}) => {
  await page.goto("/html/binomial-components-explorer.html?k=2");
  await page.getByRole("link", { name: "Follow the maths" }).click();
  await expect(page.locator(".arrangement-list code")).toHaveCount(3);
  await expect(page.locator("#binomial-working")).toContainText("0.3750");
  await page.goto("/html/binomial-normal-explorer.html?N=500&theta=0.05&k=25");
  await page.getByRole("link", { name: "Follow the maths" }).click();
  await expect(page.locator("#binomial-working")).toContainText("24.5 to 25.5");
  expect(
    await page.evaluate(
      () =>
        Chart.getChart("normalChart").data.datasets[1].data.filter(
          (p) => p.y !== null,
        ).length,
    ),
  ).toBeGreaterThan(1);
});
test("mixed truth exposes both correct discoveries and different error rates", async ({
  page,
}) => {
  await page.goto(
    "/html/multiple-comparisons-explorer.html?signalFraction=0.3&correction=bh",
  );
  await page.getByRole("link", { name: "Follow the maths" }).click();
  await expect(page.locator("#multiplicity-working")).toContainText(
    "6 real effects and 14 true nulls",
  );
  await expect(page.locator("#guided-content table")).toContainText(
    "Real effect",
  );
  await expect(page.locator("#calculation")).toContainText(
    "FDR and FWER can differ",
  );
});
for (const [id, lesson] of Object.entries(C)) {
  test(`${id}: one comparison connects question, controls, interpretation and maths`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/html/${id}.html`);
    const matches = (state) =>
      page.evaluate(
        (state) =>
          Object.entries(state).every(
            ([key, value]) => String(AppletPage.read()[key]) === String(value),
          ),
        state,
      );
    if (!(await matches(lesson.experiment.baseline)))
      await page.locator("#experiment-action").click();
    expect(await matches(lesson.experiment.baseline)).toBe(true);
    await expect(page.locator("#experiment-position")).toHaveText(
      "Starting example",
    );
    await expect(page.locator("#experiment-action")).toHaveText(
      lesson.experiment.action,
    );
    await page.locator("#experiment-action").click();
    expect(
      await matches({
        ...lesson.experiment.baseline,
        ...lesson.experiment.change,
      }),
    ).toBe(true);
    await expect(page.locator("#experiment-position")).toHaveText(
      "After the change",
    );
    await expect(page.locator("#experiment-reading")).not.toBeEmpty();
    await expect(page.locator("#experiment-reading")).not.toContainText(
      /undefined|NaN/,
    );
    await expect(page.locator("#input-warning")).toBeHidden();
    await page.reload();
    await expect(page.locator("#experiment-position")).toHaveText(
      "After the change",
    );
    await page.getByRole("link", { name: "Follow the maths" }).click();
    await expect(page.locator("#guided-content")).toBeVisible();
    await expect(page.locator("#context")).toHaveCount(0);
    expect(new URL(page.url()).searchParams.has("context")).toBe(false);
    await page.locator("#experiment-action").click();
    expect(await matches(lesson.experiment.baseline)).toBe(true);
    expect(errors).toEqual([]);
  });
}
test("plain-language search reaches group comparison applets", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#search").fill("compare two groups");
  await expect(
    page.locator('.applet-entry[href="html/independent-samples-t-test.html"]'),
  ).toBeVisible();
});
test("capture representative teaching views and check narrow layouts", async ({
  page,
}, testInfo) => {
  const views = [
    ["one-sample-t-test.html", ""],
    ["clt-explorer.html", ""],
    [
      "correlation.html?dataMode=manual&pairs=-2,4%0A-1,1%0A0,0%0A1,1%0A2,4",
      "#guided-lab",
    ],
    ["regression-explorer.html", "#guided-lab"],
    [
      "multiple-comparisons-explorer.html?signalFraction=0.3&correction=bh",
      "#guided-lab",
    ],
  ];
  for (const [path, open] of views) {
    await page.goto("/html/" + path);
    if (open) await page.locator(open).scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 2,
      ),
    ).toBe(true);
    const name = path.split(/[.?]/)[0] + ".png";
    await page.screenshot({ path: testInfo.outputPath(name), fullPage: true });
  }
});
