/* SANOR QUEST · story world runner (shared by every 3D map).
 *
 * A map page provides the 3D scene and a few settings; the missions come from content/worlds/*.json:
 *
 *   SQStory.start({
 *     worldId:'02', slug:'school', icon:'🏫',
 *     build: engine => buildSchoolWorld(engine),          // returns {colliders, render(clock, yaw, fx)}
 *     cast: ['player','alex','teacher'],                    // shared characters (src/characters.js)
 *     start(missionId) → {player:[x,z,angle], alex:[x,z,angle]},
 *     npcs(missionId, lesson) → {teacher:{x,z,angle}|null, …},
 *     follows(missionId, lesson) → true when Alex walks behind the player,
 *     fx(ctx) → world changes for build().render,          // ctx = {clock, lessons, current, lesson}
 *     keys: {welcome:'sanor-home-welcome-v1'},              // optional legacy save keys
 *     camera: {center:[0,.1,-.3], r:29, rNarrow:51}, engine: {background, fog, shadowRadius},
 *     reportHeader:'SANOR QUEST  /  MAP 02',
 *   })
 *
 * Every story mission ends with a writing card, speaking practice and a reflection, then a passport stamp
 * and a report that can be printed or saved as a PDF. Non-story missions in world.missionOrder (e.g. a tap3d
 * mission on its own page) appear in the mission picker as links.
 */
