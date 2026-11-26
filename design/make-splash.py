import cv2,numpy as np,sys
from PIL import Image,ImageFilter
S=sys.argv[1]
im=np.array(Image.open(S+'/images/2.webp').convert('RGB'))
h,w=im.shape[:2]
mask=np.zeros((h,w),np.uint8)
cv2.ellipse(mask,(476,1150),(250,238),0,0,360,255,-1)
cv2.rectangle(mask,(480,915),(600,990),255,-1)   # flag
cv2.ellipse(mask,(476,1300),(262,92),0,0,360,255,-1)   # QUEST banner
bgr=cv2.cvtColor(im,cv2.COLOR_RGB2BGR)
small=cv2.resize(bgr,(w//2,h//2));m2=cv2.resize(mask,(w//2,h//2))
inp=cv2.inpaint(small,m2,9,cv2.INPAINT_TELEA);inp=cv2.resize(inp,(w,h),interpolation=cv2.INTER_CUBIC)
inp=cv2.GaussianBlur(inp,(0,0),6)
soft=cv2.GaussianBlur(mask.astype(np.float32)/255,(0,0),14)[...,None]
out=bgr*(1-soft)+inp*soft
# warm glow rising from the book
yy,xx=np.mgrid[0:h,0:w];d=np.sqrt(((xx-476)/1.0)**2+((yy-1160)/1.05)**2)
g=np.clip(1-d/330,0,1)**1.6
glow=np.array([170,240,255],np.float32)  # BGR warm light
out=out*(1-g[...,None]*.75)+glow*(g[...,None]*.75)
out=np.clip(out,0,255).astype(np.uint8)
res=Image.fromarray(cv2.cvtColor(out,cv2.COLOR_BGR2RGB))
res.save(S+'/scratchpad/splash-bg.png')
b=Image.open(S+'/images/5.webp').convert('RGBA');bw=520;b=b.resize((bw,round(bw*b.height/b.width)),Image.LANCZOS)
c=res.copy().convert('RGBA');c.alpha_composite(b,(476-bw//2,1150-b.height//2));c.convert('RGB').save(S+'/scratchpad/splash-preview.png')
c.crop((120,820,840,1520)).convert('RGB').save(S+'/scratchpad/splash-preview-crop.png')
