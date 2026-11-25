// Records the 3-minute teacher how-to video (screen walkthrough with Thai captions) using the game in demo mode.
// Run with a local server on :8080:  python3 -m http.server 8080 & node scripts/record-guide-video.js out-dir
// The narration to read over it is in docs/video-script.md (the captions follow the same scenes).
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const OUT=process.argv[2]||'video-out',BASE=process.env.BASE||'http://localhost:8080';
(async()=>{fs.mkdirSync(OUT,{recursive:true});
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const ctx=await b.newContext({viewport:{width:1280,height:720},recordVideo:{dir:OUT,size:{width:1280,height:720}}});const p=await ctx.newPage();
 const wait=ms=>p.waitForTimeout(ms);
 async function cap(th,en='',ms=4000){await p.evaluate(([th,en])=>{let d=document.getElementById('__cap');if(!d){d=document.createElement('div');d.id='__cap';d.id='__cap';d.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:99999;max-width:88%;padding:12px 20px;border-radius:14px;background:rgba(20,40,34,.88);color:#fff;font:600 22px/1.45 "Noto Sans Thai",sans-serif;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.25);pointer-events:none';}(document.querySelector('dialog[open]')||document.body).append(d);d.innerHTML=th+(en?'<div style="font:500 15px/1.4 Outfit,sans-serif;opacity:.8;margin-top:2px">'+en+'</div>':'');},[th,en]);await wait(ms*1.3);}   // ×1.3: time to read Thai and English
 async function title(th,en,ms=6000){await p.evaluate(([th,en])=>{const d=document.createElement('div');d.id='__title';d.style.cssText='position:fixed;inset:0;z-index:99998;display:grid;place-items:center;background:#f6f5ed;text-align:center;font:800 52px/1.3 Outfit,"Noto Sans Thai",sans-serif;color:#25483e';d.innerHTML='<div>'+th+'<div style="font:500 24px/1.5 Outfit,sans-serif;color:#55695f;margin-top:10px">'+en+'</div></div>';document.body.append(d);},[th,en]);await wait(ms);await p.evaluate(()=>document.getElementById('__title')?.remove());}
 const slowType=async(sel,text)=>{await p.click(sel);await p.keyboard.type(text,{delay:90});};
 // 0:00 intro
 await p.goto(BASE+'/');await p.evaluate(()=>localStorage.clear());await p.reload();await wait(800);
 await title('SANOR QUEST · คู่มือครู 3 นาที','เกมฝึกภาษาอังกฤษ ม.2 · ระบบห้องเรียนสำหรับครู',6000);
 await cap('หน้าแผนที่เมือง: นักเรียนเลือกโลกที่จะผจญภัย','The town map: students choose a world',5000);
 await p.mouse.wheel(0,380);await cap('แต่ละโลกมี 3 ภารกิจ และตัวช่วยภาษาไทย 3 ระดับ','Each world has 3 missions and 3 levels of Thai help',5000);
 // 0:16 teacher creates a class
 await p.goto(BASE+'/teacher/');await wait(600);await cap('ครู: เปิด /teacher/ แล้วเข้าสู่ระบบ (วิดีโอนี้ใช้โหมดทดลอง)','Teacher: open /teacher/ and sign in (demo mode here)',5000);
 await p.click('#demoStart');await wait(700);await slowType('#newClass input','ม.2/5');await cap('สร้างห้องเรียน ตั้งชื่อห้อง แล้วกด + สร้างห้อง','Create a class',3500);await p.click('#newClass button');await wait(800);
 const code=(await p.locator('#classCode').textContent()).trim();
 await cap('ได้รหัสห้อง 6 ตัว ให้นักเรียนใช้เข้าห้อง: '+code,'You get a 6-character class code',6000);
 await p.click('[data-tab=settings]');await wait(500);await cap('ตั้งค่าห้อง: เลือกโลกที่เปิด ระดับตัวช่วยภาษาไทย และแบบทดสอบ','Settings: worlds, Thai help level, tests',6500);
 // 0:50 student joins
 await p.goto(BASE+'/');await wait(800);await cap('นักเรียน: กด 🏫 Join my class บนหน้าแผนที่','Student: tap Join my class',4000);await p.click('#classChip');await wait(600);
 await slowType('#joinForm [name=code]',code);await slowType('#joinForm [name=number]','7');await p.fill('#joinForm [name=nickname]','');await slowType('#joinForm [name=nickname]','Ploy');await slowType('#joinForm [name=pin]','2468');
 await cap('ใส่รหัสห้อง เลขที่ ชื่อเล่น และตั้ง PIN 4 หลัก (ไม่ต้องใช้อีเมล)','Class code, number, nickname and a 4-digit PIN. No email needed.',4500);
 await p.click('#joinForm button');await wait(1200);await cap('เข้าห้องแล้ว ผลการเล่นจะส่งให้ครูอัตโนมัติ แม้ไม่มีเน็ตก็เล่นได้','Joined. Results go to the teacher automatically, even after playing offline.',5500);
 await p.keyboard.press('Escape');
 // 1:20 play in 3D
 await p.goto(BASE+'/school/?quality=low&speed=4');await wait(2500);await cap('Map 02 โรงเรียน 3D: เลือกภารกิจแล้วเริ่มเล่น','Map 02: a 3D school with 3 missions',4500);
 await p.click('#startBtn');await wait(1500);await cap('กด “Take me there” ตัวละครจะเดินไปเอง หรือใช้ปุ่มลูกศร','Tap “Take me there” or walk with the arrows',3000);
 await p.click('#guideBtn');for(let i=0;i<60;i++){if(await p.locator('#dialogOverlay').isVisible())break;await wait(500);}
 await cap('ฟัง Alex แล้วเลือกคำตอบ มีคำแปลไทยช่วยตามระดับ','Listen to Alex and choose. Thai help follows the level.',5500);
 for(const c of await p.locator('#answerArea .choice').all()){if(await p.locator('#nextQuestion').isVisible())break;if(await c.isEnabled()){await c.click();await wait(1200);}}
 await cap('ตอบถูกครั้งแรก = โลกเปลี่ยน: มีเพื่อนมาดูคอนเสิร์ตเพิ่ม','A first-try answer changes the world',5000);await p.click('#nextQuestion');await wait(1500);
 // 2:00 daily review
 await p.goto(BASE+'/review/');await wait(700);await cap('ทบทวนประจำวัน 3 นาที: คำที่เคยผิดจะกลับมาบ่อยขึ้น','Daily review: hard words come back more often',5500);
 // 2:10 teacher dashboard
 await p.goto(BASE+'/teacher/');await wait(800);await p.locator('.class-tile').first().click();await wait(900);
 await cap('แดชบอร์ด: ใครเล่นถึงไหน XP และ % ตอบถูกครั้งแรก','Dashboard: progress, XP and first-try accuracy',6000);
 await p.click('[data-tab=words]');await wait(500);await cap('คำที่ทั้งห้องพลาดบ่อย 10 อันดับ ใช้ทบทวนในคาบถัดไป','Top 10 words the class missed',5500);
 await p.click('[data-tab=tests]');await wait(500);await cap('แบบทดสอบก่อน/หลังเรียน เพื่อวัดผลการเรียนรู้','Pre-test and post-test results',5000);
 await p.click('[data-tab=overview]');await wait(400);await cap('ส่งออก CSV · พิมพ์รายงาน · ดูรายคน · ตั้ง PIN ใหม่','Export CSV, print, view each student, reset a PIN',6000);
 // 2:45 close
 await p.goto(BASE+'/');await wait(600);await title('พร้อมใช้ในห้องเรียน','เล่นออฟไลน์ได้ · ติดตั้งลงมือถือได้ · คู่มือครูและแบบฟอร์มยินยอมอยู่ท้ายหน้าแผนที่',9000);
 const v=p.video();await ctx.close();await b.close();const src=await v.path();const dst=path.join(OUT,'sanor-quest-teacher-guide.webm');fs.renameSync(src,dst);console.log('video:',dst);})();
