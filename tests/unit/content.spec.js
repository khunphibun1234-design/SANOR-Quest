const {test,expect}=require('@playwright/test');const fs=require('fs');const lib=require('../../scripts/content-lib');
test('content JSON passes validation',()=>{expect(lib.validate(lib.load())).toEqual([]);});
test('every recording linked from the content exists',()=>{const have=new Set(fs.readdirSync('audio'));
  const missing=lib.spokenLines(lib.load()).filter(l=>l.audio&&!have.has(l.audio)).map(l=>l.audio);expect(missing).toEqual([]);});
test('content/content.js is up to date with the JSON',()=>{const {execFileSync}=require('child_process');
  const before=fs.readFileSync('content/content.js','utf8');execFileSync('node',['scripts/build-content.js']);expect(fs.readFileSync('content/content.js','utf8')).toBe(before);});
test('validation catches broken content',()=>{const d=lib.load();const q=d.worlds['02'].missions.find(m=>m.id==='buddy').questions[0];q.answer=7;delete q.line.th;
  const errs=lib.validate(d);expect(errs.some(e=>/answer must point/.test(e))).toBe(true);expect(errs.some(e=>/line.th/.test(e))).toBe(true);});
