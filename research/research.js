'use strict';
/* SANOR QUEST · results across every school, for the project lead (coordinator).
 * Data: SQBackend.teacher.networkReport() (no names) · analysis: research/analysis.js · statistics: teacher/pilot.js */
(()=>{
const B=window.SQBackend,SQ=window.SQContent,R=window.SQResearch,stats=window.SQPilot.stats,$=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=v=>v==null?'–':v+'%',num=v=>v==null?'–':v;
let rows=[],summary=null;
$('demoNote').hidden=B.mode!=='demo';

function gate(html){$('gate').innerHTML=html;$('gate').hidden=false;$('report').hidden=true;}
async function start(){
 if(!B.teacher.session()){
  if(B.mode==='demo')return gate('<h1>ผลการทดลองทุกโรงเรียน</h1><p>ในโหมดทดลอง ข้อมูลมาจากห้องเรียนในเบราว์เซอร์นี้ ลองดูหน้าตาของรายงานได้ด้วยห้องเรียนตัวอย่าง</p><button id="demoIn" class="primary">เข้าสู่โหมดทดลอง →</button>'),$('demoIn').onclick=async()=>{await B.teacher.signIn('demo@teacher');start();};
  return gate('<h1>ผลการทดลองทุกโรงเรียน</h1><p>เข้าสู่ระบบที่ <a href="../teacher/">แดชบอร์ดครู</a> ก่อน (ใช้บัญชีเดียวกัน) แล้วกลับมาที่หน้านี้</p>');}
 let ok=false;try{ok=await B.teacher.amCoordinator();}catch{}
 if(!ok)return gate('<h1>หน้านี้สำหรับผู้ประสานงานโครงการ</h1><p>บัญชีนี้ยังไม่ได้เป็นผู้ประสานงาน ครูแต่ละท่านดูผลของห้องตัวเองได้ที่ <a href="../teacher/">แดชบอร์ดครู</a></p><p>เจ้าของโครงการเพิ่มผู้ประสานงานได้ใน Supabase ตามขั้นตอนใน docs/LAUNCH.md</p>');
 $('gate').hidden=true;$('report').hidden=false;await load();}

async function load(){$('overview').innerHTML='<p class="empty">กำลังโหลด…</p>';
 try{rows=await B.teacher.networkReport();}catch(e){$('overview').innerHTML='<p class="empty">โหลดไม่สำเร็จ: '+esc(e.message)+'</p>';return;}
 let errors=null;try{errors=await B.teacher.recentErrors(7);}catch{}
 summary=R.summarize(rows,{SQ,errors,stats});render();}

function render(){const s=summary,a=s.all,p=a.paired;
 $('updated').textContent=new Date().toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'});
 if(!rows.length){$('overview').innerHTML='<div class="card"><p>ยังไม่มีห้องเรียน เมื่อครูสร้างห้องและนักเรียนเริ่มเล่น ผลจะแสดงที่นี่</p>'+(B.mode==='demo'?'<button id="sample" class="primary">สร้างห้องเรียนตัวอย่าง</button>':'')+'</div>';
  if($('sample'))$('sample').onclick=sample;}
 else $('overview').innerHTML=[[s.schools.length,'โรงเรียน'],[a.classes,'ห้องเรียน'],[a.students,'นักเรียน'],[pct(a.activePct),'เล่นใน 7 วันล่าสุด'],[num(a.minutesPerStudent)+' นาที','เวลาเล่นเฉลี่ยต่อคน'],[pct(a.firstTryPct),'ตอบถูกตั้งแต่ครั้งแรก'],
  [p.n>=2?(p.gain>0?'+':'')+p.gain:'–','คะแนน% ที่เพิ่มขึ้น (n = '+p.n+')'],[p.n>=2?p.dz:'–','ขนาดผล dz']].map(([v,l])=>`<div class="stat"><strong>${esc(v)}</strong><span>${esc(l)}</span></div>`).join('');
 $('criteria').innerHTML=s.criteria.map(c=>`<li class="${c.ok?'ok':'no'}"><b aria-hidden="true">${c.ok?'✅':'⬜'}</b><div>${esc(c.th)}<br><span>${esc(c.value)}</span></div><span class="pill ${c.ok?'ok':'low'}">${c.ok?'ผ่าน':'ยังไม่ผ่าน'}</span></li>`).join('');
 const prow=(name,g,cls='')=>{const q=g.paired;return`<tr class="${cls}"><td>${esc(name)}</td><td class="num">${g.classes??''}</td><td class="num">${g.students}</td><td class="num">${pct(g.activePct)}</td><td class="num">${num(g.minutesPerStudent)}</td><td class="num">${g.pre} / ${g.post}</td><td class="num">${q.n}</td><td class="num">${num(q.pre)}</td><td class="num">${num(q.post)}</td><td class="num">${q.gain==null?'–':(q.gain>0?'+':'')+q.gain}</td><td class="num">${q.ciLow==null?'–':q.ciLow+' ถึง '+q.ciHigh}</td><td class="num">${num(q.dz)}</td><td class="num">${R.fmtP(q.p)}</td></tr>`;};
 $('schoolTable').innerHTML='<thead><tr><th>โรงเรียน / ห้อง</th><th class="num">ห้อง</th><th class="num">นักเรียน</th><th class="num">เล่นใน 7 วัน</th><th class="num">นาที/คน</th><th class="num">ก่อน / หลัง</th><th class="num">ครบคู่</th><th class="num">ก่อน %</th><th class="num">หลัง %</th><th class="num">เพิ่มขึ้น</th><th class="num">95% CI</th><th class="num">dz</th><th class="num">p</th></tr></thead><tbody>'+
  s.schools.map(sc=>prow(sc.name,sc,'school')+sc.classList.map(c=>{const g=R.summarize([c],{SQ,stats}).all;return prow('  '+c.className,{...g,classes:''});}).join('')).join('')+prow('รวมทุกโรงเรียน',a,'school')+'</tbody>';
 $('worldTable').innerHTML='<thead><tr><th>โรงเรียน</th>'+s.worlds.map(w=>`<th class="num">Map ${w.id}<br><small>${esc(w.title)}</small></th>`).join('')+'</tr></thead><tbody>'+
  [...s.schools,{name:'รวมทุกโรงเรียน',...a}].map(g=>`<tr><td>${esc(g.name)}</td>`+s.worlds.map(w=>{const c=g.completion[w.id];return`<td class="num">${pct(c.first)} / ${pct(c.all)}</td>`;}).join('')+'</tr>').join('')+'</tbody>';
 $('feedbackTable').innerHTML='<thead><tr><th>โรงเรียน</th><th class="num">คำตอบ</th><th class="num">สนุก</th><th class="num">ง่าย</th><th class="num">ได้เรียนรู้</th></tr></thead><tbody>'+
  [...s.schools,{name:'รวมทุกโรงเรียน',...a}].map(g=>`<tr><td>${esc(g.name)}</td><td class="num">${g.feedback.n}</td><td class="num">${num(g.feedback.fun)}</td><td class="num">${num(g.feedback.easy)}</td><td class="num">${num(g.feedback.learned)}</td></tr>`).join('')+'</tbody>';
 const E=s.errors;$('errors').innerHTML=E==null?'<p class="empty">โหลดรายการข้อผิดพลาดไม่ได้</p>':!E.length?'<p class="empty">ไม่มีข้อผิดพลาด 👍</p>':
  '<div class="table-wrap"><table><thead><tr><th class="num">ครั้ง</th><th>หน้า</th><th>ข้อความ</th><th>ตำแหน่ง</th><th>เวอร์ชัน</th><th>อุปกรณ์</th><th>ล่าสุด</th></tr></thead><tbody>'+
  E.map(e=>`<tr><td class="num">${e.count}</td><td>${esc(e.page)}</td><td>${esc(e.message)}</td><td>${esc(e.source)}</td><td>${esc(e.version)}</td><td>${esc(e.agent)}</td><td>${esc(new Date(e.last).toLocaleString('th-TH'))}</td></tr>`).join('')+'</tbody></table></div>';}

function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
$('refresh').onclick=load;
$('csv').onclick=()=>{const W=summary.worlds.map(w=>w.id),q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const head=['school','class','students','active7','minutes','answers','firstTry','spoken','pre','post','pairs','preMean','postMean','feedbackN','fun','easy','learned',...W.map(w=>'done_map'+w)];
 const lines=rows.map(r=>{const p=R.pairedSummary(r.pairs||[],stats),f=r.feedback||{};return[r.school,r.className,r.students,r.active7,r.minutes,r.answers,r.firstTry,r.spoken,r.pre,r.post,p.n,p.pre,p.post,f.n,f.fun,f.easy,f.learned,
  ...summary.worlds.map(w=>(r.done||{})[w.id+'/'+w.missions[0]]||0)].map(q).join(',');});
 download('sanor-quest-pilot-'+new Date().toISOString().slice(0,10)+'.csv','﻿'+[head.join(','),...lines].join('\r\n'),'text/csv');};
const publicFile=()=>'/* SANOR QUEST · pilot results shown on schools/index.html.\n * Made with research/ → "ส่งออกผลสำหรับหน้าเว็บโรงเรียน". Anonymous: no school names, no groups under 10 students. */\nwindow.SQ_RESULTS = '+JSON.stringify(R.publicResults(summary,{round:$('roundName').value.trim()}),null,1)+';\n';
$('publish').onclick=()=>{$('publishPreview').textContent=publicFile();$('publishDialog').showModal();};
$('roundName').oninput=()=>{$('publishPreview').textContent=publicFile();};
$('publishDownload').onclick=()=>download('results.js',publicFile(),'text/javascript');

// demo mode only: two sample classes so the report can be tried out (clearly named "ตัวอย่าง")
async function sample(){$('sample').disabled=true;let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(const name of ['ตัวอย่าง ม.2/1','ตัวอย่าง ม.2/2']){const c=await B.teacher.createClass(name);
  for(let n=1;n<=14;n++){const j=await B.student.join(c.code,n,'S'+n,'1234'),pre=6+Math.floor(rnd()*8),post=Math.min(20,pre+Math.floor(rnd()*7)-1),ev=[{kind:'test',test:'pre',score:pre,total:20}];
   if(n<=12)ev.push({kind:'test',test:'post',score:post,total:20});
   for(const [w,m] of [['01','welcome'],['01','table'],['02','timetable'],['03','guide']].slice(0,1+Math.floor(rnd()*4)))ev.push({kind:'progress',world:w,activity:m,xp:300,done:true},{id:'tm-'+c.code+n+w+m,kind:'time',world:w,activity:m,seconds:400+Math.floor(rnd()*600)});
   ev.push({kind:'feedback',world:'01',activity:'welcome',fun:2+Math.round(rnd()),easy:1+Math.round(rnd()*2),learned:2+Math.round(rnd())});
   await B.student.submit(j.token,ev);}}
 await load();}
start();
})();
