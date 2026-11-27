'use strict';
// Pre-test / post-test (content/tests.json): two parallel forms that test the same things with different questions,
// The first attempt is kept (SanorProfile.recordTest) and, in a class, sent to the teacher (shared/sync.js).
const P = window.SanorProfile, K = window.SanorClass, T = window.SQContent.tests, esc = P.esc, th = P.th;
const el = id => document.getElementById(id);
const kind = new URLSearchParams(location.search).get('kind') === 'post' ? 'post' : 'pre';
// the pre-test everyone takes once before playing (sent here by the town map, the start screens and the worlds)
const first = kind === 'pre' && (new URLSearchParams(location.search).has('first') || K.pretestDue());
// answers are kept while the student works, so closing the app does not lose them
const DRAFT = 'sanor-test-draft-v1';
const draft = (() => { try { const d = JSON.parse(localStorage.getItem(DRAFT)); return d && d.kind === kind && d.answers ? d.answers : {}; } catch { return {}; } })();
const saveDraft = form => { const a = {}; for (const i of form.querySelectorAll('input:checked')) a[i.name] = +i.value; try { localStorage.setItem(DRAFT, JSON.stringify({kind, answers: a, at: new Date().toISOString()})); } catch {} };
P.mountLevelButton(el('barTools'));
el('kindLabel').textContent = kind === 'pre' ? 'PRE-TEST · BEFORE THE GAME' : 'POST-TEST · AFTER THE GAME';
el('title').textContent = T.title.en + (kind === 'pre' ? ' · Pre-test' : ' · Post-test');
el('lede').innerHTML = esc(kind === 'pre' ? 'This shows what you know before you play. It is not graded.' : 'This shows what you learned while playing. It is not graded.')
  + th(kind === 'pre' ? 'แบบทดสอบนี้ใช้ดูความรู้ก่อนเล่น ไม่มีผลต่อคะแนนเก็บ' : 'แบบทดสอบนี้ใช้ดูว่าได้เรียนรู้อะไรจากเกม ไม่มีผลต่อคะแนนเก็บ');
