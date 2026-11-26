// Records the teacher how-to video (a real walkthrough of the game in demo mode, with Thai + English captions)
// and puts the Thai narration under it, scene by scene.
//
//   python3 -m http.server 8080 &
//   node scripts/record-guide-video.js video-out          → video-out/sanor-quest-teacher-guide.mp4 (needs ffmpeg)
//
// Narration: docs/video/narration-th.mp3 · when each scene starts in it: docs/video/timing.json (one entry per row
// of docs/video-script.md). Each scene is recorded for at least its narration time; afterwards ffmpeg trims or gently
// speeds up every scene so it ends exactly when the narrator moves on.
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const ROOT=path.join(__dirname,'..'),OUT=path.resolve(process.argv[2]||'video-out'),BASE=process.env.BASE||'http://localhost:8080';
const T=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/video/timing.json'),'utf8'));
const dur=i=>(i+1<T.starts.length?T.starts[i+1]:T.end)-T.starts[i];

(async()=>{fs.mkdirSync(OUT,{recursive:true});
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,recordVideo:{dir:OUT,size:{width:1280,height:720}}});
 const p=await ctx.newPage();const t0=Date.now();const wait=ms=>p.waitForTimeout(ms);
 const scenes=[];let current=null;
 // the caption bar (and the title card) are drawn into the page, so they are part of the recording
 const overlay=()=>p.evaluate(()=>{if(document.getElementById('__cap'))return;const d=document.createElement('div');d.id='__cap';
  d.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483646;max-width:86%;padding:12px 22px 13px;border-radius:16px;background:rgba(18,52,36,.9);border:2px solid #e3b94f;color:#fff;font:600 23px/1.42 "Noto Sans Thai",Outfit,sans-serif;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.3);transition:opacity .25s';
  document.body.append(d);});
 async function caption(th,en){await overlay().catch(()=>{});await p.evaluate(([th,en])=>{const d=document.getElementById('__cap');d.innerHTML=th+(en?'<div style="font:500 16px/1.4 Outfit,sans-serif;color:#d9ead9;margin-top:3px">'+en+'</div>':'');d.style.opacity=1;},[th,en]).catch(()=>{});}
 async function titleCard(th,en,lines=[]){await p.evaluate(([th,en,lines])=>{document.getElementById('__cap')?.remove();const d=document.createElement('div');d.id='__title';
  d.style.cssText='position:fixed;inset:0;z-index:2147483647;display:grid;place-content:center;justify-items:center;gap:10px;text-align:center;background:radial-gradient(circle at 50% 35%,#fffaf0,#f1e7c9);color:#1d6338;font:800 50px/1.25 Outfit,"Noto Sans Thai",sans-serif';
  d.innerHTML='<img src="'+location.origin+'/images/brand/logo.webp" style="width:250px;height:auto;filter:drop-shadow(0 8px 16px rgba(80,50,0,.25))"><div>'+th+'</div><div style="font:500 24px/1.5 Outfit,\'Noto Sans Thai\',sans-serif;color:#4c5e48">'+en+'</div>'+lines.map(l=>'<div style="font:600 21px/1.5 \'Noto Sans Thai\',sans-serif;color:#3c5d52">✦ '+l+'</div>').join('');
  document.body.append(d);},[th,en,lines]);}
 // one scene = one row of the narration script; it lasts at least as long as its narration
 async function scene(i,fn){const start=(Date.now()-t0)/1000;current={i,start};await fn();
  const left=dur(i)*1000-(Date.now()-t0-start*1000);if(left>0)await wait(left);scenes.push({i,start,end:(Date.now()-t0)/1000});}
 const type=async(sel,text)=>{await p.click(sel);await p.keyboard.type(text,{delay:85});};

 // 0 · title over the splash screen
 await scene(0,async()=>{await p.goto(BASE+'/start/');await wait(300);await caption('SANOR QUEST · คู่มือครู','A quick guide for teachers');});
 // 1 · town map
 await scene(1,async()=>{await p.goto(BASE+'/');await p.evaluate(()=>{for(const k of Object.keys(localStorage))if(k.startsWith('sanor-'))localStorage.removeItem(k);});await p.reload();await wait(600);
  await caption('หน้าแผนที่เมือง: นักเรียนเลือกโลกที่จะผจญภัย','The town map: students choose a world');await wait(4200);
  await p.mouse.wheel(0,420);await caption('แต่ละโลกมี 3 ภารกิจ · ตัวช่วยภาษาไทย 3 ระดับ','3 missions per world · 3 levels of Thai help');});
 // 2 · teacher creates a class
 let code='';
 await scene(2,async()=>{await p.goto(BASE+'/teacher/');await wait(400);await caption('ครูเปิดหน้า teacher แล้วเข้าสู่ระบบ','Teacher: open /teacher/ and sign in');
  await p.click('#demoStart');await wait(500);await type('#newClass input','ม.2/5');await p.click('#newClass button');await wait(400);
  code=(await p.locator('#classCode').textContent()).trim();});
 // 3 · the class code
 await scene(3,async()=>{await caption('ได้รหัสห้อง 6 ตัว: <b style="letter-spacing:.12em;color:#f6d77c">'+code+'</b> เขียนบนกระดานให้นักเรียน','A 6-character class code for the board');
  await p.locator('.code-card').evaluate(e=>{e.style.transition='box-shadow .3s';e.style.boxShadow='0 0 0 5px #f2c14e';});});
 // 4 · settings
 await scene(4,async()=>{await p.click('[data-tab=settings]');await wait(300);await caption('ตั้งค่าห้อง: โลกที่เปิด · ตัวช่วยภาษาไทย · แบบทดสอบก่อน/หลังเรียน','Settings: open worlds, Thai help level, tests');});
 // 5 · student opens "Join my class"
 await scene(5,async()=>{await p.goto(BASE+'/');await wait(500);await caption('นักเรียน: กดปุ่ม 🏫 Join my class','Student: tap Join my class');await p.click('#classChip');});
 // 6 · the form
 await scene(6,async()=>{await caption('รหัสห้อง · เลขที่ · ชื่อเล่น · PIN 4 หลัก (ไม่ต้องใช้อีเมล ไม่เก็บชื่อจริง)','Class code, number, nickname, 4-digit PIN. No email, no real names.');
  await type('#joinForm [name=code]',code);await type('#joinForm [name=number]','7');await p.fill('#joinForm [name=nickname]','');await type('#joinForm [name=nickname]','Ploy');await type('#joinForm [name=pin]','2468');});
 // 7 · joined (and, out of sight, a few classmates so the dashboard has something to show)
 await scene(7,async()=>{await p.click('#joinForm button');await wait(900);
  await caption('เข้าห้องแล้ว: ผลการเล่นส่งถึงครูเอง ไม่มีเน็ตก็เก็บไว้ส่งทีหลัง','Joined: results reach the teacher, even after playing offline');
  await p.evaluate(async code=>{const W=[['gate',1],['gym',.55],['library',.7],['canteen',.4],['music',.8],['timetable',.35],['science',.6],['stage',.75]];let seed=3;const r=()=>(seed=seed*16807%2147483647)/2147483647;
   for(let n=1;n<=24;n++){if(n===7)continue;const j=await SQBackend.student.join(code,n,['Mook','Beam','Fah','Ton','Mint','Nan','Bank','Ice'][n%8]+n,'1111');const ev=[];
    W.forEach(([w,p],k)=>{const ok=r()<p;ev.push({id:'v'+n+'-'+k,kind:'answer',world:'02',activity:'timetable',item:w,label:w,correct:ok,firstTry:ok,hint:!ok&&r()<.5});});
    const pre=6+Math.floor(r()*8);ev.push({kind:'progress',world:'01',activity:'welcome',xp:300,done:true},{kind:'progress',world:'02',activity:'timetable',xp:Math.round(r()*8)*20,done:r()<.4},
     {kind:'test',test:'pre',score:pre,total:20});if(n<=20)ev.push({kind:'test',test:'post',score:Math.min(20,pre+2+Math.floor(r()*6)),total:20});
    await SQBackend.student.submit(j.token,ev);}},code);});
 // 8 · Map 02 in 3D
 await scene(8,async()=>{await p.goto(BASE+'/school/?speed=2');await caption('แผนที่ที่ 2 · โรงเรียน 3D: เลือกภารกิจแล้วเริ่มเล่น','Map 02: a 3D school · choose a mission and start');await wait(2600);});
 // 9 · Take me there
 await scene(9,async()=>{await p.click('#startBtn');await wait(900);await caption('กด “Take me there” ตัวละครเดินไปเอง หรือเดินเองด้วยปุ่มลูกศร','Tap “Take me there”, or walk with the arrow keys');
  await p.click('#guideBtn');for(let k=0;k<60;k++){if(await p.locator('#dialogOverlay').isVisible())break;await wait(250);}});
 // 10 · the conversation
 await scene(10,async()=>{for(let k=0;k<40&&!(await p.locator('#dialogOverlay').isVisible());k++)await wait(250);
  await caption('ฟังสิ่งที่ Alex พูด แล้วเลือกคำตอบ · คำแปลไทยตามระดับที่ตั้งไว้','Listen to Alex and choose · Thai help follows the level');});
 // 11 · a first-try answer changes the world
 await scene(11,async()=>{await p.locator('#answerArea .choice',{hasText:/^\s*\w?\s*gate\s*$/i}).first().click().catch(async()=>{await p.locator('#answerArea .choice').nth(1).click();});
  await wait(600);await caption('ตอบถูกครั้งแรก → โลกในเกมเปลี่ยน คำพูดของนักเรียนเปลี่ยนโลกได้จริง','A first-try answer changes the world');
  await wait(3200);await p.click('#nextQuestion').catch(()=>{});});
 // 12 · daily review
 await scene(12,async()=>{await p.goto(BASE+'/review/');await wait(400);await caption('การบ้าน: ทบทวนประจำวัน 3 นาที คำที่เคยผิดจะกลับมาบ่อยขึ้น','Homework: a 3-minute daily review');});
 // 13 · dashboard overview
 await scene(13,async()=>{await p.goto(BASE+'/teacher/');await wait(500);await p.locator('.class-tile').first().click();await wait(500);
  await caption('แดชบอร์ด: ใครเล่นถึงไหน · XP · % ตอบถูกครั้งแรก · คนที่ต้องช่วยขึ้นก่อน','Dashboard: progress, XP, first-try % · who needs help first');});
 // 14 · words the class missed
 await scene(14,async()=>{await p.click('[data-tab=words]');await wait(300);await caption('คำที่ทั้งห้องพลาดบ่อย 10 อันดับ · ใช้ทบทวนต้นคาบหน้า','Top 10 words the class missed');});
 // 15 · pre / post test
 await scene(15,async()=>{await p.click('[data-tab=tests]');await wait(300);await caption('แบบทดสอบก่อน/หลังเรียน · วัดผลการเรียนรู้','Pre-test and post-test results');});
 // 16 · export, print, detail, PIN
 await scene(16,async()=>{await p.click('[data-tab=overview]');await wait(300);await caption('ส่งออก CSV · พิมพ์รายงาน · ดูรายคน · ตั้ง PIN ใหม่','Export CSV · print · each student · reset a PIN');});
 // 17 · closing card
 await scene(17,async()=>{await p.goto(BASE+'/schools/');await wait(300);
  await titleCard('พร้อมใช้ในห้องเรียน','SANOR QUEST · English Adventures',['เล่นได้แม้ไม่มีอินเทอร์เน็ต · ติดตั้งลงมือถือได้','คู่มือครูหนึ่งหน้า และแบบฟอร์มยินยอมผู้ปกครอง อยู่ท้ายหน้าแผนที่']);});

 const v=p.video();await ctx.close();await b.close();
 const raw=path.join(OUT,'raw.webm');fs.renameSync(await v.path(),raw);
 fs.writeFileSync(path.join(OUT,'scenes.json'),JSON.stringify(scenes,null,1));
 // ---- ffmpeg: each scene trimmed/stretched to its narration time, then the narration added ----
 const parts=scenes.map((s,k)=>{const len=s.end-s.start,want=dur(s.i),f=want/len;
  return`[0:v]trim=start=${s.start.toFixed(3)}:end=${s.end.toFixed(3)},setpts=(PTS-STARTPTS)*${f.toFixed(5)},fps=30[v${k}]`;});
 const filter=parts.join(';')+';'+scenes.map((_,k)=>`[v${k}]`).join('')+`concat=n=${scenes.length}:v=1:a=0[v]`;
 const mp4=path.join(OUT,'sanor-quest-teacher-guide.mp4');
 execFileSync('ffmpeg',['-y','-loglevel','error','-i',raw,'-i',path.join(ROOT,T.audio),'-filter_complex',filter,'-map','[v]','-map','1:a',
  '-c:v','libx264','-preset','slow','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart','-c:a','aac','-b:a','160k','-shortest',mp4],{stdio:'inherit'});
 console.log('scenes:',scenes.map(s=>s.i+': '+(s.end-s.start).toFixed(1)+'s for '+dur(s.i).toFixed(1)+'s').join(' · '));
 console.log('video:',mp4);})().catch(e=>{console.error(e);process.exit(1);});
