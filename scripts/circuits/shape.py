"""Shape comparison: similarity ICP (rotation, uniform scale, translation; optionally mirrored)
between two point sets, scored by the mean symmetric chamfer distance as a % of the RMS radius.
Same method used to check the formula1.com maps (PR #6)."""
import numpy as np
from scipy.spatial import cKDTree
rng=np.random.default_rng(0)
def resample_poly(xy,n=700):
    xy=np.asarray(xy,float); d=np.r_[0,np.cumsum(np.linalg.norm(np.diff(xy,axis=0),axis=1))]
    t=np.linspace(0,d[-1],n,endpoint=False)
    return np.c_[np.interp(t,d,xy[:,0]),np.interp(t,d,xy[:,1])]
def subsample(pts,n=700):
    pts=np.asarray(pts,float)
    if len(pts)<=n: return pts
    # voxel-ish thinning then random
    idx=rng.choice(len(pts),n,replace=False); return pts[idx]
def norm(p):
    c=p.mean(0); q=p-c; s=np.sqrt((q**2).sum(1).mean()); return q/s,c,s
def umeyama(X,Y):
    mx,my=X.mean(0),Y.mean(0); Xc,Yc=X-mx,Y-my
    S=Yc.T@Xc/len(X); U,D,Vt=np.linalg.svd(S); E=np.eye(2)
    if np.linalg.det(U)*np.linalg.det(Vt)<0: E[1,1]=-1
    R=U@E@Vt; var=(Xc**2).sum()/len(X); s=np.trace(np.diag(D)@E)/var
    return s*R, my-(s*R)@mx
def icp(A,B,M,t,iters=25,affine=False,treeB=None):
    treeB=treeB or cKDTree(B)
    for _ in range(iters):
        A2=A@M.T+t
        d1,i1=treeB.query(A2)
        treeA=cKDTree(A2); d2,i2=treeA.query(B)
        X=np.r_[A,A[i2]]; Y=np.r_[B[i1],B]
        if affine:
            Xh=np.c_[X,np.ones(len(X))]; P,*_=np.linalg.lstsq(Xh,Y,rcond=None); M=P[:2].T; t=P[2]
        else:
            M,t=umeyama(X,Y)
    A2=A@M.T+t; d1,_=treeB.query(A2); d2,_=cKDTree(A2).query(B)
    return M,t,d1,d2
def align(A,B,step=6,iters=25,mirror_opts=(False,True)):
    """A: image pts (x,y_up), B: reference pts. Returns dict per mirror with best score."""
    An,_,_=norm(A); Bn,_,_=norm(B); tree=cKDTree(Bn); out={}
    for m in mirror_opts:
        Am=An*np.array([-1,1]) if m else An
        best=None
        for th in np.radians(np.arange(0,360,step)):
            R=np.array([[np.cos(th),-np.sin(th)],[np.sin(th),np.cos(th)]])
            M,t,d1,d2=icp(Am,Bn,R,np.zeros(2),iters,treeB=tree)
            sc=(d1.mean()+d2.mean())/2
            if best is None or sc<best['score']:
                best=dict(score=sc,M=M,t=t,d1=d1,d2=d2,rot=float(np.degrees(np.arctan2(M[1,0],M[0,0]))))
        # affine refinement from best
        Ma,ta,e1,e2=icp(Am,Bn,best['M'],best['t'],30,affine=True,treeB=tree)
        sv=np.linalg.svd(Ma,compute_uv=False)
        best.update(aff_score=(e1.mean()+e2.mean())/2, aniso=float(sv[0]/sv[1]),
                    p95=float(np.percentile(np.r_[best['d1'],best['d2']],95)), hmax=float(max(best['d1'].max(),best['d2'].max())),
                    Am=Am,Bn=Bn)
        out[m]=best
    return out
