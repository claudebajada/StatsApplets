/* Shared map labels and student derivations. All formula markup is authored here. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.RelationshipContent = factory();
})(globalThis, function () {
  const v = (s) => `<mi>${s}</mi>`,
    num = (s) => `<mn>${s}</mn>`,
    op = (s) => `<mo>${s}</mo>`;
  const row = (...s) => `<mrow>${s.join("")}</mrow>`;
  const sub = (a, b) => `<msub>${a}${b}</msub>`,
    sq = (a) => `<msup>${a}<mn>2</mn></msup>`;
  const frac = (a, b) => `<mfrac>${a}${b}</mfrac>`,
    sqrt = (a) => `<msqrt>${a}</msqrt>`;
  const par = (a) => row(op("("), a, op(")"));
  const bar = (a) => `<mover>${v(a)}<mo>¯</mo></mover>`;
  const eq = op("="),
    minus = op("−"),
    plus = op("+"),
    sim = op("∼");
  const chi = (df) => row(sq(v("χ")), par(df));
  const tLaw = (df) => row(v("t"), par(df));
  const fLaw = (a, b) => row(v("F"), par(row(a, op(","), b)));
  const normal = row(v("N"), par(row(num(0), op(","), num(1))));
  const n = v("n"),
    nu = v("ν"),
    z = v("Z"),
    u = v("U"),
    vv = v("V");
  const df1 = sub(v("d"), num(1)),
    df2 = sub(v("d"), num(2));
  const sigma2 = sq(v("σ")),
    s2 = sq(v("S")),
    xm = bar("X"),
    mu0 = sub(v("μ"), num(0));
  const ss = sub(v("SS"), v("within")),
    sb = sub(v("SS"), v("between"));
  const ni = sub(n, v("j")),
    groupMean = sub(xm, v("j")),
    grand = `<mover>${xm}<mo>¯</mo></mover>`;
  function math(label, body) {
    return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="${label}">${body}</math>`;
  }
  const step = (title, text, label, body) => ({
    title,
    text,
    math: math(label, body),
  });
  const standard =
    "Z is standard normal: population mean 0 and SD 1. For X from N(μ,σ²), first use Z = (X − μ)/σ. Squaring an unstandardised normal does not generally give a central χ² variable.";
  const normalAssumption =
    "Observations are independent draws from a normal population. In this experiment μ = μ₀ = 0 and σ = 1. The population SD is known to the simulation, even when the test estimates it from the sample.";
  const modes = {
    squares: {
      title: "Normal → χ²",
      recipe: "Square, then add independent draws",
      type: "Exact",
      params: ["df1"],
      symbols:
        "Zᵢ are independent standard normal draws. U is their sum of squares. k is both the number of draws per repetition and the χ² degrees of freedom.",
      assumptions: standard,
      links: [
        ["sampleVariance", "Why sample variance has n − 1 degrees of freedom"],
      ],
      steps: [
        step(
          "Start with standard normal draws",
          "Each repetition draws k independent values from the same standard normal population. Increasing the repetitions makes the histogram more stable; increasing k changes the target distribution.",
          "Independent Zi follow N(0,1)",
          row(sub(z, v("i")), sim, normal),
        ),
        step(
          "Square each draw",
          "Both −2 and +2 become 4. Squaring folds the negative side onto the positive side and stretches large magnitudes. One squared draw already has a χ² distribution with one degree of freedom.",
          "Z squared follows chi squared with 1 degree of freedom",
          row(sq(z), sim, chi(num(1))),
        ),
        step(
          "Add the independent squares",
          "For k draws, add their squares within each repetition. The k independent normal coordinates each contribute one degree of freedom.",
          "U equals the sum of k independent squared standard normals",
          row(
            u,
            eq,
            `<munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>k</mi></munderover>`,
            sq(sub(z, v("i"))),
          ),
        ),
        step(
          "Repeat to reveal χ²",
          "The law is exact for every repetition. A finite histogram fluctuates around its density. There is no requirement to collect infinitely many samples for the relationship to hold.",
          "U follows chi squared with k degrees of freedom",
          row(u, sim, chi(v("k"))),
        ),
      ],
    },
    t: {
      title: "Normal + χ² → t",
      recipe: "Divide by an independent estimated scale",
      type: "Exact",
      params: ["df2"],
      symbols:
        "Z is a standard normal draw, U is an independent χ² draw and ν is U's degrees of freedom. T is the resulting signed ratio.",
      assumptions:
        "The standard normal numerator and χ² denominator must be independent. The denominator is built from a separate set of ν independent standard normal draws.",
      links: [["oneSampleT", "Derive the one-sample t test"]],
      steps: [
        step(
          "Draw the numerator and denominator independently",
          "Use one standard normal for Z and a separate set of ν normal draws to build U. Reusing the numerator inside U would break this t construction.",
          "Z follows N(0,1), U follows chi squared nu, independently",
          row(z, sim, normal, op(","), u, sim, chi(nu)),
        ),
        step(
          "Scale the χ² sum",
          "U has mean ν. Dividing by ν gives a quantity with mean 1. It varies more when ν is small.",
          "Expected U over nu equals 1",
          row(v("E"), par(frac(u, nu)), eq, num(1)),
        ),
        step(
          "Take its square root and divide",
          "The square root converts a variance scale into an SD scale. Small denominator values can stretch an otherwise ordinary normal draw into a large positive or negative t score.",
          "T equals Z divided by square root of U over nu",
          row(v("T"), eq, frac(z, sqrt(frac(u, nu)))),
        ),
        step(
          "Read the t reference distribution",
          "The denominator's degrees of freedom become the t degrees of freedom. This randomness gives t its heavier tails.",
          "T follows t with nu degrees of freedom",
          row(v("T"), sim, tLaw(nu)),
        ),
      ],
    },
    f: {
      title: "χ² + χ² → F",
      recipe: "Divide two independent scaled sums",
      type: "Exact",
      params: ["df1", "df2"],
      symbols:
        "U and V are independent χ² variables. d₁ and d₂ are their respective degrees of freedom. F divides U/d₁ by V/d₂.",
      assumptions:
        "Both χ² variables are central and independent. Their underlying normal draws are separate. A bare ratio U/V has an extra scale factor unless d₁ = d₂.",
      links: [["anova", "Derive the ANOVA variance ratio"]],
      steps: [
        step(
          "Build two independent sums of squares",
          "Draw two separate sets of standard normals. Their counts determine d₁ and d₂.",
          "U follows chi squared d1 and V follows chi squared d2 independently",
          row(u, sim, chi(df1), op(","), vv, sim, chi(df2)),
        ),
        step(
          "Divide each sum by its own degrees of freedom",
          "The two scaled sums each have mean 1. Their individual means do not imply that the ratio also has mean 1.",
          "Expected U over d1 and V over d2 both equal 1",
          row(
            v("E"),
            par(frac(u, df1)),
            eq,
            v("E"),
            par(frac(vv, df2)),
            eq,
            num(1),
          ),
        ),
        step(
          "Form the ratio",
          "Divide the scaled numerator by the scaled denominator. A denominator close to zero gives a very large F. Both directions of departure in the underlying normal draws contribute positive squares.",
          "F equals U over d1 divided by V over d2",
          row(v("F"), eq, frac(frac(u, df1), frac(vv, df2))),
        ),
        step(
          "Read both degrees of freedom",
          "Numerator and denominator degrees of freedom play different roles. F is non-negative and has no finite upper bound. Its mean does not exist when d₂ ≤ 2.",
          "F follows F with d1 and d2 degrees of freedom",
          row(v("F"), sim, fLaw(df1, df2)),
        ),
      ],
    },
    tSquared: {
      title: "t → F",
      recipe: "Square a t score",
      type: "Exact",
      params: ["df2"],
      symbols:
        "T has ν degrees of freedom. Squaring it gives F with numerator df 1 and denominator df ν. Z² is χ² with one degree of freedom.",
      assumptions:
        "Build T from independent Z and U. Squaring removes its sign. A two-sided t tail corresponds to an upper F tail at the squared score.",
      links: [["pooledT", "See the same identity for two-group tests"]],
      steps: [
        step(
          "Construct a t score",
          "Start with the same independent normal and χ² ingredients as the t construction.",
          "T equals Z divided by square root of U over nu",
          row(v("T"), eq, frac(z, sqrt(frac(u, nu)))),
        ),
        step(
          "Square the complete ratio",
          "Squaring removes the square root in the denominator and the sign of the numerator.",
          "T squared equals Z squared divided by U over nu",
          row(sq(v("T")), eq, frac(sq(z), frac(u, nu))),
        ),
        step(
          "Identify the numerator's χ² law",
          "Z² is χ² with one degree of freedom and remains independent of U. Its scaling divisor is therefore 1.",
          "T squared equals Z squared over 1 divided by U over nu",
          row(sq(v("T")), eq, frac(frac(sq(z), num(1)), frac(u, nu))),
        ),
        step(
          "Recognise F with numerator df 1",
          "Every simulated t score is squared and checked against the ratio using the very same ingredients. This is an identity within each repetition.",
          "T nu squared follows F 1 nu",
          row(sq(sub(v("T"), nu)), sim, fLaw(num(1), nu)),
        ),
      ],
    },
    normalLimit: {
      title: "t → normal as df increases",
      recipe: "Make the denominator more stable",
      type: "Limit",
      params: ["df2"],
      symbols:
        "ν controls the χ² denominator. U/ν concentrates near 1 as ν grows. The dashed normal curve is the limiting reference, not the exact finite-ν law.",
      assumptions:
        "The numerator and denominator are independent. Every finite-ν sample in the histogram still has a t distribution. Increasing repetitions alone does not turn t into normal.",
      links: [["t", "Revisit the exact t construction"]],
      steps: [
        step(
          "Use the t construction",
          "Keep a standard normal numerator and independently draw ν normals for the χ² denominator.",
          "T nu equals Z divided by square root of U over nu",
          row(sub(v("T"), nu), eq, frac(z, sqrt(frac(u, nu)))),
        ),
        step(
          "Measure denominator variability",
          "A χ² variable with ν degrees of freedom has variance 2ν. After dividing by ν, its variance is 2/ν. More degrees of freedom stabilise this variance estimate.",
          "Variance of U over nu equals 2 over nu",
          row(v("Var"), par(frac(u, nu)), eq, frac(num(2), nu)),
        ),
        step(
          "Watch the random scale approach 1",
          "As ν grows, U/ν tends to 1 in probability, and so does its square root. Compare the actual scale with 1 for the inspected draw.",
          "U over nu converges in probability to 1",
          row(frac(u, nu), `<mover><mo>→</mo><mi>p</mi></mover>`, num(1)),
        ),
        step(
          "Compare finite t with its normal limit",
          "The histogram follows the exact t curve. The dashed standard normal curve shows the limit. Use the same numerator Z to compare the current T with what it would be if the scale were exactly 1.",
          "T nu converges in distribution to N 0 1",
          row(sub(v("T"), nu), `<mover><mo>→</mo><mi>d</mi></mover>`, normal),
        ),
      ],
    },
    sampleVariance: {
      title: "Normal samples → sample variance → χ²",
      recipe: "Centre, square and account for the fitted mean",
      type: "Exact",
      params: ["sampleSize"],
      symbols:
        "S² is sample variance, σ² is population variance, n is sample size and X̄ is sample mean. Aᵢ are coordinates in independent residual directions.",
      assumptions: normalAssumption,
      links: [
        ["oneSampleT", "Use this χ² variable in a t test"],
        ["pooledT", "Combine two sample variances"],
      ],
      steps: [
        step(
          "Estimate the mean and centre the observations",
          "The centred deviations sum to zero. Once n − 1 deviations are known, the last is fixed. There are n − 1 free residual directions and one mean direction.",
          "Sum of Xi minus sample mean equals 0",
          row(op("∑"), par(row(sub(v("X"), v("i")), minus, xm)), eq, num(0)),
        ),
        step(
          "Account for the fitted mean",
          "Centring fixes the sum of the residuals at zero, leaving n − 1 free directions. Under normal sampling, their scaled sum of squares follows χ²(n − 1) and is independent of the sample mean. The optional proof shows the independent directions.",
          "Sum of squared standardised centred residuals equals sum of n minus 1 squared independent A coordinates",
          row(
            op("∑"),
            sq(frac(row(sub(v("X"), v("i")), minus, xm), v("σ"))),
            eq,
            `<munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mrow><mi>n</mi><mo>−</mo><mn>1</mn></mrow></munderover>`,
            sq(sub(v("A"), v("i"))),
          ),
        ),
        step(
          "Express that length using sample variance",
          "Sample variance divides the residual sum of squares by n − 1. Multiply back by n − 1 and divide by population variance to recover the standardised squared length.",
          "U equals n minus 1 times S squared over sigma squared",
          row(u, eq, frac(row(par(row(n, minus, num(1))), s2), sigma2)),
        ),
        step(
          "Use the χ² reference law",
          "Under the normal model this is exact, with n − 1 degrees of freedom. This variable supplies the denominator of a one-sample t test. A normal-population variance test compares it with χ² quantiles under a hypothesised σ².",
          "U follows chi squared n minus 1",
          row(u, sim, chi(row(n, minus, num(1)))),
        ),
      ],
    },
    oneSampleT: {
      title: "Normal samples → one-sample t test",
      recipe: "Replace population SD with sample SD",
      type: "Exact under H₀",
      params: ["sampleSize"],
      symbols:
        "μ₀ is the null mean, σ is the fixed population SD, S is sample SD, and n is sample size. Z and U are independent under normal sampling.",
      assumptions:
        normalAssumption +
        " The reference law shown assumes the null mean is true.",
      links: [["sampleVariance", "Explain the independent χ² denominator"]],
      steps: [
        step(
          "Standardise the sample mean using population SD",
          "For independent normal observations, the sample mean is exactly normal. Under H₀ its mean is μ₀ and its SD is σ/√n, so the standardised numerator is N(0,1). This is also the basis of the known-SD z test.",
          "Z equals sample mean minus null mean over sigma divided by square root n",
          row(
            z,
            eq,
            frac(row(xm, minus, mu0), frac(v("σ"), sqrt(n))),
            sim,
            normal,
          ),
        ),
        step(
          "Construct the independent χ² denominator",
          "Centring uses one degree of freedom. Under normal sampling, the sample mean is independent of the residual directions and therefore independent of sample variance.",
          "U equals n minus 1 times S squared over sigma squared and follows chi squared n minus 1",
          row(
            u,
            eq,
            frac(row(par(row(n, minus, num(1))), s2), sigma2),
            sim,
            chi(row(n, minus, num(1))),
          ),
        ),
        step(
          "Substitute and cancel population SD",
          "U/(n − 1) = S²/σ². Its square root is S/σ. Divide Z by this factor: the unknown population SD cancels, leaving a statistic that can be calculated from the sample.",
          "T equals Z over square root U over n minus 1 equals sample mean minus null mean over S divided by square root n",
          row(
            v("T"),
            eq,
            frac(z, sqrt(frac(u, row(n, minus, num(1))))),
            eq,
            frac(row(xm, minus, mu0), frac(v("S"), sqrt(n))),
          ),
        ),
        step(
          "Read the null t distribution",
          "The ratio has n − 1 t degrees of freedom when H₀ is true. A two-sided test counts both positive and negative extremes. A t test is not claiming that the individual observations follow a t distribution.",
          "T follows t with n minus 1 degrees of freedom under H0",
          row(v("T"), sim, tLaw(row(n, minus, num(1)))),
        ),
      ],
    },
    pooledT: {
      title: "Two normal groups → pooled t test",
      recipe: "Pool independent residual sums of squares",
      type: "Exact under H₀",
      params: ["sampleSize", "sampleSize2"],
      symbols:
        "Sₚ² is pooled variance. n₁ and n₂ are group sizes. ν = n₁ + n₂ − 2. The experiment allows different observed sample SDs while assuming equal population variances.",
      assumptions:
        "Both groups are independent normal samples with the same population variance σ². Under H₀ both population means are 0 here. Sample means are independent of both within-group residual sums of squares. This is the pooled test; Welch's test uses a different denominator and degrees of freedom.",
      links: [["anova", "Compare with a two-group ANOVA"]],
      steps: [
        step(
          "Standardise the difference of group means",
          "Under equal null means, the difference is normal with variance σ²(1/n₁ + 1/n₂). Use that population variance to obtain a standard normal numerator.",
          "Z equals difference of sample means over sigma times square root 1 over n1 plus 1 over n2",
          row(
            z,
            eq,
            frac(
              row(sub(xm, num(1)), minus, sub(xm, num(2))),
              row(
                v("σ"),
                sqrt(
                  row(
                    frac(num(1), sub(n, num(1))),
                    plus,
                    frac(num(1), sub(n, num(2))),
                  ),
                ),
              ),
            ),
          ),
        ),
        step(
          "Add the independent residual sums",
          "Each group loses one degree of freedom to its estimated mean. Add their standardised residual sums: independent χ² degrees of freedom add. The total is ν = n₁ + n₂ − 2.",
          "U equals sum of within group squares over sigma squared and follows chi squared nu",
          row(u, eq, frac(ss, sigma2), sim, chi(nu)),
        ),
        step(
          "Pool variance and form t",
          "Divide the within-group sum by ν to estimate the common variance. Substitute U/ν = Sₚ²/σ² into the t construction; σ cancels.",
          "Pooled t equals difference of sample means over pooled SD times square root 1 over n1 plus 1 over n2",
          row(
            sub(s2, v("p")),
            eq,
            frac(ss, nu),
            op(","),
            v("T"),
            eq,
            frac(
              row(sub(xm, num(1)), minus, sub(xm, num(2))),
              row(
                sub(v("S"), v("p")),
                sqrt(
                  row(
                    frac(num(1), sub(n, num(1))),
                    plus,
                    frac(num(1), sub(n, num(2))),
                  ),
                ),
              ),
            ),
          ),
        ),
        step(
          "Connect two-sided t with two-group F",
          "With these same observations, the two-group ANOVA numerator has one degree of freedom. Its F statistic equals this pooled t statistic squared. Their two-sided t and upper-tail F p-values agree.",
          "T follows t nu and T squared equals the two group ANOVA F",
          row(
            v("T"),
            sim,
            tLaw(nu),
            op(","),
            sq(v("T")),
            eq,
            sub(v("F"), `<mtext>two groups</mtext>`),
          ),
        ),
      ],
    },
    anova: {
      title: "Normal groups → ANOVA → F",
      recipe: "Partition variation, then compare mean squares",
      type: "Exact under H₀",
      params: ["sampleSize", "groups"],
      symbols:
        "g is the group count, nⱼ is group j's size, N is the total size and X̄ⱼ is a group mean. SSbetween and SSwithin are sums of squares; mean squares divide them by their degrees of freedom.",
      assumptions:
        "Independent normal observations, equal population variances and equal population means under H₀. Groups here all have mean 0 and SD 1. Between-group sums are central χ² only under the equal-means null. Orthogonality gives independence here because the underlying noise is Gaussian.",
      links: [["pooledT", "Derive the equivalent two-group pooled t test"]],
      steps: [
        step(
          "Split each deviation into between and within parts",
          "Observation minus grand mean equals observation minus group mean plus group mean minus grand mean. When squares are summed, the cross terms cancel because residuals in each group sum to zero. Thus SStotal = SSbetween + SSwithin.",
          "Total sum of squares equals between plus within sum of squares",
          row(sub(v("SS"), v("total")), eq, sb, plus, ss),
        ),
        step(
          "Count the independent normal directions",
          "Within groups, fitting g means leaves N − g residual directions. The weighted group means have g coordinates, but their grand mean uses one, leaving g − 1 between-group contrasts. Under H₀, after division by σ², these squared lengths are independent χ² variables in orthogonal Gaussian subspaces.",
          "Between over sigma squared follows chi squared g minus 1, within over sigma squared follows chi squared N minus g independently",
          row(
            frac(sb, sigma2),
            sim,
            chi(row(v("g"), minus, num(1))),
            op(","),
            frac(ss, sigma2),
            sim,
            chi(row(v("N"), minus, v("g"))),
          ),
        ),
        step(
          "Divide by df and cancel population variance",
          "Between-group SS repeats each group-mean deviation once per observation, giving the weight nⱼ. Divide by g − 1 and N − g, then take the ratio. The common σ² cancels.",
          "Between sum is sum nj times squared group mean minus grand mean, F is ratio of mean squares",
          row(
            sb,
            eq,
            op("∑"),
            ni,
            sq(par(row(groupMean, minus, grand))),
            op(","),
            v("F"),
            eq,
            frac(
              frac(sb, row(v("g"), minus, num(1))),
              frac(ss, row(v("N"), minus, v("g"))),
            ),
          ),
        ),
        step(
          "Use the upper F tail",
          "Under H₀ the ratio has F(g − 1, N − g). Large values mean between-group variation is large relative to within-group variation. Set g = 2 to verify F = pooled t² using the same data. Rejection says at least one population mean differs; it does not identify the group.",
          "F follows F g minus 1 N minus g under H0",
          row(
            v("F"),
            sim,
            fLaw(row(v("g"), minus, num(1)), row(v("N"), minus, v("g"))),
          ),
        ),
      ],
    },
    gof: {
      title: "Category counts → approximate χ²",
      recipe: "Square constrained count residuals",
      type: "Asymptotic approximation",
      params: ["categories", "observations"],
      symbols:
        "Oᵢ and Eᵢ are observed and expected counts in c categories. Rᵢ are standardised count residuals. The fixed total N leaves c − 1 free directions. Category probabilities are specified, not fitted.",
      assumptions:
        "Independent categorical observations; mutually exclusive, exhaustive categories fixed in advance. The null assigns probability 1/c to each category. Expected counts must be sufficiently large for a reliable approximation; at least 5 per category is a useful heuristic, not a guarantee. No category probabilities are estimated from these data.",
      links: [
        ["squares", "Compare with the exact independent-square construction"],
      ],
      steps: [
        step(
          "Draw counts under specified probabilities",
          "Each observation lands in one of c equally likely categories. Counts must sum to N, so increasing one category's count leaves fewer observations for the others. The counts are dependent.",
          "Expected count Ei equals N over c",
          row(sub(v("E"), v("i")), eq, frac(v("N"), v("c"))),
        ),
        step(
          "Standardise the count residuals",
          "The equal-probability residuals sum to zero. They are not independent N(0,1) variables: each has variance 1 − 1/c and different categories have covariance −1/c. The fixed-total constraint removes one direction.",
          "Ri equals Oi minus Ei over square root Ei, sum Ri equals zero",
          row(
            sub(v("R"), v("i")),
            eq,
            frac(
              row(sub(v("O"), v("i")), minus, sub(v("E"), v("i"))),
              sqrt(sub(v("E"), v("i"))),
            ),
            op(","),
            op("∑"),
            sub(v("R"), v("i")),
            eq,
            num(0),
          ),
        ),
        step(
          "Account for the fixed total",
          "The counts must add to N, leaving c − 1 free directions. When the expected counts are large, the squared discrepancies behave approximately like the sum of c − 1 independent standard normal squares. The optional proof shows the change of coordinates. Sparse counts can be far from this approximation.",
          "Q equals sum of Ri squared equals sum of c minus 1 contrast coordinates squared",
          row(
            v("Q"),
            eq,
            op("∑"),
            sq(sub(v("R"), v("i"))),
            eq,
            `<munderover><mo>∑</mo><mrow><mi>j</mi><mo>=</mo><mn>1</mn></mrow><mrow><mi>c</mi><mo>−</mo><mn>1</mn></mrow></munderover>`,
            sq(sub(v("A"), v("j"))),
          ),
        ),
        step(
          "Use an approximate upper-tail χ² reference",
          "Squared positive and negative departures both increase Q. Compare its upper tail with χ²(c − 1). Change N to see the discrete histogram approach the continuous reference. More repetitions reveal the finite-count distribution; they do not repair small expected counts. Sparse counts may need an exact multinomial or simulation-based test.",
          "Q equals sum squared observed minus expected over expected, approximately chi squared c minus 1",
          row(
            v("Q"),
            eq,
            op("∑"),
            frac(
              sq(par(row(sub(v("O"), v("i")), minus, sub(v("E"), v("i"))))),
              sub(v("E"), v("i")),
            ),
            op("≈"),
            chi(row(v("c"), minus, num(1))),
          ),
        ),
      ],
    },
  };
  const recipes = {
    squares: [
      "Independent standard normals → square → add → χ²",
      "Use independent standard normal values (mean 0, SD 1).",
    ],
    t: [
      "Standard normal + independent χ² → scale and divide → t",
      "The normal numerator and χ² denominator must be independent.",
    ],
    f: [
      "Two independent χ² values → scale each → divide → F",
      "Scale each independent χ² value by its own degrees of freedom.",
    ],
    tSquared: [
      "t score → square → F(1, ν)",
      "The F denominator has the same degrees of freedom as t.",
    ],
    normalLimit: [
      "t → increase degrees of freedom → standard normal",
      "Finite degrees of freedom still give t; normal is the limit.",
    ],
    sampleVariance: [
      "Normal observations → sample variance → χ²",
      "Independent normal observations; one fitted mean leaves n − 1 degrees of freedom.",
    ],
    oneSampleT: [
      "Normal observations → sample mean and SD → t",
      "Independent normal observations, with the null mean true.",
    ],
    pooledT: [
      "Two normal samples → mean difference and pooled SD → t",
      "Independent normal groups, equal population variances and equal means under H₀.",
    ],
    anova: [
      "Normal groups → between and within variation → F",
      "Independent normal groups, equal population variances and equal means under H₀.",
    ],
    gof: [
      "Category counts → squared discrepancies → approximate χ²",
      "Fixed category probabilities and sufficiently large expected counts; this is an approximation.",
    ],
  };
  const lessons = [
    [
      "squares",
      "normal-to-chi-squared",
      "Normal → χ²",
      "What happens when you square and add normal values?",
      [
        ["One squared normal", { df1: 1 }],
        ["Four independent squares", { df1: 4 }],
        ["Ten independent squares", { df1: 10 }],
        ["Twenty independent squares", { df1: 20 }],
      ],
    ],
    [
      "t",
      "normal-chi-squared-to-t",
      "Normal + independent χ² → t",
      "Why does a random scale give heavier tails?",
      [
        ["Very uncertain scale", { df2: 1 }],
        ["Four denominator degrees of freedom", { df2: 4 }],
        ["More stable scale", { df2: 30 }],
        ["Almost stable scale", { df2: 100 }],
      ],
    ],
    [
      "f",
      "chi-squared-to-f",
      "Two independent χ² → F",
      "What happens when you compare two scaled sums of squares?",
      [
        ["One degree of freedom each", { df1: 1, df2: 1 }],
        ["Balanced ingredients", { df1: 4, df2: 4 }],
        ["A stable denominator", { df1: 4, df2: 60 }],
        ["A noisy denominator", { df1: 30, df2: 2 }],
      ],
    ],
    [
      "tSquared",
      "t-squared-to-f",
      "t² → F",
      "Where does a t score go when you remove its sign?",
      [
        ["One denominator degree of freedom", { df2: 1 }],
        ["Four denominator degrees of freedom", { df2: 4 }],
        ["Thirty denominator degrees of freedom", { df2: 30 }],
        ["One hundred denominator degrees of freedom", { df2: 100 }],
      ],
    ],
    [
      "normalLimit",
      "t-to-normal",
      "t → Normal",
      "Why does t approach normal as degrees of freedom increase?",
      [
        ["Heavy tails", { df2: 1 }],
        ["Small sample scale", { df2: 4 }],
        ["More stable scale", { df2: 30 }],
        ["Near the normal limit", { df2: 100 }],
      ],
    ],
    [
      "sampleVariance",
      "sample-variance-to-chi-squared",
      "Sample variance → χ²",
      "Why does estimating the mean cost one degree of freedom?",
      [
        ["Two observations", { sampleSize: 2 }],
        ["Five observations", { sampleSize: 5 }],
        ["Twenty observations", { sampleSize: 20 }],
        ["One hundred observations", { sampleSize: 100 }],
      ],
    ],
    [
      "oneSampleT",
      "one-sample-t-derivation",
      "Deriving the one-sample t test",
      "How does estimating the population SD produce a t statistic?",
      [
        ["Two observations", { sampleSize: 2 }],
        ["Five observations", { sampleSize: 5 }],
        ["Twenty observations", { sampleSize: 20 }],
        ["One hundred observations", { sampleSize: 100 }],
      ],
    ],
    [
      "pooledT",
      "pooled-t-derivation",
      "Deriving the pooled t test",
      "How do two independent groups share a variance estimate?",
      [
        ["Two small groups", { sampleSize: 2, sampleSize2: 2 }],
        ["Two balanced groups", { sampleSize: 5, sampleSize2: 5 }],
        ["Unequal group sizes", { sampleSize: 5, sampleSize2: 20 }],
        ["Two larger groups", { sampleSize: 30, sampleSize2: 30 }],
      ],
    ],
    [
      "anova",
      "anova-f-derivation",
      "Deriving ANOVA’s F statistic",
      "Why does comparing between-group and within-group variation give F?",
      [
        ["Two groups: F equals pooled t²", { groups: 2, sampleSize: 5 }],
        ["Three groups", { groups: 3, sampleSize: 5 }],
        ["Six groups", { groups: 6, sampleSize: 5 }],
        ["Larger groups", { groups: 3, sampleSize: 30 }],
      ],
    ],
    [
      "gof",
      "goodness-of-fit-derivation",
      "Why goodness of fit uses χ²",
      "When do category-count discrepancies behave like a sum of normal squares?",
      [
        ["Five categories", { categories: 5, observations: 100 }],
        ["Sparse counts", { categories: 10, observations: 10 }],
        ["Larger expected counts", { categories: 10, observations: 1000 }],
        ["Two categories", { categories: 2, observations: 100 }],
      ],
    ],
  ].map(([relationship, id, title, question, presets], order) => {
    const mode = modes[relationship];
    return {
      relationship,
      id,
      title,
      question,
      recipe: recipes[relationship][0],
      condition: recipes[relationship][1],
      presets,
      order,
      group: "Distribution connections",
      section: order < 5 ? "Connections" : "Test derivations",
      objective: mode.recipe + ".",
      introduction: mode.steps[0].text,
      equation: mode.title,
      answer: mode.steps[3].text,
      baseline: {
        relationship,
        df1: 1,
        df2: 4,
        sampleSize: 5,
        sampleSize2: 5,
        groups: 3,
        categories: 5,
        observations: 100,
        seed: 42,
        repetitions: 1000,
        shown: 1,
        inspected: 1,
        traceStep: 1,
      },
    };
  });
  const byMode = Object.fromEntries(
    lessons.map((lesson) => [lesson.relationship, lesson]),
  );
  return { modes, math, lessons, byMode };
});
