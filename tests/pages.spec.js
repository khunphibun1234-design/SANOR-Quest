const {test,expect}=require('@playwright/test');const {watch}=require('./helpers');
const pages=[['town map','/'],['Map 01 home','/home/'],['Map 02 school (3D)','/school/'],['Map 02 quick practice (2D)','/school/quiz.html'],['Map 03 Phibun Hometown','/phibun/'],['Map 04 Market & Food Street','/market/'],['Map 05 Around the World','/travel/'],['Map 06 Future Makers City','/future/'],['Daily review','/review/'],['Teacher dashboard','/teacher/'],['Pre-test','/test/?kind=pre'],['Privacy policy','/privacy/'],['Consent form','/consent/'],['Teacher guide','/teacher/guide.html'],['Observation sheet','/teacher/observation.html'],['Alex’s Table 3D','/home/table-three.html'],['Alex’s Table 2D','/home/table.html']];
for(const [name,url] of pages){
  test(`${name} loads without errors`,async({page})=>{const errors=watch(page);
    await page.goto(url);await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    if(!/teacher|privacy|consent|observation/.test(url))expect(await page.evaluate(()=>!!window.SanorProfile)).toBe(true);});   // the teacher page has no player profile
}
test('3D pages run on the shared Three.js engine',async({page})=>{
  await page.goto('/home/table-three.html');await page.click('#start');await page.waitForTimeout(800);
  const s=await page.evaluate(()=>window.table3dStatus());
  expect(s.renderer).toBe('three.js r187');expect(s.drawCalls).toBeGreaterThan(10);});
