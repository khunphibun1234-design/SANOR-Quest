// Load a browser script into a fresh sandbox (with an in-memory localStorage) for unit tests.
const fs=require('fs'),path=require('path'),vm=require('vm');
function memoryStorage(seed={}){const m=new Map(Object.entries(seed));return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),_map:m};}
exports.load=(files,{storage=memoryStorage()}={})=>{const sb={localStorage:storage,console,Date,JSON,Math};sb.window=sb;sb.globalThis=sb;vm.createContext(sb);
  for(const f of [].concat(files))vm.runInContext(fs.readFileSync(path.join(__dirname,'../..',f),'utf8'),sb,{filename:f});return sb;};
exports.memoryStorage=memoryStorage;
