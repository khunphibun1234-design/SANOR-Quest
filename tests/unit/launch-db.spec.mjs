// Phase 9 database functions on real Postgres (PGlite): the cross-school summary is only for coordinators and has
// no names; browser errors are grouped and bounded; the health check needs the ops key.
import {test,expect} from '@playwright/test';import {freshDb} from './db-harness.mjs';
const T1='11111111-1111-1111-1111-111111111111',T2='22222222-2222-2222-2222-222222222222',BOSS='99999999-9999-9999-9999-999999999999';
const rpc=async(h,who,fn,args=[])=>{const ph=args.map((_,i)=>'$'+(i+1)).join(',');const r=await h.as(who,`select ${fn}(${ph}) as r`,args);return r[0].r;};
async function network(){const h=await freshDb();await h.teacher(T1);await h.teacher(T2,'Kru B');
  await h.db.query('update public.teachers set school=$1 where id=$2',['Khong Chiam School',T2]);
  await h.teacher(BOSS,'Lead');await h.db.query('insert into public.coordinators(id) values ($1)',[BOSS]);
  const c1=await rpc(h,T1,'create_class',['M.2/1']),c2=await rpc(h,T2,'create_class',['M.2/7']);
  const s=async(c,n,pre,post)=>{const j=await rpc(h,'anon','join_class',[c.code,n,'Kid'+n,'1234']);
    const ev=[{kind:'test',test:'pre',score:pre,total:20},{kind:'progress',world:'01',activity:'welcome',xp:300,done:true},
      {id:'tm-'+c.code+n,kind:'time',world:'01',activity:'welcome',seconds:600},{id:'an-'+c.code+n,kind:'answer',world:'01',activity:'welcome',item:'gate',label:'gate',correct:true,firstTry:true,hint:false},
      {kind:'feedback',world:'01',activity:'welcome',fun:3,easy:2,learned:3}];
    if(post!=null)ev.push({kind:'test',test:'post',score:post,total:20});
    await rpc(h,'anon','submit_events',[j.token,JSON.stringify(ev)]);};
  await s(c1,1,10,15);await s(c1,2,8,12);await s(c1,3,12,null);await s(c2,1,14,17);
  return {h,c1,c2};}

test('only coordinators see the cross-school summary, and it has no names or class numbers',async()=>{const {h}=await network();
  await expect(rpc(h,T1,'network_report')).rejects.toThrow(/not_coordinator/);
  await expect(rpc(h,'anon','network_report')).rejects.toThrow(/permission denied/);
  expect(await rpc(h,T1,'am_coordinator')).toBe(false);expect(await rpc(h,BOSS,'am_coordinator')).toBe(true);
  const r=await rpc(h,BOSS,'network_report');
  expect(r.map(x=>[x.school,x.className,x.students])).toEqual([['Khong Chiam School','M.2/7',1],['Phibun School','M.2/1',3]]);
  const p=r[1];
  expect(p).toMatchObject({active7:3,minutes:30,answers:3,firstTry:3,spoken:0,done:{'01/welcome':3},pre:3,post:2,pairs:[[50,75],[40,60]],feedback:{n:3,fun:3,easy:2,learned:3}});
  expect(JSON.stringify(r)).not.toMatch(/Kid|nickname|number/);});

test('browser errors are grouped per day, trimmed and bounded',async()=>{const {h}=await network();
  const e={page:'/home/',message:'TypeError: x is undefined',source:'home/world.js:10',version:'abc',agent:'Android'};
  expect(await rpc(h,'anon','report_error',[JSON.stringify([e,e,{...e,message:''},{...e,message:'y'.repeat(900)}])])).toBe(3);
  await expect(rpc(h,'anon','report_error',[JSON.stringify(Array(11).fill(e))])).rejects.toThrow(/bad_batch/);
  await expect(h.as('anon','select * from public.client_errors')).rejects.toThrow(/permission denied/);
  const rows=(await h.db.query('select message,count from public.client_errors order by count desc')).rows;
  expect(rows).toEqual([{message:e.message,count:2},{message:'y'.repeat(300),count:1}]);
  await h.db.query(`insert into public.client_errors(fingerprint,message) select encode(sha256(convert_to(g::text,'UTF8')),'hex'),'m'||g from generate_series(1,497) g`);
  expect(await rpc(h,'anon','report_error',[JSON.stringify([{...e,message:'new one'},{...e,message:'one too many'},e])])).toBe(2);
  expect((await h.db.query('select count(*)::int as n from public.client_errors')).rows[0].n).toBe(500);
  await expect(rpc(h,T1,'recent_errors',[7])).rejects.toThrow(/not_coordinator/);
  const list=await rpc(h,BOSS,'recent_errors',[7]);expect(list.find(x=>x.message===e.message)).toMatchObject({page:'/home/',count:3,version:'abc'});});

test('the health check reads the digest only with the right key',async()=>{const {h}=await network();
  await h.db.query(`insert into public.ops_keys(key_hash,label) values (encode(sha256(convert_to('s3cret-key','UTF8')),'hex'),'github')`);
  await rpc(h,'anon','report_error',[JSON.stringify([{page:'/',message:'boom'}])]);
  await expect(rpc(h,'anon','health_digest',['wrong',24])).rejects.toThrow(/bad_key/);
  const d=await rpc(h,'anon','health_digest',['s3cret-key',24]);
  expect(d).toMatchObject({activeStudents:4,classes:2});expect(d.events).toBeGreaterThan(0);expect(d.errors.map(x=>[x.message,x.count])).toEqual([['boom',1]]);
  await expect(h.as('anon','select * from public.ops_keys')).rejects.toThrow(/permission denied/);});
