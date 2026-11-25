const {test,expect}=require('@playwright/test');const {watch}=require('./helpers');
const answers=['gate','classroom','timetable','library','librarian','canteen','gym','music','club','stage'];
test('School Buddy: a full round gives 10 stamps and 300 XP',async({page})=>{const errors=watch(page);
  await page.goto('/school/');await page.evaluate(()=>localStorage.clear());await page.reload();
  for(const [i,word] of answers.entries()){
    await expect(page.locator('#count')).toHaveText(`Mission ${i+1} / 10`);
    await page.locator('#choices button',{hasText:new RegExp('^'+word+'$')}).click();
    await expect(page.locator('#message')).toContainText('Correct!');
    await page.click('#next');}
  await expect(page.locator('#report')).toBeVisible();
  await expect(page.locator('#score')).toHaveText('Correct on the first try 10 / 10 words');
  expect(await page.evaluate(()=>[SanorProfile.mapXp('02'),SanorProfile.stamps('02').length,SanorProfile.activity('02','buddy').done])).toEqual([300,10,true]);
  await expect(page.locator('#totalXp')).toHaveText('300');
  expect(errors).toEqual([]);});
