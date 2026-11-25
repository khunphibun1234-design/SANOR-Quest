'use strict';
/* Map 01 · My Home, My Story. The story engine is shared/story.js; this file only sets up the home:
 * the 3D house (world.js), who is where, and how the player's words change the home. */
(()=>{
const P=window.SanorProfile,HIDE={x:300,z:300,angle:0,walk:false};
// first-try answers grow flowers along the path (welcome + garden missions)
const bloomAt=[];
SQStory.start({
 worldId:'01',slug:'home',icon:'🏠',mainMission:'welcome',mainStampPrefix:'home',mainCardStamp:'home-card',
 keys:{welcome:'sanor-home-welcome-v1'},reportHeader:'SANOR QUEST  /  MAP 01',
 build:e=>{const w=buildHomeWorld(e);return{colliders:w.colliders,render:(t,yaw,fx)=>w.render(t,HIDE,HIDE,HIDE,yaw,fx.served,fx.tableReady,fx)};},
 cast:['player','alex','mum','dad'],
 start:id=>id==='garden'?{player:[1.5,.9,Math.PI],alex:[2.3,1.9,Math.PI]}:{player:[0,7,Math.PI],alex:[.85,5.6,0]},
 follows:(id,L)=>id!=='welcome'||L.state.completed.includes('name'),
 npcs:(id,L,all)=>({
  mum:id==='welcome'&&L.stage.id==='offer'?[3.35,-1.25,0]:id==='garden'&&L.stage.id==='plans'?[2.2,-.3,.4]:[-1.8,-.5,0],
  dad:all.welcome.state.done?[-3.4,.9,.6,'wave']:null}),
 fx:({clock,lessons})=>{const W=lessons.welcome,G=lessons.garden,n=W.firstTry+G.firstTry;while(bloomAt.length<n)bloomAt.push(clock);bloomAt.length=Math.min(bloomAt.length,n);
  return{flowers:n,bloomAt,bunting:['greet','name'].every(id=>W.state.completed.includes(id)),lamp:W.state.completed.includes('listen'),
   served:W.state.completed.includes('serve'),tableReady:P.activity('01','table').done,sprinkler:G.state.completed.includes('help')};},
 changeMessage:()=>({en:'🌸 Your words made a flower bloom by the path!',th:'คำพูดของคุณทำให้ดอกไม้บานริมทางเดิน'}),
 // the first time: study the 10 words for the visit before meeting Alex
 beforeStart(id,lesson,ui){if(id!=='welcome'||lesson.state.studiedTable||lesson.state.completed.length)return false;studyTable(lesson,ui);return true;}});

function studyTable(lesson,ui){
 const $=id=>document.getElementById(id);ui.save();ui.show('bookOverlay');
 $('bookTitle').textContent='Alex’s Table · Words for your home visit';
 $('bookGuide').textContent=lesson.state.name+', before you welcome Alex, listen to these 10 words and say them aloud. When you are ready, use them at home.';
 $('enterStory').hidden=false;const list=$('vocabList');list.replaceChildren();
 for(const [word,line,,icon,meaning] of window.AlexTableWords){
  const headings={garden:'Places at home',table:'At the table',water:'Drinks'};
  if(headings[word]){const h=document.createElement('h3');h.textContent=headings[word];list.append(h);}
  const row=document.createElement('div');row.className='vocab-row';row.innerHTML='<div><strong></strong><small></small><p></p></div><button type="button">♫</button>';
  const title=row.querySelector('strong');title.textContent=icon+' '+word;
  if(word==='table'){const pic=document.createElement('img');pic.src='dining-table.svg';pic.alt='';pic.width=38;pic.height=29;title.prepend(pic);}
  row.querySelector('small').textContent=meaning;row.querySelector('p').textContent=line;
  const b=row.querySelector('button');b.setAttribute('aria-label','Listen to '+word+' and the example sentence');b.onclick=()=>ui.speak(word+'. '+line);list.append(row);}}
})();
