const {test,expect}=require('@playwright/test');
test('extra support: two choices instead of three, and the hint appears after a mistake',async({page})=>{
  await page.goto('/school/quiz.html');await page.evaluate(()=>{localStorage.clear();for(let i=0;i<10;i++)SanorProfile.logAnswer(false);});await page.reload();
  await expect(page.locator('#choices button')).toHaveCount(2);
  await page.locator('#choices button',{hasNotText:/^gate$/}).click();
  await expect(page.locator('#clue')).toBeVisible();});
test('advice banner: after many first-try answers the game offers the next level',async({page})=>{
  await page.goto('/school/quiz.html');await page.evaluate(()=>{localStorage.clear();for(let i=0;i<11;i++)SanorProfile.logAnswer(true);});await page.reload();
  await expect(page.locator('#choices button')).toHaveCount(3);
  await page.locator('#choices button',{hasText:/^gate$/}).click();               // 12th first-try answer
  await expect(page.locator('.sq-coach')).toContainText('Explorer');
  await page.locator('.sq-coach button.primary').click();
  expect(await page.evaluate(()=>SanorProfile.level())).toBe('explorer');
  await expect(page.locator('.sq-coach')).toHaveCount(0);});
