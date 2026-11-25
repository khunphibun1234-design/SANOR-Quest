const {test,expect}=require('@playwright/test');const {load}=require('./load');
const boot=()=>load(['content/content.js','shared/mission.js','home/content.js','home/lesson.js']);
test('a new lesson starts at the gate with no XP',()=>{const {HomeLesson}=boot();const l=new HomeLesson();
  expect([l.stage.id,l.target(),l.xp,l.nextQuestion('gate')]).toEqual(['welcome','gate',0,'greet']);});
test('answers must follow the story order and score 20 XP each',()=>{const {HomeLesson,HomeContent:C}=boot();const l=new HomeLesson();
  expect(l.answer('name',0).accepted).toBe(false);            // not yet
  expect(l.answer('greet',1)).toMatchObject({accepted:true,correct:false});
  expect(l.answer('greet',C.questions.greet.answer)).toMatchObject({accepted:true,correct:true});
  expect(l.xp).toBe(20);expect(l.firstTry).toBe(0);
  expect(l.answer('greet',0).accepted).toBe(false);});        // already done
test('the whole story can be completed and the card is validated',()=>{const {HomeLesson,HomeContent:C}=boot();const l=new HomeLesson();
  const solve=id=>{const q=C.questions[id];return q.kind==='order'?q.tokens:q.answer;};
  for(const st of C.stages)for(const id of st.ids)expect(l.answer(id,solve(id)).correct).toBe(true);
  expect(l.stage.id).toBe('reflect');expect(l.state.completed.length).toBe(10);expect(l.xp).toBe(200);
  expect(l.finish({welcome:'Hi',room:'',activity:''},'ready','rooms',[]).ok).toBe(false);
  expect(l.finish({welcome:'Welcome to my home, Alex.',room:'This is my living room.',activity:'We cook in the kitchen.'},'ready','rooms',[0,1]).ok).toBe(true);
  expect(l.xp).toBe(300);});
test('the tour can be done in any order',()=>{const {HomeLesson,HomeContent:C}=boot();const l=new HomeLesson();
  for(const id of ['greet','name','introduce','meet']){const q=C.questions[id];l.answer(id,q.kind==='order'?q.tokens:q.answer);}
  expect(l.stage.id).toBe('tour');
  for(const id of ['garden','kitchen','bedroom']){expect(l.nextQuestion(id)).toBe(id);l.answer(id,C.questions[id].answer);}
  expect(l.stage.id).toBe('listen');});
test('saved progress is restored but tampered data is rejected',()=>{const {HomeLesson}=boot();
  const l=new HomeLesson({version:1,name:'  Ploy  ',completed:['greet','name','kitchen'],attempts:{greet:2,hack:5},aided:['nope'],done:true});
  expect(l.state.name).toBe('Ploy');expect(l.state.completed).toEqual(['greet','name']); // kitchen is not reachable yet
  expect(l.state.attempts).toEqual({greet:2});expect(l.state.aided).toEqual([]);expect(l.state.done).toBe(false);});
