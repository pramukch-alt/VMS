import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, Gauge, Calendar, Clock } from 'lucide-react';
import { Vehicle } from '../types';
import { fetchVehicles, createWorkOrder } from '../services/api';

const formatToLocalDateTimeInput = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface WorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newId?: number) => void;
}

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [standbyVehicles, setStandbyVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | ''>('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [requesterName, setRequesterName] = useState('สมชาย ใจดี (พนักงาน กฟผ.)');
  const [department, setDepartment] = useState('แผนกปฏิบัติการ อหก.');
  const [purpose, setPurpose] = useState('');
  const [startDatetime, setStartDatetime] = useState<string>(() => formatToLocalDateTimeInput(new Date()));
  const [plannedEndDatetime, setPlannedEndDatetime] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 4);
    return formatToLocalDateTimeInput(d);
  });
  const [startMileage, setStartMileage] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset dates
      const now = new Date();
      setStartDatetime(formatToLocalDateTimeInput(now));
      const end = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      setPlannedEndDatetime(formatToLocalDateTimeInput(end));

      // Fetch only "จอดรองาน" vehicles
      fetchVehicles({ status: 'จอดรองาน' })
        .then(data => {
          setStandbyVehicles(data);
          if (data.length > 0) {
            setSelectedVehicleId(data[0].id);
            setSelectedVehicle(data[0]);
            setStartMileage(data[0].current_mileage);
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const handleVehicleChange = (vId: number) => {
    setSelectedVehicleId(vId);
    const v = standbyVehicles.find(x => x.id === vId) || null;
    setSelectedVehicle(v);
    if (v) {
      setStartMileage(v.current_mileage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !requesterName || !purpose || startMileage === '' || !startDatetime || !plannedEndDatetime) {
      setErrorMsg('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน');
      return;
    }

    if (new Date(plannedEndDatetime) <= new Date(startDatetime)) {
      setErrorMsg('วันและเวลาสิ้นสุดการใช้งาน (กำหนดคืน) ต้องอยู่หลังวันและเวลาเริ่มใช้รถ');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const res = await createWorkOrder({
        vehicle_id: Number(selectedVehicleId),
        requester_name: requesterName,
        department: department,
        purpose: purpose,
        start_mileage: Number(startMileage),
        start_datetime: startDatetime.replace('T', ' '),
        planned_end_datetime: plannedEndDatetime.replace('T', ' ')
      });
      onSuccess(res.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกใบงาน');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-brand-secondary text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-primary rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">เปิดใบงานขอใช้รถ (Self-Service Work Order)</h3>
              <p className="text-xs text-slate-300">นำรถออกใช้งานได้ทันทีโดยไม่ต้องรออนุมัติ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-300 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Vehicle Picker (Standby only) */}
          <div>
            <label className="block text-xs font-semibold text-brand-textPrimary mb-1">
              เลือกรถที่ต้องการเบิกใช้งาน <span className="text-rose-500">* (เฉพาะสถานะ "จอดรองาน")</span>
            </label>
            {standbyVehicles.length === 0 ? (
              <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 text-xs rounded-lg">
                ไม่พบรถที่อยู่ในสถานะ "จอดรองาน" ในขณะนี้
              </div>
            ) : (
              <select
                value={selectedVehicleId}
                onChange={(e) => handleVehicleChange(Number(e.target.value))}
                className="w-full bg-slate-50 border border-brand-border rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-primary focus:bg-white transition-all"
              >
                {standbyVehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    [{v.internal_id}] {v.license_plate} — {v.brand} {v.model} ({v.category})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected Vehicle Info Banner */}
          {selectedVehicle && (
            <div className="bg-brand-amber/80 border border-amber-200 p-3 rounded-lg text-xs flex items-center justify-between text-brand-secondary">
              <div>
                <p className="font-bold">{selectedVehicle.internal_id} ({selectedVehicle.license_plate})</p>
                <p className="text-slate-600">{selectedVehicle.specifications || selectedVehicle.vehicle_type}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 font-semibold text-brand-primary">
                  <Gauge className="w-3.5 h-3.5" />
                  ไมล์ล่าสุด: {selectedVehicle.current_mileage.toLocaleString()} km
                </span>
              </div>
            </div>
          )}

          {/* User & Dept */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">ชื่อผู้ขอเบิก <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="w-full border border-brand-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">แผนก/สังกัด <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-brand-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary"
                required
              />
            </div>
          </div>

          {/* Booking Period (Start & Planned End) */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-secondary flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-primary" />
                กำหนดการจองใช้งาน (Booking Period)
              </span>
              <span className="text-[11px] text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded font-medium">
                * คืนรถก่อนกำหนดได้
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-brand-textPrimary mb-1">
                  วันและเวลาเริ่มใช้รถ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startDatetime}
                  onChange={(e) => setStartDatetime(e.target.value)}
                  className="w-full border border-brand-border bg-white rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-brand-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-textPrimary mb-1">
                  วันและเวลาสิ้นสุด (กำหนดคืน) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={plannedEndDatetime}
                  onChange={(e) => setPlannedEndDatetime(e.target.value)}
                  min={startDatetime}
                  className="w-full border border-brand-border bg-white rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-brand-primary"
                  required
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              💡 ระบุวันเวลาสิ้นสุดเพื่อเป็นการจอง หากเสร็จงานก่อนสามารถส่งคืนรถและระบุเวลาคืนจริงเพื่อปรับสถานะเป็น "จอดรองาน" ได้ทันที
            </p>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-semibold text-brand-textPrimary mb-1">วัตถุประสงค์การใช้งานภารกิจ <span className="text-rose-500">*</span></label>
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="ระบุสถานที่ปฏิบัติงาน หรือภารกิจในการเดินทาง..."
              className="w-full border border-brand-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary"
              required
            />
          </div>

          {/* Start Mileage */}
          <div>
            <label className="block text-xs font-semibold text-brand-textPrimary mb-1">
              เลขไมล์เริ่มต้นก่อนนำรถออก (Start Mileage) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={startMileage}
              onChange={(e) => setStartMileage(Number(e.target.value))}
              className="w-full border border-brand-border rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-brand-primary"
              required
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting || standbyVehicles.length === 0}
              className="bg-brand-primary hover:bg-brand-primaryHover text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-all shadow-md"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{submitting ? 'กำลังบันทึก...' : 'บันทึกและนำรถออกใช้งาน'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
