/* SANOR QUEST · story mission rules (any world, any story mission).
 *
 *   const C = StoryContent('02', 'timetable')   // content/worlds/*.json reshaped for the story runner
 *   const lesson = new StoryLesson(savedState, C)
 *
 * A story mission is a list of stages. Each stage happens at a place and has questions, answered in order;
 * an "anyOrder" stage (e.g. the home tour) lets the player visit its places in any order (question.at = place).
 * The last stage is the finale: a writing card, speaking practice and a short reflection.
 * XP: 20 per question + 100 for finishing (SanorProfile.XP).
 */
(function(root){'use strict';
const clean=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
const MOODS=['ready','practice','help'],NEXTS=['welcome','rooms','listening','speaking'];

// Reshape a story mission from content JSON into the flat form the runner and lesson use.
function StoryContent(worldId,missionId){
 const SQ=root.SQContent,world=SQ.worlds[worldId],m=world.missions.find(x=>x.id===missionId);
 if(!m||m.type!=='story')throw Error('Not a story mission: '+worldId+'/'+missionId);
 const places=world.places||m.places;
 return{worldId,missionId,world,mission:m,title:m.title,summary:m.summary,
  stages:m.stages.map(s=>({id:s.id,th:s.th,title:s.title,en:s.subtitle,target:s.target,go:s.go,ids:s.questions.slice(),anyOrder:!!s.anyOrder})),
  places:Object.fromEntries(Object.entries(places).map(([k,p])=>[k,{th:p.th,name:p.name,en:p.en,x:p.pos[0],y:p.pos[1],z:p.pos[2],approach:p.approach.slice(),icon:p.icon}])),
  questions:Object.fromEntries(Object.entries(m.questions).map(([k,q])=>{const o={kind:q.kind,speaker:q.speaker,line:q.line.en,thai:q.line.th,prompt:q.prompt.en,promptTh:q.prompt.th,hint:q.hint.en,hintTh:q.hint.th,why:q.why.en,whyTh:q.why.th,reply:q.reply.en,at:q.at,table:q.table};
   if(q.choices){o.choices=q.choices.map(c=>c.en);o.answer=q.answer;}if(q.tokens)o.tokens=q.tokens.slice();return [k,o];})),
  speaking:(m.speaking||[]).map(s=>s.en),speakingTh:(m.speaking||[]).map(s=>s.th||''),speakPrompt:m.speakPrompt,
  card:m.card||null};}

class StoryLesson{
 constructor(saved,C){this.C=C;const total=this.total;
  this.state={version:1,studiedTable:false,lunch:null,name:'Mook',completed:[],attempts:{},aided:[],card:Object.fromEntries((C.card?.fields||[]).map(f=>[f.id,''])),spoken:[],mood:'',next:'',done:false,completedAt:null};
  if(saved?.version!==1)return;const s=this.state;s.studiedTable=saved.studiedTable===true;
  const lunch=saved.lunch;   // Map 01 kept the 2D lunch scene's progress here before Lunch with Alex became its own mission
  if(lunch&&Number.isInteger(lunch.index)&&lunch.index>=0&&lunch.index<=10&&Array.isArray(lunch.rows)&&lunch.rows.length===10&&lunch.rows.every((row,i)=>row&&typeof row.hint==='boolean'&&Array.isArray(row.answers)&&row.answers.every(n=>Number.isInteger(n)&&n>=0&&n<10)&&(i>=lunch.index||row.answers.at(-1)===i)))s.lunch=lunch;
  s.name=clean(saved.name,20)||'Mook';
  // restore answers only in an order the game could really have produced
  let open=true;for(const st of C.stages){if(!open)break;for(const id of st.ids){if(Array.isArray(saved.completed)&&saved.completed.includes(id))s.completed.push(id);else if(!st.anyOrder){open=false;break;}}if(!st.ids.every(id=>s.completed.includes(id)))open=false;}
  for(const id of Object.keys(C.questions)){const n=saved.attempts?.[id];if(Number.isInteger(n)&&n>=0)s.attempts[id]=Math.min(n,1000);}
  s.aided=Array.isArray(saved.aided)?[...new Set(saved.aided.filter(id=>Object.hasOwn(C.questions,id)||id==='card'))]:[];
  for(const k of Object.keys(s.card))s.card[k]=clean(saved.card?.[k],180);
  s.spoken=Array.isArray(saved.spoken)?[...new Set(saved.spoken.filter(i=>Number.isInteger(i)&&i>=0&&i<C.speaking.length))]:[];
  s.mood=MOODS.includes(saved.mood)?saved.mood:'';s.next=NEXTS.includes(saved.next)?saved.next:'';
  s.done=!!saved.done&&s.completed.length===total&&!this.validateCard(s.card).length&&!!s.mood&&!!s.next;
  s.completedAt=s.done&&typeof saved.completedAt==='string'?saved.completedAt:null;}
 get total(){return this.C.stages.reduce((n,s)=>n+s.ids.length,0);}
 get stageIndex(){return this.C.stages.findIndex(st=>!st.ids.every(id=>this.state.completed.includes(id))||!st.ids.length);}
 get stage(){return this.C.stages[this.stageIndex];}
 get finale(){return!this.stage.ids.length;}
 get xp(){return this.state.completed.length*20+(this.state.done?100:0);}
 get firstTry(){return this.state.completed.filter(id=>this.state.attempts[id]===1&&!this.state.aided.includes(id)).length;}
 nextQuestion(place){if(this.state.done||this.finale)return null;const st=this.stage,left=st.ids.filter(id=>!this.state.completed.includes(id));
  if(st.anyOrder)return left.find(id=>this.C.questions[id].at===place)||null;return st.target===place?left[0]||null:null;}
 target(){const st=this.stage;if(st.anyOrder){const id=st.ids.find(id=>!this.state.completed.includes(id));return id?this.C.questions[id].at:st.target;}return st.target;}
 // places the player should visit now (several in an any-order stage)
 targets(){const st=this.stage;return st.anyOrder?st.ids.filter(id=>!this.state.completed.includes(id)).map(id=>this.C.questions[id].at):[st.target];}
 aid(id){if((Object.hasOwn(this.C.questions,id)||id==='card')&&!this.state.aided.includes(id))this.state.aided.push(id);}
 answer(id,value){const q=this.C.questions[id];if(!q||!this.stage.ids.includes(id)||this.state.completed.includes(id))return{accepted:false};
  if(!this.stage.anyOrder&&this.stage.ids.find(x=>!this.state.completed.includes(x))!==id)return{accepted:false};
  this.state.attempts[id]=(this.state.attempts[id]||0)+1;
  const correct=root.SQMission?root.SQMission.check(q,value):q.kind==='order'?Array.isArray(value)&&value.join(' ')===q.tokens.join(' '):value===q.answer;
  if(correct)this.state.completed.push(id);return{accepted:true,correct,why:q.why,reply:q.reply};}
 validateCard(card){const C=this.C;if(!C.card)return[];return C.card.fields.filter(f=>!root.SQMission.checkWriting(card[f.id]||'',f.rules)).map(f=>f.id);}
 finish(card,mood,next,spoken){if(this.state.done)return{ok:true,already:true};const safe={};for(const k of Object.keys(this.state.card))safe[k]=clean(card[k],180);this.state.card=safe;
  const errors=this.validateCard(safe);if(this.state.completed.length!==this.total||errors.length)return{ok:false,errors};
  if(!MOODS.includes(mood)||!NEXTS.includes(next))return{ok:false,reflection:true};
  Object.assign(this.state,{mood,next,spoken:[...new Set(spoken.filter(i=>Number.isInteger(i)&&i>=0&&i<this.C.speaking.length))],done:true,completedAt:new Date().toISOString()});return{ok:true};}}
root.StoryContent=StoryContent;root.StoryLesson=StoryLesson;
})(typeof window!=='undefined'?window:globalThis);
