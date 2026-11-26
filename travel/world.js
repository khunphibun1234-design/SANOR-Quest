'use strict';
/* Map 05 · Around the World: a travel square with a departures board, an information desk, a train station,
 * a hotel, an airport terminal and a lost-and-found office. Places: content/worlds/05-travel.json */
window.buildTravelWorld=function(e){
const K=SQProps(e),{B,C,S,M,D,model,tri}=K;
K.ground('#b4c6a0');K.paving(0,1,8,15,'#e3e1d8');for(let x=-3.6;x<4;x+=1.2)B(x,.075,1,.04,.012,15,'#cfccc0');K.paving(-5.6,-3.4,3,2.2);K.paving(5.6,-3.4,3,2.2);K.paving(5.6,4.2,3,2.2);K.paving(-5.6,4.2,3,2.2);K.finish();
K.fence();
// airport terminal (west, back) with a control tower and a baggage belt in front
K.building({x:-7.6,z:-4.4,w:2.8,d:5.4,h:3.2,wall:'#e8eef6',roof:'#4f6d8f',face:1,windows:4,door:'#3f5a78'});C(-8.2,2.6,-7.8,.35,.35,5.2,'#d8dde4',10);C(-8.2,5.4,-7.8,.7,.6,.6,'#7fb2c9',12);K.solid(-8.2,-7.8,.8,.8);
B(-4.6,.45,-4.6,.9,.5,2.6,'#5b6168');B(-4.6,.72,-4.6,.8,.04,2.5,'#2f3438');for(const [z,c] of [[-5.4,'#c45b5b'],[-4.4,'#e0a64b']])B(-4.6,.9,z,.45,.32,.6,c);K.solid(-4.6,-4.6,1,2.7);
// lost and found (west, front)
K.building({x:-7.8,z:4.2,w:2.4,d:3.0,h:2.6,wall:'#f3e6cf',roof:'#8a6d4e',face:1,windows:2,door:'#6b4f36'});B(-6.58,2.3,4.2,.05,.4,2,'#e0a64b');
// train station (east, back) with a platform and a train
K.building({x:7.6,z:-4.6,w:2.8,d:4.6,h:3.2,wall:'#f1e2c6',roof:'#9c4b3b',face:-1,windows:3,door:'#6d3a2e',pitched:true});C(5.9,2.8,-4.6,.32,.32,.06,'#fbf7ee',16);
B(4.4,.2,-8.0,9.6,.3,1.1,'#cfc7b5');B(2.2,1.0,-8.0,4.6,1.5,.9,'#3f7a9e');B(2.2,1.3,-7.54,4.2,.4,.04,'#a9d3d6');B(2.2,1.8,-8.0,4.6,.12,.9,'#d6dde4');K.solid(4.4,-8.0,9.6,1.2);
// hotel (east, front) with a canopy
K.building({x:7.8,z:4.2,w:2.4,d:3.8,h:4.4,wall:'#f6efe2',roof:'#6f8f86',face:-1,windows:3,door:'#5b4a7a'});B(6.2,2.1,4.2,.9,.08,1.6,'#7a5f9e');for(const z of [3.5,4.9])C(5.8,1.05,z,.04,.04,2.1,'#bfb7a5',6);
K.finish();
// departures board and information desk in the square
B(-3,1.2,5.6,.12,2.4,.12,'#5b6168');B(-1.8,1.2,5.6,.12,2.4,.12,'#5b6168');B(-2.4,2.5,5.6,2.6,1.2,.14,'#2f3438');for(let i=0;i<3;i++)for(const z of [5.52,5.68])B(-2.4,2.85-i*.32,z,2.3,.16,.02,['#f2c14e','#8fd0b4','#f2c14e'][i]);K.solid(-2.4,5.6,2.8,.4);
B(0,.55,0,2.2,1.1,.8,'#e8eef6');B(0,1.14,0,2.3,.08,.9,'#4f6d8f');C(0,2.2,-.2,.28,.28,.06,'#3f7a9e',16);B(0,2.2,-.17,.06,.3,.02,'#fbf7ee');K.solid(0,0,2.3,.9);
K.flag(3.4,6.6);K.sign(-3.6,-1.6,'#3f5a78');K.sign(3.6,-1.6,'#9c4b3b');K.sign(3.6,2.4,'#7a5f9e');
K.palm(-8.6,1.0,.8);K.palm(8.6,0.4,.8);K.planter(-3.4,7.6);K.planter(3.4,7.6);K.bench(-2.2,-4.0);K.bench(2.2,-4.0);K.lamp(-3.8,2.6);K.lamp(3.8,-0.4);K.finish();
// ---- words change the world: travellers arrive, the board lights up, Alex's bag comes back ----
const people=['#3f7a9e','#e0a64b','#7a5f9e','#c45b5b','#5e9a85','#9ab06a'].map(c=>K.crowdMesh(c));
const spots=[[-1.6,4.0],[1.6,3.4],[-2.4,1.6],[2.6,1.0],[-1.4,-2.2],[1.4,-2.8],[-2.8,-5.6],[2.8,-5.8],[-1.0,6.8],[1.2,6.2],[-3.2,3.0],[3.2,5.2],[0,-6.4],[-0.6,2.8],[2.0,-1.4],[-2.0,-0.8]];
const board=(()=>{for(let i=0;i<3;i++)for(const z of [5.5,5.7])B(-2.4,2.85-i*.32,z,2.3,.16,.02,'#fff1b8');return M();})();
const bag=(()=>{B(6.6,.35,3.0,.55,.6,.32,'#3f6fb5');B(6.6,.7,3.0,.2,.08,.06,'#2f3438');B(6.88,.45,3.0,.04,.16,.12,'#c8434b');return M();})();
const suitcases=(()=>{for(const [x,z,c] of [[-1.2,4.4,'#c45b5b'],[1.9,3.8,'#e0a64b'],[-2.0,-1.8,'#5e9a85']])B(x+.3,.3,z,.3,.45,.18,c);return M();})();
return{colliders:K.colliders,render(t,yaw,fx={}){K.render(t);
 const n=Math.min(fx.travellers||0,spots.length);for(let i=0;i<n;i++){const [x,z]=spots[i],b=K.calm()?0:Math.sin(t*2+i)*.02;D(people[i%people.length],model(x,b,z,i*1.3));}
 if(n>2)D(suitcases);if(fx.board)D(board);if(fx.bag)D(bag);}};};