// a small seeded shuffle so everyone gets the same order for the same test
function order(n, seed) { const a = [...Array(n).keys()]; let x = seed; for (let i = n - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; const j = Math.floor(x / 233280 * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// two parallel forms (content/tests.json): form A before the game, form B after it, so nobody can remember the answers
const F = T.forms[kind];
const total = F.parts.reduce((n, p) => n + p.items.length, 0);
function showResult(r) {
  el('intro').hidden = true; el('paper').hidden = true; el('result').hidden = false;
  el('score').textContent = r.score + ' / ' + r.total;
  if (kind === 'pre') { const b = el('backLink'); b.textContent = 'Start your adventure →'; b.classList.add('primary-link'); }
  el('resultNote').innerHTML = esc(K.info() ? 'Your result was saved and will be sent to your teacher.' : 'Your result is saved on this device.') + th(K.info() ? 'บันทึกผลแล้ว และจะส่งให้ครู' : 'บันทึกผลไว้ในเครื่องนี้แล้ว');
}
if (P.test(kind)) showResult(P.test(kind));
else if (kind === 'post' ? !K.postReady() : !K.testOpen(kind)) {
  el('closed').hidden = false;
  if (kind === 'post') el('closed').querySelector('p').innerHTML = esc(P.test('pre') ? 'The post-test opens when you finish every mission in all six worlds (or when your teacher opens it).' : 'Do the pre-test first.') + th(P.test('pre') ? 'แบบทดสอบหลังเรียนจะเปิดเมื่อเล่นจบทุกภารกิจครบทั้ง 6 โลก หรือเมื่อครูเปิดให้' : 'ทำแบบทดสอบก่อนเรียนก่อน');
}
else { el('intro').hidden = false; el('count').textContent = total; el('minutes').textContent = T.minutes; el('firstNote').hidden = !first;
  const n = Object.keys(draft).length; if (n) { el('draftNote').hidden = false; el('draftNote').innerHTML = esc('Your answers were saved: ' + n + ' / ' + total + ' done.') + th('บันทึกคำตอบไว้แล้ว ' + n + ' จาก ' + total + ' ข้อ ทำต่อจากเดิมได้เลย'); el('begin').textContent = 'Continue the test →'; } }
el('begin').onclick = () => {
  el('intro').hidden = true;
  const form = el('paper'); let n = 0;
  form.innerHTML = F.parts.map((part, pi) => {
    const items = order(part.items.length, (kind === 'pre' ? 17 : 71) + pi).map(i => part.items[i]);
    return `<section class="part"><h2>${esc(part.title.en)}${th(part.title.th)}</h2><p>${esc(part.instruction.en)}${th(part.instruction.th)}</p>${part.passage ? `<p class="passage" lang="en">${esc(part.passage.en)}</p>` : ''}`
      + items.map(it => { n++; const opts = order(it.choices.length, n * 7 + (kind === 'pre' ? 3 : 5));
        return `<fieldset class="item"><legend>${n}. <span ${/[฀-๿]/.test(it.prompt.en) ? 'lang="th"' : 'lang="en"'}>${esc(it.prompt.en)}</span></legend>${opts.map(o => `<label><input type="radio" name="${esc(it.id)}" value="${o}" required> <span lang="en">${esc(it.choices[o])}</span></label>`).join('')}</fieldset>`; }).join('') + '</section>';
  }).join('') + '<p id="submitMsg" role="alert"></p><div class="submit-row"><button class="primary" type="submit" id="finishTest">Finish the test</button><button type="button" id="keepChecking" hidden>Check my answers again</button></div>';
  for (const [id, v] of Object.entries(draft)) { const i = form.querySelector(`input[name="${CSS.escape(id)}"][value="${v}"]`); if (i) i.checked = true; }
  form.addEventListener('change', () => saveDraft(form));
  form.noValidate = true;   // our own check below says which questions are missing (the browser's hint is easy to miss)
  form.hidden = false; form.querySelector('h2').scrollIntoView({block: 'start'});
  form.addEventListener('change', e => { e.target.closest('fieldset')?.classList.remove('missing'); unconfirm(); });
  el('keepChecking').onclick = () => { unconfirm(); form.querySelector('h2').scrollIntoView({block: 'start'}); };
};
// finishing takes two taps on the page itself (no browser confirm(): some phones and in-app browsers never show it)
let confirming = false;
function unconfirm() { if (!confirming) return; confirming = false; el('finishTest').textContent = 'Finish the test'; el('keepChecking').hidden = true; el('submitMsg').textContent = ''; }
el('paper').onsubmit = e => {
  e.preventDefault();
  const form = e.target, items = F.parts.flatMap(p => p.items), data = new FormData(form), answers = items.map(it => data.get(it.id) === null ? null : +data.get(it.id));
  const sets = [...form.querySelectorAll('fieldset.item')], missing = sets.filter(fs => !fs.querySelector('input:checked'));
  sets.forEach(fs => fs.classList.toggle('missing', missing.includes(fs)));
  if (missing.length) {
    const nums = missing.map(fs => fs.querySelector('legend').textContent.split('.')[0]).join(', ');
    el('submitMsg').innerHTML = esc('Please answer every question. Not answered yet: ' + nums) + th('ยังไม่ได้ตอบข้อ ' + nums + ' ตอบให้ครบทุกข้อก่อนส่ง');
    missing[0].scrollIntoView({block: 'center'}); missing[0].querySelector('input').focus({preventScroll: true});
    return;
  }
  if (!confirming) {
    confirming = true;
    el('submitMsg').innerHTML = esc('You answered all ' + total + ' questions. Tap again to send. You cannot change your answers after this.') + th('ตอบครบ ' + total + ' ข้อแล้ว กดอีกครั้งเพื่อส่ง ส่งแล้วแก้คำตอบไม่ได้');
    el('finishTest').textContent = 'Yes, finish the test ✓'; el('keepChecking').hidden = false; el('finishTest').focus();
    return;
  }
  const score = items.filter((it, i) => answers[i] === it.answer).length;
  P.recordTest(kind, {score, total, answers});
  try { localStorage.removeItem(DRAFT); } catch {}
  K.flush();
  showResult({score, total});
  el('result').querySelector('h2').focus();
};
