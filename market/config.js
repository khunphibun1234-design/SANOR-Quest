'use strict';
/* Map 04 · Market & Food Street (3D). Story engine: shared/story.js · content: content/worlds/04-market.json */
(()=>{const T=Math.PI;
SQStory.start({worldId:'04',slug:'market',icon:'🛒',build:e=>buildMarketWorld(e),
 cast:['player','alex','vendor','chef','clerk'],
 camera:{center:[0,.1,-.4],r:31,rNarrow:54},engine:{background:'#efe9dc',shadowRadius:15},
 start:id=>id==='party'?{player:[0,-3.6,0],alex:[.9,-3.2,0]}:id==='meal'?{player:[2.6,-1.6,T/2],alex:[2.4,-.7,T/2]}:{player:[0,6.6,T],alex:[.9,7.6,T]},
 follows:(id,L)=>id!=='shopping'||L.state.completed.includes('need'),
 // the vendor stands at the stall the story is using; chef at the restaurant; clerk at the gift shop
 npcs:(id,L)=>{const at=L.state.done?'fruit':L.stage.target;const spot={fruit:[-5.6,4.0,T/2],drinks:[5.6,4.0,-T/2],bakery:[-5.6,-1.6,T/2]}[at]||[-5.6,4.0,T/2];
  return{vendor:spot,chef:[5.6,-3.8,-T/2],clerk:[1.2,-5.8,0]};},
 fx:({lessons})=>({shoppers:Object.values(lessons).reduce((s,L)=>s+L.firstTry,0),food:lessons.meal.state.completed.includes('order'),party:lessons.party.state.done}),
 changeMessage:()=>({en:'🛍️ Your words brought a new shopper to the market!',th:'คำพูดของคุณทำให้มีลูกค้ามาที่ตลาดเพิ่มอีกหนึ่งคน'})});})();
