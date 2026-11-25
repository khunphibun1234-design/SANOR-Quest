'use strict';
// Map 02 · School Buddy. Each round: Alex says a line, the player picks the English word.
// Thai help (line, hint, feedback) follows the player's level from SanorProfile.
// Content: content/worlds/02-school.json (mission "buddy"). Thai words come from content/words.json.
const SQ = window.SQContent;
const MISSION = SQ.worlds['02'].missions.find(m => m.id === 'buddy');
// the 2D quick practice shares the school card with the 3D mission "Show Your Friend Around"
const CARD = MISSION.card || SQ.worlds['02'].missions.find(m => m.id === 'tour').card;
const rounds = MISSION.questions.map(q => ({
  word: q.word, icon: q.icon, th: (SQ.words.find(w => w.id === q.word) || {}).th || '',
  choices: q.choices.map(c => c.en), line: q.line.en, lineTh: q.line.th, hint: q.hint.en, hintTh: q.hint.th
}));
const P = window.SanorProfile, XP = P.XP, th = P.th, esc = P.esc;
const el = id => document.getElementById(id);
let index, results;
el('art').innerHTML = QuestArt.miniature(1);
P.mountLevelButton(el('barTools'));
const paintXp = () => { el('totalXp').textContent = P.totalXp(); };
P.onChange(paintXp); paintXp();
SQCoach.mount();
let card = null, speech = null;

