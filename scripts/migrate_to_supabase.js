#!/usr/bin/env node
/**
 * Migration Script: Seed data from server/database.json to Supabase PostgreSQL
 * 
 * Usage:
 *   SUPABASE_URL=https://xyz.supabase.co SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/migrate_to_supabase.js
 * Or:
 *   node scripts/migrate_to_supabase.js --url https://xyz.supabase.co --key your_key
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse arguments
const args = process.argv.slice(2);
let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) supabaseUrl = args[i + 1];
  if (args[i] === '--key' && args[i + 1]) supabaseKey = args[i + 1];
}

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ ข้อผิดพลาด: ไม่พบข้อมูลการเชื่อมต่อ Supabase');
  console.error('กรุณาระบุ SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY ดังนี้:');
  console.error('  node scripts/migrate_to_supabase.js --url <SUPABASE_URL> --key <SUPABASE_SERVICE_ROLE_KEY>\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const dbPath = path.join(__dirname, '..', 'server', 'database.json');
if (!fs.existsSync(dbPath)) {
  console.error(`❌ ไม่พบไฟล์ ${dbPath}`);
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

async function migrate() {
  console.log(`\n🚀 เริ่มต้นการโอนย้ายข้อมูลจาก database.json ไปยัง Supabase...`);
  console.log(`🔗 Supabase URL: ${supabaseUrl}\n`);

  // 1. Migrate Vehicles
  const vehicles = db.vehicles || [];
  if (vehicles.length > 0) {
    console.log(`📦 กำลังบันทึกข้อมูลรถยนต์ (vehicles) ${vehicles.length} รายการ...`);
    const formattedVehicles = vehicles.map(v => ({
      id: v.id,
      seq: v.seq,
      department: v.department || 'อหก.',
      internal_id: v.internal_id,
      license_plate: v.license_plate,
      brand: v.brand,
      model: v.model,
      category: v.category,
      vehicle_type: v.vehicle_type,
      fuel_type: v.fuel_type || 'ดีเซล',
      specifications: v.specifications || '',
      base_location: v.base_location,
      status: v.status || 'จอดรองาน',
      registration_date: v.registration_date && v.registration_date !== 'NA' ? v.registration_date : null,
      tax_due_date: v.tax_due_date && v.tax_due_date !== 'NA' ? v.tax_due_date : null,
      tax_amount: v.tax_amount ? Number(v.tax_amount) : null,
      current_mileage: v.current_mileage ? Number(v.current_mileage) : 0,
      created_at: v.created_at || new Date().toISOString()
    }));

    const { error } = await supabase.from('vehicles').upsert(formattedVehicles, { onConflict: 'id' });
    if (error) {
      console.error('  ❌ ผิดพลาดในการบันทึก vehicles:', error.message);
    } else {
      console.log(`  ✅ vehicles สำเร็จ: ${vehicles.length} คัน`);
    }
  }

  // 2. Migrate Work Orders
  const workOrders = db.work_orders || [];
  if (workOrders.length > 0) {
    console.log(`📦 กำลังบันทึกข้อมูลใบงาน (work_orders) ${workOrders.length} รายการ...`);
    const formattedWo = workOrders.map(w => ({
      id: w.id,
      vehicle_id: w.vehicle_id,
      requester_name: w.requester_name,
      department: w.department,
      purpose: w.purpose,
      start_datetime: w.start_datetime ? new Date(w.start_datetime).toISOString() : null,
      planned_end_datetime: w.planned_end_datetime ? new Date(w.planned_end_datetime).toISOString() : null,
      end_datetime: w.end_datetime ? new Date(w.end_datetime).toISOString() : null,
      start_mileage: Number(w.start_mileage) || 0,
      end_mileage: w.end_mileage ? Number(w.end_mileage) : null,
      total_distance: w.total_distance ? Number(w.total_distance) : null,
      status: w.status || 'IN_PROGRESS',
      created_at: w.created_at ? new Date(w.created_at).toISOString() : new Date().toISOString()
    }));

    const { error } = await supabase.from('work_orders').upsert(formattedWo, { onConflict: 'id' });
    if (error) {
      console.error('  ❌ ผิดพลาดในการบันทึก work_orders:', error.message);
    } else {
      console.log(`  ✅ work_orders สำเร็จ: ${workOrders.length} รายการ`);
    }
  }

  // 3. Migrate Fuel Logs
  const fuelLogs = db.fuel_logs || [];
  if (fuelLogs.length > 0) {
    console.log(`📦 กำลังบันทึกข้อมูลการเติมน้ำมัน (fuel_logs) ${fuelLogs.length} รายการ...`);
    const formattedFuel = fuelLogs.map(f => ({
      id: f.id,
      vehicle_id: f.vehicle_id,
      work_order_id: f.work_order_id || null,
      refuel_date: f.refuel_date || new Date().toISOString().substring(0, 10),
      liters: Number(f.liters) || 0,
      total_amount: Number(f.total_amount) || 0,
      odometer: Number(f.odometer) || 0,
      receipt_no: f.receipt_no || '',
      created_at: f.created_at || new Date().toISOString()
    }));

    const { error } = await supabase.from('fuel_logs').upsert(formattedFuel, { onConflict: 'id' });
    if (error) {
      console.error('  ❌ ผิดพลาดในการบันทึก fuel_logs:', error.message);
    } else {
      console.log(`  ✅ fuel_logs สำเร็จ: ${fuelLogs.length} รายการ`);
    }
  }

  // 4. Migrate Maintenance Records
  const maintenance = db.maintenance_records || [];
  if (maintenance.length > 0) {
    console.log(`📦 กำลังบันทึกข้อมูลการซ่อมบำรุง (maintenance_records) ${maintenance.length} รายการ...`);
    const formattedMaint = maintenance.map(m => ({
      id: m.id,
      vehicle_id: m.vehicle_id,
      record_type: m.record_type,
      service_date: m.service_date,
      next_due_date: m.next_due_date || null,
      cost: Number(m.cost) || 0,
      remarks: m.remarks || '',
      created_at: m.created_at || new Date().toISOString()
    }));

    const { error } = await supabase.from('maintenance_records').upsert(formattedMaint, { onConflict: 'id' });
    if (error) {
      console.error('  ❌ ผิดพลาดในการบันทึก maintenance_records:', error.message);
    } else {
      console.log(`  ✅ maintenance_records สำเร็จ: ${maintenance.length} รายการ`);
    }
  }

  // 5. Migrate PN1 Reports (in batches of 50 to avoid payload limits)
  const pn1Reports = db.pn1_reports || [];
  if (pn1Reports.length > 0) {
    console.log(`📦 กำลังบันทึกข้อมูลรายงาน พน.1 (pn1_reports) ${pn1Reports.length} รายการ...`);
    const chunkSize = 50;
    for (let i = 0; i < pn1Reports.length; i += chunkSize) {
      const chunk = pn1Reports.slice(i, i + chunkSize).map(r => ({
        id: r.id,
        vehicle_id: r.vehicle_id,
        internal_id: r.internal_id,
        license_plate: r.license_plate,
        brand_model: r.brand_model,
        fuel_type: r.fuel_type || 'ดีเซล',
        department: r.department || 'อหก.',
        month: r.month,
        daily_logs: r.daily_logs || [],
        total_working_days: r.total_working_days || 30,
        used_days: r.used_days || 0,
        idle_days: r.idle_days || 30,
        repair_days: r.repair_days || 0,
        total_distance: r.total_distance || 0,
        total_liters: r.total_liters || 0,
        total_fuel_cost: r.total_fuel_cost || 0,
        avg_fuel_consumption: r.avg_fuel_consumption || 0,
        ur_rate: r.ur_rate || 0,
        created_at: r.created_at || new Date().toISOString(),
        updated_at: r.updated_at || new Date().toISOString()
      }));

      const { error } = await supabase.from('pn1_reports').upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.error(`  ❌ ผิดพลาดในการบันทึก pn1_reports ชุดที่ ${i / chunkSize + 1}:`, error.message);
      } else {
        console.log(`  ✅ บันทึก pn1_reports แล้ว ${Math.min(i + chunkSize, pn1Reports.length)} / ${pn1Reports.length} รายการ`);
      }
    }
  }

  console.log(`\n🎉 การโอนย้ายข้อมูลสู่ Supabase เสร็จสมบูรณ์เรียบร้อยแล้ว!\n`);
}

migrate().catch(err => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});
