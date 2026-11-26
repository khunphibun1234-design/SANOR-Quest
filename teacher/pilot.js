'use strict';
/* SANOR QUEST · pilot tab (Phase 7): play time, where students stop, feedback, teacher notes, pre/post statistics.
 * SQPilot.render(el, {B, SQ, classId, report, esc, say})   SQPilot.stats.paired(pre[], post[]) is also used by tests. */
(function(root){
// ---------- statistics: paired t-test and effect size (Cohen's dz) ----------
function lgamma(x){const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,.1208650973866179e-2,-.5395239384953e-5];let y=x,t=x+5.5;t-=(x+.5)*Math.log(t);let s=1.000000000190015;for(const v of c)s+=v/++y;return -t+Math.log(2.5066282746310005*s/x);}
function betacf(a,b,x){let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;if(Math.abs(d)<1e-30)d=1e-30;d=1/d;let h=d;for(let m=1;m<=200;m++){const m2=2*m;let aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;h*=d*c;aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<3e-12)break;}return h;}
function ibeta(a,b,x){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(lgamma(a+b)-lgamma(a)-lgamma(b)+a*Math.log(x)+b*Math.log(1-x));return x<(a+1)/(a+b+2)?bt*betacf(a,b,x)/a:1-bt*betacf(b,a,1-x)/b;}
const pTwoTailed=(t,df)=>ibeta(df/2,.5,df/(df+t*t));
function paired(pre,post){const n=pre.length;if(n<2)return{n};const d=post.map((v,i)=>v-pre[i]),mean=a=>a.reduce((s,v)=>s+v,0)/a.length,md=mean(d),sd=Math.sqrt(d.reduce((s,v)=>s+(v-md)**2,0)/(n-1));
 const t=sd?md/(sd/Math.sqrt(n)):Infinity,p=sd?pTwoTailed(t,n-1):0;return{n,preMean:mean(pre),postMean:mean(post),gain:md,sd,t,df:n-1,p,dz:sd?md/sd:Infinity};}

// ---------- the order of steps in every mission (from content) ----------
function stepsOf(SQ,world,activity){const m=SQ.worlds[world]?.missions.find(x=>x.id===activity);if(!m)return[];
 if(m.type==='story')return [...m.stages.flatMap(st=>st.questions.map(q=>({item:q,label:m.questions[q].line.en,stage:st.title}))),{item:'finale',label:'Writing card + speaking',stage:m.stages.at(-1).title}];
 if(m.type==='tap3d')return m.items.map(i=>({item:i.word,label:i.line.en,stage:''}));if(m.type==='quiz')return m.questions.map(q=>({item:q.word,label:q.line.en,stage:''}));return[];}
const missions=SQ=>['01','02'].flatMap(w=>(SQ.worlds[w].missionOrder||[]).map(a=>({world:w,activity:a,title:SQ.worlds[w].missions.find(m=>m.id===a).title.en}))).concat([{world:'02',activity:'buddy',title:'School Buddy (2D practice)'}]);
const min=s=>Math.round(s/60);const fmt=(v,d=1)=>Number.isFinite(v)?v.toFixed(d):'–';

