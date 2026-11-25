const {test,expect}=require('@playwright/test');const {watch}=require('./helpers');const {playMission}=require('./story-helper');
const done=(world,ids)=>{localStorage.clear();for(const id of ids)SanorProfile.record(world,id,{xp:300,done:true});};
test('Map 01 mission 3: An Afternoon in the Garden',async({page})=>{test.setTimeout(480_000);const errors=watch(page);
  await page.goto('/home/?quality=low&speed=4');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('sanor-home-welcome-v1',JSON.stringify({version:1,studiedTable:true,name:'Ploy',done:true}));SanorProfile.record('01','table',{xp:300,done:true});});
  await page.goto('/home/?quality=low&speed=4&mission=garden');
  await expect(page.locator('#missionTitle')).toHaveText('An Afternoon in the Garden');
  await page.click('#startBtn');
  await playMission(page,{card:{thanks:'Thank you for visiting my home.',together:'We played chess together.',again:'Please come again soon.'}});
  await expect(page.locator('#reportContent')).toContainText('300 XP');
  expect(await page.evaluate(()=>[SanorProfile.activity('01','garden').done,SanorProfile.stamps('01').some(s=>s.id==='home-garden-done')])).toEqual([true,true]);
  expect(errors).toEqual([]);});
for(const [id,card,next] of [
  ['timetable',{time:'English is at half past nine.',favourite:'My favourite lesson is music.'},'Show Your Friend Around'],
  ['tour',{place:'This is our library.',like:'I like the music club.',invite:"Let's go to the canteen."},'Join the Music Club'],
  ['club',{event:'The Music Club Concert',when:'It is on Friday at the stage.',invite:'Please come and listen to Alex!'},null]]){
  test(`Map 02 3D mission: ${id}`,async({page})=>{test.setTimeout(480_000);const errors=watch(page);
    await page.goto('/school/?quality=low&speed=4');const before={timetable:[],tour:['timetable'],club:['timetable','tour']}[id];
    await page.evaluate(([b])=>{localStorage.clear();for(const x of b)SanorProfile.record('02',x,{xp:300,done:true});},[before]);
    await page.goto('/school/?quality=low&speed=4&mission='+id);
    await page.fill('#playerName','Ploy');await page.click('#startBtn');
    await playMission(page,{card});
    await expect(page.locator('#reportContent')).toContainText('Passport stamp');
    if(next)await expect(page.locator('#nextMission')).toContainText(next);else await expect(page.locator('#nextMission')).toBeHidden();
    const r=await page.evaluate(i=>[SanorProfile.activity('02',i),SanorProfile.stamps('02').some(s=>s.id==='school-'+i+'-done')],id);
    expect(r[0]).toMatchObject({done:true});expect(r[1]).toBe(true);
    expect(errors).toEqual([]);});}
