const {test,expect}=require('@playwright/test');const {watch}=require('./helpers');
// Plays Map 01 from the front gate to the printed welcome card, like a student would:
// walk with "Take me there", answer every question, set the lunch table, then write the card.
test('Map 01: the whole story can be played to the end',async({page})=>{
  test.setTimeout(480_000);const errors=watch(page);
  await page.goto('/home/?quality=low');await page.evaluate(()=>localStorage.clear());await page.reload();
  await page.fill('#playerName','Ploy');await page.click('#startBtn');await page.click('#enterStory');
  const visible=sel=>page.locator(sel).isVisible();
  for(let step=0;step<40;step++){
    if(await visible('#reportOverlay'))break;
    if(await visible('#lunchOverlay')){
      const f=page.frameLocator('#lunchFrame');await expect(f.locator('#choices button').first()).toBeVisible();
      const labels=await page.frame({url:/table\.html/}).evaluate(()=>window.AlexTableWords.map(w=>w[2]));
      for(const label of labels){await f.locator('#choices button',{hasText:label}).first().click();await f.locator('#next').click();}
      await f.locator('#pairs button',{hasText:'Bowl and spoon'}).click();
      await f.locator('#again').click();await expect(page.locator('#lunchOverlay')).toBeHidden();continue;}
    if(await visible('#dialogOverlay')){
      if(await page.locator('#finishMission').count()){       // the welcome card
        await page.fill('#card-welcome','Welcome to my home, Alex.');await page.fill('#card-room','This is my living room.');await page.fill('#card-activity','We cook in the kitchen.');
        await page.check('input[name="mood"][value="ready"]');await page.check('input[name="next"][value="speaking"]');
        await page.click('#finishMission');continue;}
      const area=page.locator('#answerArea');
      if(await area.locator('.token-bank').count()){            // put the words in order
        const bank=await area.locator('.token-bank .token').allTextContents();
        const tokens=await page.evaluate(b=>Object.values(HomeContent.questions).find(q=>q.tokens&&[...q.tokens].sort().join('|')===[...b].sort().join('|')).tokens,bank);
        for(const t of tokens)await area.locator('.token-bank').getByRole('button',{name:t,exact:true}).first().click();
        await area.locator('.sq-check').click();}
      else for(const b of await area.locator('.choice').all()){if(await page.locator('#nextQuestion').isVisible())break;if(await b.isEnabled())await b.click();}
      await expect(page.locator('#nextQuestion')).toBeVisible();await page.click('#nextQuestion');continue;}
    await page.click('#guideBtn');                               // walk to the next place
    await expect.poll(async()=>await visible('#dialogOverlay')||await visible('#lunchOverlay')||await visible('#reportOverlay'),{timeout:30_000}).toBe(true);
  }
  await expect(page.locator('#reportOverlay')).toBeVisible();
  await expect(page.locator('#reportContent')).toContainText('300 XP');
  await expect(page.locator('#reportContent')).toContainText("Ploy's home story");
  expect(await page.evaluate(()=>[SanorProfile.activity('01','welcome'),SanorProfile.activity('01','table').xp,SanorProfile.stamps('01').length]))
    .toEqual([expect.objectContaining({xp:300,done:true}),300,16]); // 5 stage stamps + welcome card + 10 table items
  expect(errors).toEqual([]);});
