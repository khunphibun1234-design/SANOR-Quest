#!/usr/bin/env node
/* SANOR QUEST · health check (run by .github/workflows/health.yml every 6 hours, or by hand).
 *
 *   node scripts/health-check.js                       check the live site (CNAME, or https://<owner>.github.io/<repo>/)
 *   node scripts/health-check.js --site http://localhost:8080/ --dry-run
 *
 * 1. Opens the main pages and checks they answer 200 and look like SANOR QUEST.
 * 2. With HEALTH_KEY: asks Supabase (health_digest) for browser errors and activity in the last HEALTH_HOURS hours.
 * 3. If something is wrong it opens a GitHub issue labelled "health-alert" (GitHub e-mails the repository owner);
 *    new problems are added as a comment; when everything is fine again the issue is closed.
 * Environment: SITE_URL, SUPABASE_URL, SUPABASE_ANON_KEY (both default to shared/config.js), HEALTH_KEY (secret),
 *              HEALTH_HOURS (default 6), GITHUB_TOKEN + GITHUB_REPOSITORY (set by GitHub Actions). */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.join(__dirname,'..');
const PAGES=[['','SANOR'],['home/','SANOR'],['school/','SANOR'],['phibun/','SANOR'],['market/','SANOR'],['travel/','SANOR'],['future/','SANOR'],
 ['review/','SANOR'],['teacher/','SANOR'],['schools/','SANOR'],['content/content.js','SQContent'],['shared/sq-three.js','SQ3'],['sw.js','sq-shell-']];
const LABEL='health-alert';

function defaults(env){
 let site=env.SITE_URL||'';
 if(!site){const cname=path.join(ROOT,'CNAME');if(fs.existsSync(cname))site='https://'+fs.readFileSync(cname,'utf8').trim()+'/';
  else if(env.GITHUB_REPOSITORY){const [o,r]=env.GITHUB_REPOSITORY.split('/');site=`https://${o.toLowerCase()}.github.io/${r}/`;}}
 let url=env.SUPABASE_URL||'',key=env.SUPABASE_ANON_KEY||'';
 if(!url||!key){try{const c=fs.readFileSync(path.join(ROOT,'shared/config.js'),'utf8');url=url||(/supabaseUrl:\s*'([^']*)'/.exec(c)||[])[1]||'';key=key||(/supabaseAnonKey:\s*'([^']*)'/.exec(c)||[])[1]||'';}catch{}}
 return{site:site&&(site.endsWith('/')?site:site+'/'),url:url.replace(/\/$/,''),key,hours:Math.min(168,Math.max(1,+env.HEALTH_HOURS||6)),healthKey:env.HEALTH_KEY||'',token:env.GITHUB_TOKEN||'',repo:env.GITHUB_REPOSITORY||''};}

async function timed(fetch,url,opts={},ms=20000){const ac=new AbortController(),t=setTimeout(()=>ac.abort(),ms),t0=Date.now();
 try{const r=await fetch(url,{...opts,signal:ac.signal});const body=await r.text();return{ok:r.ok,status:r.status,body,ms:Date.now()-t0};}
 catch(e){return{ok:false,status:0,body:'',error:e.name==='AbortError'?'timeout':e.message,ms:Date.now()-t0};}finally{clearTimeout(t);}}

