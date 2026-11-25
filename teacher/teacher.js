'use strict';
// SANOR QUEST · teacher dashboard. Data comes from SQBackend.teacher (Supabase, or demo mode in this browser).
const B = window.SQBackend, SQ = window.SQContent, el = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const WORLDS = [['01','My Home, My Story'],['02','School of Adventures'],['03','Phibun Hometown'],['04','Market & Food Street'],['05','Around the World'],['06','Future Makers City']];
const PLAYABLE = ['01','02'];
const missionsOf = w => { const W = SQ.worlds[w]; return W ? W.missionOrder.map(id => W.missions.find(m => m.id === id)).filter(m => !m.fallback) : []; };
const ERR = {invalid_credentials:'อีเมลหรือรหัสผ่านไม่ถูกต้อง', email_taken:'อีเมลนี้มีบัญชีแล้ว ลองเข้าสู่ระบบ', weak_password:'รหัสผ่านสั้นเกินไป (อย่างน้อย 8 ตัว)', offline:'ไม่มีอินเทอร์เน็ต', not_signed_in:'กรุณาเข้าสู่ระบบอีกครั้ง', not_your_class:'ไม่พบห้องเรียนนี้ในบัญชีของคุณ', bad_pin_format:'PIN ต้องเป็นตัวเลข 4 หลัก'};
const say = e => ERR[e.message] || e.message;
let classes = [], current = null, report = null, signUp = false, tab = 'overview', timer = null, savedNote = '';

// ---------------------------------------------------------------- sign in
function showAuth() {
  el('auth').hidden = false; el('classesView').hidden = true; el('classView').hidden = true; el('signOut').hidden = true; el('who').textContent = '';
  el('demoNote').hidden = B.mode !== 'demo'; el('demoStart').hidden = B.mode !== 'demo'; el('authForm').hidden = B.mode === 'demo';
}
el('toggleMode').onclick = () => { signUp = !signUp; el('signUpFields').hidden = !signUp; el('authSubmit').textContent = signUp ? 'สมัครใช้งาน' : 'เข้าสู่ระบบ'; el('toggleMode').textContent = signUp ? 'มีบัญชีแล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครใช้งาน'; };
el('authForm').onsubmit = async e => {
  e.preventDefault(); const f = new FormData(e.target); el('authError').textContent = '';
  try {
    const r = signUp ? await B.teacher.signUp(f.get('email'), f.get('password'), f.get('name'), f.get('school')) : await B.teacher.signIn(f.get('email'), f.get('password'));
    if (r && r.confirm) { el('authError').textContent = 'ส่งอีเมลยืนยันแล้ว กดลิงก์ในอีเมล แล้วกลับมาเข้าสู่ระบบ'; return; }
    start();
  } catch (err) { el('authError').textContent = say(err); }
};
el('demoStart').onclick = async () => { await B.teacher.signUp('demo@teacher', '', 'ครูทดลอง', ''); start(); };
el('signOut').onclick = () => { B.teacher.signOut(); clearInterval(timer); showAuth(); };

// ---------------------------------------------------------------- classes
async function start() {
  el('auth').hidden = true; el('signOut').hidden = false; el('who').textContent = (B.teacher.session() || {}).email || '';
  el('demoNote').hidden = B.mode !== 'demo';
  try { classes = await B.teacher.classes(); } catch (err) { if (err.message === 'not_signed_in') return showAuth(); alert(say(err)); return; }
  const want = new URLSearchParams(location.search).get('class');
  if (want && classes.some(c => c.id === want)) openClass(want); else listClasses();
}
function listClasses() {
  current = null; clearInterval(timer); history.replaceState(null, '', location.pathname);
  el('classesView').hidden = false; el('classView').hidden = true;
  el('classList').innerHTML = classes.length ? classes.map(c => `<button class="class-tile" data-id="${esc(c.id)}"><b>${esc(c.className)}</b><code>${esc(c.code)}</code><span>นักเรียน ${c.students} คน</span></button>`).join('')
    : '<p class="empty">ยังไม่มีห้องเรียน สร้างห้องแรกด้านบน แล้วแจ้งรหัสห้องให้นักเรียน</p>';
  el('classList').querySelectorAll('[data-id]').forEach(b => b.onclick = () => openClass(b.dataset.id));
}
el('newClass').onsubmit = async e => {
  e.preventDefault(); const name = new FormData(e.target).get('name').trim(); if (!name) return;
  try { const c = await B.teacher.createClass(name); classes = await B.teacher.classes(); e.target.reset(); openClass(c.id); } catch (err) { alert(say(err)); }
};
el('backToClasses').onclick = async () => { classes = await B.teacher.classes(); listClasses(); };

