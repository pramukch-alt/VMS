import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const excelPath = path.join(__dirname, '..', 'Source', 'Database', '17 Sep 2026', 'Database.xlsx');
if (!fs.existsSync(excelPath)) {
  console.error(`❌ File not found at ${excelPath}`);
  process.exit(1);
}

console.log(`📖 Reading Excel file from: ${excelPath}`);
const wb = XLSX.readFile(excelPath);
const sheet = wb.Sheets['Database'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const dbJsonPath = path.join(__dirname, '..', 'server', 'database.json');
const dbData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));

let updateCount = 0;
const updateLog = [];

for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  if (!row || row[0] === undefined) continue;

  const seq = Number(row[0]);
  const internal_id = String(row[2] || '').trim();
  const license_plate = String(row[3] || '').trim();
  const rawMileage = row[10];
  const rawLocation = row[11];

  let v = dbData.vehicles.find(item => item.seq === seq);
  if (!v) {
    v = dbData.vehicles.find(item => item.internal_id === internal_id || item.license_plate === license_plate);
  }

  if (!v) {
    console.warn(`⚠️ No matching vehicle in database.json for row ${r}: seq ${seq}, ${internal_id}`);
    continue;
  }

  const oldMileage = v.current_mileage;
  const oldLocation = v.base_location;

  // Real mileage from Column K (or 0 if blank/unrecorded/trailer)
  const hasMileage = rawMileage !== undefined && rawMileage !== null && String(rawMileage).trim() !== '' && !isNaN(Number(rawMileage));
  const newMileage = hasMileage ? Number(rawMileage) : 0;

  // Real Base Location from Column L
  const newLocation = (rawLocation !== undefined && rawLocation !== null && String(rawLocation).trim() !== '')
    ? String(rawLocation).trim()
    : v.base_location;

  v.current_mileage = newMileage;
  v.base_location = newLocation;

  updateCount++;
  updateLog.push({
    id: v.id,
    seq: v.seq,
    internal_id: v.internal_id,
    license_plate: v.license_plate,
    oldMileage,
    newMileage,
    oldLocation,
    newLocation
  });
}

// 1. Write updated database.json
fs.writeFileSync(dbJsonPath, JSON.stringify(dbData, null, 2), 'utf8');
console.log(`✅ Updated ${updateCount} vehicles in ${dbJsonPath}`);

// 2. Also copy latest Excel to Source/Database.xlsx
const rootExcelPath = path.join(__dirname, '..', 'Source', 'Database.xlsx');
try {
  fs.copyFileSync(excelPath, rootExcelPath);
  console.log(`✅ Copied latest Excel to ${rootExcelPath}`);
} catch (e) {
  console.warn(`⚠️ Could not copy to ${rootExcelPath}:`, e.message);
}

// 3. Update Neon PostgreSQL Database
const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_POOLED;
if (dbUrl) {
  console.log(`🔗 Connecting to Neon PostgreSQL...`);
  const sql = neon(dbUrl);

  try {
    let neonUpdated = 0;
    for (const item of updateLog) {
      await sql.query(`
        UPDATE vehicles
        SET current_mileage = $1, base_location = $2
        WHERE id = $3;
      `, [item.newMileage, item.newLocation, item.id]);
      neonUpdated++;
    }
    console.log(`✅ Successfully updated ${neonUpdated} vehicles in Neon PostgreSQL!`);

    // Verify Neon sample
    const sample = await sql.query(`
      SELECT id, internal_id, license_plate, current_mileage, base_location
      FROM vehicles
      ORDER BY id ASC
      LIMIT 10;
    `);
    console.log('\n📊 Sample updated rows from Neon PostgreSQL:');
    console.table(sample);
  } catch (neonErr) {
    console.error('❌ Error updating Neon PostgreSQL:', neonErr);
  }
} else {
  console.warn('⚠️ No DATABASE_URL found in .env, skipped Neon PostgreSQL update');
}
