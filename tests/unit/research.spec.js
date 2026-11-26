// Cross-school analysis (research/analysis.js): grouping by school, paired statistics, launch criteria and the
// anonymous file published on schools/.
const {test,expect}=require('@playwright/test');const {load}=require('./load');
const {SQContent:SQ,SQPilot,SQResearch:R}=load(['content/content.js','teacher/pilot.js','research/analysis.js']);const stats=SQPilot.stats;
const cls=(school,className,n,pairs,extra={})=>({school,className,students:n,active7:n,minutes:n*60,answers:100,firstTry:70,spoken:5,done:{'01/welcome':n,'01/garden':Math.floor(n/2)},pre:n,post:pairs.length,pairs,feedback:{n,fun:2.5,easy:2,learned:2.5},...extra});
const pairs=(k,pre,gain)=>Array.from({length:k},(_,i)=>[pre+(i%5),pre+(i%5)+gain+(i%3)]);
test('groups classes by school and adds them up',()=>{const s=R.summarize([cls('B School','2/1',20,pairs(18,40,10)),cls('A School','2/1',10,pairs(8,50,5)),cls('A School','2/2',10,[]),cls('?','x',2,[])],{SQ,stats,errors:[]});
  expect(s.schools.map(x=>[x.name,x.classes,x.students])).toEqual([['(ไม่ได้ระบุชื่อโรงเรียน)',1,2],['A School',2,20],['B School',1,20]]);
  expect(s.all).toMatchObject({classes:4,students:42,minutesPerStudent:60,pre:42,post:26});expect(s.all.paired.n).toBe(26);
  expect(s.all.completion['01']).toEqual({first:100,all:50});expect(s.all.feedback).toEqual({n:42,fun:2.5,easy:2,learned:2.5});});
test('paired statistics match the teacher dashboard and give a 95% interval',()=>{const p=pairs(30,40,10),s=R.pairedSummary(p,stats),t=stats.paired(p.map(x=>x[0]),p.map(x=>x[1]));
  expect(s.gain).toBeCloseTo(t.gain,1);expect(s.dz).toBeCloseTo(t.dz,2);expect(s.ciLow).toBeLessThan(s.gain);expect(s.ciHigh).toBeGreaterThan(s.gain);
  expect(s.ciHigh-s.gain).toBeCloseTo(2.045*t.sd/Math.sqrt(30),1);});                   // t(29) = 2.045
test('launch criteria pass only with enough schools, data and learning gain',()=>{
  const good=[1,2,3].map(i=>cls('S'+i,'2/1',20,pairs(16,40,12)));const s=R.summarize(good,{SQ,stats,errors:[{count:3}]});
  expect(s.criteria.map(c=>[c.id,c.ok])).toEqual([['schools',true],['tests',true],['gain',true],['map01',true],['fun',true],['errors',true]]);
  const weak=R.summarize([cls('S1','2/1',20,pairs(5,40,0))],{SQ,stats,errors:null});
  expect(weak.criteria.filter(c=>!c.ok).map(c=>c.id)).toEqual(['schools','tests','gain','errors']);});
test('the public file has no school or class names and hides small groups',()=>{
  const s=R.summarize([cls('Secret School','M.2/9',30,pairs(25,40,10)),cls('Tiny School','M.2/1',6,pairs(6,40,10))],{SQ,stats});
  const pub=R.publicResults(s,{round:'รอบ 2',updated:'2027-01-01'});const text=JSON.stringify(pub);
  expect(text).not.toMatch(/Secret|Tiny|M\.2/);expect(pub.status).toBe('ready');expect(pub.paired.n).toBe(31);
  expect(pub.perSchool.map(x=>[x.name,x.paired.n])).toEqual([['โรงเรียน A',25]]);
  const few=R.publicResults(R.summarize([cls('S','x',12,pairs(12,40,10))],{SQ,stats}));expect(few.status).toBe('pending');expect(few.paired).toEqual({n:12});});
