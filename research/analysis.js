'use strict';
/* SANOR QUEST · cross-school analysis for the project lead (research/index.html). Pure functions, no DOM.
 *   SQResearch.summarize(rows, {SQ, errors, stats})   rows = SQBackend.teacher.networkReport()
 *   SQResearch.publicResults(summary, {round})        the anonymous numbers shown on schools/ (see schools/results.js)
 *   SQResearch.CRITERIA                               proposed launch criteria (docs/PILOT-ROUND2.md) */
(function(root){
const sum=(a,f=x=>x)=>a.reduce((n,x)=>n+(+f(x)||0),0);
const r1=x=>Number.isFinite(x)?Math.round(x*10)/10:null,r2=x=>Number.isFinite(x)?Math.round(x*100)/100:null;
// t value for a two-sided 95% interval, found from the p-value function of the paired test
function tCrit(df,pTwo){let lo=0,hi=50;for(let i=0;i<60;i++){const m=(lo+hi)/2;pTwo(m,df)>.05?lo=m:hi=m;}return(lo+hi)/2;}
function pairedSummary(pairs,stats){const pre=pairs.map(p=>+p[0]),post=pairs.map(p=>+p[1]),s=stats.paired(pre,post);
 if(s.n<2)return{n:s.n,pre:r1(pre[0]),post:r1(post[0]),gain:s.n?r1(post[0]-pre[0]):null};
 const half=Number.isFinite(s.sd)&&s.sd>0?tCrit(s.df,stats.pTwoTailed)*s.sd/Math.sqrt(s.n):0;
 return{n:s.n,pre:r1(s.preMean),post:r1(s.postMean),gain:r1(s.gain),sd:r1(s.sd),dz:r2(s.dz),p:s.p,ciLow:r1(s.gain-half),ciHigh:r1(s.gain+half)};}
// the first mission of each world counts as "started the world"; all its missions done = "finished the world"
function worldsOf(SQ){return Object.keys(SQ.worlds).sort().map(id=>({id,title:SQ.worlds[id].title.en,missions:(SQ.worlds[id].missionOrder||SQ.worlds[id].missions.map(m=>m.id))}));}
function group(rows,SQ,stats){const students=sum(rows,r=>r.students),fb=rows.filter(r=>r.feedback&&r.feedback.n);
 const fbAvg=k=>{const n=sum(fb,r=>r.feedback.n);return n?r2(sum(fb,r=>r.feedback[k]*r.feedback.n)/n):null;};
 const completion=Object.fromEntries(worldsOf(SQ).map(w=>{const first=sum(rows,r=>(r.done||{})[w.id+'/'+w.missions[0]]),last=sum(rows,r=>(r.done||{})[w.id+'/'+w.missions.at(-1)]);
  return[w.id,{first:students?r1(100*first/students):null,all:students?r1(100*last/students):null}];}));
 const answers=sum(rows,r=>r.answers);
 return{classes:rows.length,students,active7:sum(rows,r=>r.active7),activePct:students?r1(100*sum(rows,r=>r.active7)/students):null,
  minutes:sum(rows,r=>r.minutes),minutesPerStudent:students?r1(sum(rows,r=>r.minutes)/students):null,
  firstTryPct:answers?r1(100*sum(rows,r=>r.firstTry)/answers):null,spoken:sum(rows,r=>r.spoken),
  pre:sum(rows,r=>r.pre),post:sum(rows,r=>r.post),paired:pairedSummary(rows.flatMap(r=>r.pairs||[]),stats),
  pairedPct:students?r1(100*sum(rows,r=>(r.pairs||[]).length)/students):null,completion,
  feedback:{n:sum(fb,r=>r.feedback.n),fun:fbAvg('fun'),easy:fbAvg('easy'),learned:fbAvg('learned')}};}

// Proposed criteria for "ready to launch". The project lead can change the numbers here.
const CRITERIA=[
 {id:'schools',th:'ทดลองครบอย่างน้อย 3 โรงเรียน',test:s=>s.schools.length>=3,value:s=>s.schools.length+' โรงเรียน'},
 {id:'tests',th:'นักเรียนอย่างน้อย 60% ทำแบบทดสอบครบทั้งก่อนและหลังเรียน',test:s=>s.all.pairedPct>=60,value:s=>(s.all.pairedPct??0)+'%'},
 {id:'gain',th:'คะแนนหลังเรียนสูงขึ้นอย่างมีนัยสำคัญ (p < .05) และขนาดผล dz ≥ 0.5',test:s=>s.all.paired.p<.05&&s.all.paired.dz>=.5&&s.all.paired.gain>0,value:s=>s.all.paired.n>=2?`+${s.all.paired.gain} คะแนน% · dz ${s.all.paired.dz} · p ${fmtP(s.all.paired.p)}`:'ยังไม่มีข้อมูลพอ'},
 {id:'map01',th:'นักเรียนอย่างน้อย 70% จบภารกิจแรกของ Map 01',test:s=>(s.all.completion['01']?.first??0)>=70,value:s=>(s.all.completion['01']?.first??0)+'%'},
 {id:'fun',th:'ความสนุกเฉลี่ยอย่างน้อย 2.3 จาก 3',test:s=>s.all.feedback.fun>=2.3,value:s=>s.all.feedback.n?s.all.feedback.fun+' / 3 ('+s.all.feedback.n+' คำตอบ)':'ยังไม่มีข้อมูล'},
 {id:'errors',th:'ใน 7 วันล่าสุดไม่มีข้อผิดพลาดใดเกิดซ้ำเกิน 20 ครั้ง',test:s=>s.errors!=null&&!s.errors.some(e=>e.count>20),value:s=>s.errors==null?'ยังไม่ได้ตรวจ':s.errors.length?s.errors.length+' แบบ · สูงสุด '+Math.max(...s.errors.map(e=>e.count))+' ครั้ง':'ไม่มี'}];
function fmtP(p){return!Number.isFinite(p)?'–':p<.001?'< .001':p.toFixed(3).replace(/^0/,'');}

function summarize(rows,{SQ,errors=null,stats}){
 rows=rows.map(r=>r.school==='?'||!r.school?{...r,school:'(ไม่ได้ระบุชื่อโรงเรียน)'}:r);
 const names=[...new Set(rows.map(r=>r.school))].sort((a,b)=>a.localeCompare(b,'th'));
 const schools=names.map(name=>({name,...group(rows.filter(r=>r.school===name),SQ,stats),classList:rows.filter(r=>r.school===name)}));
 const s={schools,all:group(rows,SQ,stats),errors,worlds:worldsOf(SQ)};
 s.criteria=CRITERIA.map(c=>({id:c.id,th:c.th,ok:!!c.test(s),value:c.value(s)}));return s;}

// Only what is safe to publish: no school names (A, B, C…), and nothing from groups smaller than 10 students.
function publicResults(s,{round='',updated=new Date().toISOString().slice(0,10)}={}){
 const MIN=10,enough=s.all.paired.n>=20;
 return{status:enough?'ready':'pending',round,updated,schools:s.schools.length,classes:s.all.classes,students:s.all.students,
  minutesPerStudent:s.all.minutesPerStudent,firstTryPct:s.all.firstTryPct,
  paired:enough?(({n,pre,post,gain,dz,p,ciLow,ciHigh})=>({n,pre,post,gain,dz,p:p<.001?'<.001':r2(p),ciLow,ciHigh}))(s.all.paired):{n:s.all.paired.n},
  completion:Object.fromEntries(Object.entries(s.all.completion).map(([k,v])=>[k,v.first])),
  feedback:s.all.feedback.n>=MIN?s.all.feedback:{n:s.all.feedback.n},
  perSchool:s.schools.filter(x=>x.paired.n>=MIN).map((x,i)=>({name:'โรงเรียน '+String.fromCharCode(65+i),students:x.students,paired:{n:x.paired.n,pre:x.paired.pre,post:x.paired.post,gain:x.paired.gain}}))};}

root.SQResearch={summarize,publicResults,CRITERIA,fmtP,pairedSummary};
if(typeof module!=='undefined')module.exports=root.SQResearch;
})(typeof window!=='undefined'?window:globalThis);
