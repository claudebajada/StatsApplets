const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const {
  modes,
  lessons,
  byMode,
} = require("../../javascript/relationship-content.js");
const M = require("../../javascript/relationship-math.js");
const overview = "/html/distribution-relationships.html";
const route = (kind) => `/html/${byMode[kind].id}.html`;
const state = (page) => page.evaluate(() => AppletPage.read());
const plotted = (page) =>
  page.evaluate(() =>
    Chart.getChart("relationshipChart").data.datasets.map((d) => ({
      label: d.label,
      data: d.data,
    })),
  );
const options = async (page) =>
  page.locator(".lesson-options > summary").click();
const openDetails = (page) =>
  page.locator("#relationship-trace > summary").click();
for (const lesson of lessons) {
  const kind = lesson.relationship,
    mode = modes[kind];
  test(`${kind}: initial result, live plot, parameters, sharing, CSV and accessibility`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(route(kind));
    const initial = await state(page);
    const example = await page.locator("#worked-example").boundingBox();
    expect(example.y).toBeLessThan(
      await page.evaluate(() => innerHeight - 100),
    );
    await expect(page.locator("#worked-example dd").first()).not.toBeEmpty();
    await expect(page.locator("h1")).toHaveText(lesson.title);
    await expect(page.locator("#relationship")).toBeHidden();
    await expect(page.locator("#relationship-trace")).not.toHaveAttribute(
      "open",
      "",
    );
    await expect(page.locator("#repeated-sampling canvas")).toBeVisible();
    await expect(page.locator(".relationship-formula math")).toBeVisible();
    await expect(page.locator("#sampling-status")).toHaveText("1 result");

    const originalChart = await plotted(page);
    const expectedValue = M.draw(
      Object.fromEntries(
        Object.entries(initial).map(([k, v]) => [
          k,
          k === "relationship" ? v : Number(v),
        ]),
      ),
    ).value;
    expect(
      originalChart.find((d) => d.label === "Worked result").data[0].x,
    ).toBe(expectedValue);
    expect(originalChart.some((d) => d.label === "Simulated")).toBe(false);
    await page.getByRole("button", { name: "Repeat the calculation" }).click();
    await expect(page.locator("#sampling-status")).toHaveText("25 results");
    await expect(
      page.getByRole("button", { name: "Show all 1,000 results" }),
    ).toBeFocused();
    await page.getByRole("button", { name: "Show all 1,000 results" }).click();
    await expect(page.locator("#sampling-status")).toHaveText("1,000 results");
    expect(
      (await plotted(page)).find((d) => d.label === "Worked result"),
    ).toEqual(originalChart.find((d) => d.label === "Worked result"));
    await openDetails(page);
    await expect(page.locator("#scale-note")).toContainText(
      "without renormalising",
    );
    for (let i = 1; i <= 4; i++) {
      await page.locator("#traceStep").selectOption(String(i));
      await expect(page.locator("#trace-instruction")).toHaveText(
        mode.steps[i - 1].text,
      );
      await expect(page.locator("#trace-calculation table")).toBeVisible();
    }
    const result = await plotted(page),
      settings = await state(page),
      link = page.url();
    expect(result.find((d) => d.label === "Simulated").data).toHaveLength(40);
    expect(
      result
        .flatMap((d) => d.data)
        .every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    ).toBe(true);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("#download-repetitions").click(),
    ]);
    const chunks = [];
    for await (const chunk of await download.createReadStream())
      chunks.push(chunk);
    expect(Buffer.concat(chunks).toString().trim().split("\n")).toHaveLength(
      1001,
    );
    await page.goto(link);
    expect(await state(page)).toEqual(settings);
    expect(await plotted(page)).toEqual(result);
    await openDetails(page);
    const firstAlternative = page.locator(".chart-data");
    await firstAlternative.locator("summary").click();
    await expect(firstAlternative.locator("table")).toBeVisible();
    await expect(page.locator("canvas")).toHaveAttribute(
      "aria-describedby",
      /.+-summary/,
    );
    if (kind === "pooledT" || kind === "anova") {
      await page.locator("#trace-input-details > summary").click();
      await expect(page.locator("#trace-inputs table")).toContainText(
        "Input value",
      );
    }
    await options(page);
    for (let i = 0; i < lesson.presets.length; i++) {
      await page.locator("#preset").selectOption(String(i));
      for (const [key, value] of Object.entries(lesson.presets[i][1]))
        await expect(page.locator(`#${key}`)).toHaveValue(String(value));
      await expect(page.locator("#relationship")).toHaveValue(kind);
      await expect(page.locator("#traceStep")).toHaveValue("1");
      await expect(page.locator("#shown")).toHaveValue("1");
    }
    await page.locator("#reset").click();
    expect(await state(page)).toEqual(initial);
    await page.locator("#resample").click();
    await expect(page.locator("#seed")).toHaveValue("43");
    await page.locator("#reset").click();
    expect(await state(page)).toEqual(initial);
    for (const name of mode.params) {
      const control = page.locator(`#${name}`);
      for (const bound of ["min", "max"]) {
        const value = await control.getAttribute(bound);
        await page.locator(`#${name}-number`).fill(value);
        await expect(page.locator(`#${name}-value`)).toHaveText(value);
        await expect(page.locator("#traceStep")).toHaveValue("1");
        expect(
          (await plotted(page))
            .flatMap((d) => d.data)
            .every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
        ).toBe(true);
      }
    }
    await page.locator("#reset").click();
    const violations = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      violations.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 2,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}
