'use strict';
// Map 02 · School Buddy. Each round: Alex says a line, the player picks the English word.
// Thai help (line, hint, feedback) follows the player's level from SanorProfile.
const rounds = [
  {word:'gate', th:'ประตูโรงเรียน', icon:'🚪', others:['gym','stage'],
   line:'Meet me at the school entrance. Where should I wait?', lineTh:'เจอกันที่ทางเข้าโรงเรียนนะ ฉันควรรอที่ไหน',
   hint:'The entrance to the school', hintTh:'ทางเข้าโรงเรียน'},
  {word:'classroom', th:'ห้องเรียน', icon:'🏫', others:['canteen','library'],
   line:'Where do we have our English lesson?', lineTh:'เราเรียนวิชาภาษาอังกฤษกันที่ไหน',
   hint:'A room where students have lessons', hintTh:'ห้องที่นักเรียนใช้เรียนหนังสือ'},
  {word:'timetable', th:'ตารางเรียน', icon:'📅', others:['notebook','pencil'],
   line:'What shows the time of each lesson?', lineTh:'อะไรบอกเวลาของแต่ละวิชา',
   hint:'A list of lessons and their times', hintTh:'รายการวิชาเรียนพร้อมเวลาเรียน'},
  {word:'library', th:'ห้องสมุด', icon:'📚', others:['gym','canteen'],
   line:'I want to borrow a book. Where can we go?', lineTh:'ฉันอยากยืมหนังสือ เราไปที่ไหนได้บ้าง',
   hint:'A place to borrow books', hintTh:'สถานที่สำหรับยืมหนังสือ'},
  {word:'librarian', th:'บรรณารักษ์', icon:'🧑‍🏫', others:['coach','singer'],
   line:'Who can help me borrow this book?', lineTh:'ใครช่วยฉันยืมหนังสือเล่มนี้ได้บ้าง',
   hint:'The person who helps you borrow books', hintTh:'คนที่ช่วยเรายืมหนังสือ'},
  {word:'canteen', th:'โรงอาหาร', icon:'🍽️', others:['stage','classroom'],
   line:'I am hungry. Where can we buy lunch at school?', lineTh:'ฉันหิวแล้ว เราซื้ออาหารกลางวันในโรงเรียนได้ที่ไหน',
   hint:'A place to buy lunch at school', hintTh:'ที่ซื้ออาหารกลางวันในโรงเรียน'},
  {word:'gym', th:'โรงยิม', icon:'🏀', others:['library','garden'],
   line:'Where can we play basketball indoors?', lineTh:'เราเล่นบาสเกตบอลในร่มได้ที่ไหน',
   hint:'An indoor place to play sports', hintTh:'สถานที่ในร่มสำหรับเล่นกีฬา'},
  {word:'music', th:'ดนตรี', icon:'🎵', others:['science','art'],
   line:'What do I like? I love singing and playing the guitar.', lineTh:'ฉันชอบอะไรนะ ฉันชอบร้องเพลงและเล่นกีตาร์',
   hint:'What you hear when someone sings or plays an instrument', hintTh:'สิ่งที่เราได้ยินเมื่อมีคนร้องเพลงหรือเล่นเครื่องดนตรี'},
  {word:'club', th:'ชมรม', icon:'🎸', others:['gate','desk'],
   line:'I want to join a group that sings after school. Is there a music ___?', lineTh:'ฉันอยากเข้ากลุ่มที่ร้องเพลงหลังเลิกเรียน มี ___ ดนตรีไหม',
   hint:'A group of students who share an interest', hintTh:'กลุ่มนักเรียนที่ชอบสิ่งเดียวกัน'},
  {word:'stage', th:'เวที', icon:'🎤', others:['canteen','library'],
   line:'Our club has a concert! Where should I stand so everyone can see me sing?', lineTh:'ชมรมของเรามีคอนเสิร์ต ฉันควรยืนตรงไหนให้ทุกคนเห็นตอนร้องเพลง',
   hint:'A place to stand and perform for an audience', hintTh:'ที่สำหรับยืนแสดงให้ผู้ชมดู'}
];
const P = window.SanorProfile, XP = P.XP, th = P.th, esc = P.esc;
const el = id => document.getElementById(id);
let index, results;
el('art').innerHTML = QuestArt.miniature(1);
P.mountLevelButton(el('barTools'));
const paintXp = () => { el('totalXp').textContent = P.totalXp(); };
P.onChange(paintXp); paintXp();

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
function say(en, thText) { el('message').innerHTML = esc(en) + th(thText); }
function restart() {
  el('studentForm').reset();
  updatePrintedStudent();
  index = 0;
  results = rounds.map(() => ({first:'', attempts:0, hint:false, done:false}));
  el('play').hidden = false;
  el('report').hidden = true;
  updatePass();
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
  const options = [...r.others];
  options.splice((index+1)%3, 0, r.word);
  el('choices').replaceChildren(...options.map(answer => {
    const button = document.createElement('button');
    button.textContent = answer;
    button.lang = 'en';
    button.onclick = () => {
      const result = results[index];
      result.attempts++;
      if (!result.first) result.first = answer;
      button.disabled = true;
      if (answer !== r.word) {
        button.classList.add('wrong');
        say('Listen to Alex again and choose another word.', 'ลองฟัง Alex อีกครั้ง แล้วเลือกคำอื่นนะ');
        return;
      }
      result.done = true;
      button.classList.add('correct');
      for (const other of el('choices').children) other.disabled = true;
      el('hint').disabled = true;
      updatePass();
      report(false);
      say('Correct! Alex earned a stamp for '+r.word+' '+r.icon+'  +'+XP.step+' XP', 'ถูกต้อง! "'+r.word+'" แปลว่า '+r.th);
      el('next').hidden = false;
      el('next').textContent = index === rounds.length-1 ? 'See my results' : 'Continue';
      el('next').focus();
    };
    return button;
  }));
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
  report(true);
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
  el('report').querySelector('h2').focus();
};
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
