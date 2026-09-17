-- ==============================================================================
-- EGAT VMS (Vehicle Management System) Database Schema for Supabase (PostgreSQL)
-- ==============================================================================

-- 1. VEHICLES TABLE (ข้อมูลยานพาหนะและเครื่องจักรกล)
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

-- Indexes for vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_dept ON vehicles(department);
CREATE INDEX IF NOT EXISTS idx_vehicles_internal_id ON vehicles(internal_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_tax_due ON vehicles(tax_due_date);

-- 2. WORK ORDERS TABLE (ใบงานขอใช้รถและการจอง)
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

CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle ON work_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);

-- 3. FUEL LOGS TABLE (ประวัติการเติมน้ำมัน)
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

CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON fuel_logs(refuel_date);

-- 4. MAINTENANCE RECORDS TABLE (ประวัติการซ่อมบำรุง)
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

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_records(vehicle_id);

-- 5. EMAIL LOGS TABLE (ประวัติการส่งแจ้งเตือนภาษี 90 วัน)
CREATE TABLE IF NOT EXISTS email_logs (
    id BIGSERIAL PRIMARY KEY,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT,
    vehicle_count INTEGER DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PN1 REPORTS TABLE (รายงาน พน.1 ประจำเดือน)
CREATE TABLE IF NOT EXISTS pn1_reports (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    internal_id TEXT NOT NULL,
    license_plate TEXT,
    brand_model TEXT,
    fuel_type TEXT DEFAULT 'ดีเซล',
    department TEXT DEFAULT 'อหก.',
    month TEXT NOT NULL, -- e.g. '2026-09'
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

CREATE INDEX IF NOT EXISTS idx_pn1_reports_month ON pn1_reports(month);
CREATE INDEX IF NOT EXISTS idx_pn1_reports_vehicle_month ON pn1_reports(vehicle_id, month);

-- ==============================================================================
-- Enable Row Level Security (RLS) & Policies
-- ==============================================================================
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pn1_reports ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all users (or restrict as needed)
CREATE POLICY "Allow public read-write for vehicles" ON vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for work_orders" ON work_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for fuel_logs" ON fuel_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for maintenance_records" ON maintenance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for email_logs" ON email_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for pn1_reports" ON pn1_reports FOR ALL USING (true) WITH CHECK (true);
