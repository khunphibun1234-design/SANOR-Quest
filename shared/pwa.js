/* SANOR QUEST · offline app support.
 *   - registers the service worker (sw.js at the site root), so pages open without internet after the first visit
 *   - SQPwa.cacheWorld('01') saves that world's recordings for offline play (called by the map pages)
 *   - SQPwa.installButton(el) shows an "Install app" button where the browser allows it
 *   - when a new version has been downloaded, a small banner offers to reload */
(function(root){'use strict';
const nav=root.navigator,doc=root.document,base=new URL('..',doc.currentScript.src);  // site root (this file lives in shared/)
let installEvent=null;const installButtons=[];
function register(){if(!('serviceWorker' in nav)||/^file:/.test(location.protocol))return;
 nav.serviceWorker.register(new URL('sw.js',base).href,{scope:base.pathname}).then(reg=>{
  reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='activated'&&nav.serviceWorker.controller&&hadController)banner();});});}).catch(()=>{});}
const hadController=!!(nav.serviceWorker&&nav.serviceWorker.controller);
function banner(){if(doc.getElementById('sqUpdate'))return;const d=doc.createElement('div');d.id='sqUpdate';d.className='sq-coach';d.setAttribute('role','status');
 d.innerHTML='<div class="sq-coach-text"><b>A new version of SANOR QUEST is ready.</b><span class="th" lang="th">มีเวอร์ชันใหม่แล้ว กดโหลดใหม่เพื่อใช้งาน</span></div><div class="sq-coach-actions"><button type="button" class="primary">Reload</button></div>';
 d.querySelector('button').onclick=()=>location.reload();doc.body.append(d);}
function cacheWorld(world){const A=root.SQContent&&root.SQContent.audioByWorld;if(!A||!nav.serviceWorker)return;
 const urls=[...(A[world]||[]),...(A.words||[])].map(f=>new URL('audio/'+f,base).href);
 nav.serviceWorker.ready.then(reg=>reg.active&&reg.active.postMessage({type:'cache-audio',urls})).catch(()=>{});}
root.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;installButtons.forEach(b=>b.hidden=false);});
function installButton(el){if(!el)return;installButtons.push(el);el.hidden=!installEvent;el.onclick=async()=>{if(!installEvent)return;installEvent.prompt();await installEvent.userChoice.catch(()=>{});installEvent=null;installButtons.forEach(b=>b.hidden=true);};}
register();
root.SQPwa={cacheWorld,installButton};
})(typeof window!=='undefined'?window:globalThis);
