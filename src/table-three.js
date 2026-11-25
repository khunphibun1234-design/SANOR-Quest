// SANOR QUEST · Alex's Table · Three.js version (path B)
// Build: see src/README.md. Output: home/table-three.js (bundled, minified).
import {WebGLRenderer,Scene,PerspectiveCamera,Group,Mesh,Color,Vector3,MeshStandardMaterial,MeshBasicMaterial,
 BoxGeometry,CylinderGeometry,SphereGeometry,CapsuleGeometry,TorusGeometry,LatheGeometry,Vector2,CanvasTexture,
 HemisphereLight,DirectionalLight,Fog,PMREMGenerator,NeutralToneMapping,SRGBColorSpace,PCFSoftShadowMap,DoubleSide,RepeatWrapping} from 'three';
import {RoundedBoxGeometry} from 'three-addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three-addons/environments/RoomEnvironment.js';
// Shared SANOR engine pieces (materials, surface patterns, world-layout adapter): see src/sq-three.js
import {stdMat,makeWorldAdapter} from 'sq3';

const $=id=>document.getElementById(id);
// ---------- renderer (fall back to the 2D page if WebGL is missing) ----------
let renderer;
try{renderer=new WebGLRenderer({canvas:$('scene'),antialias:true,alpha:true,powerPreference:'high-performance'});}
catch(e){location.replace('table.html'+location.search);throw e;}
const FIXED_Q=/quality=high/.test(location.search);
let pixelCap=Math.min(devicePixelRatio||1,2);
renderer.setPixelRatio(pixelCap);renderer.setSize(innerWidth,innerHeight,false);
renderer.toneMapping=NeutralToneMapping;renderer.toneMappingExposure=.92;renderer.outputColorSpace=SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=PCFSoftShadowMap;renderer.setClearColor(0x000000,0);
const scene=new Scene();scene.fog=new Fog(0xe4ece6,60,130);
const camera=new PerspectiveCamera(44,innerWidth/innerHeight,.1,200);
const pmrem=new PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.22;
scene.add(new HemisphereLight(0xdfeaf7,0xa98f68,.75));
const sun=new DirectionalLight(0xffe9c7,2.5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;sun.shadow.radius=4;
scene.add(sun,sun.target);const SUN_DIR=new Vector3(-.45,1,.42).normalize();
function fitShadow(c,r){sun.target.position.set(...c);sun.position.set(c[0]+SUN_DIR.x*30,c[1]+SUN_DIR.y*30,c[2]+SUN_DIR.z*30);const s=sun.shadow.camera;s.left=-r;s.right=r;s.top=r;s.bottom=-r;s.near=5;s.far=70;s.updateProjectionMatrix();}

// ---------- the shared adapter lets the world.js layout build Three.js meshes ----------
const {adapter,beginFrame:beginWorldFrame}=makeWorldAdapter(scene);
const W=window.buildHomeWorld(adapter);

// ---------- native props ----------
const P=(g,m,cast=true)=>{const o=new Mesh(g,m);o.castShadow=cast;o.receiveShadow=true;return o;};
const lathe=(pts,seg=40)=>new LatheGeometry(pts.map(([x,y])=>new Vector2(x,y)),seg);
const ceramic=c=>new MeshStandardMaterial({color:c,roughness:.28,metalness:0});
const steel=new MeshStandardMaterial({color:0xcfd6d4,roughness:.22,metalness:.95});
function sideboard(){const g=new Group(),wood=stdMat('#c9a27a',1),top=stdMat('#e9d3ad',1);
 const body=P(new RoundedBoxGeometry(2.9,.7,.42,3,.05),wood);body.position.set(2.7,.6,-1.55);
 const slab=P(new RoundedBoxGeometry(3,.06,.5,2,.02),top);slab.position.set(2.7,.97,-1.55);g.add(body,slab);
 for(const x of [1.75,2.7,3.65]){const door=P(new RoundedBoxGeometry(.84,.5,.03,2,.012),stdMat('#b98f66',1));door.position.set(x,.62,-1.33);const knob=P(new SphereGeometry(.035,12,8),steel);knob.position.set(x,.79,-1.3);g.add(door,knob);}
 W.colliders.push({x:2.7,z:-1.55,w:3,d:.5});return g;}
scene.add(sideboard());
function makeItem(name){const g=new Group();
 if(name==='plate'){g.add(P(lathe([[0,0],[.14,0],[.17,.008],[.21,.026],[.215,.032],[.205,.033],[.16,.016],[0,.016]]),ceramic(0xfbf7ee)));const rim=P(new TorusGeometry(.207,.005,6,48),ceramic(0x5f8f86),false);rim.rotation.x=Math.PI/2;rim.position.y=.031;g.add(rim);}
 if(name==='bowl'){g.add(P(lathe([[0,0],[.08,0],[.09,.01],[.15,.08],[.172,.15],[.165,.155],[.14,.092],[.08,.035],[0,.035]]),new MeshStandardMaterial({color:0x3f7680,roughness:.3,side:DoubleSide})));}
 if(name==='glass'){g.add(P(lathe([[0,0],[.075,0],[.085,.22],[.08,.22],[.068,.012],[0,.012]],32),new MeshStandardMaterial({color:0xe6f6f8,roughness:.04,metalness:0,transparent:true,opacity:.42,side:DoubleSide})));
  const w=P(new CylinderGeometry(.077,.068,.15,28),new MeshStandardMaterial({color:0x4fb2cf,roughness:.1,transparent:true,opacity:.85}),false);w.position.y=.087;w.name='water';w.visible=false;g.add(w);}
 if(name==='water'){g.add(P(lathe([[0,0],[.1,0],[.115,.06],[.11,.22],[.085,.3],[.09,.33],[.08,.33],[.075,.3],[0,.3]]),new MeshStandardMaterial({color:0x5f9fb5,roughness:.32})));const h=P(new TorusGeometry(.075,.018,8,24,Math.PI),new MeshStandardMaterial({color:0x4d8799,roughness:.32}));h.rotation.z=-Math.PI/2;h.position.set(.11,.18,0);g.add(h);}
 if(name==='fork'){const s=P(new BoxGeometry(.03,.012,.2),steel);s.position.set(0,.01,.05);g.add(s);const b=P(new BoxGeometry(.06,.012,.03),steel);b.position.set(0,.01,-.06);g.add(b);for(const x of [-.022,0,.022]){const t=P(new BoxGeometry(.009,.01,.08),steel);t.position.set(x,.01,-.11);g.add(t);}}
 if(name==='spoon'){const s=P(new BoxGeometry(.026,.012,.2),steel);s.position.set(0,.012,.07);g.add(s);const b=P(new SphereGeometry(1,20,12),steel);b.scale.set(.055,.02,.075);b.position.set(0,.02,-.08);g.add(b);}
 scene.add(g);return g;}
const names=['garden','bedroom','kitchen','table','plate','fork','bowl','spoon','glass','water'];
const itemObj={};for(const n of ['plate','fork','bowl','spoon','glass','water'])itemObj[names.indexOf(n)]=makeItem(n);
const checker=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#f8f0de';x.fillRect(0,0,128,128);x.fillStyle='rgba(222,140,120,.45)';for(let i=0;i<8;i++){x.fillRect(i*16,0,8,128);x.fillRect(0,i*16,128,8);}const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;t.wrapS=t.wrapT=RepeatWrapping;t.repeat.set(2.4,2.4);return t;})();
const cloth=new Group();{const top=P(new CylinderGeometry(.77,.77,.012,64),new MeshStandardMaterial({map:checker,roughness:.95}));const skirt=P(new CylinderGeometry(.775,.78,.12,64,1,true),new MeshStandardMaterial({map:checker,roughness:.95,side:DoubleSide}));skirt.position.y=-.06;cloth.add(top,skirt);cloth.position.set(2.7,1.036,1.05);cloth.visible=false;scene.add(cloth);}
const food=new Group();{const rice=P(new SphereGeometry(1,24,12),ceramic(0xfbf8ef));rice.scale.set(.1,.045,.09);rice.position.set(2.3,1.07,1.42);
 const egg=P(new CylinderGeometry(.06,.065,.012,24),ceramic(0xfffdf6));egg.position.set(2.37,1.1,1.38);const yolk=P(new SphereGeometry(.026,16,10),ceramic(0xf6b93b));yolk.scale.y=.6;yolk.position.set(2.37,1.112,1.38);
 const soup=P(new CylinderGeometry(.148,.148,.008,32),new MeshStandardMaterial({color:0xe58f4a,roughness:.15}),false);soup.position.set(2.85,1.17,1.6);
 const bread=P(new SphereGeometry(1,20,12),new MeshStandardMaterial({color:0xc98a4b,roughness:.7}));bread.scale.set(.17,.09,.1);bread.position.set(2.7,1.17,1.05);food.add(rice,egg,yolk,soup,bread);food.visible=false;scene.add(food);}
// glowing choice rings and sparkles
const ringMat=new MeshBasicMaterial({color:0xffc94d,toneMapped:false,transparent:true,opacity:.95});
const ringBig=new TorusGeometry(1,.032,10,64),ringSmall=new TorusGeometry(1,.1,8,40);
const rings=[0,1,2].map(()=>{const m=new Mesh(ringBig,ringMat);m.rotation.x=Math.PI/2;m.visible=false;scene.add(m);return m;});
const sparkMat=new MeshBasicMaterial({color:0xffe07a,toneMapped:false}),sparkGeo=new SphereGeometry(.045,8,6);
const sparkPool=Array.from({length:40},()=>{const m=new Mesh(sparkGeo,sparkMat);m.visible=false;scene.add(m);return m;});

// ---------- characters ----------
function person(shirt,pants,hair,skin,long){const root=new Group(),mat=c=>new MeshStandardMaterial({color:c,roughness:.8}),skinM=mat(skin),shirtM=mat(shirt),pantsM=mat(pants),hairM=mat(hair);
 const legs=[-1,1].map(s=>{const pivot=new Group();pivot.position.set(s*.12,.62,0);const leg=P(new CapsuleGeometry(.1,.36,6,14),pantsM);leg.position.y=-.27;const shoe=P(new SphereGeometry(1,16,10),mat('#3d4a44'));shoe.scale.set(.11,.07,.16);shoe.position.set(0,-.56,.05);pivot.add(leg,shoe);root.add(pivot);return pivot;});
 const torso=P(new CapsuleGeometry(.26,.34,8,20),shirtM);torso.scale.set(1,1,.82);torso.position.y=.95;const belt=P(new CylinderGeometry(.245,.25,.08,24),pantsM);belt.position.y=.66;const neck=P(new CylinderGeometry(.07,.07,.12,12),skinM);neck.position.y=1.28;root.add(torso,belt,neck);
 const arms=[-1,1].map(s=>{const pivot=new Group();pivot.position.set(s*.33,1.18,0);const sleeve=P(new CapsuleGeometry(.08,.16,6,12),shirtM);sleeve.position.y=-.13;const fore=P(new CapsuleGeometry(.062,.16,6,12),skinM);fore.position.y=-.34;const hand=P(new SphereGeometry(.072,14,10),skinM);hand.position.y=-.48;pivot.add(sleeve,fore,hand);root.add(pivot);return pivot;});
 const head=new Group();head.position.y=1.3;const face=P(new SphereGeometry(.31,32,24),skinM);face.position.y=.3;head.add(face);
 const cap=P(new SphereGeometry(.33,32,20,0,Math.PI*2,0,Math.PI*.55),hairM);cap.position.set(0,.33,-.02);cap.rotation.x=-.25;head.add(cap);
 const back=P(new SphereGeometry(1,24,16),hairM);back.scale.set(.32,long?.36:.26,.22);back.position.set(0,long?.2:.32,-.12);head.add(back);
 for(const s of [-1,1]){const ear=P(new SphereGeometry(.05,12,8),skinM);ear.scale.y=1.3;ear.position.set(s*.31,.28,0);head.add(ear);
  const eye=P(new SphereGeometry(1,16,12),new MeshStandardMaterial({color:0x26332f,roughness:.2}),false);eye.scale.set(.042,.056,.025);eye.position.set(s*.11,.31,.27);head.add(eye);
  const glint=new Mesh(new SphereGeometry(.013,8,6),new MeshBasicMaterial({color:0xffffff}));glint.position.set(s*.11+.015,.333,.293);head.add(glint);
  const cheek=new Mesh(new SphereGeometry(1,12,8),new MeshStandardMaterial({color:0xf09a8e,roughness:.9,transparent:true,opacity:.7}));cheek.scale.set(.055,.03,.012);cheek.position.set(s*.19,.21,.255);head.add(cheek);
  const brow=P(new BoxGeometry(.08,.016,.012),hairM,false);brow.position.set(s*.11,.39,.27);head.add(brow);}
 const smile=new Mesh(new TorusGeometry(.065,.012,8,20,Math.PI),new MeshStandardMaterial({color:0x8c4f45,roughness:.6}));smile.rotation.z=Math.PI;smile.position.set(0,.2,.285);head.add(smile);
 root.add(head);root.traverse(o=>{if(o.isMesh&&o.castShadow!==false)o.castShadow=true;});scene.add(root);return{root,legs,arms,head};}
const people={player:person('#5e9a85','#34584f','#4a3b32','#edc39b',true),alex:person('#f0b955','#3d5a73','#7a5a40','#efc6a0',false),mum:person('#c98a77','#5a4a44','#3f3a35','#dfb087',true)};
function posePerson(kind,p,t){const R=people[kind],walk=p.walk,sw=walk?Math.sin(t*10)*.55:0,bob=walk?Math.abs(Math.sin(t*10))*.04:Math.sin(t*2+(kind==='alex'?1:0))*.012;
 R.root.position.set(p.x,.27+bob,p.z);R.root.rotation.y=p.angle;R.legs.forEach((l,k)=>l.rotation.x=walk?(k?1:-1)*sw:0);
 const act=p.act&&t>=p.act.t0&&t-p.act.t0<p.act.dur?p.act:null,u=act?(t-act.t0)/act.dur:0;
 R.arms.forEach((a,k)=>{const side=k?1:-1;let rz=side*.08,rx=walk?-side*sw*.8:Math.sin(t*2)*.03;if(act&&act.type==='wave'&&side===1){rz=2.6+Math.sin(u*Math.PI*8)*.35;rx=0;}if(act&&act.type==='cheer'){rz=side*(2.7+Math.sin(u*Math.PI*6)*.2);rx=0;}a.rotation.set(rx,0,rz);});
 R.head.rotation.set(act&&act.type==='wave'?Math.sin(u*Math.PI*4)*.18:0,0,act&&act.type==='hmm'?Math.sin(u*Math.PI)*.25:0);}

// ---------- game data & state (same shape as the 2D Alex's Table) ----------
const items=window.AlexTableWords,options=[[0,2,1],[2,1,0],[1,0,2],[4,3,6],[6,8,4],[5,7,4],[8,6,4],[5,8,7],[8,9,6],[6,9,8]],KEY='sanor-table3d-proto-v1';
const shelf={4:[1.55,1.0,-1.55],5:[2.05,1.0,-1.55],6:[2.55,1.0,-1.55],7:[3.0,1.0,-1.55],8:[3.45,1.0,-1.55],9:[3.95,1.0,-1.55]};
const slot={4:[2.3,1.042,1.42,0],5:[2.3,1.06,1.42,.35],6:[2.85,1.042,1.6,0],7:[3.12,1.045,1.38,-.45],8:[2.15,1.042,.85,0]};
const TABLE=[2.7,1.03,1.05],rooms={0:{ring:[7.65,.3,.25],r:1.7,approach:[6.4,2.8],cam:[7.2,.6,.8]},1:{ring:[-3.7,.3,-4.3],r:1.6,approach:[-1.9,-3.8],cam:[-3.3,.6,-3.9]},2:{ring:[3.2,.3,.1],r:1.6,approach:[1.9,-.2],cam:[3,.6,0]}};
const fresh=()=>({index:0,rows:items.map(()=>({answers:[],hint:false}))});let state=fresh();
try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&Number.isInteger(s.index)&&s.index>=0&&s.index<=10&&s.rows?.length===10&&s.rows.every((r,i)=>r&&Array.isArray(r.answers)&&r.answers.every(n=>options[i].includes(n))&&typeof r.hint==='boolean'&&(i>=s.index||r.answers[r.answers.length-1]===i)))state=s;}catch{}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{$('status').textContent='This device cannot save your work. Print your results before you leave.';}}
const last=a=>a[a.length-1],isOk=()=>state.index<10&&last(state.rows[state.index].answers)===state.index,solved=j=>j<state.index||(j===state.index&&isOk());
// characters & camera
const nav=new window.HomeNav(W.colliders),player={x:0,z:6.6,angle:Math.PI,walk:false,path:[]},alex={x:.9,z:5.9,angle:Math.PI,walk:false,path:[]},mum={x:-1.8,z:-.5,angle:0,walk:false,path:[]};
const TABLE_SPOT={player:[1.6,0,.64],alex:[3.75,1.45,-.53]};const HIDE={x:300,z:300,angle:0,walk:false};
const cam={center:[1,.4,-.6],dist:0,yaw:.38,pitch:.86,drag:0};const narrow=()=>innerWidth<700;let focusRoom=null;
function camGoal(){const i=state.index;if(i>=3)return{center:[2.75,.9,-.05],dist:narrow()?13.5:8,yaw:.42,pitch:.82};if(focusRoom!==null)return{center:rooms[focusRoom].cam,dist:narrow()?24:15,yaw:.38,pitch:.9};return{center:[.9,.2,-.6],dist:narrow()?37:27,yaw:.38,pitch:.9};}
function placeAt(p,x,z,a){p.x=x;p.z=z;p.angle=a;p.path=[];p.walk=false;}
function walkTo(p,to,face){p.path=nav.route([p.x,p.z],to);p.face=face;if(!p.path.length){p.x=to[0];p.z=to[1];}}
function syncCharacters(instant){const i=state.index;
 if(i>=3){const Pp=TABLE_SPOT.player,A=TABLE_SPOT.alex;if(instant){placeAt(player,...Pp);placeAt(alex,...A);}else{walkTo(player,[Pp[0],Pp[1]],Pp[2]);walkTo(alex,[A[0],A[1]],A[2]);}return;}
 const lastRoom=[2,1,0].find(j=>solved(j));if(lastRoom===undefined){if(instant){placeAt(player,0,6.6,Math.PI);placeAt(alex,.9,5.9,Math.PI);}return;}
 const ap=rooms[lastRoom].approach;if(instant){placeAt(player,ap[0]-.5,ap[1]+.3,0);placeAt(alex,ap[0]+.4,ap[1],0);}else{walkTo(alex,[ap[0]+.4,ap[1]],0);walkTo(player,[ap[0]-.5,ap[1]+.3],0);}}
