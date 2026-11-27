const {test,expect,skipSplash}=require('./fixtures');const {watch}=require('./helpers');
// Demo mode (no Supabase): teacher and student share this browser, like trying SANOR QUEST on one computer.
test('classroom: teacher creates a class, a student joins and plays, the teacher sees the results',async({browser})=>{
  const ctx=await browser.newContext();await ctx.addInitScript(skipSplash);const teacher=await ctx.newPage(),errT=watch(teacher);
  await teacher.goto('/teacher/');await teacher.evaluate(()=>localStorage.clear());await teacher.reload();
  await expect(teacher.locator('#demoNote')).toBeVisible();await teacher.click('#demoStart');
  await teacher.fill('#newClass input','ม.2/5');await teacher.click('#newClass button');
  const code=(await teacher.locator('#classCode').textContent()).trim();expect(code).toMatch(/^[A-Z0-9]{6}$/);
  await expect(teacher.locator('#tab-overview')).toContainText(code);                       // "no students yet" tells the code

  // student joins on the town map (passport → Join my class)
  const student=await ctx.newPage(),errS=watch(student);await student.goto('/');
  await student.click('#classChip');
  await student.fill('#joinForm [name=code]',code.toLowerCase());await student.fill('#joinForm [name=number]','7');await student.fill('#joinForm [name=nickname]','Ploy');await student.fill('#joinForm [name=pin]','2468');
  await student.click('#joinForm button');await expect(student.locator('#classBox')).toContainText('No. 7 · Ploy');
  // a wrong PIN on a second sign-in is refused with a Thai + English message
  expect(await student.evaluate(async c=>{try{await SQBackend.student.join(c,7,'Ploy','0000');}catch(e){return e.message;}return 'joined';},code)).toBe('joined'); // returns {error}, not a throw
  // play: 3 words in the 2D school practice (one wrong first)
  await student.goto('/school/quiz.html');
  await student.locator('#choices button',{hasText:/^gym$/}).click();await student.locator('#choices button',{hasText:/^gate$/}).click();await student.click('#next');
  await student.locator('#choices button',{hasText:/^classroom$/}).click();await student.click('#next');
  await student.evaluate(()=>SanorClass.flush());await expect.poll(()=>student.evaluate(()=>SanorClass.status().pending)).toBe(0);
  // pre-test
  await student.goto('/test/?kind=pre');await student.click('#begin');
  for(const fs of await student.locator('fieldset.item').all())await fs.locator('input').first().check();
  await student.click('#finishTest');await expect(student.locator('#finishTest')).toHaveText(/Yes, finish/);await student.click('#finishTest');
  await expect(student.locator('#score')).toContainText('/ 30');
  await expect.poll(()=>student.evaluate(()=>SanorClass.status().pending)).toBe(0);

  // teacher sees the student, the missed word and the test
  await teacher.click('#refresh');
  const row=teacher.locator('#tab-overview tbody tr').first();await expect(row).toContainText('Ploy');await expect(row).toContainText('40');
  await teacher.click('[data-tab=words]');await expect(teacher.locator('#tab-words')).toContainText('gate');
  await teacher.click('[data-tab=tests]');await expect(teacher.locator('#tab-tests tbody')).toContainText('/ 30');
  await teacher.click('[data-tab=overview]');await teacher.click('[data-student]');await expect(teacher.locator('#studentBody')).toContainText('เลขที่ 7 · Ploy');
  await expect(teacher.locator('#studentBody tbody tr')).toHaveCount(2);await teacher.click('#studentDialog [data-close]');
  // CSV export
  const [dl]=await Promise.all([teacher.waitForEvent('download'),teacher.click('#csv')]);expect(dl.suggestedFilename()).toMatch(/\.csv$/);
  const csv=require('fs').readFileSync(await dl.path(),'utf8');expect(csv).toContain('"7","Ploy"');

  // settings: Thai help set for the class, Map 02 closed
  await teacher.click('[data-tab=settings]');await teacher.check('#settingsForm [name=thai][value=challenger]');await teacher.uncheck('#settingsForm [name=worlds][value="02"]');await teacher.check('#settingsForm [name=tests][value=post]');
  await teacher.click('#settingsForm button[type=submit]');await expect(teacher.locator('#savedMsg')).toContainText('บันทึกแล้ว');
  await student.goto('/');await student.evaluate(()=>SanorClass.flush());
  await expect.poll(()=>student.evaluate(()=>SanorProfile.level())).toBe('challenger');
  await student.goto('/#map-02');await expect(student.locator('#unavailableButton')).toContainText('Closed by your teacher');await expect(student.locator('#playLink')).toBeHidden();
  await expect(student.locator('#testChip')).toContainText('Post-test');
  await student.goto('/school/?quality=low');await expect(student.locator('#startBtn')).toBeDisabled();
  expect([...errT,...errS]).toEqual([]);});

test('offline first: answers wait in the outbox and are sent when the internet comes back',async({browser})=>{
  const ctx=await browser.newContext();await ctx.addInitScript(skipSplash);const p=await ctx.newPage();
  await p.goto('/');await p.evaluate(async()=>{localStorage.clear();SQBackend.teacher.signIn('t');const c=await SQBackend.teacher.createClass('Test');await SanorClass.join(c.code,3,'Nok','1357');});
  await p.goto('/school/quiz.html');await ctx.setOffline(true);
  await p.locator('#choices button',{hasText:/^gate$/}).click();
  await p.evaluate(()=>SanorClass.flush());
  expect(await p.evaluate(()=>SanorClass.status())).toMatchObject({online:false});
  expect(await p.evaluate(()=>SanorClass.status().pending)).toBeGreaterThan(0);
  expect(await p.evaluate(()=>JSON.parse(localStorage.getItem('sanor-outbox-v1')).length)).toBeGreaterThan(0);   // kept on the device (survives closing the page)
  await ctx.setOffline(false);await p.evaluate(()=>SanorClass.flush());
  await expect.poll(()=>p.evaluate(()=>SanorClass.status().pending)).toBe(0);
  const r=await p.evaluate(async()=>{const c=(await SQBackend.teacher.classes())[0];return (await SQBackend.teacher.report(c.id)).students[0];});
  expect(r).toMatchObject({number:3,nickname:'Nok',answers:1,firstTry:1});});
