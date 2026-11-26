# เนื้อหาของเกม (content)

**เนื้อหาทั้งหมดของ SANOR QUEST อยู่ในโฟลเดอร์นี้** โค้ดในหน้าเกมแค่อ่านไปแสดง

| ไฟล์ | มีอะไร |
|---|---|
| `words.json` | คลังคำกลาง: คำ, คำแปล, ระดับ CEFR, หมวด, โลกที่ใช้, ไฟล์เสียงของคำ และประโยคตัวอย่าง |
| `worlds/01-home.json` | Map 01: `welcome` → `table` (Lunch with Alex) → `garden` (บ่ายวันสบายในสวน) |
| `worlds/02-school.json` | Map 02: `timetable` → `tour` → `club` (+ `buddy` แบบฝึกเร็ว 2D สำรอง) |
| `worlds/03-phibun.json` | Map 03: `guide` (บรรยายสถานที่) → `songkran` (there is/are) → `plans` (past simple) |
| `worlds/04-market.json` | Map 04: `shopping` (How much…? ตัวเลข) → `meal` (Can I have…?) → `party` (งบประมาณ 300 บาท) |
| `worlds/05-travel.json` | Map 05: `directions` (เวลา ถามทาง) → `hotel` (เช็กอิน) → `lostbag` (ขอความช่วยเหลือ) |
| `worlds/06-future.json` | Map 06: `design` (First, then, finally) → `ideas` (เสนอความคิด) → `present` (นำเสนองาน) |
| `content.js` | **สร้างอัตโนมัติ** อย่าแก้เอง |

## แก้เนื้อหาอย่างไร
1. แก้ไฟล์ `.json` (ข้อความทุกช่องมี `en` และ `th`; ช่อง `audio` คือชื่อไฟล์ใน `audio/`)
2. รัน `npm run build:content` ระบบจะตรวจความถูกต้องก่อน แล้วสร้าง `content.js`
3. รัน `npm run audio` เพื่ออัปเดตบทอัดเสียงใน `docs/audio/`
4. รัน `npm test`

## สิ่งที่ทุกภารกิจต้องมี (ระบบตรวจให้)
- งานพูด 1 ข้อ: `speak` = `{id, prompt:{en,th}, target:{en,th}}` (หรือรายการ `speaking` แบบ Map 01)
- การ์ดเขียน (ถ้ามี) `card.fields[].rules` และตัวอย่าง (`example`) ต้องผ่านกฎของตัวเอง

## โครงสร้างของโลก (world)
- `places`: สถานที่ในฉาก 3D (`pos` ตำแหน่งป้าย, `approach` จุดยืนคุย) ทุกภารกิจในโลกใช้ร่วมกัน
- `missionOrder`: ลำดับภารกิจ ภารกิจถัดไปจะเปิดเมื่อภารกิจก่อนหน้าเสร็จ ทุกภารกิจต้องมี `summary` (en/th)
- ภารกิจแบบ `story`: `stages` (ด่านละสถานที่ คำถามเรียงตามลำดับ หรือ `anyOrder` ไปที่ไหนก่อนก็ได้ โดยคำถามบอก `at`) → ด่านสุดท้ายไม่มีคำถาม = การ์ดเขียน + งานพูด + สะท้อนคิด
- คำถามแสดงตารางได้ด้วย `table: {caption, head, rows}` (เช่น ตารางเรียน)

## ประเภทโจทย์ (`kind`) ที่ตัวเล่นภารกิจกลาง (`shared/mission.js`) รองรับ
| kind | ผู้เล่นทำอะไร | ฟิลด์ที่ต้องมี |
|---|---|---|
| `choice` | เลือกคำตอบ | `choices`, `answer` |
| `listen` | ฟังแล้วเลือก (ซ่อนข้อความไว้ก่อน) | `choices`, `answer` |
| `order` | เรียงคำเป็นประโยค | `tokens` (ลำดับที่ถูก) |
| `speak` | พูดประโยค (มีไมค์ หรือกด "I said it") | `target` |
| `write` | เขียนประโยคสั้น ๆ | `rules`: `minWords`, `all`, `any` (regex) |
| `tap3d` | แตะของในฉาก 3D | `answer` (id ของของในฉาก) |
