// Collect page errors and failed requests so every test can assert a clean page.
exports.watch=page=>{const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
  page.on('response',r=>{if(r.status()>=400&&!r.url().includes('fonts.g'))errors.push(r.status()+' '+r.url());});
  return errors;};
// Time limit for tests that play a whole 3D mission. On GitHub's runners (2 workers, software WebGL) one mission
// took 4–6 minutes and a slow run went past the old 8-minute limit; locally the same tests take 1–3 minutes.
exports.MISSION_TIMEOUT=15*60_000;
