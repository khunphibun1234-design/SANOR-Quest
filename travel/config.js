'use strict';
/* Map 05 · Around the World (3D). Story engine: shared/story.js · content: content/worlds/05-travel.json */
(()=>{const T=Math.PI;
SQStory.start({worldId:'05',slug:'travel',icon:'✈️',build:e=>buildTravelWorld(e),
 cast:['player','alex','officer','clerk'],
 camera:{center:[0,.1,-.4],r:31,rNarrow:54},engine:{background:'#e8edf0',shadowRadius:15},
 start:id=>id==='lostbag'?{player:[-3.4,-3.6,-T/2],alex:[-3.2,-2.6,-T/2]}:id==='hotel'?{player:[3.6,4.6,T/2],alex:[3.4,5.4,T/2]}:{player:[-1.2,7.4,T],alex:[-.2,7.6,T]},
 follows:(id,L)=>id!=='lostbag'||L.state.completed.includes('missing'),
 // the officer works at the information desk or the lost and found; the clerk at the station or the hotel
 npcs:(id,L)=>{const at=L.state.done?'':L.stage.target;
  return{officer:at==='lost'?[-6.0,4.4,T/2]:[0,-.9,0],clerk:at==='station'?[5.6,-4.0,-T/2]:[6.0,3.4,-T/2]};},
 fx:({lessons})=>({travellers:Object.values(lessons).reduce((s,L)=>s+L.firstTry,0),board:lessons.directions.state.done,bag:lessons.lostbag.state.completed.includes('arrive')}),
 changeMessage:()=>({en:'🧳 Your words helped another traveller find the way!',th:'คำพูดของคุณช่วยให้นักเดินทางอีกคนหาทางเจอ'})});})();
