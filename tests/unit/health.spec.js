// The scheduled health check (scripts/health-check.js) with a fake network: which problems it finds and how it
// opens, updates and closes the GitHub issue that e-mails the owner.
const {test,expect}=require('@playwright/test');const H=require('../../scripts/health-check.js');
const env={SITE_URL:'https://sq.example/',SUPABASE_URL:'https://db.example',SUPABASE_ANON_KEY:'anon',HEALTH_KEY:'k',GITHUB_TOKEN:'t',GITHUB_REPOSITORY:'me/sanor-quest'};
function net({down=[],errors=[],issue=null,comments=[]}={}){const calls=[];
  const fetch=async(url,o={})=>{calls.push([o.method||'GET',url,o.body?JSON.parse(o.body):null]);const res=(status,body)=>({ok:status<300,status,text:async()=>typeof body==='string'?body:JSON.stringify(body),json:async()=>body});
    if(url.startsWith('https://sq.example/')){const p=url.slice(19);if(down.includes(p))return res(503,'down');const m=H.PAGES.find(x=>x[0]===p);return res(200,'… '+m[1]+' …');}
    if(url.includes('health_digest'))return res(200,{activeStudents:12,events:340,classes:5,errors});
    if(url.includes('/issues?labels='))return res(200,issue?[issue]:[]);
    if(url.endsWith('/comments?per_page=100'))return res(200,comments);
    if(url.endsWith('/issues'))return res(201,{number:7});
    return res(200,{});};
  return{fetch,calls};}
test('all pages up and no errors: nothing to report',async()=>{const n=net();const r=await H.check({fetch:n.fetch,env});
  expect(r.problems).toEqual([]);expect(r.report).toContain('12 students active');expect(await H.notify(r,n)).toBe('ok');
  const digest=n.calls.find(c=>c[1].includes('health_digest'));expect(digest[2]).toEqual({p_key:'k',p_hours:6});});
test('a page down or a browser error opens an issue; the same problems do not e-mail again',async()=>{
  const n=net({down:['market/'],errors:[{page:'home/',message:'TypeError: a is null',source:'home/world.js:3',count:4}]});
  const r=await H.check({fetch:n.fetch,env});expect(r.problems).toEqual(['page /market/ HTTP 503','error on /home/: TypeError: a is null (home/world.js:3)']);
  expect(await H.notify(r,n)).toBe('opened #7');const made=n.calls.find(c=>c[0]==='POST'&&c[1].endsWith('/issues'));expect(made[2].labels).toEqual(['health-alert']);
  const again=net({down:['market/'],errors:[{page:'home/',message:'TypeError: a is null',source:'home/world.js:3',count:9}],issue:{number:7,body:made[2].body}});
  expect(await H.notify(await H.check({fetch:again.fetch,env}),again)).toBe('unchanged #7');
  const worse=net({down:['market/','school/'],issue:{number:7,body:made[2].body}});expect(await H.notify(await H.check({fetch:worse.fetch,env}),worse)).toBe('updated #7');});
test('when everything is fine again the open issue is closed',async()=>{const n=net({issue:{number:7,body:'<!-- health:abc -->'}});
  expect(await H.notify(await H.check({fetch:n.fetch,env}),n)).toBe('closed #7');expect(n.calls.some(c=>c[0]==='PATCH'&&c[2].state==='closed')).toBe(true);});
test('without Supabase or a key it still checks the pages and says what is missing',async()=>{
  const n=net();const r=await H.check({fetch:n.fetch,env:{SITE_URL:'https://sq.example',SUPABASE_URL:'',SUPABASE_ANON_KEY:''}});
  expect(r.problems).toEqual([]);expect(r.notes.join(' ')).toMatch(/demo mode/);
  expect(H.defaults({GITHUB_REPOSITORY:'Khun/sanor-quest'}).site).toBe('https://khun.github.io/sanor-quest/');});
