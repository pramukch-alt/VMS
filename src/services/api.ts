import { Vehicle, WorkOrder, MaintenanceRecord, FuelLog, DashboardStats } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '') + '/api';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export async function fetchVehicles(filters?: {
  category?: string;
  status?: string;
  search?: string;
  base_location?: string;
}): Promise<Vehicle[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.base_location) params.append('base_location', filters.base_location);

  const res = await fetch(`${API_BASE}/vehicles?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch vehicles');
  return res.json();
}

export async function fetchVehicleDetail(id: number): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles/${id}`);
  if (!res.ok) throw new Error('Failed to fetch vehicle detail');
  return res.json();
}

export async function createVehicle(vehicle: Partial<Vehicle>): Promise<{ id: number; message: string }> {
  const res = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vehicle)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create vehicle');
  }
  return res.json();
}

export async function updateVehicle(id: number, vehicle: Partial<Vehicle>): Promise<{ success: boolean; message: string; vehicle: Vehicle }> {
  const res = await fetch(`${API_BASE}/vehicles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vehicle)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update vehicle details');
  }
  return res.json();
}

export async function updateVehicleStatus(id: number, status: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/vehicles/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update vehicle status');
  }
  return res.json();
}

export async function fetchWorkOrders(): Promise<WorkOrder[]> {
  const res = await fetch(`${API_BASE}/work-orders`);
  if (!res.ok) throw new Error('Failed to fetch work orders');
  return res.json();
}

export async function createWorkOrder(data: {
  vehicle_id: number;
  requester_name: string;
  department: string;
  purpose: string;
  start_mileage: number;
  start_datetime?: string;
  planned_end_datetime?: string;
}): Promise<{ id: number; message: string }> {
  const res = await fetch(`${API_BASE}/work-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create work order');
  }
  return res.json();
}

export async function completeWorkOrder(id: number, end_mileage: number, end_datetime?: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/work-orders/${id}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ end_mileage, end_datetime })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to complete work order');
  }
  return res.json();
}

export async function fetchFuelLogs(): Promise<{
  logs: FuelLog[];
  summary: { totalLiters: number; totalAmount: number; avgCostPerLiter: number };
}> {
  const res = await fetch(`${API_BASE}/fuel-logs`);
  if (!res.ok) throw new Error('Failed to fetch fuel logs');
  return res.json();
}

export async function createFuelLog(data: Partial<FuelLog>): Promise<{ id: number }> {
  const res = await fetch(`${API_BASE}/fuel-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create fuel log');
  return res.json();
}

export async function fetchMaintenanceRecords(): Promise<MaintenanceRecord[]> {
  const res = await fetch(`${API_BASE}/maintenance`);
  if (!res.ok) throw new Error('Failed to fetch maintenance records');
  return res.json();
}

export async function createMaintenanceRecord(data: Partial<MaintenanceRecord>): Promise<{ id: number; message: string; record: MaintenanceRecord }> {
  const res = await fetch(`${API_BASE}/maintenance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create maintenance record' }));
    throw new Error(err.error || 'Failed to create maintenance record');
  }
  return res.json();
}

export async function updateMaintenanceRecord(id: number, data: Partial<MaintenanceRecord>): Promise<{ success: boolean; message: string; record: MaintenanceRecord }> {
  const res = await fetch(`${API_BASE}/maintenance/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update maintenance record' }));
    throw new Error(err.error || 'Failed to update maintenance record');
  }
  return res.json();
}

export async function deleteMaintenanceRecord(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/maintenance/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to delete maintenance record' }));
    throw new Error(err.error || 'Failed to delete maintenance record');
  }
  return res.json();
}

export async function sendTaxAlertEmail(): Promise<{ sentCount: number; message: string }> {
  const res = await fetch(`${API_BASE}/alerts/send-email`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to send tax alert email');
  return res.json();
}

export async function fetchPn1Reports(month?: string): Promise<import('../types').Pn1Report[]> {
  const url = month ? `${API_BASE}/pn1-reports?month=${encodeURIComponent(month)}` : `${API_BASE}/pn1-reports`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch PN1 reports');
  return res.json();
}

export async function createPn1Report(data: Partial<import('../types').Pn1Report>): Promise<{ id: number; message: string; report: import('../types').Pn1Report }> {
  const res = await fetch(`${API_BASE}/pn1-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create PN1 report');
  }
  return res.json();
}

export async function updatePn1Report(id: number, data: Partial<import('../types').Pn1Report>): Promise<{ success: boolean; message: string; report: import('../types').Pn1Report }> {
  const res = await fetch(`${API_BASE}/pn1-reports/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update PN1 report');
  }
  return res.json();
}

export async function importPn1ExcelData(data: {
  records: any[];
  defaultMonth?: string;
}): Promise<{
  success: boolean;
  message: string;
  importedRowsCount: number;
  updatedVehiclesCount: number;
  updatedReports: any[];
  unmatchedRows: any[];
}> {
  const res = await fetch(`${API_BASE}/pn1-reports/import-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to import PN1 data');
  }
  return res.json();
}

export async function exportPn1Excel(month: string, vehicleIds?: number[] | string): Promise<void> {
  const res = await fetch(`${API_BASE}/pn1-reports/export-excel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      month,
      vehicle_ids: vehicleIds || 'all'
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Export failed' }));
    throw new Error(err.error || 'ไม่สามารถส่งออกไฟล์ Excel ได้');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `รายงาน_พน1_${month}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