// feedback
let anim=null,wiggle=null,sparks=[],actx=null,clock=0,bubbleText='';
function tone(notes){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const t=actx.currentTime;notes.forEach(([f,d,at])=>{const o=actx.createOscillator(),g=actx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0,t+at);g.gain.linearRampToValueAtTime(.18,t+at+.02);g.gain.exponentialRampToValueAtTime(.001,t+at+d);o.connect(g).connect(actx.destination);o.start(t+at);o.stop(t+at+d+.05);});}catch{}}
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p);}catch{}};
function burst(at){for(let k=0;k<26;k++){const a=Math.random()*Math.PI*2,u=Math.random();sparks.push({x:at[0],y:at[1]+.15,z:at[2],vx:Math.cos(a)*(.6+u),vy:1.6+Math.random()*1.4,vz:Math.sin(a)*(.6+u),life:1});}}
function anchor(j){if(j<=2)return rooms[j].ring;if(j===3)return TABLE;if(j===9)return shelf[9];return solved(j)&&slot[j]?slot[j]:shelf[j];}
const hitRadius=j=>j<=2?110:j===3?90:62;
function paint(){const i=state.index,done=i>=10;
 $('progress').innerHTML=items.map((_,j)=>'<i class="'+(solved(j)?'done':j===i?'now':'')+'"></i>').join('');
 $('report').hidden=!done;if(done){report();return;}const r=state.rows[i],ok=isOk();
 $('count').textContent=(i+1)+' / 10';$('prompt').textContent=items[i][1];$('next').hidden=!ok;$('hint').disabled=ok;
 $('status').textContent=ok?'Correct! '+items[i][0]+(i===9?' · The glass is full.':''):[r.answers.length?'Listen again. What did Alex ask for?':'',r.hint?'Hint: '+items[i][4]:''].filter(Boolean).join(' · ');
 bubbleText=ok?(i===2?'Nice kitchen! Let’s have lunch.':'Thank you!'):items[i][1];}