test("homepage links only the overview, which offers all ten lessons in two groups", async ({
  page,
}) => {
  await page.goto(overview);
  await expect(page.locator("canvas, #controls, #relationship")).toHaveCount(0);
  await expect(page.locator(".lesson-list a")).toHaveCount(5);
  await expect(page.locator(".family-map a")).toHaveCount(5);
  await expect(page.locator(".family-map .primary-action")).toHaveCount(1);
  for (const lesson of lessons)
    await expect(page.locator(`main a[href="${lesson.id}.html"]`)).toHaveCount(
      1,
    );
  const violations = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(violations.violations.map((v) => v.id)).toEqual([]);
  await page.getByRole("link", { name: "Normal → χ². Square and add" }).click();
  await expect(page.locator("h1")).toHaveText(byMode.squares.title);
  await page.goto("/");
  const headings = await page
    .locator(".catalogue-section > .section-heading h2")
    .allTextContents();
  expect(headings.indexOf("Distribution connections")).toBe(
    headings.indexOf("Distributions") + 1,
  );
  expect(headings.indexOf("Hypothesis testing")).toBe(
    headings.indexOf("Distribution connections") + 1,
  );
  await expect(
    page.locator("#distribution-connections .applet-entry"),
  ).toHaveCount(1);
  await expect(page.locator("#catalogue-count")).toHaveText("16 of 16 pages");
  const homepageLinks = await page
    .locator(".applet-entry")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  for (const lesson of lessons)
    expect(homepageLinks).not.toContain(`html/${lesson.id}.html`);
  await page.locator("#search").fill("distributions connect");
  await expect(page.locator(".applet-entry")).toHaveCount(1);
  await page.locator(".applet-entry").click();
  await expect(page.locator("h1")).toHaveText("How distributions connect");
  await expect(page.locator(".lesson-list a")).toHaveCount(5);
  await page
    .locator(`.lesson-list a[href="${byMode.pooledT.id}.html"]`)
    .click();
  await expect(page.locator("h1")).toHaveText(byMode.pooledT.title);
});
test("legacy links preserve every mode and recognised state; invalid relationships stay on the overview", async ({
  page,
}) => {
  for (const lesson of lessons) {
    await page.goto(
      `${overview}?relationship=${lesson.relationship}&seed=73&shown=30&inspected=4&traceStep=3#guided-lab`,
    );
    await expect(page).toHaveURL(
      new RegExp(`${lesson.id}\\.html\\?.*#guided-lab$`),
    );
    const s = await state(page);
    expect(s.relationship).toBe(lesson.relationship);
    expect(s.seed).toBe("73");
    expect(s.shown).toBe("30");
    expect(s.inspected).toBe("4");
    expect(s.traceStep).toBe("3");
    await expect(page.locator("#repeated-sampling")).toBeVisible();
  }
  await page.goto(`${overview}?df1=4&seed=8`);
  await expect(page.locator("#relationship")).toHaveValue("squares");
  await expect(page.locator("#df1")).toHaveValue("4");
  await page.goto(`${overview}?relationship=squares&seed=8`);
  await expect(page.locator("#df1")).toHaveValue("1");
  for (const invalid of ["unknown", "", "__proto__", "constructor"]) {
    await page.goto(`${overview}?relationship=${invalid}&seed=8`);
    await expect(page.locator("h1")).toHaveText("How distributions connect");
    await expect(page.locator("#controls")).toHaveCount(0);
  }
  await page.goto(`${route("t")}?relationship=f&df2=20`);
  await expect(page.locator("#relationship")).toHaveValue("t");
  await expect(page.locator("#df2")).toHaveValue("20");
});
test("one sum becomes a histogram and changing the number of draws keeps the simulation in view", async ({
  page,
}) => {
  await page.goto(route("squares"));
  await expect(page.locator("#df1")).toHaveValue("3");
  const first = await page.locator("#worked-example").innerText();
  await page.locator("#all-repetitions").click();
  await openDetails(page);
  await page.locator("#next-draw").click();
  await expect(page.locator("#shown")).toHaveValue("25");
  await expect(page.locator("#worked-example")).toHaveAttribute(
    "data-repetition",
    "2",
  );
  await page.locator("#add-repetitions").click();
  await expect(page.locator("#shown")).toHaveValue("125");
  await page.locator("#inspected").fill("1");
  await page.locator("#inspected").press("Tab");
  await expect(page.locator("#worked-example")).toHaveText(first, {
    useInnerText: true,
  });
  await page.locator("#df1-number").fill("4");
  await expect(page.locator("#shown")).toHaveValue("125");
  await expect(page.locator("#inspected")).toHaveValue("1");
  await expect(page.locator("#trace-calculation tbody tr")).toHaveCount(4);
  expect(
    (await plotted(page)).some((dataset) => dataset.label === "χ²(4)"),
  ).toBe(true);
});
test("GOF remains approximate and the tail comparison keeps its horizontal range", async ({
  page,
}) => {
  await page.goto(route("gof") + "?observations=10&categories=10");
  await expect(page.locator("#input-warning")).toContainText(
    "Increasing repetitions does not fix",
  );
  await expect(page.locator("#relationshipChart-explanation")).toContainText(
    "approximate",
  );
  await openDetails(page);
  await page.locator("#traceStep").selectOption("3");
  await expect(page.locator("#trace-instruction")).toContainText(
    "c − 1 free directions",
  );
  await page.locator("#observations-number").fill("1000");
  await expect(page.locator("#input-warning")).toBeHidden();
  for (const kind of ["t", "normalLimit"]) {
    await page.goto(route(kind));
    if (kind === "t") {
      await expect(page.locator("#worked-example")).toContainText(
        "Same numerator",
      );
      await expect(
        page.locator(".related-links a[href='t-squared-to-f.html']"),
      ).toBeVisible();
    }
    expect((await plotted(page)).map((d) => d.label)).toContain("Normal");
    const bounds = () =>
      page.evaluate(() => {
        const { min, max } = Chart.getChart("relationshipChart").scales.x;
        return [min, max];
      });
    expect(await bounds()).toEqual([-6, 6]);
    await expect(page.locator("#comparison-note")).toContainText(
      "11.6% for t(4)",
    );
    await page.locator("#df2-number").fill("30");
    await expect(page.locator("#comparison-note")).toContainText(
      "5.5% for t(30)",
    );
    expect(await bounds()).toEqual([-6, 6]);
  }
});
test("CSV retains extreme values outside the axes", async ({ page }) => {
  await page.goto(route("f") + "?df1=1&df2=1&shown=5000&repetitions=5000");
  await openDetails(page);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#download-repetitions").click(),
  ]);
  const chunks = [];
  for await (const chunk of await download.createReadStream())
    chunks.push(chunk);
  const lines = Buffer.concat(chunks).toString().trim().split("\n");
  expect(lines).toHaveLength(5001);
  const results = M.simulate(
    { relationship: "f", df1: 1, df2: 1, seed: 42 },
    5000,
  );
  const max = M.plot(
    { relationship: "f", df1: 1, df2: 1, seed: 42 },
    results,
  ).max;
  const outside = results.find((r) => r.value > max);
  expect(outside).toBeTruthy();
  expect(lines[outside.index + 1].split(",")[2]).toBe(String(outside.value));
  expect(download.suggestedFilename()).toBe(
    "distribution-relationships-results.csv",
  );
});
test("invalid state falls back, dependent bounds clamp and invalid seeds retain the last valid value", async ({
  page,
}) => {
  await page.goto(
    route("squares") +
      "?relationship=%3Cscript%3E&df1=0&seed=-1&shown=5000&repetitions=100&inspected=5000&traceStep=99",
  );
  const s = await state(page);
  expect(s.relationship).toBe("squares");
  expect(s.df1).toBe("3");
  expect(s.seed).toBe("42");
  expect(s.shown).toBe("100");
  expect(s.inspected).toBe("100");
  expect(s.traceStep).toBe("1");
  await openDetails(page);
  await options(page);
  await page.locator(".seed-details > summary").click();
  await page.locator("#seed").fill("43");
  await page.locator("#seed").fill("42.5");
  await expect(page.locator("#input-warning")).toContainText("Using seed 43");
  await page.locator("#seed").fill("");
  await expect(page.locator("#input-warning")).toContainText(
    "Using default seed 42",
  );
  const data = await plotted(page),
    link = page.url();
  await page.goto(link);
  expect(await plotted(page)).toEqual(data);
});
test("existing explorers link directly into their relevant lesson", async ({
  page,
}) => {
  for (const [id, kind] of [
    ["t-distribution-explorer", "t"],
    ["f-distribution-explorer", "f"],
    ["chi-squared-explorer", "gof"],
    ["one-sample-t-test", "oneSampleT"],
    ["independent-samples-t-test", "pooledT"],
    ["anova-explorer", "anova"],
  ]) {
    await page.goto(`/html/${id}.html`);
    await page
      .locator(`.related-learning a[href="${byMode[kind].id}.html"]`)
      .click();
    await expect(page.locator("#relationship")).toHaveValue(kind);
  }
});
test("320px lessons support keyboard sampling, long formulas and tables without page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
  for (const lesson of lessons) {
    await page.goto(route(lesson.relationship));
    await page.locator("#all-repetitions").focus();
    await page.locator("#all-repetitions").press("Enter");
    await expect(page.locator("#sampling-status")).toHaveText("25 results");
    await openDetails(page);
    await page.locator("#traceStep").selectOption("3");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 2,
      ),
    ).toBe(true);
    const equation = page.locator(".guided-lab .equation");
    await equation.focus();
    await expect(equation).toBeFocused();
    if (await equation.evaluate((el) => el.scrollWidth > el.clientWidth)) {
      await equation.press("ArrowRight");
      await expect
        .poll(() => equation.evaluate((el) => el.scrollLeft))
        .toBeGreaterThan(0);
    }
  }
});

