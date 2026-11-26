import {test,expect} from '@playwright/test';import {freshDb} from './db-harness.mjs';
const T1='11111111-1111-1111-1111-111111111111',T2='22222222-2222-2222-2222-222222222222';
const rpc=async(h,who,fn,args)=>{const ph=args.map((_,i)=>'$'+(i+1)).join(',');const r=await h.as(who,`select ${fn}(${ph}) as r`,args);return r[0].r;};
async function setup(){const h=await freshDb();await h.teacher(T1);await h.teacher(T2,'Kru B');
  const c1=await rpc(h,T1,'create_class',['M.2/5']);const c2=await rpc(h,T2,'create_class',['M.2/6']);return {h,c1,c2};}

test('a teacher creates a class with a 6-character code',async()=>{const {c1}=await setup();
  expect(c1.code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);expect(c1).toMatchObject({className:'M.2/5',worldsOpen:['01','02','03','04','05','06'],thaiLevel:null,testsOpen:['pre']});});

test('students join with code + number + nickname + PIN; the same PIN signs in again; a wrong PIN does not',async()=>{const {h,c1}=await setup();
  const j=await rpc(h,'anon','join_class',[c1.code.toLowerCase(),7,' Ploy ','1234']);
  expect(j.token).toHaveLength(64);expect(j.student).toEqual({number:7,nickname:'Ploy'});expect(j.settings.className).toBe('M.2/5');
  const again=await rpc(h,'anon','join_class',[c1.code,7,'Someone else','1234']);expect(again.student.nickname).toBe('Ploy');expect(again.token).not.toBe(j.token);
  expect(await rpc(h,'anon','join_class',[c1.code,7,'Ploy','9999'])).toEqual({error:'wrong_pin'});
  await expect(rpc(h,'anon','join_class',['ZZZZZZ',7,'Ploy','1234'])).rejects.toThrow(/class_not_found/);
  await expect(rpc(h,'anon','join_class',[c1.code,7,'Ploy','12ab'])).rejects.toThrow(/bad_pin_format/);});

test('five wrong PINs lock the student for a while',async()=>{const {h,c1}=await setup();await rpc(h,'anon','join_class',[c1.code,3,'Mook','4321']);
  for(let i=0;i<4;i++)expect((await rpc(h,'anon','join_class',[c1.code,3,'Mook','0000'])).error).toBe('wrong_pin');
  expect((await rpc(h,'anon','join_class',[c1.code,3,'Mook','0000'])).error).toBe('locked');
  await expect(rpc(h,'anon','join_class',[c1.code,3,'Mook','4321'])).rejects.toThrow(/locked/);});

test('the anon role cannot read or write any table directly',async()=>{const {h,c1}=await setup();await rpc(h,'anon','join_class',[c1.code,1,'A','1111']);
  for(const t of ['classes','students','sessions','progress','events','tests','teachers'])await expect(h.as('anon',`select * from public.${t}`)).rejects.toThrow(/permission denied/);
  await expect(h.as('anon',"insert into public.progress(student_id,world,activity) values (gen_random_uuid(),'01','x')")).rejects.toThrow(/permission denied/);
  await expect(rpc(h,'anon','class_report',[c1.id])).rejects.toThrow(/permission denied/);});

test('a student writes only their own data, and re-sending the same events counts once',async()=>{const {h,c1}=await setup();
  const a=await rpc(h,'anon','join_class',[c1.code,1,'A','1111']),b=await rpc(h,'anon','join_class',[c1.code,2,'B','2222']);
  const batch=[{id:'evt-0000001',kind:'answer',world:'02',activity:'timetable',item:'timetable',label:'timetable',correct:false,firstTry:false,hint:true},
    {id:'evt-0000002',kind:'speech',world:'02',activity:'club',item:'club-1',result:'asr'},
    {kind:'progress',world:'02',activity:'timetable',xp:240,done:true,stamps:4},{kind:'test',test:'pre',score:12,total:20,answers:[1,0]}];
  expect(await rpc(h,'anon','submit_events',[a.token,JSON.stringify(batch)])).toBe(4);
  expect(await rpc(h,'anon','submit_events',[a.token,JSON.stringify(batch)])).toBe(1);        // only the progress upsert again
  await rpc(h,'anon','submit_events',[a.token,JSON.stringify([{kind:'progress',world:'02',activity:'timetable',xp:100,done:false}])]);
  await expect(rpc(h,'anon','submit_events',['not-a-token',JSON.stringify(batch)])).rejects.toThrow(/bad_token/);
  const rep=await rpc(h,T1,'class_report',[c1.id]);const A=rep.students.find(s=>s.number===1),B=rep.students.find(s=>s.number===2);
  expect(A).toMatchObject({xp:240,answers:1,firstTry:0,hints:1,spoken:1,pre:{score:12,total:20},post:null});expect(A.progress).toEqual([{world:'02',activity:'timetable',xp:240,done:true}]);
  expect(B).toMatchObject({xp:0,answers:0});expect(b.token).not.toBe(a.token);
  expect(rep.missed).toEqual([{item:'timetable',label:'timetable',world:'02',missed:1,tries:1}]);});

test('teachers see only their own classes',async()=>{const {h,c1,c2}=await setup();await rpc(h,'anon','join_class',[c2.code,1,'X','1111']);
  expect((await rpc(h,T1,'my_classes',[])).map(c=>c.code)).toEqual([c1.code]);
  await expect(rpc(h,T1,'class_report',[c2.id])).rejects.toThrow(/not_your_class/);
  expect(await h.as(T1,'select * from public.students')).toEqual([]);                          // RLS hides class 2's student
  expect((await h.as(T2,'select nickname from public.students')).map(r=>r.nickname)).toEqual(['X']);
  const sid=(await rpc(h,T2,'class_report',[c2.id])).students[0].id;
  await expect(rpc(h,T1,'reset_student_pin',[sid,'0000'])).rejects.toThrow(/not_your_class/);
  await expect(rpc(h,T1,'student_detail',[sid])).rejects.toThrow(/not_your_class/);});

