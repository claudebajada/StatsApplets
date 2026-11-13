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
const finalStep = async (page) => {
  for (let i = 0; i < 3; i++) await page.locator("#next-step").click();
};
for (const lesson of lessons) {
  const kind = lesson.relationship,
    mode = modes[kind];
  test(`${kind}: focused steps, parameters, presets, sampling, sharing, CSV and accessibility`, async ({
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
    await expect(
      page.locator("#worked-example strong").first(),
    ).not.toBeEmpty();
    if (lesson.section === "Connections")
      await page.locator("#trace-numbers > summary").click();
    await expect(page.locator("h1")).toHaveText(lesson.title);
    await expect(page.locator("#relationship")).toBeHidden();
    await expect(page.locator("#relationship-classification")).toHaveText(
      mode.type,
    );
    await expect(page.locator("#repeated-sampling")).toBeHidden();
    await expect(page.locator("#previous-step")).toBeDisabled();
    for (let i = 1; i <= 4; i++) {
      await expect(page.locator("#trace-position")).toContainText(
        `Step ${i} of 4`,
      );
      await expect(page.locator("#trace-title")).toHaveText(
        mode.steps[i - 1].title,
      );
      await expect(page.locator("#trace-instruction")).toHaveText(
        mode.steps[i - 1].text,
      );
      await expect(page.locator("#trace-calculation table")).toBeVisible();
      await expect(page.locator(".guided-lab math")).toHaveCount(1);
      if (i < 4) {
        await page.locator("#next-step").click();
        await expect(page.locator("#trace-title")).toBeFocused();
        expect(
          (await page.locator("#trace-title").boundingBox()).y,
        ).toBeLessThan(120);
      }
    }
    await expect(page.locator("#next-step")).toBeDisabled();
    await expect(page.locator("#repeated-sampling")).toBeVisible();
    await page.locator("#previous-step").click();
    await expect(page.locator("#trace-position")).toContainText("Step 3 of 4");
    await page.locator("#next-step").click();
    await page.locator("#all-repetitions").click();
    await expect(page.locator("#shown")).toHaveValue("1000");
    await page.locator(".plot-details > summary").click();
    await expect(page.locator("#scale-note")).toContainText(
      "without renormalising",
    );
    const result = await plotted(page),
      settings = await state(page),
      link = page.url();
    expect(result[0].data).toHaveLength(40);
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
    const firstAlternative = page.locator(".chart-data").first();
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
    await finalStep(page);
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
  await expect(page.locator(".lesson-list a")).toHaveCount(10);
  await expect(page.locator(".suggested-route a")).toHaveCount(3);
  await expect(
    page.getByRole("heading", { name: "Further connections" }),
  ).toBeVisible();
  const violations = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(violations.violations.map((v) => v.id)).toEqual([]);
  await page.getByRole("link", { name: "Start with Normal → χ²" }).click();
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
  await expect(page.locator(".lesson-list a")).toHaveCount(10);
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
  for (const invalid of ["unknown", "", "__proto__", "constructor"]) {
    await page.goto(`${overview}?relationship=${invalid}&seed=8`);
    await expect(page.locator("h1")).toHaveText("How distributions connect");
    await expect(page.locator("#controls")).toHaveCount(0);
  }
  await page.goto(`${route("t")}?relationship=f&df2=20`);
  await expect(page.locator("#relationship")).toHaveValue("t");
  await expect(page.locator("#df2")).toHaveValue("20");
});
test("draws stay stable when repetitions grow; model changes restart the trace", async ({
  page,
}) => {
  await page.goto(route("squares"));
  await page.locator("#trace-numbers > summary").click();
  const first = await page.locator("#trace-calculation").innerText();
  await finalStep(page);
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
});
test("GOF remains approximate and finite-df t remains distinct from its limit", async ({
  page,
}) => {
  await page.goto(route("gof") + "?observations=10&categories=10");
  await expect(page.locator("#input-warning")).toContainText(
    "Increasing repetitions does not fix",
  );
  await page.locator("#next-step").click();
  await page.locator("#next-step").click();
  await expect(page.locator("#trace-instruction")).toContainText(
    "c − 1 free directions",
  );
  await page.locator("#observations-number").fill("1000");
  await expect(page.locator("#input-warning")).toBeHidden();
  await page.goto(route("normalLimit"));
  await expect(page.locator("#relationship-classification")).toHaveText(
    "Limit",
  );
  await expect(page.locator(".family-map")).toContainText("df increases");
  await expect(page.locator(".family-map .connection-active")).toHaveAttribute(
    "d",
    "M70 120 V65",
  );
  expect((await plotted(page)).map((d) => d.label)).toContain(
    "Standard normal limit",
  );
  await finalStep(page);
  await expect(page.locator("#trace-working")).toContainText("finite-df t");
});
test("CSV retains extreme values outside the axes", async ({ page }) => {
  await page.goto(route("f") + "?df1=1&df2=1&shown=5000&repetitions=5000");
  await page.locator(".plot-details > summary").click();
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
  expect(s.df1).toBe("1");
  expect(s.seed).toBe("42");
  expect(s.shown).toBe("100");
  expect(s.inspected).toBe("100");
  expect(s.traceStep).toBe("1");
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
test("320px lessons support keyboard steps, long formulas and tables without page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
  for (const lesson of lessons) {
    await page.goto(route(lesson.relationship));
    for (let i = 0; i < 4; i++) {
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 2,
        ),
      ).toBe(true);
      if (i < 3) {
        await page.locator("#next-step").focus();
        await page.locator("#next-step").press("Enter");
      }
    }
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

test("connections and derivations have distinct openings and the coordinate proof is optional", async ({
  page,
}) => {
  await page.goto(route("squares"));
  await expect(page.locator("#worked-example")).toContainText(
    "standard normal draw",
  );
  await expect(page.locator("#trace-numbers")).not.toHaveAttribute("open", "");
  await expect(page.locator(".family-details")).not.toHaveAttribute("open", "");
  await expect(page.locator(".next-lesson a")).toHaveAttribute(
    "href",
    byMode.t.id + ".html",
  );
  await expect(page.locator(".related-derivations")).not.toHaveAttribute(
    "open",
    "",
  );
  for (const link of await page
    .getByRole("link", { name: "Distribution connections", exact: true })
    .all()) {
    await expect(link).toHaveAttribute(
      "href",
      "distribution-relationships.html",
    );
  }
  await page.goto(route("oneSampleT"));
  await expect(page.locator("#worked-example")).toContainText(
    "normal observations",
  );
  await expect(page.locator("#trace-diagram")).not.toContainText(
    "residual directions",
  );
  await expect(page.locator("#trace-calculation")).not.toContainText(
    "Centred residual",
  );
  await page.locator("#next-step").click();
  await expect(page.locator("#worked-example")).toContainText(
    "Free directions n − 1",
  );
  await expect(page.locator("#trace-calculation")).not.toContainText("Helmert");
  await expect(page.locator("#trace-proof")).not.toHaveAttribute("open", "");
  await page.locator("#trace-proof > summary").click();
  await expect(page.locator("#proof-calculation table")).toBeVisible();
  await expect(page.locator("#proof-explanation")).toContainText(
    "Helmert coordinates",
  );
  await expect(page.locator("#proof-working")).toContainText("SS/σ²");
});
