// SANOR QUEST · shared 3D engine (Three.js r187)
// Build: see src/README.md. Output: shared/sq-three.js (bundled, minified, exposes window.SQ3).
//
// Every 3D map uses this one engine. It offers two layers:
//  1. makeWorldAdapter(scene): the small immediate-mode API the map layouts are written in
//     (box / cylinder / ellipsoid / tri / mesh / draw / model), turned into real Three.js meshes.
//  2. createEngine(canvas, options): a full renderer (lights, shadows, fog, auto quality) with the
//     same API as the old hand-written WebGL engines, so a map only swaps its constructor.
import {WebGLRenderer,Scene,PerspectiveCamera,Group,Mesh,Color,Vector3,Vector2,Matrix4,MeshStandardMaterial,MeshBasicMaterial,
 BoxGeometry,CylinderGeometry,SphereGeometry,CapsuleGeometry,TorusGeometry,LatheGeometry,CanvasTexture,BufferGeometry,Float32BufferAttribute,
 HemisphereLight,DirectionalLight,Fog,PMREMGenerator,NeutralToneMapping,SRGBColorSpace,PCFSoftShadowMap,DoubleSide,RepeatWrapping} from 'three';
import {RoundedBoxGeometry} from 'three-addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three-addons/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three-addons/utils/BufferGeometryUtils.js';
import {createCast,LOOKS} from './characters.js';

const THREE={WebGLRenderer,Scene,PerspectiveCamera,Group,Mesh,Color,Vector3,Vector2,Matrix4,MeshStandardMaterial,MeshBasicMaterial,
 BoxGeometry,CylinderGeometry,SphereGeometry,CapsuleGeometry,TorusGeometry,LatheGeometry,CanvasTexture,BufferGeometry,Float32BufferAttribute,
 HemisphereLight,DirectionalLight,Fog,PMREMGenerator,NeutralToneMapping,SRGBColorSpace,PCFSoftShadowMap,DoubleSide,RepeatWrapping};

function webglAvailable(){try{const c=document.createElement('canvas');return !!(window.WebGLRenderingContext&&(c.getContext('webgl2')||c.getContext('webgl')));}catch{return false;}}

// ---------- surface patterns, computed in world space inside the standard material ----------
const PATTERN_GLSL=`
float sqHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float sqNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(sqHash(i),sqHash(i+vec2(1,0)),f.x),mix(sqHash(i+vec2(0,1)),sqHash(i+vec2(1,1)),f.x),f.y);}
float sqPattern(int m,vec3 p,vec3 n){
 if(m==1){vec2 q=abs(n.y)>.5?p.xz:(abs(n.x)>.5?p.zy:p.xy);float g=sqNoise(vec2(q.x*1.2,q.y*26.))*.6+sqNoise(vec2(q.x*3.,q.y*60.))*.4;float plank=step(.97,fract(q.y*2.6));float id=sqHash(floor(vec2(q.x*.7+floor(q.y*2.6)*.37,q.y*2.6)));return .94+.07*g-plank*.14+(id-.5)*.08;}
 if(m==2){vec2 g=abs(fract(p.xz/.4)-.5);return 1.-step(.465,max(g.x,g.y))*.18+(sqHash(floor(p.xz/.4))-.5)*.05;}
 if(m==3){return .84+.24*(sqNoise(p.xz*3.)*.6+sqNoise(p.xz*14.)*.4);}
 if(m==4){return .95+.05*sin(p.x*90.)*sin(p.z*90.+p.y*90.)+(sqNoise(p.xz*8.)-.5)*.06;}
 if(m==5){return .97+.05*sqNoise(p.xy*6.+p.zz*6.);}
 return 1.;}`;