// Profile: 20 XP per word Alex learns with you, +100 for finishing; stamps stay in the passport.
function report(done=false) {
  const earned = results.map((r,i) => r.done ? rounds[i] : null).filter(Boolean);
  P.record('02', 'buddy', {
    xp: earned.length * XP.step + (done ? XP.bonus : 0),
    stamps: earned.map(r => ({id: r.word, label: r.word, icon: r.icon})),
    done
  });
}
function updatePass() {
  const earned = results.filter(r => r.done);
  el('stamps').textContent = earned.map((r,i) => rounds[i].icon).join(' ') || 'No stamps yet';
  el('passBar').style.width = earned.length / rounds.length * 100 + '%';
  el('place').textContent = earned.length === rounds.length ? 'Alex is ready for the stage' : earned.length ? 'Stamps for Alex · '+earned.length+' / 10' : 'First day at school';
}
function updateCrowd() {
  const n = results.filter((r, i) => r.first === rounds[i].word && !r.hintBeforeFirst).length;
  el('crowd').textContent = '🧑‍🎓'.repeat(n) || '·';
  el('crowdText').innerHTML = n ? esc(n + (n === 1 ? ' friend is' : ' friends are') + ' coming to Alex’s concert!') + th('คำตอบของคุณชวนเพื่อนมาดูคอนเสิร์ตของ Alex ได้ ' + n + ' คน')
    : esc('Answer on the first try to bring friends to the concert.') + th('ตอบถูกตั้งแต่ครั้งแรก เพื่อชวนเพื่อนมาดูคอนเสิร์ต');
}
function say(en, thText) { el('message').innerHTML = esc(en) + th(thText); }
function restart() {
  el('studentForm').reset();
  updatePrintedStudent();
  index = 0;
  results = rounds.map(() => ({first:'', attempts:0, hint:false, done:false}));
  el('play').hidden = false;
  el('report').hidden = true;
  el('finale').hidden = true;
  card = null; speech = null;
  updatePass();
  updateCrowd();
  showRound();
}
function showRound() {
  QuestVoice.stop();
  const r = rounds[index];
  el('count').textContent = 'Mission '+(index+1)+' / '+rounds.length;
  el('line').textContent = r.line;
  el('lineTh').textContent = r.lineTh;
  el('lineTh').classList.remove('open');
  el('clue').hidden = true;
  el('message').textContent = '';
  el('next').hidden = true;
  el('hint').disabled = false;
  const options = r.choices;
  // Answer buttons come from the shared mission player (shared/mission.js).
  SQMission.render(el('choices'), {kind:'choice', choices:options, answer:options.indexOf(r.word)}, {
    support: P.support(), showHint: () => el('hint').click(),
    onPick(value) { const result = results[index]; result.attempts++; if (!result.first) { result.first = options[value]; result.hintBeforeFirst = result.hint; const ok = options[value] === r.word; SanorSRS.record(r.word, {correct: ok, hint: result.hint}); P.logAnswer(ok && !result.hint); updateCrowd(); } },
    onResult({correct}) {
      if (!correct) { say('Listen to Alex again and choose another word.', 'ลองฟัง Alex อีกครั้ง แล้วเลือกคำอื่นนะ'); return; }
      results[index].done = true;
      el('hint').disabled = true;
      updatePass();
      report(false);
      say('Correct! Alex earned a stamp for '+r.word+' '+r.icon+'  +'+XP.step+' XP', 'ถูกต้อง! "'+r.word+'" แปลว่า '+r.th);
      el('next').hidden = false;
      el('next').textContent = index === rounds.length-1 ? 'See my results' : 'Continue';
      el('next').focus();
    }
  });
}
el('hint').onclick = () => {
  const r = rounds[index];
  results[index].hint = true;
  el('clue').innerHTML = '<b>Hint:</b> ' + esc(r.hint) + th(r.hintTh);
  el('clue').hidden = false;
};
el('listen').onclick = () => QuestVoice.play(rounds[index].line, message => { el('message').textContent = message; });
el('next').onclick = () => {
  if (++index < rounds.length) { showRound(); el('listen').focus(); return; }
  QuestVoice.stop();
  finale();
};
// After the 10 words: one speaking task and the school card (shared/voice.js, shared/writing.js), then the report.
function finale() {
  el('play').hidden = true;
  el('finale').hidden = false;
  el('cardTitle').textContent = CARD.title.en;
  el('cardTitleTh').textContent = CARD.title.th;
  SQVoice.mount(el('speakBox'), {target: MISSION.speak.target, prompt: MISSION.speak.prompt, onDone(r) {
    speech = r; P.recordSpeech('02', MISSION.speak.id, r);
  }});
  card = SQWriting.mount(el('writeBox'), CARD, {prefix: 'school-', onExample() { card.usedExample = true; }});
  el('finale').querySelector('h2').focus();
}
el('finishSchool').onclick = () => {
  const bad = card.check();
  if (bad.length) { card.showErrors(bad); el('finaleMsg').innerHTML = esc('Complete the boxes with an orange border.') + th('เขียนช่องที่มีกรอบสีส้มให้ครบ'); return; }
  showReport();
};
function showReport() {
  report(true);
  el('finale').hidden = true;
  el('play').hidden = true;
  el('report').hidden = false;
  el('score').textContent = 'Correct on the first try '+results.filter((r,i)=>r.first===rounds[i].word).length+' / 10 words';
  el('rows').replaceChildren(...results.map((r,i) => {
    const row = document.createElement('tr');
    [rounds[i].word, rounds[i].th, r.first, r.attempts, r.hint?'Used':'–'].forEach((value, k) => {
      const cell = row.insertCell(); cell.textContent = value; if (k === 1) cell.lang = 'th';
    });
    return row;
  }));
  const v = card.values();
  el('cardOut').innerHTML = '<h3>' + esc(CARD.title.en) + '</h3>' + CARD.fields.map(f => '<p>' + esc(v[f.id]) + '</p>').join('') + (card.usedExample ? '<p class="note">Used a writing example</p>' : '');
  el('speechOut').textContent = 'Speaking: “' + MISSION.speak.target.en + '” · ' + ({asr: 'said it (checked by the microphone)', self: 'said it (self-check)', skip: 'skipped', 'not-yet': 'not yet'}[speech ? (speech.mode === 'skip' ? 'skip' : !speech.passed ? 'not-yet' : speech.mode) : 'skip']);
  el('report').querySelector('h2').focus();
}
el('again').onclick = restart;
const studentForm = el('studentForm');
function updatePrintedStudent() {
  for (const field of studentForm.querySelectorAll('input')) {
    const value = field.value.trim();
    field.setCustomValidity(field.value && !value ? 'Please enter your student details.' : '');
    document.querySelector('[data-value="' + field.name + '"]').textContent = value || '________________';
  }
}
studentForm.addEventListener('input', updatePrintedStudent);
window.addEventListener('beforeprint', updatePrintedStudent);
studentForm.addEventListener('submit', event => {
  event.preventDefault();
  updatePrintedStudent();
  if (studentForm.reportValidity()) window.print();
});
window.addEventListener('pagehide',()=>QuestVoice.stop());
restart();
