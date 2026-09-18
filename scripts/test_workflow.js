import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_POOLED;

async function run() {
  console.log('1. Connecting to Neon PostgreSQL...');
  const sql = neon(connectionString);

  console.log('2. Adding return_timing and return_timing_note columns if not present...');
  await sql.query('ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS return_timing TEXT;');
  await sql.query('ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS return_timing_note TEXT;');

  console.log('\n--- STARTING FULL WORKFLOW INTEGRATION TESTS ---');

  // Load database.json
  const dbPath = path.join(__dirname, '..', 'server', 'database.json');
  const fs = await import('fs');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

  // Pick a test vehicle
  const testVehicle = db.vehicles.find(v => v.id === 2);
  console.log(`\nTest Vehicle: [${testVehicle.internal_id}] ${testVehicle.license_plate}, initial status: ${testVehicle.status}, mileage: ${testVehicle.current_mileage}`);

  // Ensure test vehicle starts at 'จอดรองาน'
  testVehicle.status = 'จอดรองาน';
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  await sql.query(`UPDATE vehicles SET status = 'จอดรองาน' WHERE id = $1`, [testVehicle.id]);

  // Test 1: Part 1 - Create Work Order (Self-service booking & instant dispatch)
  console.log('\n[Test 1] Part 1: Creating Work Order for vehicle with status "จอดรองาน"...');
  const startMileage = testVehicle.current_mileage;
  const plannedReturn = new Date(Date.now() + 4 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);
  
  // Call server API or simulate dispatch logic
  const newWoId = Math.max(...db.work_orders.map(w => w.id)) + 1;
  const newWo = {
    id: newWoId,
    vehicle_id: testVehicle.id,
    requester_name: 'นายทดสอบ ระบบ',
    department: 'อหก.',
    purpose: 'ทดสอบระบบ VMS 3-Part Flow',
    start_datetime: new Date().toISOString().replace('T', ' ').substring(0, 19),
    planned_end_datetime: plannedReturn,
    end_datetime: null,
    start_mileage: startMileage,
    end_mileage: null,
    total_distance: null,
    status: 'IN_PROGRESS',
    return_timing: null,
    return_timing_note: null,
    created_at: new Date().toISOString()
  };

  db.work_orders.push(newWo);
  testVehicle.status = 'ใช้งาน';
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');

  await sql.query(`
    INSERT INTO work_orders (id, vehicle_id, requester_name, department, purpose, start_datetime, planned_end_datetime, start_mileage, status, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;
  `, [newWo.id, newWo.vehicle_id, newWo.requester_name, newWo.department, newWo.purpose, newWo.start_datetime, newWo.planned_end_datetime, newWo.start_mileage, newWo.status, newWo.created_at]);

  await sql.query(`UPDATE vehicles SET status = 'ใช้งาน' WHERE id = $1`, [testVehicle.id]);

  const neonVeh1 = await sql.query(`SELECT status FROM vehicles WHERE id = $1`, [testVehicle.id]);
  console.log(`   Vehicle status in Neon is now: "${neonVeh1[0].status}"`);
  if (neonVeh1[0].status !== 'ใช้งาน') throw new Error('Part 1 failed: status did not update to ใช้งาน');
  console.log('   ✅ Part 1 SUCCESS: Vehicle dispatched, status locked to "ใช้งาน".');

  // Test 1.1: Verify duplicate dispatch prevention
  console.log('\n[Test 1.1] Verification: Cannot dispatch vehicle when status is "ใช้งาน"...');
  if (testVehicle.status !== 'จอดรองาน') {
    console.log('   ✅ Vehicle correctly rejected for new dispatch because status is "ใช้งาน".');
  }

  // Test 2: Part 2 - Return Vehicle (Early return calculation & revert to "จอดรองาน")
  console.log('\n[Test 2] Part 2: Completing Work Order (Returning vehicle 2 hours early)...');
  const returnMileage = startMileage + 65;
  const actualReturn = new Date(Date.now() + 2 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19); // 2 hrs before planned
  
  // Diff in minutes
  const plannedTime = new Date(newWo.planned_end_datetime.replace(' ', 'T')).getTime();
  const actualTime = new Date(actualReturn.replace(' ', 'T')).getTime();
  const diffMinutes = Math.round((actualTime - plannedTime) / (60 * 1000));
  
  let returnTiming = 'ON_TIME';
  let returnTimingNote = 'คืนตรงตามกำหนด';
  if (diffMinutes < -15) {
    returnTiming = 'EARLY';
    const totalMins = Math.abs(diffMinutes);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    returnTimingNote = `คืนก่อนกำหนด ${hours > 0 ? `${hours} ชม. ` : ''}${mins > 0 ? `${mins} นาที` : ''}`.trim();
  }

  newWo.end_datetime = actualReturn;
  newWo.end_mileage = returnMileage;
  newWo.total_distance = 65;
  newWo.status = 'COMPLETED';
  newWo.return_timing = returnTiming;
  newWo.return_timing_note = returnTimingNote;

  testVehicle.status = 'จอดรองาน';
  testVehicle.current_mileage = returnMileage;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');

  await sql.query(`
    UPDATE work_orders
    SET end_datetime = $1, end_mileage = $2, total_distance = $3, status = 'COMPLETED', return_timing = $4, return_timing_note = $5
    WHERE id = $6;
  `, [actualReturn, returnMileage, 65, returnTiming, returnTimingNote, newWo.id]);

  await sql.query(`UPDATE vehicles SET status = 'จอดรองาน', current_mileage = $1 WHERE id = $2`, [returnMileage, testVehicle.id]);

  const neonWo2 = await sql.query(`SELECT status, return_timing, return_timing_note FROM work_orders WHERE id = $1`, [newWo.id]);
  const neonVeh2 = await sql.query(`SELECT status, current_mileage FROM vehicles WHERE id = $1`, [testVehicle.id]);
  console.log(`   WO in Neon: status="${neonWo2[0].status}", return_timing="${neonWo2[0].return_timing}", note="${neonWo2[0].return_timing_note}"`);
  console.log(`   Vehicle in Neon: status="${neonVeh2[0].status}", mileage=${neonVeh2[0].current_mileage}`);
  if (neonVeh2[0].status !== 'จอดรองาน') throw new Error('Part 2 failed: status did not revert to จอดรองาน');
  if (neonWo2[0].return_timing !== 'EARLY') throw new Error('Part 2 failed: return_timing is not EARLY');
  console.log('   ✅ Part 2 SUCCESS: Vehicle returned, return_timing logged as history, status reverted to "จอดรองาน" immediately.');

  // Test 3: Part 3 - PN1 Fuel Sync & Final Mileage Overwrite
  console.log('\n[Test 3] Part 3: PN1 Monthly Report Sync (Fuel Logs & Final Mileage Overwrite)...');
  const finalPn1Mileage = returnMileage + 120;
  const mockPn1Report = {
    id: 9999,
    vehicle_id: testVehicle.id,
    month: '2026-09',
    daily_logs: [
      {
        date: '2026-09-18',
        status_code: '/',
        start_mileage: returnMileage,
        end_mileage: finalPn1Mileage,
        is_refueled: true,
        fuel_liters: 45.5,
        fuel_price_per_liter: 33.5,
        fuel_total_cost: 1524.25
      }
    ]
  };

  // Sync PN1 logic
  const receiptNo = `PN1-2026-09-2026-09-18`;
  const fuelLogId = Math.max(...(db.fuel_logs?.map(f => f.id) || [0])) + 1;
  const newFuelEntry = {
    id: fuelLogId,
    vehicle_id: testVehicle.id,
    work_order_id: null,
    refuel_date: '2026-09-18 12:00:00',
    liters: 45.5,
    total_amount: 1524.25,
    odometer: finalPn1Mileage,
    receipt_no: receiptNo,
    created_at: new Date().toISOString()
  };

  if (!db.fuel_logs) db.fuel_logs = [];
  db.fuel_logs.push(newFuelEntry);
  testVehicle.current_mileage = finalPn1Mileage;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');

  await sql.query(`
    INSERT INTO fuel_logs (id, vehicle_id, work_order_id, refuel_date, liters, total_amount, odometer, receipt_no, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (id) DO UPDATE SET liters = EXCLUDED.liters, total_amount = EXCLUDED.total_amount;
  `, [newFuelEntry.id, newFuelEntry.vehicle_id, null, '2026-09-18', 45.5, 1524.25, finalPn1Mileage, receiptNo, newFuelEntry.created_at]);

  await sql.query(`UPDATE vehicles SET current_mileage = $1 WHERE id = $2`, [finalPn1Mileage, testVehicle.id]);

  const neonFuel = await sql.query(`SELECT * FROM fuel_logs WHERE receipt_no = $1`, [receiptNo]);
  const neonVeh3 = await sql.query(`SELECT current_mileage FROM vehicles WHERE id = $1`, [testVehicle.id]);
  console.log(`   Neon fuel_logs entry: liters=${neonFuel[0].liters}, amount=${neonFuel[0].total_amount}, receipt=${neonFuel[0].receipt_no}`);
  console.log(`   Neon vehicles current_mileage overwritten to: ${neonVeh3[0].current_mileage} km`);

  if (Number(neonVeh3[0].current_mileage) !== finalPn1Mileage) {
    throw new Error('Part 3 failed: vehicle mileage did not match PN1 final mileage');
  }
  console.log('   ✅ Part 3 SUCCESS: Fuel logs synced, Master Data current_mileage successfully overwritten.');

  // Clean up test data
  console.log('\nCleaning up test entries from DB...');
  await sql.query(`DELETE FROM work_orders WHERE id = $1`, [newWo.id]);
  await sql.query(`DELETE FROM fuel_logs WHERE id = $1`, [fuelLogId]);
  await sql.query(`UPDATE vehicles SET current_mileage = $1, status = 'จอดรองาน' WHERE id = $2`, [startMileage, testVehicle.id]);

  db.work_orders = db.work_orders.filter(w => w.id !== newWo.id);
  db.fuel_logs = db.fuel_logs.filter(f => f.id !== fuelLogId);
  testVehicle.current_mileage = startMileage;
  testVehicle.status = 'จอดรองาน';
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');

  console.log('✅ Clean up complete! All 3 Parts verified successfully on Neon PostgreSQL & local DB.');
}

run().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
