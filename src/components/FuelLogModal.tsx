import React, { useState, useEffect } from 'react';
import { X, Fuel, Plus } from 'lucide-react';
import { Vehicle } from '../types';
import { fetchVehicles, createFuelLog } from '../services/api';

interface FuelLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FuelLogModal: React.FC<FuelLogModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | ''>('');
  const [refuelDate, setRefuelDate] = useState('2026-09-15');
  const [liters, setLiters] = useState<number | ''>('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [odometer, setOdometer] = useState<number | ''>('');
  const [receiptNo, setReceiptNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVehicles()
        .then(data => {
          setVehicles(data);
          if (data.length > 0) {
            setSelectedVehicleId(data[0].id);
            setOdometer(data[0].current_mileage);
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const handleVehicleChange = (vId: number) => {
    setSelectedVehicleId(vId);
    const v = vehicles.find(x => x.id === vId);
    if (v) setOdometer(v.current_mileage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || liters === '' || totalAmount === '' || odometer === '') return;

    try {
      setSubmitting(true);
      await createFuelLog({
        vehicle_id: Number(selectedVehicleId),
        refuel_date: refuelDate,
        liters: Number(liters),
        total_amount: Number(totalAmount),
        odometer: Number(odometer),
        receipt_no: receiptNo
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-brand-secondary text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-primary rounded-lg">
              <Fuel className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">บันทึกการเติมเชื้อเพลิง</h3>
              <p className="text-xs text-slate-300">บันทึกใบเสร็จน้ำมันและประวัติการใช้น้ำมัน</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-300 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-textPrimary mb-1">เลือกรถที่เติมน้ำมัน <span className="text-rose-500">*</span></label>
            <select
              value={selectedVehicleId}
              onChange={(e) => handleVehicleChange(Number(e.target.value))}
              className="w-full bg-slate-50 border border-brand-border rounded-lg p-2 text-sm font-medium"
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  [{v.internal_id}] {v.license_plate} — {v.brand} {v.model}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">วันที่เติมน้ำมัน <span className="text-rose-500">*</span></label>
              <input
                type="date"
                value={refuelDate}
                onChange={(e) => setRefuelDate(e.target.value)}
                className="w-full border border-brand-border rounded-lg p-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">เลขไมล์ขณะเติม (Odometer) <span className="text-rose-500">*</span></label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border border-brand-border rounded-lg p-2 text-sm font-bold text-slate-800"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">ปริมาณน้ำมัน (ลิตร) <span className="text-rose-500">*</span></label>
              <input
                type="number"
                step="0.01"
                value={liters}
                onChange={(e) => setLiters(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="เช่น 45.50"
                className="w-full border border-brand-border rounded-lg p-2 text-sm font-bold text-brand-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">ยอดเงินรวม (บาท) <span className="text-rose-500">*</span></label>
              <input
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="เช่น 1500"
                className="w-full border border-brand-border rounded-lg p-2 text-sm font-bold text-emerald-700"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-textPrimary mb-1">เลขที่ใบเสร็จ/ใบกำกับภาษี</label>
            <input
              type="text"
              value={receiptNo}
              onChange={(e) => setReceiptNo(e.target.value)}
              placeholder="เช่น INV-2026-0988"
              className="w-full border border-brand-border rounded-lg p-2 text-sm"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-primary hover:bg-brand-primaryHover text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลเติมน้ำมัน'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
