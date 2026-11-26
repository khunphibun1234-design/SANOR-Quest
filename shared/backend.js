/* SANOR QUEST · classroom backend client.
 *   SQBackend.mode            'supabase' (shared/config.js is filled in) or 'demo' (everything in this browser)
 *   SQBackend.student.join(code, number, nickname, pin) → {token, student:{number,nickname}, settings}
 *   SQBackend.student.settings(token) → settings          SQBackend.student.submit(token, events) → count
 *   SQBackend.teacher.signUp / signIn / signOut / session / classes / createClass / updateClass / report /
 *                     studentDetail / resetPin / removeStudent
 *   SQBackend.teacher.amCoordinator / networkReport / recentErrors(days)   (project leads only: no names, counts only)
 *   SQBackend.reportErrors([{page,message,source,version,agent}])        (no sign-in; shared/errors.js)
 * Errors are thrown as Error(code), e.g. 'class_not_found', 'wrong_pin', 'locked', 'bad_token', 'offline'.
 * Both implementations follow the same rules as supabase/migrations/*.sql (tests check this). */
(function(root){'use strict';
const cfg=root.SQ_CONFIG||{},LS=root.localStorage;
const read=(k,d)=>{try{const v=JSON.parse(LS.getItem(k));return v??d;}catch{return d;}},write=(k,v)=>{try{LS.setItem(k,JSON.stringify(v));}catch{}};
const ERRORS=['class_not_found','wrong_pin','locked','bad_token','bad_pin_format','bad_number','bad_nickname','not_signed_in','not_your_class','bad_batch','invalid_credentials','email_taken','weak_password','not_coordinator','bad_key'];
const fail=code=>{throw new Error(code);};

// ---------------------------------------------------------------- Supabase (REST + RPC)
function supabase(){const url=cfg.supabaseUrl.replace(/\/$/,''),key=cfg.supabaseAnonKey,SKEY='sanor-teacher-session-v1';
 async function call(path,body,token){let r;try{r=await fetch(url+path,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+(token||key),'Content-Type':'application/json'},body:JSON.stringify(body)});}catch{fail('offline');}
  const text=await r.text(),data=text?JSON.parse(text):null;
  if(!r.ok){const msg=String(data?.message||data?.error_description||data?.msg||data?.error||r.status);fail(ERRORS.find(e=>msg.includes(e))||(/invalid login/i.test(msg)?'invalid_credentials':/already registered/i.test(msg)?'email_taken':/password/i.test(msg)?'weak_password':msg));}
  if(data&&data.error&&ERRORS.includes(data.error))fail(data.error);return data;}
 const rpc=(fn,args,token)=>call('/rest/v1/rpc/'+fn,args,token);
 let sess=read(SKEY,null);
 async function token(){if(!sess)fail('not_signed_in');if(Date.now()/1000>sess.expires_at-60){const r=await call('/auth/v1/token?grant_type=refresh_token',{refresh_token:sess.refresh_token});keep(r);}return sess.access_token;}
 function keep(r){sess={access_token:r.access_token,refresh_token:r.refresh_token,expires_at:r.expires_at||Math.floor(Date.now()/1000)+(r.expires_in||3600),email:r.user?.email||sess?.email};write(SKEY,sess);}
 const t=async(fn,args={})=>rpc(fn,args,await token());
 return{mode:'supabase',
  student:{join:(code,number,nickname,pin)=>rpc('join_class',{p_code:code,p_number:number,p_nickname:nickname,p_pin:pin}),
   settings:tok=>rpc('class_settings',{p_token:tok}),submit:(tok,events)=>rpc('submit_events',{p_token:tok,p_events:events}),deleteMe:tok=>rpc('delete_me',{p_token:tok})},
  teacher:{session:()=>sess?{email:sess.email}:null,
   async signUp(email,password,name,school){const r=await call('/auth/v1/signup',{email,password});if(!r.access_token)return{confirm:true};keep(r);await t('ensure_teacher',{p_name:name,p_school:school});return{email};},
   async signIn(email,password){keep(await call('/auth/v1/token?grant_type=password',{email,password}));await t('ensure_teacher',{p_name:'',p_school:''});return{email};},
   signOut(){sess=null;try{LS.removeItem(SKEY);}catch{}},
   classes:()=>t('my_classes'),createClass:name=>t('create_class',{p_name:name}),
   updateClass:(id,o)=>t('update_class',{p_class:id,p_name:o.name??null,p_worlds:o.worlds??null,p_thai:o.thai??null,p_tests:o.tests??null}),
   report:id=>t('class_report',{p_class:id}),studentDetail:id=>t('student_detail',{p_student:id}),
   resetPin:(id,pin)=>t('reset_student_pin',{p_student:id,p_pin:pin}),removeStudent:id=>t('remove_student',{p_student:id}),deleteClass:id=>t('delete_class',{p_class:id}),
   pilotReport:id=>t('pilot_report',{p_class:id}),addNote:(id,week,note)=>t('add_teacher_note',{p_class:id,p_week:week,p_note:note}),pilotEvents:id=>t('pilot_events',{p_class:id}),
   amCoordinator:()=>t('am_coordinator'),networkReport:()=>t('network_report'),recentErrors:days=>t('recent_errors',{p_days:days})},
  reportErrors:list=>rpc('report_error',{p_errors:list})};}

