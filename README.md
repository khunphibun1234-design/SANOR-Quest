# SANOR QUEST
เกมผจญภัยฝึกภาษาอังกฤษ · English Changes the World

เว็บแบบ static (เปิดผ่าน GitHub Pages ได้ทันที) มี 2 โลกที่เล่นได้แล้ว:

| โลก | ไฟล์ |
|---|---|
| Map 01 · My Home, My Story (3D) | `home/` และ Alex's Table `home/table-three.html` (2D สำรอง: `home/table.html`) |
| Map 02 · School Buddy | `school/` |
| ทบทวนประจำวัน 3 นาที | `review/` |

## เนื้อหา
เนื้อหาทั้งหมดอยู่ใน `content/` (JSON) ดูวิธีแก้ใน `content/README.md` · บทอัดเสียงอยู่ใน `docs/audio/`

## ระบบกลาง (`shared/`)

- `shared/sq-three.js`: เอนจิน 3D เดียวของทุกแผนที่ (Three.js r187) ต้นฉบับอยู่ที่ `src/` และวิธี build อยู่ใน `src/README.md`
- `shared/profile.js`: โปรไฟล์ผู้เล่น ทั้งชื่อเล่น ระดับ XP และตราประทับจากทุกโลก ซึ่งแสดงในพาสปอร์ต
- `shared/mission.js`: ตัวเล่นภารกิจกลาง (choice, listen, order, speak, write, tap3d)
- `shared/srs.js`: ระบบทบทวนคำแบบเว้นระยะ (Leitner 5 กล่อง) ใช้ในหน้า `review/`
- `shared/voice.js`: ฝึกพูด (ไมค์ตรวจคำ / อัดเสียงแล้วประเมินเอง / ข้าม) ผลเก็บใน profile
- `shared/writing.js`: การ์ดเขียนประโยค (แม่แบบจากการ์ดต้อนรับ Map 01) ใช้ทุกโลก
- `shared/coach.js`: ปรับความยากตามผู้เรียน (ถูกครั้งแรก >85% เสนอเลื่อนระดับ, <50% เปิดตัวช่วยเพิ่ม)
- `shared/tokens.css`: design system (ฟอนต์ Outfit + Noto Sans Thai, สี, ปุ่ม) และสไตล์ตัวช่วยภาษาไทย

### ตัวช่วยภาษาไทย 3 ระดับ
| ระดับ | คำแปลไทย |
|---|---|
| 🌱 Starter · ผู้เริ่มต้น | แสดงตลอด |
| 🧭 Explorer · นักสำรวจ | ซ่อนไว้ แตะเพื่อดู |
| 🏆 Challenger · ผู้ท้าชิง | ไม่แสดง (ภาษาอังกฤษล้วน) |

ในหน้าเกม ข้อความภาษาไทยใส่ไว้ใน `<span class="th" lang="th">` (หรือใช้ `SanorProfile.th(text)`) แล้วระบบจะซ่อนหรือแสดงให้ตามระดับเอง

### XP
ทุกโลกให้ XP ตามกติกาเดียวกัน: 20 XP ต่อหนึ่งคำหรือกิจกรรม และโบนัส 100 XP เมื่อจบภารกิจ
บันทึกผลด้วย `SanorProfile.record(mapId, activityId, {xp, stamps, done})`

## รันบนเครื่อง
```
npm install
npm run build   # หลังแก้ content/ หรือ src/
npm test        # เทสต์ทั้งหมด
npm run audio   # รายงานไฟล์เสียงที่ยังขาด
npm run serve   # แล้วเปิด http://localhost:8080
```