const matCache=new Map();
function stdMat(hex,pattern=0,opts={}){const key=hex+'|'+pattern+'|'+JSON.stringify(opts);if(matCache.has(key))return matCache.get(key);
 const rough=[.78,.62,.32,.95,.96,.9,.9,.35][pattern]??.78;
 const m=new MeshStandardMaterial({color:new Color(hex),roughness:rough,metalness:pattern===7?.25:0,...opts});
 if(pattern>0&&pattern<7){m.onBeforeCompile=sh=>{
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSqPos;varying vec3 vSqN;').replace('#include <project_vertex>','#include <project_vertex>\nvSqPos=(modelMatrix*vec4(transformed,1.)).xyz;vSqN=normalize(mat3(modelMatrix)*objectNormal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vSqPos;varying vec3 vSqN;'+PATTERN_GLSL).replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=sqPattern('+pattern+',vSqPos,normalize(vSqN));');};
  m.customProgramCacheKey=()=>'sq'+pattern;}
 matCache.set(key,m);return m;}
// Water: the same gentle wave the old engines did in their vertex shader.
const waterTime={value:0};const waterCache=new Map();
function waterMat(hex){if(waterCache.has(hex))return waterCache.get(hex);const m=new MeshStandardMaterial({color:new Color(hex),roughness:.25,metalness:0,transparent:true,opacity:.94,side:DoubleSide});
 m.onBeforeCompile=sh=>{sh.uniforms.uSqTime=waterTime;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uSqTime;').replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.y+=sin(transformed.x*.65+uSqTime*.7)*.08+cos(transformed.z*.8+uSqTime*.5)*.07;');};
 m.customProgramCacheKey=()=>'sqwater';waterCache.set(hex,m);return m;}
const WOOD=['#cba477','#a78462','#c19a70','#bc9873','#b99571','#ccac82','#b28c65','#d6ae83','#8e7052','#ceaa80','#e6c29a','#a48661','#e5cda5','#dfd7c2','#d6be98','#e1c9b3','#b99169','#c49764','#825c43','#c9a27a','#b98f66','#e9d3ad','#9c7858'];
const PAT={'#a9bf8b':3,'#c9bd98':3,'#a3c887':3,'#afd090':3,'#d8e3d3':2,'#c9dacb':2,'#c7d8c8':2,'#f6ead4':5,'#f3e7d0':5,'#f0e3c9':5,'#e4d3ac':5,'#f9edd0':5,'#f4e3bd':5,'#6c9480':4,'#739c85':4,'#88a58b':4,'#b9c5a0':4,'#96b8bb':4,'#fcf2dd':4,'#fff7e3':4,'#d8a482':4,'#fff5dc':5,'#496961':7,'#91afa4':7,'#b0b9a6':7,'#e9eddf':7};for(const c of WOOD)PAT[c]=1;