function report(){const first=state.rows.filter((r,j)=>r.answers[0]===j).length;
 $('results').innerHTML='<p>Correct on the first try '+first+'/10 words · Practice results</p><table><tr><th>Word</th><th>First choice</th><th>Attempts</th><th>Hint</th></tr>'+state.rows.map((r,j)=>'<tr><td>'+items[j][0]+'</td><td>'+(r.answers.length?items[r.answers[0]][0]:'–')+'</td><td>'+r.answers.length+'</td><td>'+(r.hint?(r.hintBeforeFirst===true?'Before first try':r.hintBeforeFirst===false?'After first try':'Used'):'–')+'</td></tr>').join('')+'</table>';}
function speak(){if(state.index<10)QuestVoice.play(items[state.index][1],m=>{$('status').textContent=m;});}
function choose(j){const i=state.index;if(i>=10||isOk()||!$('intro').hidden)return;const r=state.rows[i];r.answers.push(j);save();
 if(j===i){tone([[660,.18,0],[880,.22,.1],[1175,.3,.2]]);buzz(30);alex.act={type:'wave',t0:clock,dur:1.8};if(i===9)player.act={type:'cheer',t0:clock+.9,dur:2.2};
  if(j<=2){focusRoom=j;burst(rooms[j].ring);syncCharacters(false);}else if(j===3){anim={k:3,t0:clock,dur:.6};burst(TABLE);}
  else if(j===9)anim={k:9,t0:clock,dur:1.5,from:shelf[9],to:[slot[8][0]+.16,slot[8][1]+.32,slot[8][2]]};else anim={k:j,t0:clock,dur:.8,from:shelf[j],to:slot[j]};}
 else{tone([[220,.18,0],[185,.22,.12]]);buzz([20,40,20]);wiggle={k:j,t0:clock};alex.act={type:'hmm',t0:clock,dur:1.2};}
 paint();}