async function render(el,{B,SQ,classId,report,esc,say}){
 el.innerHTML='<p class="empty">กำลังโหลด…</p>';let P;try{P=await B.teacher.pilotReport(classId);}catch(e){el.innerHTML='<p class="empty">โหลดไม่สำเร็จ: '+esc(say(e))+'</p>';return;}
 const students=report.students,week=Math.max(1,Math.floor((Date.now()-new Date(P.start||Date.now()))/604800000)+1),weeks=[...Array(Math.max(4,week)).keys()].map(i=>i+1);
 const byStudent={};for(const t of P.time){const s=byStudent[t.student]||(byStudent[t.student]={});s[t.week]=(s[t.week]||0)+t.seconds;}
 const total=P.time.reduce((n,t)=>n+t.seconds,0),perMission={};for(const t of P.time){const k=t.world+'/'+t.activity;perMission[k]=(perMission[k]||0)+t.seconds;}
 // where students stop: each mission's steps in order, opened vs finished
 const stepMap={};for(const s of P.steps)stepMap[s.world+'/'+s.activity+'/'+s.item]=s;
 const funnels=missions(SQ).map(m=>({...m,steps:stepsOf(SQ,m.world,m.activity).map(st=>({...st,...(stepMap[m.world+'/'+m.activity+'/'+st.item]||{opened:0,done:0})}))})).filter(f=>f.steps.some(s=>s.opened));
 const stuck=funnels.flatMap(f=>f.steps.filter(s=>s.opened>=2).map(s=>({...s,title:f.title,lost:s.opened-s.done,rate:s.done/s.opened}))).filter(s=>s.lost>0).sort((a,b)=>a.rate-b.rate||b.lost-a.lost).slice(0,5);
 // feedback per mission
 const fbBy={};for(const f of P.feedback){const k=f.world+'/'+f.activity;(fbBy[k]||(fbBy[k]=[])).push(f);}
 const avg=(a,k)=>{const v=a.map(x=>x[k]).filter(Boolean);return v.length?v.reduce((s,x)=>s+x,0)/v.length:NaN;};
 const face=v=>!Number.isFinite(v)?'–':v>=2.5?'😀 '+fmt(v):v>=1.75?'🙂 '+fmt(v):'😕 '+fmt(v);
 // pre/post
 const both=students.filter(s=>s.pre&&s.post),st=paired(both.map(s=>s.pre.score/s.pre.total*100),both.map(s=>s.post.score/s.post.total*100));
 const titleOf=k=>{const [w,a]=k.split('/');return (missions(SQ).find(m=>m.world===w&&m.activity===a)||{title:k}).title;};
 el.innerHTML=`<p class="pilot-week">📅 สัปดาห์ที่ <b>${week}</b> ของการทดลอง (นับจากวันสร้างห้อง) · ข้อมูลเหล่านี้ใช้ประชุมแก้ไขเกมทุกสัปดาห์</p>
 <div class="toolbar"><button id="pilotCsv">⬇ ข้อมูลการทดลองทั้งหมด (CSV)</button><button id="fbCsv">⬇ ความเห็นนักเรียน (CSV)</button><a href="observation.html" target="_blank">🖨 แบบสังเกตในห้องเรียน</a></div>
 <h2>1 · เวลาที่เล่นจริง</h2><p class="hint">นับเฉพาะเวลาที่หน้าจอเปิดอยู่และนักเรียนกำลังเล่น (ไม่นับเวลาที่วางเครื่องทิ้งไว้)</p>
 <div class="stats"><div class="stat"><strong>${min(total)}</strong><span>นาทีรวมทั้งห้อง</span></div><div class="stat"><strong>${students.length?min(total/students.length):0}</strong><span>นาทีเฉลี่ยต่อคน</span></div>${Object.entries(perMission).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,v])=>`<div class="stat"><strong>${min(v)}</strong><span>นาที · ${esc(titleOf(k))}</span></div>`).join('')}</div>
 ${students.length?`<div class="table-wrap"><table><thead><tr><th>เลขที่</th><th>ชื่อเล่น</th>${weeks.map(w=>`<th>สัปดาห์ ${w}</th>`).join('')}<th>รวม (นาที)</th></tr></thead><tbody>${students.map(s=>{const t=byStudent[s.id]||{},sum=Object.values(t).reduce((a,b)=>a+b,0);return `<tr class="${sum<300?'help':''}"><td>${s.number}</td><td>${esc(s.nickname)}</td>${weeks.map(w=>`<td>${t[w]?min(t[w]):'–'}</td>`).join('')}<td><b>${min(sum)}</b></td></tr>`;}).join('')}</tbody></table></div><p class="hint">แถบสีส้ม = เล่นรวมไม่ถึง 5 นาที</p>`:''}
 <h2>2 · จุดที่นักเรียนติดหรือเลิกเล่น</h2>
 ${stuck.length?`<div class="stuck"><b>⚠ จุดที่ผ่านน้อยที่สุด</b><ol>${stuck.map(s=>`<li><b>${esc(s.title)}</b> · <span lang="en">${esc(s.label)}</span> — เปิด ${s.opened} คน ผ่าน ${s.done} คน (${Math.round(s.rate*100)}%)</li>`).join('')}</ol></div>`:'<p class="empty">ยังไม่มีข้อมูลขั้นตอน (ต้องมีนักเรียนอย่างน้อย 2 คนเปิดข้อเดียวกัน)</p>'}
 ${funnels.map(f=>`<details class="funnel"><summary><b>${esc(f.title)}</b> · เริ่ม ${f.steps[0].opened} คน → จบ ${f.steps.at(-1).done} คน</summary>${f.steps.map(s=>{const top=Math.max(1,f.steps[0].opened);return `<div class="fstep"><span lang="en">${esc(s.label)}</span><div class="fbar"><i style="width:${s.opened/top*100}%"></i><b style="width:${s.done/top*100}%"></b></div><small>${s.done}/${s.opened}</small></div>`;}).join('')}</details>`).join('')}
 <p class="hint">แถบอ่อน = เปิดข้อนี้ · แถบเข้ม = ผ่านข้อนี้ · คำ/ประโยคที่ตอบผิดบ่อยดูได้ที่แท็บ "คำที่พลาดบ่อย"</p>
 <h2>3 · ความเห็นของนักเรียน</h2>
 ${Object.keys(fbBy).length?`<div class="table-wrap"><table><thead><tr><th>ภารกิจ</th><th>ตอบ</th><th>สนุก</th><th>ง่าย</th><th>ได้เรียนรู้</th></tr></thead><tbody>${Object.entries(fbBy).map(([k,a])=>`<tr><td>${esc(titleOf(k))}</td><td>${a.length}</td><td>${face(avg(a,'fun'))}</td><td>${face(avg(a,'easy'))}</td><td>${face(avg(a,'learned'))}</td></tr>`).join('')}</tbody></table></div>
  <ul class="comments">${P.feedback.filter(f=>f.comment).slice(0,40).map(f=>`<li>“${esc(f.comment)}” <small>เลขที่ ${f.number} · ${esc(titleOf(f.world+'/'+f.activity))}</small></li>`).join('')}</ul>`:'<p class="empty">ยังไม่มีความเห็น นักเรียนตอบแบบสอบถามสั้น ๆ หลังจบแต่ละภารกิจ</p>'}
 <h2>4 · บันทึกของครูรายสัปดาห์</h2>
 <form id="noteForm" class="note-form"><label>สัปดาห์ <select name="week">${weeks.map(w=>`<option ${w===week?'selected':''}>${w}</option>`).join('')}</select></label><textarea name="note" required maxlength="2000" rows="3" placeholder="สิ่งที่เห็นในห้อง: นักเรียนติดตรงไหน ชอบ/ไม่ชอบอะไร ปัญหาอุปกรณ์/อินเทอร์เน็ต ข้อเสนอแนะ"></textarea><button class="primary" type="submit">บันทึก</button></form>
 <ul class="comments">${P.notes.map(n=>`<li><b>สัปดาห์ ${n.week}</b> · ${esc(n.note)} <small>${new Date(n.at).toLocaleDateString('th-TH')}</small></li>`).join('')}</ul>
 <h2>5 · ผลก่อน/หลังเรียน (เฉพาะคนที่ทำครบทั้งสองครั้ง)</h2>
 ${st.n>=2?`<div class="stats"><div class="stat"><strong>${st.n}</strong><span>คน</span></div><div class="stat"><strong>${fmt(st.preMean)}% → ${fmt(st.postMean)}%</strong><span>คะแนนเฉลี่ย ก่อน → หลัง</span></div><div class="stat"><strong>${st.gain>=0?'+':''}${fmt(st.gain)}</strong><span>คะแนนเพิ่มเฉลี่ย (จุด %)</span></div><div class="stat"><strong>${fmt(st.dz,2)}</strong><span>ขนาดผล (Cohen's dz)</span></div></div>
  <p class="hint">Paired t-test: t(${st.df}) = ${fmt(st.t,2)}, p = ${st.p<.001?'< .001':fmt(st.p,3)} · ${st.p<.05?'ความต่างมีนัยสำคัญทางสถิติที่ระดับ .05':'ยังไม่มีนัยสำคัญทางสถิติ (อาจต้องมีนักเรียนมากขึ้นหรือเวลาเล่นนานขึ้น)'} · dz ≈ 0.2 เล็ก, 0.5 ปานกลาง, 0.8 ใหญ่</p>`:'<p class="empty">ต้องมีนักเรียนที่ทำทั้งแบบทดสอบก่อนและหลังเรียนอย่างน้อย 2 คน</p>'}`;
 el.querySelector('#noteForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{await B.teacher.addNote(classId,+f.get('week'),f.get('note'));render(el,{B,SQ,classId,report,esc,say});}catch(err){alert(say(err));}};
 const download=(name,rows)=>{const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const blob=new Blob(['﻿'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();};
 el.querySelector('#pilotCsv').onclick=async()=>{const ev=await B.teacher.pilotEvents(classId);download('SANOR-QUEST-pilot-'+report.class.code+'.csv',[['number','kind','world','activity','item','label','correct','first_try','hint','speech_result','seconds','step','time'],...ev.map(e=>[e.number,e.kind,e.world,e.activity,e.item,e.label,e.correct,e.firstTry,e.hint,e.result,e.seconds,e.action,e.at])]);};
 el.querySelector('#fbCsv').onclick=()=>download('SANOR-QUEST-feedback-'+report.class.code+'.csv',[['number','world','mission','fun_1to3','easy_1to3','learned_1to3','comment','time'],...P.feedback.map(f=>[f.number,f.world,f.activity,f.fun,f.easy,f.learned,f.comment,f.at])]);}
root.SQPilot={render,stats:{paired,pTwoTailed},stepsOf};
if(typeof module!=='undefined')module.exports=root.SQPilot;
})(typeof window!=='undefined'?window:globalThis);