// ---------- adapter: the immediate-mode layout API, backed by merged Three.js meshes ----------
function makeWorldAdapter(scene){
 let pending=[],tris=new Map();const registered=[];
 const push=(geo,col,two=false)=>pending.push({geo,col:col.toLowerCase(),two});
 const color=c=>typeof c==='string'?c.toLowerCase():'#'+new Color(c[0],c[1],c[2]).getHexString();
 function triGeometry(col,list){const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(list,3));g.computeVertexNormals();return g;}
 const adapter={
  box(x,y,z,w,h,d,col,ry=0){const m=Math.min(w,h,d);const g=m<.05?new BoxGeometry(w,h,d):new RoundedBoxGeometry(w,h,d,2,Math.min(.04,m*.3));g.rotateY(ry);g.translate(x,y,z);push(g,col);},
  cylinder(x,y,z,r1,r2,h,col,n=12){const g=new CylinderGeometry(r2,r1,h,Math.max(n*2,16));g.translate(x,y,z);push(g,col);},
  ellipsoid(x,y,z,rx,ry,rz,col,seg=10,rings=6){const g=new SphereGeometry(1,Math.max(seg*2,16),Math.max(rings*2,10));g.scale(rx,ry,rz);g.translate(x,y,z);push(g,col);},
  // Raw triangles (roofs, sparkles, the ocean). The old layouts mix windings, so these are drawn double-sided.
  tri(a,b,c,col){const k=color(col);if(!tris.has(k))tris.set(k,[]);tris.get(k).push(...a,...b,...c);},
  mesh(){for(const [col,list] of tris)push(triGeometry(col,list),col,true);tris=new Map();
   const by=new Map();for(const p of pending){const k=p.col+(p.two?'|2':'');if(!by.has(k))by.set(k,{col:p.col,two:p.two,geos:[]});by.get(k).geos.push(p.geo);}pending=[];
   const group=new Group();for(const {col,two,geos} of by.values()){const merged=mergeGeometries(geos.map(g=>{if(g.attributes.uv)g.deleteAttribute('uv');return g.index?g.toNonIndexed():g;}),false);const mesh=new Mesh(merged,stdMat(col,PAT[col]||0,two?{side:DoubleSide}:{}));mesh.castShadow=mesh.receiveShadow=true;mesh.userData.col=col;group.add(mesh);}
   const handle={group,pool:[],used:0,water:false};registered.push(handle);return handle;},
  draw(h,mat,water=0){
   if(water&&!h.water){h.water=true;for(const m of h.group.children){m.material=waterMat(m.userData.col);m.castShadow=false;}}
   if(!mat){if(!h.group.parent)scene.add(h.group);h.group.visible=true;return;} // static mesh, drawn in place
   if(mat[12]>200)return; // placeholder avatars parked far away
   let o=h.pool[h.used];if(!o){o=h.group.clone();o.matrixAutoUpdate=false;h.pool.push(o);scene.add(o);}
   h.used++;o.matrix.fromArray(mat);o.matrixWorldNeedsUpdate=true;o.visible=true;},
  model(x=0,y=0,z=0,ry=0,s=1){const c=Math.cos(ry)*s,n=Math.sin(ry)*s;return new Float32Array([c,0,-n,0,0,s,0,0,n,0,c,0,x,y,z,1]);}};
 // Each frame starts with everything hidden; draw() calls show what the map wants this frame.
 function beginFrame(){for(const h of registered){h.group.visible=false;for(const o of h.pool)o.visible=false;h.used=0;}}
 return{adapter,beginFrame,registered};}
const IDENTITY=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);

// ---------- small matrix helpers (column-major, same as the old engines) ----------
function mul(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
const sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const norm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);};
function lookAt(eye,target){const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}

