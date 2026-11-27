// Shared Playwright fixtures.
// · The town map sends each new browser session to the splash/log-in screens (start/) once.
// · Everyone takes the pre-test (test/?kind=pre) once before the worlds open.
// Most tests are about other things, so by default every page starts with the splash seen and the pre-test done.
// tests/start.spec.js uses @playwright/test directly; tests about the pre-test use test.use({pretestDone:false}).
const base=require('@playwright/test');
const skipSplash=()=>{try{sessionStorage.setItem('sanor-splash-v1','1');}catch{}};
const markPretest=()=>{try{const k='sanor-profile-v1',p=JSON.parse(localStorage.getItem(k)||'null');if(p&&p.tests&&p.tests.pre)return;
  const q=p||{version:1};q.tests=Object.assign({},q.tests,{pre:{score:15,total:30,at:'2026-01-01T00:00:00.000Z'}});localStorage.setItem(k,JSON.stringify(q));}catch{}};
exports.test=base.test.extend({pretestDone:[true,{option:true}],
  context:async({context,pretestDone},use)=>{await context.addInitScript(skipSplash);if(pretestDone)await context.addInitScript(markPretest);await use(context);}});
exports.expect=base.expect;exports.skipSplash=skipSplash;exports.markPretest=markPretest;