test('class settings reach the students; PIN reset signs old devices out',async()=>{const {h,c1}=await setup();const j=await rpc(h,'anon','join_class',[c1.code,4,'D','1234']);
  await rpc(h,T1,'update_class',[c1.id,'M.2/5 (EP)',['01'],'explorer',['pre','post']]);
  expect(await rpc(h,'anon','class_settings',[j.token])).toEqual({className:'M.2/5 (EP)',code:c1.code,worldsOpen:['01'],thaiLevel:'explorer',testsOpen:['pre','post']});
  const sid=(await rpc(h,T1,'class_report',[c1.id])).students[0].id;await rpc(h,T1,'reset_student_pin',[sid,'5555']);
  await expect(rpc(h,'anon','class_settings',[j.token])).rejects.toThrow(/bad_token/);
  expect((await rpc(h,'anon','join_class',[c1.code,4,'D','5555'])).token).toBeTruthy();
  await rpc(h,T1,'remove_student',[sid]);expect((await rpc(h,T1,'class_report',[c1.id])).students).toEqual([]);});

test('PDPA: a student deletes their own data; a teacher deletes a whole class',async()=>{const {h,c1,c2}=await setup();
  const a=await rpc(h,'anon','join_class',[c1.code,1,'A','1111']);await rpc(h,'anon','join_class',[c1.code,2,'B','2222']);
  await rpc(h,'anon','submit_events',[a.token,JSON.stringify([{id:'evt-0000001',kind:'answer',item:'gym',firstTry:true},{kind:'progress',world:'02',activity:'tour',xp:20}])]);
  await rpc(h,'anon','delete_me',[a.token]);
  expect((await rpc(h,T1,'class_report',[c1.id])).students.map(s=>s.number)).toEqual([2]);
  expect((await h.db.query('select count(*)::int n from public.events')).rows[0].n).toBe(0);
  await expect(rpc(h,'anon','class_settings',[a.token])).rejects.toThrow(/bad_token/);
  await expect(rpc(h,T1,'delete_class',[c2.id])).rejects.toThrow(/not_your_class/);
  await rpc(h,T1,'delete_class',[c1.id]);expect(await rpc(h,T1,'my_classes',[])).toEqual([]);
  expect((await h.db.query('select count(*)::int n from public.students')).rows[0].n).toBe(0);});

test('pilot: play time per week, steps (where students stop), feedback and teacher notes',async()=>{const {h,c1,c2}=await setup();
  const a=await rpc(h,'anon','join_class',[c1.code,1,'A','1111']),b=await rpc(h,'anon','join_class',[c1.code,2,'B','2222']);
  const ev=[{id:'t-0000001',kind:'time',world:'02',activity:'tour',seconds:300},{id:'t-0000002',kind:'time',world:'02',activity:'tour',seconds:9999},
    {id:'s-0000001',kind:'step',world:'02',activity:'tour',item:'library',action:'open'},{id:'s-0000002',kind:'step',world:'02',activity:'tour',item:'library',action:'done'},
    {id:'s-0000003',kind:'step',world:'02',activity:'tour',item:'gym',action:'open'},{kind:'feedback',world:'02',activity:'tour',fun:3,easy:2,learned:3,comment:'สนุกมาก'}];
  expect(await rpc(h,'anon','submit_events',[a.token,JSON.stringify(ev)])).toBe(6);
  await rpc(h,'anon','submit_events',[b.token,JSON.stringify([{id:'s-0000009',kind:'step',world:'02',activity:'tour',item:'library',action:'open'},{kind:'feedback',world:'02',activity:'tour',fun:1,easy:1,learned:2,comment:''},{kind:'feedback',world:'02',activity:'tour',fun:2,easy:1,learned:2,comment:'ยาก'}])]);
  await rpc(h,T1,'add_teacher_note',[c1.id,1,'นักเรียนติดที่ห้องสมุด']);
  const r=await rpc(h,T1,'pilot_report',[c1.id]);
  expect(r.time.map(x=>x.seconds).sort((x,y)=>x-y)).toEqual([3900]);                                  // 300 + 3600 (capped)
  expect(r.time[0]).toMatchObject({week:1,world:'02',activity:'tour'});
  expect(r.steps.sort((x,y)=>x.item.localeCompare(y.item))).toEqual([{world:'02',activity:'tour',item:'gym',opened:1,done:0},{world:'02',activity:'tour',item:'library',opened:2,done:1}]);
  expect(r.feedback.map(f=>[f.number,f.fun,f.comment]).sort()).toEqual([[1,3,'สนุกมาก'],[2,2,'ยาก']]);   // one answer per student per mission (latest)
  expect(r.notes).toEqual([expect.objectContaining({week:1,note:'นักเรียนติดที่ห้องสมุด'})]);
  expect((await rpc(h,T1,'pilot_events',[c1.id])).length).toBe(6);
  await expect(rpc(h,T1,'pilot_report',[c2.id])).rejects.toThrow(/not_your_class/);
  await expect(rpc(h,'anon','pilot_report',[c1.id])).rejects.toThrow(/permission denied/);
  for(const t of ['feedback','teacher_notes'])await expect(h.as('anon',`select * from public.${t}`)).rejects.toThrow(/permission denied/);});
