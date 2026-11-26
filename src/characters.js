// SANOR QUEST · shared characters (Alex, Mum and the player), used by every 3D map.
// SQ3.createCast(scene) → {pose(kind, p, t)}  where p = {x, z, angle, walk, act:{type:'wave'|'cheer'|'hmm', t0, dur}}
import {Group,Mesh,MeshStandardMaterial,MeshBasicMaterial,SphereGeometry,CapsuleGeometry,CylinderGeometry,BoxGeometry,TorusGeometry} from 'three';
const P=(g,m,cast=true)=>{const o=new Mesh(g,m);o.castShadow=cast;o.receiveShadow=true;return o;};
export const LOOKS={grandma:['#b98cc0','#4a4a5a','#d9d4cc','#d8a67e',true],boatman:['#3f7a9e','#36424a','#2b2522','#c58b5e',false],vendor:['#e0a64b','#5a4636','#2b2522','#d9a77f',true],chef:['#f4f1ea','#4a4a4a','#2b2522','#d6a57c',false],officer:['#2d4f7c','#2b2f3a','#2b2522','#d6a57c',false],clerk:['#c45b5b','#2f3542','#3b2a22','#e2b48c',true],engineer:['#f0c24b','#3e4a56','#4a3b32','#e2b48c',true],mayor:['#4f7a5a','#2f3a33','#9a9a9a','#cf9f78',false],teacher:['#8a6fb0','#3e3a4f','#2b2522','#e2b48c',true],librarian:['#d08a5a','#4a5a52','#5b4636','#cf9f78',false],dad:['#7d9fc0','#3f4b57','#2f2a26','#d9a77f',false],player:['#5e9a85','#34584f','#4a3b32','#edc39b',true],alex:['#f0b955','#3d5a73','#7a5a40','#efc6a0',false],mum:['#c98a77','#5a4a44','#3f3a35','#dfb087',true]};
export function createCast(scene,kinds=['player','alex','mum']){
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
const people=Object.fromEntries(kinds.map(k=>[k,person(...LOOKS[k])]));
function posePerson(kind,p,t){const calm=typeof window!=='undefined'&&window.SanorProfile&&window.SanorProfile.reducedMotion();if(calm&&p.act)p.act=null;const R=people[kind],walk=p.walk,sw=walk?Math.sin(t*10)*(calm?.2:.55):0,bob=calm?0:walk?Math.abs(Math.sin(t*10))*.04:Math.sin(t*2+(kind==='alex'?1:0))*.012;
 R.root.position.set(p.x,.27+bob,p.z);R.root.rotation.y=p.angle;R.legs.forEach((l,k)=>l.rotation.x=walk?(k?1:-1)*sw:0);
 const act=p.act&&t>=p.act.t0&&t-p.act.t0<p.act.dur?p.act:null,u=act?(t-act.t0)/act.dur:0;
 R.arms.forEach((a,k)=>{const side=k?1:-1;let rz=side*.08,rx=walk?-side*sw*.8:Math.sin(t*2)*.03;if(act&&act.type==='wave'&&side===1){rz=2.6+Math.sin(u*Math.PI*8)*.35;rx=0;}if(act&&act.type==='cheer'){rz=side*(2.7+Math.sin(u*Math.PI*6)*.2);rx=0;}a.rotation.set(rx,0,rz);});
 R.head.rotation.set(act&&act.type==='wave'?Math.sin(u*Math.PI*4)*.18:0,0,act&&act.type==='hmm'?Math.sin(u*Math.PI)*.25:0);}

return{people,pose:posePerson};}
