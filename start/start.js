'use strict';
/* SANOR QUEST · start screens: splash → log in / register (class code + class number + nickname + PIN) → town map.
 * The town map (index.html) sends each new browser session here once. Students already in a class, or who chose
 * "Play without a class", see the splash and continue on their own. Logging in is never required to play.
 *   ?next=#worlds  where to go afterwards (only "?…" or "#…" on the town map)
 *   #login / #register  open that form directly (the splash is skipped) */
(()=>{
const $=id=>document.getElementById(id),K=window.SanorClass,P=window.SanorProfile;
const SPLASH='sanor-splash-v1',WELCOME='sanor-welcome-v1';
const store={get:(s,k)=>{try{return s.getItem(k);}catch{return null;}},set:(s,k,v)=>{try{s.setItem(k,v);}catch{}}};
const next=(()=>{const n=new URLSearchParams(location.search).get('next')||'';return'../'+(/^[?#][\w\-=&#%.]*$/.test(n)?n:'');})();
const calm=matchMedia('(prefers-reduced-motion: reduce)').matches||(P&&P.reducedMotion&&P.reducedMotion());
if(calm)document.documentElement.classList.add('calm');
const inClass=()=>{const me=K&&K.info();return!!me&&!me.expired;};
const decided=()=>inClass()||store.get(localStorage,WELCOME)==='guest';
const go=()=>{store.set(sessionStorage,SPLASH,'1');location.replace(K&&K.pretestDue()?'../test/?kind=pre&first=1':next);};   // pre-test first, once
$('demoNote').hidden=!(K&&K.mode==='demo');

// ---------- splash ----------
function splash(){const loader=$('loader'),bar=loader.firstElementChild,t0=performance.now(),MIN=calm?500:1700;
 const imgs=[...document.querySelectorAll('#splash img')].map(i=>i.complete?Promise.resolve():new Promise(r=>{i.onload=i.onerror=r;}));
 const later=new Image();later.src='../images/brand/welcome.webp';          // ready for the next screen
 let loaded=false;Promise.all(imgs).then(()=>{loaded=true;document.body.classList.add('ready');});
 (function tick(){const p=Math.min(1,(performance.now()-t0)/MIN)*(loaded?1:.85);bar.style.width=p*100+'%';loader.setAttribute('aria-valuenow',Math.round(p*100));
  if(p<1)return requestAnimationFrame(tick);
  loader.classList.add('done');store.set(sessionStorage,SPLASH,'1');
  if(decided())return setTimeout(go,calm?0:350);                            // returning player: straight on
  const b=$('startBtn');b.hidden=false;b.focus({preventScroll:true});})();
 $('startBtn').onclick=()=>show('login');
 $('splash').addEventListener('click',e=>{if(!$('startBtn').hidden&&e.target.closest('.splash-stage'))show('login');});}

// ---------- log in / register ----------
function show(which){const auth=$('auth'),first=auth.hidden;
 if(first){$('splash').classList.add('leaving');setTimeout(()=>{$('splash').hidden=true;},calm?0:450);auth.hidden=false;}
 $('loginForm').hidden=which!=='login';$('registerForm').hidden=which!=='register';
 if(location.hash!=='#'+which)history.replaceState(null,'','#'+which);
 const form=$(which+'Form');form.querySelector('h1').setAttribute('tabindex','-1');
 // keep what was already typed when switching forms
 const other=$(which==='login'?'registerForm':'loginForm');for(const n of ['code','number'])if(!form[n].value&&other[n].value)form[n].value=other[n].value;
 if(which==='register'&&!form.nickname.value&&P&&P.name())form.nickname.value=P.name();
 const target=[...form.querySelectorAll('input')].find(i=>!i.value)||form.querySelector('input');
 if(!first)form.querySelector('h1').focus();else setTimeout(()=>{const f=document.activeElement;if(!(f&&/INPUT|BUTTON|A/.test(f.tagName)&&f!==$('startBtn')))target.focus({preventScroll:true});},calm?0:300);}   // never move the cursor away from a box the student already chose
addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(h==='login'||h==='register')show(h);});
for(const b of document.querySelectorAll('.eye'))b.onclick=()=>{const i=b.parentElement.querySelector('input'),on=i.type==='password';i.type=on?'text':'password';b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'Hide PIN':'Show PIN');};
for(const i of document.querySelectorAll('input[name=code]'))i.addEventListener('input',()=>{i.value=i.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);});
for(const i of document.querySelectorAll('input[name^=pin]'))i.addEventListener('input',()=>{i.value=i.value.replace(/\D/g,'').slice(0,4);});

const MSG={bad_code:['The class code has 6 letters or numbers.','รหัสห้องมี 6 ตัว (ตัวอักษรหรือตัวเลข) ขอได้จากครู'],class_not_found:['Class code not found.','ไม่พบรหัสห้องนี้ ตรวจสอบกับครูอีกครั้ง'],
 wrong_pin:['Wrong PIN.','PIN ไม่ถูกต้อง ถ้าลืม PIN ให้ครูตั้งใหม่ได้'],
 locked:['Too many wrong PINs. Wait 10 minutes or ask your teacher.','ใส่ PIN ผิดหลายครั้ง รอ 10 นาที หรือให้ครูตั้ง PIN ใหม่'],
 bad_pin_format:['The PIN must be 4 digits.','PIN ต้องเป็นตัวเลข 4 หลัก'],bad_number:['Class number must be 1–99.','เลขที่ต้องเป็น 1–99'],
 bad_nickname:['Please type a nickname (up to 20 letters).','ใส่ชื่อเล่น ไม่เกิน 20 ตัวอักษร'],
 not_registered:['This class number has not registered yet.','เลขที่นี้ยังไม่ได้ลงทะเบียนในห้องนี้ กด "Create an account" เพื่อลงทะเบียนก่อน'],
 taken:['This class number is already registered.','เลขที่นี้ลงทะเบียนแล้ว ถ้าเป็นของคุณให้เข้าสู่ระบบ ถ้าลืม PIN ให้ครูตั้งใหม่'],
 pin_mismatch:['The two PINs are different.','PIN สองช่องไม่ตรงกัน'],
 offline:['No internet. Connect once to join your class, or play without a class for now.','ไม่มีอินเทอร์เน็ต ต้องต่ออินเทอร์เน็ตครั้งแรกเพื่อเข้าห้อง หรือกด "เล่นโดยไม่เข้าห้องเรียน" ไปก่อน']};
function fail(form,code,field){const [en,th]=MSG[code]||[code,'เกิดข้อผิดพลาด ลองอีกครั้ง'];const box=form.querySelector('.error');
 box.innerHTML='';box.append(en,Object.assign(document.createElement('span'),{lang:'th',textContent:th}));
 for(const i of form.querySelectorAll('input'))i.removeAttribute('aria-invalid');
 if(field&&form[field]){form[field].setAttribute('aria-invalid','true');form[field].focus();}}
function check(form){for(const [name,code] of [['code','bad_code'],['number','bad_number'],['nickname','bad_nickname'],['pin','bad_pin_format'],['pin2','bad_pin_format']]){
  const i=form[name];if(i&&!i.checkValidity()){fail(form,code,name);return false;}}return true;}
async function submit(form,register){if(!check(form))return;
 if(register&&form.pin.value!==form.pin2.value)return fail(form,'pin_mismatch','pin2');
 const btn=form.querySelector('.cta-button');btn.disabled=true;btn.classList.add('busy');form.querySelector('.error').textContent='';
 try{const me=await K.join(form.code.value,form.number.value,register?form.nickname.value.trim():'',form.pin.value);
  const back=register&&me.nickname!==form.nickname.value.trim();
  welcome(me,register&&!back?'registered':'back');}
 catch(e){const c=e.message;
  if(!register&&c==='bad_nickname')return fail(form,'not_registered','number');
  if(register&&c==='wrong_pin')return fail(form,'taken','number');
  fail(form,c,{class_not_found:'code',wrong_pin:'pin',bad_pin_format:'pin',bad_number:'number',bad_nickname:'nickname'}[c]);}
 finally{btn.disabled=false;btn.classList.remove('busy');}}
$('loginForm').addEventListener('submit',e=>{e.preventDefault();submit(e.target,false);});
$('registerForm').addEventListener('submit',e=>{e.preventDefault();submit(e.target,true);});
function welcome(me,kind){const w=$('welcome');
 w.innerHTML=`<img src="../images/brand/logo.webp" alt="" width="160"><strong></strong><span></span><small lang="th"></small>`;
 w.querySelector('strong').textContent=(kind==='registered'?'Welcome, ':'Welcome back, ')+me.nickname+'!';
 w.querySelector('span').textContent=me.className+' · No. '+me.number;
 w.querySelector('small').textContent=kind==='registered'?'ลงทะเบียนสำเร็จ จำรหัสห้อง เลขที่ และ PIN ไว้ใช้ครั้งหน้า':'เข้าสู่ระบบสำเร็จ';
 w.hidden=false;try{localStorage.removeItem(WELCOME);}catch{}setTimeout(go,calm?600:1500);}
$('guestBtn').onclick=()=>{store.set(localStorage,WELCOME,'guest');go();};

// ---------- start ----------
const h=location.hash.slice(1);
if(h==='login'||h==='register'){$('splash').hidden=true;show(h);}else splash();
})();
