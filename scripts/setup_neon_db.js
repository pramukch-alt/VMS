#!/usr/bin/env node
/**
 * Setup and Seed Neon PostgreSQL Database (via HTTPS Port 443)
 * Works through corporate firewalls that block port 5432!
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_POOLED;

if (!connectionString) {
  console.error('❌ ไม่พบ DATABASE_URL ในไฟล์ .env');
  process.exit(1);
}

const sql = neon(connectionString);

const dbPath = path.join(__dirname, '..', 'server', 'database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

async function setup() {
  try {
    console.log('🔗 กำลังเชื่อมต่อไปยัง Neon PostgreSQL ผ่าน HTTPS (Port 443)...');
    const dbInfo = await sql.query('SELECT current_database(), version();');
    console.log(`✅ เชื่อมต่อสำเร็จ! Database: ${dbInfo[0].current_database}`);

    console.log('\n🔨 กำลังสร้างโครงสร้างตาราง (DDL Schema)...');

    // 1. Create Tables
    await sql.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id BIGSERIAL PRIMARY KEY,
        seq INTEGER,
        department TEXT NOT NULL DEFAULT 'อหก.',
        internal_id TEXT NOT NULL UNIQUE,
        license_plate TEXT,
        brand TEXT,
        model TEXT,
        category TEXT,
        vehicle_type TEXT,
        fuel_type TEXT DEFAULT 'ดีเซล',
        specifications TEXT,
        base_location TEXT,
        status TEXT NOT NULL DEFAULT 'จอดรองาน',
        registration_date DATE,
        tax_due_date DATE,
        tax_amount NUMERIC(12, 2),
        current_mileage NUMERIC(12, 2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await sql.query(`CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_vehicles_dept ON vehicles(department);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_vehicles_internal_id ON vehicles(internal_id);`);

    await sql.query(`
      CREATE TABLE IF NOT EXISTS work_orders (
        id BIGSERIAL PRIMARY KEY,
        vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        requester_name TEXT,
        department TEXT,
        purpose TEXT,
        start_datetime TIMESTAMPTZ,
        planned_end_datetime TIMESTAMPTZ,
        end_datetime TIMESTAMPTZ,
        start_mileage NUMERIC(12, 2) DEFAULT 0,
        end_mileage NUMERIC(12, 2),
        total_distance NUMERIC(12, 2),
        status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await sql.query(`CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle ON work_orders(vehicle_id);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);`);

    await sql.query(`
      CREATE TABLE IF NOT EXISTS fuel_logs (
        id BIGSERIAL PRIMARY KEY,
        vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        work_order_id BIGINT REFERENCES work_orders(id) ON DELETE SET NULL,
        refuel_date DATE DEFAULT CURRENT_DATE,
        liters NUMERIC(10, 2) NOT NULL DEFAULT 0,
        total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        odometer NUMERIC(12, 2) NOT NULL DEFAULT 0,
        receipt_no TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await sql.query(`CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle ON fuel_logs(vehicle_id);`);

    await sql.query(`
      CREATE TABLE IF NOT EXISTS maintenance_records (
        id BIGSERIAL PRIMARY KEY,
        vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        record_type TEXT NOT NULL,
        service_date DATE NOT NULL,
        next_due_date DATE,
        cost NUMERIC(12, 2) DEFAULT 0,
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await sql.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_records(vehicle_id);`);

    await sql.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id BIGSERIAL PRIMARY KEY,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT,
        vehicle_count INTEGER DEFAULT 0,
        sent_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await sql.query(`
      CREATE TABLE IF NOT EXISTS pn1_reports (
        id BIGSERIAL PRIMARY KEY,
        vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        internal_id TEXT NOT NULL,
        license_plate TEXT,
        brand_model TEXT,
        fuel_type TEXT DEFAULT 'ดีเซล',
        department TEXT DEFAULT 'อหก.',
        month TEXT NOT NULL,
        daily_logs JSONB DEFAULT '[]'::jsonb,
        total_working_days INTEGER DEFAULT 30,
        used_days INTEGER DEFAULT 0,
        idle_days INTEGER DEFAULT 30,
        repair_days INTEGER DEFAULT 0,
        total_distance NUMERIC(12, 2) DEFAULT 0,
        total_liters NUMERIC(12, 2) DEFAULT 0,
        total_fuel_cost NUMERIC(12, 2) DEFAULT 0,
        avg_fuel_consumption NUMERIC(10, 2) DEFAULT 0,
        ur_rate NUMERIC(5, 2) DEFAULT 0.0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_pn1_reports_vehicle_month UNIQUE (vehicle_id, month)
      );
    `);

    await sql.query(`CREATE INDEX IF NOT EXISTS idx_pn1_reports_month ON pn1_reports(month);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_pn1_reports_vehicle_month ON pn1_reports(vehicle_id, month);`);
    console.log('✅ สร้างตารางสำเร็จทั้ง 6 ตารางบน Neon');

    // 2. Seed Vehicles
    const vehicles = db.vehicles || [];
    console.log(`\n📦 กำลังบันทึกข้อมูลรถยนต์ ${vehicles.length} คัน...`);
    for (const v of vehicles) {
      await sql.query(`
        INSERT INTO vehicles (
          id, seq, department, internal_id, license_plate, brand, model,
          category, vehicle_type, fuel_type, specifications, base_location,
          status, registration_date, tax_due_date, tax_amount, current_mileage, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO UPDATE SET
          internal_id = EXCLUDED.internal_id,
          license_plate = EXCLUDED.license_plate,
          status = EXCLUDED.status,
          current_mileage = EXCLUDED.current_mileage;
      `, [
        v.id, v.seq, v.department || 'อหก.', v.internal_id, v.license_plate, v.brand, v.model,
        v.category, v.vehicle_type, v.fuel_type || 'ดีเซล', v.specifications || '', v.base_location,
        v.status || 'จอดรองาน', v.registration_date && v.registration_date !== 'NA' ? v.registration_date : null,
        v.tax_due_date && v.tax_due_date !== 'NA' ? v.tax_due_date : null,
        v.tax_amount ? Number(v.tax_amount) : null,
        Number(v.current_mileage) || 0,
        v.created_at || new Date().toISOString()
      ]);
    }
    console.log(`✅ vehicles สำเร็จ ${vehicles.length} คัน`);

    // 3. Seed Work Orders
    const workOrders = db.work_orders || [];
    console.log(`📦 กำลังบันทึกข้อมูลใบงาน ${workOrders.length} รายการ...`);
    for (const w of workOrders) {
      await sql.query(`
        INSERT INTO work_orders (
          id, vehicle_id, requester_name, department, purpose,
          start_datetime, planned_end_datetime, end_datetime,
          start_mileage, end_mileage, total_distance, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING;
      `, [
        w.id, w.vehicle_id, w.requester_name, w.department, w.purpose,
        w.start_datetime ? new Date(w.start_datetime).toISOString() : null,
        w.planned_end_datetime ? new Date(w.planned_end_datetime).toISOString() : null,
        w.end_datetime ? new Date(w.end_datetime).toISOString() : null,
        Number(w.start_mileage) || 0,
        w.end_mileage ? Number(w.end_mileage) : null,
        w.total_distance ? Number(w.total_distance) : null,
        w.status || 'IN_PROGRESS',
        w.created_at ? new Date(w.created_at).toISOString() : new Date().toISOString()
      ]);
    }
    console.log(`✅ work_orders สำเร็จ ${workOrders.length} รายการ`);

    // 4. Seed Fuel Logs
    const fuelLogs = db.fuel_logs || [];
    console.log(`📦 กำลังบันทึกข้อมูลเติมน้ำมัน ${fuelLogs.length} รายการ...`);
    for (const f of fuelLogs) {
      await sql.query(`
        INSERT INTO fuel_logs (
          id, vehicle_id, work_order_id, refuel_date,
          liters, total_amount, odometer, receipt_no, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING;
      `, [
        f.id, f.vehicle_id, f.work_order_id || null, f.refuel_date || new Date().toISOString().substring(0, 10),
        Number(f.liters) || 0, Number(f.total_amount) || 0, Number(f.odometer) || 0,
        f.receipt_no || '', f.created_at || new Date().toISOString()
      ]);
    }
    console.log(`✅ fuel_logs สำเร็จ ${fuelLogs.length} รายการ`);

    // 5. Seed Maintenance Records
    const maintenance = db.maintenance_records || [];
    console.log(`📦 กำลังบันทึกข้อมูลซ่อมบำรุง ${maintenance.length} รายการ...`);
    for (const m of maintenance) {
      await sql.query(`
        INSERT INTO maintenance_records (
          id, vehicle_id, record_type, service_date, next_due_date, cost, remarks, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING;
      `, [
        m.id, m.vehicle_id, m.record_type, m.service_date, m.next_due_date || null,
        Number(m.cost) || 0, m.remarks || '', m.created_at || new Date().toISOString()
      ]);
    }
    console.log(`✅ maintenance_records สำเร็จ ${maintenance.length} รายการ`);

    // 6. Seed PN1 Reports
    const pn1Reports = db.pn1_reports || [];
    console.log(`📦 กำลังบันทึกรายงาน พน.1 ทั้งหมด ${pn1Reports.length} รายการ...`);
    let count = 0;
    for (const r of pn1Reports) {
      await sql.query(`
        INSERT INTO pn1_reports (
          id, vehicle_id, internal_id, license_plate, brand_model,
          fuel_type, department, month, daily_logs, total_working_days,
          used_days, idle_days, repair_days, total_distance, total_liters,
          total_fuel_cost, avg_fuel_consumption, ur_rate, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
        ON CONFLICT (vehicle_id, month) DO UPDATE SET
          daily_logs = EXCLUDED.daily_logs,
          used_days = EXCLUDED.used_days,
          idle_days = EXCLUDED.idle_days,
          total_distance = EXCLUDED.total_distance,
          ur_rate = EXCLUDED.ur_rate,
          updated_at = NOW();
      `, [
        r.id, r.vehicle_id, r.internal_id, r.license_plate, r.brand_model,
        r.fuel_type || 'ดีเซล', r.department || 'อหก.', r.month, JSON.stringify(r.daily_logs || []),
        r.total_working_days || 30, r.used_days || 0, r.idle_days || 30, r.repair_days || 0,
        Number(r.total_distance) || 0, Number(r.total_liters) || 0, Number(r.total_fuel_cost) || 0,
        Number(r.avg_fuel_consumption) || 0, Number(r.ur_rate) || 0,
        r.created_at || new Date().toISOString(), r.updated_at || new Date().toISOString()
      ]);
      count++;
      if (count % 50 === 0 || count === pn1Reports.length) {
        console.log(`  บันทึก pn1_reports แล้ว ${count} / ${pn1Reports.length} รายการ`);
      }
    }
    console.log(`✅ pn1_reports สำเร็จครบ ${pn1Reports.length} รายการ`);

    // 7. Update Sequence Counters
    await sql.query(`SELECT setval('vehicles_id_seq', COALESCE((SELECT MAX(id) FROM vehicles), 1));`);
    await sql.query(`SELECT setval('work_orders_id_seq', COALESCE((SELECT MAX(id) FROM work_orders), 1));`);
    await sql.query(`SELECT setval('fuel_logs_id_seq', COALESCE((SELECT MAX(id) FROM fuel_logs), 1));`);
    await sql.query(`SELECT setval('maintenance_records_id_seq', COALESCE((SELECT MAX(id) FROM maintenance_records), 1));`);
    await sql.query(`SELECT setval('pn1_reports_id_seq', COALESCE((SELECT MAX(id) FROM pn1_reports), 1));`);
    console.log('✅ อัปเดต Sequence ID Counters เรียบร้อย');

    console.log('\n🎉 การตั้งค่าและโอนย้ายข้อมูลสู่ Neon PostgreSQL สำเร็จสมบูรณ์ 100%!');
  } catch (err) {
    console.error('\n❌ เกิดข้อผิดพลาด:', err);
    process.exit(1);
  }
}

setup();
