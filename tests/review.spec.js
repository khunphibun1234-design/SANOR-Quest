const {test,expect}=require('@playwright/test');const {watch}=require('./helpers');
test('Daily review: weak words come first, answers update spaced review and XP',async({page})=>{const errors=watch(page);
  await page.goto('/review/');
  await page.evaluate(()=>{localStorage.clear();const D=86400000,now=Date.now();
    localStorage.setItem('sanor-srs-v1',JSON.stringify({version:1,cards:{kitchen:{box:1,seen:2,right:0,due:now-D,last:now-D},garden:{box:4,seen:4,right:4,due:now+7*D,last:now}}}));});
  await page.reload();
  await expect(page.locator('#dueNow')).toHaveText('1');
  await page.click('#go');
  await expect(page.locator('#question')).toContainText('ห้องครัว');           // the due word comes first
  for(let i=0;i<15;i++){
    const target=await page.evaluate(()=>{const q=document.getElementById('question').textContent;return SQContent.words.find(w=>q.includes(w.th)||q.includes(w.example?.en.split(' ')[0]))?.en;});
    const right=page.locator('#choices button',{hasText:new RegExp('^'+target+'$')});
    if(target&&await right.count())await right.first().click();else await page.locator('#choices button').first().click();
    await expect(page.locator('#next')).toBeVisible();await page.click('#next');
    if(await page.locator('#done').isVisible())break;}
  await expect(page.locator('#done')).toBeVisible();
  const r=await page.evaluate(()=>({kitchen:SanorSRS.card('kitchen').box,xp:SanorProfile.mapXp('review'),n:SanorProfile.accuracy().n}));
  expect(r.kitchen).toBe(2);expect(r.xp).toBeGreaterThan(0);expect(r.xp).toBeLessThanOrEqual(50);expect(r.n).toBe(15);
  expect(errors).toEqual([]);});
test('the town map links to the daily review and shows waiting words',async({page})=>{
  await page.goto('/');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('sanor-srs-v1',JSON.stringify({version:1,cards:{fork:{box:1,seen:1,right:0,due:1,last:1}}}));});await page.reload();
  await expect(page.locator('#dueCount')).toHaveText('1 word waiting');
  await page.click('#dailyReview');await expect(page).toHaveURL(/review\/$/);});
