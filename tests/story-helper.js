// Plays one story mission the way a student would: "Take me there", answer each question, then the finale.
const {expect}=require('@playwright/test');
exports.playMission=async(page,{card})=>{
  const visible=sel=>page.locator(sel).isVisible();
  for(let step=0;step<40;step++){
    if(await visible('#reportOverlay'))return;
    if(await visible('#bookOverlay')){await page.click('#enterStory');continue;}
    if(await visible('#dialogOverlay')){
      if(await page.locator('#finishMission').count()){
        for(const [id,v] of Object.entries(card))await page.fill('#card-'+id,v);
        await page.check('input[name="mood"][value="ready"]');await page.check('input[name="next"][value="speaking"]');
        await page.click('#finishMission');continue;}
      const area=page.locator('#answerArea');
      if(await area.locator('.token-bank').count()){
        const bank=await area.locator('.token-bank .token').allTextContents();
        const tokens=await page.evaluate(b=>{const W=Object.values(SQContent.worlds);for(const w of W)for(const m of w.missions)for(const q of Object.values(m.questions||{}))if(q.tokens&&[...q.tokens].sort().join('|')===[...b].sort().join('|'))return q.tokens;},bank);
        for(const t of tokens)await area.locator('.token-bank').getByRole('button',{name:t,exact:true}).first().click();
        await area.locator('.sq-check').click();}
      else for(const b of await area.locator('.choice').all()){if(await page.locator('#nextQuestion').isVisible())break;if(await b.isEnabled())await b.click();}
      await expect(page.locator('#nextQuestion')).toBeVisible();await page.click('#nextQuestion');continue;}
    await page.click('#guideBtn');
    await expect.poll(async()=>await visible('#dialogOverlay')||await visible('#reportOverlay'),{timeout:60_000}).toBe(true);}
  throw new Error('mission did not finish');};
