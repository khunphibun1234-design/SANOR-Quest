const {test,expect}=require('./fixtures');const {watch}=require('./helpers');
// Taps the right glowing ring in the 3D scene for all 10 requests.
test('Alex’s Table 3D: tapping every item in the scene sets the table',async({page})=>{
  test.setTimeout(180_000);const errors=watch(page);
  await page.goto('/home/table-three.html?quality=low');await page.evaluate(()=>localStorage.clear());await page.reload();
  await page.click('#start');
  const words=await page.evaluate(()=>window.AlexTableWords.map(w=>w[0]));
  for(const [i,word] of words.entries()){
    // wait until the ring for this word is on screen and the camera has stopped moving
    let last=null;
    await expect.poll(async()=>{const t=(await page.evaluate(()=>table3dStatus().targets)).find(t=>t.word===word);
      const still=t&&t.visible&&last&&Math.hypot(t.x-last.x,t.y-last.y)<2;last=t;return !!still;},{timeout:60_000,intervals:[400]}).toBe(true);
    const t=(await page.evaluate(()=>table3dStatus().targets)).find(t=>t.word===word);
    await page.mouse.click(t.x,t.y);
    await expect.poll(()=>page.evaluate(()=>table3dStatus().ok)).toBe(true);
    expect((await page.evaluate(()=>table3dStatus())).rows[i].answers).toEqual([i]);
    await page.click('#next');}
  await expect(page.locator('#report')).toBeVisible();
  await expect(page.locator('#results')).toContainText('10/10');
  expect(await page.evaluate(()=>[SanorProfile.activity('01','table'),SanorSRS.stats().total]))
    .toEqual([expect.objectContaining({xp:300,done:true}),10]);
  expect(errors).toEqual([]);});
