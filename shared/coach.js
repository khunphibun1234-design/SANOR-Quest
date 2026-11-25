/* SANOR QUEST · adaptive help messages.
 * SQCoach.mount() on any page: when SanorProfile.advice() says the player is ready (first-try accuracy over 85%),
 * a banner offers the next Thai-help level; when support turns on (under 50%), a note explains the extra help.
 * Rules live in shared/profile.js (accuracy, advice, support). */
(function(root){'use strict';
const P=()=>root.SanorProfile,doc=root.document;let el=null,lastSupport=null;
function banner(html,buttons){close();el=doc.createElement('div');el.className='sq-coach';el.setAttribute('role','status');el.innerHTML=`<div class="sq-coach-text">${html}</div><div class="sq-coach-actions"></div>`;
 for(const [label,cls,fn] of buttons){const b=doc.createElement('button');b.type='button';b.className=cls;b.innerHTML=label;b.onclick=()=>{fn&&fn();close();};el.querySelector('.sq-coach-actions').append(b);}
 doc.body.append(el);}
function close(){if(el){el.remove();el=null;}}
function check(){const p=P();if(!p)return;const sup=p.support();
 if(lastSupport===false&&sup){banner('🤝 <b>Extra help is on.</b> You will see fewer choices, and a hint after a mistake. <span class="th" lang="th">เปิดตัวช่วยเพิ่มแล้ว: ตัวเลือกน้อยลง และมีคำใบ้หลังตอบผิด</span>',[['OK','primary']]);}
 lastSupport=sup;
 if(p.advice()==='level-up'&&!el){const a=p.accuracy(),next=p.nextLevel(),L=p.LEVELS[next];
  banner(`🎉 <b>${Math.round(a.rate*a.n)} of your last ${a.n} answers were right the first time!</b> Try the ${L.en} level? ${L.icon} <span class="th" lang="th">ตอบถูกตั้งแต่ครั้งแรก ${Math.round(a.rate*a.n)} จาก ${a.n} ข้อ ลองเลื่อนเป็นระดับ${L.th}ไหม (${L.about})</span>`,
   [[`Yes, move up <span class="th" lang="th">เลื่อนระดับ</span>`,'primary',()=>p.setLevel(next)],[`Not now <span class="th" lang="th">ไว้ก่อน</span>`,'',()=>p.snoozeAdvice()]]);}}
function mount(){const p=P();if(!p)return;lastSupport=p.support();p.onChange(check);}
root.SQCoach={mount,check,close};
})(typeof window!=='undefined'?window:globalThis);
