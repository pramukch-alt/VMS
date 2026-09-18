import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Navigation, Calendar, Clock, AlertCircle } from 'lucide-react';
import { WorkOrder } from '../types';
import { completeWorkOrder } from '../services/api';

const formatToLocalDateTimeInput = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface CompleteWorkOrderModalProps {
  workOrder: WorkOrder | null;
  onClose: () => void;
  onSuccess: (completedId?: number) => void;
}

export const CompleteWorkOrderModal: React.FC<CompleteWorkOrderModalProps> = ({ workOrder, onClose, onSuccess }) => {
  const [endMileage, setEndMileage] = useState<number | ''>('');
  const [endDatetime, setEndDatetime] = useState<string>(() => formatToLocalDateTimeInput(new Date()));
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (workOrder) {
      setEndDatetime(formatToLocalDateTimeInput(new Date()));
      setEndMileage('');
      setErrorMsg(null);
    }
  }, [workOrder]);

  if (!workOrder) return null;

  const startM = workOrder.start_mileage;
  const currentEndM = typeof endMileage === 'number' ? endMileage : startM;
  const calculatedDistance = Math.max(0, currentEndM - startM);

  const plannedTime = workOrder.planned_end_datetime ? new Date(workOrder.planned_end_datetime.replace(' ', 'T')).getTime() : 0;
  const returnTime = endDatetime ? new Date(endDatetime).getTime() : 0;
  const diffMinutes = plannedTime && returnTime ? Math.round((returnTime - plannedTime) / (60 * 1000)) : 0;

  const isEarlyReturn = diffMinutes < -15;
  const isLateReturn = diffMinutes > 15;
  const isOnTime = plannedTime > 0 && !isEarlyReturn && !isLateReturn;

  const formatDuration = (mins: number) => {
    const absM = Math.abs(mins);
    const h = Math.floor(absM / 60);
    const m = absM % 60;
    if (h > 0 && m > 0) return `${h} ชม. ${m} นาที`;
    if (h > 0) return `${h} ชม.`;
    return `${m} นาที`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (endMileage === '' || Number(endMileage) < startM) {
      setErrorMsg(`เลขไมล์สิ้นสุดต้องไม่น้อยกว่าเลขไมล์เริ่มต้น (${startM.toLocaleString()} km)`);
      return;
    }

    if (!endDatetime) {
      setErrorMsg('กรุณาระบุวันและเวลาที่คืนรถจริง');
      return;
    }

    const startTime = new Date(workOrder.start_datetime.replace(' ', 'T')).getTime();
    const currentReturnTime = new Date(endDatetime).getTime();
    if (currentReturnTime < startTime) {
      setErrorMsg('วันและเวลาที่คืนรถจริง ต้องไม่เกิดขึ้นก่อนวันและเวลาเริ่มใช้รถ');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await completeWorkOrder(workOrder.id, Number(endMileage), endDatetime.replace('T', ' '));
      onSuccess(workOrder.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการคืนรถ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">บันทึกส่งคืนรถและปิดใบงาน</h3>
              <p className="text-xs text-emerald-100">ใบงาน #{workOrder.id} — {workOrder.internal_id} ({workOrder.license_plate})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-emerald-200 hover:text-white rounded-lg">
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

          {/* Vehicle Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-brand-secondary text-sm">{workOrder.internal_id}</span>
                <span className="text-slate-600 ml-2 font-medium">({workOrder.license_plate})</span>
                <p className="text-slate-500 mt-0.5">{workOrder.brand} {workOrder.model}</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded text-[11px]">
                {workOrder.department}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 text-slate-600">
              <p><strong>ผู้ขอเบิก:</strong> {workOrder.requester_name}</p>
              <p className="mt-0.5"><strong>วัตถุประสงค์:</strong> {workOrder.purpose}</p>
              <p className="mt-0.5"><strong>เวลาเริ่มใช้งาน:</strong> {workOrder.start_datetime}</p>
              <p className="mt-0.5"><strong>กำหนดส่งคืน:</strong> {workOrder.planned_end_datetime || '-'}</p>
            </div>
          </div>

          {/* Actual Return Date & Time */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-brand-textPrimary">
                วันและเวลาที่ส่งคืนรถจริง (Actual Return Date/Time) <span className="text-rose-500">*</span>
              </label>
              {isEarlyReturn && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  คืนก่อนกำหนด ({formatDuration(diffMinutes)})
                </span>
              )}
              {isLateReturn && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  <Clock className="w-3 h-3 text-amber-600" />
                  คืนช้ากว่ากำหนด ({formatDuration(diffMinutes)})
                </span>
              )}
              {isOnTime && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                  <CheckCircle2 className="w-3 h-3 text-slate-500" />
                  คืนตรงตามกำหนด
                </span>
              )}
            </div>
            <input
              type="datetime-local"
              value={endDatetime}
              onChange={(e) => setEndDatetime(e.target.value)}
              className="w-full border border-emerald-300 bg-white rounded-lg p-2.5 text-xs font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500"
              required
            />
            <p className="text-[11px] text-slate-500">
              * ระบบคำนวณและบันทึกประวัติการใช้งานเท่านั้น (ไม่มีผลต่อการระงับสิทธิ์การเปิดงานรอบถัดไป) และจะปรับสถานะรถกลับเป็น <strong>"จอดรองาน"</strong> ทันที
            </p>
          </div>

          {/* Mileage Inputs & Auto Calc */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-100 p-3 rounded-lg text-xs">
              <span className="text-slate-500 block">เลขไมล์เริ่มต้น (Start Mileage)</span>
              <span className="text-base font-bold text-slate-700">{startM.toLocaleString()} km</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">
                เลขไมล์สิ้นสุดเมื่อส่งคืน <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={startM}
                value={endMileage}
                onChange={(e) => setEndMileage(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={`>= ${startM}`}
                className="w-full border border-emerald-300 rounded-lg p-2.5 text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Total Calculated Distance */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-800 text-xs font-medium">
              <Navigation className="w-4 h-4 text-emerald-600" />
              <span>ระยะทางใช้งานรวม (Total Distance)</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-emerald-700">{calculatedDistance.toLocaleString()}</span>
              <span className="text-xs text-emerald-600 ml-1">km</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 bg-amber-50 p-2.5 rounded border border-amber-200">
            * เมื่อกดบันทึกแล้ว สถานะยานพาหนะคันนี้จะถูกเปลี่ยนกลับเป็น <strong>"จอดรองาน"</strong> เพื่อรองรับการเบิกใช้ครั้งถัดไปอัตโนมัติ
          </p>

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
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-all shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'กำลังบันทึก...' : 'บันทึกคืนรถ & ปิดใบงาน'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
