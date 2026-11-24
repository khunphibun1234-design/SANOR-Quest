'use strict';
// SANOR QUEST engine 2: same API as HomeEngine, plus warm sky light, real shadows,
// procedural surface patterns (wood, tile, grass, fabric, plaster) and glowing materials.
// Materials are chosen per triangle: engine.material(id) for what follows, or a colour map.
window.HomeEngine2=function(canvas,opts={}){
const gl=canvas.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:false});
const soft=gl?null:canvas.getContext('2d');let faces=[],vp;if(!gl&&!soft)throw Error('Canvas unavailable');
const colorMaterial=opts.colorMaterial||{};let currentMaterial=-1;
const STRIDE=10;
const MAT={plain:0,wood:1,tile:2,grass:3,fabric:4,plaster:5,cloth:6,metal:7,glow:9};
// ---------- shaders ----------
const hp='#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
const vs=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;attribute float aMat;
uniform mat4 uVP;uniform mat4 uModel;uniform mat4 uLightVP;
varying vec3 vColor;varying vec3 vNormal;varying vec3 vWorld;varying vec4 vShadow;varying float vMat;varying float vDepth;
void main(){vec4 w=uModel*vec4(aPosition,1.);vWorld=w.xyz;vNormal=normalize(mat3(uModel)*aNormal);vColor=aColor;vMat=aMat;
vShadow=uLightVP*w;gl_Position=uVP*w;vDepth=gl_Position.w;}`;
const fs=hp+`varying vec3 vColor;varying vec3 vNormal;varying vec3 vWorld;varying vec4 vShadow;varying float vMat;varying float vDepth;
uniform sampler2D uShadowMap;uniform vec3 uSun;uniform float uShadowOn;uniform vec3 uFog;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float unpack(vec4 c){return dot(c,vec4(1.,1./255.,1./65025.,1./16581375.));}
float shadow(){if(uShadowOn<.5)return 1.;vec3 p=vShadow.xyz/vShadow.w*.5+.5;if(p.x<0.||p.x>1.||p.y<0.||p.y>1.||p.z>1.)return 1.;
float bias=.0018+.002*(1.-max(dot(normalize(vNormal),uSun),0.));float s=0.;float t=1./1024.;
for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float d=unpack(texture2D(uShadowMap,p.xy+vec2(float(x),float(y))*t*1.3));s+=p.z-bias>d?0.:1.;}return s/9.;}
void main(){vec3 n=normalize(vNormal),c=vColor,p=vWorld;float m=floor(vMat+.5);
if(m>8.5){gl_FragColor=vec4(c*1.12,1.);return;}
if(m>.5&&m<1.5){vec2 q=abs(n.y)>.5?p.xz:(abs(n.x)>.5?p.zy:p.xy);
 float g=noise(vec2(q.x*1.2,q.y*26.))*.6+noise(vec2(q.x*3.,q.y*60.))*.4;float plank=step(.97,fract(q.y*2.6));float id=hash(floor(vec2(q.x*.7+floor(q.y*2.6)*.37,q.y*2.6)));c*=.95+.05*g-plank*.12+(id-.5)*.07;}
else if(m>1.5&&m<2.5){vec2 g=abs(fract(p.xz/.4)-.5);float grout=step(.465,max(g.x,g.y));c*=1.-grout*.16+(hash(floor(p.xz/.4))-.5)*.05;c+=pow(max(dot(reflect(-uSun,n),vec3(0,.8,.6)),0.),24.)*.12;}
else if(m>2.5&&m<3.5){float k=noise(p.xz*3.)*.6+noise(p.xz*14.)*.4;c*=.86+.22*k;c.g*=1.02;}
else if(m>3.5&&m<4.5){float w=sin(p.x*90.)*sin(p.z*90.+p.y*90.);c*=.95+.05*w+(noise(p.xz*8.)-.5)*.06;}
else if(m>4.5&&m<5.5){c*=.97+.05*noise(p.xy*6.+p.zz*6.);}
else if(m>5.5&&m<6.5){vec2 g=step(.5,fract(p.xz*5.));float chk=abs(g.x-g.y);c=mix(c,c*vec3(.96,.82,.78),chk*.55+(g.x*g.y)*.25);}
else if(m>6.5&&m<7.5){c+=pow(max(dot(reflect(-uSun,n),vec3(.3,.8,.5)),0.),18.)*.35;}
float sh=shadow();float sun=max(dot(n,uSun),0.)*sh;
vec3 sky=vec3(.80,.86,.92),ground=vec3(.62,.56,.46);vec3 hemi=mix(ground,sky,n.y*.5+.5);
float ao=abs(n.y)<.5?mix(.78,1.,smoothstep(.2,1.,p.y)):1.;
vec3 lit=c*(hemi*.66*ao+vec3(1.,.93,.80)*sun*.6)+c*.05;
lit=mix(lit,lit*vec3(1.03,1.,.95),.5);
float fog=smoothstep(40.,95.,vDepth)*.7;gl_FragColor=vec4(mix(lit,uFog,fog),1.);}`;
const dvs=`attribute vec3 aPosition;uniform mat4 uLightVP;uniform mat4 uModel;void main(){gl_Position=uLightVP*uModel*vec4(aPosition,1.);}`;
const dfs=hp+`void main(){vec4 e=fract(gl_FragCoord.z*vec4(1.,255.,65025.,16581375.));e-=e.yzww*vec4(1./255.,1./255.,1./255.,0.);gl_FragColor=e;}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function program(v,f){const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,v));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('Shader linking failed');return p;}
let main,depth,fb,shadowTex,SM=1024,shadowsWanted=true;const A={},U={},DA={},DU={};
if(gl){main=program(vs,fs);depth=program(dvs,dfs);
 for(const n of ['Position','Normal','Color','Mat'])A[n]=gl.getAttribLocation(main,'a'+n);
 for(const n of ['VP','Model','LightVP','ShadowMap','Sun','ShadowOn','Fog'])U[n]=gl.getUniformLocation(main,'u'+n);
 DA.Position=gl.getAttribLocation(depth,'aPosition');for(const n of ['LightVP','Model'])DU[n]=gl.getUniformLocation(depth,'u'+n);
 shadowTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,shadowTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,SM,SM,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
 for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.NEAREST],[gl.TEXTURE_MAG_FILTER,gl.NEAREST],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);
 const rb=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,SM,SM);
 fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,shadowTex,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rb);
 if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)fb=null;gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);}
