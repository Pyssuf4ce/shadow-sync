# SHADOW SYNC

เกมแอ็กชันดวลบอสมุมบน 1 ต่อ 1 เล่นบนเบราว์เซอร์ คุณคือ Hikari สู้กับ Kage-07 เงาที่เรียนรู้ท่าของคุณระหว่างแมตช์ ยิ่งเล่นซ้ำ มันยิ่งอ่านขาด

## เล่น

```bash
python -m http.server 8765
```

เปิด `http://localhost:8765/game.html` เพื่อเล่น และ `http://localhost:8765/index.html` เพื่อดูหน้าแนะนำเกม (สไลด์ 14 หน้า) หรือดับเบิลคลิก `game.html` เปิดตรง ๆ ก็ได้

## ปุ่ม

| ปุ่ม | ทำอะไร |
|---|---|
| WASD | เดิน |
| เมาส์ | เล็ง คลิกซ้ายยิง |
| Space | แดช |
| E | STAR RAIN |
| Q | PRISM BURST (ไม้ตาย) |
| Tab | ซ่อน/แสดงแผง Shadow Eye |
| L | เปิด/ปิดโหมดอ่านท่า |
| M / P | ปิดเสียง / พัก |

## เกี่ยวกับ AI ในเกม

Kage-07 เป็น adaptive game AI เขียนเองด้วย JavaScript ใช้อัลกอริทึม Hedge (online learning แบบเบา) ร่วมกับการให้คะแนนท่าและ state machine เรียนรู้สดในเบราว์เซอร์ ไม่ใช้โมเดลสำเร็จรูปหรืออินเทอร์เน็ต และไม่ใช่ deep learning รายละเอียดอยู่ใน [DESIGN.md](DESIGN.md)

ยังไม่ได้เพลย์เทสต์กับผู้เล่นจริง ตัวเลขความยากตั้งจากบอทจำลอง ปรับได้ที่ตาราง `DIFF` ใน `game.html`

## ไฟล์

- `game.src.html` ต้นฉบับของเกม (แก้ที่ไฟล์นี้)
- `game.html` ตัวที่ใช้งานจริง สร้างจาก `game.src.html` ด้วย `npm run build` (โค้ดถูกห่อและพรางแล้ว **ห้ามแก้ตรง ๆ**) และต้อง commit ไฟล์นี้ด้วยเพราะ Vercel ส่งไฟล์นี้ให้ผู้เล่น
- `characters.js` วาดและขยับตัวละครด้วย Canvas
- `index.html` หน้าแนะนำเกม (สไลด์ 14 หน้า ฝัง `game.html`)
- `sheet.html` หน้าทดสอบตัวละคร
- `tools/build.mjs` สคริปต์สร้าง `game.html` (`npm install` ก่อนครั้งแรก)
- `DESIGN.md` บันทึกการออกแบบ รวมถึงชั้นป้องกันการโกง

## สร้างและส่งขึ้น Vercel

```bash
npm install          # ครั้งแรกเท่านั้น
npm run build        # สร้าง game.html จาก game.src.html
npm run build:test   # สร้าง game.test.html (ตัวแปรยังเรียกได้ ไว้ทดสอบ ไม่ commit)
```

หลังแก้ `game.src.html` ให้รัน `npm run build` แล้ว commit ทั้ง `game.src.html` และ `game.html` ก่อน push
