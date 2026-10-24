"""Independent numerical reference values for the teaching extensions."""
import json
from pathlib import Path
import numpy as np
import scipy
from scipy import stats
from statsmodels.stats.multitest import multipletests
out={'scipy':scipy.__version__,'generator':'scripts/generate-teaching-references.py'}
out['intervals']=[]
for n in [2,5,30,100]:
 for level in [.8,.95,.99]:
  for method in ['z','t']:
   critical=(stats.norm if method=='z' else stats.t(n-1)).ppf((1+level)/2)
   margin=critical*2.5/n**.5
   out['intervals'].append(dict(n=n,level=level,method=method,mean=-.5,sd=2.5,critical=float(critical),low=float(-.5-margin),high=float(-.5+margin)))
out['power']=[]
for n in [2,30,200]:
 for d in [-1,-.1,0,.1,1]:
  for alpha in [.01,.05,.2]:
   for direction in ['lower','upper','twoSided']:
    c=stats.norm.ppf(1-alpha/(2 if direction=='twoSided' else 1));shift=d*n**.5
    p=stats.norm.sf(c-shift) if direction=='upper' else stats.norm.cdf(-c-shift) if direction=='lower' else stats.norm.sf(c-shift)+stats.norm.cdf(-c-shift)
    out['power'].append(dict(n=n,d=d,alpha=alpha,direction=direction,power=float(p)))
out['regression']=[]
for pairs in [[(1,1),(2,3),(3,2),(4,5),(5,4)],[(-2,5),(-1,3),(0,1),(1,-1),(2,-3)],[(0,10),(1,3),(2,-2),(3,8)]]:
 x,y=np.array(pairs).T;r=stats.linregress(x,y);residual=y-(r.intercept+r.slope*x)
 out['regression'].append(dict(pairs=pairs,slope=float(r.slope),intercept=float(r.intercept),rSquared=float(r.rvalue**2),sse=float(np.sum(residual**2)),df=len(x)-2))
out['anova']=[]
for groups in [[[1,2,3],[2,3,4],[4,5,6]],[[1,2],[4,5,6,7]],[[1,2,3],[1,2,3],[1,2,3]],[[0,.1,.2],[50,50.1,50.2],[100,100.1,100.2]]]:
 r=stats.f_oneway(*groups);grand=np.mean(sum(groups,[]));between=sum(len(g)*(np.mean(g)-grand)**2 for g in groups);within=sum(sum((v-np.mean(g))**2 for v in g) for g in groups)
 out['anova'].append(dict(groups=groups,f=float(r.statistic),p=float(r.pvalue),between=float(between),within=float(within),total=float(between+within)))
out['adjustments']=[]
for values in [[.001,.01,.03,.04,.08,.9],[.04,.001,.6,.01,.04],[0,1,.05],[.01]*10]:
 for method in ['bonferroni','holm','bh']:
  adjusted=multipletests(values,method='fdr_bh' if method=='bh' else method)[1]
  out['adjustments'].append(dict(values=values,method=method,adjusted=adjusted.tolist()))
Path('tests/references/teaching-scipy.json').write_text(json.dumps(out,indent=2,allow_nan=False)+'\n')
