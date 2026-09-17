# Vehicle Management System (VMS) — Technical & UI/UX Specification

เอกสารข้อกำหนดการออกแบบและการพัฒนาระบบบริหารจัดการยานพาหนะ (VMS) สำหรับการใช้งานในองค์กร โดยครอบคลุมทั้งยานพาหนะสำหรับเดินทางและรถเครื่องจักรกล

---

## 1. Antigravity Hand-off Prompt (สำหรับคัดลอกส่งต่อ)

```text
โปรดออกแบบและพัฒนาระบบ Vehicle Management System (VMS) ในรูปแบบ Web Application โมเดิร์น สะอาดตา รองรับภาษาไทยสมบูรณ์แบบด้วยฟอนต์ 'IBM Plex Sans Thai' 

[บริบทและประเภทรถ]
ระบบจัดเก็บข้อมูลยานพาหนะ 2 หมวดหลัก:
1. ยานพาหนะแบบใช้เดินทาง
2. รถเครื่องจักรกล
อ้างอิงฟิลด์ข้อมูลจาก Database.xlsx (เช่น เลขทะเบียนภายใน กฟผ., ทะเบียนรถ, ยี่ห้อ/รุ่น, คุณลักษณะ, Base Location, วันจดทะเบียน, วันครบกำหนดชำระภาษี, ยอดภาษี)

[ความต้องการเชิงฟังก์ชันหลัก (Core Features)]
1. Vehicle Master & Maintenance: บันทึกประวัติซ่อมบำรุง, ประวัติตรวจสภาพ ตรอ., วันครบกำหนดชำระภาษี และยอดภาษีประจำปี
2. Email Alert System: Background worker ส่ง Email แจ้งเตือนฝ่ายที่เกี่ยวข้องล่วงหน้า 3 เดือน ก่อนถึงกำหนดชำระภาษี
3. Self-Service Work Order: 
   - ระบบเปิดให้พนักงานสร้าง Work Order เพื่อเบิกใช้งานได้เองทันทีโดยไม่ต้องผ่านขั้นตอน Approval
   - อนุญาตให้เลือกรถที่อยู่ในสถานะ "จอดรองาน" เท่านั้น
   - เมื่อกดบันทึก (Save & Dispatch) สถานะรถจะเปลี่ยนเป็น "ใช้งาน" ทันที
   - บังคับบันทึกเลขไมล์เริ่มต้น (Start Mileage)
   - เมื่อส่งคืนรถ (Complete Work Order) ให้กรอกเลขไมล์สิ้นสุด (End Mileage) ระบบจะคำนวณระยะทางรวม และปรับสถานะรถกลับเป็น "จอดรองาน" อัตโนมัติ
4. Fuel & Mileage Tracking: ฟอร์มและเอกสารบันทึกการเติมเชื้อเพลิง (วันเวลา, เลขไมล์, จำนวนลิตร, ยอดเงิน, เลขที่ใบเสร็จ) เชื่อมโยงกับประวัติรถและ Work Order

[Design System & UI Guidelines]
- Typography: 'IBM Plex Sans Thai', sans-serif (น้ำหนัก 300, 400, 500, 600, 700)
- Brand Colors:
  * Desert Sun: #DC9750
  * Dark Blue: #1E2640
- Neutrals & Backgrounds:
  * White (Card/Surface): #FFFFFF
  * Light Gray (Main Background): #F4F6F9
  * Border & Divider: #E2E8F0
- Typography & Supporting:
  * Primary Text: #1E2640
  * Muted Text: #64748B
  * Warm Amber (Soft Highlight/Badge): #FEF3E7
- สถานะรถ (Status Badge):
  * ใช้งาน (In Use): Badge สีเขียว Soft
  * จอดรองาน (Standby/Ready): Badge Desert Sun / Warm Amber (#FEF3E7 + ข้อความ #DC9750)
  * รอซ่อม/ตรวจสภาพ (Maintenance): Badge สีแดง/ส้ม Soft

ให้จัดทำ UI Wireframe ครอบคลุม: Dashboard ภาพรวม, ตารางข้อมูลยานพาหนะพร้อม Drawer แสดงประวัติ, หน้าบันทึก Work Order แบบ Fast Form (Self-Service), และหน้ารายงานเชื้อเพลิง/ภาษี
```

---

## 2. Design System

### 2.1 Color Palette

