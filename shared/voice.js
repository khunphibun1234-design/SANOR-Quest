/* SANOR QUEST · speaking practice widget.
 *
 *   SQVoice.mount(el, {target:{en,th}, prompt:{en,th}, onDone(result), fill})
 *
 * Three ways to finish, chosen by what the device can do:
 *   1. Speech recognition (Android Chrome, desktop Chrome/Edge): the student speaks, the game compares the
 *      words with the target (shared/mission.js → compare) and shows which words it heard.
 *   2. Record and compare (iOS, Firefox, or when recognition fails twice): record, play yourself back,
 *      play the model sentence, then choose "I said it" or "Not yet".
 *   3. Skip: always available, for noisy classrooms.
 * result = {mode:'asr'|'self'|'skip', passed:boolean, score?, said?, tries}
 * Save it with SanorProfile.recordSpeech(world, id, result).
 */
(function(root){'use strict';
const doc=root.document,esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const th=t=>t?`<span class="th" lang="th">${esc(t)}</span>`:'';
const SR=()=>root.SpeechRecognition||root.webkitSpeechRecognition;
const canRecord=()=>!!(root.MediaRecorder&&root.navigator&&root.navigator.mediaDevices&&root.navigator.mediaDevices.getUserMedia);
const support=()=>({recognition:!!SR(),recording:canRecord()});

function mount(el,o){
 const fill=o.fill||(s=>s),target=fill(o.target.en),M=root.SQMission;let tries=0,finished=false,rec=null,stream=null,clipURL=null;
 el.classList.add('sq-voice');
 el.innerHTML=`${o.prompt?`<p class="sq-voice-prompt">${esc(fill(o.prompt.en))}${th(o.prompt.th)}</p>`:''}
  <p class="sq-voice-target" lang="en">“${esc(target)}”</p>${th(o.target.th)}
  <div class="sq-voice-row" data-row="main"></div>
  <p class="sq-voice-status" role="status" aria-live="polite"></p>
  <div class="sq-voice-row" data-row="self" hidden></div>`;
 const main=el.querySelector('[data-row=main]'),selfRow=el.querySelector('[data-row=self]'),status=el.querySelector('.sq-voice-status');
 const button=(cls,html,on,row=main)=>{const b=doc.createElement('button');b.type='button';b.className='sq-voice-btn '+cls;b.innerHTML=html;b.onclick=on;row.append(b);return b;};
 const say=(html)=>{status.innerHTML=html;};
 const done=r=>{if(finished)return;finished=true;cleanup();el.querySelectorAll('button').forEach(b=>{if(!b.classList.contains('sq-keep'))b.disabled=true;});el.classList.add(r.passed?'is-passed':r.mode==='skip'?'is-skipped':'is-notyet');o.onDone&&o.onDone({...r,tries});};
 const cleanup=()=>{try{rec&&rec.state==='recording'&&rec.stop();}catch{}stream&&stream.getTracks().forEach(t=>t.stop());stream=null;};
 const model=()=>{if(root.QuestVoice)root.QuestVoice.play(target,msg=>say(esc(msg)));};

 // 1. listen to the model
 button('sq-keep','🔊 Listen <span class="th" lang="th">ฟังตัวอย่าง</span>',model);

 // 2a. speech recognition
 if(SR()&&!o.noRecognition){const mic=button('primary','🎤 Speak <span class="th" lang="th">กดแล้วพูด</span>',()=>{
   const R=new (SR())();R.lang='en-US';R.interimResults=false;R.maxAlternatives=4;mic.disabled=true;say('Listening… <span class="th" lang="th">กำลังฟัง…</span>');let got=false;
   R.onresult=e=>{got=true;tries++;const alts=[...e.results[0]].map(r=>r.transcript);const best=alts.map(a=>({a,r:M.compare(a,target)})).sort((x,y)=>y.r.score-x.r.score)[0];
    const words=best.r.words.map(w=>`<span class="${w.ok?'ok':'miss'}">${esc(w.w)}</span>`).join(' ');
    if(M.spokenOk(best.a,target)){say(`✓ Great! I heard: “${esc(best.a)}” <span class="sq-voice-words">${words}</span>`);done({mode:'asr',passed:true,score:best.r.score,said:best.a});}
    else{say(`I heard: “${esc(best.a)}” <span class="sq-voice-words">${words}</span> Try again. <span class="th" lang="th">ลองพูดอีกครั้ง คำสีแดงคือคำที่เกมยังไม่ได้ยิน</span>`);mic.disabled=false;if(tries>=2)offerSelf();}};
   R.onerror=e=>{mic.disabled=false;say(e.error==='not-allowed'?'The microphone is blocked. Use Record or Skip. <span class="th" lang="th">ไมค์ถูกปิดอยู่ ใช้ปุ่มอัดเสียงหรือข้ามแทน</span>':'I could not hear you. Try again or record yourself. <span class="th" lang="th">ไม่ได้ยินเสียง ลองอีกครั้งหรืออัดเสียงแทน</span>');offerSelf();};
   R.onend=()=>{mic.disabled=false;if(!got&&!finished&&!status.textContent.trim())say('');};
   try{R.start();}catch{mic.disabled=false;offerSelf();}});}
 else offerSelf();

 // 2b. record yourself, compare, decide
 function offerSelf(){if(!selfRow.hidden)return;selfRow.hidden=false;
  if(canRecord()){const recBtn=button('','⏺ Record <span class="th" lang="th">อัดเสียง</span>',async()=>{
    if(rec&&rec.state==='recording'){rec.stop();return;}
    try{stream=stream||await root.navigator.mediaDevices.getUserMedia({audio:true});}catch{say('The microphone is blocked. Say it aloud, then choose below. <span class="th" lang="th">ไมค์ถูกปิด พูดออกเสียงแล้วเลือกด้านล่าง</span>');return;}
    const chunks=[];rec=new root.MediaRecorder(stream);rec.ondataavailable=e=>chunks.push(e.data);
    rec.onstop=()=>{tries++;if(clipURL)URL.revokeObjectURL(clipURL);clipURL=URL.createObjectURL(new Blob(chunks,{type:rec.mimeType||'audio/webm'}));playMe.disabled=false;recBtn.innerHTML='⏺ Record again <span class="th" lang="th">อัดใหม่</span>';say('Listen to yourself, then to the model. <span class="th" lang="th">ฟังเสียงตัวเอง แล้วเทียบกับเสียงต้นแบบ</span>');stream.getTracks().forEach(t=>t.stop());stream=null;};
    rec.start();recBtn.innerHTML='⏹ Stop <span class="th" lang="th">หยุด</span>';say('Recording… <span class="th" lang="th">กำลังอัด…</span>');setTimeout(()=>{if(rec&&rec.state==='recording')rec.stop();},8000);},selfRow);
   const playMe=button('sq-keep','▶ My voice <span class="th" lang="th">ฟังเสียงฉัน</span>',()=>{if(clipURL)new Audio(clipURL).play().catch(()=>{});},selfRow);playMe.disabled=true;}
  button('good','✓ I said it <span class="th" lang="th">พูดได้</span>',()=>done({mode:'self',passed:true}),selfRow);
  button('','Not yet <span class="th" lang="th">ยังไม่ได้</span>',()=>{tries++;say('That is OK. Listen again and try once more. <span class="th" lang="th">ไม่เป็นไร ฟังอีกครั้งแล้วลองใหม่</span>');if(tries>=3)done({mode:'self',passed:false});},selfRow);}

 // 3. skip, always
 button('sq-skip','Skip <span class="th" lang="th">ข้าม</span>',()=>done({mode:'skip',passed:false}));
 return{get finished(){return finished;},destroy:cleanup};}

root.SQVoice={mount,support};
})(typeof window!=='undefined'?window:globalThis);
