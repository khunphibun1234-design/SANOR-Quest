const {test,expect}=require('@playwright/test');const {watch}=require('./helpers');
test('pilot: active time, steps and feedback reach the pilot tab, with pre/post statistics',async({browser})=>{test.setTimeout(90_000);
  const ctx=await browser.newContext();const t=await ctx.newPage(),errT=watch(t);
  await t.goto('/teacher/');await t.evaluate(()=>localStorage.clear());await t.reload();await t.click('#demoStart');
  await t.fill('#newClass input','ม.2/5');await t.click('#newClass button');const code=(await t.locator('#classCode').textContent()).trim();
  // three students; the third plays on this page so time, steps and feedback come from the real game
  await t.evaluate(async c=>{for(const [n,pre,post] of [[1,8,14],[2,10,13]]){const j=await SQBackend.student.join(c,n,'S'+n,'1111');
    await SQBackend.student.submit(j.token,[{kind:'test',test:'pre',score:pre,total:20},{kind:'test',test:'post',score:post,total:20},{id:'st-'+n+'-000001',kind:'step',world:'02',activity:'buddy',item:'gate',action:'open'}]);}},code);
  const s=await ctx.newPage(),errS=watch(s);await s.goto('/');
  await s.evaluate(async c=>{await SanorClass.join(c,3,'Ploy','2468');},code);
  await s.goto('/school/quiz.html');
  for(let i=0;i<7;i++){await s.mouse.move(100+i*10,100);await s.keyboard.press('Shift');await s.waitForTimeout(1000);}          // a few seconds of real activity
  await s.evaluate(()=>SanorProfile.track('02','buddy'));                                          // flushes the active seconds
  for(const w of ['gate','classroom','timetable','library','librarian','canteen','gym','music','club','stage']){await s.locator('#choices button',{hasText:new RegExp('^'+w+'$')}).click();await s.click('#next');}
  await s.locator('#speakBox .sq-skip').click();await s.click('.sq-example');await s.click('#finishSchool');
  // the 30-second feedback after the mission
  await expect(s.locator('#feedbackBox .sq-fb')).toBeVisible();
  for(const [k,v] of [['fun',3],['easy',2],['learned',3]])await s.locator(`#feedbackBox input[name=${k}][value="${v}"]`).check({force:true});
  await s.fill('#feedbackBox textarea','สนุกมาก อยากเล่นอีก');await s.click('#feedbackBox button[type=submit]');await expect(s.locator('#feedbackBox')).toContainText('Thanks');
  await s.evaluate(()=>SanorClass.flush());await expect.poll(()=>s.evaluate(()=>SanorClass.status().pending)).toBe(0);

  await t.click('#refresh');await t.click('[data-tab=pilot]');const tab=t.locator('#tab-pilot');
  await expect(tab).toContainText('สัปดาห์ที่ 1');
  await expect(tab.locator('table').first()).toContainText('Ploy');
  await expect(tab).toContainText('School Buddy (2D practice)');                                      // funnel for the mission that was played
  await expect(tab).toContainText('😀 3.0');await expect(tab).toContainText('สนุกมาก อยากเล่นอีก');
  await expect(tab).toContainText('Paired t-test: t(1)');                                          // two students with both tests
  await t.fill('#noteForm textarea','นักเรียนชอบเสียง Alex');await t.click('#noteForm button');await expect(tab).toContainText('นักเรียนชอบเสียง Alex');
  const [dl]=await Promise.all([t.waitForEvent('download'),t.click('#pilotCsv')]);const csv=require('fs').readFileSync(await dl.path(),'utf8');
  expect(csv).toContain('"time"');expect(csv).toContain('"step"');expect(csv).toContain('"answer"');
  expect([...errT,...errS]).toEqual([]);});
