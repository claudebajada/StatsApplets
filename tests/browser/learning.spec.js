  const {test,expect}=require("@playwright/test");
  const C=require("../../javascript/learning-content.js");
  async function move(page,id,value){
    await page.locator("#"+id).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));},String(value));
  }
  test("fixed mean-test axes reveal the expected halving of standard-error width",async({page})=>{
    await page.goto("/html/one-sample-t-test.html?N=25");
    await expect(page.locator("#alternative")).toHaveValue("twoSided");
    const width=()=>page.evaluate(()=>{
      const c=Chart.getChart("meanEstimateChart"),d=c.data.datasets[2].data;
      return {min:c.scales.x.min,max:c.scales.x.max,width:c.scales.x.getPixelForValue(d[1].x)-c.scales.x.getPixelForValue(d[0].x)};
    });
    const before=await width();await move(page,"N",100);const after=await width();
    expect(after.min).toBe(before.min);expect(after.max).toBe(before.max);
    expect(after.width/before.width).toBeCloseTo(0.5,8);
    await page.locator("#N-number").fill("25");
    await expect(page.locator("#N")).toHaveValue("25");
    await expect(page.locator("#N-value")).toHaveText("25");
    await expect(page.locator("#ci-value")).toContainText("[");
  });
  test("chi-squared proportional departure stays fixed across sample sizes",async({page})=>{
    await page.goto("/html/chi-squared-explorer.html?skew=10");
    const before=Number(await page.locator("#effect-size-value").innerText());
    await move(page,"total-observations",1000);
    expect(Number(await page.locator("#effect-size-value").innerText())).toBe(before);
    await expect(page.locator("#chi-squared-value")).toHaveText("500.0000");
  });
  test("F log view removes area fill without changing its critical value",async({page})=>{
    await page.goto("/html/f-distribution-explorer.html");
    const before=await page.locator("#critical-value").innerText();
    await page.locator("#log-axis").check();
    expect(await page.locator("#critical-value").innerText()).toBe(before);
    expect(await page.evaluate(()=>Chart.getChart("distributionChart").data.datasets[1].fill)).toBe(false);
    await expect(page.locator("#plot-note")).toContainText("not a probability");
  });
  test("power at the true null labels the correct decision rate",async({page})=>{
    await page.goto("/html/power-explorer.html?effect=0");
    await expect(page.locator(".result-card")).toContainText("Not applicable");
    await expect(page.locator(".result-card")).toContainText("95.0%");
  });
  test("CLT traces actual studies into its displayed sampling distribution",async({page})=>{
    await page.goto("/html/clt-explorer.html");
    await expect(page.locator("#trace-status")).toContainText("Study 1:");
    await expect(page.locator("#meansChart-explanation")).toContainText("Showing 1 of 1000");
    await page.locator("#trace-one").click();
    await expect(page.locator("#trace-status")).toContainText("Study 2:");
    await page.locator("#trace-ten").click();
    await expect(page.locator("#trace-status")).toContainText("Study 12:");
    await page.locator("#trace-all").click();
    await expect(page.locator("#meansChart-explanation")).toContainText("Showing 1000 of 1000");
    await page.reload();
    await expect(page.locator("#meansChart-explanation")).toContainText("Showing 1000 of 1000");
  });
  test("candidate regression line reaches a known least-squares solution",async({page})=>{
    await page.goto("/html/regression-explorer.html?dataMode=manual");
    await page.locator("#guided-lab > summary").click();
    await page.locator("#start-line-challenge").click();
    await page.locator("#candidateSlope-number").fill("0.8");
    await page.locator("#candidateIntercept-number").fill("0.6");
    await expect(page.locator("#candidate-working")).toContainText("Your line SSE = 3.600");
    expect(await page.evaluate(()=>Chart.getChart("fitChart").isDatasetVisible(1))).toBe(false);
    await page.locator("#reveal-line-solution").click();
    expect(await page.evaluate(()=>Chart.getChart("fitChart").isDatasetVisible(1))).toBe(true);
    await expect(page.locator("#input-warning")).toBeHidden();
  });
  test("ANOVA inspector connects observations, group means and weighted between SS",async({page})=>{
    await page.goto("/html/anova-explorer.html?dataMode=manual");
    await page.locator("#guided-lab > summary").click();
    await expect(page.locator("#anova-working")).toContainText("Observation 1.000");
    await page.locator("#inspect-group").selectOption("2");
    await page.locator("#inspect-observation").selectOption("2");
    await expect(page.locator("#anova-working")).toContainText("Observation 6.000");
    await expect(page.locator("#guided-content table")).toContainText("n ×");
  });
  test("correlation exposes a curved zero-r relationship and reversible influential point",async({page})=>{
    await page.goto("/html/correlation.html?dataMode=manual&pairs=-2,4%0A-1,1%0A0,0%0A1,1%0A2,4");
    await page.locator("#guided-lab > summary").click();
    await expect(page.locator("#data-pearson-value")).toHaveText("0.0000");
    await page.locator("#toggle-outlier").click();
    expect(Number(await page.locator("#data-pearson-value").innerText())).toBeLessThan(-0.5);
    await page.locator("#toggle-outlier").click();
    await expect(page.locator("#data-pearson-value")).toHaveText("0.0000");
  });
  test("selected binomial count links arrangements and a continuity-corrected area",async({page})=>{
    await page.goto("/html/binomial-components-explorer.html");
    await page.locator("#guided-lab > summary").click();
    await expect(page.locator(".arrangement-list code")).toHaveCount(3);
    await expect(page.locator("#binomial-working")).toContainText("0.3750");
    await page.goto("/html/binomial-normal-explorer.html?N=500&theta=0.05&k=25");
    await page.locator("#guided-lab > summary").click();
    await expect(page.locator("#binomial-working")).toContainText("24.5 to 25.5");
    expect(await page.evaluate(()=>Chart.getChart("normalChart").data.datasets[1].data.filter(p=>p.y!==null).length)).toBeGreaterThan(1);
  });
  test("mixed truth exposes both correct discoveries and different error rates",async({page})=>{
    await page.goto("/html/multiple-comparisons-explorer.html?signalFraction=0.3&correction=bh");
    await page.locator("#guided-lab > summary").click();
    await expect(page.locator("#multiplicity-working")).toContainText("6 real effects and 14 true nulls");
    await expect(page.locator("#guided-content table")).toContainText("Real effect");
    await expect(page.locator("#calculation")).toContainText("FDR and FWER can differ");
  });
  for(const [id,lesson] of Object.entries(C)) {
    test(`${id}: predict before revealing a controlled change`,async({page})=>{
      const errors=[];page.on("pageerror",e=>errors.push(e.message));
      await page.goto(`/html/${id}.html`);
      await page.locator("#prediction-panel > summary").click();
      await page.locator("#prediction-start").click();
      await page.locator(`input[name="prediction-choice"][value="${lesson.prediction.answer}"]`).check();
      await page.locator("#prediction-check").click();
      await expect(page.locator("#prediction-feedback")).toContainText("Your prediction matched.");
      await expect(page.locator("#input-warning")).toBeHidden();
      expect(errors).toEqual([]);
    });
    test(`${id}: both fictional research contexts load and survive a shared link`,async({page})=>{
      const errors=[];page.on("pageerror",e=>errors.push(e.message));
      await page.goto(`/html/${id}.html`);
      await page.locator(".context-controls > summary").click();
      for(const context of ["medicine","cognition"]){
        await page.locator("#context").selectOption(context);
        await expect(page.locator("#context-status")).toHaveText(lesson.cases[context].text);
        await expect(page.locator("#input-warning")).toBeHidden();
      }
      await page.reload();
      await expect(page.locator("#context")).toHaveValue("cognition");
      await expect(page.locator("#context-status")).toHaveText(lesson.cases.cognition.text);
      expect(errors).toEqual([]);
    });
  }
  test("plain-language search reaches group comparison applets",async({page})=>{
    await page.goto("/");
    await page.locator("#search").fill("compare two groups");
    await expect(page.locator('.applet-entry[href="html/independent-samples-t-test.html"]')).toBeVisible();
  });
  test("capture representative teaching views and check narrow layouts",async({page},testInfo)=>{
    const views=[
      ["one-sample-t-test.html",""],
      ["clt-explorer.html",""],
      ["correlation.html?dataMode=manual&pairs=-2,4%0A-1,1%0A0,0%0A1,1%0A2,4","#guided-lab"],
      ["regression-explorer.html","#guided-lab"],
      ["multiple-comparisons-explorer.html?signalFraction=0.3&correction=bh","#guided-lab"],
    ];
    for(const [path,open] of views){
      await page.goto("/html/"+path);
      if(open)await page.locator(open+" > summary").click();
      await page.evaluate(()=>document.fonts.ready);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
      const name=path.split(/[.?]/)[0]+".png";
      await page.screenshot({path:testInfo.outputPath(name),fullPage:true});
    }
  });
