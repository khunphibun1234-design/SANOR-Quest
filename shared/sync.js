/* SANOR QUEST · class sign-in and offline-first sync.
 *
 * When a student has joined a class, every answer, speaking result, progress change and test from
 * SanorProfile goes into an outbox in this browser first (so nothing is lost without internet), then is
 * sent in batches to SQBackend.student.submit(). Re-sending is safe: the server ignores events it already has.
 *
 *   SanorClass.join(code, number, nickname, pin)   SanorClass.leave()
 *   SanorClass.info()     → {className, code, number, nickname, settings} | null
 *   SanorClass.status()   → {pending, lastSync, lastError, online, mode}
 *   SanorClass.worldOpen('02') → false when the teacher has closed that world
 *   SanorClass.testOpen('post')
 *   SanorClass.postReady()   → the post-test is open: pre-test done and all six worlds finished (or the teacher opened it)
 *   SanorClass.pretestDue()  → true until this student has done the pre-test (everyone takes it before playing,
 *                              in a class or not; a teacher can switch the class's pre-test off in the dashboard)
 *   SanorClass.onChange(fn)
 * The class's Thai-help level (if the teacher set one) is applied with SanorProfile.setClassLevel().
 */
(function(root){'use strict';
const P=root.SanorProfile,B=root.SQBackend,KEY='sanor-class-v1',OUT='sanor-outbox-v1',BATCH=100,MAX_OUTBOX=5000;
const read=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d;}catch{return d;}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch{return false;}};
let me=read(KEY,null),outbox=read(OUT,[]),lastSync=me?.lastSync||null,lastError=null,busy=false,timer=null;const listeners=new Set();
const emit=()=>{for(const f of listeners){try{f();}catch(e){console.error(e);}}};
function saveMe(){if(me)write(KEY,me);else try{localStorage.removeItem(KEY);}catch{}}
function applySettings(s){if(!me||!s)return;me.settings=s;me.className=s.className;saveMe();P.setClassLevel(s.thaiLevel||null);emit();}
// everything the profile records goes to the outbox while signed in to a class
P.onEvent(ev=>{if(!me)return;outbox.push(ev);if(outbox.length>MAX_OUTBOX)outbox=outbox.slice(-MAX_OUTBOX);write(OUT,outbox);emit();soon();});
function soon(ms=2500){clearTimeout(timer);timer=setTimeout(flush,ms);}
async function flush(){if(!me||busy)return;if(root.navigator&&root.navigator.onLine===false){lastError='offline';emit();return;}busy=true;
 try{if(outbox.length){const batch=outbox.slice(0,BATCH);await B.student.submit(me.token,batch);const sent=new Set(batch.map(e=>e.id));outbox=read(OUT,[]).filter(e=>!sent.has(e.id));write(OUT,outbox);}
  applySettings(await B.student.settings(me.token));lastSync=new Date().toISOString();me.lastSync=lastSync;saveMe();lastError=null;
  if(outbox.length)soon(300);}
 catch(e){lastError=e.message;if(e.message==='bad_token'){me.expired=true;saveMe();}}
 finally{busy=false;emit();}}
// first sign-in on this device: send what was already played, so the teacher sees it
function snapshot(){const p=P.get();for(const [world,m] of Object.entries(p.maps))for(const [activity,a] of Object.entries(m.activities))
  outbox.push({id:'snap-'+world+'-'+activity+'-'+Date.now().toString(36),kind:'progress',world,activity,xp:a.xp,done:a.done,stamps:Object.keys(m.stamps).length,at:new Date().toISOString()});
 for(const k of ['pre','post'])if(p.tests[k])outbox.push({id:'snap-test-'+k,kind:'test',test:k,score:p.tests[k].score,total:p.tests[k].total,answers:[]});write(OUT,outbox);}
const api={
 mode:B.mode,
 async join(code,number,nickname,pin){const r=await B.student.join(code,+number,nickname,pin);if(r&&r.error)throw new Error(r.error);
  me={token:r.token,code:r.settings.code,className:r.settings.className,number:r.student.number,nickname:r.student.nickname,settings:r.settings,lastSync:null};saveMe();
  if(!P.name())P.setName(r.student.nickname);applySettings(r.settings);snapshot();await flush();return api.info();},
 // PDPA: delete this student's data on the server (if in a class) and everything SANOR QUEST stored in this browser
 async deleteMyData(){if(me)await B.student.deleteMe(me.token);me=null;outbox=[];
  try{for(const k of Object.keys(localStorage))if(/^sanor-/.test(k)&&!/^sanor-(demo-db|demo-teacher|teacher-session)/.test(k))localStorage.removeItem(k);}catch{}
  emit();},
 // shared devices: clearDevice also removes this device's game progress, so the next student starts fresh
 leave(opts={}){if(opts.clearDevice){try{for(const k of Object.keys(localStorage))if(/^sanor-/.test(k)&&!/^sanor-(demo-db|demo-teacher|teacher-session)/.test(k))localStorage.removeItem(k);}catch{}}me=null;outbox=[];write(OUT,outbox);saveMe();P.setClassLevel(null);emit();},
 info:()=>me?{className:me.className,code:me.code,number:me.number,nickname:me.nickname,settings:me.settings,expired:!!me.expired}:null,
 status:()=>({pending:outbox.length,lastSync,lastError,online:!(root.navigator&&root.navigator.onLine===false),mode:B.mode}),
 worldOpen:id=>!me||!me.settings||!/^\d\d$/.test(id)||me.settings.worldsOpen.includes(id),
 testOpen:kind=>!me||!me.settings||me.settings.testsOpen.includes(kind),
 pretestDue:()=>!P.test('pre')&&api.testOpen('pre'),
 // post-test: after the pre-test, once every mission of every world is done (needs content/content.js), or earlier
 // when the teacher opens it for the class
 postReady(){if(P.test('post')||!P.test('pre'))return false;if(me&&me.settings&&me.settings.testsOpen.includes('post'))return true;
  const W=(root.SQContent||{}).worlds||{};return Object.keys(W).length>0&&Object.entries(W).every(([id,w])=>(w.missionOrder||[]).every(m=>P.activity(id,m).done));},
 flush,onChange(f){listeners.add(f);return()=>listeners.delete(f);}};
root.addEventListener('online',()=>soon(200));
root.addEventListener('pagehide',()=>{if(me&&outbox.length)flush();});
root.document&&root.document.addEventListener('visibilitychange',()=>{if(root.document.visibilityState==='visible')soon(500);});
if(me){P.setClassLevel(me.settings?.thaiLevel||null);soon(1500);}
setInterval(()=>{if(me)soon(0);},60000);
root.SanorClass=api;
})(typeof window!=='undefined'?window:globalThis);
