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
const expectedRelationshipEquations = {
  squares: [
    "Independent Zi follow N(0,1)",
    "Z squared follows chi squared with 1 degree of freedom",
    "U equals the sum of k independent squared standard normals",
    "U follows chi squared with k degrees of freedom",
  ],
  t: [
    "Z follows N(0,1), U follows chi squared nu, independently",
    "Expected U over nu equals 1",
    "T equals Z divided by square root of U over nu",
    "T follows t with nu degrees of freedom",
  ],
  f: [
    "U follows chi squared d1 and V follows chi squared d2 independently",
    "Expected U over d1 and V over d2 both equal 1",
    "F equals U over d1 divided by V over d2",
    "F follows F with d1 and d2 degrees of freedom",
  ],
  tSquared: [
    "T equals Z divided by square root of U over nu",
    "T squared equals Z squared divided by U over nu",
    "T squared equals Z squared over 1 divided by U over nu",
    "T nu squared follows F 1 nu",
  ],
  normalLimit: [
    "T nu equals Z divided by square root of U over nu",
    "Variance of U over nu equals 2 over nu",
    "U over nu converges in probability to 1",
    "T nu converges in distribution to N 0 1",
  ],
  sampleVariance: [
    "Sum of Xi minus sample mean equals 0",
    "Sum of squared standardised centred residuals equals sum of n minus 1 squared independent A coordinates",
    "U equals n minus 1 times S squared over sigma squared",
    "U follows chi squared n minus 1",
  ],
  oneSampleT: [
    "Z equals sample mean minus null mean over sigma divided by square root n",
    "U equals n minus 1 times S squared over sigma squared and follows chi squared n minus 1",
    "T equals Z over square root U over n minus 1 equals sample mean minus null mean over S divided by square root n",
    "T follows t with n minus 1 degrees of freedom under H0",
  ],
  pooledT: [
    "Z equals difference of sample means over sigma times square root 1 over n1 plus 1 over n2",
    "U equals sum of within group squares over sigma squared and follows chi squared nu",
    "Pooled t equals difference of sample means over pooled SD times square root 1 over n1 plus 1 over n2",
    "T follows t nu and T squared equals the two group ANOVA F",
  ],
  anova: [
    "Total sum of squares equals between plus within sum of squares",
    "Between over sigma squared follows chi squared g minus 1, within over sigma squared follows chi squared N minus g independently",
    "Between sum is sum nj times squared group mean minus grand mean, F is ratio of mean squares",
    "F follows F g minus 1 N minus g under H0",
  ],
  gof: [
    "Expected count Ei equals N over c",
    "Ri equals Oi minus Ei over square root Ei, sum Ri equals zero",
    "Q equals sum of Ri squared equals sum of c minus 1 contrast coordinates squared",
    "Q equals sum squared observed minus expected over expected, approximately chi squared c minus 1",
  ],
};

for (const item of catalogue) {
  test(`${item.id}: presets, reset and student URL settings round-trip`, async ({
    page,
  }) => {
    await page.goto("/html/" + item.id + ".html");
    const initial = await state(page);
    for (let i = 0; i < item.presets.length; i++) {
      await page.locator("#preset").selectOption(String(i));
      const sparseGOF =
        item.id === "distribution-relationships" &&
        item.presets[i][1].relationship === "gof" &&
        item.presets[i][1].observations / item.presets[i][1].categories < 5;
      if (sparseGOF)
        await expect(page.locator("#input-warning")).toContainText("below 5");
      else await expect(page.locator("#input-warning")).toBeHidden();
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
    const equations = page.locator(".guided-lab math");
    expect(await equations.count()).toBeGreaterThan(0);
    for (const equation of await equations.all())
      await expect(equation).toBeVisible();
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
test("all ten distribution relationships retain their full MathML derivations", async ({
  page,
}) => {
  await page.goto("/html/distribution-relationships.html");
  for (const [relationship, stepLabels] of Object.entries(
    expectedRelationshipEquations,
  )) {
    await page.locator("#relationship").selectOption(relationship);
    await expect(page.locator("#relationship")).toHaveValue(relationship);
    const equations = page.locator(".guided-lab math");
    const expectedLabels = [stepLabels[stepLabels.length - 1], ...stepLabels];
    await expect(equations).toHaveCount(expectedLabels.length);
    await expect(
      page.locator("#guided-content .relationship-derivation .equation math"),
    ).toHaveCount(stepLabels.length);
    await expect(equations.first()).toHaveAttribute(
      "aria-label",
      expectedLabels[0],
    );
    const contents = await equations.evaluateAll((elements) =>
      elements.map((element) => ({
        label: element.getAttribute("aria-label"),
        namespace: element.namespaceURI,
        text: element.textContent.trim(),
        children: element.children.length,
      })),
    );
    expect(contents.map((equation) => equation.label)).toEqual(expectedLabels);
    for (const content of contents) {
      expect(content.namespace).toBe("http://www.w3.org/1998/Math/MathML");
      expect(content.text).not.toBe("");
      expect(content.children).toBeGreaterThan(0);
    }
    for (const equation of await equations.all())
      await expect(equation).toBeVisible();
  }
});

test("catalogue accessibility and search are usable", async ({ page }) => {
  await page.goto("/");
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations.map((v) => v.id)).toEqual([]);
  await page.locator("#search").fill("not-a-statistical-topic");
  await expect(page.locator(".applet-entry")).toHaveCount(0);
  await expect(page.locator("#catalogue-count")).toContainText("0 of 16");
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
  await page.locator(".input-details > summary").click();
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
  await page.goto(
    "/html/regression-explorer.html?tryLine=false&revealFit=true",
  );
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
  await expect(page.locator("#mu")).toHaveValue("3");
  await expect(page.locator("#sigma")).toHaveValue("6");
  await expect(page.locator("#N")).toHaveValue("25");
  await expect(page.locator("#lecturer, #lecturer-panel, img")).toHaveCount(0);
  expect(new URL(page.url()).searchParams.has("_lecture")).toBe(false);
  expect(new URL(page.url()).searchParams.has("_title")).toBe(false);
  await expect(page.locator("#t-value")).toHaveText("2.5000");
});

test("correlation starts with one scatterplot and offers optional calculation steps", async ({
  page,
}) => {
  await page.goto("/html/correlation.html?dataMode=generated");
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
    const fraction = page.locator(".guided-lab math > mrow > mfrac");
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
  await expect(page.locator("#dataMode")).toHaveValue("manual");
  await expect(page.locator("#observations")).toHaveValue("12");
  await expect(page.locator("#association")).toHaveValue("0.6");
  await expect(page.locator("#pairs")).toHaveValue(
    "-2,-2\n-1,-1\n0,0\n1,1\n2,2",
  );
  await expect(page.locator("#pair-count")).toHaveText("5");
  await page.goto("/html/f-distribution-explorer.html");
  await expect(page.locator("#log-axis")).not.toBeChecked();
});
