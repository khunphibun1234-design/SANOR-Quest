// End-to-end tests. Run: npm test   (starts a local static server on port 8091)
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'tests',
  testMatch:/.*\.spec\.m?js/,
  timeout:60_000,
  fullyParallel:true,
  reporter:process.env.CI?[['github'],['list']]:'list',
  use:{baseURL:'http://localhost:8091',trace:'off',
    launchOptions:{args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}},
  webServer:{command:'python3 -m http.server 8091',url:'http://localhost:8091',reuseExistingServer:!process.env.CI,stderr:'ignore'}
});
