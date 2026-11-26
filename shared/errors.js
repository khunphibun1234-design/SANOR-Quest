/* SANOR QUEST · error reporting. Loaded right after shared/config.js on every game and teacher page.
 * Uncaught errors and failed promises are sent (at most 5 per page) to the database function report_error, so
 * the scheduled health check (scripts/health-check.js) can warn the project lead. Without Supabase (demo mode)
 * they are kept in this browser. What is sent: the page (e.g. "home/"), the error message with long codes and
 * e-mail addresses removed, the file and line, the app version and the kind of device ("Android · Chrome 131").
 * Never sent: nicknames, answers, tokens, the full address or anything typed by the student.
 *   SQErrors.report(error, {source})   report something by hand       SQErrors.flush()   retry the queue */
(function(root){'use strict';
if(root.SQErrors)return;
const QKEY='sanor-errors-queue-v1',MAX=5,cfg=root.SQ_CONFIG||{};
const script=document.currentScript&&document.currentScript.src||'';
const base=script.replace(/shared\/errors\.js.*$/,'')||location.origin+'/';
const seen=new Set();let sent=0,version='';
const clean=s=>String(s||'').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g,'…').replace(/\b[0-9a-f]{20,}\b/gi,'…').replace(/[?#][^\s)]*/g,'').trim();
const rel=u=>{u=String(u||'');return(u.startsWith(base)?u.slice(base.length):u.replace(/^https?:\/\/[^/]+\/?/,'')).replace(/[?#].*$/,'');};
const page=()=>rel(location.href)||'/';
function agent(){const u=navigator.userAgent||'';const os=/Android/.test(u)?'Android':/iPhone|iPad|iPod/.test(u)?'iOS':/CrOS/.test(u)?'ChromeOS':/Windows/.test(u)?'Windows':/Mac OS/.test(u)?'macOS':/Linux/.test(u)?'Linux':'other';
 const b=/Edg\/(\d+)/.exec(u)?'Edge '+RegExp.$1:/SamsungBrowser\/(\d+)/.exec(u)?'Samsung '+RegExp.$1:/(?:Chrome|CriOS)\/(\d+)/.exec(u)?'Chrome '+RegExp.$1:/(?:Firefox|FxiOS)\/(\d+)/.exec(u)?'Firefox '+RegExp.$1:/Version\/(\d+).*Safari/.exec(u)?'Safari '+RegExp.$1:'other';
 return os+' · '+b;}
try{root.caches&&caches.keys().then(k=>{const v=k.find(n=>n.startsWith('sq-shell-'));if(v)version=v.slice(9);}).catch(()=>{});}catch{}
const readQ=()=>{try{const q=JSON.parse(localStorage.getItem(QKEY));return Array.isArray(q)?q:[];}catch{return[];}};
const writeQ=q=>{try{q.length?localStorage.setItem(QKEY,JSON.stringify(q.slice(-10))):localStorage.removeItem(QKEY);}catch{}};
async function send(list){
 if(cfg.supabaseUrl&&cfg.supabaseAnonKey){const r=await fetch(cfg.supabaseUrl.replace(/\/$/,'')+'/rest/v1/rpc/report_error',{method:'POST',keepalive:true,
   headers:{apikey:cfg.supabaseAnonKey,Authorization:'Bearer '+cfg.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify({p_errors:list})});if(!r.ok)throw Error('report_failed');return;}
 if(root.SQBackend&&root.SQBackend.reportErrors){await root.SQBackend.reportErrors(list);return;}
 throw Error('no_backend');}
let flushing=null;
function flush(){if(flushing)return flushing;const q=readQ();if(!q.length)return Promise.resolve(0);
 const batch=q.slice(0,10);flushing=send(batch).then(()=>{writeQ(readQ().slice(batch.length));return batch.length;}).catch(()=>0).finally(()=>{flushing=null;});return flushing;}
function report(err,extra={}){
 const message=clean(err instanceof Error?(err.name||'Error')+': '+err.message:err&&err.message||err).slice(0,300);if(!message||/^Script error\.?$/i.test(message)||/ResizeObserver loop/.test(message))return false;
 const source=extra.source!=null?String(extra.source).slice(0,160):'';
 // ignore errors from browser extensions and other sites
 if(extra.file&&!String(extra.file).startsWith(location.origin))return false;
 const key=message+'|'+source;if(seen.has(key)||sent>=MAX)return false;seen.add(key);sent++;
 const q=readQ();q.push({page:page(),message,source,version,agent:agent()});writeQ(q);setTimeout(flush,0);return true;}
addEventListener('error',e=>{if(e.target&&e.target!==root&&e.target.tagName)return;   // a failed image or audio file is not a code error
 const where=e.filename?rel(e.filename)+':'+(e.lineno||0):'';report(e.error||e.message,{source:where,file:e.filename||''});});
addEventListener('unhandledrejection',e=>{const r=e.reason;const m=/\((https?:[^)]+?):(\d+):\d+\)|@(https?:[^\s]+?):(\d+):\d+/.exec(r&&r.stack||'');
 report(r instanceof Error?r:String(r&&r.message||r),{source:m?rel(m[1]||m[3])+':'+(m[2]||m[4]):'promise'});});
addEventListener('online',flush);if(document.readyState==='complete')setTimeout(flush,1000);else addEventListener('load',()=>setTimeout(flush,1000));
root.SQErrors={report:(err,extra)=>report(err,extra||{}),flush,queue:readQ};
})(window);
