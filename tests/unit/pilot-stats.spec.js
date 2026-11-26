const {test,expect}=require('@playwright/test');const P=require('../../teacher/pilot.js');const {load}=require('./load');const SQ=load('content/content.js').SQContent;
test('paired t-test matches a hand calculation',()=>{const r=P.stats.paired([40,50,55,60,45,50,65,30],[55,60,60,75,50,65,70,45]);
  expect(r.n).toBe(8);expect(r.gain).toBeCloseTo(10.625,3);expect(r.sd).toBeCloseTo(4.955,2);expect(r.t).toBeCloseTo(6.065,2);expect(r.dz).toBeCloseTo(2.144,2);expect(r.p).toBeGreaterThan(.0003);expect(r.p).toBeLessThan(.0007);});
test('t distribution: known two-tailed p values',()=>{expect(P.stats.pTwoTailed(2.262,9)).toBeCloseTo(.05,3);expect(P.stats.pTwoTailed(1.96,1e6)).toBeCloseTo(.05,3);expect(P.stats.pTwoTailed(0,5)).toBeCloseTo(1,6);});
test('mission steps come from content in play order, ending with the writing card',()=>{const s=P.stepsOf(SQ,'02','timetable');
  expect(s.map(x=>x.item)).toEqual(['gate','nervous','timetable','english','after-lunch','classroom','this-is','finale']);});
