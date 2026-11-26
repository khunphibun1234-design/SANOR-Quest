# SANOR QUEST
เกมผจญภัยฝึกภาษาอังกฤษ · English Changes the World

เว็บแบบ static (เปิดผ่าน GitHub Pages ได้ทันที) มี 2 โลกที่เล่นได้แล้ว:

| โลก | ไฟล์ |
|---|---|
| Map 01 · My Home, My Story (3D) · 3 ภารกิจ | `home/` (ภารกิจ 2 Lunch with Alex: `home/table-three.html`; 2D สำรอง: `home/table.html`) |
| Map 02 · School of Adventures (3D) · 3 ภารกิจ | `school/` (2D สำรอง: `school/quiz.html`) |
| Map 03 · Phibun Hometown (3D) · 3 ภารกิจ | `phibun/` |
| Map 04 · Market & Food Street (3D) · 3 ภารกิจ | `market/` |
| Map 05 · Around the World (3D) · 3 ภารกิจ | `travel/` |
| Map 06 · Future Makers City (3D) · 3 ภารกิจ | `future/` |
| ทบทวนประจำวัน 3 นาที | `review/` |
| แบบทดสอบก่อน/หลังเรียน | `test/?kind=pre` · `test/?kind=post` (ข้อสอบ: `content/tests.json`) |
| **แดชบอร์ดครู** | `teacher/` (แท็บ "การทดลอง": เวลาเล่น จุดที่ติด ความเห็น สถิติก่อน/หลัง) · แบบสังเกต `teacher/observation.html` · แผนทดลอง `docs/PILOT-PLAN.md` |

## พร้อมใช้ในห้องเรียน
- **เล่นออฟไลน์ / ติดตั้งลงมือถือ:** `sw.js` (สร้างโดย `npm run build:sw`) + `manifest.webmanifest`
- **การเข้าถึง:** ทุกหน้าผ่าน WCAG 2.1 AA (axe-core), เล่นด้วยคีย์บอร์ดได้ครบ, โหมดลดการเคลื่อนไหว
- **PDPA:** `privacy/` นโยบายความเป็นส่วนตัว · `consent/` แบบฟอร์มยินยอมผู้ปกครอง · ปุ่มลบข้อมูลของฉัน (passport) · ครูลบห้องได้ · ไมค์ตรวจเสียงพูดปิดไว้เป็นค่าเริ่มต้น
- **คู่มือครู:** `teacher/guide.html` (1 หน้า A4) · วิดีโอ 3 นาที: `scripts/record-guide-video.js` + บทพากย์ `docs/video-script.md`

## ระบบห้องเรียน
นักเรียนกด **🏫 Join my class** แล้วใส่รหัสห้อง + เลขที่ + ชื่อเล่น + PIN 4 หลัก (ถ้าไม่เข้าห้องก็ยังเล่นได้ตามปกติ)
ผลการเล่นเก็บในเครื่องก่อน แล้วส่งขึ้นเซิร์ฟเวอร์เมื่อมีอินเทอร์เน็ต (`shared/sync.js`)
ฐานข้อมูลคือ Supabase (`supabase/migrations/`) ดูวิธีตั้งค่าใน **`docs/SETUP-SUPABASE.md`** ถ้ายังไม่ตั้งค่า ระบบจะทำงานใน **โหมดทดลอง** ซึ่งเก็บข้อมูลในเบราว์เซอร์

## เนื้อหา
เนื้อหาทั้งหมดอยู่ใน `content/` (JSON) ดูวิธีแก้ใน `content/README.md` · บทอัดเสียงอยู่ใน `docs/audio/`

## ระบบกลาง (`shared/`)

- `shared/sq-three.js`: เอนจิน 3D เดียวของทุกแผนที่ (Three.js r187) ต้นฉบับอยู่ที่ `src/` และวิธี build อยู่ใน `src/README.md`
- `shared/profile.js`: โปรไฟล์ผู้เล่น ทั้งชื่อเล่น ระดับ XP และตราประทับจากทุกโลก ซึ่งแสดงในพาสปอร์ต
- `shared/story.js` + `shared/lesson.js`: เอนจินเรื่องราว 3D ที่ทุกแผนที่ใช้ร่วมกัน (เดิน คุย ภารกิจหลายภารกิจ การ์ดเขียน งานพูด ตราประทับ และรายงานที่พิมพ์ได้) แผนที่ใหม่มีแค่ฉาก 3D (`world.js`) กับไฟล์ตั้งค่าสั้น ๆ
- `shared/mission.js`: ตัวเล่นภารกิจกลาง (choice, listen, order, speak, write, tap3d)
- `shared/srs.js`: ระบบทบทวนคำแบบเว้นระยะ (Leitner 5 กล่อง) ใช้ในหน้า `review/`
- `shared/voice.js`: ฝึกพูด (ไมค์ตรวจคำ / อัดเสียงแล้วประเมินเอง / ข้าม) ผลเก็บใน profile
- `shared/props.js`: ชุดฉากสำเร็จรูป (อาคาร แผงร้าน ต้นไม้ น้ำ ฝูงคน) ใช้สร้างโลก 3D ของ Map 03–06 · หน้าโลกใหม่สร้างด้วย `node scripts/make-map-page.js`
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
