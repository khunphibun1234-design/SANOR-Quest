'use strict';
/* SANOR QUEST · page for teachers and school leaders. Worlds come from content/content.js; pilot results from
 * schools/results.js (exported by research/ → anonymous numbers only); contact from shared/config.js. */
(()=>{
const SQ=window.SQContent,R=window.SQ_RESULTS||{status:'pending'},$=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SHOTS={'01':'home','02':'school','03':'phibun','04':'market','05':'travel','06':'future'};
const worlds=Object.keys(SQ.worlds).sort().map(id=>SQ.worlds[id]);
const story=w=>w.missions.filter(m=>(w.missionOrder||[]).includes(m.id));
const missions=worlds.reduce((n,w)=>n+story(w).length,0);
$('missionCount').textContent=missions;
const minutes=SQ.tests&&SQ.tests.minutes;if(minutes)$('testMinutes').textContent=minutes;
$('facts').innerHTML=[[worlds.length,'โลก 3D'],[missions,'ภารกิจ'],[SQ.words.length,'คำศัพท์หลัก'],['A1–A2','ระดับ CEFR']].map(([n,l])=>`<li><strong>${esc(n)}</strong><span>${esc(l)}</span></li>`).join('');
$('worlds').innerHTML=worlds.map(w=>`<li><img src="../images/worlds/${SHOTS[w.id]||w.slug}.jpg" width="820" height="580" alt="" loading="lazy">
 <div><p class="eyebrow">Map ${esc(w.id)} · ${esc(w.cefr||'A1')}</p><h4>${esc(w.title.en)} <small lang="th">${esc(w.title.th)}</small></h4>
 <ul>${story(w).map(m=>`<li>${esc(m.title.en)}${m.title.th?` <span lang="th">· ${esc(m.title.th)}</span>`:''}</li>`).join('')}</ul></div></li>`).join('');

// ---- pilot results ----
const box=$('resultsBox'),P=R.paired||{};
if(R.status!=='ready'){
 box.innerHTML=`<div class="pending"><p><b>${esc(R.round||'การทดลอง')}: กำลังดำเนินการ</b> ผลจะแสดงที่นี่เมื่อมีนักเรียนทำแบบทดสอบครบทั้งก่อนและหลังเรียนอย่างน้อย 20 คน</p>
 <p>สิ่งที่วัดในการทดลอง (ไม่ระบุตัวตน ไม่ระบุชื่อโรงเรียน):</p><ul>
 <li>คะแนนแบบทดสอบก่อนและหลังเรียนของนักเรียนคนเดียวกัน พร้อมขนาดผลและช่วงความเชื่อมั่น 95%</li>
 <li>ร้อยละของนักเรียนที่จบภารกิจในแต่ละโลก และเวลาเล่นจริงต่อคน</li>
 <li>ความเห็นนักเรียนหลังจบภารกิจ: สนุก · ง่าย · ได้เรียนรู้</li></ul></div>`;}
else{const bar=(v,cls)=>`<span class="bar ${cls}" style="--v:${Math.max(0,Math.min(100,+v||0))}%"><i></i></span>`;
 box.innerHTML=`<p class="lead">${esc(R.round||'')} · ${esc(R.schools)} โรงเรียน · ${esc(R.classes)} ห้อง · ${esc(R.students)} คน · ปรับปรุง ${esc(R.updated)}</p>
 <div class="result-grid">
  <figure class="prepost" aria-label="คะแนนเฉลี่ยก่อนเรียน ${esc(P.pre)}% หลังเรียน ${esc(P.post)}%">
   <figcaption>คะแนนแบบทดสอบ (ร้อยละ) · นักเรียนที่ทำครบทั้งสองครั้ง ${esc(P.n)} คน</figcaption>
   <div class="row"><span>ก่อนเรียน</span>${bar(P.pre,'pre')}<b>${esc(P.pre)}%</b></div>
   <div class="row"><span>หลังเรียน</span>${bar(P.post,'post')}<b>${esc(P.post)}%</b></div>
   <p class="note">เพิ่มขึ้นเฉลี่ย ${esc(P.gain)} คะแนน% (ช่วงความเชื่อมั่น 95%: ${esc(P.ciLow)} ถึง ${esc(P.ciHigh)}) · ขนาดผล dz = ${esc(P.dz)} · p ${String(P.p).startsWith('<')?esc(P.p):'= '+esc(P.p)}</p></figure>
  <div class="tiles">${[[R.minutesPerStudent!=null?R.minutesPerStudent+' นาที':'–','เวลาเล่นจริงเฉลี่ยต่อคน'],[R.firstTryPct!=null?R.firstTryPct+'%':'–','คำตอบที่ถูกตั้งแต่ครั้งแรก'],
   [R.feedback&&R.feedback.fun!=null?R.feedback.fun+' / 3':'–','ความสนุก (นักเรียนให้คะแนน)'],[R.feedback&&R.feedback.learned!=null?R.feedback.learned+' / 3':'–','ได้เรียนรู้ (นักเรียนให้คะแนน)']].map(([v,l])=>`<div><strong>${esc(v)}</strong><span>${esc(l)}</span></div>`).join('')}</div>
 </div>
 <h3 class="sub">ร้อยละของนักเรียนที่จบภารกิจแรกในแต่ละโลก</h3>
 <div class="completion">${worlds.map(w=>{const v=(R.completion||{})[w.id];return`<div class="row"><span>Map ${esc(w.id)} · ${esc(w.title.en)}</span>${bar(v,'done')}<b>${v==null?'–':esc(v)+'%'}</b></div>`;}).join('')}</div>
 ${(R.perSchool||[]).length?`<h3 class="sub">แยกตามโรงเรียน (ไม่ระบุชื่อ · แสดงเฉพาะกลุ่มที่มีนักเรียนครบคู่อย่างน้อย 10 คน)</h3><div class="table-wrap"><table><thead><tr><th>โรงเรียน</th><th>นักเรียนครบคู่</th><th>ก่อน %</th><th>หลัง %</th><th>เพิ่มขึ้น</th></tr></thead><tbody>${R.perSchool.map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(s.paired.n)}</td><td>${esc(s.paired.pre)}</td><td>${esc(s.paired.post)}</td><td>${s.paired.gain>0?'+':''}${esc(s.paired.gain)}</td></tr>`).join('')}</tbody></table></div>`:''}
 <p class="note">วิธีวัด: แบบทดสอบก่อนและหลังเรียนเป็นชุดเดียวกัน (สลับลำดับข้อ) ไม่มีห้องเปรียบเทียบ คะแนนที่เพิ่มขึ้นจึงอาจมาจากการคุ้นเคยกับข้อสอบหรือการเรียนในห้องตามปกติด้วยบางส่วน</p>`;}
const C=(window.SQ_CONFIG||{}).contact;if(C){$('contact').textContent='ติดต่อ: '+C;$('contact').hidden=false;}
})();
