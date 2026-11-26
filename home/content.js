/* Map 01 content adapter: the welcome mission (content/worlds/01-home.json) in the shape home.js and the
 * town map use. Other story missions are reshaped on demand by StoryContent() in shared/lesson.js. */
(function(root){'use strict';
const SQ=root.SQContent,C=root.StoryContent('01','welcome');
const wordTh=id=>(SQ.words.find(w=>w.id===id.replace(/\s+/g,'-'))||{}).th||'';
C.vocabulary=C.mission.vocabulary.map(v=>[v.word,v.label,v.example.en,wordTh(v.word),v.example.th||'']);
root.HomeContent=C;
})(typeof window!=='undefined'?window:globalThis);
