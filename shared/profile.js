/* SANOR QUEST · shared player profile, XP and passport stamps.
 * One record in localStorage that every world reads and writes, so the town map and the passport
 * can show progress from all worlds. Each world reports per activity with SanorProfile.record().
 *
 *   SanorProfile.record('02','buddy',{xp:60,stamps:[{id:'gate',label:'gate',icon:'🚪'}],done:false});
 *   SanorProfile.totalXp()        → number
 *   SanorProfile.level()          → 'starter' | 'explorer' | 'challenger'
 *   SanorProfile.thaiMode()       → 'show' | 'tap' | 'hide'  (Thai help shown by level)
 *   SanorProfile.th('ต้นไม้')      → '<span class="th" lang="th">ต้นไม้</span>' (escaped)
 */
(function(root){'use strict';
const KEY='sanor-profile-v1';
const XP={step:20,bonus:100};
const LEVELS={
 starter:{thai:'show',en:'Starter',th:'ผู้เริ่มต้น',about:'เห็นคำแปลภาษาไทยตลอด',icon:'🌱'},
 explorer:{thai:'tap',en:'Explorer',th:'นักสำรวจ',about:'ซ่อนคำแปลไว้ แตะเพื่อดูเมื่ออยากรู้',icon:'🧭'},
 challenger:{thai:'hide',en:'Challenger',th:'ผู้ท้าชิง',about:'ภาษาอังกฤษล้วน ไม่มีคำแปล',icon:'🏆'}};
const WORLDS={
 '01':{en:'My Home, My Story',th:'บ้านของฉัน เรื่องของฉัน',icon:'🏠',href:'home/'},
 '02':{en:'School of Adventures',th:'โรงเรียนแห่งการผจญภัย',icon:'🏫',href:'school/'},
 '03':{en:'Phibun Hometown Quest',th:'ภารกิจบ้านเกิดพิบูล',icon:'🏞️'},
 '04':{en:'Market & Food Street',th:'ตลาดและถนนอาหาร',icon:'🛒'},
 '05':{en:'Around the World',th:'รอบโลก',icon:'✈️'},
 '06':{en:'Future Makers City',th:'เมืองนักสร้างอนาคต',icon:'🤖'},
 review:{en:'Daily Review',th:'ทบทวนประจำวัน',icon:'🔁',href:'review/',bonus:true}};
// speaking results, best first; adaptive help looks at the last RECENT first-try answers
const SPEECH_RANK={asr:4,self:3,'not-yet':2,skip:1},RECENT=20;
const clean=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fresh=()=>({version:1,name:'',level:'starter',maps:{},recent:[],answers:0,adviceAfter:0,supportOn:false,createdAt:new Date().toISOString(),updatedAt:null});
let storageOK=true;

function sanitize(s){const out=fresh();if(!s||typeof s!=='object'||s.version!==1)return null;
 out.name=clean(s.name,20);out.level=Object.hasOwn(LEVELS,s.level)?s.level:'starter';
 if(typeof s.createdAt==='string')out.createdAt=s.createdAt;if(typeof s.updatedAt==='string')out.updatedAt=s.updatedAt;
 for(const [id,m] of Object.entries(s.maps||{})){if(!Object.hasOwn(WORLDS,id)||!m||typeof m!=='object')continue;const map={activities:{},stamps:{},speech:{}};
  for(const [a,v] of Object.entries(m.activities||{})){if(!/^[a-z0-9-]{1,24}$/.test(a)||!v)continue;map.activities[a]={xp:Math.max(0,Math.min(5000,Math.round(+v.xp||0))),done:v.done===true,at:typeof v.at==='string'?v.at:null};}
  for(const [k,v] of Object.entries(m.stamps||{})){if(!/^[a-z0-9-]{1,40}$/.test(k)||!v)continue;map.stamps[k]={label:clean(v.label,40),icon:clean(v.icon,8),at:typeof v.at==='string'?v.at:null};}
  for(const [k,v] of Object.entries(m.speech||{})){if(!/^[a-z0-9-]{1,40}$/.test(k)||!v||!SPEECH_RANK[v.best])continue;map.speech[k]={best:v.best,tries:Math.max(0,Math.min(999,+v.tries||0)),score:Math.max(0,Math.min(1,+v.score||0)),at:typeof v.at==='string'?v.at:null};}
  out.maps[id]=map;}
 out.recent=Array.isArray(s.recent)?s.recent.filter(x=>x===0||x===1).slice(-RECENT):[];out.answers=Math.max(0,Math.round(+s.answers||0));out.adviceAfter=Math.max(0,Math.round(+s.adviceAfter||0));out.supportOn=s.supportOn===true;
 return out;}
function load(){try{const s=sanitize(JSON.parse(localStorage.getItem(KEY)));storageOK=true;if(s)return s;}catch{storageOK=false;}return migrate(fresh());}
// First visit after the update: carry over the name and Map 01 progress saved by the older version.
function migrate(p){try{const old=JSON.parse(localStorage.getItem('sanor-home-welcome-v1'));if(old&&old.version===1){p.name=clean(old.name,20);const done=Array.isArray(old.completed)?old.completed.filter(x=>typeof x==='string').length:0;if(done){p.maps['01']={activities:{welcome:{xp:Math.min(10,done)*XP.step+(old.done?XP.bonus:0),done:!!old.done,at:null}},stamps:{}};}}}catch{}return p;}
let state=load();const listeners=new Set();
function save(){state.updatedAt=new Date().toISOString();try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}emit();}
function emit(){applyThai();for(const f of listeners){try{f(api.get());}catch(e){console.error(e);}}}
root.addEventListener?.('storage',e=>{if(e.key===KEY||e.key===null){state=load();emit();}});

function map(id){if(!Object.hasOwn(WORLDS,id))throw Error('Unknown world '+id);const m=state.maps[id]||(state.maps[id]={activities:{},stamps:{},speech:{}});m.speech=m.speech||{};return m;}
const mapXp=id=>Object.values(state.maps[id]?.activities||{}).reduce((s,a)=>s+a.xp,0);

// ---------- Thai help (scaffolding) ----------
function thaiMode(){return LEVELS[state.level].thai;}
function applyThai(doc=root.document){if(!doc?.documentElement)return;doc.documentElement.dataset.thai=thaiMode();}
function th(text,tag='span'){return text?`<${tag} class="th" lang="th">${esc(text)}</${tag}>`:'';}
if(root.document){applyThai();
 // Explorer level: Thai is veiled; tapping (or Enter/Space on) a veiled line reveals it.
 const reveal=e=>{const el=e.target.closest?.('.th');if(!el||thaiMode()!=='tap')return;if(e.type==='keydown'&&e.key!=='Enter'&&e.key!==' ')return;if(!el.classList.contains('open')){e.preventDefault();e.stopPropagation();el.classList.add('open');}};
 root.document.addEventListener('click',reveal,true);root.document.addEventListener('keydown',reveal,true);
 // Keep veiled lines reachable by keyboard and labelled for screen readers.
 const mark=()=>{for(const el of root.document.querySelectorAll('.th')){if(thaiMode()==='tap'&&!el.classList.contains('open')){el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','แตะเพื่อดูคำแปลภาษาไทย');}else{el.removeAttribute('tabindex');el.removeAttribute('role');el.removeAttribute('aria-label');}}};
 new MutationObserver(mark).observe(root.document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-thai','class']});
 root.document.addEventListener('DOMContentLoaded',mark);}

// A small header control every page can mount: cycles the three levels.
function mountLevelButton(host){if(!host)return;const b=root.document.createElement('button');b.type='button';b.className='sq-level';
 const paint=()=>{const L=LEVELS[state.level];b.innerHTML=`<span aria-hidden="true">${L.icon}</span><span class="sq-level-text">ภาษาไทย: <b>${{show:'เปิด',tap:'แตะดู',hide:'ปิด'}[L.thai]}</b></span>`;b.title=`ระดับ ${L.th} (${L.en}) · ${L.about} · คลิกเพื่อเปลี่ยน`;b.setAttribute('aria-label',`ตัวช่วยภาษาไทย: ${L.about}. กดเพื่อเปลี่ยนระดับ`);};
 b.onclick=()=>{const order=Object.keys(LEVELS);api.setLevel(order[(order.indexOf(state.level)+1)%order.length]);};
 listeners.add(paint);paint();host.append(b);return b;}

const api={XP,LEVELS,WORLDS,KEY,
 get:()=>JSON.parse(JSON.stringify(state)),storageOK:()=>storageOK,
 name:()=>state.name,setName(n){const v=clean(n,20);if(v!==state.name){state.name=v;save();}},
 level:()=>state.level,setLevel(l){if(Object.hasOwn(LEVELS,l)&&l!==state.level){state.level=l;save();}},
 thaiMode,applyThai,th,esc,mountLevelButton,
 // Report an activity's progress. XP never goes down (replaying keeps your best), stamps are kept forever.
 record(mapId,activity,{xp=0,stamps=[],done=false}={}){const m=map(mapId);const a=m.activities[activity]||(m.activities[activity]={xp:0,done:false,at:null});let changed=false;
  const x=Math.max(0,Math.round(+xp||0));if(x>a.xp){a.xp=x;changed=true;}if(done&&!a.done){a.done=true;a.at=new Date().toISOString();changed=true;}
  for(const s of stamps){const id=String(s.id||'').toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,40);if(!id||m.stamps[id])continue;m.stamps[id]={label:clean(s.label,40),icon:clean(s.icon,8),at:new Date().toISOString()};changed=true;}
  if(changed)save();return changed;},
 mapXp,totalXp:()=>Object.keys(state.maps).reduce((s,id)=>s+mapXp(id),0),
 stamps:id=>Object.entries(state.maps[id]?.stamps||{}).map(([k,v])=>({id:k,...v})),
 activity:(id,a)=>({...(state.maps[id]?.activities?.[a]||{xp:0,done:false,at:null})}),
 onChange(f){listeners.add(f);return()=>listeners.delete(f);},
 // ---------- speaking ----------
 // result from SQVoice: {mode:'asr'|'self'|'skip', passed, score}. Keeps the best result per task.
 recordSpeech(mapId,id,r={}){const m=map(mapId);id=String(id).toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,40);
  const best=r.mode==='skip'?'skip':!r.passed?'not-yet':r.mode==='asr'?'asr':'self';const cur=m.speech[id]||{best:'skip',tries:0,score:0,at:null};
  cur.tries++;if(SPEECH_RANK[best]>=SPEECH_RANK[cur.best]){cur.best=best;cur.at=new Date().toISOString();}cur.score=Math.max(cur.score,+r.score||0);m.speech[id]=cur;save();return{...cur};},
 speech:id=>Object.entries(state.maps[id]?.speech||{}).map(([k,v])=>({id:k,...v})),
 speechStats(){const all=Object.values(state.maps).flatMap(m=>Object.values(m.speech||{}));return{tasks:all.length,spoken:all.filter(v=>v.best==='asr'||v.best==='self').length,recognised:all.filter(v=>v.best==='asr').length,skipped:all.filter(v=>v.best==='skip').length};},
 // ---------- adaptive help ----------
 // Call once per question with whether the FIRST answer was right without a hint.
 logAnswer(firstTry){state.recent.push(firstTry?1:0);state.recent=state.recent.slice(-RECENT);state.answers++;const a=api.accuracy();
  if(a.n>=8&&a.rate<.5)state.supportOn=true;else if(state.supportOn&&a.rate>=.65)state.supportOn=false;save();},
 accuracy(){const n=state.recent.length;return{n,rate:n?state.recent.reduce((x,y)=>x+y,0)/n:0};},
 // More help (fewer choices, hints shown after a mistake) while first-try accuracy is under 50%.
 support:()=>state.supportOn,
 // 'level-up' when the last answers are over 85% right and there is a level left to try.
 advice(){const a=api.accuracy();if(a.n>=12&&a.rate>.85&&state.level!=='challenger'&&state.answers>=state.adviceAfter)return'level-up';return null;},
 nextLevel(){const o=Object.keys(LEVELS);return o[Math.min(o.length-1,o.indexOf(state.level)+1)];},
 snoozeAdvice(){state.adviceAfter=state.answers+10;save();},
 reset(){state=fresh();save();}};
root.SanorProfile=api;
})(typeof window!=='undefined'?window:globalThis);
