/* SANOR QUEST · shared mission player.
 * One place that knows every kind of task, so a new world only needs content JSON and a 3D scene.
 *
 *   kinds: choice · listen · order · speak · write · tap3d
 *
 *   SQMission.check(task, value)          → true/false  (pure; also used in tests and lesson.js)
 *   SQMission.render(el, task, options)   → controller   (draws the answer area for one task)
 *   SQMission.tracker(task)               → {answer(value), useHint(), result()}  (attempt bookkeeping, e.g. tap3d)
 *
 * render options:
 *   fill(text)            replace {name} etc.         onPick(value, button)  called for every answer
 *   rotate                choice display rotation     letters                show A/B/C badges
 *   decide(value)         host decides correctness (default: SQMission.check)
 *   onResult({correct, value, attempts, button})
 * Thai help and colours come from shared/tokens.css; Map pages may restyle .choice, .token, etc.
 */
(function(root){'use strict';
const norm=s=>String(s).toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KINDS=['choice','listen','order','speak','write','tap3d'];
const text=t=>t==null?'':typeof t==='string'?t:t.en;

// Similarity of two sentences by shared words (for spoken answers): 0..1
function overlap(said,target){const a=norm(said).split(' ').filter(Boolean),b=norm(target).split(' ').filter(Boolean);if(!b.length)return 0;let hit=0;const pool=[...a];for(const w of b){const i=pool.indexOf(w);if(i>=0){hit++;pool.splice(i,1);}}return hit/b.length;}

// Rules for short written answers: {minWords, all:[regex], any:[regex]}
function checkWriting(value,rules={}){const v=String(value||'');const words=(v.match(/[a-z]+(?:'[a-z]+)?/gi)||[]).length;
 if(words<(rules.minWords||1))return false;
 if((rules.all||[]).some(r=>!new RegExp(r,'i').test(v)))return false;
 if(rules.any&&rules.any.length&&!rules.any.some(r=>new RegExp(r,'i').test(v)))return false;return true;}

function check(task,value){switch(task.kind){
 case 'choice':case 'listen':return value===task.answer;
 case 'order':return Array.isArray(value)&&value.join(' ')===task.tokens.join(' ');
 case 'speak':return value&&value.selfCheck===true?true:overlap(value&&value.said!=null?value.said:value,text(task.target||task.line))>=(task.threshold||.75);
 case 'write':return checkWriting(value,task.rules);
 case 'tap3d':return value===task.answer;
 default:throw Error('Unknown task kind: '+task.kind);}}

function tracker(task){const st={attempts:0,hint:false,hintBeforeFirst:null,first:undefined,correct:false};
 return{answer(value){if(st.correct)return{accepted:false};st.attempts++;if(st.first===undefined)st.first=value;const correct=check(task,value);if(correct)st.correct=true;return{accepted:true,correct,attempts:st.attempts};},
  useHint(){if(!st.hint){st.hint=true;st.hintBeforeFirst=st.attempts===0;}},
  result:()=>({...st,firstTry:st.correct&&st.attempts===1&&!st.hint})};}

// Same shuffle the original Map 01 used for word banks, so the game looks the same.
const bankOrder=tokens=>tokens.map((t,i)=>({t,i})).sort((a,b)=>((a.i*7+3)%tokens.length)-((b.i*7+3)%tokens.length));

function render(el,task,o={}){
 const fill=o.fill||(s=>s),decide=o.decide||(v=>check(task,v));let done=false,attempts=0;const doc=el.ownerDocument;
 const finish=(value,button)=>{if(done)return;o.onPick&&o.onPick(value,button);const r=decide(value);if(r===null||r===undefined)return; // host ignored it
  attempts++;const correct=!!r;if(correct){done=true;button&&button.classList.add('correct');lock();}else button&&button.classList.add('wrong');
  o.onResult&&o.onResult({correct,value,attempts,button});};
 const lock=()=>el.querySelectorAll('button,textarea,input').forEach(b=>{if(!b.classList.contains('sq-keep'))b.disabled=true;});
 const btn=(cls,html,on)=>{const b=doc.createElement('button');b.type='button';b.className=cls;b.innerHTML=html;b.onclick=()=>on(b);return b;};
 el.innerHTML='';
 if(task.kind==='choice'||task.kind==='listen'){const n=task.choices.length,rot=o.rotate||0,order=[...Array(n).keys()].map(i=>(i+rot)%n);
  const wrap=doc.createElement('div');wrap.className='choices';
  order.forEach((v,i)=>{const b=btn('choice',(o.letters?`<span class="letter">${'ABCDEF'[i]}</span>`:'')+`<span lang="en">${esc(fill(text(task.choices[v])))}</span>`,b=>{b.disabled=true;finish(v,b);});b.dataset.answer=v;wrap.append(b);});el.append(wrap);}
 else if(task.kind==='order'){let picked=[];const bank=bankOrder(task.tokens);
  el.innerHTML='<div class="order-slots" aria-label="Your sentence"></div><div class="token-bank"></div><button type="button" class="secondary sq-check">Check sentence</button>';
  const slots=el.querySelector('.order-slots'),bankEl=el.querySelector('.token-bank'),checkBtn=el.querySelector('.sq-check');
  const paint=()=>{slots.innerHTML=picked.length?'':'<span class="order-empty">Tap the words to build a sentence.</span>';
   for(const idx of picked){const b=btn('token',esc(task.tokens[idx]),()=>{if(done)return;picked=picked.filter(i=>i!==idx);paint();});b.setAttribute('aria-label','Remove '+task.tokens[idx]+' from the sentence');slots.append(b);}
   bankEl.innerHTML='';for(const v of bank){const b=btn('token',esc(v.t),()=>{picked.push(v.i);paint();});b.disabled=done||picked.includes(v.i);bankEl.append(b);}
   checkBtn.disabled=done||picked.length!==task.tokens.length;};
  paint();checkBtn.onclick=()=>finish(picked.map(i=>task.tokens[i]),null);}
 else if(task.kind==='speak'){const target=fill(text(task.target||task.line));const SR=root.SpeechRecognition||root.webkitSpeechRecognition;
  el.innerHTML=`<div class="sq-speak"><p class="sq-say" lang="en">“${esc(target)}”</p><div class="sq-row"></div><p class="sq-heard" role="status"></p></div>`;
  const row=el.querySelector('.sq-row'),heard=el.querySelector('.sq-heard');
  if(SR&&!o.selfCheckOnly){row.append(btn('primary sq-mic','🎤 Speak',b=>{const rec=new SR();rec.lang='en-US';rec.interimResults=false;rec.maxAlternatives=3;b.disabled=true;heard.textContent='Listening…';
    rec.onresult=e=>{const alts=[...e.results[0]].map(r=>r.transcript);const best=alts.sort((x,y)=>overlap(y,target)-overlap(x,target))[0];heard.textContent='I heard: “'+best+'”';b.disabled=false;finish({said:best},null);};
    rec.onerror=()=>{heard.textContent='The microphone did not work. Say it aloud and tap “I said it”.';b.disabled=false;};rec.onend=()=>{b.disabled=false;};rec.start();}));}
  row.append(btn('secondary sq-self','✓ I said it',b=>finish({selfCheck:true},b)));}
 else if(task.kind==='write'){el.innerHTML=`<label class="sq-write"><span>${esc(text(task.prompt)||'Write your answer')}</span><textarea rows="2" maxlength="${task.maxLength||180}" placeholder="${esc(text(task.example)||'')}"></textarea></label><button type="button" class="secondary sq-check">Check</button>`;
  const ta=el.querySelector('textarea');el.querySelector('.sq-check').onclick=b=>finish(ta.value.trim(),null);}
 else if(task.kind==='tap3d'){/* the 3D scene calls controller.pick(id) */}
 else throw Error('Unknown task kind: '+task.kind);
 return{pick:v=>finish(v,null),lock,get done(){return done;},get attempts(){return attempts;}};}

root.SQMission={KINDS,check,checkWriting,overlap,tracker,render,bankOrder,norm};
if(typeof module!=='undefined')module.exports=root.SQMission;
})(typeof window!=='undefined'?window:globalThis);
