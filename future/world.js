'use strict';
/* Map 06 · Future Makers City: a robot lab, an energy park with solar panels and wind turbines, a makerspace,
 * city hall, a green park and a presentation stage. Places: content/worlds/06-future.json */
window.buildFutureWorld=function(e){
const K=SQProps(e),{B,C,S,M,D,model,tri}=K;
K.ground('#a9c79a');K.paving(0,-.6,6,15.6,'#e4e6e2');K.paving(-4.6,-3.6,2.6,2);K.paving(4.6,-4.0,2.6,2);K.paving(-4.6,4.0,2.6,2);K.paving(4.6,4.0,2.6,2);
for(let z=-7.8;z<7.5;z+=1.3)B(-2.6,.08,z,.5,.012,.7,'#7fb2c9');K.finish();   // a bike path along the square
K.fence({color:'#e8eef0'});
// robot lab (west, back): rounded glass building
K.building({x:-7.6,z:-4.4,w:2.8,d:4.6,h:3.0,wall:'#dfe9f0',roof:'#4f8fa8',face:1,windows:3,door:'#356f8a'});S(-7.6,3.3,-4.4,1.3,.7,1.9,'#a9d3d6',12,6);
// makerspace (west, front)
K.building({x:-7.8,z:4.2,w:2.4,d:3.2,h:2.6,wall:'#f6e7c4',roof:'#e0a64b',face:1,windows:2,door:'#8a5a3a',pitched:true});
// city hall (back, centre) with columns
K.building({x:0,z:-7.8,w:5,d:1.8,h:3.4,wall:'#f4f1ea',roof:'#6b7f9e',faceZ:1,windows:4,door:'#3f5a78'});for(const x of [-1.8,-.9,.9,1.8])C(x,1.5,-6.7,.14,.14,3,'#fbf7ee',10);B(0,3.15,-6.65,4.2,.3,.4,'#fbf7ee');B(0,.1,-6.4,3.4,.2,1,'#d8d4c8');K.solid(0,-6.6,4.4,.8);
// energy park (east, back): solar panels and two wind turbines
for(const [x,z] of [[5.0,-6.4],[6.4,-6.4],[7.8,-6.4],[5.0,-2.6],[6.4,-2.6]]){B(x,.4,z,.08,.8,.08,'#8b939b');tri([x-.55,.7,z+.4],[x+.55,.7,z+.4],[x+.55,1.1,z-.4],'#2f4f7a');tri([x-.55,.7,z+.4],[x+.55,1.1,z-.4],[x-.55,1.1,z-.4],'#2f4f7a');K.solid(x,z,1.1,.8);}
for(const [x,z] of [[8.2,-3.0],[8.6,-8.0]]){C(x,1.6,z,.12,.18,3.2,'#f4f6f8',10);K.solid(x,z,.5,.5);}
// green park (east, front): trees, pond and benches
K.tree(7.6,3.0,.8,'#6fa66a');K.tree(8.4,6.4,.7);K.tree(5.4,7.0,.65,'#6fa66a');K.bench(6.4,5.6,0);K.planter(4.0,6.8,'#e9a6c0');
// stage (front, centre)
B(0,.3,5.6,3.8,.6,2.0,'#7a5f9e');B(0,.62,5.6,3.6,.04,1.8,'#efe7f6');B(0,2.4,6.5,3.8,2.6,.12,'#3f3a55');for(const z of [6.43,6.57])B(0,2.6,z,2.8,1.4,.02,'#a9d3d6');K.solid(0,5.8,3.8,1.6);
K.lamp(-3.4,1.2,'#bfe6ff');K.lamp(3.4,1.2,'#bfe6ff');K.lamp(-3.4,-5.0,'#bfe6ff');K.lamp(3.4,-5.0,'#bfe6ff');K.planter(-3.2,7.6);K.planter(3.2,7.6);K.finish();
// vertical-axis wind turbines: three blades spin around the pole (a separate mesh drawn with a rotation)
const blades=(()=>{for(let i=0;i<3;i++){const a=i*2.094;B(Math.cos(a)*.55,1.0,Math.sin(a)*.55,.06,2.0,.26,'#ffffff',-a);B(Math.cos(a)*.28,.1,Math.sin(a)*.28,.56,.05,.05,'#d8dde4',-a);B(Math.cos(a)*.28,1.9,Math.sin(a)*.28,.56,.05,.05,'#d8dde4',-a);}return M();})();
// ---- words change the world: citizens arrive; a robot plants trees; solar bus stops; the screen lights up ----
const people=['#4f8fa8','#e0a64b','#7a5f9e','#c45b5b','#5e9a85','#9ab06a'].map(c=>K.crowdMesh(c));
const spots=[[-1.2,3.0],[1.2,3.4],[-0.6,2.0],[1.8,2.0],[-1.6,0.4],[1.4,-0.6],[-1.0,-2.4],[1.6,-3.2],[-1.8,3.8],[2.2,4.0],[0,1.0],[-0.8,-4.6],[1.0,-5.2],[2.4,-1.6],[-2.0,-1.2],[0.4,-1.6]];
const robot=(()=>{B(0,.55,0,.5,.5,.4,'#d8dde4');B(0,.95,0,.36,.28,.3,'#eef2f6');B(-.08,.98,.16,.06,.06,.02,'#3f7a9e');B(.08,.98,.16,.06,.06,.02,'#3f7a9e');C(0,1.2,0,.015,.015,.2,'#8b939b',4);S(0,1.32,0,.05,.05,.05,'#e9806e',6,4);B(0,.42,-.12,.4,.04,.22,'#2f4f7a');for(const x of [-.22,.22])C(x,.16,0,.12,.12,.08,'#3f3a35',10);return M();})();
const saplings=(()=>{for(const [x,z] of [[5.2,3.4],[6.0,4.2],[4.6,5.0]]){C(x,.3,z,.04,.04,.6,'#8e7052',6);S(x,.7,z,.22,.26,.22,'#7aa66e',7,4);}return M();})();
const busStop=(()=>{for(const x of [-.6,.6])B(-1.6+x,1.1,-.2,.06,2.2,.06,'#8b939b');B(-1.6,2.25,-.2,1.6,.06,.9,'#2f4f7a');B(-1.6,.5,-.45,1.2,.06,.3,'#c19a70');return M();})();
const screen=(()=>{for(const [z,f] of [[6.41,-1],[6.59,1]]){B(0,2.6,z,2.8,1.4,.02,'#fff1b8');B(-.6,2.8,z+f*.02,.6,.5,.02,'#f2c14e');B(.4,2.4,z+f*.02,1.2,.12,.02,'#7aa66e');B(.4,2.7,z+f*.02,1.2,.12,.02,'#4f8fa8');}return M();})();
return{colliders:K.colliders,render(t,yaw,fx={}){K.render(t);const calm=K.calm();
 for(const [x,z] of [[8.2,-3.0],[8.6,-8.0]])D(blades,model(x,3.2,z,calm?0:t*1.6));
 const n=Math.min(fx.citizens||0,spots.length);for(let i=0;i<n;i++){const [x,z]=spots[i],b=calm?0:Math.sin(t*2+i)*.02;D(people[i%people.length],model(x,b,z,i*1.3));}
 if(fx.robot){const w=calm?0:Math.sin(t*.8);D(robot,model(5.4+w*.8,0,4.2,w>0?-Math.PI/2:Math.PI/2));D(saplings);}
 if(fx.busStop)D(busStop,model(-1.6,0,-.8));if(fx.screen)D(screen);}};};
