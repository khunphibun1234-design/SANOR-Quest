const {test,expect}=require('@playwright/test');const {watch}=require('./helpers');
const answers=['gate','classroom','timetable','library','librarian','canteen','gym','music','club','stage'];
test('School Buddy: a full round gives 10 stamps and 300 XP',async({page})=>{const errors=watch(page);
  await page.goto('/school/quiz.html');await page.evaluate(()=>localStorage.clear());await page.reload();
  for(const [i,word] of answers.entries()){
    await expect(page.locator('#count')).toHaveText(`Mission ${i+1} / 10`);
    await page.locator('#choices button',{hasText:new RegExp('^'+word+'$')}).click();
    await expect(page.locator('#message')).toContainText('Correct!');
    await page.click('#next');}
  // finale: speaking task (skipped here; tests/voice.spec.js covers speaking) and the school card
  await expect(page.locator('#finale')).toBeVisible();
  await page.locator('#speakBox .sq-skip').click();
  await page.click('#finishSchool');
  await expect(page.locator('#finaleMsg')).toContainText('orange border');
  await page.fill('#school-place','This is our library.');await page.fill('#school-like','I like the music club.');await page.fill('#school-invite','Let\'s go to the canteen.');
  await page.click('#finishSchool');
  await expect(page.locator('#report')).toBeVisible();
  await expect(page.locator('#cardOut')).toContainText('I like the music club.');
  await expect(page.locator('#speechOut')).toContainText('skipped');
  await expect(page.locator('#crowd')).toHaveText('🧑‍🎓'.repeat(10));
  expect(await page.evaluate(()=>[SanorProfile.speech('02')[0].best,SanorProfile.accuracy().n])).toEqual(['skip',10]);
  await expect(page.locator('#score')).toHaveText('Correct on the first try 10 / 10 words');
  expect(await page.evaluate(()=>[SanorProfile.mapXp('02'),SanorProfile.stamps('02').length,SanorProfile.activity('02','buddy').done])).toEqual([300,10,true]);
  await expect(page.locator('#totalXp')).toHaveText('300');
  expect(errors).toEqual([]);});