// ---------------------------------------------------------------- demo (this browser only)
function demo(){const KEY='sanor-demo-db-v1';
 const db=()=>{const d=read(KEY,null)||{classes:[],students:[],sessions:{},progress:[],events:[],tests:[]};d.feedback=d.feedback||[];d.notes=d.notes||[];d.errors=d.errors||[];return d;};
 const tx=f=>{const d=db();const r=f(d);write(KEY,d);return Promise.resolve(JSON.parse(JSON.stringify(r??null)));};
 const uid=()=>([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^Math.random()*16>>c/4).toString(16));
 const hash=s=>{let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0).toString(16);};
 const settings=c=>({className:c.name,code:c.code,worldsOpen:[...c.worlds_open],thaiLevel:c.thai_level,testsOpen:[...c.tests_open]});
 const student=(d,tok)=>{const id=d.sessions[hash('session:'+(tok||''))];const s=d.students.find(x=>x.id===id);if(!s)fail('bad_token');return s;};
 const own=(d,classId)=>{const c=d.classes.find(x=>x.id===classId);if(!c)fail('not_your_class');return c;};
 const signedIn=()=>!!read('sanor-demo-teacher-v1',null);
 const wipe=(d,id)=>{d.students=d.students.filter(x=>x.id!==id);d.events=d.events.filter(e=>e.student_id!==id);d.progress=d.progress.filter(p=>p.student_id!==id);d.tests=d.tests.filter(t=>t.student_id!==id);for(const [k,v] of Object.entries(d.sessions))if(v===id)delete d.sessions[k];};
 const T=f=>(...a)=>{if(!signedIn())return Promise.reject(new Error('not_signed_in'));try{return tx(d=>f(d,...a));}catch(e){return Promise.reject(e);}};
 const S=f=>(...a)=>{try{return tx(d=>f(d,...a));}catch(e){return Promise.reject(e);}};
 return{mode:'demo',
  student:{
   join:S((d,code,number,nickname,pin)=>{if(!/^[0-9]{4}$/.test(pin||''))fail('bad_pin_format');number=+number;if(!(number>=1&&number<=99))fail('bad_number');
    const c=d.classes.find(x=>x.code===String(code||'').trim().toUpperCase());if(!c)fail('class_not_found');
    let s=d.students.find(x=>x.class_id===c.id&&x.number===number);const now=Date.now();
    if(s){if(s.locked_until>now)fail('locked');if(s.pin_hash!==hash(s.id+':'+pin)){s.failed=(s.failed||0)+1;if(s.failed>=5)s.locked_until=now+600000;return{error:s.failed>=5?'locked':'wrong_pin'};}s.failed=0;s.locked_until=0;}
    else{const nick=String(nickname||'').trim();if(!nick||nick.length>20)fail('bad_nickname');s={id:uid(),class_id:c.id,number,nickname:nick,failed:0,locked_until:0};s.pin_hash=hash(s.id+':'+pin);d.students.push(s);}
    s.last_seen=new Date().toISOString();const tok=uid().replace(/-/g,'')+uid().replace(/-/g,'');d.sessions[hash('session:'+tok)]=s.id;
    return{token:tok,student:{number:s.number,nickname:s.nickname},settings:settings(c)};}),
   settings:S((d,tok)=>{const s=student(d,tok);s.last_seen=new Date().toISOString();return settings(d.classes.find(c=>c.id===s.class_id));}),
   submit:S((d,tok,events)=>{const s=student(d,tok);if(!Array.isArray(events)||events.length>200)fail('bad_batch');let n=0;
    for(const e of events){if(['answer','speech','time','step'].includes(e.kind)){if(d.events.some(x=>x.student_id===s.id&&x.client_id===e.id))continue;
      d.events.push({student_id:s.id,class_id:s.class_id,client_id:e.id,kind:e.kind,world:e.world||'',activity:e.activity||'',item:e.item||'',label:e.label||'',correct:e.correct??null,first_try:e.firstTry??null,hint:e.hint??null,result:['asr','self','not-yet','skip'].includes(e.result)?e.result:null,seconds:e.kind==='time'?Math.min(3600,Math.max(0,+e.seconds||0)):null,action:['open','done'].includes(e.action)?e.action:null,at:e.at||new Date().toISOString()});n++;}
     else if(e.kind==='feedback'){d.feedback=d.feedback.filter(f=>!(f.student_id===s.id&&f.world===(e.world||'')&&f.activity===(e.activity||'')));d.feedback.push({student_id:s.id,world:e.world||'',activity:e.activity||'',fun:+e.fun||null,easy:+e.easy||null,learned:+e.learned||null,comment:String(e.comment||'').slice(0,300),at:new Date().toISOString()});n++;}
     else if(e.kind==='progress'){let p=d.progress.find(x=>x.student_id===s.id&&x.world===e.world&&x.activity===e.activity);if(!p)d.progress.push(p={student_id:s.id,world:e.world,activity:e.activity,xp:0,done:false,stamps:0});
      p.xp=Math.max(p.xp,Math.min(5000,+e.xp||0));p.done=p.done||!!e.done;p.stamps=Math.max(p.stamps,+e.stamps||0);n++;}
     else if(e.kind==='test'&&['pre','post'].includes(e.test)&&!d.tests.some(x=>x.student_id===s.id&&x.kind===e.test)){d.tests.push({student_id:s.id,kind:e.test,score:+e.score,total:+e.total,answers:e.answers||[],at:new Date().toISOString()});n++;}}
    s.last_seen=new Date().toISOString();return n;}),
   deleteMe:S((d,tok)=>{const s=student(d,tok);wipe(d,s.id);})},
  teacher:{session:()=>read('sanor-demo-teacher-v1',null),
   signUp:(email,pw,name,school)=>{write('sanor-demo-teacher-v1',{email:email||'demo@teacher',name,school});return Promise.resolve({email});},
   signIn:email=>{write('sanor-demo-teacher-v1',{email:email||'demo@teacher'});return Promise.resolve({email});},
   signOut(){try{LS.removeItem('sanor-demo-teacher-v1');}catch{}},
   classes:T(d=>d.classes.map(c=>({id:c.id,students:d.students.filter(s=>s.class_id===c.id).length,...settings(c)}))),
   createClass:T((d,name)=>{const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let code;do code=[...Array(6)].map(()=>A[Math.floor(Math.random()*32)]).join('');while(d.classes.some(c=>c.code===code));
    const c={id:uid(),name:String(name).trim().slice(0,60),code,worlds_open:['01','02','03','04','05','06'],thai_level:null,tests_open:['pre'],created_at:new Date().toISOString()};d.classes.push(c);return{id:c.id,...settings(c)};}),
   updateClass:T((d,id,o)=>{const c=own(d,id);if(o.name)c.name=o.name.trim().slice(0,60);if(o.worlds)c.worlds_open=o.worlds;c.thai_level=['starter','explorer','challenger'].includes(o.thai)?o.thai:null;if(o.tests)c.tests_open=o.tests;return{id,...settings(c)};}),
   report:T((d,id)=>{const c=own(d,id),ev=d.events.filter(e=>e.class_id===id);
    const students=d.students.filter(s=>s.class_id===id).sort((a,b)=>a.number-b.number).map(s=>{const mine=ev.filter(e=>e.student_id===s.id),ans=mine.filter(e=>e.kind==='answer'),pr=d.progress.filter(p=>p.student_id===s.id),t=k=>{const x=d.tests.find(y=>y.student_id===s.id&&y.kind===k);return x?{score:x.score,total:x.total}:null;};
     return{id:s.id,number:s.number,nickname:s.nickname,lastSeen:s.last_seen||null,locked:s.locked_until>Date.now(),xp:pr.reduce((n,p)=>n+p.xp,0),progress:pr.map(p=>({world:p.world,activity:p.activity,xp:p.xp,done:p.done})),
      answers:ans.length,firstTry:ans.filter(e=>e.first_try).length,hints:ans.filter(e=>e.hint).length,spoken:mine.filter(e=>e.kind==='speech'&&['asr','self'].includes(e.result)).length,pre:t('pre'),post:t('post')};});
    const by={};for(const e of ev.filter(e=>e.kind==='answer'&&e.item)){const m=by[e.item]||(by[e.item]={item:e.item,label:'',world:'',missed:0,tries:0});m.label=m.label>e.label?m.label:e.label;m.world=m.world>e.world?m.world:e.world;m.tries++;if(!e.first_try)m.missed++;}
    const missed=Object.values(by).filter(m=>m.missed).sort((a,b)=>b.missed-a.missed||a.item.localeCompare(b.item)).slice(0,10);
    return{class:{id,...settings(c)},students,missed};}),
   studentDetail:T((d,id)=>{const s=d.students.find(x=>x.id===id);if(!s)fail('not_your_class');own(d,s.class_id);
    return{number:s.number,nickname:s.nickname,events:d.events.filter(e=>e.student_id===id).slice(-500).reverse().map(e=>({kind:e.kind,world:e.world,activity:e.activity,item:e.item,label:e.label,correct:e.correct,firstTry:e.first_try,hint:e.hint,result:e.result,at:e.at})),
     tests:d.tests.filter(t=>t.student_id===id).map(t=>({kind:t.kind,score:t.score,total:t.total,answers:t.answers,at:t.at}))};}),
   resetPin:T((d,id,pin)=>{if(!/^[0-9]{4}$/.test(pin||''))fail('bad_pin_format');const s=d.students.find(x=>x.id===id);if(!s)fail('not_your_class');own(d,s.class_id);s.pin_hash=hash(s.id+':'+pin);s.failed=0;s.locked_until=0;for(const [k,v] of Object.entries(d.sessions))if(v===id)delete d.sessions[k];}),
   removeStudent:T((d,id)=>{const s=d.students.find(x=>x.id===id);if(!s)return;own(d,s.class_id);wipe(d,id);}),
   deleteClass:T((d,id)=>{own(d,id);for(const s of d.students.filter(x=>x.class_id===id))wipe(d,s.id);d.classes=d.classes.filter(c=>c.id!==id);d.notes=d.notes.filter(n=>n.class_id!==id);}),
   pilotReport:T((d,id)=>{const c=own(d,id),ev=d.events.filter(e=>e.class_id===id),start=c.created_at,wk=t=>Math.max(1,Math.floor((new Date(t)-new Date(start))/604800000)+1),time={},steps={};
    for(const e of ev.filter(e=>e.kind==='time')){const k=[e.student_id,wk(e.at),e.world,e.activity].join('|');time[k]=(time[k]||0)+e.seconds;}
    for(const e of ev.filter(e=>e.kind==='step')){const k=[e.world,e.activity,e.item].join('|');const x=steps[k]||(steps[k]={o:new Set(),d:new Set()});(e.action==='open'?x.o:x.d).add(e.student_id);}
    const num=sid=>(d.students.find(s=>s.id===sid)||{}).number;
    return{start,time:Object.entries(time).map(([k,v])=>{const [student,week,world,activity]=k.split('|');return{student,week:+week,world,activity,seconds:v};}),
     steps:Object.entries(steps).map(([k,v])=>{const [world,activity,item]=k.split('|');return{world,activity,item,opened:v.o.size,done:v.d.size};}),
     feedback:d.feedback.filter(f=>d.students.some(s=>s.id===f.student_id&&s.class_id===id)).sort((a,b)=>b.at.localeCompare(a.at)).map(f=>({world:f.world,activity:f.activity,fun:f.fun,easy:f.easy,learned:f.learned,comment:f.comment,number:num(f.student_id),at:f.at})),
     notes:d.notes.filter(n=>n.class_id===id).sort((a,b)=>b.at.localeCompare(a.at)).map(n=>({week:n.week,note:n.note,at:n.at}))};}),
   addNote:T((d,id,week,note)=>{own(d,id);d.notes.push({class_id:id,week:+week,note:String(note).trim().slice(0,2000),at:new Date().toISOString()});}),
   pilotEvents:T((d,id)=>{own(d,id);return d.events.filter(e=>e.class_id===id).slice(-20000).reverse().map(e=>({number:(d.students.find(s=>s.id===e.student_id)||{}).number,kind:e.kind,world:e.world,activity:e.activity,item:e.item,label:e.label,correct:e.correct,firstTry:e.first_try,hint:e.hint,result:e.result,seconds:e.seconds??null,action:e.action??null,at:e.at}));}),
   // in demo mode the signed-in teacher is also the coordinator, so the research page can be tried out
   amCoordinator:T(()=>true),
   networkReport:T(d=>{const school=String(read('sanor-demo-teacher-v1',{})?.school||'').trim()||'?',week=Date.now()-7*864e5,r1=x=>Math.round(x*10)/10,r2=x=>Math.round(x*100)/100;
    return d.classes.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(c=>{const st=d.students.filter(s=>s.class_id===c.id),ids=new Set(st.map(s=>s.id)),ev=d.events.filter(e=>e.class_id===c.id),ans=ev.filter(e=>e.kind==='answer'),
      tests=d.tests.filter(t=>ids.has(t.student_id)),fb=d.feedback.filter(f=>ids.has(f.student_id)),done={},pct=t=>r1(100*t.score/t.total);
     for(const p of d.progress.filter(p=>ids.has(p.student_id)&&p.done))done[p.world+'/'+p.activity]=(done[p.world+'/'+p.activity]||0)+1;
     const pairs=st.slice().sort((a,b)=>a.number-b.number).map(s=>[tests.find(t=>t.student_id===s.id&&t.kind==='pre'),tests.find(t=>t.student_id===s.id&&t.kind==='post')]).filter(([a,b])=>a&&b&&a.total>0&&b.total>0).map(([a,b])=>[pct(a),pct(b)]);
     const avg=k=>{const v=fb.map(f=>f[k]).filter(x=>x!=null);return v.length?r2(v.reduce((a,b)=>a+b,0)/v.length):null;};
     return{school,className:c.name,created:c.created_at,students:st.length,active7:st.filter(s=>s.last_seen&&new Date(s.last_seen)>week).length,
      minutes:Math.round(ev.filter(e=>e.kind==='time').reduce((n,e)=>n+e.seconds,0)/60),answers:ans.length,firstTry:ans.filter(e=>e.first_try).length,
      spoken:ev.filter(e=>e.kind==='speech'&&['asr','self'].includes(e.result)).length,done,pre:tests.filter(t=>t.kind==='pre').length,post:tests.filter(t=>t.kind==='post').length,
      pairs,feedback:{n:fb.length,fun:avg('fun'),easy:avg('easy'),learned:avg('learned')}};});}),
   recentErrors:T((d,days)=>{const since=Date.now()-Math.min(90,Math.max(1,+days||7))*864e5,by={};
    for(const e of d.errors.filter(e=>new Date(e.last)>since)){const k=[e.page,e.message,e.source].join('|'),x=by[k]||(by[k]={page:e.page,message:e.message,source:e.source,version:e.version,agent:e.agent,count:0,first:e.first,last:e.last});
     x.count+=e.count;if(e.first<x.first)x.first=e.first;if(e.last>x.last)x.last=e.last;}
    return Object.values(by).sort((a,b)=>b.last.localeCompare(a.last)).slice(0,100);})},
  reportErrors:S((d,list)=>{if(!Array.isArray(list)||list.length>10)fail('bad_batch');let n=0;const day=new Date().toISOString().slice(0,10),now=new Date().toISOString();
   for(const e of list){const message=String(e.message||'').trim().slice(0,300);if(!message)continue;const page=String(e.page||'').slice(0,80),source=String(e.source||'').slice(0,160);
    let x=d.errors.find(y=>y.day===day&&y.page===page&&y.message===message&&y.source===source);
    if(x){x.count++;x.last=now;}else{if(d.errors.filter(y=>y.day===day).length>=500)continue;d.errors.push({day,page,message,source,version:String(e.version||'').slice(0,24),agent:String(e.agent||'').slice(0,160),count:1,first:now,last:now});}
    n++;}
   d.errors=d.errors.filter(y=>y.day>=new Date(Date.now()-90*864e5).toISOString().slice(0,10));return n;})};}

root.SQBackend=cfg.supabaseUrl&&cfg.supabaseAnonKey?supabase():demo();
})(typeof window!=='undefined'?window:globalThis);
