const {test,expect}=require('@playwright/test');const {load}=require('./load');const M=require('../../shared/mission.js');
test('over 85% right on the first try (12+ answers) suggests the next Thai-help level, and can be snoozed',()=>{const {SanorProfile:P}=load('shared/profile.js');
  for(let i=0;i<11;i++)P.logAnswer(true);expect(P.advice()).toBeNull();          // not enough answers yet
  P.logAnswer(true);expect(P.advice()).toBe('level-up');expect(P.nextLevel()).toBe('explorer');
  P.snoozeAdvice();expect(P.advice()).toBeNull();for(let i=0;i<10;i++)P.logAnswer(true);expect(P.advice()).toBe('level-up');
  P.setLevel('challenger');expect(P.advice()).toBeNull();});                       // nothing above challenger
test('under 50% turns extra support on; it turns off again at 65%',()=>{const {SanorProfile:P}=load('shared/profile.js');
  for(let i=0;i<8;i++)P.logAnswer(i<3);expect(P.support()).toBe(true);
  for(let i=0;i<10;i++)P.logAnswer(true);expect(P.accuracy().rate).toBeGreaterThanOrEqual(.65);expect(P.support()).toBe(false);});
test('only the last 20 answers count',()=>{const {SanorProfile:P}=load('shared/profile.js');for(let i=0;i<30;i++)P.logAnswer(i>=10);expect(P.accuracy()).toEqual({n:20,rate:1});});
test('speaking keeps the best result per task',()=>{const {SanorProfile:P}=load('shared/profile.js');
  P.recordSpeech('02','buddy-cheer',{mode:'asr',passed:true,score:1});P.recordSpeech('02','buddy-cheer',{mode:'skip'});
  expect(P.speech('02')[0]).toMatchObject({best:'asr',tries:2,score:1});
  P.recordSpeech('01','welcome-1',{mode:'self',passed:false});expect(P.speech('01')[0].best).toBe('not-yet');
  expect(P.speechStats()).toEqual({tasks:2,spoken:1,recognised:1,skipped:0});});
test('flexible speech comparison forgives contractions and one-letter mishearing, not missing words',()=>{
  expect(M.spokenOk("I am Alex nice to meet you","I'm Alex. Nice to meet you.")).toBe(true);
  expect(M.spokenOk("lunch is ready please sit dawn","Lunch is ready. Please sit down.")).toBe(true);  // one word off in 6
  expect(M.spokenOk("welcome to my house","Welcome to my home.")).toBe(false);                     // 4 words: all needed
  expect(M.spokenOk("good luck alex you can","Good luck, Alex! You can do it!")).toBe(false);
  expect(M.compare('sit dawn','sit down').words).toEqual([{w:'sit',ok:true},{w:'down',ok:true}]);   // one letter off
  expect(M.compare('sit dime','sit down').words).toEqual([{w:'sit',ok:true},{w:'down',ok:false}]);});