// ---------- math ----------
const identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function mul(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
function ortho(l,r,b,t,n,f){return new Float32Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]);}
const sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const norm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);};
function lookAt(eye,target){const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
function model(x=0,y=0,z=0,ry=0,scale=1){const c=Math.cos(ry)*scale,s=Math.sin(ry)*scale;return new Float32Array([c,0,-s,0,0,scale,0,0,s,0,c,0,x,y,z,1]);}
function rotX(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);}
function rotZ(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]);}
function translate(x,y,z){const m=identity();m[12]=x;m[13]=y;m[14]=z;return m;}
function color(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);}
// ---------- geometry ----------
let vertices=[];
function tri(a,b,c,col){const n=norm(cross(sub(b,a),sub(c,a))),rgb=typeof col==='string'?color(col):col;
 const mat=currentMaterial>=0?currentMaterial:(typeof col==='string'&&colorMaterial[col.toLowerCase()]!==undefined?colorMaterial[col.toLowerCase()]:0);
 for(const p of [a,b,c])vertices.push(...p,...n,...rgb,mat);}
function smoothTri(a,b,c,na,nb,nc,col){const rgb=typeof col==='string'?color(col):col,mat=currentMaterial>=0?currentMaterial:0;for(const [p,n] of [[a,na],[b,nb],[c,nc]])vertices.push(...p,...n,...rgb,mat);}
function box(x,y,z,w,h,d,col,ry=0){const c=Math.cos(ry),s=Math.sin(ry);const p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([a,b,e])=>[x+a*w/2*c+e*d/2*s,y+b*h/2,z-a*w/2*s+e*d/2*c]);
 for(const f of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]){tri(p[f[0]],p[f[1]],p[f[2]],col);tri(p[f[0]],p[f[2]],p[f[3]],col);}}
