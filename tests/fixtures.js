// Shared Playwright fixtures. The town map sends each new browser session to the splash/log-in screens (start/)
// once; most tests are about other things, so every page starts as if the splash was already seen.
// tests/start.spec.js uses @playwright/test directly to test the splash itself.
const base=require('@playwright/test');
const skipSplash=()=>{try{sessionStorage.setItem('sanor-splash-v1','1');}catch{}};
exports.test=base.test.extend({context:async({context},use)=>{await context.addInitScript(skipSplash);await use(context);}});
exports.expect=base.expect;exports.skipSplash=skipSplash;
