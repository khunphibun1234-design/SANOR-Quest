'use strict';window.HomeEngine=function(canvas){const gl=canvas.getContext('webgl',{antialias:true,alpha:false});const soft=gl?null:canvas.getContext('2d');let faces=[],vp;if(!gl&&!soft)throw Error('Canvas unavailable');
const vs=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;uniform mat4 uVP;uniform mat4 uModel;uniform float uTime;uniform float uWater;varying vec3 vColor;varying float vDepth;void main(){vec3 p=aPosition;if(uWater>0.5){p.y+=sin(p.x*.65+uTime*.7)*.08+cos(p.z*.8+uTime*.5)*.07;}vec4 world=uModel*vec4(p,1.);vec3 n=normalize(mat3(uModel)*aNormal);float light=.64+max(dot(n,normalize(vec3(-.5,1.,.6))),0.)*.36;vColor=aColor*light;gl_Position=uVP*world;vDepth=gl_Position.w;}`;
const fs=`precision mediump float;varying vec3 vColor;varying float vDepth;void main(){float fog=smoothstep(35.,85.,vDepth)*.65;gl_FragColor=vec4(mix(vColor,vec3(.89,.92,.86),fog),1.);}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
let program;const attrib={},uniform={};
if(gl){program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader linking failed');gl.useProgram(program);
for(const n of ['Position','Normal','Color']){attrib[n]=gl.getAttribLocation(program,'a'+n);gl.enableVertexAttribArray(attrib[n]);}
for(const n of ['VP','Model','Time','Water'])uniform[n]=gl.getUniformLocation(program,'u'+n);
gl.enable(gl.DEPTH_TEST);gl.clearColor(.89,.92,.86,1);}
const identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function mul(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
const sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const norm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);};
function lookAt(eye,target){const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
function model(x=0,y=0,z=0,ry=0,scale=1){const c=Math.cos(ry)*scale,s=Math.sin(ry)*scale;return new Float32Array([c,0,-s,0,0,scale,0,0,s,0,c,0,x,y,z,1]);}
function color(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);}
let vertices=[];
function tri(a,b,c,col){const n=norm(cross(sub(b,a),sub(c,a))),rgb=typeof col==='string'?color(col):col;for(const p of [a,b,c])vertices.push(...p,...n,...rgb);}
function box(x,y,z,w,h,d,col,ry=0){const c=Math.cos(ry),s=Math.sin(ry);const p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([a,b,e])=>[x+a*w/2*c+e*d/2*s,y+b*h/2,z-a*w/2*s+e*d/2*c]);for(const f of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]){tri(p[f[0]],p[f[1]],p[f[2]],col);tri(p[f[0]],p[f[2]],p[f[3]],col);}}
function cylinder(x,y,z,r1,r2,h,col,n=12){for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,A=[x+Math.cos(a)*r1,y-h/2,z+Math.sin(a)*r1],B=[x+Math.cos(b)*r1,y-h/2,z+Math.sin(b)*r1],C=[x+Math.cos(a)*r2,y+h/2,z+Math.sin(a)*r2],D=[x+Math.cos(b)*r2,y+h/2,z+Math.sin(b)*r2];tri(A,C,D,col);tri(A,D,B,col);tri([x,y+h/2,z],D,C,col);tri([x,y-h/2,z],A,B,col);}}
function ellipsoid(x,y,z,rx,ry,rz,col,segments=10,rings=6){function at(i,j){const a=i/segments*Math.PI*2,b=j/rings*Math.PI;return[x+Math.sin(b)*Math.cos(a)*rx,y+Math.cos(b)*ry,z+Math.sin(b)*Math.sin(a)*rz];}for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){tri(at(i,j),at(i+1,j+1),at(i+1,j),col);tri(at(i,j),at(i,j+1),at(i+1,j+1),col);}}
function mesh(layer=0){const data=new Float32Array(vertices);let buffer;if(gl){buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);}vertices=[];return{buffer,data,count:data.length/9,layer};}
function draw(m,mat=identity(),water=0){if(soft){softDraw(m,mat,water);return;}gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);gl.vertexAttribPointer(attrib.Position,3,gl.FLOAT,false,36,0);gl.vertexAttribPointer(attrib.Normal,3,gl.FLOAT,false,36,12);gl.vertexAttribPointer(attrib.Color,3,gl.FLOAT,false,36,24);gl.uniformMatrix4fv(uniform.Model,false,mat);gl.uniform1f(uniform.Water,water);gl.drawArrays(gl.TRIANGLES,0,m.count);}
function softDraw(m,mat,water){
 if(water)return;const transform=mul(vp,mat),d=m.data,W=canvas.width,H=canvas.height;
 for(let i=0;i<d.length;i+=27){const points=[];let depth=0,valid=true;
  for(let j=0;j<3;j++){const k=i+j*9,x=d[k],y=d[k+1],z=d[k+2],w=transform[3]*x+transform[7]*y+transform[11]*z+transform[15];if(w<=.1){valid=false;break;}points.push([(transform[0]*x+transform[4]*y+transform[8]*z+transform[12])/w*W/2+W/2,-(transform[1]*x+transform[5]*y+transform[9]*z+transform[13])/w*H/2+H/2]);depth+=w;}
  if(!valid)continue;const winding=(points[1][0]-points[0][0])*(points[2][1]-points[0][1])-(points[1][1]-points[0][1])*(points[2][0]-points[0][0]);if(points.every(p=>p[0]<-10)||points.every(p=>p[0]>W+10)||points.every(p=>p[1]<-10)||points.every(p=>p[1]>H+10))continue;
  const n=[mat[0]*d[i+3]+mat[8]*d[i+5],d[i+4],mat[2]*d[i+3]+mat[10]*d[i+5]];const light=.64+Math.max(0,(-.5*n[0]+n[1]+.6*n[2])/1.269)*.36;const fog=Math.max(0,Math.min(.5,(depth/3-35)/65));const rgb=[0,1,2].map(k=>Math.round((d[i+6+k]*light*(1-fog)+[.65,.84,.86][k]*fog)*255));const maxY=Math.max(d[i+1],d[i+10],d[i+19])+mat[13];const layer=m.layer;faces.push({points,layer,depth:depth/3,color:'rgb('+rgb.join(',')+')'});
 }
}
function softFlush(){faces.sort((a,b)=>a.layer-b.layer||b.depth-a.depth);soft.lineWidth=.65;for(const f of faces){soft.fillStyle=f.color;soft.strokeStyle=f.color;soft.beginPath();soft.moveTo(...f.points[0]);soft.lineTo(...f.points[1]);soft.lineTo(...f.points[2]);soft.closePath();soft.fill();soft.stroke();}}

function resize(){const r=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(innerWidth*r);canvas.height=Math.round(innerHeight*r);if(gl)gl.viewport(0,0,canvas.width,canvas.height);}
function begin(matrix){vp=matrix;if(gl){gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(uniform.VP,false,vp);gl.uniform1f(uniform.Time,0);}else{faces=[];soft.fillStyle='#e3eadc';soft.fillRect(0,0,canvas.width,canvas.height);}}
function project(x,y,z){const p=[x,y,z,1],c=[0,0,0,0];for(let i=0;i<4;i++)for(let k=0;k<4;k++)c[i]+=vp[k*4+i]*p[k];return{x:(c[0]/c[3]*.5+.5)*innerWidth,y:(-.5*c[1]/c[3]+.5)*innerHeight,visible:c[3]>0&&Math.abs(c[0]/c[3])<1.1&&Math.abs(c[1]/c[3])<1.1};}
resize();vp=identity();return{box,cylinder,ellipsoid,tri,mesh,draw,resize,begin,project,end:()=>{if(soft)softFlush();},model,mul,lookAt,perspective,isGPU:!!gl};};