$('start').onclick=()=>{$('intro').hidden=true;speak();};$('listen').onclick=speak;
$('hint').onclick=()=>{const r=state.rows[state.index];if(!r.hint)r.hintBeforeFirst=r.answers.length===0;r.hint=true;save();paint();};
$('next').onclick=()=>{QuestVoice.stop();anim=null;focusRoom=null;state.index++;save();cam.drag=0;if(state.index===3)syncCharacters(false);paint();if(state.index<10)speak();};
$('print').onclick=()=>window.print();
$('again').onclick=()=>{if(confirm('Start a new round and replace the 3D results on this device?')){state=fresh();save();focusRoom=null;anim=null;syncCharacters(true);paint();}};
// input
const cv=$('scene');let down=null;
cv.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,t:performance.now(),yaw:cam.drag,id:e.pointerId};try{cv.setPointerCapture(e.pointerId);}catch{}});
cv.addEventListener('pointermove',e=>{if(!down||e.pointerId!==down.id)return;const dx=e.clientX-down.x;if(Math.abs(dx)>8)cam.drag=Math.max(-1.1,Math.min(1.1,down.yaw-dx*.006));});
cv.addEventListener('pointerup',e=>{if(!down||e.pointerId!==down.id)return;if(Math.hypot(e.clientX-down.x,e.clientY-down.y)<10&&performance.now()-down.t<700)pick(e.clientX,e.clientY);down=null;});
cv.addEventListener('pointercancel',()=>down=null);
const tmpV=new Vector3();
function project(x,y,z){tmpV.set(x,y,z).project(camera);return{x:(tmpV.x*.5+.5)*innerWidth,y:(-tmpV.y*.5+.5)*innerHeight,visible:tmpV.z<1&&Math.abs(tmpV.x)<1.1&&Math.abs(tmpV.y)<1.1};}
function candidates(){const i=state.index;if(i>=10||isOk())return[];return options[i].map(j=>{const a=anchor(j),p=project(a[0],a[1]+(j<=2?0:.08),a[2]);return{j,x:p.x,y:p.y,visible:p.visible,r:hitRadius(j)};});}
function pick(x,y){let best=null,bd=Infinity;for(const c of candidates()){const d=Math.hypot(c.x-x,c.y-y);if(c.visible&&d<c.r&&d<bd){best=c;bd=d;}}if(best)choose(best.j);else if(state.index<10&&!isOk())$('status').textContent='Tap one of the glowing rings.';}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
// ---------- frame ----------
const lerp=(a,b,u)=>a+(b-a)*u;
function moveAlong(p,dt){if(!p.path.length){p.walk=false;if(p.face!==undefined){p.angle=p.face;p.face=undefined;}return;}const [tx,tz]=p.path[0],dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz),s=dt*3.6;p.walk=true;p.angle=Math.atan2(dx,dz);if(d<=s){p.x=tx;p.z=tz;p.path.shift();}else{p.x+=dx/d*s;p.z+=dz/d*s;}}
let prev=performance.now(),slowT=0,slowN=0;const qualityLog=[];
function lowerQuality(){if(pixelCap>1.25){pixelCap=1;renderer.setPixelRatio(1);return'resolution';}if(sun.shadow.mapSize.x>1024){sun.shadow.mapSize.set(1024,1024);sun.shadow.map?.dispose();sun.shadow.map=null;return'shadow-size';}if(renderer.shadowMap.enabled){renderer.shadowMap.enabled=false;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});return'shadows';}return null;}
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-prev)/1000);const frameMs=now-prev;prev=now;clock+=dt;
 if(clock>2&&!FIXED_Q){slowT+=frameMs;slowN++;if(slowN>=90){if(slowT/slowN>45){const q=lowerQuality();if(q)qualityLog.push(q);}slowT=0;slowN=0;}}
 moveAlong(player,dt);moveAlong(alex,dt);
 const g=camGoal(),k=Math.min(1,dt*3);if(!cam.dist){cam.dist=g.dist;cam.center=g.center.slice();}cam.center=cam.center.map((v,n)=>lerp(v,g.center[n],k));cam.dist=lerp(cam.dist,g.dist,k);cam.yaw=lerp(cam.yaw,g.yaw+cam.drag,k*1.6);cam.pitch=lerp(cam.pitch,g.pitch,k);
 const c=cam.center,cp=Math.cos(cam.pitch);camera.position.set(c[0]+Math.sin(cam.yaw)*cam.dist*cp,c[1]+Math.sin(cam.pitch)*cam.dist,c[2]+Math.cos(cam.yaw)*cam.dist*cp);camera.lookAt(c[0],c[1],c[2]);camera.updateMatrixWorld();
 fitShadow(state.index>=3?[2.6,.8,.2]:focusRoom!==null?rooms[focusRoom].cam:[.5,0,-.5],state.index>=3?5.5:focusRoom!==null?7.5:14);
 beginWorldFrame();W.render(clock,HIDE,HIDE,HIDE,cam.yaw,false,false);
 posePerson('mum',mum,clock);posePerson('alex',alex,clock);posePerson('player',player,clock);
 const au=anim?Math.min(1,(clock-anim.t0)/anim.dur):1;
 cloth.visible=solved(3);if(cloth.visible){const s=anim&&anim.k===3?(.4+.6*Math.sin(au*Math.PI/2))*(1+.08*Math.sin(au*Math.PI)):1;cloth.scale.set(s,1,s);}
 food.visible=solved(9);
 for(let j=4;j<=9;j++){const o=itemObj[j];let pos=(j!==9&&solved(j))?slot[j]:shelf[j],ry=(j!==9&&solved(j))?slot[j][3]:0,tilt=0;
  if(anim&&anim.k===j&&au<1){const f=anim.from,t=anim.to;if(j===9){const v=au<.5?au*2:(1-au)*2;pos=[lerp(f[0],t[0],v),lerp(f[1],t[1],v)+Math.sin(v*Math.PI)*.25,lerp(f[2],t[2],v)];tilt=v*1.1;}else{pos=[lerp(f[0],t[0],au),lerp(f[1],t[1],au)+Math.sin(au*Math.PI)*.9,lerp(f[2],t[2],au)];ry=lerp(0,slot[j][3],au)+Math.sin(au*Math.PI)*1.5;}}
  if(wiggle&&wiggle.k===j){const w=Math.min(1,(clock-wiggle.t0)/.45);pos=[pos[0]+Math.sin(w*40)*.035*(1-w),pos[1],pos[2]];}
  o.position.set(pos[0],pos[1],pos[2]);o.rotation.set(0,ry,tilt);
  if(j===8)o.getObjectByName('water').visible=solved(9)&&!(anim&&anim.k===9&&au<.5);
  if(anim&&anim.k===j&&au>=1&&!anim.burst){anim.burst=true;burst(j===9?slot[8]:pos);}}
 const showRings=state.index<10&&!isOk()&&$('intro').hidden;
 rings.forEach((m,n)=>{const j=showRings?options[state.index][n]:-1;m.visible=j>=0;if(j<0)return;const a=anchor(j),base=j<=2?rooms[j].r:j===3?.85:j===9?.19:.21,pulse=1+Math.sin(clock*4)*.08;
  m.geometry=j>=4?ringSmall:ringBig;let x=a[0];if(wiggle&&wiggle.k===j&&j<=3){const w=Math.min(1,(clock-wiggle.t0)/.45);x+=Math.sin(w*40)*.12*(1-w);}m.position.set(x,j<=2?.32:a[1]+.012,a[2]);m.scale.setScalar(base*pulse);m.rotation.z=clock*.6;});
 sparks=sparks.filter(s=>(s.life-=dt*1.1)>0);sparkPool.forEach((m,n)=>{const s=sparks[n];m.visible=!!s;if(!s)return;s.vy-=dt*4.2;s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;m.position.set(s.x,s.y,s.z);m.scale.setScalar(.6+s.life);});
 renderer.render(scene,camera);
 const b=$('bubble'),p=project(alex.x,2.35,alex.z),show=state.index<10&&$('intro').hidden&&p.visible&&!alex.walk;b.hidden=!show;if(show){if(b.textContent!==bubbleText)b.textContent=bubbleText;b.style.transform=`translate(${p.x}px,${p.y}px) translate(-50%,-100%)`;}}
window.table3dStatus=()=>({index:state.index,ok:isOk(),rows:JSON.parse(JSON.stringify(state.rows)),walking:player.walk||alex.walk,animating:!!(anim&&(clock-anim.t0)<anim.dur),renderer:'three.js r187',quality:{ratio:pixelCap,shadows:renderer.shadowMap.enabled,shadowSize:sun.shadow.mapSize.x},qualityLog,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,targets:candidates().map(c=>({word:items[c.j][0],x:Math.round(c.x),y:Math.round(c.y),visible:c.visible}))});
syncCharacters(true);if(state.index>0)$('intro').hidden=true;paint();requestAnimationFrame(frame);