| ประเภทสี | ชื่อสี | Hex Code | RGB | การนำไปใช้งาน |
| :--- | :--- | :--- | :--- | :--- |
| **Brand Primary** | Desert Sun | `#DC9750` | `220, 151, 80` | ปุ่ม Primary Action, จุดเน้นสำคัญ, ไอคอนเด่น |
| **Brand Secondary** | Dark Blue | `#1E2640` | `30, 38, 64` | แถบ Sidebar Menu, Header สำคัญ, ตัวอักษรหัวข้อ |
| **Surface** | White | `#FFFFFF` | `255, 255, 255` | พื้นหลัง Card, Modal, Input Field, Table Container |
| **Background** | Light Gray | `#F4F6F9` | `244, 246, 249` | พื้นหลังของ Layout หน้าจอ Dashboard |
| **Border** | Border Gray | `#E2E8F0` | `226, 232, 240` | เส้นขอบการ์ด, เส้นแบ่งแถวตาราง, Input Border |
| **Text Primary** | Primary Text | `#1E2640` | `30, 38, 64` | เนื้อหาหลัก, หัวเรื่อง H1-H4, Label สำคัญ |
| **Text Secondary** | Muted Text | `#64748B` | `100, 116, 139` | คำอธิบายกำกับ, วันเวลา, Header ของ Table |
| **Accent / Highlight** | Warm Amber | `#FEF3E7` | `254, 243, 231` | พื้นหลัง Badge สถานะ "จอดรองาน", แถบ Highlight แจ้งเตือน |

### 2.2 Typography
*   **Font Family:** `'IBM Plex Sans Thai'`, sans-serif
*   **Font Import:**
    ```html
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    ```
*   **Type Hierarchy:**
    *   `Display/Page Title`: 24px - 28px, Semi-bold (`font-weight: 600`), สี `#1E2640`
    *   `Section Title / Card Header`: 18px - 20px, Medium (`font-weight: 500`), สี `#1E2640`
    *   `Body / Table Content`: 14px - 15px, Regular (`font-weight: 400`), สี `#1E2640`
    *   `Caption / Table Header / Helper Text`: 12px - 13px, Regular/Medium, สี `#64748B`

### 2.3 Component Styling & Tokens
*   **Border Radius:** 
    *   Card / Containers: `8px` หรือ `12px` (มุมโค้งมนระดับกลาง ดูทันสมัย)
    *   Input / Buttons: `6px` หรือ `8px`
    *   Badges / Status Pill: `9999px` (Rounded Full)
*   **Elevation (Shadows):**
    *   `Card Shadow`: `0 1px 3px 0 rgba(30, 38, 64, 0.05), 0 1px 2px 0 rgba(30, 38, 64, 0.03)`
    *   `Dropdown / Modal Shadow`: `0 10px 15px -3px rgba(30, 38, 64, 0.1)`

---

## 3. สถาปัตยกรรมระบบ (System Architecture)

### 3.1 Tech Stack
*   **Frontend:** Next.js (App Router) หรือ Vite + React.js, Tailwind CSS (Custom Color Configuration), Lucide Icons
*   **Backend:** Node.js (NestJS / Express) หรือ Python (FastAPI)
*   **Database:** PostgreSQL (Relational Database แนะนำสำหรับการเชื่อมโยงข้อมูลรถและประวัติการเบิก/ซ่อม)
*   **Task Scheduler:** Cron Job / BullMQ รันทุกวันเวลา 08:00 น. เพื่อสแกนภาษีครบกำหนดในอีก 90 วัน และส่ง Email ผ่าน SMTP

---

## 4. โครงสร้างฐานข้อมูล (Database Schema)

```
+-----------------------------------+          +-----------------------------------+
|             vehicles              |          |            work_orders            |
+-----------------------------------+          +-----------------------------------+
| id (PK, UUID/Int)                 | 1      * | id (PK)                           |
| internal_id (เลขทะเบียนภายใน กฟผ.) |<---------| vehicle_id (FK)                   |
| license_plate (เลขทะเบียนรถ)      |          | requester_name (ชื่อผู้ใช้งาน)     |
| category (เดินทาง/เครื่องจักรกล)   |          | department (แผนก/หน่วยงาน)         |
| brand (ยี่ห้อ)                     |          | purpose (วัตถุประสงค์การใช้)       |
| model (รุ่น)                      |          | start_datetime (วันเวลาเริ่ม)      |
| status (จอดรองาน/ใช้งาน/รอซ่อม)   |          | end_datetime (วันเวลาสิ้นสุด)      |
| tax_due_date (วันครบกำหนดภาษี)    |          | start_mileage (เลขไมล์เริ่มต้น)    |
| tax_amount (ยอดเงินภาษี)          |          | end_mileage (เลขไมล์สิ้นสุด)       |
| base_location (สถานที่ประจำรถ)    |          | status (IN_PROGRESS/COMPLETED)    |
+-----------------------------------+          +-----------------------------------+
           | 1                     | 1
           |                       |
           | *                     | *
+-----------------------+   +-----------------------+
|  maintenance_records  |   |       fuel_logs       |
+-----------------------+   +-----------------------+
| id (PK)               |   | id (PK)               |
| vehicle_id (FK)       |   | vehicle_id (FK)       |
| type (ซ่อมบำรุง/ตรอ.)  |   | work_order_id (FK,opt)|
| service_date          |   | refuel_date           |
| next_due_date         |   | liters                |
| cost                  |   | total_amount          |
| remarks               |   | odometer              |
+-----------------------+   | receipt_no            |
                            +-----------------------+
```

