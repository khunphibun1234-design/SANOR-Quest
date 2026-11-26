// Every story mission in every world can be finished: answers in story order, the card's own examples pass,
// every stage happens at a real place inside the walkable area, and XP is 20 per question + 100.
const {test,expect}=require('@playwright/test');const {load}=require('./load');
const boot=()=>load(['content/content.js','shared/mission.js','shared/lesson.js']);
const {SQContent}=boot();
for(const [wid,world] of Object.entries(SQContent.worlds))for(const m of world.missions.filter(m=>m.type==='story'))
 test(`Map ${wid} · ${m.id} can be completed`,()=>{const {StoryContent,StoryLesson}=boot();const C=StoryContent(wid,m.id),l=new StoryLesson(null,C);
  for(const p of Object.values(C.places)){expect(Math.abs(p.approach[0])).toBeLessThanOrEqual(9.25);expect(Math.abs(p.approach[1])).toBeLessThanOrEqual(8.5);}
  for(const st of C.stages){expect(C.places[st.target]).toBeTruthy();
   for(const id of st.ids){const q=C.questions[id];const place=st.anyOrder?q.at:st.target;
    expect(l.nextQuestion(place)).toBe(id);expect(l.answer(id,q.kind==='order'?q.tokens:q.answer).correct).toBe(true);}}
  expect(l.finale).toBe(true);
  const card=Object.fromEntries(C.card.fields.map(f=>[f.id,f.example.en]));
  expect(l.finish(card,'ready','speaking',[0]).ok).toBe(true);
  expect(l.xp).toBe(l.total*20+100);expect(l.firstTry).toBe(l.total);});
test('all six worlds are playable and linked from the profile',()=>{const {SQContent:SQ,SanorProfile:P}=load(['content/content.js','shared/profile.js']);
 expect(Object.keys(SQ.worlds).sort()).toEqual(['01','02','03','04','05','06']);
 for(const id of ['03','04','05','06'])expect(P.WORLDS[id].href).toBe(SQ.worlds[id].slug+'/');});
