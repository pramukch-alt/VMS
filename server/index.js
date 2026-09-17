import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.json');

function readDb() {
  const data = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(data);
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

// Database connections: Neon Postgres (primary) or Supabase (alternative)
const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_POOLED;
export const sql = dbUrl ? neon(dbUrl) : null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const TODAY = '2026-09-15';

// --- Health Check API (for Render and uptime monitors) ---
app.get('/api/health', async (req, res) => {
  let dbStatus = 'local_json';
  if (sql) {
    try {
      await sql.query('SELECT 1');
      dbStatus = 'neon_postgres';
    } catch (e) {
      dbStatus = 'neon_error: ' + e.message;
    }
  } else if (supabase) {
    dbStatus = 'supabase';
  }

  res.json({
    status: 'ok',
    service: 'EGAT VMS API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

// --- Dashboard Stats API ---
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const db = readDb();
    const totalVehicles = db.vehicles.length;
    const standbyCount = db.vehicles.filter(v => v.status === 'จอดรองาน').length;
    const inUseCount = db.vehicles.filter(v => v.status === 'ใช้งาน').length;
    const maintenanceCount = db.vehicles.filter(v => v.status === 'รอซ่อม' || v.status === 'ซ่อม').length;

    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    const todayMs = new Date(TODAY).getTime();
    const maxDueMs = todayMs + ninetyDaysMs;

    const taxDueVehicles = db.vehicles.filter(v => {
      if (!v.tax_due_date || v.tax_due_date === 'NA') return false;
      const dueMs = new Date(v.tax_due_date).getTime();
      return dueMs >= todayMs && dueMs <= maxDueMs;
    }).sort((a, b) => new Date(a.tax_due_date).getTime() - new Date(b.tax_due_date).getTime());

    res.json({
      metrics: {
        total: totalVehicles,
        standby: standbyCount,
        inUse: inUseCount,
        maintenance: maintenanceCount,
        taxDue90Days: taxDueVehicles.length
      },
      taxAlerts: taxDueVehicles
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Vehicles API ---
app.get('/api/vehicles', (req, res) => {
  try {
    const db = readDb();
    const { category, status, search, base_location } = req.query;
    let list = db.vehicles;

    if (category && category !== 'all') {
      list = list.filter(v => v.category === category);
    }
    if (status && status !== 'all') {
      list = list.filter(v => v.status === status);
    }
    if (base_location && base_location !== 'all') {
      list = list.filter(v => v.base_location === base_location);
    }
    if (search) {
      const term = search.toLowerCase();
      list = list.filter(v => 
        (v.internal_id && v.internal_id.toLowerCase().includes(term)) ||
        (v.license_plate && v.license_plate.toLowerCase().includes(term)) ||
        (v.brand && v.brand.toLowerCase().includes(term)) ||
        (v.model && v.model.toLowerCase().includes(term))
      );
    }

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Get Vehicle Detail with History ---
app.get('/api/vehicles/:id', (req, res) => {
  try {
    const db = readDb();
    const vId = Number(req.params.id);
    const vehicle = db.vehicles.find(v => v.id === vId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const maintenance = db.maintenance_records.filter(m => m.vehicle_id === vId);
    const fuelLogs = db.fuel_logs.filter(f => f.vehicle_id === vId);
    const workOrders = db.work_orders.filter(w => w.vehicle_id === vId);

    res.json({
      ...vehicle,
      maintenanceHistory: maintenance,
      fuelHistory: fuelLogs,
      workOrderHistory: workOrders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Full Vehicle Details (Including Current Mileage, Department, Fuel Type)
app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const db = readDb();
    const vId = Number(req.params.id);
    const vehicle = db.vehicles.find(v => v.id === vId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const {
      department, internal_id, license_plate, brand, model, category,
      vehicle_type, fuel_type, specifications, base_location, status,
      registration_date, tax_due_date, tax_amount, current_mileage
    } = req.body;

    if (department !== undefined) vehicle.department = department;
    if (internal_id !== undefined) vehicle.internal_id = internal_id;
    if (license_plate !== undefined) vehicle.license_plate = license_plate;
    if (brand !== undefined) vehicle.brand = brand;
    if (model !== undefined) vehicle.model = model;
    if (category !== undefined) vehicle.category = category;
    if (vehicle_type !== undefined) vehicle.vehicle_type = vehicle_type;
    if (fuel_type !== undefined) vehicle.fuel_type = fuel_type;
    if (specifications !== undefined) vehicle.specifications = specifications;
    if (base_location !== undefined) vehicle.base_location = base_location;
    if (status !== undefined) vehicle.status = status;
    if (registration_date !== undefined) vehicle.registration_date = registration_date;
    if (tax_due_date !== undefined) vehicle.tax_due_date = tax_due_date;
    if (tax_amount !== undefined) vehicle.tax_amount = tax_amount !== '' ? Number(tax_amount) : null;
    if (current_mileage !== undefined) vehicle.current_mileage = Number(current_mileage);

    writeDb(db);

    // Sync to Neon if connected
    if (sql) {
      try {
        await sql.query(`
          UPDATE vehicles
          SET department = $1, internal_id = $2, license_plate = $3, brand = $4, model = $5,
              category = $6, vehicle_type = $7, fuel_type = $8, specifications = $9,
              base_location = $10, status = $11, registration_date = $12, tax_due_date = $13,
              tax_amount = $14, current_mileage = $15
          WHERE id = $16;
        `, [
          vehicle.department, vehicle.internal_id, vehicle.license_plate, vehicle.brand, vehicle.model,
          vehicle.category, vehicle.vehicle_type, vehicle.fuel_type, vehicle.specifications,
          vehicle.base_location, vehicle.status, vehicle.registration_date || null, vehicle.tax_due_date || null,
          vehicle.tax_amount || null, vehicle.current_mileage || 0, vId
        ]);
      } catch (dbErr) {
        console.error('Neon sync error on vehicle update:', dbErr);
      }
    }

    res.json({ success: true, message: 'แก้ไขข้อมูลยานพาหนะสำเร็จ', vehicle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Vehicle Status (Support: จอดรองาน / ใช้งาน / รอซ่อม / ซ่อม / รอยุบสภาพ / ยุบสภาพ)
app.put('/api/vehicles/:id/status', async (req, res) => {
  try {
    const db = readDb();
    const vId = Number(req.params.id);
    const { status } = req.body;

    const vehicle = db.vehicles.find(v => v.id === vId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    vehicle.status = status;
    writeDb(db);

    // Sync to Neon if connected
    if (sql) {
      try {
        await sql.query('UPDATE vehicles SET status = $1 WHERE id = $2;', [status, vId]);
      } catch (dbErr) {
        console.error('Neon sync error on vehicle status update:', dbErr);
      }
    }

    res.json({ success: true, message: `อัปเดตสถานะรถเป็น "${status}" สำเร็จ` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add New Vehicle
app.post('/api/vehicles', (req, res) => {
  try {
    const db = readDb();
    const newVehicle = {
      id: db.vehicles.length + 1,
      seq: req.body.seq || db.vehicles.length + 1,
      department: req.body.department || 'อหก.',
      internal_id: req.body.internal_id,
      license_plate: req.body.license_plate,
      brand: req.body.brand,
      model: req.body.model,
      category: req.body.category,
      vehicle_type: req.body.vehicle_type,
      fuel_type: req.body.fuel_type || 'ดีเซล',
      specifications: req.body.specifications || '',
      base_location: req.body.base_location,
      status: req.body.status || 'จอดรองาน',
      registration_date: req.body.registration_date || null,
      tax_due_date: req.body.tax_due_date || null,
      tax_amount: req.body.tax_amount ? Number(req.body.tax_amount) : null,
      current_mileage: req.body.current_mileage ? Number(req.body.current_mileage) : 0,
      created_at: new Date().toISOString()
    };

    db.vehicles.push(newVehicle);
    writeDb(db);

    res.json({ id: newVehicle.id, message: 'Vehicle created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Work Orders API ---
app.get('/api/work-orders', (req, res) => {
  try {
    const db = readDb();
    const list = db.work_orders.map(wo => {
      const v = db.vehicles.find(x => x.id === wo.vehicle_id) || {};
      return {
        ...wo,
        internal_id: v.internal_id,
        license_plate: v.license_plate,
        brand: v.brand,
        model: v.model,
        category: v.category
      };
    }).sort((a, b) => b.id - a.id);

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Self-Service Work Order (Booking & Instant Dispatch)
app.post('/api/work-orders', (req, res) => {
  try {
    const db = readDb();
    const { vehicle_id, requester_name, department, purpose, start_mileage, start_datetime, planned_end_datetime } = req.body;

    const vehicle = db.vehicles.find(v => v.id === Number(vehicle_id));
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    if (vehicle.status !== 'จอดรองาน') {
      return res.status(400).json({ error: 'อนุญาตให้เบิกรถที่มีสถานะ "จอดรองาน" เท่านั้น' });
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newWo = {
      id: db.work_orders.length + 1,
      vehicle_id: Number(vehicle_id),
      requester_name,
      department,
      purpose,
      start_datetime: start_datetime ? String(start_datetime).replace('T', ' ') : nowStr,
      planned_end_datetime: planned_end_datetime ? String(planned_end_datetime).replace('T', ' ') : null,
      end_datetime: null,
      start_mileage: Number(start_mileage) || vehicle.current_mileage,
      end_mileage: null,
      total_distance: null,
      status: 'IN_PROGRESS',
      created_at: nowStr
    };

    db.work_orders.push(newWo);
    vehicle.status = 'ใช้งาน';
    vehicle.current_mileage = Math.max(vehicle.current_mileage, newWo.start_mileage);

    writeDb(db);

    res.json({ id: newWo.id, message: 'บันทึกการจองและเปิดใบงานนำรถออกใช้งานสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complete Work Order (Return Vehicle - Support Early/Custom Return Date)
app.post('/api/work-orders/:id/complete', (req, res) => {
  try {
    const db = readDb();
    const woId = Number(req.params.id);
    const wo = db.work_orders.find(w => w.id === woId);
    if (!wo) {
      return res.status(404).json({ error: 'Work order not found' });
    }
    if (wo.status === 'COMPLETED') {
      return res.status(400).json({ error: 'ใบงานนี้ปิดสมบูรณ์แล้ว' });
    }

    const endM = parseInt(req.body.end_mileage, 10);
    if (isNaN(endM) || endM < wo.start_mileage) {
      return res.status(400).json({ error: 'เลขไมล์สิ้นสุดต้องไม่น้อยกว่าเลขไมล์เริ่มต้น' });
    }

    const totalDist = endM - wo.start_mileage;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const actualEndDatetime = req.body.end_datetime ? String(req.body.end_datetime).replace('T', ' ') : nowStr;

    wo.end_datetime = actualEndDatetime;
    wo.end_mileage = endM;
    wo.total_distance = totalDist;
    wo.status = 'COMPLETED';

    const vehicle = db.vehicles.find(v => v.id === wo.vehicle_id);
    if (vehicle) {
      vehicle.status = 'จอดรองาน';
      vehicle.current_mileage = endM;
    }

    writeDb(db);

    res.json({ success: true, message: 'ส่งคืนรถและปิดใบงานเรียบร้อยแล้ว สถานะรถเปลี่ยนกลับเป็น "จอดรองาน"', workOrder: wo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Fuel Logs API ---
app.get('/api/fuel-logs', (req, res) => {
  try {
    const db = readDb();
    const logs = db.fuel_logs.map(f => {
      const v = db.vehicles.find(x => x.id === f.vehicle_id) || {};
      return {
        ...f,
        internal_id: v.internal_id,
        license_plate: v.license_plate,
        brand: v.brand,
        model: v.model,
        category: v.category
      };
    }).sort((a, b) => new Date(b.refuel_date).getTime() - new Date(a.refuel_date).getTime());

    const totalLiters = logs.reduce((acc, curr) => acc + (curr.liters || 0), 0);
    const totalAmount = logs.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
    const avgCostPerLiter = totalLiters > 0 ? (totalAmount / totalLiters).toFixed(2) : 0;

    res.json({
      logs,
      summary: {
        totalLiters,
        totalAmount,
        avgCostPerLiter
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fuel-logs', (req, res) => {
  try {
    const db = readDb();
    const newLog = {
      id: db.fuel_logs.length + 1,
      vehicle_id: Number(req.body.vehicle_id),
      work_order_id: req.body.work_order_id ? Number(req.body.work_order_id) : null,
      refuel_date: req.body.refuel_date || new Date().toISOString().substring(0, 10),
      liters: Number(req.body.liters),
      total_amount: Number(req.body.total_amount),
      odometer: Number(req.body.odometer),
      receipt_no: req.body.receipt_no || '',
      created_at: new Date().toISOString()
    };

    db.fuel_logs.push(newLog);

    const vehicle = db.vehicles.find(v => v.id === newLog.vehicle_id);
    if (vehicle && newLog.odometer > vehicle.current_mileage) {
      vehicle.current_mileage = newLog.odometer;
    }

    writeDb(db);

    res.json({ id: newLog.id, message: 'บันทึกประวัติการเติมน้ำมันสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Maintenance Records API ---
app.get('/api/maintenance', (req, res) => {
  try {
    const db = readDb();
    const records = db.maintenance_records.map(m => {
      const v = db.vehicles.find(x => x.id === m.vehicle_id) || {};
      return {
        ...m,
        internal_id: v.internal_id,
        license_plate: v.license_plate,
        brand: v.brand,
        model: v.model
      };
    }).sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime());

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/maintenance', async (req, res) => {
  try {
    const db = readDb();
    const newId = db.maintenance_records.length > 0 ? Math.max(...db.maintenance_records.map(m => m.id)) + 1 : 1;
    const newRecord = {
      id: newId,
      vehicle_id: Number(req.body.vehicle_id),
      record_type: req.body.record_type,
      service_date: req.body.service_date,
      next_due_date: req.body.next_due_date || null,
      cost: Number(req.body.cost) || 0,
      remarks: req.body.remarks || '',
      created_at: new Date().toISOString()
    };

    db.maintenance_records.push(newRecord);

    // Auto update status to "ซ่อม" or "รอซ่อม" if current status is "จอดรองาน"
    const vehicle = db.vehicles.find(v => v.id === newRecord.vehicle_id);
    if (vehicle && vehicle.status === 'จอดรองาน') {
      vehicle.status = 'รอซ่อม';
    }

    writeDb(db);

    // Sync to Neon if connected
    if (sql) {
      try {
        await sql.query(`
          INSERT INTO maintenance_records (id, vehicle_id, record_type, service_date, next_due_date, cost, remarks, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            vehicle_id = EXCLUDED.vehicle_id,
            record_type = EXCLUDED.record_type,
            service_date = EXCLUDED.service_date,
            next_due_date = EXCLUDED.next_due_date,
            cost = EXCLUDED.cost,
            remarks = EXCLUDED.remarks;
        `, [newRecord.id, newRecord.vehicle_id, newRecord.record_type, newRecord.service_date, newRecord.next_due_date || null, newRecord.cost, newRecord.remarks || '', newRecord.created_at]);
      } catch (dbErr) {
        console.error('Neon sync error on maintenance insert:', dbErr);
      }
    }

    res.json({ id: newRecord.id, message: 'บันทึกประวัติซ่อมบำรุงสำเร็จ', record: newRecord });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Maintenance Record
app.put('/api/maintenance/:id', async (req, res) => {
  try {
    const db = readDb();
    const mId = Number(req.params.id);
    const index = db.maintenance_records.findIndex(m => m.id === mId);
    if (index === -1) {
      return res.status(404).json({ error: 'ไม่พบประวัติการซ่อมบำรุงที่ต้องการแก้ไข' });
    }

    const existing = db.maintenance_records[index];
    const updated = {
      ...existing,
      vehicle_id: req.body.vehicle_id !== undefined ? Number(req.body.vehicle_id) : existing.vehicle_id,
      record_type: req.body.record_type !== undefined ? req.body.record_type : existing.record_type,
      service_date: req.body.service_date !== undefined ? req.body.service_date : existing.service_date,
      next_due_date: req.body.next_due_date !== undefined ? req.body.next_due_date : existing.next_due_date,
      cost: req.body.cost !== undefined ? Number(req.body.cost) : existing.cost,
      remarks: req.body.remarks !== undefined ? req.body.remarks : existing.remarks,
      updated_at: new Date().toISOString()
    };

    db.maintenance_records[index] = updated;
    writeDb(db);

    // Sync to Neon if connected
    if (sql) {
      try {
        await sql.query(`
          UPDATE maintenance_records
          SET vehicle_id = $1, record_type = $2, service_date = $3, next_due_date = $4, cost = $5, remarks = $6
          WHERE id = $7;
        `, [updated.vehicle_id, updated.record_type, updated.service_date, updated.next_due_date || null, updated.cost, updated.remarks || '', mId]);
      } catch (dbErr) {
        console.error('Neon sync error on maintenance update:', dbErr);
      }
    }

    res.json({ success: true, message: 'แก้ไขข้อมูลงานซ่อมบำรุงสำเร็จ', record: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Maintenance Record
app.delete('/api/maintenance/:id', async (req, res) => {
  try {
    const db = readDb();
    const mId = Number(req.params.id);
    const index = db.maintenance_records.findIndex(m => m.id === mId);
    if (index === -1) {
      return res.status(404).json({ error: 'ไม่พบประวัติการซ่อมบำรุงที่ต้องการลบ' });
    }

    const deleted = db.maintenance_records.splice(index, 1)[0];
    writeDb(db);

    // Sync to Neon if connected
    if (sql) {
      try {
        await sql.query('DELETE FROM maintenance_records WHERE id = $1;', [mId]);
      } catch (dbErr) {
        console.error('Neon sync error on maintenance delete:', dbErr);
      }
    }

    res.json({ success: true, message: 'ลบรายการซ่อมบำรุงเรียบร้อยแล้ว', id: mId, deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Email Alert Trigger ---
app.post('/api/alerts/send-email', (req, res) => {
  try {
    const db = readDb();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    const todayMs = new Date(TODAY).getTime();
    const maxDueMs = todayMs + ninetyDaysMs;

    const taxDueVehicles = db.vehicles.filter(v => {
      if (!v.tax_due_date || v.tax_due_date === 'NA') return false;
      const dueMs = new Date(v.tax_due_date).getTime();
      return dueMs >= todayMs && dueMs <= maxDueMs;
    });

    if (taxDueVehicles.length === 0) {
      return res.json({ message: 'ไม่พบรายการรถที่ใกล้ครบกำหนดภาษีใน 90 วัน' });
    }

    const emailBody = `เรียน ฝ่ายบริหารยานพาหนะ อหก.\n\nระบบ VMS ตรวจพบยานพาหนะจำนวน ${taxDueVehicles.length} คัน ที่กำลังจะครบกำหนดชำระภาษีในอีก 90 วันข้างหน้า\n\nรายการรถ:\n` +
      taxDueVehicles.map((v, i) => `${i+1}. [${v.internal_id}] ${v.license_plate} - ${v.brand} ${v.model} (วันครบกำหนด: ${v.tax_due_date}, ยอดชำระ: ${v.tax_amount ? v.tax_amount + ' บาท' : 'ระบุภายหลัง'})`).join('\n') +
      `\n\nโปรดดำเนินการเตรียมเอกสารชำระภาษีล่วงหน้า\nระบบบริหารจัดการยานพาหนะ (VMS)`;

    const newLog = {
      id: db.email_logs.length + 1,
      recipient: 'fleet-dept@egat.co.th',
      subject: `[VMS Alert] แจ้งเตือนภาษียานพาหนะครบกำหนด 90 วัน (${taxDueVehicles.length} คัน)`,
      body: emailBody,
      vehicle_count: taxDueVehicles.length,
      sent_at: new Date().toISOString()
    };

    db.email_logs.push(newLog);
    writeDb(db);

    res.json({
      success: true,
      sentCount: taxDueVehicles.length,
      recipient: 'fleet-dept@egat.co.th',
      message: `ส่งอีเมลแจ้งเตือนสำหรับรถ ${taxDueVehicles.length} คันเรียบร้อยแล้ว`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PN1 Reports API & Evaluation Engine ---
function getDaysInMonth(monthStr) {
  if (!monthStr || !monthStr.includes('-')) return 30;
  const [y, m] = monthStr.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

function evaluatePn1ReportParameters(report, daysInMonth) {
  const logs = report.daily_logs || [];
  const total_working_days = daysInMonth || report.total_working_days || 30;

  const usedDaysSet = new Set();
  const repairDaysSet = new Set();

  let total_distance = 0;
  let total_liters = 0;
  let total_fuel_cost = 0;

  logs.forEach(log => {
    if (log.status_code === '/') {
      usedDaysSet.add(log.date);
      const start = Number(log.start_mileage) || 0;
      const end = Number(log.end_mileage) || 0;
      if (end >= start) {
        total_distance += (end - start);
      }
    } else if (log.status_code === '0') {
      repairDaysSet.add(log.date);
    }

    if (log.is_refueled) {
      const liters = Number(log.fuel_liters) || 0;
      const cost = Number(log.fuel_total_cost) || 0;
      total_liters += liters;
      total_fuel_cost += cost;
    }
  });

  const used_days = usedDaysSet.size;
  const repair_days = repairDaysSet.size;
  const idle_days = Math.max(0, total_working_days - used_days - repair_days);
  const avg_fuel_consumption = total_liters > 0 ? Number((total_distance / total_liters).toFixed(2)) : 0;
  const ur_rate = total_working_days > 0 ? Number(((used_days / total_working_days) * 100).toFixed(1)) : 0.0;

  return {
    total_working_days,
    used_days,
    repair_days,
    idle_days,
    total_distance,
    total_liters,
    total_fuel_cost,
    avg_fuel_consumption,
    ur_rate
  };
}

app.get('/api/pn1-reports', (req, res) => {
  try {
    const db = readDb();
    if (!db.pn1_reports) db.pn1_reports = [];

    const requestedMonth = req.query.month || '2026-09';
    const daysInMonth = getDaysInMonth(requestedMonth);

    // Auto-initialize PN1 report for all vehicles for this month if missing
    let hasChanges = false;
    db.vehicles.forEach(v => {
      let report = db.pn1_reports.find(r => r.vehicle_id === v.id && r.month === requestedMonth);
      if (!report) {
        const newId = db.pn1_reports.length > 0 ? Math.max(...db.pn1_reports.map(r => r.id)) + 1 : 1;
        report = {
          id: newId,
          vehicle_id: v.id,
          internal_id: v.internal_id,
          license_plate: v.license_plate,
          brand_model: `${v.brand} ${v.model}`,
          fuel_type: v.fuel_type || 'ดีเซล',
          department: v.department || 'อหก.',
          month: requestedMonth,
          daily_logs: [],
          total_working_days: daysInMonth,
          used_days: 0,
          idle_days: daysInMonth,
          repair_days: 0,
          total_distance: 0,
          total_liters: 0,
          total_fuel_cost: 0,
          avg_fuel_consumption: 0,
          ur_rate: 0.0,
          created_at: new Date().toISOString()
        };
        db.pn1_reports.push(report);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      writeDb(db);
    }

    const reports = db.pn1_reports
      .filter(r => r.month === requestedMonth)
      .sort((a, b) => a.vehicle_id - b.vehicle_id);

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pn1-reports/:id', (req, res) => {
  try {
    const db = readDb();
    if (!db.pn1_reports) db.pn1_reports = [];

    const reportId = Number(req.params.id);
    const index = db.pn1_reports.findIndex(r => r.id === reportId);
    if (index === -1) {
      return res.status(404).json({ error: 'ไม่พบรายงาน พน.1 ที่ต้องการแก้ไข' });
    }

    const current = db.pn1_reports[index];
    const daysInMonth = getDaysInMonth(current.month);
    const daily_logs = req.body.daily_logs || current.daily_logs || [];

    const calculatedParams = evaluatePn1ReportParameters({ daily_logs }, daysInMonth);

    const updated = {
      ...current,
      daily_logs,
      ...calculatedParams,
      updated_at: new Date().toISOString()
    };

    db.pn1_reports[index] = updated;

    if (daily_logs.length > 0) {
      const maxMileage = Math.max(...daily_logs.map(l => Number(l.end_mileage) || 0));
      const v = db.vehicles.find(x => x.id === current.vehicle_id);
      if (v && maxMileage > v.current_mileage) {
        v.current_mileage = maxMileage;
      }
    }

    writeDb(db);

    res.json({
      success: true,
      message: 'บันทึกการปรับปรุงข้อมูล พน.1 เรียบร้อยแล้ว',
      report: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pn1-reports', (req, res) => {
  try {
    const db = readDb();
    if (!db.pn1_reports) db.pn1_reports = [];

    const daysInMonth = getDaysInMonth(req.body.month);
    const calculatedParams = evaluatePn1ReportParameters(req.body, daysInMonth);

    const newReport = {
      id: db.pn1_reports.length > 0 ? Math.max(...db.pn1_reports.map(r => r.id)) + 1 : 1,
      ...req.body,
      ...calculatedParams,
      created_at: new Date().toISOString()
    };

    db.pn1_reports.unshift(newReport);
    writeDb(db);
    res.json({ id: newReport.id, message: 'บันทึกรายงาน พน.1 เรียบร้อยแล้ว', report: newReport });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download PN1 Template
app.get('/api/pn1-reports/template', (req, res) => {
  try {
    const templatePath = path.join(__dirname, '..', 'Source', 'Template พน.1.xlsx');
    if (fs.existsSync(templatePath)) {
      res.download(templatePath, 'Template พน.1.xlsx');
    } else {
      res.status(404).json({ error: 'ไม่พบไฟล์ Template พน.1.xlsx ในระบบ' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import Data from Excel Template
app.post('/api/pn1-reports/import-data', (req, res) => {
  try {
    const db = readDb();
    if (!db.pn1_reports) db.pn1_reports = [];

    const { records, defaultMonth } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'ไม่พบชุดข้อมูลที่ต้องการนำเข้า' });
    }

    const cleanStr = (s) => (s || '').toString().trim().replace(/\s+/g, '').toLowerCase();

    // Group records by vehicle and month
    const groups = new Map();
    let importedRowsCount = 0;
    const unmatchedRows = [];

    records.forEach((row, idx) => {
      const rawId = row.internal_id || '';
      if (!rawId) {
        unmatchedRows.push({ row: idx + 1, reason: 'ไม่ได้ระบุทะเบียน กฟผ.' });
        return;
      }

      const vehicle = db.vehicles.find(v => 
        cleanStr(v.internal_id) === cleanStr(rawId) ||
        cleanStr(v.license_plate) === cleanStr(rawId)
      );

      if (!vehicle) {
        unmatchedRows.push({ row: idx + 1, internal_id: rawId, reason: `ไม่พบรถรหัส "${rawId}" ในฐานข้อมูล` });
        return;
      }

      const targetMonth = row.month || defaultMonth || (row.date ? row.date.substring(0, 7) : '2026-09');
      const groupKey = `${vehicle.id}_${targetMonth}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          vehicle,
          month: targetMonth,
          rows: []
        });
      }

      groups.get(groupKey).rows.push(row);
      importedRowsCount++;
    });

    const updatedReports = [];

    for (const [_, group] of groups) {
      const { vehicle, month: targetMonth, rows } = group;
      const daysInMonth = getDaysInMonth(targetMonth);

      // Find or create report for this vehicle & month
      let report = db.pn1_reports.find(r => r.vehicle_id === vehicle.id && r.month === targetMonth);
      if (!report) {
        const newId = db.pn1_reports.length > 0 ? Math.max(...db.pn1_reports.map(r => r.id)) + 1 : 1;
        report = {
          id: newId,
          vehicle_id: vehicle.id,
          internal_id: vehicle.internal_id,
          license_plate: vehicle.license_plate,
          brand_model: `${vehicle.brand} ${vehicle.model}`,
          fuel_type: vehicle.fuel_type || 'ดีเซล',
          department: vehicle.department || 'อหก.',
          month: targetMonth,
          daily_logs: [],
          total_working_days: daysInMonth,
          used_days: 0,
          idle_days: daysInMonth,
          repair_days: 0,
          total_distance: 0,
          total_liters: 0,
          total_fuel_cost: 0,
          avg_fuel_consumption: 0,
          ur_rate: 0.0,
          created_at: new Date().toISOString()
        };
        db.pn1_reports.push(report);
      }

      // Merge rows into daily_logs
      rows.forEach(r => {
        const logEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          date: r.date,
          status_code: r.status_code || '/',
          start_mileage: Number(r.start_mileage) || 0,
          end_mileage: Number(r.end_mileage) || 0,
          origin: r.origin || 'สนก.บางกรวย',
          destination: r.destination || 'ภารกิจตามมอบหมาย',
          driver_name: r.driver_name || 'พนักงานขับรถ กฟผ.',
          is_refueled: Boolean(r.fuel_liters && Number(r.fuel_liters) > 0),
          fuel_liters: Number(r.fuel_liters) || null,
          fuel_price_per_liter: Number(r.fuel_price_per_liter) || null,
          fuel_total_cost: Number(r.fuel_total_cost) || (r.fuel_liters && r.fuel_price_per_liter ? Number(r.fuel_liters) * Number(r.fuel_price_per_liter) : null),
          checklist: {
            coolant: r.checklist?.coolant !== false,
            engine_oil: r.checklist?.engine_oil !== false,
            brake: r.checklist?.brake !== false,
            clutch: r.checklist?.clutch !== false,
            tire: r.checklist?.tire !== false,
            signal_light: r.checklist?.signal_light !== false,
            hydraulic: r.checklist?.hydraulic !== false,
            vehicle_body: r.checklist?.vehicle_body !== false
          }
        };

        const existingIdx = report.daily_logs.findIndex(l => l.date === logEntry.date);
        if (existingIdx >= 0) {
          report.daily_logs[existingIdx] = { ...report.daily_logs[existingIdx], ...logEntry };
        } else {
          report.daily_logs.push(logEntry);
        }
      });

      // Sort daily logs by date
      report.daily_logs.sort((a, b) => a.date.localeCompare(b.date));

      // Re-evaluate parameters
      const evaluated = evaluatePn1ReportParameters(report, daysInMonth);
      Object.assign(report, evaluated);
      report.updated_at = new Date().toISOString();

      // Update vehicle current_mileage if max end_mileage is higher
      if (report.daily_logs.length > 0) {
        const maxEndM = Math.max(...report.daily_logs.map(l => Number(l.end_mileage) || 0));
        if (maxEndM > vehicle.current_mileage) {
          vehicle.current_mileage = maxEndM;
        }
      }

      updatedReports.push({
        vehicle_id: vehicle.id,
        internal_id: vehicle.internal_id,
        license_plate: vehicle.license_plate,
        month: targetMonth,
        used_days: report.used_days,
        ur_rate: report.ur_rate,
        total_distance: report.total_distance
      });
    }

    writeDb(db);

    res.json({
      success: true,
      message: `นำเข้าข้อมูล พน.1 สำเร็จ ${importedRowsCount} รายการ สำหรับรถ ${groups.size} คัน`,
      importedRowsCount,
      updatedVehiclesCount: groups.size,
      updatedReports,
      unmatchedRows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export PN1 Reports to multi-sheet Excel (VMC Form 01)
app.post('/api/pn1-reports/export-excel', (req, res) => {
  try {
    const { month, vehicle_ids } = req.body;
    const targetMonth = month || '2026-09';
    const scriptPath = path.join(__dirname, '..', 'scripts', 'export_vmc_excel.py');
    const templatePath = path.join(__dirname, '..', 'Source', 'VMC Form 01.xlsx');

    const tempFileName = `pn1_export_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.xlsx`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    let vehicleArg = 'all';
    if (Array.isArray(vehicle_ids) && vehicle_ids.length > 0 && vehicle_ids[0] !== 'all') {
      vehicleArg = vehicle_ids.join(',');
    }

    const args = [
      scriptPath,
      '--db', dbPath,
      '--template', templatePath,
      '--month', targetMonth,
      '--vehicles', vehicleArg,
      '--output', tempFilePath
    ];

    execFile('python', args, (error, stdout, stderr) => {
      if (error) {
        console.error('Export excel error:', error, stderr);
        return res.status(500).json({ error: 'ไม่สามารถสร้างไฟล์ Excel ได้: ' + (stderr || error.message) });
      }

      const downloadFilename = `รายงาน_พน1_${targetMonth}.xlsx`;
      res.download(tempFilePath, downloadFilename, (err) => {
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch (cleanErr) {
          console.error('Failed to remove temp file:', cleanErr);
        }
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`VMS Backend API running on:`);
  console.log(`- Local:   http://localhost:${PORT}`);
  console.log(`- Network: http://0.0.0.0:${PORT}`);
});

