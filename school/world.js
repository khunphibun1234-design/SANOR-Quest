'use strict';
/* Map 02 · the 3D school, written in the shared layout API (box / cylinder / ellipsoid / tri / mesh / draw).
 * Places (see content/worlds/02-school.json → places): gate, notice board, classroom, library, canteen, gym,
 * music room and stage. The walkable area matches shared navigation (x ±9.25, z ±8.5). */
window.buildSchoolWorld=function(e){
const {box:B,cylinder:C,ellipsoid:S,mesh:M,draw:D,model,tri}=e,objects=[],colliders=[],solid=(x,z,w,d)=>colliders.push({x,z,w,d}),finish=()=>objects.push(M());
// ground, courtyard and paths
B(0,-.5,0,21,.8,19,'#c9bd98');B(0,-.06,0,21,.15,19,'#a9bf8b');finish();
B(0,.04,0,6.4,.06,15.6,'#e9dfc5');for(let z=-7.2;z<8;z+=1.2)B(0,.075,z,6.2,.012,.05,'#d8ccae');
B(-4.6,.04,-.9,2.8,.06,1.6,'#e9dfc5');B(-4.6,.04,-5.7,2.8,.06,1.6,'#e9dfc5');B(4.6,.04,-.9,2.8,.06,1.6,'#e9dfc5');B(4.6,.04,-5.7,2.8,.06,1.6,'#e9dfc5');B(4.7,.04,4.2,2.6,.06,1.6,'#e9dfc5');finish();
// fence with the gate in front
for(let x=-9.6;x<=9.6;x+=.8)if(Math.abs(x)>1.5)B(x,.58,8.9,.12,1.2,.13,'#f5e9ce');for(const x of [-5.6,5.6])B(x,.7,8.9,8,.1,.13,'#f5e9ce');
for(const x of [-9.7,9.7]){for(let z=-8.6;z<9;z+=.85)B(x,.58,z,.12,1.2,.12,'#f0e5cc');B(x,.72,0,.12,.1,17.6,'#f5ead1');}
for(let x=-9.6;x<=9.6;x+=.85)B(x,.58,-9,.12,1.2,.12,'#f0e5cc');B(0,.72,-9,19.4,.1,.12,'#f5ead1');
for(const x of [-1.55,1.55]){B(x,1.2,8.9,.5,2.4,.5,'#b9a37f');B(x,2.45,8.9,.62,.12,.62,'#9e8763');solid(x,8.9,.6,.6);}
B(0,2.55,8.9,3.6,.5,.16,'#356f53');B(0,2.55,8.98,3.2,.32,.02,'#f4e7c2');finish();
// flag pole (Thai flag stripes)
C(3.2,2.2,7.2,.05,.05,4.4,'#d8d2c2',8);['#c8434b','#f6f3ea','#2d3f7c','#f6f3ea','#c8434b'].forEach((c,i)=>B(3.65,4.1-i*.13,7.2,.8,[.13,.13,.26,.13,.13][i],.03,c));C(3.2,.08,7.2,.35,.4,.16,'#cfc7b1',12);solid(3.2,7.2,.5,.5);finish();
// building helper: walls, roof, windows facing the courtyard, a door
function building(x,z,w,d,h,wall,roof,face,windows=3){B(x,h/2,z,w,h,d,wall);B(x,h+.12,z,w+.3,.24,d+.3,roof);
 const fx=x+face*(w/2+.02);for(let i=0;i<windows;i++){const wz=z-d/2+.7+i*(d-1.4)/Math.max(1,windows-1);if(Math.abs(wz-z)<.45&&windows%2)continue;B(fx,h*.62,wz,.05,.7,.55,'#a9d3d6');B(fx+face*.01,h*.62,wz,.05,.06,.6,'#f4eedf');}
 B(fx,.75,z,.06,1.5,.8,'#6b8c7f');B(fx+face*.02,.8,z+.25,.04,.08,.04,'#e3c46e');solid(x,z,w,d);}
building(-7.4,-1.0,3.4,3.6,3.0,'#f4e3bd','#6f8f86',1);                    // classroom block
B(-5.66,2.65,-1.0,.05,.35,1.5,'#356f53');B(-5.64,2.65,-1.0,.03,.24,1.3,'#f4eedf');
building(-7.4,-5.9,3.4,3.4,3.0,'#e6b99a','#8a5a48',1);                    // library
for(let i=0;i<4;i++)B(-5.62,2.55,-6.5+i*.35,.06,.32,.22,['#c8434b','#356f53','#2d3f7c','#d9af60'][i]);
building(7.4,-1.0,3.4,3.6,2.4,'#f6eed7','#c9785f',-1,0);                  // canteen (open front)
B(5.68,1.6,-1.0,.05,.6,3.3,'#f6eed7');
for(const z of [-2.0,0])for(const x of [4.6]){B(x,.72,z,1.0,.08,1.2,'#c19a70');for(const dx of [-.62,.62])B(x+dx,.42,z,.26,.08,1.1,'#a78462');solid(x,z,1.6,1.3);}
building(7.4,-6.0,3.6,3.6,3.8,'#dfe5e8','#5b7486',-1,2);                  // gym
B(5.6,3.0,-6.0,.05,.5,2.2,'#2d3f7c');B(5.58,3.0,-6.0,.03,.3,1.8,'#f6f3ea');
C(4.0,1.6,-7.4,.06,.06,3.2,'#7a8085',8);B(4.0,3.1,-7.1,.9,.6,.06,'#f6f3ea');C(4.0,2.75,-6.85,.2,.2,.03,'#d96a3b',14);solid(4,-7.4,.4,.4);
building(7.5,4.2,3.0,3.0,2.6,'#d9c8ec','#7a5f9e',-1,2);                   // music room
S(5.95,1.9,4.9,.16,.22,.04,'#c98a4b',8,5);B(5.95,2.3,4.9,.05,.5,.04,'#8a5a3a');
for(const [x,y] of [[5.97,1.4],[5.97,2.2]])S(x,y,3.6,.07,.07,.02,'#3e3a4f',6,3);
finish();
// notice board with the timetable
for(const x of [-4.5,-2.3])B(x,.9,5.2,.12,1.8,.12,'#8e7052');B(-3.4,1.55,5.2,2.4,1.3,.12,'#c19a70');B(-3.4,1.55,5.27,2.2,1.1,.02,'#eadfc4');
for(let r=0;r<6;r++){B(-3.95,1.95-r*.16,5.29,.6,.1,.01,'#5b7486');B(-3.05,1.95-r*.16,5.29,1.0,.1,.01,['#c8434b','#356f53','#d9af60','#9aa89c','#7a5f9e','#2d3f7c'][r]);}
B(-3.4,2.35,5.2,2.5,.12,.3,'#8a5a48');solid(-3.4,5.2,2.5,.4);finish();
// the stage at the back, with curtains and benches for the audience
B(0,.32,-7.7,5.6,.64,2.4,'#b98f66');B(0,.66,-7.7,5.6,.04,2.4,'#d6ae83');B(0,2.0,-8.85,5.8,2.8,.2,'#8a5a48');
for(const x of [-2.5,2.5])B(x,1.85,-8.6,.8,2.5,.12,'#c8434b');B(0,3.25,-8.6,5.8,.35,.15,'#c8434b');solid(0,-7.7,5.6,2.4);
const seats=[];for(const z of [-4.9,-3.7])for(const x of [-2.2,-1.1,0,1.1,2.2]){B(x,.32,z,.9,.08,.5,'#c19a70');B(x,.16,z,.1,.32,.4,'#a78462');seats.push([x,z]);}
finish();
// trees and planters
function tree(x,z,s=1){C(x,1.35*s,z,.17*s,.13*s,2.7*s,'#a48661',7);S(x,3*s,z,1.1*s,1.4*s,1.1*s,'#83a77b',8,5);S(x-.6*s,2.6*s,z+.3*s,.8*s,1*s,.8*s,'#99b789',7,4);solid(x,z,.6,.6);}
tree(-8.3,6.6,.9);tree(8.4,7.4,.8);tree(-8.4,3.2,.75);tree(-3.6,-8.2,.7);tree(3.8,-8.3,.7);
for(const [x,z] of [[-2.4,2.6],[2.4,2.6],[-2.4,-2.2],[2.4,-2.2]]){B(x,.25,z,.9,.5,.9,'#b99571');S(x,.75,z,.42,.35,.42,'#7aa66e',7,4);solid(x,z,.9,.9);}
finish();
// ---- "Your words change the world" ----
// a student joins the audience for every first-try answer; the stage lights and bunting go up when Alex joins the club
B(0,.42,0,.36,.5,.26,'#5e9a85');S(0,.85,0,.17,.18,.15,'#edc39b',8,5);S(0,.95,-.02,.18,.1,.16,'#3f3a35',8,4);const student=M();
const shirts=[];
B(-2.6,3.6,-7.9,5.4,.03,.03,'#9b8a6c');['#e9806e','#f2c14e','#6fb0a8','#b98bd1','#e9806e','#f2c14e','#6fb0a8','#b98bd1','#e9806e','#f2c14e','#6fb0a8','#b98bd1','#e9806e','#f2c14e'].forEach((c,i)=>{const x=-2.6+i*.4;tri([x-.14,3.58,-7.8],[x+.14,3.58,-7.8],[x,3.3,-7.8],c);});const bunting=M();
for(const x of [-1.8,0,1.8])S(x,3.0,-8.4,.16,.16,.16,'#fff1b8',8,5);C(0,.67,-7.4,2.2,2.2,.01,'#ffe9a8',24);const lights=M();
B(-3.4,2.75,5.2,.32,.32,.05,'#f2c14e');const star=M();
return{colliders,render(t,yaw,fx={}){for(const m of objects)D(m);
 const n=Math.min(fx.audience||0,seats.length);for(let i=0;i<n;i++){const [x,z]=seats[i];D(student,model(x,.12+(window.SanorProfile&&SanorProfile.reducedMotion()?0:Math.abs(Math.sin(t*3+i))*.03*(fx.cheer?1:0)),z+.05,Math.PI));}
 if(fx.bunting)D(bunting);if(fx.lights)D(lights);if(fx.star)D(star);}};};