(function(root){'use strict';
root.SQStory={start(cfg){
const $=id=>document.getElementById(id),P=root.SanorProfile,th=P.th,esc=P.esc,canvas=$('scene');
const SQ=root.SQContent,WORLD=SQ.worlds[cfg.worldId],ORDER=WORLD.missionOrder||WORLD.missions.map(m=>m.id);
const missionById=id=>WORLD.missions.find(m=>m.id===id),stories=ORDER.filter(id=>missionById(id).type==='story');
const keyFor=id=>(cfg.keys&&cfg.keys[id])||`sanor-${cfg.slug}-${id}-v1`;
let storageOK=true;
const loadState=id=>{try{return JSON.parse(localStorage.getItem(keyFor(id)));}catch{storageOK=false;return null;}};
const contents={},lessons={};for(const id of stories){contents[id]=id===cfg.mainMission&&root.HomeContent?root.HomeContent:root.StoryContent(cfg.worldId,id);lessons[id]=new root.StoryLesson(loadState(id),contents[id]);}
// a mission counts as done when its saved story says so or the passport has it (e.g. finished on another page)
const isDone=id=>P.activity(cfg.worldId,id).done||(missionById(id).type==='story'&&lessons[id].state.done);
const unlocked=id=>{const i=ORDER.indexOf(id);return i<=0||isDone(ORDER[i-1])||isDone(id);};
const wanted=new URLSearchParams(location.search).get('mission');
let current=stories.includes(wanted)&&unlocked(wanted)?wanted:stories.find(id=>unlocked(id)&&!isDone(id))||stories[0];
let C=contents[current],lesson=lessons[current];
let started=false,modal='intro',lastFocus=null,path=[],pathPlace=null,near=null,followTrail=[],toastTimer,orbit=null,engine,world,nav,cast;
const keys=new Set(),camera={yaw:.38,pitch:.78,zoom:1,targetZoom:1},clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const player={x:0,z:7,angle:Math.PI,walk:false},alex={x:.85,z:5.6,angle:0,walk:false},npcs={};
try{engine=SQ3.createEngine(canvas,{background:'#e3eadc',fog:[40,95],shadowCenter:[0,0,0],shadowRadius:14,...(cfg.engine||{})});
 world=cfg.build(engine);cast=SQ3.createCast(engine.scene,cfg.cast);nav=new HomeNav(world.colliders);}
catch(err){$('intro').hidden=true;$('error').hidden=false;console.error(err);return;}
const fill=s=>String(s).replaceAll('{name}',lesson.state.name);
const prefix=id=>id===cfg.mainMission&&cfg.mainStampPrefix?cfg.mainStampPrefix:cfg.slug+'-'+id;
// ---------- profile: XP, passport stamps (one per stage + one for finishing the mission) ----------
function syncProfile(id=current){const L=lessons[id],st=L.state,m=missionById(id);
 const stamps=L.C.stages.filter(x=>x.ids.length&&x.ids.every(q=>st.completed.includes(q))).map(x=>({id:prefix(id)+'-'+x.id,label:x.title,icon:cfg.icon}));
 if(st.done)stamps.push({id:id===cfg.mainMission&&cfg.mainCardStamp?cfg.mainCardStamp:prefix(id)+'-done',label:m.title.en,icon:'🏅'});
 P.record(cfg.worldId,id,{xp:L.xp,done:st.done,stamps});}
function save(){try{localStorage.setItem(keyFor(current),JSON.stringify(lesson.state));storageOK=true;}catch{storageOK=false;}syncProfile();
 $('saveStatus').textContent=storageOK?'Saved in this browser':'This device cannot save your progress';}
function toast(s){clearTimeout(toastTimer);$('toast').textContent=s;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,3600);}
function stopSpeech(){QuestVoice.stop();}
function speak(text,rate=.85){QuestVoice.play(text,toast,rate/.85);return true;}
function releaseOrbit(){const id=orbit?.id;orbit=null;canvas.classList.remove('orbiting');if(id!==undefined&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}
function halt(){keys.clear();player.walk=false;path=[];pathPlace=null;releaseOrbit();}
const overlays=['intro','dialogOverlay','bookOverlay','helpOverlay','pauseOverlay','reportOverlay'].filter(id=>$(id));
function show(id){lastFocus=document.activeElement;for(const n of overlays)$(n).hidden=n!==id;modal=id;halt();stopSpeech();requestAnimationFrame(()=>$(id).querySelector('input,button,textarea')?.focus({preventScroll:true}));}
function close(){if(!started){show('intro');return;}for(const n of overlays)$(n).hidden=true;modal=null;stopSpeech();lastFocus?.focus({preventScroll:true});}
// ---------- mission panel ----------
function hud(){const s=lesson.state,i=lesson.stageIndex,n=C.stages.length,m=missionById(current);
 $('missionTitle').textContent=m.title.en;$('missionTitleTh').textContent=m.title.th;$('missionNumber').textContent='MISSION '+String(ORDER.indexOf(current)+1).padStart(2,'0')+' / '+String(ORDER.filter(id=>!missionById(id).fallback).length).padStart(2,'0');
 $('xp').textContent=lesson.xp+' XP';$('stageNumber').textContent=String(s.done?n:i+1).padStart(2,'0')+' / '+String(n).padStart(2,'0');
 $('progress').style.width=(s.done?100:s.completed.length/(lesson.total+1)*100)+'%';
 $('stageList').innerHTML=C.stages.map((st,k)=>`<li class="${s.done||k<i?'done':k===i?'current':''}"><span>${s.done||k<i?'✓':String(k+1).padStart(2,'0')}</span><div>${esc(st.title)}<small>${esc(st.en)}</small>${th(st.th,'small')}</div></li>`).join('');
 $('destination').textContent=s.done?'Mission report':lesson.stage.go;
 $('guideBtn').innerHTML=s.done?'View my report <span>↗</span>':'Take me there <span>→</span>';
 const targets=s.done?[]:lesson.targets(),visited=lesson.stage.anyOrder?lesson.stage.ids.filter(id=>s.completed.includes(id)).map(id=>C.questions[id].at):[];
 for(const [id,p] of Object.entries(C.places)){p.el.classList.toggle('active',targets.includes(id));p.el.classList.toggle('complete',visited.includes(id));}}
for(const [id,p] of Object.entries(C.places)){const b=document.createElement('button');b.className='place-label';b.innerHTML=`<span>${p.icon}</span><div><strong>${esc(p.name)}</strong>${th(p.th,'small')}</div>`;b.setAttribute('aria-label','Walk to '+p.name);b.onclick=()=>go(id);$('worldLabels').appendChild(b);for(const k of stories)contents[k].places[id].el=b;}
function go(id){if(!started||modal)return;path=nav.route([player.x,player.z],C.places[id].approach);if(!path.length){toast('Step away from the object and try again.');return;}keys.clear();pathPlace=id;toast('Walking to '+C.places[id].name);}
function openPlace(id){if(!started||modal)return;if(lesson.state.done){report();return;}const q=lesson.nextQuestion(id);if(q){question(q,id);return;}
 if(lesson.finale&&id===lesson.stage.target){reflection();return;}
 toast(lesson.stage.anyOrder&&lesson.stage.ids.some(x=>C.questions[x].at===id)?'You already did this place. Try another one.':lesson.stage.go);}
// ---------- a conversation ----------
const portraitOf=sp=>'portrait '+String(sp).toLowerCase().replace(/[^a-z]/g,'');
function tableHtml(t){return `<figure class="story-table"><figcaption>${esc(t.caption.en)}${th(t.caption.th,'small')}</figcaption><table><thead><tr>${t.head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></figure>`;}
function question(id,place){const q=C.questions[id];show('dialogOverlay');P.step(cfg.worldId,current,id,'open');
 $('dialogTitle').textContent=q.speaker;$('dialogStage').textContent=lesson.stage.en.toUpperCase();$('dialogContext').textContent=C.places[place].en+' · '+C.places[place].name;
 $('portrait').className=portraitOf(q.speaker);$('questionCount').textContent=lesson.state.completed.length+1+' / '+lesson.total;
 const listening=q.kind==='listen';let correct=false;
 $('dialogBody').innerHTML=`<div class="speech"><p id="npcLine">${listening?'♫ Listen to what '+esc(q.speaker)+' says':esc(fill(q.line))}</p><p class="translation th" lang="th" id="translation"${listening?' hidden':''}>${esc(q.thai)}</p></div>${q.table?tableHtml(q.table):''}<div class="audio-tools"><button id="sayLine">♫ Listen</button><button id="saySlow">♫ Listen slowly</button>${listening?'<button id="showText">Show text</button>':''}<button id="stopVoice">Stop audio</button></div><p class="prompt">${esc(q.prompt)}${th(q.promptTh)}</p><div id="answerArea"></div><div id="answerFeedback" class="feedback" role="status" hidden></div><div id="hintText" class="hint-text" hidden>${esc(q.hint)}${th(q.hintTh)}</div><div class="dialog-bottom"><button id="hintBtn" class="text-button">Get a hint</button><button id="nextQuestion" class="primary" hidden>Continue →</button></div>`;
 $('sayLine').onclick=()=>speak(q.line);$('saySlow').onclick=()=>speak(q.line,.65);$('stopVoice').onclick=stopSpeech;
 if($('showText'))$('showText').onclick=()=>{$('npcLine').textContent=fill(q.line);$('translation').hidden=false;lesson.aid(id);save();};
 $('hintBtn').onclick=()=>{$('hintText').hidden=false;lesson.aid(id);save();};
 if(listening)setTimeout(()=>speak(q.line),350);
 SQMission.render($('answerArea'),q,{fill,letters:true,rotate:Object.keys(C.questions).indexOf(id)%3,support:P.support(),showHint:()=>{$('hintText').hidden=false;},
  decide(value){if(correct)return null;const r=lesson.answer(id,value);if(!r.accepted)return null;
   const first=lesson.state.attempts[id]===1,clean=first&&!lesson.state.aided.includes(id);if(first)P.logAnswer(r.correct&&clean,{world:cfg.worldId,activity:current,item:current+'-'+id,label:q.kind==='order'?q.tokens.join(' '):fill(q.choices[q.answer]),correct:r.correct,hint:lesson.state.aided.includes(id)});save();hud();
   $('answerFeedback').hidden=false;$('answerFeedback').className='feedback'+(r.correct?' good':'');
   const who=q.speaker==='Alex'?alex:npcs[q.speaker.toLowerCase()];if(who)who.act={type:r.correct?'wave':'hmm',t0:clock,dur:r.correct?1.8:1.2};
   if(r.correct){P.step(cfg.worldId,current,id,'done');correct=true;const change=clean&&cfg.changeMessage?cfg.changeMessage(current):null;
    $('answerFeedback').innerHTML=`<strong>Message understood! +20 XP</strong>${esc(r.why)}${th(q.whyTh)}<div class="reply">${esc(q.speaker)}: “${esc(fill(r.reply))}”</div>${change?`<div class="world-change">${esc(change.en)}${th(change.th)}</div>`:''}`;
    $('nextQuestion').hidden=false;$('hintBtn').hidden=true;setTimeout(()=>$('nextQuestion').focus({preventScroll:true}));}
   else $('answerFeedback').innerHTML='<strong>Try again</strong>'+esc(q.hint)+th(q.hintTh);return r.correct;}});
 $('nextQuestion').onclick=()=>{const next=lesson.nextQuestion(place);if(next)question(next,place);else{close();hud();toast(lesson.stage.go);}};}
// ---------- finale: writing card, speaking, reflection ----------
const moods={ready:'I feel ready',practice:'I want more practice',help:'I would like help'},nexts={welcome:'Greetings',rooms:'Words for places',listening:'Listening',speaking:'Speaking'};
function reflection(){show('dialogOverlay');const m=missionById(current),s=lesson.state;P.step(cfg.worldId,current,'finale','open');
 $('dialogTitle').textContent=lesson.stage.title;$('dialogStage').textContent='YOUR WORDS. YOUR STORY.';$('dialogContext').textContent=m.title.en;
 $('questionCount').textContent=String(C.stages.length).padStart(2,'0')+' / '+String(C.stages.length).padStart(2,'0');$('portrait').className='portrait';
 $('dialogBody').innerHTML='<div id="cardBox"></div><div class="speaking-section"><h3>🎤 Practise speaking aloud</h3><p class="form-intro">'+(C.speakPrompt?esc(C.speakPrompt.en)+th(C.speakPrompt.th):'')+' <b id="spokenCount"></b></p><div id="speakBox"></div><button id="nextSentence" class="small-btn" hidden>Next sentence →</button></div><span class="reflection-label">Today I feel…</span><div class="radio-group">'+Object.entries(moods).map(([v,label])=>`<label><input type="radio" name="mood" value="${v}" ${s.mood===v?'checked':''}><span>${label}</span></label>`).join('')+'</div><span class="reflection-label">Next time I want to practise…</span><div class="radio-group">'+Object.entries(nexts).map(([v,label])=>`<label><input type="radio" name="next" value="${v}" ${s.next===v?'checked':''}><span>${label}</span></label>`).join('')+'</div><div id="cardFeedback" class="feedback" role="status" hidden></div><button id="finishMission" class="primary" style="margin-top:20px">Finish the mission +100 XP →</button>';
 const card=C.card?SQWriting.mount($('cardBox'),C.card,{values:s.card,onInput:draft,onExample:()=>{lesson.aid('card');toast('Your examples are ready. Change them to tell your story.');}}):null;
 const S=C.speaking,ST=C.speakingTh||[];let si=S.findIndex((_,i)=>!s.spoken.includes(i));if(si<0)si=0;
 function speakNext(){$('spokenCount').textContent=s.spoken.length+' / '+S.length+' spoken';$('nextSentence').hidden=true;
  SQVoice.mount($('speakBox'),{target:{en:S[si],th:ST[si]},fill,onDone(r){P.recordSpeech(cfg.worldId,current+'-'+(si+1),r);if(r.passed&&!s.spoken.includes(si))s.spoken.push(si);save();
   $('spokenCount').textContent=s.spoken.length+' / '+S.length+' spoken';const next=S.findIndex((_,i)=>i>si&&!s.spoken.includes(i));if(next>=0){si=next;$('nextSentence').hidden=false;}}});}
 $('nextSentence').onclick=speakNext;if(S.length)speakNext();
 function draft(){if(card)Object.assign(s.card,card.values());s.mood=document.querySelector('input[name="mood"]:checked')?.value||'';s.next=document.querySelector('input[name="next"]:checked')?.value||'';save();}
 $('dialogBody').querySelectorAll('input[type=radio]').forEach(x=>x.addEventListener('input',draft));
 $('finishMission').onclick=()=>{draft();const r=lesson.finish(s.card,s.mood,s.next,s.spoken);if(card)card.showErrors(r.errors||[]);
  if(!r.ok){$('cardFeedback').hidden=false;$('cardFeedback').textContent=r.reflection?'Choose how you feel and what you want to practise next.':'Complete the boxes with an orange border.';if(!r.errors?.length)$('cardFeedback').scrollIntoView({block:'nearest'});save();return;}
  P.step(cfg.worldId,current,'finale','done');save();hud();report();};}
// ---------- report (printable) ----------
function report(){const s=lesson.state,m=missionById(current);if(!s.done)return;show('reportOverlay');$('cardPrintOptions').hidden=true;
 const nextId=ORDER[ORDER.indexOf(current)+1],next=nextId&&!missionById(nextId).fallback?missionById(nextId):null;
 const rc=$('reportContent');rc.dataset.header='SANOR QUEST  /  MAP '+cfg.worldId+'  /  MISSION '+String(ORDER.indexOf(current)+1).padStart(2,'0');rc.dataset.title=m.title.en;
 $('reportMission').textContent=m.title.en;
 rc.innerHTML=`<div class="stats"><div><strong>${lesson.xp} XP</strong><span>Completed ${C.stages.length} stages</span></div><div><strong>${lesson.firstTry} / ${lesson.total}</strong><span>First try without a hint</span></div><div><strong>${s.spoken.length} / ${C.speaking.length}</strong><span>sentences spoken</span></div></div><p>🏅 Passport stamp: ${esc(m.title.en)}</p>${C.card?`<div class="welcome-card"><small>${esc(m.title.en.toUpperCase())} · MAP ${cfg.worldId}</small><h3>${esc(s.name)}'s ${esc(lesson.stage.title.replace(/^My /i,'').toLowerCase())}</h3>${C.card.fields.map(f=>'<p>'+esc(s.card[f.id])+'</p>').join('')}</div>`:''}<p class="report-note">My feeling: ${moods[s.mood]} · Next practice: ${nexts[s.next]}<br>${s.aided.includes('card')?'Used a writing example · ':''}The game checked the key parts of your writing. Ask your teacher about grammar.</p>`;
 if($('feedbackBox'))SQFeedback.mount($('feedbackBox'),{world:cfg.worldId,activity:current});
 $('nextMission').hidden=!next;if(next){$('nextMission').innerHTML='Next: '+esc(next.title.en)+' →';$('nextMission').onclick=()=>next.type==='story'?switchMission(nextId,true):location.href=next.play+'?story=1';}}
// ---------- word book ----------
function vocabulary(review=false){show('bookOverlay');$('enterStory').hidden=true;$('bookGuide').textContent='Listen and repeat at your own pace.';
 const list=C.vocabulary&&!review?C.vocabulary.map((v,i)=>`<div class="vocab-row"><div><strong>${esc(v[0])}</strong><small>${esc(v[1])}</small><p>${esc(v[2])}</p>${th(v[3]&&v[3]+' · '+v[4],'small')}</div><button data-say="${esc(v[2])}" aria-label="Listen to ${esc(v[0])}">♫</button></div>`)
  :Object.values(C.questions).map((q,i)=>{const line=q.kind==='order'?q.tokens.join(' '):fill(q.choices[q.answer]);return `<div class="vocab-row"><div><strong>${esc(line)}</strong><small>${esc(q.why)}</small>${th(q.whyTh,'small')}</div><button data-say="${esc(line)}" aria-label="Listen to sentence ${i+1}">♫</button></div>`;});
 $('bookTitle').textContent=C.vocabulary&&!review?'Words for my visit':'Sentences in this mission';$('vocabList').innerHTML=list.join('');
 $('vocabList').querySelectorAll('button').forEach(b=>b.onclick=()=>speak(b.dataset.say));}
// ---------- mission picker ----------
function picker(){const total=ORDER.filter(id=>!missionById(id).fallback);
 $('missionPicker').innerHTML=total.map((id,i)=>{const m=missionById(id),done=isDone(id),open=unlocked(id),story=m.type==='story';
  return `<button type="button" class="mission-option${id===current?' selected':''}${done?' done':''}" data-mission="${id}" ${open?'':'disabled'} aria-pressed="${id===current}"><span class="mo-num">${done?'✓':String(i+1).padStart(2,'0')}</span><span class="mo-text"><b>${esc(m.title.en)}</b>${th(m.title.th,'small')}<small>${esc(m.summary.en)}</small></span><span class="mo-state">${done?'Done':open?(story?'Play':'Open ↗'):'🔒'}</span></button>`;}).join('');
 $('missionPicker').querySelectorAll('[data-mission]').forEach(b=>b.onclick=()=>{const id=b.dataset.mission,m=missionById(id);if(m.type!=='story'){location.href=m.play+'?story=1';return;}switchMission(id,false);});
 const s=lesson.state;$('startBtn').textContent=(s.done?'Play this mission again':s.completed.length?'Continue this mission':'Start this mission')+' →';$('introReport').hidden=!s.done;}
function switchMission(id,startNow){current=id;C=contents[id];lesson=lessons[id];placeCast();followTrail=[];history.replaceState(null,'','?mission='+id);picker();hud();
 if(startNow){started=false;show('intro');}}
function placeCast(){const p=cfg.start(current);[player.x,player.z,player.angle]=p.player;[alex.x,alex.z,alex.angle]=p.alex;}
// ---------- start ----------
$('playerName').value=lesson.state.name!=='Mook'?lesson.state.name:P.name()||'Mook';P.mountLevelButton(document.querySelector('.header-actions'));SQCoach.mount();
function enterStory(){started=true;P.track(cfg.worldId,current);save();close();hud();toast(lesson.state.done?'Open your report in the mission panel.':lesson.stage.go);}
$('enterStory').onclick=()=>{lesson.state.studiedTable=true;enterStory();};
$('startBtn').onclick=()=>{const name=$('playerName').value.trim().slice(0,20)||'Mook';P.setName(name);for(const L of Object.values(lessons))L.state.name=name;
 if(lesson.state.done){lessons[current]=lesson=new root.StoryLesson(null,C);lesson.state.name=name;placeCast();}
 if(cfg.beforeStart&&cfg.beforeStart(current,lesson,{show,save,speak,enterStory}))return;enterStory();};
$('introReport').onclick=()=>{started=true;report();};
$('guideBtn').onclick=()=>lesson.state.done?report():go(lesson.target());
$('interact').onclick=()=>near&&openPlace(near);
$('closeDialog').onclick=close;$('bookBtn').onclick=()=>vocabulary();$('closeBook').onclick=close;
$('helpBtn').onclick=()=>show('helpOverlay');$('closeHelp').onclick=close;$('helpContinue').onclick=close;
$('pauseBtn').onclick=()=>{$('restartConfirm').hidden=true;show('pauseOverlay');};$('resumeBtn').onclick=close;
$('restartBtn').onclick=()=>$('restartConfirm').hidden=false;$('cancelRestart').onclick=()=>$('restartConfirm').hidden=true;
$('confirmRestart').onclick=()=>{const name=lesson.state.name;lessons[current]=lesson=new root.StoryLesson(null,C);lesson.state.name=name;placeCast();followTrail=[];resetCamera();save();hud();started=false;picker();show('intro');};
$('printReport').onclick=()=>prepareWelcomePrint($('reportContent'));$('printWelcomeNow').onclick=()=>window.print();
$('reviewBtn').onclick=()=>vocabulary(true);$('exploreBtn').onclick=close;$('replayBtn').onclick=()=>{show('pauseOverlay');$('restartConfirm').hidden=false;};
$('missionsBtn').onclick=()=>{started=false;picker();show('intro');};
// ---------- camera & input ----------
function ready(){return started&&!modal;}
function zoom(delta){if(!ready()||!Number.isFinite(delta))return;camera.targetZoom=clamp(camera.targetZoom*Math.exp(clamp(delta,-1000,1000)*.0015),.48,1.65);zoomUI();}
function zoomUI(){$('zoomLevel').textContent=Math.round(100/camera.targetZoom)+'%';$('zoomIn').disabled=camera.targetZoom<=.48;$('zoomOut').disabled=camera.targetZoom>=1.65;}
function resetCamera(){camera.yaw=.38;camera.pitch=.78;camera.zoom=camera.targetZoom=1;zoomUI();}
$('zoomIn').onclick=()=>zoom(-130);$('zoomOut').onclick=()=>zoom(130);$('cameraReset').onclick=()=>{if(ready())resetCamera();};
$('rotateLeft').onclick=()=>{if(ready())camera.yaw-=Math.PI/6;};$('rotateRight').onclick=()=>{if(ready())camera.yaw+=Math.PI/6;};
canvas.addEventListener('wheel',ev=>{if(!ready()||ev.ctrlKey||!Number.isFinite(ev.deltaY))return;ev.preventDefault();zoom(ev.deltaY*(ev.deltaMode===1?16:ev.deltaMode===2?innerHeight:1));},{passive:false});
canvas.addEventListener('contextmenu',ev=>ev.preventDefault());
canvas.addEventListener('pointerdown',ev=>{if(ev.button!==2||!ready())return;ev.preventDefault();orbit={id:ev.pointerId,x:ev.clientX,y:ev.clientY};canvas.setPointerCapture(ev.pointerId);canvas.classList.add('orbiting');});
canvas.addEventListener('pointermove',ev=>{if(!orbit||orbit.id!==ev.pointerId||!ready())return;if(!(ev.buttons&2)){releaseOrbit();return;}camera.yaw-=(ev.clientX-orbit.x)*.008;camera.pitch=clamp(camera.pitch+(ev.clientY-orbit.y)*.006,.35,1.4);orbit.x=ev.clientX;orbit.y=ev.clientY;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,releaseOrbit);
const keyMap={w:'up',ArrowUp:'up',s:'down',ArrowDown:'down',a:'left',ArrowLeft:'left',d:'right',ArrowRight:'right'};
addEventListener('keydown',ev=>{if(ev.key==='Escape'&&modal){ev.preventDefault();close();return;}
 if(ev.key==='Tab'&&modal){const nodes=[...$(modal).querySelectorAll('button,input,textarea,a')].filter(n=>!n.disabled&&n.getClientRects().length);if(nodes.length&&(ev.shiftKey&&document.activeElement===nodes[0]||!ev.shiftKey&&document.activeElement===nodes.at(-1))){ev.preventDefault();nodes[ev.shiftKey?nodes.length-1:0].focus();}return;}
 if(!ready()||/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName))return;const key=ev.key.length===1?ev.key.toLowerCase():ev.key;
 if(keyMap[key]){ev.preventDefault();keys.add(keyMap[key]);path=[];pathPlace=null;}if(key==='q'||key==='e'){ev.preventDefault();keys.add(key);}
 if(ev.code==='Space'&&ev.target.tagName!=='BUTTON'){ev.preventDefault();if(!ev.repeat&&near)openPlace(near);}});
addEventListener('keyup',ev=>{const key=ev.key.length===1?ev.key.toLowerCase():ev.key;keys.delete(keyMap[key]||key);});
document.querySelectorAll('[data-move]').forEach(b=>{b.addEventListener('pointerdown',ev=>{if(!ready())return;ev.preventDefault();b.setPointerCapture(ev.pointerId);keys.add(b.dataset.move);path=[];pathPlace=null;});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.move));});
addEventListener('blur',()=>{halt();stopSpeech();});document.addEventListener('visibilitychange',()=>{if(document.hidden){halt();stopSpeech();}});
addEventListener('resize',()=>engine.resize());
function move(dx,dz){const nx=player.x+dx,nz=player.z+dz;if(!nav.blocked(nx,player.z))player.x=nx;if(!nav.blocked(player.x,nz))player.z=nz;if(Math.abs(dx)+Math.abs(dz)>.0001)player.angle=Math.atan2(dx,dz);}
// ---------- frame ----------
// ?speed=N walks faster (used by automated tests on slow machines)
const SPEED=Math.min(8,Math.max(1,+new URLSearchParams(location.search).get('speed')||1));
let last=performance.now(),clock=0,uiTick=0;const camCfg={center:[0,.1,-.3],r:29,rNarrow:51,...(cfg.camera||{})};
// while a dialog covers the (blurred) world, redraw it only 4 times a second: saves phone batteries and keeps
// the dialog quick on slow devices (software rendering would otherwise spend every frame on the hidden scene)
let lastDraw=0;
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;clock+=dt;
 if(modal&&now-lastDraw<250)return;lastDraw=now;player.walk=false;
 if(ready()){if(keys.has('q'))camera.yaw-=dt*1.3;if(keys.has('e'))camera.yaw+=dt*1.3;
  let x=(keys.has('right')?1:0)-(keys.has('left')?1:0),z=(keys.has('down')?1:0)-(keys.has('up')?1:0);
  if(x||z){const l=Math.hypot(x,z),s=dt*3.5/l;move((x*Math.cos(camera.yaw)+z*Math.sin(camera.yaw))*s,(-x*Math.sin(camera.yaw)+z*Math.cos(camera.yaw))*s);player.walk=true;}
  else if(path.length){const [tx,tz]=path[0],dx=tx-player.x,dz=tz-player.z,dist=Math.hypot(dx,dz),step=dt*4.2*SPEED;if(dist<=step){player.x=tx;player.z=tz;path.shift();}else move(dx/dist*step,dz/dist*step);player.walk=true;
   if(!path.length&&pathPlace){const p=pathPlace;pathPlace=null;openPlace(p);}}
  alex.walk=false;
  if(!cfg.follows||cfg.follows(current,lesson)){const tail=followTrail.at(-1);if(!tail||Math.hypot(tail[0]-player.x,tail[1]-player.z)>.22)followTrail.push([player.x,player.z]);if(followTrail.length>500)followTrail.shift();
   if(Math.hypot(player.x-alex.x,player.z-alex.z)>1.05&&followTrail.length){let target=followTrail[0],dx=target[0]-alex.x,dz=target[1]-alex.z,d=Math.hypot(dx,dz);
    if(d<.12&&followTrail.length>1){followTrail.shift();target=followTrail[0];dx=target[0]-alex.x;dz=target[1]-alex.z;d=Math.hypot(dx,dz);}
    if(d>.01){const step=Math.min(d,dt*4.1*SPEED);alex.x+=dx/d*step;alex.z+=dz/d*step;alex.angle=Math.atan2(dx,dz);alex.walk=true;}}}}
 camera.zoom+=(camera.targetZoom-camera.zoom)*Math.min(1,dt*9);
 const narrow=innerWidth<700,r=(narrow?camCfg.rNarrow:camCfg.r)*camera.zoom,center=camCfg.center,cp=Math.cos(camera.pitch),eye=[center[0]+Math.sin(camera.yaw)*r*cp,center[1]+Math.sin(camera.pitch)*r,center[2]+Math.cos(camera.yaw)*r*cp],projection=engine.perspective(.77,innerWidth/innerHeight,.1,150);
 if(!narrow)projection[8]=-.13;else projection[9]=.18;engine.begin(engine.mul(projection,engine.lookAt(eye,center)));
 world.render(clock,camera.yaw,cfg.fx({clock,lessons,current,lesson}));
 const people=cfg.npcs(current,lesson,lessons);for(const k of cfg.cast){if(k==='player'||k==='alex')continue;const spot=people[k];cast.people[k].root.visible=!!spot;if(spot){const n=npcs[k]||(npcs[k]={walk:false});n.x=spot[0];n.z=spot[1];n.angle=spot[2]||0;if(spot[3]&&!n.act)n.act={type:spot[3],t0:clock,dur:2.4};cast.pose(k,n,clock);}}
 cast.pose('alex',alex,clock);cast.pose('player',player,clock);engine.end();
 for(const p of Object.values(C.places)){const pos=engine.project(p.x,p.y,p.z);p.el.style.transform=`translate(${pos.x}px,${pos.y}px) translate(-50%,-100%)`;p.el.style.visibility=pos.visible?'visible':'hidden';}
 uiTick+=dt;if(uiTick>.12){uiTick=0;let closest=null,distance=Infinity;for(const [id,p] of Object.entries(C.places)){const d=Math.hypot(player.x-p.approach[0],player.z-p.approach[1]);if(d<distance){distance=d;closest=id;}}
  near=distance<1.7?closest:null;$('interact').disabled=!near||!ready();$('nearText').textContent=near?C.places[near].name+' · Ready to talk':'Walk closer to your destination';$('locationName').textContent=C.places[closest].name;}}
placeCast();picker();hud();zoomUI();
// a teacher can close a world for the class (shared/sync.js)
if(root.SanorClass&&!root.SanorClass.worldOpen(cfg.worldId)){$('startBtn').disabled=true;$('startBtn').textContent='Closed by your teacher · ครูยังไม่เปิดโลกนี้';$('missionPicker').querySelectorAll('button').forEach(b=>b.disabled=true);}if(!storageOK)$('saveStatus').textContent='Progress cannot be saved on this device';
for(const id of stories)syncProfile(id);
// keep this world's recordings for offline play
addEventListener('load',()=>root.SQPwa&&root.SQPwa.cacheWorld(cfg.worldId));
requestAnimationFrame(frame);
root.storyStatus=()=>({mission:current,stage:lesson.stage.id,completed:[...lesson.state.completed],xp:lesson.xp,done:lesson.state.done,position:{x:player.x,z:player.z}});
root.homeStatus=root.storyStatus;
}};
})(typeof window!=='undefined'?window:globalThis);
