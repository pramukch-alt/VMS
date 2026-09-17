# EGAT VMS (Vehicle Management System)
### ระบบบริหารจัดการยานพาหนะและเครื่องจักรกล (ฝ่ายบริหารและก่อสร้างโรงไฟฟ้า อหก. กฟผ.)

ระบบบริหารจัดการยานพาหนะแบบครบวงจร รองรับการติดตามสถานะยานพาหนะ (51 คัน), การเปิดใบงานขอใช้รถและคืนรถ, บันทึกการเติมน้ำมัน, การซ่อมบำรุง, การแจ้งเตือนภาษีประจำปีล่วงหน้า 90 วัน, และการจัดทำรายงาน **พน. 1 ประจำเดือน** พร้อมส่งออกในรูปแบบเอกสารทางการ **VMC Form 01 (Excel 1 ไฟล์แยก Sheet ตามรายคัน / PDF 1 หน้า 1 คัน)**

---

## 🏗️ โครงสร้างสถาปัตยกรรมระบบ (Tech Stack)

- **Source Code & Repository:** [GitHub](https://github.com)
- **Database:** [Supabase](https://supabase.com) (PostgreSQL พร้อม Row Level Security & JSONB)
- **Backend API:** [Render](https://render.com) (Node.js Express + Python 3 openpyxl สำหรับสร้างไฟล์ Excel VMC Form 01)
- **Frontend SPA:** [Vercel](https://vercel.com) (React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons)

---

## 🚀 ขั้นตอนการนำขึ้นระบบจริงบนอินเทอร์เน็ต (Deployment Guide)

### ขั้นตอนที่ 1: นำโค้ดขึ้น GitHub Repository

เปิด Terminal / PowerShell ที่โฟลเดอร์โปรเจกต์ (`d:\VMS`) แล้วรันคำสั่งดังนี้:

```bash
# 1. เริ่มต้น Git
git init

# 2. เพิ่มไฟล์ทั้งหมดเข้า Git
git add .

# 3. บันทึก Commit แรก
git commit -m "Initial commit: EGAT VMS with Supabase, Render and Vercel deployment setup"

# 4. ตั้งชื่อ Branch หลักเป็น main
git branch -M main

# 5. เชื่อมต่อไปยัง Repository บน GitHub ที่สร้างไว้ (แทนที่ URL ด้วยของท่าน)
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 6. อัปโหลดขึ้น GitHub
git push -u origin main
```

---

### ขั้นตอนที่ 2: ตั้งค่าฐานข้อมูลบน Supabase

1. ไปที่ [Supabase](https://supabase.com) แล้วลงชื่อเข้าใช้
2. คลิก **"New Project"**
   - ตั้งชื่อโปรเจกต์ เช่น `vms-database`
   - กำหนดรหัสผ่านฐานข้อมูล (Database Password)
   - เลือก Region: **Singapore (ap-southeast-1)** เพื่อความเร็วสูงสุดในไทย
3. เมื่อสร้างโปรเจกต์เสร็จ ให้ไปที่เมนู **SQL Editor** ทางซ้ายมือ:
   - คลิก **"New query"**
   - คัดลอกโค้ดทั้งหมดจากไฟล์ [`supabase/schema.sql`](supabase/schema.sql) ในโปรเจกต์นี้ มาวาง
   - คลิกปุ่ม **"Run"** เพื่อสร้างตารางทั้งหมด 6 ตาราง (`vehicles`, `work_orders`, `fuel_logs`, `maintenance_records`, `email_logs`, `pn1_reports`)
4. คัดลอกกุญแจเชื่อมต่อ:
   - ไปที่ **Project Settings** -> **API**
   - คัดลอก **Project URL** (เช่น `https://xyzcompany.supabase.co`)
   - คัดลอก **service_role secret key** (คลิก reveal ก่อนคัดลอก)
5. **โอนย้ายข้อมูลจากระบบเดิมขึ้น Supabase (Run ครั้งเดียว):**
   - ในเครื่องของท่าน รันคำสั่ง:
   ```bash
   node scripts/migrate_to_supabase.js --url "https://your-project.supabase.co" --key "your-service-role-key"
   ```
   - ข้อมูลรถทั้งหมด 51 คัน, ประวัติใบงาน, น้ำมัน, และรายงาน พน.1 จะถูกบันทึกขึ้น Supabase ทันที

---

### ขั้นตอนที่ 3: นำ Backend ขึ้น Render

1. ไปที่ [Render](https://render.com) แล้วลงชื่อเข้าใช้ (สามารถ Sign in with GitHub ได้)
2. คลิก **"New +"** เลือก **"Web Service"**
3. เลือก **"Build and deploy from a Git repository"** และเลือก Repository GitHub ที่เพิ่ง Push ไป
4. ตั้งค่า Web Service:
   - **Name:** `vms-backend` (หรือชื่อที่ต้องการ)
   - **Region:** `Singapore`
   - **Language:** เลือก `Docker` (ระบบจะใช้ `Dockerfile` ในโปรเจกต์ที่มีทั้ง Node 20 และ Python 3 + openpyxl อัตโนมัติ)
   - **Instance Type:** `Free`
5. เพิ่ม **Environment Variables** (ในหัวข้อ Environment):
   - `PORT` = `5000`
   - `NODE_ENV` = `production`
   - `SUPABASE_URL` = `https://your-project.supabase.co` (จากขั้นตอนที่ 2)
   - `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key` (จากขั้นตอนที่ 2)
6. คลิก **"Create Web Service"**
   - รอระบบ Build และรันเสร็จสิ้น
   - ท่านจะได้ URL ของ Backend เช่น: `https://vms-backend-xxxx.onrender.com`
   - สามารถทดสอบเรียกดูสถานะได้ที่: `https://vms-backend-xxxx.onrender.com/api/health`

---

### ขั้นตอนที่ 4: นำ Frontend ขึ้น Vercel

1. ไปที่ [Vercel](https://vercel.com) แล้วลงชื่อเข้าใช้ (Sign in with GitHub)
2. คลิก **"Add New..."** -> **"Project"**
3. เลือก Repository GitHub ของท่านแล้วคลิก **"Import"**
4. ในหน้าตั้งค่าโปรเจกต์:
   - **Framework Preset:** `Vite` (ระบบจะตรวจพบอัตโนมัติ)
   - **Root Directory:** `./`
5. เปิดหัวข้อ **Environment Variables** แล้วเพิ่ม:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://vms-backend-xxxx.onrender.com` (ใส่ URL Backend ของ Render จากขั้นตอนที่ 3 โดย**ไม่มี** `/` ปิดท้าย)
6. คลิก **"Deploy"**
   - Vercel จะคอมไพล์โค้ดและส่งขึ้น CDN ทั่วโลกภายใน 1 นาที
   - ท่านจะได้ URL สำหรับเข้าใช้งาน เช่น `https://vms-system.vercel.app`

---

## 💻 การทดสอบและพัฒนาบนเครื่อง Local

```bash
# ติดตั้ง Dependencies
npm install

# รัน Backend และ Frontend พร้อมกันในเครื่อง
npm run dev

# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
# Health:   http://localhost:5000/api/health
```

---

## 📁 โครงสร้างโฟลเดอร์สำคัญ

```text
├── Dockerfile               # คอนเทนเนอร์สำหรับ Render (Node 20 + Python openpyxl)
├── render.yaml              # Render Blueprint สำหรับ Deploy อัตโนมัติ
├── vercel.json              # การตั้งค่า URL Rewrites บน Vercel สำหรับ SPA
├── .env.example             # ตัวอย่างการตั้งค่า Environment Variables
├── supabase/
│   └── schema.sql           # โครงสร้างตารางและดัชนีของฐานข้อมูล Supabase PostgreSQL
├── scripts/
│   ├── export_vmc_excel.py  # สคริปต์สร้างไฟล์ Excel VMC Form 01 (แยก Sheet รายคัน)
│   ├── migrate_to_supabase.js # สคริปต์ย้ายข้อมูล database.json ขึ้น Supabase
│   └── seed_db.py           # สคริปต์สร้างข้อมูลจำลองตั้งต้น
├── server/
│   ├── index.js             # Express API Server (Dual-mode: Supabase / Local JSON)
│   └── database.json        # ฐานข้อมูลสำรองในเครื่อง Local
└── src/                     # React Frontend Application (Vite + Tailwind CSS)
    ├── components/          # Pn1ExportModal, VmcForm01PrintView, etc.
    ├── pages/               # Dashboard, Vehicles, WorkOrders, Fuel, Pn1Report, etc.
    └── services/api.ts      # API Client เชื่อมโยง Backend และ Vercel
```
