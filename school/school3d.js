'use strict';
/* Map 02 · School of Adventures (3D). The story engine is shared/story.js; content is content/worlds/02-school.json.
 * This file says who is where in the school and how the player's words change it. */
(()=>{
const T=Math.PI;
SQStory.start({
 worldId:'02',slug:'school',icon:'🏫',reportHeader:'SANOR QUEST  /  MAP 02',
 build:e=>buildSchoolWorld(e),
 cast:['player','alex','teacher','librarian'],
 camera:{center:[0,.1,-.2],r:31,rNarrow:54},
 engine:{background:'#e4ebe0',shadowRadius:15},
 start:id=>id==='timetable'?{player:[0,6.4,T],alex:[.9,7.6,T]}:id==='club'?{player:[-3.6,-.2,-T/2],alex:[-3.4,.7,-T/2]}:{player:[0,4.6,T],alex:[.9,5.3,T]},
 follows:(id,L)=>id!=='timetable'||L.state.completed.includes('nervous'),
 npcs:(id,L)=>({
  teacher:id==='club'&&(L.stage.id==='concert'||L.state.done)?[2.3,-6.0,0]:[5.2,4.9,-T/2],
  librarian:[-5.1,-6.5,T/2]}),
 // every first-try answer brings a student to the concert audience; joining the club puts up lights and bunting;
 // reading the timetable puts a gold star on the notice board
 fx:({lessons})=>{const n=Object.values(lessons).reduce((s,L)=>s+L.firstTry,0),club=lessons.club;
  return{audience:n,cheer:club.state.done,star:lessons.timetable.state.done,bunting:club.state.completed.includes('introduce'),lights:club.state.completed.includes('stage')};},
 changeMessage:()=>({en:'🎵 Your words brought a new friend to the school concert!',th:'คำพูดของคุณชวนเพื่อนใหม่มาดูคอนเสิร์ตของโรงเรียน'})});
})();
