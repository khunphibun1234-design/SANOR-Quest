const {test,expect}=require('./fixtures');const {watch,MISSION_TIMEOUT}=require('./helpers');const {playMission}=require('./story-helper');
// Map 01, mission 1: from the front gate to the printed welcome card.
test('Map 01 mission 1: Welcome to My Home! can be played to the end',async({page})=>{
  test.setTimeout(MISSION_TIMEOUT);const errors=watch(page);
  await page.goto('/home/?quality=low&speed=4');await page.evaluate(()=>localStorage.clear());await page.reload();
  await expect(page.locator('.mission-option')).toHaveCount(3);
  await expect(page.locator('.mission-option').nth(1)).toBeDisabled();             // Lunch with Alex is locked at first
  await page.fill('#playerName','Ploy');await page.click('#startBtn');
  await playMission(page,{card:{welcome:'Welcome to my home, Alex.',room:'This is my living room.',activity:'We cook in the kitchen.'}});
  await expect(page.locator('#reportContent')).toContainText('300 XP');
  await expect(page.locator('#reportContent')).toContainText("Ploy's home story");
  await expect(page.locator('#reportContent')).toContainText('Passport stamp');
  await expect(page.locator('#nextMission')).toContainText('Lunch with Alex');
  expect(await page.evaluate(()=>[SanorProfile.activity('01','welcome'),SanorProfile.stamps('01').map(s=>s.id)]))
    .toEqual([expect.objectContaining({xp:300,done:true}),['home-welcome','home-family','home-tour','home-listen','home-offer','home-card']]);
  expect(errors).toEqual([]);});
