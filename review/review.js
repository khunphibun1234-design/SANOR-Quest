'use strict';
// Daily Review: 3 minutes of spaced review (shared/srs.js) over the word bank (content/words.json).
// Order: words due now (weakest first) → words seen but not due → new words. 5 XP per correct answer, max 50 a day.
const P = window.SanorProfile, SRS = window.SanorSRS, WORDS = window.SQContent.words, esc = P.esc, th = P.th;
const el = id => document.getElementById(id);
const SECONDS = 180, MAX_ITEMS = 15, XP_EACH = 5, XP_DAY = 50, DAY = 86400000;
const today = () => { const d = new Date(); return 'd' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0'); };
let queue = [], index = 0, results = [], left = SECONDS, timer = null, current = null;
P.mountLevelButton(el('barTools')); SQCoach.mount();
const paintXp = () => { el('totalXp').textContent = P.totalXp(); el('todayXp').textContent = P.activity('review', today()).xp; };
P.onChange(paintXp);

function buildQueue() {
  const byId = Object.fromEntries(WORDS.map(w => [w.id, w]));
  const due = SRS.due(MAX_ITEMS).filter(id => byId[id]);
  const seen = WORDS.filter(w => SRS.card(w.id) && !due.includes(w.id)).sort((a, b) => SRS.card(a.id).box - SRS.card(b.id).box || SRS.card(a.id).due - SRS.card(b.id).due).map(w => w.id);
  const fresh = WORDS.filter(w => !SRS.card(w.id)).map(w => w.id);
  return [...due, ...seen, ...fresh].slice(0, MAX_ITEMS).map(id => byId[id]);
}
function intro() {
  const s = SRS.stats();
  el('dueNow').textContent = s.due; el('mastered').textContent = s.mastered; paintXp();
  el('startNote').innerHTML = s.total === 0
    ? esc('You have not met any words yet, so we will start with new words from the maps.') + th('ยังไม่มีคำที่เคยเล่น เราจะเริ่มจากคำใหม่ในแผนที่')
    : s.due ? esc(s.due + ' words are waiting. The hardest ones come first.') + th('มี ' + s.due + ' คำรอทบทวน คำที่ยากที่สุดมาก่อน')
    : esc('Nothing is due right now. You can still practise to make words stronger.') + th('ตอนนี้ยังไม่มีคำที่ถึงเวลาทบทวน แต่ฝึกเพิ่มได้เสมอ');
  el('start').hidden = false; el('play').hidden = true; el('done').hidden = true;
}
// Question style follows the Thai-help level: Thai word → English (Starter / Explorer), or a sentence with a gap (Challenger).
// Every third word with a recorded example becomes a listening question.
function ask() {
  current = queue[index];
  const w = current, others = WORDS.filter(x => x.id !== w.id).sort((a, b) => (b.topic === w.topic) - (a.topic === w.topic) || a.id.localeCompare(b.id));
  const pick = others.slice(0, 6).sort(() => 0.5 - Math.random()).slice(0, 2);
  const choices = [w, ...pick].sort(() => 0.5 - Math.random()).map(x => ({en: x.en, id: x.id}));
  const hasAudio = !!(w.example && w.example.audio);
  const kind = hasAudio && index % 3 === 2 ? 'listen' : P.thaiMode() === 'hide' && w.example ? 'gap' : 'meaning';
  el('qCount').textContent = 'Word ' + (index + 1) + ' / ' + queue.length;
  el('feedback').textContent = ''; el('next').hidden = true; el('listen').hidden = kind !== 'listen';
  if (kind === 'meaning') { el('qKind').textContent = 'Choose the English word'; el('question').innerHTML = '<span lang="th">' + esc(w.th) + '</span>'; }
  if (kind === 'gap') { el('qKind').textContent = 'Complete the sentence'; el('question').innerHTML = esc(w.example.en).replace(new RegExp('\\b' + w.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i'), '<span class="blank"></span>'); }
  if (kind === 'listen') { el('qKind').textContent = 'Listen. Which word do you hear?'; el('question').textContent = '🔊 …'; QuestVoice.play(w.example.en, m => { el('feedback').textContent = m; }); }
  const task = {kind: 'choice', choices, answer: choices.findIndex(c => c.id === w.id)};
  let first = true;
  SQMission.render(el('choices'), task, {support: P.support(), onResult({correct}) {
    if (first) { first = false; SRS.record(w.id, {correct}); P.logAnswer(correct, {world: 'review', activity: 'review', item: w.id, label: w.en, correct, hint: false}); results.push({w, correct}); }
    const ex = w.example ? '<span class="example" lang="en">' + esc(w.example.en) + '</span>' + th(w.example.th) : '';
    el('feedback').innerHTML = (correct ? '✓ ' : '✗ ' + esc('The answer is ')) + '<b>' + esc(w.en) + '</b> = ' + esc(w.th) + ex + (correct ? '' : th('คำนี้จะกลับมาให้ทบทวนเร็ว ๆ นี้'));
    if (kind === 'listen') el('question').textContent = '🔊 ' + w.example.en;
    if (!correct) for (const b of el('choices').querySelectorAll('button')) b.disabled = true;
    if (!correct) el('choices').querySelector(`[data-answer="${task.answer}"]`).classList.add('correct');
    el('next').hidden = false; el('next').focus();
  }});
}
el('listen').onclick = () => QuestVoice.play(current.example.en, m => { el('feedback').textContent = m; });
el('next').onclick = () => { if (++index < queue.length && left > 0) ask(); else finish(); };
function tick() { left--; el('clock').textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); el('timeBar').style.width = left / SECONDS * 100 + '%'; if (left <= 0) { clearInterval(timer); if (el('next').hidden) finish(); } }
el('go').onclick = () => {
  queue = buildQueue(); index = 0; results = []; left = SECONDS;
  el('start').hidden = true; el('play').hidden = false; el('clock').textContent = '3:00'; el('timeBar').style.width = '100%';
  clearInterval(timer); timer = setInterval(tick, 1000); ask();
};
function finish() {
  clearInterval(timer); QuestVoice.stop();
  const right = results.filter(r => r.correct).length, day = today();
  const xp = Math.min(XP_DAY, P.activity('review', day).xp + right * XP_EACH);
  P.record('review', day, {xp, done: true, stamps: [{id: 'review-' + day.slice(1), label: 'Daily review', icon: '🔁'}]});
  el('play').hidden = true; el('done').hidden = false;
  el('summary').innerHTML = esc(right + ' of ' + results.length + ' right · +' + Math.min(right * XP_EACH, XP_DAY) + ' XP (max 50 a day)') + th('ตอบถูก ' + right + ' จาก ' + results.length + ' คำ');
  el('rows').replaceChildren(...results.map(r => { const c = SRS.card(r.w.id), days = Math.max(0, Math.round((c.due - Date.now()) / DAY)), tr = document.createElement('tr');
    [r.w.en, r.w.th, r.correct ? '✓' : '✗', days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : 'In ' + days + ' days'].forEach((v, k) => { const td = tr.insertCell(); td.textContent = v; if (k === 1) td.lang = 'th'; }); return tr; }));
  el('done').querySelector('h2').focus();
}
el('again').onclick = intro;
intro();