// ---------------------------------------------------------------- one class
async function openClass(id) {
  current = id; history.replaceState(null, '', '?class=' + id);
  el('classesView').hidden = true; el('classView').hidden = false; await load();
  clearInterval(timer); timer = setInterval(load, 30000);
}
async function load() {
  try { report = await B.teacher.report(current); } catch (err) { if (err.message === 'not_signed_in') return showAuth(); el('updated').textContent = 'โหลดไม่สำเร็จ: ' + say(err); return; }
  el('className').textContent = report.class.className; el('classCode').textContent = report.class.code;
  el('updated').textContent = 'อัปเดต ' + new Date().toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'});
  render();
}
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; savedNote = ''; render(); });
el('refresh').onclick = load;
el('print').onclick = () => window.print();

const pct = (a, b) => b ? Math.round(a / b * 100) : null;
const doneIn = (s, w) => missionsOf(w).filter(m => s.progress.some(p => p.world === w && p.activity === m.id && p.done)).length;
const ago = t => { if (!t) return 'ยังไม่เคยเข้า'; const m = Math.round((Date.now() - new Date(t)) / 60000); return m < 1 ? 'เมื่อสักครู่' : m < 60 ? m + ' นาทีที่แล้ว' : m < 1440 ? Math.round(m / 60) + ' ชม.ที่แล้ว' : Math.round(m / 1440) + ' วันที่แล้ว'; };
function rows() {
  return report.students.map(s => ({...s, ft: pct(s.firstTry, s.answers), m1: doneIn(s, '01'), m2: doneIn(s, '02')}));
}
function render() {
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tab));
  for (const t of ['overview', 'words', 'tests', 'settings']) el('tab-' + t).hidden = t !== tab;
  ({overview, words, tests, settings})[tab]();
}
// students who may need help come first: low first-try rate, then fewer missions
function overview() {
  const R = rows().sort((a, b) => (a.ft ?? 101) - (b.ft ?? 101) || (a.m1 + a.m2) - (b.m1 + b.m2) || a.number - b.number);
  const n = R.length, avg = f => n ? Math.round(R.reduce((s, r) => s + (f(r) || 0), 0) / n) : 0, active = R.filter(r => r.lastSeen && Date.now() - new Date(r.lastSeen) < 7 * 864e5).length;
  const m1 = missionsOf('01').length, m2 = missionsOf('02').length;
  el('tab-overview').innerHTML = `<div class="stats"><div class="stat"><strong>${n}</strong><span>นักเรียนในห้อง</span></div><div class="stat"><strong>${active}</strong><span>เข้าเล่นใน 7 วันล่าสุด</span></div><div class="stat"><strong>${avg(r => r.xp)}</strong><span>XP เฉลี่ย</span></div><div class="stat"><strong>${avg(r => r.ft)}%</strong><span>ตอบถูกครั้งแรกเฉลี่ย</span></div></div>`
   + (n ? `<div class="table-wrap"><table><thead><tr><th>เลขที่</th><th>ชื่อเล่น</th><th>เข้าล่าสุด</th><th>XP</th><th>Map 01 (${m1} ภารกิจ)</th><th>Map 02 (${m2} ภารกิจ)</th><th>ถูกครั้งแรก</th><th>ใช้คำใบ้</th><th>พูดแล้ว</th><th></th></tr></thead><tbody>`
   + R.map(r => `<tr class="${r.ft !== null && r.ft < 50 ? 'help' : ''}"><td>${r.number}</td><td>${esc(r.nickname)}${r.locked ? ' 🔒' : ''}</td><td>${ago(r.lastSeen)}</td><td>${r.xp}</td><td>${r.m1} / ${m1}</td><td>${r.m2} / ${m2}</td><td>${r.ft === null ? '–' : `<span class="pill ${r.ft < 50 ? 'low' : r.ft >= 85 ? 'ok' : ''}">${r.ft}%</span>`} <small>(${r.firstTry}/${r.answers})</small></td><td>${r.hints}</td><td>${r.spoken}</td><td><button data-student="${esc(r.id)}">ดูรายละเอียด</button></td></tr>`).join('')
   + '</tbody></table></div><p class="hint">แถวที่มีแถบสีส้ม = ตอบถูกครั้งแรกต่ำกว่า 50% อาจต้องการความช่วยเหลือ (เรียงไว้ด้านบน)</p>'
   : `<p class="empty">ยังไม่มีนักเรียนเข้าห้อง ให้นักเรียนเปิดเกม → My passport → Join my class แล้วใส่รหัส <b>${esc(report.class.code)}</b></p>`);
  el('tab-overview').querySelectorAll('[data-student]').forEach(b => b.onclick = () => student(b.dataset.student));
}
function words() {
  const M = report.missed;
  el('tab-words').innerHTML = M.length ? '<p>คำและประโยคที่ทั้งห้องตอบผิดในครั้งแรกบ่อยที่สุด 10 อันดับ เหมาะสำหรับทบทวนในคาบเรียน</p><div class="table-wrap">' + M.map((m, i) =>
    `<div class="missed-row"><b>${i + 1}</b><div><b lang="en">${esc(m.label || m.item)}</b> <small>Map ${esc(m.world)}</small><div class="bar-meter"><i style="width:${pct(m.missed, m.tries)}%"></i></div></div><span>ผิด ${m.missed} / ${m.tries} ครั้ง</span></div>`).join('') + '</div>'
    : '<p class="empty">ยังไม่มีข้อมูลการตอบ</p>';
}
function tests() {
  const R = report.students, both = R.filter(s => s.pre && s.post), avg = (list, k) => list.length ? (list.reduce((n, s) => n + s[k].score / s[k].total * 100, 0) / list.length).toFixed(1) : '–';
  el('tab-tests').innerHTML = `<div class="stats"><div class="stat"><strong>${R.filter(s => s.pre).length}</strong><span>ทำแบบทดสอบก่อนเรียน</span></div><div class="stat"><strong>${R.filter(s => s.post).length}</strong><span>ทำแบบทดสอบหลังเรียน</span></div><div class="stat"><strong>${avg(both, 'pre')}% → ${avg(both, 'post')}%</strong><span>คะแนนเฉลี่ยของคนที่ทำครบทั้งสองครั้ง (${both.length} คน)</span></div></div>`
   + (R.length ? '<div class="table-wrap"><table><thead><tr><th>เลขที่</th><th>ชื่อเล่น</th><th>ก่อนเรียน</th><th>หลังเรียน</th><th>เปลี่ยนแปลง</th></tr></thead><tbody>' + R.map(s => `<tr><td>${s.number}</td><td>${esc(s.nickname)}</td><td>${s.pre ? s.pre.score + ' / ' + s.pre.total : '–'}</td><td>${s.post ? s.post.score + ' / ' + s.post.total : '–'}</td><td>${s.pre && s.post ? (s.post.score - s.pre.score >= 0 ? '+' : '') + (s.post.score - s.pre.score) : '–'}</td></tr>`).join('') + '</tbody></table></div>' : '')
   + '<p class="hint">เปิด/ปิดแบบทดสอบได้ที่แท็บ "ตั้งค่าห้อง" นักเรียนทำได้คนละ 1 ครั้งต่อแบบทดสอบ</p>';
}
function settings() {
  const c = report.class;
  el('tab-settings').innerHTML = `<form class="settings" id="settingsForm"><label>ชื่อห้อง <input name="name" maxlength="60" value="${esc(c.className)}"></label>
   <fieldset><legend>โลกที่เปิดให้นักเรียนเล่น</legend>${WORLDS.map(([id, t]) => `<label><input type="checkbox" name="worlds" value="${id}" ${c.worldsOpen.includes(id) ? 'checked' : ''} ${PLAYABLE.includes(id) ? '' : 'disabled'}> Map ${id} · ${esc(t)}${PLAYABLE.includes(id) ? '' : ' (เร็ว ๆ นี้)'}</label>`).join('')}</fieldset>
   <fieldset><legend>ระดับตัวช่วยภาษาไทยของทั้งห้อง</legend>${[['', 'ให้นักเรียนเลือกเอง'], ['starter', '🌱 Starter · เห็นคำแปลไทยตลอด'], ['explorer', '🧭 Explorer · ซ่อนคำแปล แตะเพื่อดู'], ['challenger', '🏆 Challenger · ภาษาอังกฤษล้วน']].map(([v, t]) => `<label><input type="radio" name="thai" value="${v}" ${(c.thaiLevel || '') === v ? 'checked' : ''}> ${t}</label>`).join('')}</fieldset>
   <fieldset><legend>แบบทดสอบที่เปิดให้ทำ</legend><label><input type="checkbox" name="tests" value="pre" ${c.testsOpen.includes('pre') ? 'checked' : ''}> แบบทดสอบก่อนเรียน (Pre-test)</label><label><input type="checkbox" name="tests" value="post" ${c.testsOpen.includes('post') ? 'checked' : ''}> แบบทดสอบหลังเรียน (Post-test)</label></fieldset>
   <button class="primary" type="submit">บันทึกการตั้งค่า</button><p id="savedMsg" role="status">${savedNote}</p><p class="hint">นักเรียนจะได้รับการตั้งค่าใหม่ภายใน 1 นาทีเมื่อออนไลน์</p></form>`;
  el('tab-settings').insertAdjacentHTML('beforeend', '<fieldset class="danger"><legend>ลบห้องเรียน</legend><p>เมื่อจบปีการศึกษา ลบห้องนี้พร้อมข้อมูลนักเรียนทั้งหมด (PDPA) ควรส่งออก CSV เก็บไว้ก่อน ย้อนกลับไม่ได้</p><button type="button" id="deleteClass">🗑 ลบห้องนี้และข้อมูลทั้งหมด</button></fieldset>');
  el('deleteClass').onclick = async () => { if (prompt('พิมพ์รหัสห้อง ' + c.code + ' เพื่อยืนยันการลบ') !== c.code) return; try { await B.teacher.deleteClass(current); classes = await B.teacher.classes(); listClasses(); } catch (err) { alert(say(err)); } };
  el('settingsForm').onsubmit = async e => {
    e.preventDefault(); const f = new FormData(e.target);
    try { await B.teacher.updateClass(current, {name: f.get('name'), worlds: f.getAll('worlds'), thai: f.get('thai') || null, tests: f.getAll('tests')}); savedNote = '✓ บันทึกแล้ว'; await load(); }
    catch (err) { el('savedMsg').textContent = say(err); }
  };
}
// ---------------------------------------------------------------- one student
const missionName = (w, a) => { const m = SQ.worlds[w]?.missions.find(x => x.id === a); return m ? m.title.en : a; };
async function student(id) {
  const d = await B.teacher.studentDetail(id), ans = d.events.filter(e => e.kind === 'answer'), sp = d.events.filter(e => e.kind === 'speech');
  const RESULT = {asr: '✓ ไมค์ตรวจผ่าน', self: '✓ ประเมินตนเอง', 'not-yet': 'ยังพูดไม่ได้', skip: 'ข้าม'};
  el('studentBody').innerHTML = `<h2>เลขที่ ${d.number} · ${esc(d.nickname)}</h2>
   <p>${d.tests.map(t => `${t.kind === 'pre' ? 'ก่อนเรียน' : 'หลังเรียน'} ${t.score}/${t.total}`).join(' · ') || 'ยังไม่ได้ทำแบบทดสอบ'}</p>
   <h3>การตอบ (${ans.length})</h3>${ans.length ? `<div class="table-wrap"><table><thead><tr><th>เวลา</th><th>ภารกิจ</th><th>คำ/ประโยค</th><th>ครั้งแรก</th><th>คำใบ้</th></tr></thead><tbody>${ans.map(e => `<tr><td>${new Date(e.at).toLocaleString('th-TH', {dateStyle: 'short', timeStyle: 'short'})}</td><td>${esc(missionName(e.world, e.activity))}</td><td lang="en">${esc(e.label || e.item)}</td><td class="${e.firstTry ? 'ev-ok' : 'ev-no'}">${e.firstTry ? '✓' : '✗'}</td><td>${e.hint ? 'ใช้' : '–'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">ยังไม่มีข้อมูล</p>'}
   <h3>การพูด (${sp.length})</h3>${sp.length ? `<div class="table-wrap"><table><tbody>${sp.map(e => `<tr><td>${esc(missionName(e.world, e.activity))}</td><td>${esc(e.item)}</td><td>${RESULT[e.result] || e.result}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">ยังไม่มีข้อมูล</p>'}
   <h3>จัดการ</h3><p><button id="resetPin">ตั้ง PIN ใหม่</button> <button id="removeStudent">ลบนักเรียนออกจากห้อง</button></p>`;
  el('resetPin').onclick = async () => { const pin = prompt('PIN ใหม่ 4 หลักสำหรับนักเรียนคนนี้'); if (!pin) return; try { await B.teacher.resetPin(id, pin.trim()); alert('ตั้ง PIN ใหม่แล้ว แจ้งนักเรียนให้เข้าห้องอีกครั้งด้วย PIN นี้'); load(); } catch (err) { alert(say(err)); } };
  el('removeStudent').onclick = async () => { if (!confirm('ลบนักเรียนคนนี้และผลทั้งหมดออกจากห้อง? ย้อนกลับไม่ได้')) return; await B.teacher.removeStudent(id); el('studentDialog').close(); load(); };
  el('studentDialog').showModal();
}
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());

// ---------------------------------------------------------------- CSV (opens in Excel / Google Sheets, Thai text kept with a BOM)
el('csv').onclick = () => {
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const head = ['เลขที่', 'ชื่อเล่น', 'เข้าล่าสุด', 'XP', 'Map 01 ภารกิจที่จบ', 'Map 02 ภารกิจที่จบ', 'ตอบทั้งหมด', 'ถูกครั้งแรก', 'ถูกครั้งแรก %', 'ใช้คำใบ้', 'พูดแล้ว', 'ก่อนเรียน', 'หลังเรียน', 'คะแนนเต็ม'];
  const lines = [head, ...rows().sort((a, b) => a.number - b.number).map(r => [r.number, r.nickname, r.lastSeen || '', r.xp, r.m1, r.m2, r.answers, r.firstTry, r.ft ?? '', r.hints, r.spoken, r.pre?.score ?? '', r.post?.score ?? '', (r.pre || r.post)?.total ?? ''])];
  const blob = new Blob(['﻿' + lines.map(l => l.map(q).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'SANOR-QUEST-' + report.class.code + '-' + new Date().toISOString().slice(0, 10) + '.csv';   // ASCII file name: some browsers drop Thai ones
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

if (B.teacher.session()) start(); else showAuth();
