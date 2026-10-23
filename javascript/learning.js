/* Guided experiments alongside the statistical plots. */
(function learningRuntime() {
  "use strict";
  const byId = id => document.getElementById(id);
  const id = document.body.dataset.applet;
  const content = LearningContent[id];
  if (!content) return;
  let latest, refresh = () => {};
  document.addEventListener("applet:render", event => {
    latest = event.detail;
    refresh();
  });
  const add = (tag, text, parent, attributes = {}) => {
    const node = document.createElement(tag);
    if (text !== null) node.textContent = text;
    for (const [key,value] of Object.entries(attributes)) node.setAttribute(key,value);
    parent.append(node);
    return node;
  };
  const button = (text, parent, action, attributes={}) => {
    const b=add("button",text,parent,{type:"button",...attributes});
    b.addEventListener("click",action);
    return b;
  };
  const fixed = (value,places=3) => Number.isFinite(value) ? value.toFixed(places) : "Undefined";
  const probability = value => value === 0 ? "0" : formatProbability(value);
  const apply = state => { AppletPage.apply(state); AppletPage.sync(); };
  const escape = value => String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll('"',"&quot;");
  function svg(parent, markup, label, width=600,height=180) {
    parent.innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(label)}">${markup}</svg>`;
  }
  function dots(parent,values,mean,label) {
    const lo=Math.min(...values,mean),hi=Math.max(...values,mean);
    const span=Math.max(hi-lo,1),x=value=>30+540*(value-lo)/span;
    let marks=`<line x1="30" x2="570" y1="65" y2="65" stroke="#8194a8"/>`;
    values.forEach((value,i)=>{ marks+=`<circle cx="${x(value)}" cy="${50-(i%3)*9}" r="4" fill="#2456a6"/>`; });
    marks+=`<line x1="${x(mean)}" x2="${x(mean)}" y1="22" y2="80" stroke="#a64922" stroke-width="3"/>
      <text x="30" y="108">${fixed(lo)}</text><text x="570" y="108" text-anchor="end">${fixed(hi)}</text>
      <text x="300" y="140" text-anchor="middle">Sample mean = ${fixed(mean)}</text>`;
    svg(parent,marks,label,600,160);
  }
  function table(parent,headings,rows,caption) {
    parent.replaceChildren();
    const scroll=add("div",null,parent,{class:"table-scroll"});
    const t=add("table",null,scroll);
    add("caption",caption,t);
    const head=add("thead",null,t), tr=add("tr",null,head);
    headings.forEach(h=>add("th",h,tr,{scope:"col"}));
    const body=add("tbody",null,t);
    rows.forEach(row=>{const r=add("tr",null,body);row.forEach(value=>add("td",value,r));});
  }
  document.addEventListener("DOMContentLoaded", () => {
    const meta=AppletCatalogue.find(item=>item.id===id);
    const root=byId("guided-content");
    const title=byId("guided-title");
    const context=byId("context");
    function contextText() {
      const selected=content.cases[context.value];
      byId("context-description").textContent=selected ? selected.title + ". " + selected.text : "All research examples use fictional data.";
      byId("context-status").textContent=selected ? selected.text : content.plain;
    }
    context.addEventListener("change", () => {
      const selected=content.cases[context.value];
      if(selected) {
        apply({...selected.settings,context:context.value,
          ...(id==="clt-explorer" ? {traceCount:1,traceMode:true}:{}),
        });
        byId("fit-axes")?.click();
      }
      contextText();
    });
    document.addEventListener("applet:state",contextText);
    contextText();

    // A controlled experiment: predict before revealing the intervention's result.
    const prediction=content.prediction, panel=byId("prediction-experiment");
    add("p",prediction.prompt,panel);
    const load=button("Load starting example",panel,()=>{
      apply({...prediction.setup,context:"abstract"});
      byId("fit-axes")?.click();
      choices.forEach(input=>{ input.disabled=false; input.checked=false; });
      check.disabled=true;
      feedback.textContent="Starting example loaded. Make a prediction before applying the change.";
    },{id:"prediction-start"});
    const fieldset=add("fieldset",null,panel);
    add("legend","Your prediction",fieldset);
    const choices=prediction.options.map((text,index)=>{
      const label=add("label",null,fieldset,{class:"prediction-choice"});
      const input=add("input",null,label,{type:"radio",name:"prediction-choice",value:index});
      input.disabled=true;
      label.append(" "+text);
      return input;
    });
    const check=button("Apply change and explain",panel,()=>{
      const chosen=choices.find(input=>input.checked);
      if(!chosen)return;
      apply({...prediction.setup,...prediction.change,context:"abstract"});
      feedback.textContent=(Number(chosen.value)===prediction.answer
        ? "Your prediction matched. " : "Compare your prediction with the result. ")+prediction.explanation;
    },{id:"prediction-check"});
    check.disabled=true;
    choices.forEach(input=>input.addEventListener("change",()=>{ check.disabled=false; }));
    const feedback=add("p","Load the starting example, then choose a prediction.",panel,{id:"prediction-feedback",role:"status"});
    add("details",null,panel,{class:"transfer-question"});
    const transfer=panel.lastElementChild;
    add("summary","Check the idea in words",transfer);
    add("p",meta.question,transfer);
    add("p",meta.answer,transfer);

    if(id.includes("sample") && id.includes("test")) {
      title.textContent="Build the statistic from difference and uncertainty";
      let stage=0;
      const tabs=add("div",null,root,{class:"step-tabs"});
      const view=add("div",null,root,{class:"step-content"});
      const names=["1 · Difference","2 · Uncertainty","3 · Standardise","4 · Interpret"];
      const buttons=names.map((name,i)=>button(name,tabs,()=>{stage=i;refresh();}));
      refresh=()=>{
        if(!latest)return;
        const d=latest,r=d.result,difference=d.mean1-d.mean2;
        buttons.forEach((b,i)=>{ if(i===stage)b.setAttribute("aria-current","step");else b.removeAttribute("aria-current"); });
        view.replaceChildren();
        if(stage===0) {
          add("h3","Start with the research question",view);
          add("p",content.question,view);
          add("p",`${d.independent?"Difference between sample means":"Difference from the null mean"} = ${fixed(d.mean1)} − ${fixed(d.mean2)} = ${fixed(difference)} original units.`,view,{class:"worked-number"});
          add("p","A difference alone does not tell us how stable it would be across repeated studies.",view);
        } else if(stage===1) {
          add("h3","Choose the uncertainty of the estimate",view);
          add("p",content.plain,view);
          add("p",d.independent
            ? `SE = ${fixed(d.sd)} × √(1/${d.n} + 1/${d.n2}) = ${fixed(r.se)}. Both groups contribute uncertainty.`
            : `SE = ${fixed(d.sd)} / √${d.n} = ${fixed(r.se)}. Averaging reduces uncertainty about the mean; it does not make individuals less variable.`,view,{class:"worked-number"});
          const diagram=add("div",null,view,{class:"learning-svg"});
          const scale=440/Math.max(d.sd,r.se);
          svg(diagram,`<text x="20" y="28">Individual SD</text><rect x="140" y="13" width="${d.sd*scale}" height="20" fill="#2456a6"/><text x="20" y="75">Estimate SE</text><rect x="140" y="60" width="${r.se*scale}" height="20" fill="#006b69"/>`,
            "Individual standard deviation and standard error on the same unit scale",600,110);
        } else if(stage===2) {
          add("h3","Measure the difference in standard errors",view);
          const equation=add("div",null,view,{class:"equation"});
          equation.innerHTML=`<math display="block" aria-label="Statistic equals the signed difference divided by standard error"><mrow><mi>${d.knownSigma?"z":"t"}</mi><mo>=</mo><mfrac><mn>${fixed(difference)}</mn><mn>${fixed(r.se)}</mn></mfrac><mo>=</mo><mn>${fixed(r.statistic)}</mn></mrow></math>`;
          add("p",`The sample is ${fixed(Math.abs(r.statistic),2)} standard errors ${difference<0?"below":"above"} the null value. This standardisation lets the reference distribution express how unusual that distance is.`,view);
          add("p",d.knownSigma?"Here the population SD is assumed known.":"Here SD is estimated. The t reference accounts for the extra uncertainty in that estimate.",view);
        } else {
          add("h3","Ask what the null model would produce",view);
          const direction=byId("alternative").value;
          add("p",`For the selected alternative, p = ${probability(r.tails[direction])}. If the null and model assumptions hold, this is the probability of a statistic at least as extreme in the selected direction or directions. It is not the probability that the null hypothesis is true.`,view);
          add("p",`The two-sided 95% confidence interval is [${fixed(d.low)}, ${fixed(d.high)}]. It corresponds to the two-sided 5% test. A directional test has a different rejection region.`,view);
          add("p",d.independent?"These groups contain different participants. Repeated measurements on the same people require a paired analysis.":"A small p-value does not establish that an effect is important or that the study design supports a causal conclusion.",view);
        }
      };
    } else if(id==="clt-explorer") {
      title.textContent="Why does SE contain √n?";
      add("p","For independent observations, variances add. The sum of n observations has variance nσ². Dividing the sum by n divides its variance by n², giving Var(mean) = σ²/n. Taking the square root gives SE = σ/√n.",root);
      add("p","That is why four times as many observations halve SE. More simulated studies improve the histogram, while observations per study determine its theoretical spread.",root);
      const trace=byId("sample-trace"), actions=add("div",null,trace,{class:"lab-actions"});
      const advance=count=>apply({traceMode:true,traceCount:Math.min(latest.reps,(byId("traceMode").checked?latest.shown:0)+count)});
      button("Add one study",actions,()=>advance(1),{id:"trace-one"});
      button("Add ten studies",actions,()=>advance(10),{id:"trace-ten"});
      button("Show all study means",actions,()=>apply({traceMode:false,traceCount:latest.reps}),{id:"trace-all"});
      button("Start with one study",actions,()=>apply({traceMode:true,traceCount:1}),{id:"trace-reset"});
      const status=add("p",null,trace,{id:"trace-status",role:"status"});
      const diagram=add("div",null,trace,{class:"learning-svg"});
      refresh=()=>{
        if(!latest)return;
        const index=latest.shown-1;
        const sample=index<latest.result.firstSamples.length
          ?latest.result.firstSamples[index]
          :LearningMath.sampleSequence(latest.n,latest.shown,latest.population,latest.seed).at(-1).sample;
        const mean=latest.result.means[index];
        status.textContent=`Study ${index+1}: ${latest.n} individual observations → one mean, ${fixed(mean)}. ${latest.shown} means are now shown below. Population SD stays 1; theoretical SE = ${fixed(latest.result.theoreticalSE)}.`;
        dots(diagram,sample,mean,`The ${latest.n} observations in study ${index+1}, with their mean ${fixed(mean)}`);
      };
    } else if(id==="confidence-interval-explorer") {
      title.textContent="Inspect the construction of one interval";
      const label=add("label","Displayed interval to inspect",root,{for:"inspect-interval"});
      const select=add("select",null,root,{id:"inspect-interval"});
      const text=add("p",null,root,{id:"interval-working"});
      const diagram=add("div",null,root,{class:"learning-svg"});
      const draw=()=>{
        if(!latest)return;
        const index=Number(select.value)||0, interval=latest.result.intervals[index];
        text.textContent=`Study ${index+1}: sample mean ${fixed(interval.mean)}; sample SD ${fixed(interval.sampleSD)}; ${latest.method==="t"?"estimated":"known"} SE ${fixed(interval.se)}. Margin = ${fixed(interval.critical)} × ${fixed(interval.se)} = ${fixed(interval.margin)}. Interval [${fixed(interval.low)}, ${fixed(interval.high)}] ${interval.covers?"contains":"misses"} fixed μ = ${fixed(latest.mu)}.`;
        dots(diagram,interval.sample,interval.mean,"Observations used to construct the selected confidence interval");
        const chart=Chart.getChart("intervalChart");
        chart.data.datasets=chart.data.datasets.filter(ds=>ds.label!=="Inspected interval");
        chart.data.datasets.push({...lineDataset("Inspected interval",[{x:interval.low,y:index+1},{x:interval.high,y:index+1}],chartPalette[2]),borderWidth:4});
        chart.update();
      };
      select.addEventListener("change",draw);
      refresh=()=>{
        if(!latest)return;
        const selected=select.value; select.replaceChildren();
        for(let i=0;i<Math.min(80,latest.reps);i++)add("option","Study "+(i+1),select,{value:i});
        if(Number(selected)<select.options.length)select.value=selected||"0";
        draw();
      };
    } else if(id.startsWith("binomial-")) {
      title.textContent=id==="binomial-components-explorer"?"Follow one count through the multiplication":"Connect one exact probability to a normal area";
      const work=add("p",null,root,{id:"binomial-working",class:"worked-number"});
      const patterns=add("div",null,root,{class:"arrangement-list"});
      const note=add("p",null,root);
      refresh=()=>{
        if(!latest)return;
        const {n,p,k,result:r}=latest;
        if(id==="binomial-components-explorer") {
          work.textContent=`For k = ${k}: C(${n},${k}) = ${fixed(r.coefficient,0)} arrangements × ${r.term.toPrecision(5)} probability per arrangement = ${probability(r.exact)}. The purple bars identify this same k in all three plots.`;
          patterns.replaceChildren();
          if(r.arrangements.length)r.arrangements.forEach(pattern=>add("code",pattern,patterns));
          else add("p","Use n ≤ 6 to display every arrangement individually.",patterns);
          note.textContent="S = success; F = failure. Each arrangement has k successes and n − k failures. Independent trials with the same p give those arrangements equal probability.";
        } else {
          work.textContent=`Exact P(X = ${k}) = ${probability(r.exact)}. `+(r.normalArea===null?"The normal approximation is undefined because variance is zero.":`Normal area from ${k-0.5} to ${k+0.5} = ${probability(r.normalArea)}.`);
          note.textContent="The selected binomial bar is highlighted. The shaded normal area uses the same success-count interval. Compare probabilities, rather than comparing a bar's height with a density's height.";
        }
      };
    } else if(id==="t-distribution-explorer") {
      title.textContent="See what estimating SD does to the same sample";
      let index=0, records, lastDf;
      const actions=add("div",null,root,{class:"lab-actions"});
      button("Inspect next sample",actions,()=>{index=(index+1)%records.length;refresh();},{id:"t-next-sample"});
      button("Find an underestimated SD",actions,()=>{
        index=records.reduce((best,r,i)=>r.sd<records[best].sd?i:best,0);refresh();
      },{id:"t-small-sd"});
      const text=add("p",null,root,{id:"t-sample-working",role:"status"});
      const diagram=add("div",null,root,{class:"learning-svg"});
      const comparison=add("div",null,root,{class:"learning-svg"});
      add("p","The population is normal with μ = 0 and σ = 1. Each point below is one of 100 repeated studies: the same sample produces both a known-SD z score and an estimated-SD t score. Scores outside the plotted comparison range are clipped at its edge.",root);
      refresh=()=>{
        if(!latest)return;
        if(latest.df!==lastDf){lastDf=latest.df;records=LearningMath.tMechanism(latest.df,42);index=0;}
        const r=records[index];
        text.textContent=`Study ${index+1}, n = ${r.n}: mean ${fixed(r.mean)}, sample SD ${fixed(r.sd)}. Known-SD Z = mean/(1/√n) = ${fixed(r.z)}. Estimated-SD t = mean/(s/√n) = ${fixed(r.t)}. ${r.sd<1?"Here s underestimates σ, so |t| is larger than |Z|.":"Here s is at least σ, so |t| is no larger than |Z|."} With a fixed sample mean, centred deviations sum to zero, leaving n − 1 free deviations.`;
        dots(diagram,r.sample,r.mean,"The current normal sample and its mean");
        const lim=5, pos=value=>30+Math.max(0,Math.min(lim,value))*90;
        let marks='<line x1="30" x2="480" y1="155" y2="20" stroke="#8194a8"/><text x="300" y="185" text-anchor="middle">|Z| with known σ</text><text x="10" y="15">|t| using s</text>';
        records.forEach((sample,i)=>{marks+=`<circle cx="${pos(Math.abs(sample.z))}" cy="${155-Math.min(lim,Math.abs(sample.t))*27}" r="${i===index?6:3}" fill="${i===index?"#a64922":"#2456a6"}"/>`;});
        svg(comparison,marks,"One hundred paired absolute z and t scores; underestimating SD can increase the t score",600,200);
      };
    } else if(id==="correlation") {
      title.textContent="Start with deviations around the means";
      let quadrants=true, beforeOutlier=null, ownChange=false;
      const controls=add("div",null,root,{class:"lab-actions"});
      const label=add("label",null,controls);
      const toggle=add("input",null,label,{type:"checkbox",id:"show-deviation-quadrants"});toggle.checked=true;
      label.append(" Show centred quadrants and signed contributions");
      toggle.addEventListener("change",()=>{quadrants=toggle.checked;refresh();});
      const outlier=button("Add an influential point",controls,()=>{
        if(beforeOutlier){const state=beforeOutlier;beforeOutlier=null;apply(state);outlier.textContent="Add an influential point";return;}
        beforeOutlier=AppletPage.read();
        const pairs=latest.pairs, xs=pairs.map(p=>p[0]), ys=pairs.map(p=>p[1]);
        const extra=[Math.max(...xs)+4*Math.max(1,Math.max(...xs)-Math.min(...xs)),
          Math.min(...ys)-4*Math.max(1,Math.max(...ys)-Math.min(...ys))];
        if(extra.some(v=>Math.abs(v)>1e6)){beforeOutlier=null;return;}
        ownChange=true;
        apply({dataMode:"manual",pairs:[...pairs,extra].map(p=>p.join(",")).join("\n")});
        ownChange=false;outlier.textContent="Remove added point";
      },{id:"toggle-outlier"});
      const text=add("p",null,root,{id:"deviation-working"});
      const products=add("div",null,root,{class:"learning-svg"});
      Chart.register({id:"learningQuadrants",beforeDatasetsDraw(chart){
        if(chart.canvas.id!=="pairsChart"||!quadrants||!latest)return;
        const xs=latest.pairs.map(p=>p[0]),ys=latest.pairs.map(p=>p[1]);
        const mx=TeachingMath.mean(xs),my=TeachingMath.mean(ys);
        const x=chart.scales.x.getPixelForValue(mx),y=chart.scales.y.getPixelForValue(my);
        const {left,right,top,bottom}=chart.chartArea,ctx=chart.ctx;
        ctx.save();ctx.beginPath();ctx.rect(left,top,right-left,bottom-top);ctx.clip();
        ctx.fillStyle="#2456a612";ctx.fillRect(left,y,x-left,bottom-y);ctx.fillRect(x,top,right-x,y-top);
        ctx.fillStyle="#a6492212";ctx.fillRect(left,top,x-left,y-top);ctx.fillRect(x,y,right-x,bottom-y);
        ctx.strokeStyle="#6b5910";ctx.setLineDash([4,4]);ctx.beginPath();
        ctx.moveTo(x,top);ctx.lineTo(x,bottom);ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.restore();
      }});
      refresh=()=>{
        if(!latest)return;
        const pairs=latest.pairs,mx=TeachingMath.mean(pairs.map(p=>p[0])),my=TeachingMath.mean(pairs.map(p=>p[1]));
        const contributions=pairs.map(([x,y])=>(x-mx)*(y-my));
        const sum=contributions.reduce((a,b)=>a+b,0);
        text.textContent=`x̄ = ${fixed(mx)}, ȳ = ${fixed(my)}. For each point calculate (x − x̄)(y − ȳ). Same-sign deviations contribute positively; opposite signs contribute negatively. The sum is ${fixed(sum)}. Dividing by the centred vector lengths gives r = ${latest.r===null?"undefined":fixed(latest.r,4)}.`;
        const chart=Chart.getChart("pairsChart");
        chart.data.datasets[0].backgroundColor=quadrants?contributions.map(v=>v>=0?chartPalette[0]:chartPalette[1]):chartPalette[0];
        chart.data.datasets[0].pointStyle=quadrants?contributions.map(v=>v>=0?"circle":"triangle"):"circle";
        chart.update();
        const shown=contributions.slice(0,30),max=Math.max(1e-12,...shown.map(Math.abs));
        let marks='<line x1="20" x2="580" y1="90" y2="90" stroke="#8194a8"/>';
        shown.forEach((v,i)=>{const h=Math.abs(v)/max*65;marks+=`<rect x="${25+i*550/shown.length}" y="${v>=0?90-h:90}" width="${Math.max(2,450/shown.length)}" height="${h}" fill="${v>=0?"#2456a6":"#a64922"}"/>`;});
        svg(products,marks,"Signed deviation products for the first thirty observations; products above zero support positive association");
      };
    } else if(id==="regression-explorer") {
      title.textContent="Find a line by reducing squared errors";
      button("Start a line-fitting challenge",root,()=>{
        apply({tryLine:true,revealFit:false});
        document.querySelector(".candidate-controls").open=true;
      },{id:"start-line-challenge"});
      const text=add("p",null,root,{id:"candidate-working"});
      const squares=add("div",null,root,{class:"learning-svg"});
      add("p","Adjust Your slope and Your intercept in the controls. Reveal the least-squares line when ready. Each square below represents one squared vertical residual; its area, not its side length, represents that contribution. The horizontal layout is illustrative.",root);
      button("Reveal the least-squares solution",root,()=>apply({revealFit:true}),{id:"reveal-line-solution"});
      refresh=()=>{
        if(!latest)return;
        const d=latest;
        if(!d.result.defined){text.textContent=d.result.reason;squares.replaceChildren();return;}
        const target=d.tryLine?d.candidate:{sse:d.result.sse,residuals:d.result.residuals};
        text.textContent=`${d.tryLine?"Your line":"Fitted line"} SSE = ${fixed(target.sse)}. Minimum SSE = ${fixed(d.result.sse)}. ${d.tryLine?"Each movement changes the squared vertical errors.":"Enable a candidate line to explore other choices."}`;
        const shown=target.residuals.slice(0,20),max=Math.max(1e-12,...shown.map(Math.abs));
        let marks="";
        shown.forEach((r,i)=>{const side=Math.abs(r)/max*22;marks+=`<rect x="${10+i*29}" y="${80-side}" width="${side}" height="${side}" fill="#006b69" fill-opacity="0.55" stroke="#006b69"/>`;});
        marks+='<text x="10" y="110">Squared errors for the first 20 observations</text>';
        svg(squares,marks,"Areas proportional to squared residuals for the first twenty observations",600,130);
      };
    } else if(id==="anova-explorer") {
      title.textContent="Follow one observation through the variance partition";
      add("label","Group to inspect",root,{for:"inspect-group"});
      const groupSelect=add("select",null,root,{id:"inspect-group"});
      add("label","Observation within that group",root,{for:"inspect-observation"});
      const observationSelect=add("select",null,root,{id:"inspect-observation"});
      const text=add("p",null,root,{id:"anova-working"});
      const diagram=add("div",null,root,{class:"learning-svg"});
      const rows=add("div",null,root);
      const draw=()=>{
        if(!latest)return;
        const gi=Number(groupSelect.value)||0,oi=Number(observationSelect.value)||0;
        const a=LearningMath.anovaObservation(latest.groups,gi,oi);
        text.textContent=`Observation ${fixed(a.observed)} → group mean ${fixed(a.groupMean)} → grand mean ${fixed(a.grand)}. Within-group deviation = ${fixed(a.within)}; group-mean deviation = ${fixed(a.between)}. Their signed sum is the total deviation ${fixed(a.observed-a.grand)}. This observation contributes ${fixed(a.withinSquare)} to within-group SS. This group's between contribution is n × (group mean − grand mean)² = ${a.n} × ${fixed(a.between**2)} = ${fixed(a.groupBetweenSquare)}.`;
        const min=Math.min(a.observed,a.groupMean,a.grand),max=Math.max(a.observed,a.groupMean,a.grand);
        const x=v=>30+(v-min)*540/Math.max(1,max-min);
        svg(diagram,`<line x1="${x(a.observed)}" x2="${x(a.groupMean)}" y1="45" y2="45" stroke="#2456a6" stroke-width="5"/>
          <line x1="${x(a.groupMean)}" x2="${x(a.grand)}" y1="95" y2="95" stroke="#a64922" stroke-width="5"/>
          <text x="20" y="25">Observation → group mean: within</text><text x="20" y="135">Group mean → grand mean: between</text>`,
          "The within and between components of one observation's total deviation");
        const chart=Chart.getChart("groupsChart");
        chart.data.datasets=chart.data.datasets.filter(ds=>!ds.label.startsWith("Inspected "));
        const gx=gi+1+((oi%7)-3)*0.015;
        chart.data.datasets.push(
          {...lineDataset("Inspected within deviation",[{x:gx,y:a.observed},{x:gx,y:a.groupMean}],chartPalette[0]),showLine:true,borderWidth:4},
          {...lineDataset("Inspected group-mean deviation",[{x:gi+1.14,y:a.groupMean},{x:gi+1.14,y:a.grand}],chartPalette[1]),showLine:true,borderWidth:4});
        chart.update();
        table(rows,["Group","n","Mean","n × (mean − grand mean)²"],latest.groups.map((g,i)=>{
          const m=TeachingMath.mean(g);
          return [i+1,g.length,fixed(m),fixed(g.length*(m-a.grand)**2)];
        }),"Sample-size weighting of the between-group sum of squares");
      };
      const chooseGroup=()=>{
        const old=observationSelect.value;
        observationSelect.replaceChildren();
        latest.groups[Number(groupSelect.value)||0].forEach((value,i)=>add("option",`${i+1}: ${fixed(value)}`,observationSelect,{value:i}));
        observationSelect.value=Number(old)<observationSelect.options.length?(old||"0"):"0";draw();
      };
      groupSelect.addEventListener("change",chooseGroup);
      observationSelect.addEventListener("change",draw);
      add("p","Distances add for each observation. Their squares partition after summing within each group: the cross terms cancel because deviations from a group mean sum to zero. Between-group variation repeats the group-mean deviation once per participant, giving the factor n.",root);
      refresh=()=>{
        if(!latest)return;
        const old=groupSelect.value;groupSelect.replaceChildren();
        latest.groups.forEach((_,i)=>add("option","Group "+(i+1),groupSelect,{value:i}));
        groupSelect.value=Number(old)<groupSelect.options.length?(old||"0"):"0";chooseGroup();
      };
    } else if(id==="multiple-comparisons-explorer") {
      title.textContent="Compare discoveries with known simulated truth";
      const text=add("p",null,root,{id:"multiplicity-working"});
      const data=add("div",null,root);
      refresh=()=>{
        if(!latest)return;
        const r=latest.result;
        text.textContent=`Each family has ${r.signals} real effects and ${r.nulls} true nulls. FWER counts families with any false discovery. FDR averages each family's false fraction, including zero when it makes no discoveries. Across this run: ${r.trueDiscoveries} correct discoveries and ${r.discoveries} false discoveries. The table follows the first simulated family.`;
        table(data,["Test","Simulated truth","Raw p","Adjusted p","Decision"],r.firstFamily.map((row,i)=>[
          i+1,row.isNull?"Null true":"Real effect",probability(row.p),probability(row.adjusted),
          row.rejected?(row.isNull?"False discovery":"Correct discovery"):"No discovery",
        ]),"Known truth and test decisions in the first family");
      };
    } else if(id==="chi-squared-explorer") {
      title.textContent="Add the category contributions";
      const view=add("div",null,root);
      const text=add("p",null,root,{id:"chi-working"});
      refresh=()=>{
        if(!latest)return;
        const d=latest;
        table(view,["Category","Observed O","Expected E","(O − E)²/E"],d.observed.map((o,i)=>[
          i+1,o,fixed(d.expected[i]),fixed((o-d.expected[i])**2/d.expected[i]),
        ]),"Contributions that add to χ²");
        text.textContent=`The contributions sum to χ² = ${fixed(d.result.statistic)}. Cohen's w = √(χ²/N) = ${fixed(d.result.w)}. Holding the departure control fixed preserves underlying proportions as N changes; whole-number rounding can cause small differences.`;
      };
    } else if(id==="power-explorer") {
      title.textContent="Separate false positives from missed effects";
      const text=add("p",null,root,{id:"power-working"});
      refresh=()=>{
        if(!latest)return;
        const d=latest;
        text.textContent=d.d===0
          ? `Here the null is true. Rejecting it occurs with probability ${fixed(d.result.power*100,1)}%, a Type I error. Non-rejection occurs with probability ${fixed(d.result.nonRejection*100,1)}%, a correct decision. Type II error does not apply at the true null.`
          : d.result.beta===null ? "The specified true effect is outside the chosen directional alternative. The curve still gives its rejection probability, but non-rejection is not labelled Type II error for that alternative."
          : `At the specified true alternative, power is ${fixed(d.result.power*100,1)}% and the missed-effect probability β is ${fixed(d.result.beta*100,1)}%. Changing n moves the alternative z distribution by d√n while its standard deviation remains 1.`;
      };
    } else {
      title.textContent="Read the distribution as a model";
      add("p",content.plain,root);
      add("p",meta.question+" "+meta.answer,root);
    }
    refresh();
  });
})();
