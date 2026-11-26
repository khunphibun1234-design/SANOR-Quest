const {test,expect}=require('@playwright/test');const lib=require('../../scripts/content-lib');const W=require('../../shared/writing.js');require('../../shared/mission.js');
const {worlds}=lib.load();
test('every world has a writing card whose examples pass',()=>{for(const id of Object.keys(worlds)){const card=worlds[id].missions.find(m=>m.card).card;
  expect(W.check(card,Object.fromEntries(card.fields.map(f=>[f.id,f.example.en])))).toEqual([]);}});
test('school card rules',()=>{const card=worlds['02'].missions.find(m=>m.id==='tour').card;
  expect(W.check(card,{place:'This is our gym.',like:'I like music very much.',invite:'Do you want to play?'})).toEqual([]);
  expect(W.check(card,{place:'Our school is big.',like:'Music is fun.',invite:'Come here.'})).toEqual(['place','like','invite']);});
test('every mission has a speaking task',()=>{for(const w of Object.values(worlds))for(const m of w.missions)expect(!!(m.speak||m.speaking?.length)).toBe(true);});
