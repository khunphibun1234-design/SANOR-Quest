# Removes the compass badge painted into the log-in artwork (design/source/login.webp), so the log-in and register
# pages can show the real logo above the form. The gap is filled with the river landscape from the splash artwork
# (design/source/splash.webp, same painting style), colour-matched to its surroundings.
# Writes images/brand/welcome.webp (cropped just above the form card).   python3 design/make-welcome.py [preview.png]
import cv2,numpy as np,sys
art=cv2.imread('design/source/login.webp')[:884];logo=cv2.imread('design/source/logo.webp',cv2.IMREAD_UNCHANGED)
ys,xs=np.where(logo[:,:,3]>10);logo=logo[ys.min():ys.max()+1,xs.min():xs.max()+1]
best=None
for w in range(340,520,4):                      # where is the painted badge, and how big?
  h=round(w*logo.shape[0]/logo.shape[1]);l=cv2.resize(logo,(w,h),interpolation=cv2.INTER_AREA)
  r=cv2.matchTemplate(art,l[:,:,:3],cv2.TM_CCORR_NORMED,mask=((l[:,:,3]>128)*255).astype(np.uint8));_,v,_,loc=cv2.minMaxLoc(r)
  if not best or v>best[0]:best=(v,w,h,loc)
_,w,h,(x,y)=best;l=cv2.resize(logo,(w,h),interpolation=cv2.INTER_AREA);hh=min(h,art.shape[0]-y)
mask=np.zeros(art.shape[:2],np.uint8);mask[y:y+hh,x:x+w]=(l[:hh,:,3]>20).astype(np.uint8)*255
mask=cv2.dilate(mask,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(31,31)))
ys,xs=np.where(mask>0);x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
src=cv2.imread('design/source/splash.webp')[868:1225,575:941]       # river, bridge, stilt houses
W=x1-x0+40;H=y1-y0+20;sc=max(W/src.shape[1],H/src.shape[0])
src=cv2.resize(src,None,fx=sc,fy=sc,interpolation=cv2.INTER_CUBIC)[:H,:W]
px,py=max(0,x0-20),y0-10;patch=art.copy();hh,ww=min(H,art.shape[0]-py),min(W,art.shape[1]-px);patch[py:py+hh,px:px+ww]=src[:hh,:ww]
ring=(cv2.dilate(mask,np.ones((61,61),np.uint8))>0)&(mask==0);m=mask>0
la=cv2.cvtColor(art,cv2.COLOR_BGR2Lab).astype(np.float32);lp=cv2.cvtColor(patch,cv2.COLOR_BGR2Lab).astype(np.float32)
for c in range(3):lp[...,c][m]=(lp[...,c][m]-lp[...,c][m].mean())/(lp[...,c][m].std()+1e-6)*la[...,c][ring].std()*.9+la[...,c][ring].mean()
patch=cv2.cvtColor(np.clip(lp,0,255).astype(np.uint8),cv2.COLOR_Lab2BGR)
soft=cv2.GaussianBlur(cv2.dilate(mask,np.ones((9,9),np.uint8)).astype(np.float32)/255,(0,0),11)[...,None]
out=np.clip(art*(1-soft)+patch*soft,0,255).astype(np.uint8)
cv2.imwrite('images/brand/welcome.webp',out,[cv2.IMWRITE_WEBP_QUALITY,80])
if len(sys.argv)>1:cv2.imwrite(sys.argv[1],out)
print('badge removed at',x,y,w,h,'(match %.3f)'%best[0])
