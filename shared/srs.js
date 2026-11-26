/* SANOR QUEST · spaced review (Leitner boxes).
 * Each word sits in box 1–5. A first-try correct answer moves it up one box; a mistake or a hint sends it back
 * to box 1. A word is due again after the box's interval, so weak words come back often and known words rarely.
 *
 *   SanorSRS.record('kitchen', {correct:true, hint:false})   after the player answers a word for the first time in a round
 *   SanorSRS.due(10)                                         → up to 10 word ids to review now (most urgent first)
 *   SanorSRS.stats()                                         → {total, due, mastered, byBox:[…]}
 * The pure scheduling rules are in SanorSRS.schedule() so they can be unit tested.
 */
(function(root){'use strict';
const KEY='sanor-srs-v1',DAY=86400000;
const INTERVAL_DAYS=[0,0,1,3,7,16];   // index = box; box 1 is due straight away
const MAX_BOX=5;

function schedule(card,{correct,hint=false},now){
 const c=card?{...card}:{box:1,seen:0,right:0,due:now,last:null};
 c.seen++;c.last=now;
 if(correct&&!hint){c.right++;c.box=Math.min(MAX_BOX,c.box+1);}else c.box=1;
 c.due=now+INTERVAL_DAYS[c.box]*DAY;return c;}

function rank(cards,now,limit){return Object.entries(cards).filter(([,c])=>c.due<=now).sort((a,b)=>a[1].box-b[1].box||a[1].due-b[1].due).slice(0,limit).map(([id])=>id);}

let cards={};
function load(){try{const s=JSON.parse(root.localStorage.getItem(KEY));if(s&&s.version===1&&s.cards&&typeof s.cards==='object'){cards={};
 for(const [id,c] of Object.entries(s.cards))if(/^[a-z0-9-]{1,40}$/.test(id)&&c&&Number.isInteger(c.box)&&c.box>=1&&c.box<=MAX_BOX&&Number.isFinite(c.due))cards[id]={box:c.box,seen:+c.seen||0,right:+c.right||0,due:c.due,last:Number.isFinite(c.last)?c.last:null};}}catch{}}
function save(){try{root.localStorage.setItem(KEY,JSON.stringify({version:1,cards}));}catch{}}
load();
root.addEventListener&&root.addEventListener('storage',e=>{if(e.key===KEY||e.key===null)load();});

const api={KEY,INTERVAL_DAYS,MAX_BOX,schedule,rank,
 record(id,result,now=Date.now()){id=String(id).toLowerCase().replace(/\s+/g,'-');if(!/^[a-z0-9-]{1,40}$/.test(id))return null;cards[id]=schedule(cards[id],result,now);save();return {...cards[id]};},
 card:id=>cards[id]?{...cards[id]}:null,
 due:(limit=10,now=Date.now())=>rank(cards,now,limit),
 stats(now=Date.now()){const list=Object.values(cards),byBox=[0,0,0,0,0];list.forEach(c=>byBox[c.box-1]++);return{total:list.length,due:list.filter(c=>c.due<=now).length,mastered:byBox[MAX_BOX-1],byBox};},
 reset(){cards={};save();},reload:load};
root.SanorSRS=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
