const {test,expect}=require('@playwright/test');const M=require('../../shared/mission.js');
test('choice, listen and tap3d compare the picked answer',()=>{
  expect(M.check({kind:'choice',answer:1},1)).toBe(true);expect(M.check({kind:'listen',answer:1},0)).toBe(false);expect(M.check({kind:'tap3d',answer:4},4)).toBe(true);});
test('order needs every token in the right order',()=>{const t={kind:'order',tokens:['Nice','to','meet','you,','too.']};
  expect(M.check(t,['Nice','to','meet','you,','too.'])).toBe(true);expect(M.check(t,['to','Nice','meet','you,','too.'])).toBe(false);});
test('speak accepts close transcripts and self-checks',()=>{const t={kind:'speak',target:{en:'Would you like some water?'}};
  expect(M.check(t,{said:'would you like some water'})).toBe(true);expect(M.check(t,{said:'you like water'})).toBe(false);expect(M.check(t,{selfCheck:true})).toBe(true);});
test('write follows the rules',()=>{const t={kind:'write',rules:{minWords:4,all:['\\bwelcome\\b'],any:['\\bhome\\b','\\bhouse\\b']}};
  expect(M.check(t,'Welcome to my home!')).toBe(true);expect(M.check(t,'Welcome to my school!')).toBe(false);expect(M.check(t,'Welcome home')).toBe(false);});
test('tracker counts attempts and first-try success',()=>{const tr=M.tracker({kind:'choice',answer:2});
  expect(tr.answer(0)).toMatchObject({correct:false,attempts:1});expect(tr.answer(2)).toMatchObject({correct:true,attempts:2});expect(tr.answer(2).accepted).toBe(false);
  expect(tr.result()).toMatchObject({firstTry:false,first:0});
  const t2=M.tracker({kind:'choice',answer:0});t2.useHint();t2.answer(0);expect(t2.result()).toMatchObject({firstTry:false,hintBeforeFirst:true});});
test('unknown task kinds fail loudly',()=>{expect(()=>M.check({kind:'dance'},1)).toThrow(/Unknown task kind/);});
