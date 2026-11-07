"""Independent SciPy fixtures for distribution constructions and their tests."""
import json
from pathlib import Path

import numpy as np
import scipy
from scipy import stats

out = {"scipy": scipy.__version__, "generator": "scripts/generate-relationship-references.py"}
out["laws"] = []
for family, dfs in [("chi", [(1,), (2,), (4,), (99,)]), ("t", [(1,), (4,), (99,), (198,)]), ("f", [(1, 1), (1, 4), (4, 6), (5, 594)])]:
    for args in dfs:
        law = {"chi": stats.chi2, "t": stats.t, "f": stats.f}[family](*args)
        points = [-2, 0, .1, 1, 4] if family == "t" else [.01, .1, 1, 4, 50]
        out["laws"].append({"family": family, "dfs": args,
                            "points": [{"x": x, "pdf": float(law.pdf(x)), "cdf": float(law.cdf(x))} for x in points],
                            "quantiles": [{"p": p, "x": float(law.ppf(p))} for p in [.005, .1, .5, .9, .99, .995]]})
out["variance"] = []
for sample, mu, sigma in [([1, 2, 4, 7, 8], 3, 2.5), ([-2, 2], 0, 1), ([.2, -.7, 1.8], 0, 1)]:
    a = np.array(sample, dtype=float)
    sd = np.std(a, ddof=1)
    out["variance"].append({"sample": sample, "mu": mu, "sigma": sigma, "mean": float(a.mean()), "sd": float(sd), "u": float(np.sum((a-a.mean())**2)/sigma**2), "z": float((a.mean()-mu)/(sigma/len(a)**.5)), "t": float((a.mean()-mu)/(sd/len(a)**.5))})
out["pooled"] = []
for groups in [[[1, 2, 4], [0, 2, 3, 5, 6]], [[-2, 3], [-1, 1]], [[1, 1, 1], [2, 3, 4]]]:
    t = stats.ttest_ind(*groups, equal_var=True)
    f = stats.f_oneway(*groups)
    out["pooled"].append({"groups": groups, "t": float(t.statistic), "p": float(t.pvalue), "f": float(f.statistic), "fp": float(f.pvalue)})
out["gof"] = []
for counts in [[0, 1, 0, 2, 7], [15, 19, 21, 22, 23], [20, 20, 20, 20, 20]]:
    result = stats.chisquare(counts)
    out["gof"].append({"counts": counts, "q": float(result.statistic), "p": float(result.pvalue)})
Path("tests/references/relationships-scipy.json").write_text(json.dumps(out, indent=2, allow_nan=False) + "\n")
