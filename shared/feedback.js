/* SANOR QUEST · 30-second feedback after a mission (pilot). Three smiley questions and an optional comment.
 *   SQFeedback.mount(el, {world, activity})   → saved with SanorProfile.feedback() and sent to the class */
(function(root){'use strict';
const Q=[['fun','Was it fun?','สนุกไหม'],['easy','Was it easy?','ง่ายไหม'],['learned','Did you learn new English?','ได้เรียนภาษาอังกฤษใหม่ ๆ ไหม']];
const FACES=[[1,'😕','not really · ไม่ค่อย'],[2,'🙂','OK · พอใช้'],[3,'😀','yes! · มาก']];
function mount(el,{world,activity}){const P=root.SanorProfile;if(!el||!P)return;const pick={};
 if(P.feedbackGiven(world,activity)){el.innerHTML='<p class="sq-fb-done">💬 Thanks for your feedback! <span class="th" lang="th">ขอบคุณสำหรับความคิดเห็น</span></p>';return;}
 el.innerHTML=`<form class="sq-fb"><p class="sq-fb-title"><b>💬 Tell us about this mission</b> <span class="th" lang="th">ช่วยบอกหน่อย ภารกิจนี้เป็นอย่างไร (30 วินาที)</span></p>
  ${Q.map(([k,en,th])=>`<fieldset class="sq-fb-q"><legend>${en} <span lang="th">${th}</span></legend>${FACES.map(([v,f,l])=>`<label title="${l}"><input type="radio" name="${k}" value="${v}" required><span aria-hidden="true">${f}</span><span class="sq-fb-l">${l}</span></label>`).join('')}</fieldset>`).join('')}
  <label class="sq-fb-c"><span>Anything else? <span lang="th">อยากบอกอะไรเพิ่ม (ไม่บังคับ พิมพ์ไทยได้)</span></span><textarea name="comment" maxlength="300" rows="2"></textarea></label>
  <button type="submit" class="primary">Send · ส่ง</button></form>`;
 const f=el.querySelector('form');f.onsubmit=e=>{e.preventDefault();const d=new FormData(f);P.feedback(world,activity,{fun:+d.get('fun'),easy:+d.get('easy'),learned:+d.get('learned'),comment:d.get('comment')||''});
  el.innerHTML='<p class="sq-fb-done">💬 Thanks for your feedback! <span class="th" lang="th">ขอบคุณสำหรับความคิดเห็น</span></p>';};}
root.SQFeedback={mount};
})(typeof window!=='undefined'?window:globalThis);