function cylinder(x,y,z,r1,r2,h,col,n=12){for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,A=[x+Math.cos(a)*r1,y-h/2,z+Math.sin(a)*r1],B=[x+Math.cos(b)*r1,y-h/2,z+Math.sin(b)*r1],C=[x+Math.cos(a)*r2,y+h/2,z+Math.sin(a)*r2],D=[x+Math.cos(b)*r2,y+h/2,z+Math.sin(b)*r2];
 const sl=(r1-r2)/h,na=norm([Math.cos(a),sl,Math.sin(a)]),nb=norm([Math.cos(b),sl,Math.sin(b)]);
 if(currentMaterial>=0||n>=14)smoothTri(A,C,D,na,na,nb,col),smoothTri(A,D,B,na,nb,nb,col);else{tri(A,C,D,col);tri(A,D,B,col);}
 tri([x,y+h/2,z],D,C,col);tri([x,y-h/2,z],A,B,col);}}
function ellipsoid(x,y,z,rx,ry,rz,col,segments=10,rings=6){function at(i,j){const a=i/segments*Math.PI*2,b=j/rings*Math.PI;return[x+Math.sin(b)*Math.cos(a)*rx,y+Math.cos(b)*ry,z+Math.sin(b)*Math.sin(a)*rz];}
 function nrm(i,j){const a=i/segments*Math.PI*2,b=j/rings*Math.PI;return norm([Math.sin(b)*Math.cos(a)/rx,Math.cos(b)/ry,Math.sin(b)*Math.sin(a)/rz]);}
 for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){smoothTri(at(i,j),at(i+1,j+1),at(i+1,j),nrm(i,j),nrm(i+1,j+1),nrm(i+1,j),col);smoothTri(at(i,j),at(i,j+1),at(i+1,j+1),nrm(i,j),nrm(i,j+1),nrm(i+1,j+1),col);}}
// rounded box: a box with bevelled vertical edges (good for furniture and bodies)
function rbox(x,y,z,w,h,d,col,r=.06,ry=0){box(x,y,z,w-2*r,h,d,col,ry);box(x,y,z,w,h,d-2*r,col,ry);const c=Math.cos(ry),s=Math.sin(ry);for(const [a,e] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const lx=a*(w/2-r),lz=e*(d/2-r);cylinder(x+lx*c+lz*s,y,z-lx*s+lz*c,r,r,h,col,8);}}
function mesh(layer=0){const data=new Float32Array(vertices);let buffer;if(gl){buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);}vertices=[];return{buffer,data,count:data.length/STRIDE,layer};}
function material(id){currentMaterial=typeof id==='string'?MAT[id]:id;}
// ---------- drawing ----------
let queue=[],sun=norm([-.45,1,.42]),shadowCenter=[0,0,0],shadowRadius=14,fogColor=[.89,.92,.86];
function draw(m,mat=identity(),water=0,noShadow=false){if(soft){softDraw(m,mat);return;}queue.push([m,mat,noShadow]);}
function bindMesh(m,attribs){gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);gl.vertexAttribPointer(attribs.Position,3,gl.FLOAT,false,STRIDE*4,0);if(attribs===A){gl.vertexAttribPointer(A.Normal,3,gl.FLOAT,false,STRIDE*4,12);gl.vertexAttribPointer(A.Color,3,gl.FLOAT,false,STRIDE*4,24);gl.vertexAttribPointer(A.Mat,1,gl.FLOAT,false,STRIDE*4,36);}}
function lightVP(){const eye=shadowCenter.map((v,i)=>v+sun[i]*40);return mul(ortho(-shadowRadius,shadowRadius,-shadowRadius,shadowRadius,5,80),lookAt(eye,shadowCenter));}
function flush(){const LVP=lightVP();
 if(fb&&shadowsWanted){gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.viewport(0,0,SM,SM);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(depth);
  for(const n of ['Normal','Color','Mat'])gl.disableVertexAttribArray(A[n]);gl.enableVertexAttribArray(DA.Position);gl.uniformMatrix4fv(DU.LightVP,false,LVP);
  for(const [m,mat,ns] of queue){if(ns)continue;bindMesh(m,DA);gl.uniformMatrix4fv(DU.Model,false,mat);gl.drawArrays(gl.TRIANGLES,0,m.count);}
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);}
 gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(main);
 for(const n of ['Position','Normal','Color','Mat'])gl.enableVertexAttribArray(A[n]);
 gl.uniformMatrix4fv(U.VP,false,vp);gl.uniformMatrix4fv(U.LightVP,false,LVP);gl.uniform3fv(U.Sun,sun);gl.uniform1f(U.ShadowOn,fb&&shadowsWanted?1:0);gl.uniform3fv(U.Fog,fogColor);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shadowTex);gl.uniform1i(U.ShadowMap,0);
 for(const [m,mat] of queue){bindMesh(m,A);gl.uniformMatrix4fv(U.Model,false,mat);gl.drawArrays(gl.TRIANGLES,0,m.count);}
 queue=[];}
