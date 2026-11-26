const {test,expect}=require('./fixtures');
// Everything can be done with a keyboard (Tab / Shift+Tab / Enter / Space / arrows / Escape), no mouse.
async function tabTo(page,selector,max=60){for(let i=0;i<max;i++){if(await page.evaluate(s=>document.activeElement?.matches(s),selector))return;await page.keyboard.press('Tab');}throw new Error('could not reach '+selector+' with Tab');}
test('keyboard only: start a 3D mission, walk there, answer and close the dialog',async({page})=>{test.setTimeout(300_000);
  await page.goto('/school/?quality=low&speed=4');await page.evaluate(()=>localStorage.clear());await page.reload();
  await tabTo(page,'#startBtn');await page.keyboard.press('Enter');
  await tabTo(page,'#guideBtn');await page.keyboard.press('Enter');                       // "Take me there"
  await expect(page.locator('#dialogOverlay')).toBeVisible({timeout:60_000});
  for(let i=0;i<3&&!(await page.locator('#nextQuestion').isVisible());i++){await tabTo(page,'#answerArea .choice:not([disabled])');await page.keyboard.press('Enter');}
  await expect(page.locator('#nextQuestion')).toBeVisible();await tabTo(page,'#nextQuestion');await page.keyboard.press('Enter');
  await expect(page.locator('#dialogOverlay')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#dialogOverlay')).toBeHidden();
  // walking with the arrow keys moves the player
  const before=await page.evaluate(()=>storyStatus().position);await page.keyboard.down('ArrowUp');await page.waitForTimeout(1500);await page.keyboard.up('ArrowUp');
  expect(await page.evaluate(b=>{const p=storyStatus().position;return Math.hypot(p.x-b.x,p.z-b.z);},before)).toBeGreaterThan(.2);});
test('keyboard only: join a class form and the passport dialog',async({page})=>{
  await page.goto('/');await tabTo(page,'#classChip');await page.keyboard.press('Enter');await expect(page.locator('#passportDialog')).toBeVisible();
  await tabTo(page,'#joinForm [name=code]');await page.keyboard.press('Escape');await expect(page.locator('#passportDialog')).toBeHidden();});
test('reduce motion: follows the device setting and the passport switch',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-motion','reduce');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();await expect(page.locator('html')).toHaveAttribute('data-motion','full');
  await page.click('#passportBtn');await page.check('#reduceMotion');await expect(page.locator('html')).toHaveAttribute('data-motion','reduce');
  await page.goto('/school/quiz.html');await expect(page.locator('html')).toHaveAttribute('data-motion','reduce');});
