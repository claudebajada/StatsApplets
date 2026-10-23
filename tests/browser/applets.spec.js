const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const applets = fs.readdirSync("html").filter((f) => f.endsWith(".html"));
async function move(page, id, value) {
  await page.locator(`[id="${id}"]`).evaluate((el, v) => {
    el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, String(value));
}
async function assertFiniteCharts(page) {
  const invalid = await page.evaluate(() => {
    const bad = [];
    for (const chart of Object.values(Chart.instances)) {
      for (const ds of chart.data.datasets)
        for (const point of ds.data) {
          if (point === null) continue;
          const values =
            typeof point === "object" ? [point.x, point.y] : [point];
          if (values.some((v) => v !== null && !Number.isFinite(Number(v))))
            bad.push(`${chart.canvas.id}: ${JSON.stringify(point)}`);
        }
      for (const [name, scale] of Object.entries(chart.scales)) {
        if (
          !Number.isFinite(scale.min) ||
          !Number.isFinite(scale.max) ||
          scale.min >= scale.max
        )
          bad.push(`${chart.canvas.id} ${name} invalid axis`);
      }
    }
    return bad;
  });
  expect(invalid).toEqual([]);
}
for (const file of applets)
  test(`${file} initialises and every slider responds at both boundaries`, async ({
    page,
  }) => {
    const errors = [],
      consoleErrors = [],
      failed = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400 && !r.url().endsWith("/favicon.ico"))
        failed.push(r.url());
    });
    await page.goto("/html/" + file);
    await expect(page.locator("canvas").first()).toBeVisible();
    expect(await page.evaluate(() => Object.keys(Chart.instances).length)).toBe(
      await page.locator("canvas").count(),
    );
    // Count completed Chart updates, rather than asserting that input.value changes.
    await page.evaluate(() => {
      window.updateCount = 0;
      Chart.register({
        id: "regressionUpdates",
        afterUpdate() {
          window.updateCount++;
        },
      });
    });
    await assertFiniteCharts(page);
    await expect(page.locator("#input-warning")).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 2,
      ),
    ).toBe(true);
    for (const canvas of await page.locator("canvas").all()) {
      await canvas.scrollIntoViewIfNeeded();
      expect(
        await canvas.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return (
            r.width > 100 &&
            r.height > 100 &&
            document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) ===
              el
          );
        }),
      ).toBe(true);
    }
    const firstSlider = page.locator('input[type="range"]').first();
    await firstSlider.focus();
    const keyboardBefore = await page.evaluate(() => window.updateCount);
    await firstSlider.press("ArrowRight");
    expect(await page.evaluate(() => window.updateCount)).toBeGreaterThan(
      keyboardBefore,
    );
    for (const control of await page.locator('input[type="range"]').all()) {
      const id = await control.getAttribute("id");
      for (const bound of ["min", "max"]) {
        const before = await page.evaluate(() => window.updateCount);
        await move(page, id, await control.getAttribute(bound));
        expect(await page.evaluate(() => window.updateCount)).toBeGreaterThan(
          before,
        );
        await assertFiniteCharts(page);
        await expect(page.locator("#input-warning")).toBeHidden();
        await expect(page.locator("body")).not.toContainText(/NaN|Infinity/);
      }
    }
    // Give asynchronous typesetting/font requests a chance to complete.
    await page.waitForTimeout(250);
    expect(errors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(failed).toEqual([]);
  });
