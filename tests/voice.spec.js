const {test,expect}=require('./fixtures');const {watch}=require('./helpers');
// The speaking task on Alex's Table results page, with the microphone simulated.
const finishedTable=()=>{localStorage.clear();SanorProfile.setRecognition(true);localStorage.setItem('sanor-table-mission-v1',JSON.stringify({index:10,rows:Array.from({length:10},(_,i)=>({answers:[i],hint:false}))}));};
const fakeRecognition=said=>{window.__said=said;window.SpeechRecognition=class{start(){setTimeout(()=>{const list=[[{transcript:window.__said.shift()}]];list[0].length=1;this.onresult&&this.onresult({results:list});this.onend&&this.onend();},50);}};};
async function open(page){await page.goto('/home/table.html');await page.evaluate(finishedTable);await page.reload();await expect(page.locator('#speakBox .sq-voice-target')).toHaveText('“Lunch is ready. Please sit down.”');}

test('speech recognition: a close match passes and is saved to the profile',async({page})=>{const errors=watch(page);
  await page.addInitScript(fakeRecognition,['lunch is ready please sit down']);await open(page);
  await page.locator('#speakBox .sq-voice-btn.primary').click();
  await expect(page.locator('#speakBox .sq-voice-status')).toContainText('Great!');
  await expect(page.locator('#speakBox')).toHaveClass(/is-passed/);
  expect(await page.evaluate(()=>SanorProfile.speech('01')[0])).toMatchObject({id:'table-lunch',best:'asr'});
  expect(errors).toEqual([]);});

test('speech recognition: missing words are shown, and after two tries the student can self-check',async({page})=>{
  await page.addInitScript(fakeRecognition,['lunch is','lunch ready sit']);await open(page);
  const speak=page.locator('#speakBox .sq-voice-btn.primary');
  await speak.click();await expect(page.locator('#speakBox .sq-voice-words .miss').first()).toBeVisible();
  await expect(page.locator('#speakBox [data-row=self]')).toBeHidden();
  await speak.click();await expect(page.locator('#speakBox [data-row=self]')).toBeVisible();
  await page.locator('#speakBox .sq-voice-btn.good').click();
  expect(await page.evaluate(()=>SanorProfile.speech('01')[0].best)).toBe('self');});

test('privacy default: without the microphone switch (or on iOS) the record-and-compare path is used, and Skip always works',async({page})=>{
  await page.addInitScript(()=>{delete window.webkitSpeechRecognition;delete window.SpeechRecognition;});await open(page);
  await expect(page.locator('#speakBox [data-row=self]')).toBeVisible();
  await expect(page.locator('#speakBox .sq-voice-btn',{hasText:'I said it'})).toBeVisible();
  await page.locator('#speakBox .sq-skip').click();
  await expect(page.locator('#speakBox')).toHaveClass(/is-skipped/);
  expect(await page.evaluate(()=>[SanorProfile.speech('01')[0].best,SanorProfile.speechStats()])).toEqual(['skip',{tasks:1,spoken:0,recognised:0,skipped:1}]);});

test('speech recognition stays off until the student switches it on',async({page})=>{
  await page.addInitScript(()=>{window.SpeechRecognition=class{start(){}};});
  await page.goto('/home/table.html');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('sanor-table-mission-v1',JSON.stringify({index:10,rows:Array.from({length:10},(_,i)=>({answers:[i],hint:false}))}));});await page.reload();
  await expect(page.locator('#speakBox .sq-voice-btn.primary')).toHaveCount(0);await expect(page.locator('#speakBox [data-row=self]')).toBeVisible();});
