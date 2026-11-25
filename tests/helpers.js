// Collect page errors and failed requests so every test can assert a clean page.
exports.watch=page=>{const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
  page.on('response',r=>{if(r.status()>=400&&!r.url().includes('fonts.g'))errors.push(r.status()+' '+r.url());});
  return errors;};
