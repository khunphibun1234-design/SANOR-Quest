// The pre/post test page: 30 questions, missing answers are pointed out, and finishing works without browser
// dialogs (confirm() is blocked in some in-app browsers and embedded previews, which made "Finish the test" do nothing).
const {test,expect}=require('./fixtures');const {watch}=require('./helpers');
test.use({pretestDone:false});
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
test('everyone takes the pre-test first: the town map and the worlds send you there, and answers are saved',async({page})=>{test.setTimeout(180_000);const errors=watch(page);   // opens a 3D world twice: slow on CI runners
  await page.goto('/');await expect(page).toHaveURL(/\/test\/\?kind=pre&first=1$/);await expect(page.locator('#firstNote')).toBeVisible();
  await page.goto('/phibun/?quality=low');await expect(page.locator('#startBtn')).toContainText('Take the pre-test first');
  await page.click('#startBtn');await expect(page).toHaveURL(/\/test\/\?kind=pre&first=1$/);
  await page.click('#begin');const items=await page.locator('fieldset.item').all();for(const fs of items.slice(0,10))await fs.locator('input').nth(1).check();
  await page.reload();await expect(page.locator('#draftNote')).toContainText('10 / 30');await expect(page.locator('#begin')).toHaveText('Continue the test →');
  await page.click('#begin');await expect(page.locator('fieldset.item input:checked')).toHaveCount(10);   // nothing lost
  for(const fs of (await page.locator('fieldset.item').all()).slice(10))await fs.locator('input').first().check();
  await page.click('#finishTest');await page.click('#finishTest');await expect(page.locator('#backLink')).toHaveText('Start your adventure →');
  expect(await page.evaluate(()=>localStorage.getItem('sanor-test-draft-v1'))).toBeNull();
  await page.click('#backLink');await expect(page.locator('#townMap')).toBeVisible();
  await page.goto('/phibun/?quality=low');await expect(page.locator('#startBtn')).not.toContainText('pre-test');
  expect(errors).toEqual([]);});
test('the post-test opens only after the pre-test and all six worlds (or when the teacher opens it)',async({page})=>{
  await page.goto('/test/?kind=post');await expect(page.locator('#closed')).toContainText('Do the pre-test first');
  await page.evaluate(()=>SanorProfile.recordTest('pre',{score:12,total:30}));await page.reload();
  await expect(page.locator('#closed')).toContainText('finish every mission in all six worlds');
  await page.evaluate(()=>{for(const [id,w] of Object.entries(SQContent.worlds))for(const m of w.missionOrder)SanorProfile.record(id,m,{xp:300,done:true});});
  await page.reload();await expect(page.locator('#intro')).toBeVisible();await expect(page.locator('#closed')).toBeHidden();
  await page.click('#begin');const post=await page.locator('fieldset.item legend').allTextContents();      // form B: different questions
  const pre=await page.evaluate(()=>SQContent.tests.forms.pre.parts.flatMap(p=>p.items).map(i=>i.prompt.en));
  expect(post).toHaveLength(30);expect(post.filter(t=>pre.some(q=>t.endsWith(q)))).toEqual([]);});
test('a student with an old Map 01 save keeps it when the pre-test comes first',async({page})=>{
  await page.goto('/test/?kind=pre');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('sanor-home-welcome-v1',JSON.stringify({version:1,name:'Ploy',completed:['greet','name','introduce'],done:false}));});
  await page.reload();await page.evaluate(()=>SanorProfile.recordTest('pre',{score:10,total:30}));
  expect(await page.evaluate(()=>[SanorProfile.name(),SanorProfile.mapXp('01'),SanorProfile.test('pre').score])).toEqual(['Ploy',60,10]);});
