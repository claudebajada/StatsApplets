"""Regenerate committed reference values independently using SciPy (not JavaScript)."""
import json
from pathlib import Path
import scipy
from scipy import stats

def tails(distribution, value):
    return dict(lower=float(distribution.cdf(value)), upper=float(distribution.sf(value)),
                twoSided=float(2 * distribution.sf(abs(value))))

out = dict(generator='scripts/generate-references.py', scipy=scipy.__version__)
out['z'] = [dict(value=z, **tails(stats.norm, z)) for z in [-37, -10, -8, -2, -.1, 0, .1, 2, 8, 10, 37]]
out['t'] = [dict(value=t, df=df, density=float(stats.t.pdf(t, df)), **tails(stats.t(df), t))
            for df in [1, 2, 4, 8, 29, 99, 198] for t in [-100, -10, -2, -.1, 0, .1, 2, 10, 100]]
out['oneSample'] = []
for mean, null, sd, n in [(0,0,1,30),(-.5,0,1,5),(.5,0,1,30),(10,-10,.1,100)]:
    se=sd/n**.5; t=(mean-null)/se
    out['oneSample'].append(dict(mean=mean,null=null,sd=sd,n=n,se=se,statistic=t,df=n-1,d=(mean-null)/sd,**tails(stats.t(n-1),t)))
out['oneSampleZ'] = [dict(mean=r['mean'],null=r['null'],sd=r['sd'],n=r['n'],**tails(stats.norm,r['statistic'])) for r in out['oneSample']]
out['independent'] = []
for m1,m2,sd,n1,n2 in [(0,0,1,30,30),(-1,0,2,5,9),(1,0,2,5,9),(1,2,.5,100,100),(10,-10,.1,100,5)]:
    se=sd*(1/n1+1/n2)**.5;t=(m1-m2)/se;df=n1+n2-2
    out['independent'].append(dict(m1=m1,m2=m2,sd=sd,n1=n1,n2=n2,se=se,statistic=t,df=df,d=(m1-m2)/sd,**tails(stats.t(df),t)))
out['binomial'] = [dict(n=n,p=p,k=k,probability=float(stats.binom.pmf(k,n,p)))
                   for n in [0,1,15,30] for p in [0,.01,.5,.99,1] for k in range(n+1)]
out['chi'] = []
for observed in [[10,10],[0,10],[20,15,25,10,30],[0]*9+[1000],[1]*10]:
    expected=[sum(observed)/len(observed)]*len(observed)
    result=stats.chisquare(observed,expected)
    out['chi'].append(dict(observed=observed,expected=expected,statistic=float(result.statistic),p=float(result.pvalue),w=float((result.statistic/sum(observed))**.5)))
out['f'] = [dict(df1=a,df2=b,critical=float(stats.f.ppf(.95,a,b)),q99=float(stats.f.ppf(.99,a,b)))
            for a in [1,2,5,30,100] for b in [1,2,5,30,100]]
out['correlation'] = [dict(a=a,b=b,dot=float(sum(x*y for x,y in zip(a,b))),r=float(stats.pearsonr(a,b).statistic))
                      for a,b in [([1,2],[2,1]),([1,2],[1,2]),([1,2,3],[1,3,2]),([1,0,-1],[1,-2,1])]]
Path('tests/references/scipy.json').write_text(json.dumps(out, indent=2,allow_nan=False)+'\n')
