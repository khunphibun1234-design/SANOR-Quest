/* Word Island · runs on the shared SANOR 3D engine (Three.js r187, shared/sq-three.js). */
'use strict';
const $=id=>document.getElementById(id),canvas=$('world');
let engine;try{engine=SQ3.createEngine(canvas,{background:'#a4d6dd',fog:[40,100],shadowCenter:[0,0,0],shadowRadius:15});}
catch(err){$('error').hidden=false;$('intro').hidden=true;throw err;}
const {box,cylinder,ellipsoid,tri,mesh,model,mul,lookAt,perspective}=engine;
const identity=()=>null; // draw(m) without a matrix shows a static mesh in place
const draw=(m,mat,water=0)=>engine.draw(m,mat,water);
const P=window.SanorProfile,XP=P.XP;
// The ocean is a tessellated plane; its vertices gently move in the shader.
for(let x=-90;x<90;x+=3)for(let z=-90;z<90;z+=3){const col=(Math.sin(x*2+z*4)+1)>.8?'#69bfc8':'#68bbc6';tri([x,-.7,z],[x,-.7,z+3],[x+3,-.7,z],col);tri([x+3,-.7,z],[x,-.7,z+3],[x+3,-.7,z+3],col);}
const ocean=mesh();
cylinder(0,-.5,0,13.8,13.2,1.35,'#c9b589',40);cylinder(0,.13,0,13.2,12.75,.65,'#f2deb0',40);cylinder(0,.48,0,12.1,11.8,.32,'#a3c887',40);cylinder(0,.63,0,10.8,10.7,.05,'#afd090',40);
// A sandy wandering trail, stones and garden.
for(let i=0;i<21;i++){const z=-9+i*.85,x=Math.sin(i*.5)*1.5;cylinder(x,.68,z,.55,.55,.025,'#ded5a8',8);}
function tree(x,z,s=1,col='#638f65'){cylinder(x,.7+s,z,.22*s,.16*s,2*s,'#9c7858',7);ellipsoid(x,2.5*s+.5,z,1.35*s,1.6*s,1.2*s,col,7,4);ellipsoid(x-.7*s,2.2*s+.5,z+.3*s,.9*s,1*s,.8*s,'#78a875',7,4);}
tree(-6,-4,1.15);tree(-9,-5,.7,'#759e75');tree(-8,-8,.8);tree(1,-9,.9);tree(8,-5,.75);tree(9,5,.7);tree(-10,0,.6);
// House and roof: all geometry, no images.
box(4,1.85,-5,3.1,2.4,2.6,'#f4e3bd');box(4,3.1,-5,3.45,.22,2.95,'#fff0d0');
const roofA=[2.15,3.2,-6.6],roofB=[5.85,3.2,-6.6],roofC=[5.85,3.2,-3.4],roofD=[2.15,3.2,-3.4],ridgeA=[4,4.5,-6.6],ridgeB=[4,4.5,-3.4];tri(roofA,ridgeA,ridgeB,'#c67e66');tri(roofA,ridgeB,roofD,'#c67e66');tri(ridgeA,roofB,roofC,'#dd9676');tri(ridgeA,roofC,ridgeB,'#dd9676');tri(roofD,ridgeB,roofC,'#eeac83');tri(roofA,roofB,ridgeA,'#d09073');box(4,1.43,-3.68,.72,1.55,.07,'#658c81');box(3,2.12,-3.66,.55,.6,.07,'#a3d7d7');box(5,2.12,-3.66,.55,.6,.07,'#a3d7d7');box(4,.83,-3.35,1.1,.28,.7,'#e8d5ab');box(4.7,4.05,-5.6,.5,.8,.5,'#b77866');
// Small pond and its bridge.
ellipsoid(7,.67,1.2,3.2,.035,2.6,'#69b6bc',24,4);for(let i=0;i<10;i++){const x=4.9+i*.47;box(x,1.05,1.6,.43,.15,1.45,'#c89d6b');}for(const z of [.78,2.42]){box(7,1.82,z,4.8,.12,.12,'#ebd1a0');for(const x of [4.8,6.3,7.8,9.3])box(x,1.38,z,.13,1.35,.13,'#ab835c');}
// Sailboat at the beach.
ellipsoid(-9,.85,5.8,1.6,.43,.7,'#b77c58',8,4);box(-9,1.1,5.8,2.3,.14,1.05,'#e8c398');cylinder(-9,2.4,5.8,.06,.06,2.65,'#9a7857',6);tri([-8.88,3.65,5.8],[-8.88,1.55,5.8],[-7.55,1.55,5.8],'#fff3d6');tri([-9.12,3.65,5.8],[-10.15,1.85,5.8],[-9.12,1.85,5.8],'#e9aa7b');
// Flower garden, rock and tiny scenery.
function flower(x,z,s=1){cylinder(x,.95,z,.035,.035,.65*s,'#4a8867',5);for(let i=0;i<5;i++){let a=i*1.256;ellipsoid(x+Math.cos(a)*.2*s,1.25*s,z+Math.sin(a)*.2*s,.18*s,.11*s,.18*s,'#f4baaa',6,4);}ellipsoid(x,1.3*s,z,.11*s,.09*s,.11*s,'#f4d779',6,4);}
for(const [x,z]of [[1,5],[1.7,5.5],[2.3,4.8],[2.4,5.7],[1.2,6]])flower(x,z,1.2);
ellipsoid(-3,1.2,.2,1.15,.75,.85,'#96a9a3',7,4);ellipsoid(-3.9,.94,.8,.6,.4,.5,'#b0bab0',6,4);
let seed=8;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
for(let i=0;i<50;i++){const a=rand()*6.28,r=8+rand()*3,x=Math.cos(a)*r,z=Math.sin(a)*r;if(i%4===0){ellipsoid(x,.76,z,.25,.15,.2,'#c7d1ab',6,3);}else{cylinder(x,.86,z,.13,0,.4,'#85af7c',4);}}
for(let i=0;i<10;i++){const a=i*.628;cylinder(Math.cos(a)*13.6,-.45,Math.sin(a)*13.6,.25,.2,.15,'#e2d3ab',6);}
const scenery=mesh();
// Stylized explorer, articulated legs and a round shadow.
cylinder(0,.008,0,.51,.51,.012,'#728f70',20);const shadow=mesh();
box(0,1.08,0,.61,.7,.38,'#418f8b');box(0,1.11,-.26,.48,.56,.25,'#d49a64');ellipsoid(0,1.76,.02,.36,.39,.33,'#f1c7a0');cylinder(0,2.04,0,.4,.32,.22,'#f3d48b',10);box(0,1.96,.28,.63,.08,.32,'#f5daa1');box(-.13,1.8,.33,.055,.055,.035,'#344d4c');box(.13,1.8,.33,.055,.055,.035,'#344d4c');box(-.4,1.04,0,.18,.55,.2,'#f1c7a0');box(.4,1.04,0,.18,.55,.2,'#f1c7a0');const avatar=mesh();
box(0,.39,0,.21,.6,.24,'#385c67');box(0,.11,.08,.24,.18,.36,'#f5e6c8');const leg=mesh();
ellipsoid(0,0,0,.12,.17,.12,'#ffdb8d',6,4);const sparkle=mesh();
const clouds=[];for(let i=0;i<7;i++){const x=-22+i*7,z=-20-(i%3)*3;ellipsoid(x,8+(i%2)*2,z,2.8,.72,1.3,'#e7f2e7',8,4);ellipsoid(x+.9,8.5+(i%2)*2,z,1.5,.8,1.1,'#edf5e9',8,4);}const cloud=mesh();
const words=[{en:'TREE',th:'ต้นไม้',hintTh:'มองหาลำต้นและใบไม้สีเขียว',x:-6,z:-4,y:5.4,hint:'Look for a trunk and green leaves.',radius:2.5},{en:'FLOWER',th:'ดอกไม้',hintTh:'มองหากลีบดอกสีชมพูใกล้ทางเดิน',x:1.7,z:5.4,y:2.1,hint:'Look for pink petals near the path.',radius:2},{en:'HOUSE',th:'บ้าน',hintTh:'มองหาหลังคา หน้าต่าง และประตู',x:4,z:-5,y:5.1,hint:'Look for a roof, windows and a door.',radius:3.1},{en:'BRIDGE',th:'สะพาน',hintTh:'มองหาทางเดินไม้ที่ข้ามผ่านน้ำ',x:7,z:1.6,y:2.8,hint:'Look for a wooden path across the water.',radius:2.6},{en:'BOAT',th:'เรือ',hintTh:'หาใบเรือสีครีมริมชายหาด',x:-9,z:5.8,y:4.2,hint:'Find the cream sail by the beach.',radius:2.6},{en:'ROCK',th:'ก้อนหิน',hintTh:'มองหาของสีเทากลางเกาะ',x:-3,z:.2,y:2.5,hint:'Look for something grey in the middle of the island.',radius:2}];
for(const w of words){const el=document.createElement('div');el.className='object-label';el.textContent=w.en;$('labels').append(el);w.el=el;w.found=false;}
const player={x:0,z:7.7,angle:Math.PI},keys=new Set();let stage=0,started=false,paused=false,finished=false,nearest=null,yaw=.35,clock=0,last=performance.now(),vp=identity(),muted=true,toastTimer,particles=[];
const cameraView={zoom:1,targetZoom:1,pitchOffset:0};
const ZOOM_MIN=.42,ZOOM_MAX=1.8,MIN_ELEVATION=Math.PI/9,MAX_ELEVATION=Math.PI*4/9;
let orbitPointer=null,orbitX=0,orbitY=0;
function cameraReady(){return started&&!paused&&!finished;}
function baseElevation(){return Math.atan2(innerWidth<700?22:24,innerWidth<700?22:27);}
function updateZoomUI(){
 $('zoomLevel').textContent=Math.round(100/cameraView.targetZoom)+'%';
 $('zoomIn').disabled=cameraView.targetZoom<=ZOOM_MIN;
 $('zoomOut').disabled=cameraView.targetZoom>=ZOOM_MAX;
}
function zoomCamera(deltaPixels){
 if(!cameraReady()||!Number.isFinite(deltaPixels))return;
 cameraView.targetZoom=Math.max(ZOOM_MIN,Math.min(ZOOM_MAX,cameraView.targetZoom*Math.exp(Math.max(-1000,Math.min(1000,deltaPixels))*.0015)));
 updateZoomUI();
}
function stopOrbit(){
 const pointer=orbitPointer;orbitPointer=null;canvas.classList.remove('orbiting');
 if(pointer!==null&&canvas.hasPointerCapture(pointer))canvas.releasePointerCapture(pointer);
}
function resetCamera(){stopOrbit();yaw=.35;cameraView.zoom=1;cameraView.targetZoom=1;cameraView.pitchOffset=0;updateZoomUI();}
canvas.addEventListener('wheel',e=>{
 // Keep browser Ctrl/trackpad pinch zoom available; only ordinary wheel input controls the scene.
 if(!cameraReady()||e.ctrlKey)return;
 e.preventDefault();const unit=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;
 zoomCamera(e.deltaY*unit);
},{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
 if(e.button!==2||!cameraReady()||orbitPointer!==null)return;
 e.preventDefault();orbitPointer=e.pointerId;orbitX=e.clientX;orbitY=e.clientY;
 canvas.setPointerCapture(e.pointerId);canvas.classList.add('orbiting');
});
canvas.addEventListener('pointermove',e=>{
 if(e.pointerId!==orbitPointer)return;
 if(!(e.buttons&2)||!cameraReady()){stopOrbit();return;}
 const dx=e.clientX-orbitX,dy=e.clientY-orbitY;orbitX=e.clientX;orbitY=e.clientY;
 // Azimuth is deliberately unbounded, so rotations remain continuous across 360 degrees.
 yaw-=dx*.006;
 const base=baseElevation();cameraView.pitchOffset=Math.max(MIN_ELEVATION-base,Math.min(MAX_ELEVATION-base,cameraView.pitchOffset+dy*.005));
 e.preventDefault();
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(e.pointerId===orbitPointer)stopOrbit();});
$('zoomIn').onclick=()=>zoomCamera(-160);$('zoomOut').onclick=()=>zoomCamera(160);$('cameraReset').onclick=resetCamera;
updateZoomUI();
let audioContext;
function note(freq=660,duration=.13){if(muted)return;try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.1,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);o.connect(g);g.connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+duration);}catch{}}
function speak(word){QuestVoice.play(word,toast);}
function toast(msg){$('toast').textContent=msg;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2800);}
// Thai help by level: Starter sees the Thai word, Explorer taps to reveal it, Challenger gets an English riddle only.
function quest(){const w=words[Math.min(stage,5)];$('question').innerHTML=P.thaiMode()==='hide'?'Mystery word':P.th(w.th);$('hint').innerHTML=P.esc(w.hint)+P.th(w.hintTh);$('questNum').textContent=String(Math.min(stage+1,6)).padStart(2,'0')+' / 06';$('score').textContent=stage*XP.step+(stage===6?XP.bonus:0)+' XP';$('found').textContent='Already found '+stage+' / 6';$('progress').style.width=stage/6*100+'%';}
function collect(){if(!started||paused||finished||!nearest)return;if(nearest!==words[stage]){toast('You found the '+nearest.en.toLowerCase()+(P.thaiMode()==='hide'?' · Read the clue again':' · Look for “'+words[stage].th+'”'));note(260);return;}const w=nearest;w.found=true;w.el.classList.add('found');w.el.textContent='✓ '+w.en;stage++;quest();toast('Correct! '+w.en.toLowerCase()+' = '+w.th+'  +'+XP.step+' XP');P.record('island','words',{xp:stage*XP.step+(stage===6?XP.bonus:0),stamps:[{id:'island-'+w.en.toLowerCase(),label:w.en.toLowerCase(),icon:{TREE:'🌳',FLOWER:'🌸',HOUSE:'🏠',BRIDGE:'🌉',BOAT:'⛵',ROCK:'🪨'}[w.en]}],done:stage===6});note(660);setTimeout(()=>note(880),120);for(let i=0;i<22;i++){const a=i/22*6.28;particles.push({x:w.x,y:1.5,z:w.z,vx:Math.cos(a)*(1+rand()*2),vy:3+rand()*2,vz:Math.sin(a)*(1+rand()*2),life:1.4});}if(!muted)speak(w.en.toLowerCase());if(stage===6){finished=true;keys.clear();setTimeout(()=>{$('wordReview').innerHTML=words.map(x=>'<div>'+x.en.toLowerCase()+'<small lang="th">'+x.th+'</small></div>').join('');$('win').hidden=false;},900);}}
P.onChange(()=>{if(started)quest();});P.mountLevelButton(document.querySelector('.top-right'));
function start(){started=true;paused=false;$('intro').hidden=true;document.body.classList.add('started');quest();}
function reset(){stage=0;finished=false;player.x=0;player.z=7.7;player.angle=Math.PI;resetCamera();particles=[];for(const w of words){w.found=false;w.el.className='object-label';w.el.textContent=w.en;}$('win').hidden=true;clearTimeout(toastTimer);$('toast').hidden=true;keys.clear();start();}
$('start').onclick=start;$('collect').onclick=collect;$('restart').onclick=reset;$('help').onclick=()=>{paused=true;release();$('helpModal').hidden=false;};function resume(){paused=false;$('helpModal').hidden=true;}$('resume').onclick=resume;$('closeHelp').onclick=resume;
$('sound').onclick=()=>{muted=!muted;$('sound').classList.toggle('active',!muted);$('sound').setAttribute('aria-label',muted?'Turn sound on':'Turn sound off');if(!muted)note();else QuestVoice.stop();};$('speak').onclick=()=>speak(words[Math.min(stage,5)].en.toLowerCase());
const keyMap={w:'up',arrowup:'up',s:'down',arrowdown:'down',a:'left',arrowleft:'left',d:'right',arrowright:'right',q:'rotateLeft',e:'rotateRight'};
window.addEventListener('keydown',e=>{if(e.target.closest('button,a,input,textarea')&&(e.key===' '||e.key==='Enter'))return;const k=keyMap[e.key.toLowerCase()];if(k){e.preventDefault();keys.add(k);}if(e.code==='Space'){e.preventDefault();if(!e.repeat)collect();}if(e.key==='Escape'&&!$('helpModal').hidden)resume();});window.addEventListener('keyup',e=>{const k=keyMap[e.key.toLowerCase()];if(k)keys.delete(k);});
function release(){keys.clear();stopOrbit();document.querySelectorAll('.pressed').forEach(e=>e.classList.remove('pressed'));}window.addEventListener('blur',release);document.addEventListener('visibilitychange',()=>{if(document.hidden){release();QuestVoice.stop();}});
for(const b of document.querySelectorAll('[data-move],#rotateLeft,#rotateRight')){const k=b.dataset.move||b.id;let heldAt=0;b.addEventListener('pointerdown',e=>{e.preventDefault();heldAt=performance.now();keys.add(k);b.classList.add('pressed');b.setPointerCapture(e.pointerId);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>{keys.delete(k);b.classList.remove('pressed');});b.addEventListener('contextmenu',e=>e.preventDefault());if(b.dataset.move)b.addEventListener('click',()=>{if(!started||paused||finished)return;const dx=k==='right'?1:k==='left'?-1:0,dz=k==='down'?1:k==='up'?-1:0;movePlayer(dx*Math.cos(yaw)+dz*Math.sin(yaw),-dx*Math.sin(yaw)+dz*Math.cos(yaw),.18);});if(b.id)b.addEventListener('click',e=>{yaw+=(k==='rotateLeft'?-1:1)*.35;});}
function resize(){engine.resize();}window.addEventListener('resize',resize);resize();quest();
function project(x,y,z){const p=[x,y,z,1],c=[0,0,0,0];for(let i=0;i<4;i++)for(let k=0;k<4;k++)c[i]+=vp[k*4+i]*p[k];return{x:(c[0]/c[3]*.5+.5)*innerWidth,y:(-.5*c[1]/c[3]+.5)*innerHeight,visible:c[3]>0&&Math.abs(c[0]/c[3])<1.1&&Math.abs(c[1]/c[3])<1.2};}
function movePlayer(vx,vz,dt){let nx=player.x+vx*dt*4.1,nz=player.z+vz*dt*4.1;const r=Math.hypot(nx,nz);if(r>12){nx*=12/r;nz*=12/r;}for(const obstacle of [{x:4,z:-5,r:1.9},{x:-6,z:-4,r:.5},{x:-3,z:.2,r:.95}]){const ox=nx-obstacle.x,oz=nz-obstacle.z,d=Math.hypot(ox,oz);if(d<obstacle.r&&d>.001){nx=obstacle.x+ox/d*obstacle.r;nz=obstacle.z+oz/d*obstacle.r;}}player.x=nx;player.z=nz;player.angle=Math.atan2(vx,vz);}
function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;clock+=dt;if(!started&&orbitPointer===null)yaw+=dt*.045;const mobile=innerWidth<700;
if(started&&!paused&&!finished){if(keys.has('rotateLeft'))yaw-=dt*1.25;if(keys.has('rotateRight'))yaw+=dt*1.25;let dx=(keys.has('right')?1:0)-(keys.has('left')?1:0),dz=(keys.has('down')?1:0)-(keys.has('up')?1:0);const len=Math.hypot(dx,dz);if(len){dx/=len;dz/=len;const vx=dx*Math.cos(yaw)+dz*Math.sin(yaw),vz=-dx*Math.sin(yaw)+dz*Math.cos(yaw);movePlayer(vx,vz,dt);}}
const move=started&&!paused&&!finished&&['up','down','left','right'].some(k=>keys.has(k));const focus=mobile?.65:.23,cx=player.x*focus,cz=player.z*focus;const baseDist=mobile?22:27,baseHeight=mobile?22:24;
cameraView.zoom+=(cameraView.targetZoom-cameraView.zoom)*(1-Math.exp(-14*dt));
const radius=Math.hypot(baseDist,baseHeight)*cameraView.zoom,elevation=Math.max(MIN_ELEVATION,Math.min(MAX_ELEVATION,Math.atan2(baseHeight,baseDist)+cameraView.pitchOffset));
const dist=Math.cos(elevation)*radius,height=Math.sin(elevation)*radius;
vp=mul(perspective((mobile?60:48)*Math.PI/180,canvas.width/canvas.height,.1,180),lookAt([cx+Math.sin(yaw)*dist,height,cz+Math.cos(yaw)*dist],[cx,0,cz]));
engine.setTime(clock);engine.begin(vp);draw(ocean,identity(),1);draw(scenery);draw(cloud,model(Math.sin(clock*.07)*1.5,0,0));
let py=.71;if(player.x>4.55&&player.x<9.7&&Math.abs(player.z-1.6)<.8)py=1.15;
draw(shadow,model(player.x,py,player.z));const bounce=move?Math.abs(Math.sin(clock*10))*.075:Math.sin(clock*2)*.025;draw(avatar,model(player.x,py+bounce,player.z,player.angle));const stride=move?Math.sin(clock*10)*.18:0;for(const side of [-1,1]){const lx=side*.17,lz=stride*side;draw(leg,model(player.x+lx*Math.cos(player.angle)+lz*Math.sin(player.angle),py,player.z-lx*Math.sin(player.angle)+lz*Math.cos(player.angle),player.angle));}
nearest=null;let nd=Infinity;for(const w of words){const distance=Math.hypot(w.x-player.x,w.z-player.z);if(!w.found&&distance<w.radius&&distance<nd){nearest=w;nd=distance;}const p=project(w.x,w.y,w.z);w.el.style.display=p.visible?'block':'none';w.el.style.left=p.x+'px';w.el.style.top=p.y+'px';}
for(const w of words)w.el.classList.toggle('near',nearest===w&&started&&!finished);$('collect').disabled=!nearest||!started||paused||finished;$('nearby').textContent=nearest?'Explore '+nearest.en.toLowerCase()+' now':'Move closer to an object to explore it.';$('needle').style.transform='rotate('+(-yaw*180/Math.PI)+'deg)';
for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0){particles.splice(i,1);continue;}p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt;p.vy-=dt*4;draw(sparkle,model(p.x,p.y,p.z,clock*3,p.life));}
if(!finished){const w=words[stage];draw(sparkle,model(w.x,w.y-.7+Math.sin(clock*2)*.15,w.z,clock,1.15));}engine.end();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
