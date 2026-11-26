#!/usr/bin/env node
/* SANOR QUEST · custom domain for GitHub Pages.
 *   node scripts/set-domain.js sanorquest.example      writes CNAME and prints the DNS records to add
 *   node scripts/set-domain.js --remove                  goes back to https://<owner>.github.io/<repo>/
 * Every link in the app is relative, so nothing else in the code changes. Full steps: docs/LAUNCH.md. */
'use strict';
const fs=require('fs'),path=require('path');const FILE=path.join(__dirname,'..','CNAME');
const arg=(process.argv[2]||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/.*$/,'');
if(arg==='--remove'){if(fs.existsSync(FILE))fs.unlinkSync(FILE);console.log('CNAME removed. The site goes back to the github.io address.');process.exit(0);}
if(!/^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(arg)){console.error('Usage: node scripts/set-domain.js <domain>   e.g. learn.sanorquest.com');process.exit(1);}
fs.writeFileSync(FILE,arg+'\n');
const apex=arg.split('.').length===2||/\.(ac|co|go|in|or|ac)\.th$/.test(arg)&&arg.split('.').length===3;
console.log(`CNAME → ${arg}\n\nAdd these DNS records at your domain registrar:`);
if(apex){console.log('  A     @    185.199.108.153\n  A     @    185.199.109.153\n  A     @    185.199.110.153\n  A     @    185.199.111.153\n  AAAA  @    2606:50c0:8000::153\n  AAAA  @    2606:50c0:8001::153\n  AAAA  @    2606:50c0:8002::153\n  AAAA  @    2606:50c0:8003::153\n  CNAME www  <owner>.github.io');}
else console.log(`  CNAME ${arg.split('.')[0]}  <owner>.github.io`);
console.log('\nThen: GitHub → Settings → Pages → Custom domain (it reads this file) → wait for the DNS check → tick "Enforce HTTPS".\nAlso add https://'+arg+' to Supabase → Authentication → URL Configuration (Site URL + Redirect URLs).');
