/* SANOR QUEST · writing card (template from Map 01's home welcome card), used by every world.
 *
 *   const card = SQWriting.mount(el, content.card, {values:{welcome:'…'}, onInput(values), onExample()})
 *   card.values()            → {fieldId: text}
 *   card.check()             → ids of fields that do not pass their rules yet (rules: SQMission.checkWriting)
 *   card.showErrors(ids)     → orange border on those fields, focuses the first
 *
 * content.card = {intro:{en,th}, fields:[{id, label:{en,th}, example:{en}, help:{en,th}, rules:{minWords, all, any}}]}
 */
(function(root){'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const th=(t,tag='span')=>t?`<${tag} class="th" lang="th">${esc(t)}</${tag}>`:'';
function check(card,values){return card.fields.filter(f=>!root.SQMission.checkWriting(values[f.id]||'',f.rules)).map(f=>f.id);}
function mount(el,card,o={}){const vals={...(o.values||{})},id=k=>(o.prefix||'card-')+k;
 el.innerHTML=`<div class="sq-writing">${card.intro?`<p class="sq-writing-intro form-intro">${esc(card.intro.en)}${th(card.intro.th)}</p>`:''}${card.fields.map(f=>`<label class="sq-field card-field" id="field-${esc(f.id)}"><span>${esc(f.label.en)}</span>${th(f.label.th,'small')}<textarea id="${id(f.id)}" maxlength="${f.maxLength||180}" rows="2" placeholder="${esc(f.example?.en||'')}">${esc(vals[f.id]||'')}</textarea><small>${esc(f.help?.en||'')}</small>${th(f.help?.th,'small')}</label>`).join('')}<button type="button" class="small-btn sq-example" id="cardExample">Use an example, then make it my own</button></div>`;
 const area=k=>el.querySelector('#'+CSS.escape(id(k)));
 const read=()=>{for(const f of card.fields)vals[f.id]=area(f.id).value;return {...vals};};
 const mark=()=>{const bad=check(card,read());for(const f of card.fields){const fe=el.querySelector('#field-'+CSS.escape(f.id));if(vals[f.id].trim())fe.classList.toggle('valid',!bad.includes(f.id));}};
 for(const f of card.fields)area(f.id).addEventListener('input',()=>{const v=read();el.querySelector('#field-'+CSS.escape(f.id)).classList.remove('invalid');mark();o.onInput&&o.onInput(v);});
 el.querySelector('.sq-example').onclick=()=>{for(const f of card.fields)if(!area(f.id).value.trim()&&f.example)area(f.id).value=f.example.en;const v=read();mark();o.onExample&&o.onExample(v);o.onInput&&o.onInput(v);};
 return{values:read,check:()=>check(card,read()),
  showErrors(ids){for(const f of card.fields)el.querySelector('#field-'+CSS.escape(f.id)).classList.toggle('invalid',ids.includes(f.id));if(ids[0])area(ids[0]).focus();}};}
root.SQWriting={mount,check};
if(typeof module!=='undefined')module.exports=root.SQWriting;
})(typeof window!=='undefined'?window:globalThis);
