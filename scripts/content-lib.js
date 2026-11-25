// Shared helpers for the content build, the audio report and the tests.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const readJSON=f=>JSON.parse(fs.readFileSync(path.join(ROOT,f),'utf8'));
function load(){
  const words=readJSON('content/words.json').words;
  const worlds={};
  for(const f of fs.readdirSync(path.join(ROOT,'content/worlds')).filter(f=>f.endsWith('.json')).sort()){
    const w=readJSON('content/worlds/'+f);worlds[w.id]=w;}
  return {words,worlds};}

// Every line the game can play aloud, with where it lives and the file it needs.
function spokenLines({words,worlds}){
  const out=[];const add=(world,where,t,suggest)=>{if(t&&t.en)out.push({world,where,en:t.en,th:t.th||'',audio:t.audio||null,suggest});};
  for(const w of words){add('words','word: '+w.id,{en:w.en,audio:w.audio},`word-${w.id}.mp3`);if(w.example)add('words','example: '+w.id,w.example,`word-${w.id}-example.mp3`);}
  for(const world of Object.values(worlds))for(const m of world.missions){const p=`${world.id}-${m.id}`;
    if(m.type==='story'){
      for(const [id,q] of Object.entries(m.questions)){add(world.id,`${m.id} · ${id} · line`,q.line,`${p}-${id}-line.mp3`);
        if(q.choices)add(world.id,`${m.id} · ${id} · answer`,q.choices[q.answer],`${p}-${id}-answer.mp3`);
        if(q.answerText)add(world.id,`${m.id} · ${id} · answer`,q.answerText,`${p}-${id}-answer.mp3`);}
      m.speaking.forEach((s,i)=>add(world.id,`${m.id} · speaking ${i+1}`,s,`${p}-speak-${i+1}.mp3`));
      (m.vocabulary||[]).forEach(v=>add(world.id,`${m.id} · word book · ${v.word}`,v.example,`${p}-book-${v.word.replace(/\s+/g,'-')}.mp3`));}
    if(m.type==='tap3d')m.items.forEach(it=>{add(world.id,`${m.id} · ${it.word} · line`,it.line,`${p}-${it.word}-line.mp3`);add(world.id,`${m.id} · ${it.word} · word + line`,it.wordLine,`${p}-${it.word}-wordline.mp3`);});
    if(m.type==='quiz')m.questions.forEach(q=>add(world.id,`${m.id} · ${q.id} · line`,q.line,`${p}-${q.id}-line.mp3`));
    if(m.speak)add(world.id,`${m.id} · speaking task`,m.speak.target,`${p}-speak.mp3`);}
  // the same sentence can appear in several places: one recording serves them all
  const known=new Map(out.filter(l=>l.audio).map(l=>[l.en,l.audio]));
  for(const l of out)if(!l.audio&&known.has(l.en))l.audio=known.get(l.en);
  return out;}

function validate({words,worlds}){
  const errors=[],need=(c,msg)=>{if(!c)errors.push(msg);};
  const ids=new Set();for(const w of words){need(w.id&&w.en&&w.th,`word ${w.id}: id, en and th are required`);need(!ids.has(w.id),`word ${w.id}: duplicate`);ids.add(w.id);
    need(['Pre-A1','A1','A2','B1'].includes(w.cefr),`word ${w.id}: cefr must be Pre-A1, A1, A2 or B1`);need(Array.isArray(w.worlds)&&w.worlds.every(x=>worlds[x]),`word ${w.id}: unknown world`);}
  for(const world of Object.values(worlds)){const W=`world ${world.id}`;need(world.title?.en&&world.title?.th,`${W}: title.en and title.th are required`);
    if(world.missionOrder)for(const id of world.missionOrder){const m=world.missions.find(x=>x.id===id);need(m,`${W}: missionOrder names unknown mission ${id}`);if(m)need(m.summary?.en&&m.summary?.th,`${W} mission ${id}: summary en/th is required`);}
    for(const m of world.missions){const M=`${W} mission ${m.id}`;
      const checkQ=(q,id)=>{const Q=`${M} question ${id}`;need(q.line?.en,`${Q}: line.en is required`);need(q.line?.th,`${Q}: line.th (Thai) is required`);
        if(['choice','listen'].includes(q.kind))need(Array.isArray(q.choices)&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length,`${Q}: answer must point at a choice`);
        if(q.kind==='order')need(Array.isArray(q.tokens)&&q.tokens.length>1,`${Q}: order needs tokens`);
        if(q.hint)need(q.hint.th,`${Q}: hint.th (Thai) is required`);};
      if(m.type==='story'){const places=world.places||{};need(Object.keys(places).length,`${W}: story missions need world "places"`);
        for(const [id,q] of Object.entries(m.questions)){checkQ(q,id);if(q.at)need(places[q.at],`${M} question ${id}: unknown place ${q.at}`);
          if(q.table)need(q.table.caption?.en&&q.table.caption?.th&&Array.isArray(q.table.rows),`${M} question ${id}: table needs caption en/th and rows`);}
        const used=new Set();
        for(const s of m.stages){need(places[s.target],`${M} stage ${s.id}: unknown place ${s.target}`);need(s.title&&s.th&&s.go,`${M} stage ${s.id}: title, th and go are required`);
          for(const q of s.questions){need(m.questions[q],`${M} stage ${s.id}: unknown question ${q}`);need(!used.has(q),`${M}: question ${q} is used twice`);used.add(q);if(s.anyOrder)need(m.questions[q]?.at,`${M} stage ${s.id}: any-order questions need "at"`);}}
        need(m.stages.at(-1).questions.length===0,`${M}: the last stage must be the finale (no questions)`);
        need(Object.keys(m.questions).every(q=>used.has(q)),`${M}: every question must belong to a stage`);}
      else if(m.type==='quiz')m.questions.forEach(q=>checkQ(q,q.id));
      else if(m.type==='tap3d'){const names=m.items.map(i=>i.word);m.items.forEach((it,i)=>{need(it.line?.en&&it.line?.th,`${M} item ${it.word}: line en/th required`);need(it.choices.includes(it.word)&&it.choices.every(c=>names.includes(c)),`${M} item ${it.word}: choices must include the answer and only known items`);});}
      else errors.push(`${M}: unknown mission type ${m.type}`);
      // every mission needs one speaking task (Phase 3 rule)
      need(m.speak||(m.speaking&&m.speaking.length),`${M}: needs a speaking task ("speak" or "speaking")`);
      if(m.speak)need(m.speak.id&&m.speak.target?.en&&m.speak.target?.th&&m.speak.prompt?.en&&m.speak.prompt?.th,`${M}: speak needs id, prompt en/th and target en/th`);
      (m.speaking||[]).forEach((x,i)=>need(x.en&&x.th,`${M}: speaking ${i+1} needs en and th`));
      if(m.card){need(m.card.intro?.en&&m.card.intro?.th,`${M}: card.intro en/th required`);for(const f of m.card.fields){const F=`${M} card field ${f.id}`;need(f.label?.en&&f.label?.th&&f.help?.en&&f.help?.th&&f.example?.en,`${F}: label, help (en/th) and example are required`);
        need(f.rules&&f.rules.minWords>0,`${F}: rules.minWords is required`);for(const r of [...(f.rules?.all||[]),...(f.rules?.any||[])]){try{new RegExp(r,'i');}catch{errors.push(`${F}: bad pattern ${r}`);}}
        need(f.example&&require('../shared/mission.js').checkWriting(f.example.en,f.rules),`${F}: the example must pass its own rules`);}}}}
  return errors;}
module.exports={ROOT,load,validate,spokenLines};