// ---------- the engine ----------
function createEngine(canvas,o={}){
 const opt={background:'#e3eadc',fog:[45,110],pixelRatio:1.75,shadowCenter:[0,0,0],shadowRadius:14,exposure:.95,sun:2.3,...o};
 const renderer=new WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 // ?quality=high keeps full quality; ?quality=low starts at the lightest setting (very weak devices, automated tests)
 const FIXED_Q=/quality=(high|low)/.test(location.search),LOW_Q=/quality=low/.test(location.search);
 // budget phones (≤4 GB memory or ≤4 cores) start lighter: 1× resolution and smaller shadows
 const BUDGET=!FIXED_Q&&((navigator.deviceMemory&&navigator.deviceMemory<=4)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4));
 let pixelCap=LOW_Q?.5:BUDGET?1:Math.min(devicePixelRatio||1,opt.pixelRatio);
 renderer.setPixelRatio(pixelCap);renderer.setSize(innerWidth,innerHeight,false);
 renderer.toneMapping=NeutralToneMapping;renderer.toneMappingExposure=opt.exposure;renderer.outputColorSpace=SRGBColorSpace;
 renderer.shadowMap.enabled=!LOW_Q;renderer.shadowMap.type=PCFSoftShadowMap;renderer.setClearColor(new Color(opt.background),1);
 const scene=new Scene();scene.fog=new Fog(new Color(opt.background),opt.fog[0],opt.fog[1]);
 const pmrem=new PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.22;
 scene.add(new HemisphereLight(0xdfeaf7,0xa98f68,.8));
 const sun=new DirectionalLight(0xffe9c7,opt.sun);sun.castShadow=true;sun.shadow.mapSize.set(BUDGET?1024:2048,BUDGET?1024:2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;sun.shadow.radius=4;
 scene.add(sun,sun.target);const SUN_DIR=new Vector3(-.45,1,.42).normalize();
 function setShadow(c,r){sun.target.position.set(...c);sun.position.set(c[0]+SUN_DIR.x*40,c[1]+SUN_DIR.y*40,c[2]+SUN_DIR.z*40);const s=sun.shadow.camera;s.left=-r;s.right=r;s.top=r;s.bottom=-r;s.near=5;s.far=90;s.updateProjectionMatrix();}
 setShadow(opt.shadowCenter,opt.shadowRadius);
 const camera=new PerspectiveCamera();camera.matrixAutoUpdate=false;
 const {adapter,beginFrame}=makeWorldAdapter(scene);
 let vp=IDENTITY,lastView=null,lastProj=null,prev=0,slowT=0,slowN=0,frames=0;const qualityLog=[];
 const view4=new Matrix4(),proj4=new Matrix4();
 function lowerQuality(){if(pixelCap>1.25){pixelCap=1;renderer.setPixelRatio(1);return'resolution';}if(sun.shadow.mapSize.x>1024){sun.shadow.mapSize.set(1024,1024);sun.shadow.map?.dispose();sun.shadow.map=null;return'shadow-size';}if(renderer.shadowMap.enabled){renderer.shadowMap.enabled=false;scene.traverse(x=>{if(x.material)x.material.needsUpdate=true;});return'shadows';}return null;}
 function resize(){renderer.setSize(innerWidth,innerHeight,false);}
 addEventListener('resize',resize);
 const api={...adapter,mul,lookAt:(e,t)=>(lastView=lookAt(e,t)),perspective:(f,a,n,fa)=>(lastProj=perspective(f,a,n,fa)),
  resize,setShadow,setTime(t){waterTime.value=t;},isGPU:true,renderer,scene,THREE,
  begin(matrix){vp=matrix;
   // The maps pass mul(projection, view). When we saw both halves this frame, give Three.js the real camera
   // (correct fog and shadows); otherwise fall back to treating the whole matrix as the projection.
   if(lastProj&&lastView){view4.fromArray(lastView);proj4.fromArray(lastProj);}else{view4.identity();proj4.fromArray(matrix);}
   camera.matrix.copy(view4).invert();camera.matrixWorld.copy(camera.matrix);camera.matrixWorldInverse.copy(view4);
   camera.projectionMatrix.copy(proj4);camera.projectionMatrixInverse.copy(proj4).invert();
   lastProj=lastView=null;beginFrame();},
  end(){const now=performance.now();if(prev){const ms=now-prev;frames++;if(frames>120&&!FIXED_Q){slowT+=ms;slowN++;if(slowN>=90){if(slowT/slowN>34){/* below ~30 fps: step down */const q=lowerQuality();if(q)qualityLog.push(q);}slowT=0;slowN=0;}}}prev=now;
   renderer.render(scene,camera);},
  project(x,y,z){const p=[x,y,z,1],c=[0,0,0,0];for(let i=0;i<4;i++)for(let k=0;k<4;k++)c[i]+=vp[k*4+i]*p[k];return{x:(c[0]/c[3]*.5+.5)*innerWidth,y:(-.5*c[1]/c[3]+.5)*innerHeight,visible:c[3]>0&&Math.abs(c[0]/c[3])<1.1&&Math.abs(c[1]/c[3])<1.2};},
  status:()=>({renderer:'three.js r187',quality:{ratio:pixelCap,shadows:renderer.shadowMap.enabled,shadowSize:sun.shadow.mapSize.x},qualityLog,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles})};
 return api;}

window.SQ3={THREE,createCast,LOOKS,RoundedBoxGeometry,RoomEnvironment,mergeGeometries,stdMat,PAT,makeWorldAdapter,createEngine,webglAvailable,math:{mul,perspective,lookAt}};