test("derivations show the two relevant calculations and retain the coordinate proof", async ({
  page,
}) => {
  await page.goto(route("oneSampleT"));
  await expect(page.locator("#worked-example")).toContainText(
    "Normal observations",
  );
  await expect(page.locator("#worked-example")).toContainText(
    "Using population SD",
  );
  await expect(page.locator("#worked-example")).toContainText(
    "Using estimated SD",
  );
  await expect(page.locator(".relationship-insight")).toContainText(
    "when the null mean is true",
  );
  await openDetails(page);
  await page.locator("#traceStep").selectOption("2");
  await expect(page.locator("#trace-proof")).not.toHaveAttribute("open", "");
  await page.locator("#trace-proof > summary").click();
  await expect(page.locator("#proof-calculation table")).toBeVisible();
  await expect(page.locator("#proof-explanation")).toContainText(
    "Helmert coordinates",
  );
  await expect(page.locator("#proof-working")).toContainText("SS/σ²");

  await page.goto(route("anova"));
  await page.locator("#groups-number").fill("2");
  await expect(page.locator("#worked-example")).toContainText(
    "Pooled t squared for these two groups",
  );
  const result = M.draw({ relationship: "anova", groups: 2 });
  expect(
    (await plotted(page)).find((d) => d.label === "Worked result").data[0].x,
  ).toBeCloseTo(result.trace.pooled.t ** 2, 12);
});
