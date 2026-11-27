// Splash → log in / register → town map (start/). Uses @playwright/test directly, so the splash is not skipped.
const {test,expect}=require('@playwright/test');const {watch}=require('./helpers');
const demoClass=page=>page.evaluate(async()=>{await SQBackend.teacher.signIn('kru@school');return (await SQBackend.teacher.createClass('M.2/5')).code;});
test('a new session opens the splash first; "play without a class" leads to the pre-test, then the town map',async({browser})=>{
  const ctx=await browser.newContext();const page=await ctx.newPage();const errors=watch(page);
  await page.goto('/');await expect(page).toHaveURL(/\/start\/\?next=$/);
  await expect(page.locator('.splash-logo')).toBeVisible();await page.click('#startBtn');
  await expect(page.locator('#loginForm h1')).toHaveText('Student login');await expect(page).toHaveURL(/#login$/);
  await page.click('#guestBtn');await expect(page).toHaveURL(/\/test\/\?kind=pre&first=1$/);await expect(page.locator('#firstNote')).toBeVisible();
  await page.goto('/');await expect(page).toHaveURL(/\/test\/\?kind=pre&first=1$/);                // the worlds wait for the pre-test
  await page.evaluate(()=>SanorProfile.recordTest('pre',{score:12,total:30}));
  await page.goto('/');await expect(page.locator('#townMap')).toBeVisible();                        // same session: no splash again
  const p2=await ctx.newPage();await p2.goto('/?x=1#worlds');                                         // new tab = new session: splash, then straight on
  await expect(p2).toHaveURL(/\/\?x=1#worlds$/,{timeout:10_000});expect(errors).toEqual([]);await ctx.close();});
test('register, then log in again on another device; mistakes are explained in English and Thai',async({browser})=>{
  const ctx=await browser.newContext();const page=await ctx.newPage();const errors=watch(page);
  await page.goto('/start/#register');const code=await demoClass(page);
  const R=page.locator('#registerForm');await expect(R).toBeVisible();await expect(page.locator('#splash')).toBeHidden();
  await R.locator('[name=code]').fill(code.toLowerCase());await expect(R.locator('[name=code]')).toHaveValue(code);
  await R.locator('[name=number]').fill('7');await R.locator('[name=nickname]').fill('Ploy');
  await R.locator('[name=pin]').fill('1234');await expect(R.locator('[name=pin]')).toHaveValue('1234');
  await R.locator('[name=pin2]').fill('4a3b');await expect(R.locator('[name=pin2]')).toHaveValue('43');   // digits only
  await R.locator('[name=pin2]').clear();await R.locator('[name=pin2]').fill('4321');await expect(R.locator('[name=pin2]')).toHaveValue('4321');
  await R.locator('.cta-button').click();
  await expect(page.locator('#registerError')).toContainText('PIN สองช่องไม่ตรงกัน');
  await R.locator('[name=pin2]').clear();await R.locator('[name=pin2]').fill('1234');await expect(R.locator('[name=pin2]')).toHaveValue('1234');
  await R.locator('.cta-button').click();
  await expect(page.locator('#welcome')).toContainText('Welcome, Ploy!');await expect(page.locator('#welcome')).toContainText('M.2/5 · No. 7');
  await expect(page).toHaveURL(/\/test\/\?kind=pre&first=1$/);                                      // a new student: pre-test first
  await page.evaluate(()=>SanorProfile.recordTest('pre',{score:12,total:30}));await page.goto('/');await expect(page.locator('#classChip')).toContainText('M.2/5');
  // the same number cannot be registered again with another PIN
  await page.goto('/start/#register');const R2=page.locator('#registerForm');
  for(const [n,v] of [['code',code],['number','7'],['nickname','Someone'],['pin','9999'],['pin2','9999']])await R2.locator(`[name=${n}]`).fill(v);
  await R2.locator('.cta-button').click();await expect(page.locator('#registerError')).toContainText('ลงทะเบียนแล้ว');
  // log in: unknown number, wrong PIN, then the right PIN
  await page.click('#registerForm a[href="#login"]');const L=page.locator('#loginForm');await expect(L).toBeVisible();await expect(L.locator('[name=code]')).toHaveValue(code);
  await L.locator('[name=number]').fill('8');await L.locator('[name=pin]').fill('1234');await L.locator('.cta-button').click();
  await expect(page.locator('#loginError')).toContainText('ยังไม่ได้ลงทะเบียน');
  await L.locator('[name=number]').fill('7');await L.locator('[name=pin]').fill('0000');await L.locator('.cta-button').click();
  await expect(page.locator('#loginError')).toContainText('Wrong PIN');
  await L.locator('.eye').click();await expect(L.locator('[name=pin]')).toHaveAttribute('type','text');
  await L.locator('[name=pin]').fill('1234');await L.locator('.cta-button').click();
  await expect(page.locator('#welcome')).toContainText('Welcome back, Ploy!');
  expect(errors).toEqual([]);await ctx.close();});
test('typing straight away is never moved to another box by the opening focus',async({page})=>{
  await page.goto('/start/#register',{waitUntil:'domcontentloaded'});const R=page.locator('#registerForm');
  await R.locator('[name=nickname]').fill('Ploy');await page.waitForTimeout(600);                 // the opening focus would fire after 300 ms
  await expect(R.locator('[name=nickname]')).toHaveValue('Ploy');await expect(R.locator('[name=nickname]')).toBeFocused();
  await expect(R.locator('[name=code]')).toHaveValue('');});
