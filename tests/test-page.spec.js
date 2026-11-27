// The pre/post test page: 30 questions, missing answers are pointed out, and finishing works without browser
// dialogs (confirm() is blocked in some in-app browsers and embedded previews, which made "Finish the test" do nothing).
const {test,expect}=require('./fixtures');const {watch}=require('./helpers');
test('the pre-test has 30 questions; unanswered ones are listed; finishing takes two taps on the page',async({page})=>{const errors=watch(page);
  let dialogs=0;page.on('dialog',d=>{dialogs++;d.dismiss();});
  await page.goto('/test/?kind=pre');await page.evaluate(()=>localStorage.clear());await page.reload();
  await expect(page.locator('#count')).toHaveText('30');await page.click('#begin');
  const items=page.locator('fieldset.item');await expect(items).toHaveCount(30);
  for(const fs of (await items.all()).slice(0,27))await fs.locator('input').first().check();
  await page.click('#finishTest');
  await expect(page.locator('#submitMsg')).toContainText('Not answered yet: 28, 29, 30');await expect(page.locator('fieldset.item.missing')).toHaveCount(3);
  for(const fs of (await items.all()).slice(27))await fs.locator('input').first().check();
  await expect(page.locator('fieldset.item.missing')).toHaveCount(0);
  await page.click('#finishTest');await expect(page.locator('#finishTest')).toHaveText(/Yes, finish/);await expect(page.locator('#result')).toBeHidden();
  await page.click('#keepChecking');await expect(page.locator('#finishTest')).toHaveText('Finish the test');      // changed their mind
  await page.click('#finishTest');await page.click('#finishTest');
  await expect(page.locator('#score')).toHaveText(/^\d+ \/ 30$/);
  expect(await page.evaluate(()=>SanorProfile.test('pre').total)).toBe(30);
  expect(dialogs).toBe(0);expect(errors).toEqual([]);});
