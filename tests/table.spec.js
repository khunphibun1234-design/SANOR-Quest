const {test,expect}=require('./fixtures');const {watch}=require('./helpers');
test('Alex’s Table 2D: setting the whole table gives 300 XP to Map 01',async({page})=>{const errors=watch(page);
  await page.goto('/home/table.html');await page.evaluate(()=>localStorage.clear());await page.reload();
  const words=await page.evaluate(()=>window.AlexTableWords.map(w=>w[2]));
  for(const label of words){
    await page.locator('#choices button',{hasText:label}).first().click();
    await expect(page.locator('#status')).toContainText('Correct!');
    await page.click('#next');}
  expect(await page.evaluate(()=>[SanorProfile.mapXp('01'),SanorProfile.stamps('01').length])).toEqual([300,10]);
  expect(errors).toEqual([]);});
