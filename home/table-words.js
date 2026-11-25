/* Alex's Table content adapter. The content lives in content/worlds/01-home.json (mission "table").
 * AlexTableWords: [word, Alex's line, label, emoji, English hint, Thai word, Thai line, Thai hint]
 * AlexTableOptions[i]: the three choices shown for item i, as item indexes. */
(function(root){'use strict';
const SQ=root.SQContent,items=SQ.worlds['01'].missions.find(m=>m.id==='table').items;
const wordTh=id=>(SQ.words.find(w=>w.id===id)||{}).th||'';
root.AlexTableWords=items.map(it=>[it.word,it.line.en,it.label,it.emoji,it.hint.en,wordTh(it.word),it.line.th,it.hint.th]);
root.AlexTableOptions=items.map(it=>it.choices.map(c=>items.findIndex(x=>x.word===c)));
})(typeof window!=='undefined'?window:globalThis);
