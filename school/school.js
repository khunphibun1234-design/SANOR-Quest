'use strict';
const rounds = [
  ['gate','Meet me at the school entrance. Where should I wait?','The entrance to the school',['gym','stage'],'🚪'],
  ['classroom','Where do we have our English lesson?','A room where students have lessons',['canteen','library'],'🏫'],
  ['timetable','What shows the time of each lesson?','A list of lessons and their times',['notebook','pencil'],'📅'],
  ['library','I want to borrow a book. Where can we go?','A place to borrow books',['gym','canteen'],'📚'],
  ['librarian','Who can help me borrow this book?','The person who helps you borrow books',['coach','singer'],'🧑‍🏫'],
  ['canteen','I am hungry. Where can we buy lunch at school?','A place to buy lunch at school',['stage','classroom'],'🍽️'],
  ['gym','Where can we play basketball indoors?','An indoor place to play sports',['library','garden'],'🏀'],
  ['music','What do I like? I love singing and playing the guitar.','What you hear when someone sings or plays an instrument',['science','art'],'🎵'],
  ['club','I want to join a group that sings after school. Is there a music ___?','A group of students who share an interest',['gate','desk'],'🎸'],
  ['stage','Our club has a concert! Where should I stand so everyone can see me sing?','A place to stand and perform for an audience',['canteen','library'],'🎤']
];
const el = id => document.getElementById(id);
let index, results;
el('art').innerHTML = QuestArt.miniature(1);
function updatePass() {
  const earned = results.filter(r => r.done);
  el('stamps').textContent = earned.map((r,i) => rounds[i][4]).join(' ') || 'No stamps yet';
  el('place').textContent = earned.length === rounds.length ? 'Alex is ready for the stage' : earned.length ? 'Stamps for Alex · '+earned.length+' / 10' : 'First day at school';
}
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
  const [word,line,,others] = rounds[index];
  el('count').textContent = 'Mission '+(index+1)+' / '+rounds.length;
  el('line').textContent = line;
  el('clue').textContent = el('message').textContent = '';
  el('next').hidden = true;
  el('hint').disabled = false;
  const options = [...others];
  options.splice((index+1)%3,0,word);
  el('choices').replaceChildren(...options.map(answer => {
    const button = document.createElement('button');
    button.textContent = answer;
    button.lang = 'en';
    button.onclick = () => {
      const result = results[index];
      result.attempts++;
      if (!result.first) result.first = answer;
      button.disabled = true;
      if (answer !== word) {
        el('message').textContent = 'Listen to Alex again and choose another word.';
        return;
      }
      result.done = true;
      button.classList.add('correct');
      for (const other of el('choices').children) other.disabled = true;
      el('hint').disabled = true;
      updatePass();
      el('message').textContent = 'Correct! Alex earned a stamp for '+word+' '+rounds[index][4];
      el('next').hidden = false;
      el('next').textContent = index === rounds.length-1 ? 'See my results' : 'Continue';
      el('next').focus();
    };
    return button;
  }));
}
el('hint').onclick = () => {results[index].hint = true; el('clue').textContent = rounds[index][2];};
el('listen').onclick = () => QuestVoice.play(rounds[index][1], message => {el('message').textContent=message;});
el('next').onclick = () => {
  if (++index < rounds.length) {showRound(); el('listen').focus(); return;}
  QuestVoice.stop();
  el('play').hidden = true;
  el('report').hidden = false;
  el('score').textContent = 'Correct on the first try '+results.filter((r,i)=>r.first===rounds[i][0]).length+' / 10 words';
  el('rows').replaceChildren(...results.map((r,i) => {
    const row = document.createElement('tr');
    for (const value of [rounds[i][0],r.first,r.attempts,r.hint?'Used':'–']) row.insertCell().textContent = value;
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
