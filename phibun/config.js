'use strict';
/* Map 03 · Phibun Hometown Quest (3D). Story engine: shared/story.js · content: content/worlds/03-phibun.json */
(()=>{const T=Math.PI;
SQStory.start({worldId:'03',slug:'phibun',icon:'🏞️',build:e=>buildPhibunWorld(e),
 cast:['player','alex','grandma','boatman','vendor'],
 camera:{center:[0,.1,-.6],r:31,rNarrow:54},engine:{background:'#e2ecee',shadowRadius:15},
 start:id=>id==='songkran'?{player:[-2.6,3.4,-T/2],alex:[-2.6,4.3,-T/2]}:id==='plans'?{player:[2.6,-1.6,T],alex:[1.8,-1.4,T]}:{player:[0,6.4,T],alex:[.9,7.6,T]},
 follows:(id,L)=>id!=='guide'||L.state.completed.includes('town'),
 npcs:()=>({grandma:[-5.4,7.4,-T/2],boatman:[4.6,-3.4,0],vendor:[6.0,3.1,-T/2]}),
 // first-try answers light paper lanterns along the river; Songkran brings bunting and water play; the changed-plans mission brings rain
 fx:({lessons})=>{const n=Object.values(lessons).reduce((s,L)=>s+L.firstTry,0),P=lessons.plans;
  return{lanterns:n,songkran:lessons.songkran.state.completed.includes('when'),rain:P.state.completed.includes('instead')&&!P.state.completed.includes('recount')};},
 changeMessage:()=>({en:'🏮 Your words lit a lantern by the Mun River!',th:'คำพูดของคุณจุดโคมริมแม่น้ำมูลขึ้นหนึ่งดวง'})});})();
