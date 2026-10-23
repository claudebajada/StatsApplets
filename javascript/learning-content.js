/* Learning routes, fictional research contexts and prediction experiments. */
(function(root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.LearningContent = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, () => ({
  "one-sample-z-test": {
    "role": "Observed summary; population SD assumed known",
    "question": "How far is this sample mean from the reference value, relative to its uncertainty?",
    "plain": "SD describes differences between individual observations. SE describes variation of the estimated mean or mean difference between repeated studies. These controls set summary statistics; changing n does not recruit or resample participants.",
    "related": [
      "clt-explorer",
      "confidence-interval-explorer",
      "power-explorer"
    ],
    "keywords": "compare two groups average difference significance treatment control standard error mean",
    "cases": {
      "medicine": {
        "title": "Fictional blood-pressure study",
        "text": "A fictional sample has a mean blood-pressure reduction of 3 mmHg and SD 6 mmHg. Compare its mean with a reference reduction of zero. This example alone cannot attribute a change to treatment.",
        "settings": {
          "mu": 3,
          "mu0": 0,
          "sigma": 6,
          "N": 25,
          "alternative": "twoSided"
        }
      },
      "cognition": {
        "title": "Fictional reaction-time study",
        "text": "A fictional sample improves its reaction time by 6 ms on average, with SD 12 ms. Compare the mean improvement with zero. In the z version, imagine that 12 ms is known from the population model.",
        "settings": {
          "mu": 6,
          "mu0": 0,
          "sigma": 12,
          "N": 25,
          "alternative": "twoSided"
        }
      }
    },
    "prediction": {
      "prompt": "Keep the mean difference and SD fixed. What happens to SE when every sample size grows from 25 to 100?",
      "options": [
        "It halves",
        "It quarters",
        "It stays the same"
      ],
      "answer": 0,
      "explanation": "SE contains 1/√n. Four times as many observations gives twice the denominator, so SE halves. The mean difference and standardised effect stay fixed.",
      "setup": {
        "mu": 0.5,
        "mu0": 0,
        "sigma": 1,
        "N": 25
      },
      "change": {
        "N": 100
      }
    }
  },
  "one-sample-t-test": {
    "role": "Observed sample summaries",
    "question": "How far is this sample mean from the reference value, relative to its uncertainty?",
    "plain": "SD describes differences between individual observations. SE describes variation of the estimated mean or mean difference between repeated studies. These controls set summary statistics; changing n does not recruit or resample participants.",
    "related": [
      "clt-explorer",
      "confidence-interval-explorer",
      "power-explorer"
    ],
    "keywords": "compare two groups average difference significance treatment control standard error mean",
    "cases": {
      "medicine": {
        "title": "Fictional blood-pressure study",
        "text": "A fictional sample has a mean blood-pressure reduction of 3 mmHg and SD 6 mmHg. Compare its mean with a reference reduction of zero. This example alone cannot attribute a change to treatment.",
        "settings": {
          "mu": 3,
          "mu0": 0,
          "sigma": 6,
          "N": 25,
          "alternative": "twoSided"
        }
      },
      "cognition": {
        "title": "Fictional reaction-time study",
        "text": "A fictional sample improves its reaction time by 6 ms on average, with SD 12 ms. Compare the mean improvement with zero. In the z version, imagine that 12 ms is known from the population model.",
        "settings": {
          "mu": 6,
          "mu0": 0,
          "sigma": 12,
          "N": 25,
          "alternative": "twoSided"
        }
      }
    },
    "prediction": {
      "prompt": "Keep the mean difference and SD fixed. What happens to SE when every sample size grows from 25 to 100?",
      "options": [
        "It halves",
        "It quarters",
        "It stays the same"
      ],
      "answer": 0,
      "explanation": "SE contains 1/√n. Four times as many observations gives twice the denominator, so SE halves. The mean difference and standardised effect stay fixed.",
      "setup": {
        "mu": 0.5,
        "mu0": 0,
        "sigma": 1,
        "N": 25
      },
      "change": {
        "N": 100
      }
    }
  },
  "independent-samples-t-test": {
    "role": "Observed sample summaries",
    "question": "How large is the difference between two independent groups, relative to its uncertainty?",
    "plain": "SD describes differences between individual observations. SE describes variation of the estimated mean or mean difference between repeated studies. These controls set summary statistics; changing n does not recruit or resample participants.",
    "related": [
      "clt-explorer",
      "confidence-interval-explorer",
      "power-explorer"
    ],
    "keywords": "compare two groups average difference significance treatment control standard error mean",
    "cases": {
      "medicine": {
        "title": "Fictional blood-pressure study",
        "text": "Different participants receive two interventions. Their mean reductions are 6 and 3 mmHg, with SD 6 mmHg in each sample. Compare the 3 mmHg difference with its uncertainty. These numbers are invented for teaching.",
        "settings": {
          "mu1": 6,
          "mu2": 3,
          "sigma": 6,
          "N1": 25,
          "N2": 25,
          "alternative": "twoSided"
        }
      },
      "cognition": {
        "title": "Fictional reaction-time study",
        "text": "Two separate participant groups improve their reaction time by 6 and 3 ms on average, each with sample SD 6 ms. A within-participant experiment would require a paired analysis.",
        "settings": {
          "mu1": 6,
          "mu2": 3,
          "sigma": 6,
          "N1": 25,
          "N2": 25,
          "alternative": "twoSided"
        }
      }
    },
    "prediction": {
      "prompt": "Keep the mean difference and SD fixed. What happens to SE when every sample size grows from 25 to 100?",
      "options": [
        "It halves",
        "It quarters",
        "It stays the same"
      ],
      "answer": 0,
      "explanation": "SE contains 1/√n. Four times as many observations gives twice the denominator, so SE halves. The mean difference and standardised effect stay fixed.",
      "setup": {
        "mu1": 0.5,
        "mu2": 0,
        "sigma": 1,
        "N1": 25,
        "N2": 25
      },
      "change": {
        "N1": 100,
        "N2": 100
      }
    }
  },
  "binomial-components-explorer": {
    "role": "Constructed independent trials",
    "question": "Why do several success/failure arrangements contribute to the same success count?",
    "plain": "One success/failure sequence is one outcome. A count can represent many sequences. Multiply the number of sequences by the probability of each sequence.",
    "related": [
      "binomial-normal-explorer"
    ],
    "keywords": "combinations arrangements successes count probability",
    "cases": {
      "medicine": {
        "title": "Three fictional treatment responses",
        "text": "Suppose three independent patients each have a hypothetical response probability of 0.5. Exactly two responses can occur as SSF, SFS or FSS. This is a probability model, not an estimate of any treatment's effectiveness.",
        "settings": {
          "n": 3,
          "p": 0.5,
          "k": 2
        }
      },
      "cognition": {
        "title": "Three recognition trials",
        "text": "A hypothetical participant independently recognises each of three items with probability 0.5. Exactly two correct responses can occur in three orders.",
        "settings": {
          "n": 3,
          "p": 0.5,
          "k": 2
        }
      }
    },
    "prediction": {
      "prompt": "With three independent trials at p = 0.5, what is the probability of exactly two successes?",
      "options": [
        "1/8",
        "3/8",
        "2/3"
      ],
      "answer": 1,
      "explanation": "The three arrangements SSF, SFS and FSS each have probability 1/8. Adding their probabilities gives 3/8.",
      "setup": {
        "n": 3,
        "p": 0.5,
        "k": 1
      },
      "change": {
        "k": 2
      }
    }
  },
  "binomial-normal-explorer": {
    "role": "Specified population probability",
    "question": "When can a smooth normal curve approximate a whole-number success count?",
    "plain": "A bar gives the probability of one count. A continuous density gives probability through an interval's area. The selected count connects those two representations.",
    "related": [
      "binomial-components-explorer",
      "clt-explorer"
    ],
    "keywords": "successes trials probability approximation continuity correction rare",
    "cases": {
      "medicine": {
        "title": "Counting hypothetical responses",
        "text": "Suppose each of 100 independent participants has response probability 0.1. Inspect the chance of exactly ten responses and the continuity-corrected normal approximation.",
        "settings": {
          "N": 100,
          "theta": 0.1,
          "k": 10
        }
      },
      "cognition": {
        "title": "Counting correct recognition responses",
        "text": "Suppose 30 recognition trials are independent with success probability 0.7. Compare the probability of exactly 21 correct responses with a normal approximation.",
        "settings": {
          "N": 30,
          "theta": 0.7,
          "k": 21
        }
      }
    },
    "prediction": {
      "prompt": "Keep a rare success probability at 0.05. What usually happens to the normal approximation as n grows from 30 to 500?",
      "options": [
        "It improves as both expected counts grow",
        "It becomes exact",
        "It must deteriorate"
      ],
      "answer": 0,
      "explanation": "The distribution remains discrete, but np grows from 1.5 to 25. The normal approximation becomes more useful; it does not become exact.",
      "setup": {
        "N": 30,
        "theta": 0.05,
        "k": 2
      },
      "change": {
        "N": 500,
        "k": 25
      }
    }
  },
  "t-distribution-explorer": {
    "role": "Repeated samples from a normal population",
    "question": "Why does estimating SD produce more extreme standardised scores?",
    "plain": "The population SD is fixed at 1 in the sampling experiment. A sample SD can be smaller or larger. Dividing by an underestimated SD stretches the magnitude of the t score.",
    "related": [
      "one-sample-t-test",
      "clt-explorer"
    ],
    "keywords": "student t degrees freedom tails estimate standard deviation",
    "cases": {
      "medicine": {
        "title": "Uncertainty in a small clinical sample",
        "text": "Imagine repeated independent normal samples of a standardised physiological measurement. With n = 5, only four deviations can vary freely once their sum is fixed at zero.",
        "settings": {
          "df-slider": 4
        }
      },
      "cognition": {
        "title": "Small cognitive experiment",
        "text": "Repeat a study of a normally distributed standardised cognitive score with five participants. Compare scores using known population SD with scores using each sample's estimated SD.",
        "settings": {
          "df-slider": 4
        }
      }
    },
    "prediction": {
      "prompt": "As degrees of freedom increase from 4 to 100, what happens to the t distribution?",
      "options": [
        "It approaches the standard normal",
        "Its tails get heavier",
        "It shifts to the right"
      ],
      "answer": 0,
      "explanation": "Larger samples estimate SD more consistently. The extra tail probability diminishes and the t curve approaches the standard normal.",
      "setup": {
        "df-slider": 4
      },
      "change": {
        "df-slider": 100
      }
    }
  },
  "f-distribution-explorer": {
    "role": "Reference distribution under a null model",
    "question": "How unusual would a ratio of variability estimates be under the null?",
    "plain": "F is a non-negative ratio. Its numerator and denominator degrees of freedom both affect its reference distribution. The 5% boundary is calculated from the full tail.",
    "related": [
      "anova-explorer",
      "t-distribution-explorer"
    ],
    "keywords": "variance ratio critical value anova",
    "cases": {
      "medicine": {
        "title": "Comparing three fictional clinical groups",
        "text": "For three independent groups with ten participants each, the ANOVA reference distribution has numerator df = 2 and denominator df = 27.",
        "settings": {
          "df1-slider": 2,
          "df2-slider": 27,
          "log-axis": false
        }
      },
      "cognition": {
        "title": "Comparing three cognitive-training groups",
        "text": "Three separate groups of ten participants give ANOVA degrees of freedom 2 and 27. This page explores the reference distribution, rather than observed study results.",
        "settings": {
          "df1-slider": 2,
          "df2-slider": 27,
          "log-axis": false
        }
      }
    },
    "prediction": {
      "prompt": "Switch to a logarithmic horizontal axis. Does that change the critical F value?",
      "options": [
        "No",
        "Yes, it doubles",
        "Yes, it becomes a p-value"
      ],
      "answer": 0,
      "explanation": "Only the display spacing changes. Ordinary shaded screen area no longer measures probability on a log axis, so the tail fill is removed.",
      "setup": {
        "df1-slider": 1,
        "df2-slider": 1,
        "log-axis": false
      },
      "change": {
        "log-axis": true
      }
    }
  },
  "chi-squared-explorer": {
    "role": "Constructed category proportions",
    "question": "How far do observed category proportions depart from an equal-probability model?",
    "plain": "The departure control fixes proportions before integer rounding. Increasing N scales those proportions, allowing a comparison at approximately fixed effect size.",
    "related": [
      "binomial-components-explorer",
      "multiple-comparisons-explorer"
    ],
    "keywords": "counts categories categorical goodness fit equal frequencies",
    "cases": {
      "medicine": {
        "title": "Three hypothetical referral categories",
        "text": "Suppose a study expects equal numbers in three pre-specified referral categories. Compare constructed counts with that uniform expectation. These are invented counts, not sampled records.",
        "settings": {
          "categories": 3,
          "total-observations": 120,
          "skew": 5
        }
      },
      "cognition": {
        "title": "Three response options",
        "text": "Under an equal-probability model, three response options should be chosen equally often in repeated independent trials. Explore a fixed proportional departure.",
        "settings": {
          "categories": 3,
          "total-observations": 120,
          "skew": 5
        }
      }
    },
    "prediction": {
      "prompt": "Multiply N by ten while holding the category proportions fixed. What happens to Cohen's w?",
      "options": [
        "It stays approximately the same",
        "It falls tenfold",
        "It increases tenfold"
      ],
      "answer": 0,
      "explanation": "w measures departure in proportions. Apart from integer rounding it stays fixed, while χ² = Nw² grows with N.",
      "setup": {
        "categories": 5,
        "total-observations": 100,
        "skew": 10
      },
      "change": {
        "total-observations": 1000
      }
    }
  },
  "clt-explorer": {
    "role": "Specified population; repeated random samples",
    "question": "Why can an average be more stable than an individual observation?",
    "plain": "n is the number of observations within each study. Repetitions is how many studies we simulate. More repetitions make the displayed sampling distribution more stable; they do not reduce a study's theoretical SE.",
    "related": [
      "confidence-interval-explorer",
      "one-sample-t-test"
    ],
    "keywords": "sampling average means standard error central limit repeated studies",
    "cases": {
      "medicine": {
        "title": "Skewed physiological measurements",
        "text": "Imagine a right-skewed measurement standardised to population mean 0 and SD 1. Draw participants for one study, average them, then repeat. The standardised units are not physical measurement units.",
        "settings": {
          "population": "exponential",
          "sampleSize": 10,
          "repetitions": 1000
        }
      },
      "cognition": {
        "title": "Skewed cognitive measurements",
        "text": "Imagine a skewed score such as a transformed response-time measurement. This model is standardised to population mean 0 and SD 1. Each simulated study contributes one average.",
        "settings": {
          "population": "exponential",
          "sampleSize": 10,
          "repetitions": 1000
        }
      }
    },
    "prediction": {
      "prompt": "Keep the population and n = 10 fixed. Increase repeated studies from 100 to 1000. What happens to theoretical SE?",
      "options": [
        "It stays 1/√10",
        "It falls tenfold",
        "It becomes the population SD"
      ],
      "answer": 0,
      "explanation": "Repetitions improve the simulation display. SE is a property of the population and observations per study, σ/√n.",
      "setup": {
        "population": "exponential",
        "sampleSize": 10,
        "repetitions": 100
      },
      "change": {
        "repetitions": 1000
      }
    }
  },
  "confidence-interval-explorer": {
    "role": "Known simulated truth; estimated intervals",
    "question": "What varies across studies: the population mean or the interval?",
    "plain": "The population mean is fixed in this experiment. Each study supplies a new sample mean, estimated SD and interval. Coverage describes the repeated procedure.",
    "related": [
      "clt-explorer",
      "one-sample-t-test",
      "power-explorer"
    ],
    "keywords": "confidence uncertainty precision interval coverage estimate mean",
    "cases": {
      "medicine": {
        "title": "Fictional population mean",
        "text": "Suppose a normally distributed physiological change has true mean 3 measurement units and SD 1. The simulator knows those values; an investigator estimates the mean from each sample.",
        "settings": {
          "populationMean": 3,
          "populationSD": 1,
          "sampleSize": 20,
          "method": "t",
          "level": 0.95
        }
      },
      "cognition": {
        "title": "Fictional cognitive-score improvement",
        "text": "Suppose a normal population has true mean improvement 5 score points and SD 2. Build intervals from independent samples of 20 participants.",
        "settings": {
          "populationMean": 5,
          "populationSD": 2,
          "sampleSize": 20,
          "method": "t",
          "level": 0.95
        }
      }
    },
    "prediction": {
      "prompt": "Using the same samples, raise confidence from 95% to 99%. What happens to interval width?",
      "options": [
        "It increases",
        "It decreases",
        "It must stay fixed"
      ],
      "answer": 0,
      "explanation": "A larger critical value creates wider intervals. The increased long-run coverage comes with less precise intervals.",
      "setup": {
        "level": 0.95,
        "sampleSize": 20,
        "method": "t"
      },
      "change": {
        "level": 0.99
      }
    }
  },
  "power-explorer": {
    "role": "Assumed true population effect",
    "question": "How often would a planned test detect a specified true effect?",
    "plain": "This is prospective power for a known-SD z test. The effect is an assumed population difference, rather than a sample effect estimated after a study.",
    "related": [
      "one-sample-z-test",
      "confidence-interval-explorer",
      "multiple-comparisons-explorer"
    ],
    "keywords": "sample size planning detect effect power false negative",
    "cases": {
      "medicine": {
        "title": "Planning a hypothetical study",
        "text": "Assume a true mean change of 3 units and known population SD 10, so d = 0.3. Explore sample size without changing the assumed effect. This is an illustrative model.",
        "settings": {
          "effect": 0.3,
          "sampleSize": 30,
          "alpha": 0.05,
          "alternative": "twoSided"
        }
      },
      "cognition": {
        "title": "Planning a cognitive experiment",
        "text": "Assume a true reaction-time difference of 15 ms and known population SD 30 ms, so d = 0.5. The calculation concerns a one-sample z test, not a paired or independent t test.",
        "settings": {
          "effect": 0.5,
          "sampleSize": 30,
          "alpha": 0.05,
          "alternative": "twoSided"
        }
      }
    },
    "prediction": {
      "prompt": "Set the true effect to zero with α = 0.05. What is the rejection probability?",
      "options": [
        "5%",
        "95%",
        "0%"
      ],
      "answer": 0,
      "explanation": "At the true null the rejection probability is the Type I error rate α. The 95% non-rejection probability is a correct decision rate, not Type II error.",
      "setup": {
        "effect": 0.5,
        "sampleSize": 30,
        "alpha": 0.05,
        "alternative": "twoSided"
      },
      "change": {
        "effect": 0
      }
    }
  },
  "correlation": {
    "role": "Constructed example or observed paired values",
    "question": "Do two variables tend to deviate from their means together?",
    "plain": "Each point is one paired observation. Centring puts the mean at zero. Products of matching deviations show whether a point supports a positive or negative association.",
    "related": [
      "regression-explorer"
    ],
    "keywords": "association relationship pearson covariance scatter plot outlier",
    "cases": {
      "medicine": {
        "title": "Fictional age and biomarker pairs",
        "text": "The pairs represent age in decades and a biomarker in arbitrary units. They demonstrate association only; the data are invented and cannot establish causation.",
        "settings": {
          "dataMode": "manual",
          "pairs": "2,1\\n3,3\\n4,2\\n5,5\\n6,4"
        }
      },
      "cognition": {
        "title": "Fictional practice and recall scores",
        "text": "Each pair gives practice blocks completed and recall score for a separate hypothetical participant. Inspect deviations around the two means.",
        "settings": {
          "dataMode": "manual",
          "pairs": "1,4\\n2,6\\n3,5\\n4,8\\n5,7"
        }
      }
    },
    "prediction": {
      "prompt": "For the curved pairs x = −2, −1, 0, 1, 2 and y = x², what is Pearson's r?",
      "options": [
        "0, despite a perfect curved relationship",
        "+1",
        "−1"
      ],
      "answer": 0,
      "explanation": "Positive and negative deviation products cancel. Pearson's r measures linear association, so a deterministic curved relationship can have r = 0.",
      "setup": {
        "dataMode": "manual",
        "pairs": "-2,-2\\n-1,-1\\n0,0\\n1,1\\n2,2"
      },
      "change": {
        "pairs": "-2,4\\n-1,1\\n0,0\\n1,1\\n2,4"
      }
    }
  },
  "regression-explorer": {
    "role": "Simulated or observed paired values",
    "question": "Which straight line makes the squared vertical prediction errors smallest?",
    "plain": "A residual is observed y minus predicted y. Squaring makes both signs contribute positive error. The fitted line minimises the sum of those squared errors.",
    "related": [
      "correlation",
      "anova-explorer"
    ],
    "keywords": "predict prediction line fit slope residual least squares",
    "cases": {
      "medicine": {
        "title": "Fictional age and biomarker data",
        "text": "Age in decades is x and an invented biomarker in arbitrary units is y. Fit a descriptive line, then inspect what it misses. The example supplies no causal or clinical evidence.",
        "settings": {
          "dataMode": "manual",
          "pairs": "2,1\\n3,3\\n4,2\\n5,5\\n6,4"
        }
      },
      "cognition": {
        "title": "Fictional practice and recall data",
        "text": "x is practice blocks and y is recall score for hypothetical separate participants. Try your own line, then reveal the least-squares solution.",
        "settings": {
          "dataMode": "manual",
          "pairs": "1,4\\n2,6\\n3,5\\n4,8\\n5,7"
        }
      }
    },
    "prediction": {
      "prompt": "Can a curved relationship leave a pattern in the residuals even when a straight line has been fitted?",
      "options": [
        "Yes",
        "No, residuals must always be random",
        "Only if the slope is zero"
      ],
      "answer": 0,
      "explanation": "Least squares removes the fitted linear trend. It does not remove curvature or guarantee an appropriate model.",
      "setup": {
        "dataMode": "manual",
        "pairs": "-2,-2\\n-1,-1\\n0,0\\n1,1\\n2,2"
      },
      "change": {
        "pairs": "-2,4\\n-1,1\\n0,0\\n1,1\\n2,4"
      }
    }
  },
  "anova-explorer": {
    "role": "Simulated groups or observed group values",
    "question": "Are group means separated relative to the variation within groups?",
    "plain": "Group differences can coexist with noisy individual observations. ANOVA partitions total squared deviations into within-group and between-group contributions.",
    "related": [
      "f-distribution-explorer",
      "independent-samples-t-test",
      "multiple-comparisons-explorer"
    ],
    "keywords": "compare three groups variance analysis omnibus sums squares",
    "cases": {
      "medicine": {
        "title": "Three fictional independent clinical groups",
        "text": "The invented observations are measurement changes in three separate groups. Compare group means with the grand mean and inspect how each group's sample size weights its contribution.",
        "settings": {
          "dataMode": "manual",
          "groups": "1,2,3\\n2,3,4\\n4,5,6"
        }
      },
      "cognition": {
        "title": "Three fictional cognitive-training groups",
        "text": "The invented observations are recall-score improvements in three separate participant groups. An omnibus F test does not identify which specific groups differ.",
        "settings": {
          "dataMode": "manual",
          "groups": "1,2,3\\n2,3,4\\n4,5,6"
        }
      }
    },
    "prediction": {
      "prompt": "Generate groups with identical population means. Must their observed sample means be identical?",
      "options": [
        "No, sampling variation remains",
        "Yes",
        "Only when there are three groups"
      ],
      "answer": 0,
      "explanation": "Equal population means do not force random sample means to match. This variation is represented by the null F distribution.",
      "setup": {
        "dataMode": "generated",
        "separation": 1,
        "sampleSize": 20,
        "withinSD": 1
      },
      "change": {
        "separation": 0
      }
    }
  },
  "multiple-comparisons-explorer": {
    "role": "Simulated independent hypotheses with known truth",
    "question": "How does a testing procedure trade discoveries against different false-positive targets?",
    "plain": "FWER is the chance of at least one false rejection. FDR is the average false fraction among discoveries, with zero assigned to families with no discoveries. Real effects make these targets differ.",
    "related": [
      "power-explorer",
      "anova-explorer"
    ],
    "keywords": "many tests multiplicity false positives bonferroni holm fdr fwer benjamini hochberg",
    "cases": {
      "medicine": {
        "title": "Screening hypothetical biomarkers",
        "text": "Simulate 20 independent tests, with 30% having a true standardised effect of 0.5 in a known-SD z model at n = 30. Compare discoveries with known simulated truth.",
        "settings": {
          "tests": 20,
          "signalFraction": 0.3,
          "signalEffect": 0.5,
          "signalN": 30,
          "correction": "bh"
        }
      },
      "cognition": {
        "title": "Testing hypothetical cognitive outcomes",
        "text": "Imagine 20 independent outcome tests, six with real effects. Real cognitive outcomes are often correlated; this independent-test experiment does not model that dependence.",
        "settings": {
          "tests": 20,
          "signalFraction": 0.3,
          "signalEffect": 0.5,
          "signalN": 30,
          "correction": "bh"
        }
      }
    },
    "prediction": {
      "prompt": "If every null is true, how do FDR and FWER compare?",
      "options": [
        "They are equal",
        "FDR must be zero",
        "FDR must be larger"
      ],
      "answer": 0,
      "explanation": "Any family with discoveries has a false-discovery proportion of 1, and a family without discoveries contributes 0. Its expectation is the chance of any false discovery. Add real effects to see the targets differ.",
      "setup": {
        "tests": 20,
        "signalFraction": 0.3,
        "correction": "bh"
      },
      "change": {
        "signalFraction": 0
      }
    }
  }
}));
