const {test,expect}=require('./fixtures');const path=require('path');
// WCAG 2.1 AA checks with axe-core on every page (colour contrast, labels, names, structure, …).
const AXE=path.join(__dirname,'../node_modules/axe-core/axe.min.js');
const pages=[['town map','/',null],['passport','/','#passportBtn'],['Map 01 intro','/home/?quality=low',null],['Map 02 intro','/school/?quality=low',null],['Map 02 2D','/school/quiz.html',null],['for schools','/schools/',null],['start splash','/start/',null],['start log in','/start/#login',null],['start register','/start/#register',null],['research gate','/research/',null],['Map 03 intro','/phibun/?quality=low',null],['Map 04 intro','/market/?quality=low',null],['Map 05 intro','/travel/?quality=low',null],['Map 06 intro','/future/?quality=low',null],
  ['daily review','/review/',null],['teacher sign-in','/teacher/',null],['3D table intro','/home/table-three.html?quality=low',null],['privacy policy','/privacy/',null],['consent form','/consent/',null],['teacher guide','/teacher/guide.html',null],['observation sheet','/teacher/observation.html',null]];
async function audit(page,url,click){
  await page.goto(url);await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForTimeout(600);if(click)await page.click(click);await page.waitForTimeout(300);
  await page.addScriptTag({path:AXE});
  const r=await page.evaluate(async()=>{const res=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});
    return res.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,where:v.nodes.slice(0,3).map(n=>n.target.join(' ')+' :: '+(n.failureSummary||'').split('\n')[1])}));});
  expect(r).toEqual([]);}
for(const [name,url,click] of pages)test(`accessibility (WCAG 2.1 AA): ${name}`,({page})=>audit(page,url,click));
// the pre-test page before anyone has taken it (the shared fixture would mark it as done)
test.describe('pre-test not taken yet',()=>{test.use({pretestDone:false});
  test('accessibility (WCAG 2.1 AA): pre-test',({page})=>audit(page,'/test/?kind=pre','#begin'));});