function softDraw(m,mat){const transform=mul(vp,mat),d=m.data,W=canvas.width,H=canvas.height;
 for(let i=0;i<d.length;i+=STRIDE*3){const points=[];let depthSum=0,valid=true;
  for(let j=0;j<3;j++){const k=i+j*STRIDE,x=d[k],y=d[k+1],z=d[k+2],w=transform[3]*x+transform[7]*y+transform[11]*z+transform[15];if(w<=.1){valid=false;break;}points.push([(transform[0]*x+transform[4]*y+transform[8]*z+transform[12])/w*W/2+W/2,-(transform[1]*x+transform[5]*y+transform[9]*z+transform[13])/w*H/2+H/2]);depthSum+=w;}
  if(!valid)continue;if(points.every(p=>p[0]<-10)||points.every(p=>p[0]>W+10)||points.every(p=>p[1]<-10)||points.every(p=>p[1]>H+10))continue;
  const n=[mat[0]*d[i+3]+mat[4]*d[i+4]+mat[8]*d[i+5],mat[1]*d[i+3]+mat[5]*d[i+4]+mat[9]*d[i+5],mat[2]*d[i+3]+mat[6]*d[i+4]+mat[10]*d[i+5]],l=Math.hypot(...n)||1;
  const glow=d[i+9]>8.5,light=glow?1.1:.66+Math.max(0,(n[0]*sun[0]+n[1]*sun[1]+n[2]*sun[2])/l)*.4,fog=Math.max(0,Math.min(.5,(depthSum/3-40)/70));
  const rgb=[0,1,2].map(k=>Math.min(255,Math.round((d[i+6+k]*light*(1-fog)+fogColor[k]*fog)*255)));faces.push({points,layer:m.layer,depth:depthSum/3,color:'rgb('+rgb.join(',')+')'});}}
function softFlush(){faces.sort((a,b)=>a.layer-b.layer||b.depth-a.depth);soft.lineWidth=.65;for(const f of faces){soft.fillStyle=f.color;soft.strokeStyle=f.color;soft.beginPath();soft.moveTo(...f.points[0]);soft.lineTo(...f.points[1]);soft.lineTo(...f.points[2]);soft.closePath();soft.fill();soft.stroke();}}
let ratioCap=opts.maxPixelRatio||1.75;function resize(){const r=Math.min(devicePixelRatio||1,ratioCap);canvas.width=Math.round(innerWidth*r);canvas.height=Math.round(innerHeight*r);if(gl)gl.viewport(0,0,canvas.width,canvas.height);}
function begin(matrix){vp=matrix;if(gl)queue=[];else{faces=[];soft.clearRect(0,0,canvas.width,canvas.height);}}
function project(x,y,z){const p=[x,y,z,1],c=[0,0,0,0];for(let i=0;i<4;i++)for(let k=0;k<4;k++)c[i]+=vp[k*4+i]*p[k];return{x:(c[0]/c[3]*.5+.5)*innerWidth,y:(-.5*c[1]/c[3]+.5)*innerHeight,visible:c[3]>0&&Math.abs(c[0]/c[3])<1.1&&Math.abs(c[1]/c[3])<1.1};}
resize();vp=identity();
return{box,rbox,cylinder,ellipsoid,tri,mesh,material,draw,resize,begin,project,end:()=>{if(soft)softFlush();else flush();},
 shadowArea:(c,r)=>{shadowCenter=c;shadowRadius=r;},fog:c=>{fogColor=c;},lowerQuality:()=>{if(ratioCap>1.1){ratioCap=1;resize();return 'resolution';}if(shadowsWanted){shadowsWanted=false;return 'shadows';}return null;},quality:()=>({ratio:ratioCap,shadows:!!fb&&shadowsWanted}),model,mul,lookAt,perspective,rotX,rotZ,translate,isGPU:!!gl,get hasShadows(){return !!fb&&shadowsWanted;},MAT};
};