for (const file of [
  "one-sample-z-test",
  "one-sample-t-test",
  "independent-samples-t-test",
]) {
  test(`${file} displays independently referenced directional probabilities`, async ({
    page,
  }) => {
    await page.goto("/html/" + file + ".html");
    const independent = file.startsWith("independent"),
      z = file.includes("z-test");
    const ref = require("../references/scipy.json");
    if (independent) {
      await move(page, "mu1", -1);
      await move(page, "mu2", 0);
      await move(page, "sigma", 2);
      await move(page, "N1", 5);
      await move(page, "N2", 9);
    } else {
      await move(page, "mu", -0.5);
      await move(page, "sigma", 1);
      await move(page, "N", 5);
    }
    const expected = independent
      ? ref.independent[1]
      : z
        ? ref.oneSampleZ[1]
        : ref.oneSample[1];
    for (const [value, key] of [
      ["upper", "upper"],
      ["lower", "lower"],
      ["twoSided", "twoSided"],
    ]) {
      await page.locator("#alternative").selectOption(value);
      expect(
        Number(await page.locator("#p-value-selected").innerText()),
      ).toBeCloseTo(expected[key], 4);
      const shade = await page.evaluate(() => {
        const c = Object.values(Chart.instances).at(-1),
          t = c.data.datasets[2].data[0].x;
        return {
          t,
          points: c.data.datasets[1].data.filter((p) => p.y !== null),
        };
      });
      expect(shade.points.length).toBeGreaterThan(0);
      expect(
        shade.points.every((p) =>
          value === "upper"
            ? p.x >= shade.t
            : value === "lower"
              ? p.x <= shade.t
              : Math.abs(p.x) >= Math.abs(shade.t),
        ),
      ).toBe(true);
    }
    await expect(page.locator("#cohen-d-value")).toHaveText(/^-0\./);
  });
}
test("chi squared conserves N, labels w, warns for small expected counts", async ({
  page,
}) => {
  await page.goto("/html/chi-squared-explorer.html");
  await move(page, "total-observations", 10);
  await move(page, "categories", 10);
  await move(page, "skew", 10);
  const counts = await page.evaluate(
    () => Object.values(Chart.instances)[0].data.datasets[1].data,
  );
  expect(counts.reduce((a, b) => a + b, 0)).toBe(10);
  expect(counts.every(Number.isInteger)).toBe(true);
  await expect(page.locator("body")).toContainText("Cohen's w");
  await expect(page.locator("#validity-warning")).toContainText("unreliable");
});
test("binomial boundaries are point masses without a continuous normal density", async ({
  page,
}) => {
  await page.goto("/html/binomial-normal-explorer.html");
  for (const [n, p] of [
    [0, 0.5],
    [30, 0],
    [30, 1],
  ]) {
    await move(page, "N", n);
    await move(page, "theta", p);
    const state = await page.evaluate(() =>
      Object.values(Chart.instances).map((c) => c.data.datasets[0].data),
    );
    expect(state[0].reduce((a, b) => a + b.y, 0)).toBe(1);
    expect(state[0].find((point) => point.x === n * p).y).toBe(1);
    expect(state[1]).toEqual([]);
    await expect(page.locator("#approximation-warning")).toContainText(
      "Variance is zero",
    );
    await assertFiniteCharts(page);
  }
});
test("F(1,1) critical value is visible within a dynamically extended axis", async ({
  page,
}) => {
  await page.goto("/html/f-distribution-explorer.html");
  expect(Number(await page.locator("#critical-value").innerText())).toBeCloseTo(
    161.447639,
    3,
  );
  expect(
    await page.evaluate(() => Object.values(Chart.instances)[0].scales.x.max),
  ).toBeGreaterThan(4000);
  await page.locator("#log-axis").check();
  await assertFiniteCharts(page);
});
test("undefined correlations have mathematical explanations and recover after input", async ({
  page,
}) => {
  await page.goto("/html/correlation.html");
  await page.locator(".input-details > summary").click();
  await page.locator("#dataMode").selectOption("manual");
  await page.locator("#pairs").fill("1,2\n1,3\n1,4");
  await expect(page.locator("#data-pearson-value")).toHaveText("Undefined");
  await expect(page.locator("#calculation")).toContainText("zero variance");
  await page.locator("#pairs").fill("0.1,2\n0.1,3\n0.1,4");
  await expect(page.locator("#data-pearson-value")).toHaveText("Undefined");
  await page.locator("#pairs").fill("1,2\n2,3\n3,4");
  await expect(page.locator("#data-pearson-value")).toHaveText("1.0000");
  await assertFiniteCharts(page);
});
test("landing catalogue groups and links all fifteen explorers", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".applet-entry")).toHaveCount(15);
  const links = await page
    .locator(".applet-entry")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
  expect(new Set(links).size).toBe(15);
  for (const href of links) {
    await page.goto("/" + href);
    await expect(page.locator("canvas").first()).toBeVisible();
  }
  await page.goto("/");
  await page.locator("#search").fill("correlation");
  await expect(page.locator(".applet-entry")).toHaveCount(1);
  await expect(
    page.locator("#lecture-links, #lecturer, .hero-note"),
  ).toHaveCount(0);
  await expect(page.locator(".applet-entry")).toHaveAttribute(
    "href",
    "html/correlation.html",
  );
});
