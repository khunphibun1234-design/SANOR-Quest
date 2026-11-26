// Makes <slug>/index.html for a 3D story world from the Map 02 page (same layout, shared/story.js engine).
// Usage: node scripts/make-map-page.js <slug>   (settings for each world are below)
const fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'..');
const WORLDS={
 phibun:{id:'03',title:'Phibun Hometown Quest',tag:'PHIBUN HOMETOWN',icon:'🏞️',h2:['Local stories.','Shared with the world.'],intro:'Alex is visiting Phibun Mangsahan. Be his young local guide. Choose a mission.',introTh:'Alex มาเที่ยวพิบูลมังสาหาร เป็นไกด์ท้องถิ่นตัวน้อยให้เขา เลือกภารกิจที่จะเล่น',place:'Town square',sky:'A SUNNY DAY BY THE MUN RIVER',report:['Great guide,','great hometown.'],aria:'A 3D riverside town with Kaeng Saphue rapids. Walk, zoom and rotate to explore.',desc:'Show Alex Kaeng Saphue, the Mun River and Songkran in English.'},
 market:{id:'04',title:'Market & Food Street',tag:'MARKET & FOOD STREET',icon:'🛒',h2:['Good food.','Great conversations.'],intro:'Shop, order food and plan a party with Alex. Choose a mission.',introTh:'ซื้อของ สั่งอาหาร และวางแผนจัดปาร์ตี้กับ Alex เลือกภารกิจที่จะเล่น',place:'Market gate',sky:'A BUSY MORNING AT THE MARKET',report:['Smart shopper,','happy friends.'],aria:'A 3D market street with food stalls. Walk, zoom and rotate to explore.',desc:'Ask for prices, order food and plan a party on a budget in English.'},
 travel:{id:'05',title:'Around the World',tag:'AROUND THE WORLD',icon:'✈️',h2:['Take your English','further.'],intro:'Travel with Alex: an airport, a train station and a hotel. Choose a mission.',introTh:'ออกเดินทางกับ Alex ทั้งสนามบิน สถานีรถไฟ และโรงแรม เลือกภารกิจที่จะเล่น',place:'Airport',sky:'A TRIP ABROAD',report:['Confident traveller,','clear English.'],aria:'A 3D travel world with an airport, a station and a hotel. Walk, zoom and rotate to explore.',desc:'Read travel times, ask for directions and get help when travelling, in English.'},
 future:{id:'06',title:'Future Makers City',tag:'FUTURE MAKERS CITY',icon:'🤖',h2:['Small ideas.','A better tomorrow.'],intro:'Design a better city with Alex and present your plan. Choose a mission.',introTh:'ออกแบบเมืองที่ดีขึ้นกับ Alex แล้วนำเสนอแผนของคุณ เลือกภารกิจที่จะเล่น',place:'City hall',sky:'BUILDING TOMORROW',report:['Great makers,','a better city.'],aria:'A 3D future city with a robot lab and an energy park. Walk, zoom and rotate to explore.',desc:'Explain steps, share ideas and present a city plan in English.'}};
const slug=process.argv[2],w=WORLDS[slug];if(!w){console.error('Unknown world. Use one of: '+Object.keys(WORLDS).join(', '));process.exit(1);}
let s=fs.readFileSync(path.join(ROOT,'school/index.html'),'utf8');
const rep=(a,b)=>{if(!s.includes(a))throw Error('template changed, missing: '+a.slice(0,60));s=s.split(a).join(b);};
rep('<title>SANOR QUEST · School of Adventures</title>',`<title>SANOR QUEST · ${w.title}</title>`);
s=s.replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="SANOR QUEST Map ${w.id} · ${w.title}. ${w.desc}">`);
rep('<link rel="stylesheet" href="school3d.css">','<link rel="stylesheet" href="../school/school3d.css">');
rep('aria-label="A 3D school. Walk, zoom and rotate to explore."',`aria-label="${w.aria}"`);
rep('MAP 02 <i>•</i> SCHOOL OF ADVENTURES',`MAP ${w.id} <i>•</i> ${w.tag}`);
rep('<h1 id="missionTitle">Read the Timetable</h1>',`<h1 id="missionTitle">${w.title}</h1>`);
rep('<strong id="locationName">School gate</strong><small>A SCHOOL DAY IN PHIBUN</small>',`<strong id="locationName">${w.place}</strong><small>${w.sky}</small>`);
rep('<div class="intro-art">🏫 <small>02</small></div><div class="eyebrow">MAP 02 · SCHOOL OF ADVENTURES</div><h2>New friends.<br><em>New possibilities.</em></h2><p>Alex is new at your school. Be his buddy. Choose a mission.<span class="th" lang="th">Alex เป็นนักเรียนใหม่ เป็นเพื่อนคู่หูของเขา เลือกภารกิจที่จะเล่น</span></p>',
 `<div class="intro-art">${w.icon} <small>${w.id}</small></div><div class="eyebrow">MAP ${w.id} · ${w.tag}</div><h2>${w.h2[0]}<br><em>${w.h2[1]}</em></h2><p>${w.intro}<span class="th" lang="th">${w.introTh}</span></p>`);
rep('aria-label="Missions in Map 02"',`aria-label="Missions in Map ${w.id}"`);
rep('<a class="old-world" href="quiz.html">Quick practice without 3D · 10 words →</a><a class="old-world" href="../#map-02">← Back to town</a>',`<a class="old-world" href="../#map-${w.id}">← Back to town</a>`);
rep('<div class="eyebrow">WELCOME TO OUR SCHOOL</div>',`<div class="eyebrow">WELCOME TO MAP ${w.id}</div>`);
rep('<b>03 · Look around the school</b>','<b>03 · Look around</b>');
rep('<h2 id="reportTitle">Great buddy,<br><em>great school day.</em></h2>',`<h2 id="reportTitle">${w.report[0]}<br><em>${w.report[1]}</em></h2>`);
rep('download="SANOR-QUEST-School-Report.pdf"',`download="SANOR-QUEST-Map-${w.id}-Report.pdf"`);
rep('<button id="exploreBtn" class="secondary">Explore the school</button>','<button id="exploreBtn" class="secondary">Keep exploring</button>');
rep('You can still practise the same words in <a href="quiz.html">School Buddy (2D)</a>, or open the game in a newer browser.','You can still practise the words in the <a href="../review/">Daily Review</a>, or open the game in a newer browser.');
rep('<script src="world.js"></script>','<script src="../shared/props.js"></script><script src="world.js"></script>');
rep('<script src="school3d.js"></script>','<script src="config.js"></script>');
fs.mkdirSync(path.join(ROOT,slug),{recursive:true});fs.writeFileSync(path.join(ROOT,slug,'index.html'),s);console.log(slug+'/index.html written');
