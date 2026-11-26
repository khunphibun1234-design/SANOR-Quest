'use strict';
/* Map 03 · Phibun Hometown: the Mun River with Kaeng Saphue rapids, a boat pier, a temple, Grandma's house,
 * the town square with a clock tower and a noodle stall. Places: content/worlds/03-phibun.json */
window.buildPhibunWorld=function(e){
const K=SQProps(e),{B,C,S,M,D,model,tri}=K;
K.ground('#a9c48b');K.paving(0,1.8,6.4,8.6);K.paving(-4.6,2.4,2.4,1.6);K.paving(4.6,2.2,2.4,1.6);K.paving(-4.8,6.6,2.2,1.4);K.finish();
K.fence();
// the Mun River across the back, with the rapids (rocks and white water) on the left
B(0,.03,-3.95,20,.08,.5,'#d9cfa8');K.finish();K.water(0,-6.6,20,5,'#6fb3c7');K.solid(0,-6.6,20,5.2);
for(const [x,z,s] of [[-7.8,-5.2,1.1],[-6.2,-6.4,1.3],[-4.8,-5.0,.9],[-3.4,-6.8,1.2],[-5.6,-7.8,.8],[-2.2,-5.6,.7],[-7,-7.6,.9]])K.rock(x,z,s,'#8a8478');
for(let i=0;i<14;i++){const x=-8+i*.5,z=-5.6-Math.sin(i)*1.4;S(x,.12,z,.35,.06,.2,'#eef6f6',6,3);}K.finish();
// the pier and a long-tail boat
B(4.6,.22,-4.9,1.3,.12,2.6,'#b98f66');for(const z of [-4.0,-5.0,-6.0])for(const x of [4.05,5.15])C(x,.0,z,.07,.07,.6,'#8e7052',6);
B(6.2,.18,-6.0,.9,.28,3.2,'#c8434b');B(6.2,.36,-6.0,.7,.06,2.8,'#e9c46a');B(6.2,.6,-5.1,.1,.6,.1,'#5b4636');K.finish();
// temple with a pitched roof and a white stupa
K.building({x:-7.3,z:2.4,w:3.0,d:3.6,h:2.4,wall:'#f6ead4',roof:'#c86a3a',face:1,windows:3,door:'#9a5a2a',pitched:true});
B(-7.3,4.2,2.4,.2,.9,.2,'#e2b04a');
C(-8.2,.6,5.0,.9,1.0,1.2,'#f6f3ea',12);C(-8.2,1.6,5.0,.45,.7,.9,'#f6f3ea',12);C(-8.2,2.5,5.0,.08,.4,1.1,'#e2b04a',8);K.solid(-8.2,5.0,2,2);
// Grandma's wooden house on stilts
for(const x of [-8.3,-6.3])for(const z of [6.0,7.6])B(x,.6,z,.18,1.2,.18,'#8e7052');
B(-7.3,1.9,6.8,2.4,1.4,2.0,'#b98f66');const r=3.0;tri([-8.7,r-.4,6.2],[-5.9,r-.4,6.2],[-7.3,r+.5,6.2],'#8a5a48');tri([-8.7,r-.4,7.4],[-7.3,r+.5,7.4],[-5.9,r-.4,7.4],'#8a5a48');
tri([-8.7,r-.4,6.2],[-7.3,r+.5,6.2],[-7.3,r+.5,7.4],'#7a4f40');tri([-8.7,r-.4,6.2],[-7.3,r+.5,7.4],[-8.7,r-.4,7.4],'#7a4f40');tri([-5.9,r-.4,6.2],[-5.9,r-.4,7.4],[-7.3,r+.5,7.4],'#7a4f40');tri([-5.9,r-.4,6.2],[-7.3,r+.5,7.4],[-7.3,r+.5,6.2],'#7a4f40');
B(-6.05,1.0,6.8,.5,.08,1.0,'#a78462');for(let i=0;i<4;i++)B(-5.7,.2+i*.22,6.8,.25,.05,.9,'#a78462');K.solid(-7.3,6.8,2.6,2.2);K.finish();
// town square: clock tower
B(0,1.6,3.0,1.0,3.2,1.0,'#e8d8b8');B(0,3.35,3.0,1.3,.3,1.3,'#c86a3a');C(0,3.4,3.52,.32,.32,.04,'#fffdf5',16);B(0,3.45,3.55,.04,.22,.02,'#25483e');B(.07,3.4,3.55,.14,.04,.02,'#25483e');K.solid(0,3.0,1.1,1.1);
K.bench(-1.9,4.6);K.bench(1.9,4.6);K.lamp(-2.8,2.6);K.lamp(2.8,2.6);K.finish();
// noodle stall and tables
K.stall({x:7.3,z:2.0,w:2.0,d:1.3,awning:['#c8434b','#f6f3ea'],goods:['#f2c14e','#f6f3ea','#7aa66e']});K.table(5.0,4.4);K.finish();
K.tree(-3.0,7.2,.9);K.tree(3.2,7.0,.8);K.palm(8.4,6.4,.9);K.palm(-2.8,-2.4,.8);K.tree(8.4,-2.6,.7);K.flag(3.0,5.6);K.sign(-2.6,-2.9,'#2d6f8f');K.finish();
// ---- words change the world ----
const lantern=(()=>{C(0,1.15,0,.04,.04,2.3,'#6d6a60',6);S(0,2.35,0,.2,.26,.2,'#f2a33b',8,5);return M();})();
const lanternSpots=[];for(let i=0;i<16;i++)lanternSpots.push([-8.6+i*1.15,-3.55]);
const bunting=K.bunting(-3,3,2.6,5.2);
const bowls=(()=>{for(const [x,z] of [[-1.2,5.4],[1.2,5.4],[0,6.2]]){C(x,.18,z,.35,.28,.3,'#c9a06a',12);C(x,.33,z,.3,.3,.02,'#7cc6d8',12);}return M();})();
const drop=(()=>{S(0,0,0,.04,.08,.04,'#9fd3e6',5,3);return M();})();
return{colliders:K.colliders,render(t,yaw,fx={}){K.render(t);
 for(let i=0;i<Math.min(fx.lanterns||0,lanternSpots.length);i++)D(lantern,model(lanternSpots[i][0],0,lanternSpots[i][1]));
 if(fx.songkran){D(bunting);D(bowls);if(!K.calm())for(let i=0;i<24;i++){const a=i*2.4+t*1.7,h=((t*1.3+i*.37)%1);D(drop,model(Math.sin(a)*2.2,1.8-h*1.6,4.6+Math.cos(a)*1.2));}}
 if(fx.rain&&!K.calm())for(let i=0;i<70;i++){const x=((i*7.3)%19)-9.5,z=((i*4.1)%17)-8.5,h=(t*2.4+i*.13)%1;D(drop,model(x,5-h*5,z,0,1.2));}}};};