// Returns {problems:[...], notes:[...], report:'markdown', fingerprint}
async function check({fetch=globalThis.fetch,env=process.env}={}){
 const o=defaults(env),problems=[],notes=[],lines=[];
 if(!o.site)throw Error('No SITE_URL, CNAME or GITHUB_REPOSITORY: cannot tell where the site is.');
 lines.push(`**Site:** ${o.site}`,'','| Page | Result | Time |','|---|---|---|');
 for(const [p,marker] of PAGES){const r=await timed(fetch,o.site+p);const good=r.ok&&r.body.includes(marker);
  lines.push(`| \`/${p}\` | ${good?'✅ '+r.status:'❌ '+(r.error||r.status)} | ${(r.ms/1000).toFixed(1)} s |`);
  if(!good)problems.push(`page /${p} ${r.error||'HTTP '+r.status}${r.ok?' (unexpected content)':''}`);else if(r.ms>8000)notes.push(`page /${p} is slow (${(r.ms/1000).toFixed(1)} s)`);}
 lines.push('');
 if(!o.url||!o.key)notes.push('Supabase is not configured yet (demo mode): no classroom data to check.');
 else if(!o.healthKey)notes.push('HEALTH_KEY is not set: browser errors are not checked (see docs/LAUNCH.md).');
 else{const r=await timed(fetch,o.url+'/rest/v1/rpc/health_digest',{method:'POST',headers:{apikey:o.key,Authorization:'Bearer '+o.key,'Content-Type':'application/json'},body:JSON.stringify({p_key:o.healthKey,p_hours:o.hours})});
  let d=null;try{d=r.ok?JSON.parse(r.body):null;}catch{}
  if(!d)problems.push(`Supabase health_digest failed: ${r.error||'HTTP '+r.status} ${r.body.slice(0,120)}`);
  else{lines.push(`**Last ${o.hours} h:** ${d.activeStudents} students active · ${d.events} events · ${d.classes} classes`,'');
   if(d.errors.length){lines.push(`**Browser errors (${d.errors.length}):**`,'','| Count | Page | Error | Where | Version | Device |','|---|---|---|---|---|---|');
    for(const e of d.errors.slice(0,30))lines.push(`| ${e.count} | \`${e.page}\` | ${String(e.message).replace(/\|/g,'/')} | ${e.source||''} | ${e.version||''} | ${e.agent||''} |`);lines.push('');
    for(const e of d.errors)problems.push(`error on /${e.page}: ${e.message}${e.source?' ('+e.source+')':''}`);}}}
 if(notes.length)lines.push('**Notes:**',...notes.map(n=>'- '+n),'');
 const fingerprint=crypto.createHash('sha256').update(problems.slice().sort().join('\n')).digest('hex').slice(0,16);
 return{problems,notes,report:lines.join('\n'),fingerprint,options:o};}

// Open, update or close the "health-alert" issue.
async function notify(result,{fetch=globalThis.fetch}={}){
 const {token,repo}=result.options;if(!token||!repo)return'skipped (no GITHUB_TOKEN)';
 const api=(p,method='GET',body)=>fetch('https://api.github.com/repos/'+repo+p,{method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','User-Agent':'sanor-quest-health','Content-Type':'application/json'},body:body&&JSON.stringify(body)}).then(async r=>{if(!r.ok)throw Error(method+' '+p+' → '+r.status+' '+(await r.text()).slice(0,200));return r.json();});
 const open=(await api(`/issues?labels=${LABEL}&state=open&per_page=1`))[0];
 const mark=`<!-- health:${result.fingerprint} -->`,stamp=new Date().toISOString().replace('T',' ').slice(0,16)+' UTC';
 if(!result.problems.length){if(!open)return'ok';await api(`/issues/${open.number}/comments`,'POST',{body:`✅ ทุกอย่างกลับมาปกติแล้ว (${stamp}) · Everything is fine again.\n\n${result.report}`});await api(`/issues/${open.number}`,'PATCH',{state:'closed'});return'closed #'+open.number;}
 const body=`${mark}\n⚠️ **SANOR QUEST health check found ${result.problems.length} problem(s)** · ${stamp}\n\n${result.problems.map(p=>'- '+p).join('\n')}\n\n${result.report}\n\nวิธีแก้: docs/LAUNCH.md หัวข้อ "เมื่อได้รับแจ้งเตือน"`;
 if(!open){const i=await api('/issues','POST',{title:'🚨 SANOR QUEST health alert',body,labels:[LABEL]});return'opened #'+i.number;}
 const last=[open,...await api(`/issues/${open.number}/comments?per_page=100`)].map(x=>x.body||'').reverse().find(b=>b.includes('<!-- health:'))||'';
 if(last.includes(mark))return'unchanged #'+open.number;               // same problems as last time: do not e-mail again
 await api(`/issues/${open.number}/comments`,'POST',{body});return'updated #'+open.number;}

if(require.main===module)(async()=>{const args=process.argv.slice(2),env={...process.env};
 const i=args.indexOf('--site');if(i>=0)env.SITE_URL=args[i+1];const dry=args.includes('--dry-run');if(dry)delete env.GITHUB_TOKEN;
 const r=await check({env});console.log(r.report);console.log(r.problems.length?`\n${r.problems.length} problem(s):\n`+r.problems.map(p=>' - '+p).join('\n'):'\nAll good.');
 const done=await notify(r);console.log('GitHub issue:',done);
 process.exitCode=r.problems.length&&done.startsWith('skipped')?1:0;})().catch(e=>{console.error(e.message);process.exitCode=2;});
module.exports={check,notify,defaults,PAGES};
