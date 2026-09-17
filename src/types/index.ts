export interface Vehicle {
  id: number;
  seq: number;
  department: string; // สังกัด (เช่น อหก.)
  internal_id: string;
  license_plate: string;
  brand: string;
  model: string;
  category: 'ยานพาหนะเดินทาง' | 'รถเครื่องจักรกล' | string;
  vehicle_type: string;
  fuel_type: string; // ชนิดของเชื้อเพลิง (เช่น ดีเซล, ดีเซล B7, แก๊สโซฮอล์ 95, เบนซิน)
  specifications: string;
  base_location: 'สนก.บางกรวย' | 'เขื่อนท่าทุ่งนา' | string;
  status: 'จอดรองาน' | 'ใช้งาน' | 'รอซ่อม' | 'ซ่อม' | 'รอยุบสภาพ' | 'ยุบสภาพ' | string;
  registration_date: string | null;
  tax_due_date: string | null;
  tax_amount: number | null;
  current_mileage: number;
  created_at?: string;
  maintenanceHistory?: MaintenanceRecord[];
  fuelHistory?: FuelLog[];
  workOrderHistory?: WorkOrder[];
}

export interface WorkOrder {
  id: number;
  vehicle_id: number;
  internal_id?: string;
  license_plate?: string;
  brand?: string;
  model?: string;
  category?: string;
  requester_name: string;
  department: string;
  purpose: string;
  start_datetime: string;
  planned_end_datetime?: string | null;
  end_datetime?: string | null;
  start_mileage: number;
  end_mileage?: number | null;
  total_distance?: number | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at?: string;
}

export interface MaintenanceRecord {
  id: number;
  vehicle_id: number;
  internal_id?: string;
  license_plate?: string;
  brand?: string;
  model?: string;
  record_type: string;
  service_date: string;
  next_due_date?: string | null;
  cost: number;
  remarks?: string;
  created_at?: string;
}

export interface FuelLog {
  id: number;
  vehicle_id: number;
  work_order_id?: number | null;
  internal_id?: string;
  license_plate?: string;
  brand?: string;
  model?: string;
  refuel_date: string;
  liters: number;
  total_amount: number;
  odometer: number;
  receipt_no?: string;
  created_at?: string;
}

export interface DashboardStats {
  metrics: {
    total: number;
    standby: number;
    inUse: number;
    maintenance: number;
    taxDue90Days: number;
  };
  taxAlerts: Vehicle[];
}

export interface Pn1DailyChecklist {
  coolant: boolean; // น้ำหล่อเย็น
  engine_oil: boolean; // น้ำมันเครื่อง
  brake: boolean; // เบรก
  clutch: boolean; // คลัช
  tire: boolean; // ยาง
  signal_light: boolean; // ไฟสัญญาณ
  hydraulic: boolean; // ไฮดรอลิค
  vehicle_body: boolean; // ตัวรถ
}

export interface Pn1DailyLog {
  id: string;
  date: string; // วันที่
  status_code: '/' | '*' | '0'; // / = ใช้งาน, * = ว่างงาน, 0 = ซ่อม
  start_mileage: number; // เลข กม./ชั่วโมงทำงาน ก่อนออกใช้งาน
  end_mileage: number; // เลข กม./ชั่วโมงทำงาน เสร็จจากใช้งาน
  origin: string; // ต้นทาง
  destination: string; // ปลายทาง
  driver_name: string; // ชื่อพนักงานขับ
  is_refueled: boolean; // เมื่อเติมน้ำมัน (Optional)
  fuel_mileage?: number | null; // เลขไมล์เมื่อเติมน้ำมัน
  fuel_liters?: number | null; // จำนวนที่เติม (ลิตร)
  fuel_price_per_liter?: number | null; // ราคาต่อลิตร (บาท)
  fuel_total_cost?: number | null; // ราคาเชื้อเพลิง (บาท)
  department?: string; // หน่วยงานผู้ใช้งาน
  checklist: Pn1DailyChecklist; // ตรวจสอบก่อนการใช้งาน (8 checkboxes)
}

export interface Pn1Report {
  id: number;
  vehicle_id: number;
  internal_id: string;
  license_plate: string;
  brand_model: string;
  fuel_type: string;
  department: string;
  month: string; // e.g. "2026-09"
  daily_logs: Pn1DailyLog[];
  // Calculated Summary Metrics
  total_liters: number;
  total_fuel_cost: number;
  total_working_days: number;
  used_days: number;
  total_distance: number;
  idle_days: number;
  repair_days: number;
  avg_fuel_consumption: number; // km/L
  ur_rate: number; // % อัตราการใช้งานยานพาหนะ (e.g. 0.0 or 25.0)
  created_at: string;
}
