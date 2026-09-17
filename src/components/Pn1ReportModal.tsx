import React, { useState, useEffect } from 'react';
import { X, FileText, Plus, Trash2, CheckCircle2, AlertCircle, Fuel, Gauge, MapPin, User, Calendar, CheckSquare, Activity } from 'lucide-react';
import { Vehicle, Pn1Report, Pn1DailyLog, Pn1DailyChecklist } from '../types';
import { createPn1Report, updatePn1Report } from '../services/api';

interface Pn1ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicles: Vehicle[];
  reportToEdit?: Pn1Report | null;
  defaultMonth?: string;
}

const defaultChecklist: Pn1DailyChecklist = {
  coolant: false,
  engine_oil: false,
  brake: false,
  clutch: false,
  tire: false,
  signal_light: false,
  hydraulic: false,
  vehicle_body: false
};

const allCheckedList: Pn1DailyChecklist = {
  coolant: true,
  engine_oil: true,
  brake: true,
  clutch: true,
  tire: true,
  signal_light: true,
  hydraulic: true,
  vehicle_body: true
};

export const Pn1ReportModal: React.FC<Pn1ReportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vehicles,
  reportToEdit,
  defaultMonth = '2026-09'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [month, setMonth] = useState(defaultMonth);
  const [dailyLogs, setDailyLogs] = useState<Pn1DailyLog[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (reportToEdit) {
        setMonth(reportToEdit.month || defaultMonth);
        const v = vehicles.find(item => item.id === reportToEdit.vehicle_id);
        setSelectedVehicle(v || null);
        setDailyLogs(reportToEdit.daily_logs ? [...reportToEdit.daily_logs] : []);
      } else {
        setMonth(defaultMonth);
        setDailyLogs([]);
        if (vehicles.length > 0 && !selectedVehicle) {
          setSelectedVehicle(vehicles[0]);
        }
      }
    }
  }, [isOpen, reportToEdit, defaultMonth, vehicles]);

  if (!isOpen) return null;

  const filteredVehicles = vehicles.filter(v => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      v.internal_id.toLowerCase().includes(term) ||
      v.license_plate.toLowerCase().includes(term) ||
      v.brand.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term) ||
      (v.department && v.department.toLowerCase().includes(term))
    );
  });

  const handleAddDailyLog = () => {
    const lastLog = dailyLogs.length > 0 ? dailyLogs[dailyLogs.length - 1] : null;
    let nextDate = '2026-09-01';
    let nextStartMileage = selectedVehicle ? selectedVehicle.current_mileage : 15000;
    let nextOrigin = selectedVehicle ? selectedVehicle.base_location : 'สนก.บางกรวย';
    let nextDriver = 'สมชาย ใจดี';

    if (lastLog) {
      // Rule 1 & 2 & 3: Continuities from previous day
      const [y, m, d] = lastLog.date.split('-').map(Number);
      const nextD = new Date(y, m - 1, d + 1);
      nextDate = `${nextD.getFullYear()}-${String(nextD.getMonth() + 1).padStart(2, '0')}-${String(nextD.getDate()).padStart(2, '0')}`;
      
      nextStartMileage = lastLog.end_mileage || lastLog.start_mileage;
      nextOrigin = lastLog.destination || lastLog.origin;
      nextDriver = lastLog.driver_name || 'สมชาย ใจดี';
    }

    const newLog: Pn1DailyLog = {
      id: Math.random().toString(36).substring(2, 9),
      date: nextDate,
      status_code: '/',
      start_mileage: nextStartMileage,
      end_mileage: nextStartMileage + 45,
      origin: nextOrigin,
      destination: 'สนก.บางกรวย',
      driver_name: nextDriver,
      is_refueled: false,
      fuel_liters: 0,
      fuel_price_per_liter: 32.5,
      fuel_total_cost: 0,
      checklist: { ...defaultChecklist }
    };

    setDailyLogs([...dailyLogs, newLog]);
  };

  const handleUpdateDailyLog = (id: string, field: keyof Pn1DailyLog, value: any) => {
    setDailyLogs(logs =>
      logs.map(log => {
        if (log.id !== id) return log;
        const updated = { ...log, [field]: value };

        // Auto calculate fuel_total_cost if liters or price changes
        if (field === 'fuel_liters' || field === 'fuel_price_per_liter') {
          const l = field === 'fuel_liters' ? Number(value) : (log.fuel_liters || 0);
          const p = field === 'fuel_price_per_liter' ? Number(value) : (log.fuel_price_per_liter || 0);
          updated.fuel_total_cost = Number((l * p).toFixed(2));
        }
        return updated;
      })
    );
  };

  const handleUpdateChecklist = (id: string, key: keyof Pn1DailyChecklist, value: boolean) => {
    setDailyLogs(logs =>
      logs.map(log => {
        if (log.id !== id) return log;
        return {
          ...log,
          checklist: {
            ...log.checklist,
            [key]: value
          }
        };
      })
    );
  };

  const handleToggleCheckAll = (id: string) => {
    setDailyLogs(logs =>
      logs.map(log => {
        if (log.id !== id) return log;
        const allChecked = Object.values(log.checklist).every(Boolean);
        return {
          ...log,
          checklist: allChecked ? { ...defaultChecklist } : { ...allCheckedList }
        };
      })
    );
  };

  const handleRemoveDailyLog = (id: string) => {
    setDailyLogs(logs => logs.filter(log => log.id !== id));
  };

  // --- Calculations for Summary Card & UR Rate ---
  const getDaysInMonth = (monthStr: string) => {
    if (!monthStr || !monthStr.includes('-')) return 30;
    const [y, m] = monthStr.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  };

  const totalLiters = dailyLogs.reduce((sum, l) => sum + (l.is_refueled && l.fuel_liters ? Number(l.fuel_liters) : 0), 0);
  const totalFuelCost = dailyLogs.reduce((sum, l) => sum + (l.is_refueled && l.fuel_total_cost ? Number(l.fuel_total_cost) : 0), 0);

  const totalWorkingDays = getDaysInMonth(month);
  const usedDays = dailyLogs.filter(l => l.status_code === '/').length;
  const repairDays = dailyLogs.filter(l => l.status_code === '0').length;
  const idleDays = Math.max(0, totalWorkingDays - usedDays - repairDays);
  const urRate = totalWorkingDays > 0 ? Number(((usedDays / totalWorkingDays) * 100).toFixed(1)) : 0.0;

  const totalDistance = dailyLogs.reduce((sum, l) => {
    if (l.status_code === '/' && l.end_mileage >= l.start_mileage) {
      return sum + (l.end_mileage - l.start_mileage);
    }
    return sum;
  }, 0);

  const avgFuelConsumption = totalLiters > 0 ? Number((totalDistance / totalLiters).toFixed(2)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) {
      setErrorMsg('กรุณาเลือกยานพาหนะก่อนบันทึกรายงาน');
      return;
    }

    // Validation Rule: If refueled, checklist items MUST be filled!
    for (const log of dailyLogs) {
      if (log.is_refueled && log.fuel_liters && log.fuel_liters > 0) {
        const hasChecklist = Object.values(log.checklist).some(Boolean);
        if (!hasChecklist) {
          setErrorMsg(`วันที่ ${log.date}: มีการบันทึกเติมน้ำมัน จำเป็นต้องทำเครื่องหมายตรวจสอบก่อนการใช้งานด้วย`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload: Partial<Pn1Report> = {
        vehicle_id: selectedVehicle.id,
        internal_id: selectedVehicle.internal_id,
        license_plate: selectedVehicle.license_plate,
        brand_model: `${selectedVehicle.brand} ${selectedVehicle.model}`,
        fuel_type: selectedVehicle.fuel_type || 'ดีเซล',
        department: selectedVehicle.department || 'อหก.',
        month: month,
        daily_logs: dailyLogs,
        total_liters: Number(totalLiters.toFixed(2)),
        total_fuel_cost: Number(totalFuelCost.toFixed(2)),
        total_working_days: totalWorkingDays,
        used_days: usedDays,
        total_distance: totalDistance,
        idle_days: idleDays,
        repair_days: repairDays,
        avg_fuel_consumption: avgFuelConsumption,
        ur_rate: urRate
      };

      if (reportToEdit && reportToEdit.id) {
        await updatePn1Report(reportToEdit.id, payload);
      } else {
        await createPn1Report(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกรายงาน พน.1');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-brand-secondary text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-brand-primary rounded-xl text-white">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {reportToEdit ? `บันทึก / แก้ไขรายละเอียดการเดินทาง (${selectedVehicle?.internal_id || reportToEdit.internal_id})` : 'สร้างรายงาน พน.1 ประจำเดือน'}
              </h3>
              <p className="text-xs text-slate-300">
                {reportToEdit ? `ทะเบียน: ${reportToEdit.license_plate} | สังกัด: ${reportToEdit.department} | ประจำเดือน: ${month}` : 'บันทึกประวัติการใช้รถ เลขไมล์ ปริมาณน้ำมัน และรายการตรวจสอบก่อนใช้งาน'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-300 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section A: Vehicle Selection & Vehicle Info Card */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Search & Select Vehicle */}
              <div>
                <label className="block text-xs font-extrabold text-brand-secondary mb-1">
                  ค้นหา / เลือกยานพาหนะ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ค้นตามทะเบียน กฟผ., ทะเบียนรถ, ยี่ห้อ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs mb-1 focus:ring-2 focus:ring-brand-primary"
                  />
                  <select
                    value={selectedVehicle ? selectedVehicle.id : ''}
                    onChange={(e) => {
                      const v = vehicles.find(item => item.id === Number(e.target.value));
                      if (v) setSelectedVehicle(v);
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-bold text-slate-800 focus:ring-2 focus:ring-brand-primary"
                  >
                    {filteredVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.internal_id} | {v.license_plate} ({v.brand} {v.model}) - สังกัด: {v.department}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Month Selection */}
              <div>
                <label className="block text-xs font-extrabold text-brand-secondary mb-1">
                  ประจำเดือน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-bold bg-white"
                  required
                />
              </div>
            </div>

            {/* Auto-populated Vehicle Detail Specs Grid */}
            {selectedVehicle && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs shadow-inner">
                <div>
                  <span className="text-slate-400 block text-[11px]">เลขทะเบียนภายใน กฟผ.</span>
                  <span className="font-extrabold text-brand-secondary text-sm">{selectedVehicle.internal_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">ทะเบียนขนส่ง</span>
                  <span className="font-bold text-slate-800">{selectedVehicle.license_plate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">ยี่ห้อและรุ่นรถ</span>
                  <span className="font-semibold text-slate-700">{selectedVehicle.brand} {selectedVehicle.model}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">ชนิดของเชื้อเพลิง</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                    {selectedVehicle.fuel_type || 'ดีเซล'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">หน่วยงาน / สังกัด</span>
                  <span className="font-bold text-brand-primary bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                    {selectedVehicle.department || 'อหก.'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section B: Daily Usage Logs Header */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h4 className="text-sm font-bold text-brand-secondary flex items-center gap-2">
                <span>บันทึกข้อมูลการใช้งานประจำวัน</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                  {dailyLogs.length} รายการ
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">กดปุ่ม "+" เพื่อบันทึกวันถัดไป (ระบบจะเชื่อมโยงเลขไมล์ ต้นทาง และชื่อคนขับจากวันก่อนให้อัตโนมัติ)</p>
            </div>
            <button
              type="button"
              onClick={handleAddDailyLog}
              className="bg-brand-primary hover:bg-brand-primaryHover text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มวันใช้งาน</span>
            </button>
          </div>

          {/* Daily Logs List */}
          {dailyLogs.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">ยังไม่มีรายการบันทึกวันใช้งาน กดปุ่ม "+ เพิ่มวันใช้งาน" เพื่อเริ่มกรอกข้อมูล</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dailyLogs.map((log, index) => (
                <div key={log.id} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4.5 space-y-3 relative hover:border-slate-300 transition-colors shadow-xs">
                  {/* Row Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-brand-secondary text-white text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="flex items-center space-x-2">
                        <label className="text-xs font-bold text-slate-700">วันที่:</label>
                        <input
                          type="date"
                          value={log.date}
                          onChange={(e) => handleUpdateDailyLog(log.id, 'date', e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Status Code Dropdown */}
                      <div className="flex items-center space-x-1.5">
                        <label className="text-xs font-bold text-slate-700">รหัสการทำงาน:</label>
                        <select
                          value={log.status_code}
                          onChange={(e) => handleUpdateDailyLog(log.id, 'status_code', e.target.value)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                            log.status_code === '/'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : log.status_code === '*'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          <option value="/">/ = ใช้งาน (In Use)</option>
                          <option value="*">* = ว่างงาน (Standby)</option>
                          <option value="0">0 = ซ่อม (Maintenance)</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveDailyLog(log.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Main Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    {/* Mileage Inputs */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">กม. ก่อนออกใช้งาน</label>
                      <input
                        type="number"
                        value={log.start_mileage}
                        onChange={(e) => handleUpdateDailyLog(log.id, 'start_mileage', Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">กม. เสร็จจากใช้งาน</label>
                      <input
                        type="number"
                        value={log.end_mileage}
                        onChange={(e) => handleUpdateDailyLog(log.id, 'end_mileage', Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-brand-primary"
                      />
                    </div>

                    {/* Locations */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">สถานที่ใช้งาน (ต้นทาง)</label>
                      <input
                        type="text"
                        value={log.origin}
                        onChange={(e) => handleUpdateDailyLog(log.id, 'origin', e.target.value)}
                        placeholder="ระบุต้นทาง..."
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">สถานที่ใช้งาน (ปลายทาง)</label>
                      <input
                        type="text"
                        value={log.destination}
                        onChange={(e) => handleUpdateDailyLog(log.id, 'destination', e.target.value)}
                        placeholder="ระบุปลายทาง..."
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                      />
                    </div>
                  </div>

                  {/* Driver Name */}
                  <div className="flex items-center space-x-2 text-xs">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <label className="font-semibold text-slate-600 shrink-0">ชื่อพนักงานขับ:</label>
                    <input
                      type="text"
                      value={log.driver_name}
                      onChange={(e) => handleUpdateDailyLog(log.id, 'driver_name', e.target.value)}
                      placeholder="ระบุชื่อพนักงานขับรถ..."
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 flex-1"
                    />
                  </div>

                  {/* Refuel & Inspection Checklists Accordion Zone */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                    {/* Refuel Optional Section */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={log.is_refueled}
                          onChange={(e) => handleUpdateDailyLog(log.id, 'is_refueled', e.target.checked)}
                          className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary"
                        />
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                          <Fuel className="w-3.5 h-3.5 text-emerald-600" />
                          เมื่อเติมน้ำมัน (Optional)
                        </span>
                      </label>

                      {log.is_refueled && (
                        <span className="text-[11px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          * จำเป็นต้องทำเครื่องหมายตรวจสอบก่อนการใช้งานด้านล่าง
                        </span>
                      )}
                    </div>

                    {log.is_refueled && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 animate-in fade-in duration-150">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">จำนวนที่เติม (ลิตร)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={log.fuel_liters || ''}
                            onChange={(e) => handleUpdateDailyLog(log.id, 'fuel_liters', e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="เช่น 45.0"
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-emerald-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">ราคาต่อลิตร (บาท)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={log.fuel_price_per_liter || ''}
                            onChange={(e) => handleUpdateDailyLog(log.id, 'fuel_price_per_liter', e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="เช่น 32.50"
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">ราคาเชื้อเพลิงรวม (บาท)</label>
                          <input
                            type="number"
                            value={log.fuel_total_cost || ''}
                            onChange={(e) => handleUpdateDailyLog(log.id, 'fuel_total_cost', e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="ระบุราคาเชื้อเพลิงรวม..."
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 font-extrabold text-emerald-800"
                          />
                        </div>
                      </div>
                    )}

                    {/* Checkbox List: ตรวจสอบก่อนการใช้งาน (8 items) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <CheckSquare className="w-3.5 h-3.5 text-brand-primary" />
                          ตรวจสอบก่อนการใช้งาน (8 รายการ):
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleCheckAll(log.id)}
                          className="text-[11px] font-bold text-brand-primary hover:underline cursor-pointer"
                        >
                          {Object.values(log.checklist).every(Boolean) ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด (Check All)'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {[
                          { key: 'coolant', label: '1. น้ำหล่อเย็น' },
                          { key: 'engine_oil', label: '2. น้ำมันเครื่อง' },
                          { key: 'brake', label: '3. เบรก' },
                          { key: 'clutch', label: '4. คลัช' },
                          { key: 'tire', label: '5. ยาง' },
                          { key: 'signal_light', label: '6. ไฟสัญญาณ' },
                          { key: 'hydraulic', label: '7. ไฮดรอลิค' },
                          { key: 'vehicle_body', label: '8. ตัวรถ' }
                        ].map((item) => (
                          <label key={item.key} className="flex items-center space-x-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={log.checklist[item.key as keyof Pn1DailyChecklist]}
                              onChange={(e) => handleUpdateChecklist(log.id, item.key as keyof Pn1DailyChecklist, e.target.checked)}
                              className="w-3.5 h-3.5 text-brand-primary rounded focus:ring-brand-primary"
                            />
                            <span className="text-[11px] text-slate-700 font-medium">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section C: Live Report Summary Card Output */}
          <div className="bg-brand-surface rounded-2xl border-2 border-brand-primary/40 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="text-base font-bold text-brand-secondary flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-primary" />
                <span>สรุปผลรายงาน พน.1 ประจำเดือน ({month})</span>
              </h4>
              <span className="text-xs font-bold text-brand-primary bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                คำนวณอัตโนมัติ Real-Time
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">จำนวนวันทำการในเดือน</span>
                <span className="text-base font-extrabold text-slate-800 mt-0.5 block">{totalWorkingDays} วัน</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="text-emerald-700 block text-[11px] font-bold">วันใช้งาน (รหัส /)</span>
                <span className="text-base font-black text-emerald-800 mt-0.5 block">{usedDays} วัน</span>
                <span className="text-[11px] text-emerald-700 block font-semibold">ระยะทางรวม: {totalDistance.toLocaleString()} km</span>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="text-amber-800 block text-[11px] font-bold">วันว่างงาน (รหัส *)</span>
                <span className="text-base font-black text-amber-900 mt-0.5 block">{idleDays} วัน</span>
              </div>
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                <span className="text-rose-700 block text-[11px] font-bold">วันซ่อม (รหัส 0)</span>
                <span className="text-base font-black text-rose-800 mt-0.5 block">{repairDays} วัน</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">จำนวนลิตรที่เติมตลอดเดือน</span>
                <span className="text-lg font-black text-brand-secondary mt-0.5 block">{totalLiters.toLocaleString()} ลิตร</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">ราคารวมเชื้อเพลิงทั้งหมด</span>
                <span className="text-lg font-black text-emerald-700 mt-0.5 block">{totalFuelCost.toLocaleString()} ฿</span>
              </div>
              <div className="bg-amber-100/70 p-3.5 rounded-xl border border-amber-300">
                <span className="text-slate-700 block text-[11px] font-extrabold">สิ้นเปลืองน้ำมันเฉลี่ย</span>
                <span className="text-xl font-black text-brand-primary mt-0.5 block">
                  {avgFuelConsumption > 0 ? `${avgFuelConsumption} km/L` : '-'}
                </span>
              </div>
              <div className={`p-3.5 rounded-xl border ${urRate > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                <span className="block text-[11px] font-extrabold uppercase">อัตราการใช้งาน (UR Rate)</span>
                <span className="text-xl font-black mt-0.5 block">{urRate}%</span>
                <span className="text-[10px] font-bold block">{urRate > 0 ? '✓ มีการใช้งานในเดือนนี้' : '• ไม่ได้ถูกใช้งาน (Default)'}</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-primary hover:bg-brand-primaryHover text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'กำลังบันทึก...' : reportToEdit ? 'บันทึกการปรับปรุงข้อมูล พน.1' : 'บันทึกสร้างรายงาน พน.1'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
