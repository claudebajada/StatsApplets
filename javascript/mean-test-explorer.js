// Shared rendering for one-sample z/t and equal-variance independent t tests.
function initMeanTest({ independent = false, knownSigma = false } = {}) {
  document.addEventListener('DOMContentLoaded', () => {
    const get = id => document.getElementById(id);
    const number = id => Number(get(id).value);
    const alternative = get('alternative');
    const isT = !knownSigma, statisticName = isT ? 't' : 'z';
    const chart = (id, labels) => initializeChart(get(id).getContext('2d'), {
      type: 'line', data: { datasets: labels.map((label, i) => lineDataset(label, [], i ? '#b24632' : '#2456a6')) },
      options: chartOptions({ type: 'linear', title: { display: true, text: 'Value' } },
        { beginAtZero: true, title: { display: true, text: 'Probability density' } })
    });
    const modelChart = chart('populationChart', independent ? ['Normal model for group 1', 'Normal model for group 2'] : ['Illustrative normal model']);
    const uncertaintyChart = chart('stderrChart', ['Uncertainty curve centred on observed difference']);
    const nullChart = chart(isT ? 'tChart' : 'zChart', ['Null sampling distribution', 'Selected p-value region', 'Observed statistic']);
    nullChart.data.datasets[1].fill = 'origin';
    nullChart.data.datasets[1].backgroundColor = '#b2463266';
    nullChart.data.datasets[2].borderColor = '#522d80';
    nullChart.data.datasets[2].borderDash = [6, 4];
    function update() {
      const sd = number('sigma'), n = number(independent ? 'N1' : 'N');
      const mean1 = number(independent ? 'mu1' : 'mu');
      const mean2 = number(independent ? 'mu2' : 'mu0');
      const result = independent
        ? StatsMath.independentSamples(mean1, mean2, sd, n, number('N2'))
        : StatsMath.oneSample(mean1, mean2, sd, n, knownSigma);
      const { statistic, se, df, tails } = result;
      const direction = alternative.value;
      for (const id of independent ? ['mu1', 'mu2', 'sigma', 'N1', 'N2'] : ['mu', 'mu0', 'sigma', 'N']) {
        get(id + '-value').textContent = get(id).value;
      }
      get('cohen-d-value').textContent = result.d.toFixed(2);
      if (isT) get('df-value').textContent = df;
      get(statisticName + '-value').textContent = statistic.toFixed(4);
      get(independent ? 'one-tailed-p-value' : 'p-value-one-sided').textContent = formatProbability(tails.upper);
      get(independent ? 'two-tailed-p-value' : 'p-value-two-sided').textContent = formatProbability(tails.twoSided);
      get('p-value-lower').textContent = formatProbability(tails.lower);
      get('p-value-selected').textContent = formatProbability(tails[direction]);
      get('calculation').textContent = `${statisticName} = (${mean1.toFixed(2)} − ${mean2.toFixed(2)}) / ${se.toFixed(4)} = ${statistic.toFixed(4)}; ${isT ? 'estimated ' : ''}SE = ${se.toFixed(4)}${isT ? `; df = ${df}` : ''}. Shading shows the selected alternative's p-value under H₀.`;
      const modelMin = Math.min(mean1, ...(independent ? [mean2] : [])) - 4 * sd;
      const modelMax = Math.max(mean1, ...(independent ? [mean2] : [])) + 4 * sd;
      modelChart.data.datasets.forEach((dataset, i) => {
        dataset.data = curvePoints(modelMin, modelMax, x => normalDensity(x, i ? mean2 : mean1, sd));
      });
      modelChart.update();
      const difference = mean1 - mean2;
      const uncertaintyPDF = x => isT ? jStat.studentt.pdf((x - difference) / se, df) / se : normalDensity(x, difference, se);
      uncertaintyChart.data.datasets[0].data = curvePoints(difference - 5 * se, difference + 5 * se, uncertaintyPDF);
      uncertaintyChart.data.datasets[0].label = isT ? `t uncertainty curve (df = ${df})` : 'Normal model at observed difference';
      uncertaintyChart.update();
      const pdf = x => isT ? jStat.studentt.pdf(x, df) : normalDensity(x, 0, 1);
      const extent = Math.max(5, Math.abs(statistic) * 1.1);
      // Include the peak and tail boundaries exactly, even for very large statistics.
      const coordinates = new Set(curvePoints(-extent, extent, pdf).map(p => p.x));
      curvePoints(-5, 5, pdf).forEach(p => coordinates.add(p.x));
      coordinates.add(statistic); coordinates.add(-statistic);
      const points = [...coordinates].sort((a, b) => a - b).map(x => ({ x, y: pdf(x) }));
      nullChart.data.datasets[0].data = points;
      nullChart.data.datasets[0].label = isT ? `H₀: Student's t, df = ${df}` : 'H₀: standard normal Z';
      nullChart.data.datasets[1].data = points.map(p => ({ x: p.x, y:
        (direction === 'upper' ? p.x >= statistic : direction === 'lower' ? p.x <= statistic : Math.abs(p.x) >= Math.abs(statistic)) ? p.y : null }));
      nullChart.data.datasets[1].label = `p-value region (${alternative.selectedOptions[0].textContent})`;
      nullChart.data.datasets[2].data = [{ x: statistic, y: 0 }, { x: statistic, y: pdf(0) }];
      nullChart.data.datasets[2].label = `Observed ${statisticName} = ${statistic.toFixed(3)}`;
      nullChart.options.scales.x.title.text = statisticName + ' statistic';
      nullChart.options.scales.x.min = -extent;
      nullChart.options.scales.x.max = extent;
      // Datasets contain {x,y} objects: only numeric y values enter the maximum.
      nullChart.options.scales.y.max = Math.max(...points.map(p => p.y)) * 1.1;
      nullChart.update();
    }
    document.querySelectorAll('input[type="range"]').forEach(slider => slider.addEventListener('input', update));
    alternative.addEventListener('change', update);
    update();
  });
}
