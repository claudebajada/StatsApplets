/* One worked comparison per concept, shared by all learners. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.LearningContent = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, () => ({
  "one-sample-z-test": {
    role: "Observed summary; population SD assumed known",
    question:
      "How far is this sample mean from the reference value, relative to its uncertainty?",
    plain:
      "SD describes differences between individual observations. SE describes variation of the estimated mean or mean difference between repeated studies. These controls set summary statistics; changing n does not recruit or resample participants.",
    related: ["clt-explorer", "confidence-interval-explorer", "power-explorer"],
    keywords:
      "compare two groups average difference significance treatment control standard error mean",
    experiment: {
      heading: "What changes when the population SD is known?",
      story:
        "Use an invented blood-pressure study with a mean reduction of 3 mmHg. Here we assume the population SD is known to be 6 mmHg; the z test relies on that assumption.",
      instruction:
        "Keep the mean reduction and known SD fixed. Compare 25 with 100 people and watch the standard error change.",
      action: "Compare with 100 people",
      baseline: {
        mu: 3,
        mu0: 0,
        sigma: 6,
        N: 25,
        alternative: "twoSided",
        lockScale: true,
      },
      change: {
        N: 100,
      },
      axes: {
        meanEstimateChart: {
          x: "Blood-pressure reduction (mmHg)",
        },
      },
    },
  },
  "one-sample-t-test": {
    role: "Observed sample summaries",
    question:
      "How far is this sample mean from the reference value, relative to its uncertainty?",
    plain:
      "SD describes differences between individual observations. SE describes variation of the estimated mean or mean difference between repeated studies. These controls set summary statistics; changing n does not recruit or resample participants.",
    related: ["clt-explorer", "confidence-interval-explorer", "power-explorer"],
    keywords:
      "compare two groups average difference significance treatment control standard error mean",
    experiment: {
      heading: "Increase the sample size",
      story:
        "An invented blood-pressure study has 25 people, a mean reduction of 3 mmHg and a sample SD of 6 mmHg. Test a population mean reduction of zero.",
      instruction:
        "Keep the mean and SD fixed. Compare 25 with 100 people. The uncertainty bars shrink while the estimated reduction stays at 3 mmHg.",
      action: "Compare with 100 people",
      baseline: {
        mu: 3,
        mu0: 0,
        sigma: 6,
        N: 25,
        alternative: "twoSided",
        lockScale: true,
      },
      change: {
        N: 100,
      },
      axes: {
        meanEstimateChart: {
          x: "Blood-pressure reduction (mmHg)",
        },
      },
    },
  },
  "independent-samples-t-test": {
    role: "Observed sample summaries",
    question:
      "How large is the difference between two independent groups, relative to its uncertainty?",
    plain:
      "SD describes differences between individual observations. SE describes variation of the estimated mean or mean difference between repeated studies. These controls set summary statistics; changing n does not recruit or resample participants.",
    related: ["clt-explorer", "confidence-interval-explorer", "power-explorer"],
    keywords:
      "compare two groups average difference significance treatment control standard error mean",
    experiment: {
      heading: "A difference between groups has uncertainty too",
      story:
        "Two separate groups of 25 people have mean blood-pressure reductions of 6 and 3 mmHg. Both sample SDs are 6 mmHg. The estimated difference is therefore 3 mmHg.",
      instruction:
        "Keep both means and SDs fixed. Increase each group to 100 people and compare the uncertainty of the same difference.",
      action: "Use 100 people in each group",
      baseline: {
        mu1: 6,
        mu2: 3,
        sigma: 6,
        N1: 25,
        N2: 25,
        alternative: "twoSided",
        lockScale: true,
      },
      change: {
        N1: 100,
        N2: 100,
      },
      axes: {
        meanEstimateChart: {
          x: "Difference in blood-pressure reduction (mmHg)",
        },
      },
    },
  },
  "binomial-components-explorer": {
    role: "Constructed independent trials",
    question:
      "Why do several success/failure arrangements contribute to the same success count?",
    plain:
      "One success/failure sequence is one outcome. A count can represent many sequences. Multiply the number of sequences by the probability of each sequence.",
    related: ["binomial-normal-explorer"],
    keywords: "combinations arrangements successes count probability",
    experiment: {
      heading: "One count can happen in several orders",
      story:
        "Toss a fair coin three times. Call a head a success. Three successes can occur in only one order: SSS.",
      instruction:
        "Compare three successes with two. Each particular sequence still has probability 1/8, but two successes can occur as SSF, SFS or FSS.",
      action: "Count exactly two successes",
      baseline: {
        n: 3,
        p: 0.5,
        k: 3,
      },
      change: {
        k: 2,
      },
      axes: {},
    },
  },
  "binomial-normal-explorer": {
    role: "Specified population probability",
    question:
      "When can a smooth normal curve approximate a whole-number success count?",
    plain:
      "A bar gives the probability of one count. A continuous density gives probability through an interval's area. The selected count connects those two representations.",
    related: ["binomial-components-explorer", "clt-explorer"],
    keywords:
      "successes trials probability approximation continuity correction rare",
    experiment: {
      heading: "Can an area stand in for a bar?",
      story:
        "Suppose an independent event has probability 0.05 on each trial. With 30 trials, the expected number of successes is only 1.5, so a symmetric normal curve is a poor match.",
      instruction:
        "Increase to 500 trials. Inspect the expected count, 25, and compare its exact bar probability with the normal area from 24.5 to 25.5.",
      action: "Compare with 500 trials",
      baseline: {
        N: 30,
        theta: 0.05,
        k: 2,
      },
      change: {
        N: 500,
        k: 25,
      },
      axes: {},
    },
  },
  "t-distribution-explorer": {
    role: "Repeated samples from a normal population",
    question:
      "Why does estimating SD produce more extreme standardised scores?",
    plain:
      "The population SD is fixed at 1 in the sampling experiment. A sample SD can be smaller or larger. Dividing by an underestimated SD stretches the magnitude of the t score.",
    related: ["one-sample-t-test", "clt-explorer"],
    keywords: "student t degrees freedom tails estimate standard deviation",
    experiment: {
      heading: "Estimating SD adds uncertainty",
      story:
        "A t score divides by a sample SD. In a small sample, that SD can underestimate the population spread and inflate the score. The heavier tails account for this extra uncertainty.",
      instruction:
        "Compare five observations (4 degrees of freedom) with 101 observations (100 degrees of freedom). Watch the t curve approach the normal curve.",
      action: "Use 101 observations",
      baseline: {
        "df-slider": 4,
      },
      change: {
        "df-slider": 100,
      },
      axes: {},
    },
  },
  "f-distribution-explorer": {
    role: "Reference distribution under a null model",
    question:
      "How unusual would a ratio of variability estimates be under the null?",
    plain:
      "F is a non-negative ratio. Its numerator and denominator degrees of freedom both affect its reference distribution. The 5% boundary is calculated from the full tail.",
    related: ["anova-explorer", "t-distribution-explorer"],
    keywords: "variance ratio critical value anova",
    experiment: {
      heading: "A noisy denominator makes a long tail",
      story:
        "F compares two variability estimates. A denominator estimated with few degrees of freedom can be unusually small, making the ratio unusually large.",
      instruction:
        "Keep the numerator degrees of freedom at 2. Improve the denominator estimate from 6 to 60 degrees of freedom and watch the upper 5% boundary.",
      action: "Increase denominator df to 60",
      baseline: {
        "df1-slider": 2,
        "df2-slider": 6,
        "log-axis": false,
      },
      change: {
        "df2-slider": 60,
      },
      axes: {},
    },
  },
  "chi-squared-explorer": {
    role: "Constructed category proportions",
    question:
      "How far do observed category proportions depart from an equal-probability model?",
    plain:
      "The departure control fixes proportions before integer rounding. Increasing N scales those proportions, allowing a comparison at approximately fixed effect size.",
    related: ["binomial-components-explorer", "multiple-comparisons-explorer"],
    keywords: "counts categories categorical goodness fit equal frequencies",
    experiment: {
      heading: "The same proportions can be stronger evidence",
      story:
        "Under the null, five outcome categories are equally common. Our constructed observations have proportions 0%, 10%, 20%, 30% and 40%.",
      instruction:
        "Multiply the total count by ten without changing those proportions. Compare the effect size with the chi-squared statistic and p-value.",
      action: "Increase the total from 100 to 1,000",
      baseline: {
        categories: 5,
        "total-observations": 100,
        skew: 10,
      },
      change: {
        "total-observations": 1000,
      },
      axes: {},
    },
  },
  "clt-explorer": {
    role: "Specified population; repeated random samples",
    question:
      "Why can an average be more stable than an individual observation?",
    plain:
      "n is the number of observations within each study. Repetitions is how many studies we simulate. More repetitions make the displayed sampling distribution more stable; they do not reduce a study's theoretical SE.",
    related: ["confidence-interval-explorer", "one-sample-t-test"],
    keywords:
      "sampling average means standard error central limit repeated studies",
    experiment: {
      heading: "Average observations, then repeat the study",
      story:
        "The population is right-skewed, with mean 0 and SD 1 in standardised units. Begin with 1,000 studies containing just one observation each.",
      instruction:
        "Keep the same population and 1,000 repeated studies. Average 25 observations in each study: the means become less spread out even though individuals do not.",
      action: "Average 25 observations per study",
      baseline: {
        population: "exponential",
        sampleSize: 1,
        repetitions: 1000,
        traceMode: false,
        traceCount: 1000,
        lockScale: true,
        seed: 42,
      },
      change: {
        sampleSize: 25,
      },
      axes: {},
    },
  },
  "confidence-interval-explorer": {
    role: "Known simulated truth; estimated intervals",
    question:
      "What varies across studies: the population mean or the interval?",
    plain:
      "The population mean is fixed in this experiment. Each study supplies a new sample mean, estimated SD and interval. Coverage describes the repeated procedure.",
    related: ["clt-explorer", "one-sample-t-test", "power-explorer"],
    keywords:
      "confidence uncertainty precision interval coverage estimate mean",
    experiment: {
      heading: "Higher confidence produces wider intervals",
      story:
        "Repeat a study of 20 observations from a normal population with fixed mean 0 and SD 1. Each sample produces a different t interval.",
      instruction:
        "Keep the generated samples identical and raise confidence from 95% to 99%. Compare the interval widths and coverage.",
      action: "Raise confidence to 99%",
      baseline: {
        populationMean: 0,
        populationSD: 1,
        sampleSize: 20,
        repetitions: 500,
        level: 0.95,
        method: "t",
        seed: 42,
        lockScale: true,
      },
      change: {
        level: 0.99,
      },
      axes: {},
    },
  },
  "power-explorer": {
    role: "Assumed true population effect",
    question: "How often would a planned test detect a specified true effect?",
    plain:
      "This is prospective power for a known-SD z test. The effect is an assumed population difference, rather than a sample effect estimated after a study.",
    related: [
      "one-sample-z-test",
      "confidence-interval-explorer",
      "multiple-comparisons-explorer",
    ],
    keywords: "sample size planning detect effect power false negative",
    experiment: {
      heading: "Compare power at two sample sizes",
      story:
        "Imagine planning a study where the true mean is half a population SD above the null value (d = 0.5). This is an assumed true effect, not an effect estimated after seeing data.",
      instruction:
        "Keep the effect and 5% significance level fixed. Compare studies with 20 and 80 observations; look for the alternative distribution inside the rejection regions.",
      action: "Compare with 80 observations",
      baseline: {
        sampleSize: 20,
        effect: 0.5,
        alpha: 0.05,
        alternative: "twoSided",
      },
      change: {
        sampleSize: 80,
      },
      axes: {},
    },
  },
  correlation: {
    role: "Constructed example or observed paired values",
    question: "Do two variables tend to deviate from their means together?",
    plain:
      "Each point is one paired observation. Centring puts the mean at zero. Products of matching deviations show whether a point supports a positive or negative association.",
    related: ["regression-explorer"],
    keywords:
      "association relationship pearson covariance scatter plot outlier",
    experiment: {
      heading: "A curved relationship with zero correlation",
      story:
        "Start with five pairs lying on y = x. Every increase in x is matched by an increase in y, so Pearson's r is 1.",
      instruction:
        "Replace y with x². The relationship is still exact, but upward and downward contributions cancel. Follow the centred products below to see why r becomes zero.",
      action: "Replace y with x²",
      baseline: {
        dataMode: "manual",
        pairs: "-2,-2\n-1,-1\n0,0\n1,1\n2,2",
      },
      change: {
        pairs: "-2,4\n-1,1\n0,0\n1,1\n2,4",
      },
      axes: {},
    },
  },
  "regression-explorer": {
    role: "Simulated or observed paired values",
    question:
      "Which straight line makes the squared vertical prediction errors smallest?",
    plain:
      "A residual is observed y minus predicted y. Squaring makes both signs contribute positive error. The fitted line minimises the sum of those squared errors.",
    related: ["correlation", "anova-explorer"],
    keywords: "predict prediction line fit slope residual least squares",
    experiment: {
      heading: "Choose a line by the errors it leaves",
      story:
        "For these five observations, begin by predicting y = 3 for everyone. A residual is the observed value minus this prediction. Squaring and adding those residuals gives the total error.",
      instruction:
        "Compare the horizontal line with the least-squares line. Follow the residual segments and squared-error areas as the total error falls.",
      action: "Show the least-squares line",
      baseline: {
        dataMode: "manual",
        pairs: "1,1\n2,3\n3,2\n4,5\n5,4",
        tryLine: true,
        candidateSlope: 0,
        candidateIntercept: 3,
        revealFit: false,
      },
      change: {
        candidateSlope: 0.8,
        candidateIntercept: 0.6,
        revealFit: true,
      },
      axes: {},
    },
  },
  "anova-explorer": {
    role: "Simulated groups or observed group values",
    question:
      "Are group means separated relative to the variation within groups?",
    plain:
      "Group differences can coexist with noisy individual observations. ANOVA partitions total squared deviations into within-group and between-group contributions.",
    related: [
      "f-distribution-explorer",
      "independent-samples-t-test",
      "multiple-comparisons-explorer",
    ],
    keywords: "compare three groups variance analysis omnibus sums squares",
    experiment: {
      heading: "Separated means are only half the story",
      story:
        "Three groups have means 2, 3 and 5. ANOVA compares their separation with the variability of observations inside each group.",
      instruction:
        "Keep all three means fixed but triple every deviation from its group mean. Watch within-group variation grow and the F statistic fall.",
      action: "Increase within-group spread",
      baseline: {
        dataMode: "manual",
        groups: "1,2,3\n2,3,4\n4,5,6",
      },
      change: {
        groups: "-1,2,5\n0,3,6\n2,5,8",
      },
      axes: {},
    },
  },
  "multiple-comparisons-explorer": {
    role: "Simulated independent hypotheses with known truth",
    question:
      "How does a testing procedure trade discoveries against different false-positive targets?",
    plain:
      "FWER is the chance of at least one false rejection. FDR is the average false fraction among discoveries, with zero assigned to families with no discoveries. Real effects make these targets differ.",
    related: ["power-explorer", "anova-explorer"],
    keywords:
      "many tests multiplicity false positives bonferroni holm fdr fwer benjamini hochberg",
    experiment: {
      heading: "Two different meanings of a false-positive target",
      story:
        "Simulate 20 independent tests: six effects are real and fourteen nulls are true. Because this is a simulation, we can check each discovery against the truth.",
      instruction:
        "Compare Benjamini–Hochberg with Bonferroni on the same simulated tests. Read both the chance of any false discovery (FWER) and the average false fraction among discoveries (FDR).",
      action: "Use Bonferroni instead",
      baseline: {
        tests: 20,
        repetitions: 1000,
        alpha: 0.05,
        signalFraction: 0.3,
        signalEffect: 0.5,
        signalN: 30,
        correction: "bh",
        seed: 42,
      },
      change: {
        correction: "bonferroni",
      },
      axes: {},
    },
  },
}));
