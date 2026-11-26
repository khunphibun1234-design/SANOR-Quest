const {test,expect}=require('@playwright/test');const {load}=require('./load');
const DAY=86400000,T0=Date.UTC(2026,10,25);
test('first-try correct answers climb the boxes and wait longer each time',()=>{const {SanorSRS:S}=load('shared/srs.js');
  let c=S.schedule(null,{correct:true},T0);expect([c.box,(c.due-T0)/DAY]).toEqual([2,1]);
  c=S.schedule(c,{correct:true},T0);expect([c.box,(c.due-T0)/DAY]).toEqual([3,3]);
  c=S.schedule(c,{correct:true},T0);c=S.schedule(c,{correct:true},T0);c=S.schedule(c,{correct:true},T0);
  expect([c.box,(c.due-T0)/DAY,c.seen,c.right]).toEqual([5,16,5,5]);});
test('a mistake or a hint sends the word back to box 1',()=>{const {SanorSRS:S}=load('shared/srs.js');
  const strong={box:4,seen:4,right:4,due:T0,last:T0};
  expect(S.schedule(strong,{correct:false},T0).box).toBe(1);
  expect(S.schedule(strong,{correct:true,hint:true},T0).box).toBe(1);});
test('due() lists weak words first and skips words that are not due',()=>{const {SanorSRS:S}=load('shared/srs.js');
  S.record('kitchen',{correct:true},T0);S.record('kitchen',{correct:true},T0); // box 3: due in 3 days
  S.record('fork',{correct:false},T0);S.record('Living Room',{correct:true},T0);
  expect(S.due(10,T0)).toEqual(['fork']);                        // living room (box 2) waits 1 day
  expect(S.due(10,T0+DAY)).toEqual(['fork','living-room']);
  expect(S.due(10,T0+3*DAY)).toEqual(['fork','living-room','kitchen']);
  expect(S.stats(T0)).toMatchObject({total:3,due:1,byBox:[1,1,1,0,0]});});
test('progress survives a reload and bad saved data is ignored',()=>{const store={'sanor-srs-v1':JSON.stringify({version:1,cards:{gate:{box:3,seen:3,right:2,due:T0,last:T0},'<bad>':{box:2,due:1},gym:{box:9,due:1}}})};
  const {SanorSRS:S}=load('shared/srs.js',{storage:require('./load').memoryStorage(store)});
  expect(S.card('gate').box).toBe(3);expect(S.card('gym')).toBeNull();expect(S.stats().total).toBe(1);});
