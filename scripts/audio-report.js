// Lists every line the game plays aloud and whether its recording exists.
// Writes a recording script per world to docs/audio/. Run: npm run audio
//   --strict  exit with an error when a recording is missing (use before releasing a map)
const fs=require('fs'),path=require('path');const {ROOT,load,spokenLines}=require('./content-lib');
const data=load(),lines=spokenLines(data),have=new Set(fs.readdirSync(path.join(ROOT,'audio')).filter(f=>f.endsWith('.mp3')));
const used=new Set(lines.map(l=>l.audio).filter(Boolean));
const groups={};for(const l of lines){(groups[l.world]||(groups[l.world]=[])).push(l);}
fs.mkdirSync(path.join(ROOT,'docs/audio'),{recursive:true});let missing=0,broken=0;
for(const [world,list] of Object.entries(groups)){
  const seen=new Set(),rows=[];for(const l of list){if(seen.has(l.en))continue;seen.add(l.en);
    const status=!l.audio?'ยังไม่มี':have.has(l.audio)?'มีแล้ว':'ไฟล์หาย';if(status==='ยังไม่มี')missing++;if(status==='ไฟล์หาย')broken++;
    rows.push(`| ${rows.length+1} | ${status==='มีแล้ว'?'✅':'⬜'} | ${l.en.replace(/\|/g,'\\|')} | ${l.th.replace(/\|/g,'\\|')} | \`${l.audio||l.suggest}\` | ${l.where} |`);}
  const title=world==='words'?'คลังคำศัพท์ (words.json)':`Map ${world} · ${data.worlds[world].title.en}`;
  const todo=rows.filter(r=>r.includes('⬜')).length;
  fs.writeFileSync(path.join(ROOT,`docs/audio/${world==='words'?'words':world+'-'+data.worlds[world].slug}.md`),
`# บทอัดเสียง · ${title}

สร้างอัตโนมัติด้วย \`npm run audio\` · อย่าแก้ไฟล์นี้เอง

- ต้องอัดเพิ่ม **${todo}** ไฟล์ จากทั้งหมด ${rows.length} ประโยค
- อัดเป็น .mp3 (mono, 44.1 kHz) ตั้งชื่อไฟล์ตามคอลัมน์ "ชื่อไฟล์" แล้วส่งมาทั้งชุด
- \`{name}\` คือชื่อเล่นของผู้เล่น: ให้พูดว่า "Mook" แทน

| # | สถานะ | ประโยคภาษาอังกฤษ | คำแปล | ชื่อไฟล์ | ใช้ที่ |
|---|---|---|---|---|---|
${rows.join('\n')}
`);}
const orphans=[...have].filter(f=>!used.has(f));
console.log(`Spoken lines: ${new Set(lines.map(l=>l.en)).size} · recorded: ${used.size} · missing: ${missing} · broken links: ${broken}`);
if(orphans.length)console.log('Recordings no longer used: '+orphans.join(', '));
console.log('Recording scripts written to docs/audio/');
if(broken||(process.argv.includes('--strict')&&missing))process.exit(1);
