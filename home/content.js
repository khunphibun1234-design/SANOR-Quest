/* Map 01 content adapter. The content itself lives in content/worlds/01-home.json
 * (built into content/content.js). This file only reshapes it for home.js and lesson.js. */
(function(root){'use strict';
const SQ=root.SQContent,world=SQ.worlds['01'],m=world.missions.find(x=>x.id==='welcome');
const wordTh=id=>(SQ.words.find(w=>w.id===id.replace(/\s+/g,'-'))||{}).th||'';
root.HomeContent={
 stages:m.stages.map(s=>({id:s.id,th:s.th,title:s.title,en:s.subtitle,target:s.target,go:s.go,ids:s.questions.slice()})),
 places:Object.fromEntries(Object.entries(m.places).map(([k,p])=>[k,{th:p.th,name:p.name,en:p.en,x:p.pos[0],y:p.pos[1],z:p.pos[2],approach:p.approach.slice(),icon:p.icon}])),
 vocabulary:m.vocabulary.map(v=>[v.word,v.label,v.example.en,wordTh(v.word),v.example.th||'']),
 questions:Object.fromEntries(Object.entries(m.questions).map(([k,q])=>{const o={kind:q.kind,speaker:q.speaker,line:q.line.en,thai:q.line.th,prompt:q.prompt.en,promptTh:q.prompt.th,hint:q.hint.en,hintTh:q.hint.th,why:q.why.en,whyTh:q.why.th,reply:q.reply.en};
  if(q.choices){o.choices=q.choices.map(c=>c.en);o.answer=q.answer;}if(q.tokens)o.tokens=q.tokens.slice();return [k,o];})),
 speaking:m.speaking.map(s=>s.en),
 card:m.card,
 mission:m};
})(typeof window!=='undefined'?window:globalThis);
