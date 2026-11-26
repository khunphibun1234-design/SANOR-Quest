const {test,expect}=require('./fixtures');const {watch,MISSION_TIMEOUT}=require('./helpers');const {playMission}=require('./story-helper');
const done=(world,ids)=>{localStorage.clear();for(const id of ids)SanorProfile.record(world,id,{xp:300,done:true});};
test('Map 01 mission 3: An Afternoon in the Garden',async({page})=>{test.setTimeout(MISSION_TIMEOUT);const errors=watch(page);
  await page.goto('/home/?quality=low&speed=4');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('sanor-home-welcome-v1',JSON.stringify({version:1,studiedTable:true,name:'Ploy',done:true}));SanorProfile.record('01','table',{xp:300,done:true});});
  await page.goto('/home/?quality=low&speed=4&mission=garden');
  await expect(page.locator('#missionTitle')).toHaveText('An Afternoon in the Garden');
  await page.click('#startBtn');
  await playMission(page,{card:{thanks:'Thank you for visiting my home.',together:'We played chess together.',again:'Please come again soon.'}});
  await expect(page.locator('#reportContent')).toContainText('260 XP');               // 8 questions × 20 + 100
  expect(await page.evaluate(()=>[SanorProfile.activity('01','garden').done,SanorProfile.stamps('01').some(s=>s.id==='home-garden-done')])).toEqual([true,true]);
  expect(errors).toEqual([]);});
for(const [id,card,next] of [
  ['timetable',{time:'English is at half past nine.',favourite:'My favourite lesson is music.'},'Show Your Friend Around'],
  ['tour',{place:'This is our library.',like:'I like the music club.',invite:"Let's go to the canteen."},'Join the Music Club'],
  ['club',{event:'The Music Club Concert',when:'It is on Friday at the stage.',invite:'Please come and listen to Alex!'},null]]){
  test(`Map 02 3D mission: ${id}`,async({page})=>{test.setTimeout(MISSION_TIMEOUT);const errors=watch(page);
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
// Maps 03–06: the first story mission of each world, played in 3D from start to report
const {load}=require('./unit/load');const {SQContent}=load(['content/content.js']);
for(const [wid,mid] of [['03','guide'],['04','shopping'],['05','directions'],['06','design']]){
  const w=SQContent.worlds[wid],m=w.missions.find(x=>x.id===mid),card=Object.fromEntries(m.card.fields.map(f=>[f.id,f.example.en]));
  test(`Map ${wid} 3D mission: ${mid}`,async({page})=>{test.setTimeout(MISSION_TIMEOUT);const errors=watch(page);
    await page.goto(`/${w.slug}/?quality=low&speed=4`);await page.evaluate(()=>localStorage.clear());
    await page.goto(`/${w.slug}/?quality=low&speed=4&mission=${mid}`);
    await page.fill('#playerName','Ploy');await page.click('#startBtn');
    await playMission(page,{card});
    await expect(page.locator('#reportContent')).toContainText('Passport stamp');
    await expect(page.locator('#nextMission')).toContainText(w.missions.find(x=>x.id===w.missionOrder[1]).title.en);
    const r=await page.evaluate(([wid,mid])=>[SanorProfile.activity(wid,mid).done,SanorProfile.mapXp(wid)],[wid,mid]);
    expect(r).toEqual([true,6*20+100]);
    expect(errors).toEqual([]);});}
