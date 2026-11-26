'use strict';
/* Map 04 · Market & Food Street: stalls on both sides of a lantern street, a restaurant, a bakery, a drinks stall
 * and a gift shop. Places: content/worlds/04-market.json */
window.buildMarketWorld=function(e){
const K=SQProps(e),{B,C,S,M,D,model,tri}=K;
K.ground('#b5c79a');K.paving(0,0,7.2,17.6,'#e6dcc2');for(let z=-8;z<8.5;z+=1.1)B(0,.075,z,7,.012,.05,'#d6caa9');K.paving(-4.4,3.2,2,1.6);K.paving(-4.4,-2.4,2,1.6);K.paving(4.4,3.2,2,1.6);K.paving(4.4,-2.4,2.4,1.6);K.finish();
K.fence();
// entrance arch with lanterns
for(const x of [-1.9,1.9]){B(x,1.5,8.2,.4,3,.4,'#c8434b');K.solid(x,8.2,.5,.5);}B(0,3.1,8.2,4.4,.4,.5,'#c8434b');B(0,3.1,8.47,3.6,.26,.04,'#f4e7c2');K.finish();
// stalls
K.stall({x:-7.0,z:3.2,w:2.2,d:1.4,awning:['#7aa66e','#f6f3ea'],goods:['#f2c14e','#e9b44c','#7aa66e']});      // fruit
K.stall({x:-7.0,z:-2.4,w:2.2,d:1.4,awning:['#e9a6c0','#f6f3ea'],goods:['#f6e7c4','#e9a6c0','#c98a4b']});      // bakery
K.stall({x:7.0,z:3.2,w:2.2,d:1.4,awning:['#5b9fbf','#f6f3ea'],goods:['#8fd0b4','#f2c14e','#c98a4b']});       // drinks
for(const [x,z] of [[-7.0,6.6],[7.0,6.6],[-7.2,-6.4]])K.stall({x,z,w:1.6,d:1.1,awning:['#f2c14e','#f6f3ea'],goods:['#e9806e','#7aa66e','#f6e7c4']});
K.finish();
// restaurant with outdoor tables, gift shop at the back
K.building({x:7.6,z:-2.6,w:2.8,d:3.6,h:2.8,wall:'#f6e3c4',roof:'#b85c3c',face:-1,windows:3,door:'#8a5a3a'});B(5.9,2.5,-2.6,.05,.4,2.6,'#c8434b');
K.table(4.4,-4.6);K.table(4.4,-.6);
K.building({x:0,z:-7.6,w:4.4,d:2.2,h:2.8,wall:'#e8eef6',roof:'#7a5f9e',faceZ:1,windows:3,door:'#5b4a7a'});B(0,2.55,-6.48,2.4,.4,.05,'#7a5f9e');
K.finish();
// strings of lanterns across the street
for(let z=-5.5;z<7;z+=3){B(0,3.2,z,7.4,.02,.02,'#7a6a52');for(let x=-3.3;x<=3.3;x+=1.1)S(x,3.0,z,.18,.22,.18,['#c8434b','#f2c14e','#e9806e'][Math.abs(Math.round(x))%3],8,5);}
K.tree(-8.6,-0.2,.75);K.tree(8.6,0.6,.75);K.planter(-2.8,6.0);K.planter(2.8,6.0);K.lamp(-3.0,0.4);K.lamp(3.0,-4.0);K.finish();
// ---- words change the world: shoppers arrive with first-try answers; a party table appears when the party is planned ----
const shoppers=['#5e9a85','#e0a64b','#7a5f9e','#c45b5b','#3f7a9e','#9ab06a'].map(c=>K.crowdMesh(c));
const spots=[[-1.6,5.2],[1.4,4.4],[-1.2,1.8],[1.8,1.0],[-1.8,-1.4],[1.2,-2.2],[-1.0,-4.4],[1.6,-5.4],[-2.4,7.0],[2.4,7.4],[-2.6,-6.2],[2.6,-6.8],[0.4,3.0],[-0.4,-3.4],[2.8,2.6],[-2.8,-0.4]];
const party=(()=>{B(0,.72,-.6,1.8,.08,1.1,'#f6f3ea');B(0,.36,-.6,.12,.72,.12,'#8e7052');C(0,.95,-.6,.32,.32,.36,'#f2c4d4',16);C(0,1.18,-.6,.04,.04,.14,'#f2c14e',6);
 for(const [x,c] of [[-.8,'#e9806e'],[.8,'#6fb0a8'],[-.5,'#f2c14e'],[.55,'#b98bd1']]){C(x,1.4,-.6,.01,.01,1.3,'#d6d6d6',4);S(x,2.1,-.6,.2,.26,.2,c,8,5);}return M();})();
const food=(()=>{for(const [x,z] of [[4.4,-4.6],[4.4,-.6]]){C(x-.2,.8,z,.18,.18,.04,'#fbf7ee',12);S(x-.2,.85,z,.12,.05,.1,'#e9b44c',6,3);C(x+.2,.8,z+.15,.12,.1,.12,'#8fd0b4',10);}return M();})();
return{colliders:K.colliders,render(t,yaw,fx={}){K.render(t);
 for(let i=0;i<Math.min(fx.shoppers||0,spots.length);i++){const [x,z]=spots[i],b=K.calm()?0:Math.sin(t*2+i)*.02;D(shoppers[i%shoppers.length],model(x,b,z,i*1.3));}
 if(fx.food)D(food);if(fx.party)D(party,model(0,K.calm()?0:Math.abs(Math.sin(t*1.5))*.04,0));}};};
