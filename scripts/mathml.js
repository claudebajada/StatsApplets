// Native MathML keeps equations accessible and typeset without a runtime library.
const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const mi = (s) => `<mi>${s}</mi>`;
const mn = (s) => `<mn>${s}</mn>`;
const op = (s) => `<mo>${s}</mo>`;
const row = (...s) => `<mrow>${s.join("")}</mrow>`;
const sub = (a, b) => `<msub>${a}${b}</msub>`;
const sup = (a, b) => `<msup>${a}${b}</msup>`;
const frac = (a, b) => `<mfrac>${a}${b}</mfrac>`;
const root = (a) => `<msqrt>${a}</msqrt>`;
const bar = (s) => `<mover>${mi(s)}<mo>¯</mo></mover>`;
const par = (s) => row(op("("), s, op(")"));
const eq = op("="),
  minus = op("−"),
  plus = op("+"),
  n = mi("n");
const x = bar("x"),
  mu0 = sub(mi("μ"), mn(0));
const meanTest = (z = false) =>
  row(
    mi(z ? "z" : "t"),
    eq,
    frac(row(x, minus, mu0), frac(mi(z ? "σ" : "s"), root(n))),
  );
const formulas = {
  "one-sample-z-test": meanTest(true),
  "one-sample-t-test": meanTest(),
  "t-distribution-explorer": meanTest(),
  "independent-samples-t-test": row(
    mi("t"),
    eq,
    frac(
      row(sub(x, mn(1)), minus, sub(x, mn(2))),
      row(
        sub(mi("s"), mi("p")),
        root(row(frac(mn(1), sub(n, mn(1))), plus, frac(mn(1), sub(n, mn(2))))),
      ),
    ),
  ),
  "binomial-normal-explorer": row(
    mi("μ"),
    eq,
    n,
    mi("p"),
    op(","),
    sup(mi("σ"), mn(2)),
    eq,
    n,
    mi("p"),
    par(row(mn(1), minus, mi("p"))),
  ),
  "binomial-components-explorer": row(
    mi("P"),
    par(row(mi("X"), eq, mi("k"))),
    eq,
    par(`<mfrac linethickness="0">${n}${mi("k")}</mfrac>`),
    sup(mi("p"), mi("k")),
    sup(par(row(mn(1), minus, mi("p"))), row(n, minus, mi("k"))),
  ),
  "f-distribution-explorer": row(
    mi("F"),
    eq,
    frac(
      frac(mi("U"), sub(mi("df"), mn(1))),
      frac(mi("V"), sub(mi("df"), mn(2))),
    ),
  ),
  "chi-squared-explorer": row(
    sup(mi("χ"), mn(2)),
    eq,
    op("∑"),
    frac(
      sup(par(row(sub(mi("O"), mi("i")), minus, sub(mi("E"), mi("i")))), mn(2)),
      sub(mi("E"), mi("i")),
    ),
  ),
  correlation: row(op("−"), mn(1), op("≤"), mi("r"), op("≤"), mn(1)),
  "clt-explorer": row(mi("SE"), par(x), eq, frac(mi("σ"), root(n))),
  "confidence-interval-explorer": row(
    x,
    op("±"),
    "<mtext>critical value</mtext>",
    op("×"),
    mi("SE"),
  ),
  "power-explorer": row(
    mi("Power"),
    eq,
    mi("P"),
    par(
      row(
        `<mtext>reject </mtext>`,
        sub(mi("H"), mn(0)),
        op("|"),
        mi("μ"),
        eq,
        sub(mi("μ"), mn(1)),
      ),
    ),
  ),
  "regression-explorer": row(
    `<mover>${mi("y")}<mo>^</mo></mover>`,
    eq,
    sub(mi("b"), mn(0)),
    plus,
    sub(mi("b"), mn(1)),
    mi("x"),
  ),
  "anova-explorer": row(
    mi("F"),
    eq,
    frac(
      frac(sub(mi("SS"), "<mtext>between</mtext>"), row(mi("k"), minus, mn(1))),
      frac(
        sub(mi("SS"), "<mtext>within</mtext>"),
        row(mi("N"), minus, mi("k")),
      ),
    ),
  ),
  "multiple-comparisons-explorer": row(
    mi("FWER"),
    eq,
    mn(1),
    minus,
    sup(par(row(mn(1), minus, mi("α"))), mi("m")),
  ),
};
const pearson = row(
  mi("r"),
  eq,
  frac(
    row(
      op("∑"),
      par(row(sub(mi("x"), mi("i")), minus, bar("x"))),
      par(row(sub(mi("y"), mi("i")), minus, bar("y"))),
    ),
    root(
      row(
        op("∑"),
        sup(par(row(sub(mi("x"), mi("i")), minus, bar("x"))), mn(2)),
        op("⋅"),
        op("∑"),
        sup(par(row(sub(mi("y"), mi("i")), minus, bar("y"))), mn(2)),
      ),
    ),
  ),
);
function math(content, label) {
  return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="${escape(label)}">${content}</math>`;
}
module.exports = {
  equation: (id, label) => {
    if (!formulas[id]) throw Error("Missing formula: " + id);
    return math(formulas[id], label);
  },
  pearson: math(
    pearson,
    "Pearson r equals the sum of centred cross products divided by the square root of the product of the centred sums of squares",
  ),
};
