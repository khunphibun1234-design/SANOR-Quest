'use strict';
// Pre-test / post-test (content/tests.json). Same questions, mixed in a different order for pre and post.
// The first attempt is kept (SanorProfile.recordTest) and, in a class, sent to the teacher (shared/sync.js).
const P = window.SanorProfile, K = window.SanorClass, T = window.SQContent.tests, esc = P.esc, th = P.th;
const el = id => document.getElementById(id);
const kind = new URLSearchParams(location.search).get('kind') === 'post' ? 'post' : 'pre';
P.mountLevelButton(el('barTools'));
el('kindLabel').textContent = kind === 'pre' ? 'PRE-TEST · BEFORE THE GAME' : 'POST-TEST · AFTER THE GAME';
el('title').textContent = T.title.en + (kind === 'pre' ? ' · Pre-test' : ' · Post-test');
el('lede').innerHTML = esc(kind === 'pre' ? 'This shows what you know before you play. It is not graded.' : 'This shows what you learned while playing. It is not graded.')
  + th(kind === 'pre' ? 'แบบทดสอบนี้ใช้ดูความรู้ก่อนเล่น ไม่มีผลต่อคะแนนเก็บ' : 'แบบทดสอบนี้ใช้ดูว่าได้เรียนรู้อะไรจากเกม ไม่มีผลต่อคะแนนเก็บ');
// a small seeded shuffle so everyone gets the same order for the same test
function order(n, seed) { const a = [...Array(n).keys()]; let x = seed; for (let i = n - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; const j = Math.floor(x / 233280 * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const total = T.parts.reduce((n, p) => n + p.items.length, 0);
function showResult(r) {
  el('intro').hidden = true; el('paper').hidden = true; el('result').hidden = false;
  el('score').textContent = r.score + ' / ' + r.total;
  el('resultNote').innerHTML = esc(K.info() ? 'Your result was saved and will be sent to your teacher.' : 'Your result is saved on this device.') + th(K.info() ? 'บันทึกผลแล้ว และจะส่งให้ครู' : 'บันทึกผลไว้ในเครื่องนี้แล้ว');
}
if (P.test(kind)) showResult(P.test(kind));
else if (!K.testOpen(kind)) el('closed').hidden = false;
else { el('intro').hidden = false; el('count').textContent = total; el('minutes').textContent = T.minutes; }
el('begin').onclick = () => {
  el('intro').hidden = true;
  const form = el('paper'); let n = 0;
  form.innerHTML = T.parts.map((part, pi) => {
    const items = order(part.items.length, (kind === 'pre' ? 17 : 71) + pi).map(i => part.items[i]);
    return `<section class="part"><h2>${esc(part.title.en)}${th(part.title.th)}</h2><p>${esc(part.instruction.en)}${th(part.instruction.th)}</p>${part.passage ? `<p class="passage" lang="en">${esc(part.passage.en)}</p>` : ''}`
      + items.map(it => { n++; const opts = order(it.choices.length, n * 7 + (kind === 'pre' ? 3 : 5));
        return `<fieldset class="item"><legend>${n}. <span ${/[฀-๿]/.test(it.prompt.en) ? 'lang="th"' : 'lang="en"'}>${esc(it.prompt.en)}</span></legend>${opts.map(o => `<label><input type="radio" name="${esc(it.id)}" value="${o}" required> <span lang="en">${esc(it.choices[o])}</span></label>`).join('')}</fieldset>`; }).join('') + '</section>';
  }).join('') + '<p id="submitMsg" role="alert"></p><button class="primary" type="submit">Finish the test</button>';
  form.hidden = false; form.querySelector('h2').scrollIntoView({block: 'start'});
};
el('paper').onsubmit = e => {
  e.preventDefault();
  const items = T.parts.flatMap(p => p.items), data = new FormData(e.target), answers = items.map(it => data.get(it.id) === null ? null : +data.get(it.id));
  if (answers.some(a => a === null)) { el('submitMsg').innerHTML = esc('Please answer every question.') + th('ตอบให้ครบทุกข้อก่อนส่ง'); return; }
  if (!confirm('Finish the test? You cannot change your answers after this.')) return;
  const score = items.filter((it, i) => answers[i] === it.answer).length;
  P.recordTest(kind, {score, total, answers});
  K.flush();
  showResult({score, total});
  el('result').querySelector('h2').focus();
};
