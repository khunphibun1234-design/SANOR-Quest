const {test,expect,skipSplash}=require('./fixtures');const {watch}=require('./helpers');
// PWA: after one visit with internet, the game opens and plays without it.
test('offline: the town map, both 3D worlds and the practice pages open without internet',async({browser})=>{
  test.setTimeout(120_000);const ctx=await browser.newContext();await ctx.addInitScript(skipSplash);const page=await ctx.newPage();
  await page.goto('/');
  await page.evaluate(async()=>{const reg=await navigator.serviceWorker.ready;return reg.active.state;});
  await expect.poll(()=>page.evaluate(async()=>(await caches.keys()).some(k=>k.startsWith('sq-shell-'))),{timeout:30_000}).toBe(true);
  await expect.poll(()=>page.evaluate(async()=>{const k=(await caches.keys()).find(k=>k.startsWith('sq-shell-'));return (await (await caches.open(k)).keys()).length;}),{timeout:30_000}).toBeGreaterThan(40);
  // opening Map 02 saves its recordings for offline play
  await page.goto('/school/quiz.html');await expect.poll(()=>page.evaluate(async()=>(await (await caches.open('sq-audio-v1')).keys()).length),{timeout:30_000}).toBeGreaterThan(5);
  await ctx.setOffline(true);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [url,check] of [['/','#townMap svg'],['/school/?quality=low','#missionPicker .mission-option'],['/home/?quality=low','#missionPicker .mission-option'],['/review/','#go'],['/test/?kind=pre','#title'],['/teacher/','#demoStart']]){
    await page.goto(url);await expect(page.locator(check).first()).toBeVisible();}
  await page.goto('/school/quiz.html');await page.locator('#choices button',{hasText:/^gate$/}).click();await expect(page.locator('#message')).toContainText('Correct');
  expect(await page.evaluate(async()=>{const r=await fetch('../audio/line-20.mp3');return r.ok;})).toBe(true);    // a Map 02 recording plays offline
  expect(errors).toEqual([]);await ctx.close();});
