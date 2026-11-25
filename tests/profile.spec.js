const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{await page.goto('/school/');await page.evaluate(()=>{localStorage.clear();});await page.reload();});

test('record keeps the best XP and never duplicates stamps',async({page})=>{
  const r=await page.evaluate(()=>{const P=SanorProfile;P.reset();
    P.record('02','buddy',{xp:40,stamps:[{id:'gate',icon:'🚪'}]});
    P.record('02','buddy',{xp:20,stamps:[{id:'gate',icon:'🚪'},{id:'gym',icon:'🏀'}]});
    P.record('01','table',{xp:60});
    return {xp02:P.mapXp('02'),total:P.totalXp(),stamps:P.stamps('02').map(s=>s.id)};});
  expect(r).toEqual({xp02:40,total:100,stamps:['gate','gym']});});

test('saved data is sanitized and unknown worlds are dropped',async({page})=>{
  await page.evaluate(()=>localStorage.setItem('sanor-profile-v1',JSON.stringify({version:1,name:'<b>Mook</b> with a very very long name',level:'hacker',maps:{island:{activities:{words:{xp:220}}},'02':{activities:{buddy:{xp:99999}}}}})));
  await page.reload();
  const r=await page.evaluate(()=>({p:SanorProfile.get(),total:SanorProfile.totalXp()}));
  expect(r.p.level).toBe('starter');expect(r.p.name.length).toBeLessThanOrEqual(20);
  expect(r.p.maps.island).toBeUndefined();expect(r.total).toBe(5000);});

test('first visit carries over the old Map 01 save',async({page})=>{
  await page.evaluate(()=>localStorage.setItem('sanor-home-welcome-v1',JSON.stringify({version:1,name:'Ploy',completed:['greet','name','introduce'],done:false})));
  await page.reload();
  expect(await page.evaluate(()=>[SanorProfile.name(),SanorProfile.mapXp('01')])).toEqual(['Ploy',60]);});

test('Thai help follows the level: show, tap to reveal, hide',async({page})=>{
  const line=page.locator('#lineTh');
  await expect(line).toBeVisible();await expect(line).not.toHaveCSS('color','rgba(0, 0, 0, 0)');
  await page.evaluate(()=>SanorProfile.setLevel('explorer'));
  await expect(line).toHaveCSS('color','rgba(0, 0, 0, 0)');
  await line.click();await expect(line).toHaveClass(/open/);await expect(line).not.toHaveCSS('color','rgba(0, 0, 0, 0)');
  await page.evaluate(()=>SanorProfile.setLevel('challenger'));
  await expect(line).toBeHidden();});
