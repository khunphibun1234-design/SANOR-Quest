// The demo backend (shared/backend.js, used without Supabase) must behave like the real database functions
// (supabase/migrations/*.sql). The same classroom scenario runs on both and the results are compared.
import {test,expect} from '@playwright/test';import {freshDb} from './db-harness.mjs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const {load,memoryStorage}=require('./load.js');
const T1='33333333-3333-3333-3333-333333333333';
function demoBackend(){const sb=load(['shared/backend.js'],{storage:memoryStorage()});return sb.SQBackend;}
async function sqlBackend(){const h=await freshDb();await h.teacher(T1);await h.db.query('insert into public.coordinators(id) values ($1)',[T1]);
  const rpc=async(who,fn,args)=>{const ph=args.map((_,i)=>'$'+(i+1)).join(',');try{return (await h.as(who,`select ${fn}(${ph}) as r`,args))[0].r;}catch(e){const m=/[a-z_]+/.exec(e.message.replace(/^.*?:\s*/,''));throw new Error(['class_not_found','wrong_pin','locked','bad_token','bad_pin_format','bad_number','bad_nickname','not_your_class','bad_batch'].find(c=>e.message.includes(c))||e.message);}};
  return{mode:'sql',student:{join:(c,n,nick,pin)=>rpc('anon','join_class',[c,n,nick,pin]),settings:t=>rpc('anon','class_settings',[t]),submit:(t,ev)=>rpc('anon','submit_events',[t,JSON.stringify(ev)]),deleteMe:t=>rpc('anon','delete_me',[t])},
   teacher:{networkReport:()=>rpc(T1,'network_report',[]),amCoordinator:()=>rpc(T1,'am_coordinator',[]),classes:()=>rpc(T1,'my_classes',[]),createClass:n=>rpc(T1,'create_class',[n]),updateClass:(id,o)=>rpc(T1,'update_class',[id,o.name??null,o.worlds??null,o.thai??null,o.tests??null]),
    report:id=>rpc(T1,'class_report',[id]),studentDetail:id=>rpc(T1,'student_detail',[id]),resetPin:(id,p)=>rpc(T1,'reset_student_pin',[id,p]),removeStudent:id=>rpc(T1,'remove_student',[id]),deleteClass:id=>rpc(T1,'delete_class',[id]),pilotReport:id=>rpc(T1,'pilot_report',[id]),addNote:(id,w,n)=>rpc(T1,'add_teacher_note',[id,w,n]),pilotEvents:id=>rpc(T1,'pilot_events',[id])}};}
async function scenario(B){const out={};const c=await B.teacher.createClass('M.2/5');
  const a=await B.student.join(c.code,1,'Ploy','1234'),b=await B.student.join(c.code,2,'Mook','5678');
  out.rejoin=(await B.student.join(c.code,1,'X','1234')).student;out.wrong=await B.student.join(c.code,2,'Mook','0000');
  out.errors=[];for(const args of [['NOPE00',1,'A','1234'],[c.code,1,'A','12'],[c.code,0,'A','1234']])try{await B.student.join(...args);}catch(e){out.errors.push(e.message);}
  const ev=(id,item,ok,hint)=>({id:'evt-'+id.padStart(8,'0'),kind:'answer',world:'02',activity:'tour',item,label:item,correct:ok,firstTry:ok&&!hint,hint});
  out.sent=[await B.student.submit(a.token,[ev('1','gym',false,false),ev('2','library',true,false),ev('3','canteen',true,true),{id:'evt-00000004',kind:'speech',world:'02',activity:'tour',item:'tour-1',result:'self'},{kind:'progress',world:'02',activity:'tour',xp:60,done:false,stamps:2},{kind:'test',test:'pre',score:11,total:20}]),
    await B.student.submit(a.token,[ev('1','gym',false,false)]),await B.student.submit(b.token,[ev('9','gym',false,false),ev('10','library',false,true),{kind:'progress',world:'01',activity:'welcome',xp:300,done:true,stamps:6}])];
  await B.student.submit(b.token,[{id:'tm-000001',kind:'time',world:'02',activity:'tour',seconds:120},{id:'tm-000002',kind:'time',world:'02',activity:'tour',seconds:60},{id:'st-000001',kind:'step',world:'02',activity:'tour',item:'gym',action:'open'},{kind:'feedback',world:'02',activity:'tour',fun:3,easy:2,learned:3,comment:'ok'}]);
  await B.teacher.addNote(c.id,1,'week one');const pr=await B.teacher.pilotReport(c.id);
  out.pilot={time:pr.time.map(t=>[t.week,t.world,t.activity,t.seconds]),steps:pr.steps,feedback:pr.feedback.map(f=>[f.number,f.fun,f.easy,f.learned,f.comment]),notes:pr.notes.map(n=>[n.week,n.note])};
  out.pilotEvents=(await B.teacher.pilotEvents(c.id)).map(e=>[e.number,e.kind,e.item,e.seconds,e.action]).sort((x,y)=>JSON.stringify(x).localeCompare(JSON.stringify(y)));
  await B.teacher.updateClass(c.id,{name:'M.2/5 EP',worlds:['01'],thai:'explorer',tests:['pre','post']});
  out.settings=await B.student.settings(a.token);delete out.settings.code;
  const r=await B.teacher.report(c.id);out.students=r.students.map(s=>({number:s.number,nickname:s.nickname,xp:s.xp,answers:s.answers,firstTry:s.firstTry,hints:s.hints,spoken:s.spoken,pre:s.pre,post:s.post,progress:s.progress}));out.missed=r.missed;
  const d=await B.teacher.studentDetail(r.students[0].id);out.detail=d.events.map(e=>[e.kind,e.item,e.firstTry,e.hint,e.result]).sort();
  out.coordinator=await B.teacher.amCoordinator();out.network=(await B.teacher.networkReport()).map(({school,created,...x})=>x);
  await B.teacher.resetPin(r.students[0].id,'9999');try{await B.student.settings(a.token);out.afterReset='ok';}catch(e){out.afterReset=e.message;}
  await B.teacher.removeStudent(r.students[1].id);out.after=(await B.teacher.report(c.id)).students.map(s=>s.number);
  out.classes=(await B.teacher.classes()).map(x=>({name:x.className,students:x.students}));
  const z=await B.student.join(c.code,9,'Zed','1111');await B.student.deleteMe(z.token);out.afterDeleteMe=(await B.teacher.report(c.id)).students.map(s=>s.number);
  await B.teacher.deleteClass(c.id);out.afterDeleteClass=await B.teacher.classes();return out;}
test('demo mode and the Supabase database give the same results',async()=>{
  const demo=demoBackend();demo.teacher.signIn('t@x');const a=await scenario(demo),b=await scenario(await sqlBackend());
  expect(a).toEqual(b);
  expect(a.missed[0]).toEqual({item:'gym',label:'gym',world:'02',missed:2,tries:2});expect(a.wrong).toEqual({error:'wrong_pin'});expect(a.afterReset).toBe('bad_token');});
