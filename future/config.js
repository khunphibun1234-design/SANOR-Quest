'use strict';
/* Map 06 · Future Makers City (3D). Story engine: shared/story.js · content: content/worlds/06-future.json */
(()=>{const T=Math.PI;
SQStory.start({worldId:'06',slug:'future',icon:'🤖',build:e=>buildFutureWorld(e),
 cast:['player','alex','engineer','mayor'],
 camera:{center:[0,.1,-.4],r:31,rNarrow:54},engine:{background:'#e6eef0',shadowRadius:15},
 start:id=>id==='ideas'?{player:[3.0,-1.4,T],alex:[3.8,-1.0,T]}:id==='present'?{player:[-3.4,2.4,-T/2],alex:[-3.4,3.4,-T/2]}:{player:[-1.2,2.0,T],alex:[-.2,2.4,T]},
 // the engineer works in the lab, the makerspace or the energy park; the mayor stays at city hall or watches the stage
 npcs:(id,L)=>{const at=L.state.done?'':L.stage.target;
  return{engineer:{maker:[-6.0,5.2,T/2],energy:[4.2,-5.4,0],garden:[4.0,2.8,T/2]}[at]||[-6.0,-3.0,T/2],mayor:at==='stage'?[0,3.0,0]:[1.2,-5.8,0]};},
 fx:({lessons})=>({citizens:Object.values(lessons).reduce((s,L)=>s+L.firstTry,0),robot:lessons.design.state.completed.includes('fixed'),busStop:lessons.ideas.state.done,screen:lessons.present.state.completed.includes('open')}),
 changeMessage:()=>({en:'🏙️ Your words brought a new citizen to the city!',th:'คำพูดของคุณทำให้มีชาวเมืองมาเพิ่มอีกหนึ่งคน'})});})();