---

## 5. UI/UX Wireframe & Flow Breakdown

### 5.1 Dashboard Overview (หน้าหลัก)
*   **Top Bar:** โลโก้ระบบ VMS, โปรไฟล์ผู้ใช้, Notification Center (แจ้งเตือนภาษี/ตรวจสภาพ)
*   **Metric Cards (4 การ์ด):**
    1. จำนวนยานพาหนะทั้งหมด (Total Vehicles)
    2. ยานพาหนะที่พร้อมใช้งาน ("จอดรองาน" - Badge สี Desert Sun)
    3. กำลังถูกใช้งาน ("ใช้งาน" - Badge สีเขียว)
    4. ใกล้ครบกำหนดภาษีใน 3 เดือน (เตือนจำนวนคัน - Badge สีแดง/ส้ม)
*   **Tax Due Alert Banner:** กล่องข้อความสี `Warm Amber` (#FEF3E7) แสดงรายการรถที่ภาษีจะหมดอายุใน 90 วัน พร้อมปุ่มลัด "ส่งอีเมลแจ้งเตือนอีกครั้ง"

### 5.2 Vehicle Master View (ทะเบียนยานพาหนะ)
*   **Filters:** แถบค้นหาทะเบียนรถ, สลับหมวด (รถเดินทาง / เครื่องจักรกล), สถานะรถ
*   **Data Table:**
    *   หัวตารางสีพื้นอ่อน Text สี `#64748B`
    *   แถวแสดงข้อมูลชัดเจน: ทะเบียน กฟผ. | ทะเบียนรถ | แบรนด์/รุ่น | ประเภท | ประจำที่ | สถานะ | วันหมดอายุภาษี
    *   คลิกที่แถวเพื่อเปิด **Side Drawer** ดูรายละเอียดเชิงลึก:
        *   แท็บประวัติการซ่อมบำรุง & ตรวจสภาพ ตรอ.
        *   แท็บประวัติการเติมเชื้อเพลิง
        *   แท็บประวัติการวิ่ง (Work Order Logs)

### 5.3 Work Order Self-Service Flow (เปิดใบงานใช้งานรถ)
1.  **จุดเริ่มต้น:** ผู้ใช้คลิกปุ่ม `+ เปิดใบงานขอใช้รถ (New Work Order)` สี Desert Sun (`#DC9750`)
2.  **Modal Form:**
    *   **Vehicle Picker:** Dropdown กรองแสดงเฉพาะรถที่มีสถานะ **"จอดรองาน"** เท่านั้น พร้อมแสดงเลขไมล์ล่าสุดของรถ
    *   **User Details:** ดึงชื่อผู้ใช้ปัจจุบันขึ้นมาอัตโนมัติ (สามารถแก้ไขได้หากบันทึกแทน)
    *   **Purpose & Mission:** กรอกวัตถุประสงค์ เช่น ไปปฏิบัติงานตรวจไซต์งาน กฟผ.
    *   **Start Mileage Input:** บังคับกรอกเลขไมล์ปัจจุบันก่อนนำรถออก
3.  **Submit Action:** 
    *   คลิกปุ่ม **"บันทึกและนำรถออกใช้งาน"**
    *   ระบบบันทึกทันที **(ไม่ต้องรอ Approve)**
    *   สถานะของรถจะเปลี่ยนเป็น **"ใช้งาน"** ทันทีในระบบ
4.  **Close Work Order (ส่งคืนรถ):**
    *   ในแท็บ "งานของฉัน (My Work Orders)" มีปุ่ม **"บันทึกคืนรถ / ปิดงาน"**
    *   ระบบเปิดกล่องให้กรอก **เลขไมล์สิ้นสุด (End Mileage)**
    *   คำนวณระยะทางรวม (Total Distance) ให้อัตโนมัติ
    *   สถานะรถกลับคืนสู่ **"จอดรองาน"** ทันที

### 5.4 Fuel Log Form (บันทึกการเติมเชื้อเพลิง)
*   ฟอร์มบันทึกง่าย รวดเร็ว: วันที่เติม, เลขทะเบียนรถ, เลขไมล์ขณะเติม, ปริมาณลิตร, ยอดเงินรวม (บาท), แนบรูป/เลขที่ใบเสร็จ
*   สามารถออกรายงานสรุปการใช้น้ำมันและค่าเฉลี่ยกิโลเมตรต่อลิตร (km/L) รายเดือนได้