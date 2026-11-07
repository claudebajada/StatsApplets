const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { modes } = require("../../javascript/relationship-content.js");
const M = require("../../javascript/relationship-math.js");
const route = "/html/distribution-relationships.html";
const state = (page) => page.evaluate(() => AppletPage.read());
const plotted = (page) =>
  page.evaluate(() =>
    Chart.getChart("relationshipChart").data.datasets.map((d) => ({
      label: d.label,
      data: d.data,
    })),
  );
for (const [kind, mode] of Object.entries(modes)) {
  test(`${kind}: map, arithmetic, sampling, MathML, accessibility and shared state`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(route);
    await page.locator(`[data-relationship="${kind}"]`).click();
    await expect(page.locator("#relationship")).toHaveValue(kind);
    await expect(page.locator("#relationship-classification")).toHaveText(
      mode.type,
    );
    await expect(page.locator(`[data-relationship="${kind}"]`)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("#trace-position")).toContainText("Step 1 of 4");
    for (let i = 2; i <= 4; i++) {
      await page.locator("#next-step").click();
      await expect(page.locator("#trace-position")).toContainText(
        `Step ${i} of 4`,
      );
      await expect(page.locator("#trace-calculation table")).toBeVisible();
    }
    await expect(page.locator("#next-step")).toBeDisabled();
    await expect(page.locator("#guided-content math")).toHaveCount(4);
    if (kind === "pooledT" || kind === "anova") {
      await page.locator("#trace-input-details > summary").click();
      await expect(page.locator("#trace-inputs table")).toContainText(
        "Input value",
      );
    }
    await page.locator("#all-repetitions").click();
    await expect(page.locator("#shown")).toHaveValue("1000");
    await expect(page.locator("#scale-note")).toContainText(
      "without renormalising",
    );
    const result = await plotted(page),
      settings = await state(page);
    expect(result[0].data.length).toBe(40);
    expect(
      result
        .flatMap((d) => d.data)
        .every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    ).toBe(true);
    const violations = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      violations.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    const link = page.url();
    await page.goto(link);
    expect(await state(page)).toEqual(settings);
    expect(await plotted(page)).toEqual(result);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 2,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}
test("steps and displayed repetitions grow without changing earlier draws; parameters restart the trace", async ({
  page,
}) => {
  await page.goto(route);
  const first = await page.locator("#trace-calculation").innerText();
  await page.locator("#next-step").click();
  await page.locator("#next-draw").click();
  await expect(page.locator("#shown")).toHaveValue("2");
  await expect(page.locator("#traceStep")).toHaveValue("1");
  await page.locator("#add-repetitions").click();
  await expect(page.locator("#shown")).toHaveValue("102");
  await page.locator("#inspect-repetition").fill("1");
  await page.locator("#inspect-repetition").press("Tab");
  await expect(page.locator("#trace-calculation")).toHaveText(first, {
    useInnerText: true,
  });
  await page.locator("#df1-number").fill("4");
  await expect(page.locator("#shown")).toHaveValue("1");
  await expect(page.locator("#inspected")).toHaveValue("1");
  await expect(page.locator("#trace-calculation tbody tr")).toHaveCount(4);
  await page.locator("#all-repetitions").click();
  await page.locator("#resample").click();
  await expect(page.locator("#seed")).toHaveValue("43");
  await expect(page.locator("#shown")).toHaveValue("1");
  await page.locator("#reset").click();
  await expect(page.locator("#trace-calculation")).toHaveText(first, {
    useInnerText: true,
  });
});
test("sparse GOF is explicitly approximate and finite-df t is distinguished from its normal limit", async ({
  page,
}) => {
  await page.goto(route + "?relationship=gof&observations=10&categories=10");
  await expect(page.locator("#input-warning")).toContainText(
    "Increasing repetitions does not fix",
  );
  await expect(page.locator("#guided-content")).toContainText(
    "not independent N(0,1)",
  );
  await page.locator("#observations-number").fill("1000");
  await expect(page.locator("#input-warning")).toBeHidden();
  await page.locator("#relationship").selectOption("normalLimit");
  await expect(page.locator("#relationship-classification")).toHaveText(
    "Limit",
  );
  expect((await plotted(page)).map((d) => d.label)).toContain(
    "Standard normal limit",
  );
  await expect(page.locator("#experiment-reading")).toContainText(
    "Finite-df t is exact",
  );
});
test("results CSV retains every repetition including extreme values outside the axes", async ({
  page,
}) => {
  const options = { relationship: "f", df1: 1, df2: 1, seed: 42 };
  await page.goto(
    route + "?relationship=f&df1=1&df2=1&shown=5000&repetitions=5000",
  );
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#download-repetitions").click(),
  ]);
  const chunks = [];
  for await (const chunk of await download.createReadStream())
    chunks.push(chunk);
  const csv = Buffer.concat(chunks).toString();
  const lines = csv.trim().split("\n");
  expect(lines.length).toBe(5001);
  const results = M.simulate(options, 5000),
    max = M.plot(options, results).max;
  const outside = results.find((r) => r.value > max);
  expect(outside).toBeTruthy();
  expect(lines[outside.index + 1].split(",")[2]).toBe(String(outside.value));
  expect(download.suggestedFilename()).toBe(
    "distribution-relationships-results.csv",
  );
  await expect(page.locator("#scale-note")).toContainText(
    "outside the plotted range",
  );
});
test("invalid URL state falls back and dependent inspection bounds are clamped", async ({
  page,
}) => {
  await page.goto(
    route +
      "?relationship=%3Cscript%3E&df1=0&df2=Infinity&sampleSize=101&groups=7&seed=-1&shown=5000&repetitions=100&inspected=5000&traceStep=99",
  );
  const s = await state(page);
  expect(s.relationship).toBe("squares");
  expect(s.df1).toBe("1");
  expect(s.df2).toBe("4");
  expect(s.shown).toBe("100");
  expect(s.inspected).toBe("100");
  expect(s.traceStep).toBe("1");
  await expect(page.locator("#input-warning")).toBeHidden();
  await page.locator(".seed-details > summary").click();
  await page.locator("#seed").fill("43");
  await page.locator("#seed").fill("");
  await expect(page.locator("#input-warning")).toContainText(
    "Using default seed 42",
  );
  const data = await plotted(page),
    link = page.url();
  expect(new URL(link).searchParams.get("seed")).toBe("42");
  await page.goto(link);
  expect(await plotted(page)).toEqual(data);
});
test("catalogue and test applets link into the relevant relationship", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#search").fill("distribution derivation");
  await expect(page.locator(".applet-entry")).toHaveCount(1);
  await page.locator(".applet-entry").click();
  await expect(page.locator(".distribution-map")).toBeVisible();
  for (const [id, relationship] of [
    ["t-distribution-explorer", "t"],
    ["f-distribution-explorer", "f"],
    ["chi-squared-explorer", "gof"],
    ["one-sample-t-test", "oneSampleT"],
    ["independent-samples-t-test", "pooledT"],
    ["anova-explorer", "anova"],
  ]) {
    await page.goto(`/html/${id}.html`);
    await page
      .locator('.related-learning a[href*="distribution-relationships"]')
      .click();
    await expect(page.locator("#relationship")).toHaveValue(relationship);
  }
});
test("keyboard map selection and 320px layouts keep controls and formulae accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto(route);
  const connector = page.locator('[data-relationship="pooledT"]');
  await connector.focus();
  await connector.press("Enter");
  await expect(page.locator("#relationship")).toHaveValue("pooledT");
  await page.locator("#next-step").focus();
  await page.locator("#next-step").press("Enter");
  await expect(page.locator("#traceStep")).toHaveValue("2");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 2,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Back to the map" }).click();
  await expect(connector).toBeVisible();
});
