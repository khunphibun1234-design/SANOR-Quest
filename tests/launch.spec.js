// Phase 9: error reporting, the coordinator's results page and the page for schools.
const {test,expect}=require('./fixtures');const {watch}=require('./helpers');
test('a browser error is reported without personal data (demo mode keeps it in this browser)',async({page})=>{
  await page.goto('/school/quiz.html');await page.evaluate(()=>localStorage.clear());await page.reload();
  await page.evaluate(()=>setTimeout(()=>{throw new Error('Boom for ploy@example.com token 0123456789abcdef0123456789abcdef');},0));
  await expect.poll(()=>page.evaluate(()=>(JSON.parse(localStorage.getItem('sanor-demo-db-v1')||'{}').errors||[]).length)).toBe(1);
  const e=await page.evaluate(()=>JSON.parse(localStorage.getItem('sanor-demo-db-v1')).errors[0]);
  expect(e).toMatchObject({page:'school/quiz.html',message:'Error: Boom for … token …',count:1});expect(e.agent).toMatch(/ · /);
  for(let i=0;i<8;i++)await page.evaluate(i=>SQErrors.report(new Error('other '+i)),i);         // at most 5 per page
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sanor-demo-db-v1')).errors.length)).toBe(5);});
test('research page: sample classes, launch criteria and an anonymous export',async({page})=>{const errors=watch(page);
  await page.goto('/research/');await page.evaluate(()=>localStorage.clear());await page.reload();
  await page.click('#demoIn');await page.click('#sample');
  await expect(page.locator('#schoolTable tbody tr')).toHaveCount(4);
  await expect(page.locator('#criteria li')).toHaveCount(6);await expect(page.locator('#criteria li.ok')).not.toHaveCount(0);
  await page.click('#publish');const preview=await page.locator('#publishPreview').textContent();
  expect(preview).toContain('window.SQ_RESULTS');expect(preview).toContain('"status": "ready"');expect(preview).not.toMatch(/ตัวอย่าง ม\.2|S1"/);
  const [dl]=await Promise.all([page.waitForEvent('download'),page.click('#publishDownload')]);expect(dl.suggestedFilename()).toBe('results.js');
  expect(errors).toEqual([]);});
test('schools page lists every world and shows results only when they are published',async({page})=>{const errors=watch(page);
  await page.goto('/schools/');await expect(page.locator('#worlds > li')).toHaveCount(6);
  await expect(page.locator('#resultsBox')).toContainText('กำลังดำเนินการ');
  await page.route('**/schools/results.js',r=>r.fulfill({contentType:'text/javascript',body:'window.SQ_RESULTS={"status":"ready","round":"R2","updated":"2027-01-01","schools":3,"classes":9,"students":400,"minutesPerStudent":120,"firstTryPct":70,"paired":{"n":350,"pre":45,"post":60,"gain":15,"dz":0.8,"p":"<.001","ciLow":13,"ciHigh":17},"completion":{"01":90},"feedback":{"n":300,"fun":2.6,"easy":2.1,"learned":2.5},"perSchool":[]}'}));
  await page.reload();await expect(page.locator('.prepost')).toContainText('350');await expect(page.locator('.completion .row')).toHaveCount(6);
  expect(errors).toEqual([]);});
