const {test,expect}=require('@playwright/test');const fs=require('fs');const lib=require('../../scripts/content-lib');
test('content JSON passes validation',()=>{expect(lib.validate(lib.load())).toEqual([]);});
test('every recording linked from the content exists',()=>{const have=new Set(fs.readdirSync('audio'));
  const missing=lib.spokenLines(lib.load()).filter(l=>l.audio&&!have.has(l.audio)).map(l=>l.audio);expect(missing).toEqual([]);});
test('content/content.js is up to date with the JSON',()=>{const {execFileSync}=require('child_process');
  const before=fs.readFileSync('content/content.js','utf8');execFileSync('node',['scripts/build-content.js']);expect(fs.readFileSync('content/content.js','utf8')).toBe(before);});
test('validation catches broken content',()=>{const d=lib.load();const q=d.worlds['02'].missions.find(m=>m.id==='buddy').questions[0];q.answer=7;delete q.line.th;
  const errs=lib.validate(d);expect(errs.some(e=>/answer must point/.test(e))).toBe(true);expect(errs.some(e=>/line.th/.test(e))).toBe(true);});
test('pre-test and post-test are two parallel forms: 30 different questions each, 5 from every map, paired one to one',()=>{const {tests,worlds}=lib.load();
  const maps=Object.fromEntries(Object.keys(worlds).sort().map(id=>[id,5]));const items=k=>tests.forms[k].parts.flatMap(p=>p.items);
  for(const k of ['pre','post']){const per={};for(const it of items(k))per[it.map]=(per[it.map]||0)+1;expect(items(k).length).toBe(30);expect(per).toEqual(maps);}
  const pre=items('pre'),post=items('post'),prompts=new Set(pre.map(i=>i.prompt.en));
  expect(post.filter(i=>prompts.has(i.prompt.en))).toEqual([]);                                          // no repeated question
  expect(new Set(post.map(i=>i.pair)).size).toBe(30);
  for(const b of post){const a=pre.find(x=>x.id===b.pair);expect(a.map).toBe(b.map);}
  const bad=JSON.parse(JSON.stringify(tests));bad.forms.post.parts[0].items[0].pair='t1';                // a words item paired with a conversation item
  expect(lib.validate({...lib.load(),tests:bad}).join(' ')).toMatch(/same map and part/);
  const odd=JSON.parse(JSON.stringify(tests));odd.forms.pre.parts[0].items[0].map='09';
  expect(lib.validate({...lib.load(),tests:odd}).join(' ')).toMatch(/unknown map 09/);});
