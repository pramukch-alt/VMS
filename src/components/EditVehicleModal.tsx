import React, { useState, useEffect } from 'react';
import { X, Edit3, CheckCircle2 } from 'lucide-react';
import { Vehicle } from '../types';
import { updateVehicle } from '../services/api';

interface EditVehicleModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditVehicleModal: React.FC<EditVehicleModalProps> = ({ vehicle, isOpen, onClose, onSuccess }) => {
  const [internalId, setInternalId] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState<'ยานพาหนะเดินทาง' | 'รถเครื่องจักรกล'>('ยานพาหนะเดินทาง');
  const [vehicleType, setVehicleType] = useState('');
  const [department, setDepartment] = useState('อหก.');
  const [fuelType, setFuelType] = useState('ดีเซล');
  const [specifications, setSpecifications] = useState('');
  const [baseLocation, setBaseLocation] = useState('สนก.บางกรวย');
  const [registrationDate, setRegistrationDate] = useState('');
  const [taxDueDate, setTaxDueDate] = useState('');
  const [taxAmount, setTaxAmount] = useState<number | ''>('');
  const [currentMileage, setCurrentMileage] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (vehicle) {
      setInternalId(vehicle.internal_id || '');
      setLicensePlate(vehicle.license_plate || '');
      setBrand(vehicle.brand || '');
      setModel(vehicle.model || '');
      setCategory((vehicle.category as any) || 'ยานพาหนะเดินทาง');
      setVehicleType(vehicle.vehicle_type || '');
      setDepartment(vehicle.department || 'อหก.');
      setFuelType(vehicle.fuel_type || 'ดีเซล');
      setSpecifications(vehicle.specifications || '');
      setBaseLocation(vehicle.base_location || 'สนก.บางกรวย');
      setRegistrationDate(vehicle.registration_date || '');
      setTaxDueDate(vehicle.tax_due_date || '');
      setTaxAmount(vehicle.tax_amount !== null ? vehicle.tax_amount : '');
      setCurrentMileage(vehicle.current_mileage !== null ? vehicle.current_mileage : 0);
    }
  }, [vehicle]);

  if (!isOpen || !vehicle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalId || !licensePlate || !brand || !model || currentMileage === '') {
      setErrorMsg('กรุณากรอกข้อมูลสำคัญ (ทะเบียน กฟผ., ทะเบียนรถ, ยี่ห้อ, รุ่น, เลขไมล์) ให้ครบถ้วน');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await updateVehicle(vehicle.id, {
        internal_id: internalId,
        license_plate: licensePlate,
        brand: brand,
        model: model,
        category: category,
        vehicle_type: vehicleType,
        department: department,
        fuel_type: fuelType,
        specifications: specifications,
        base_location: baseLocation,
        registration_date: registrationDate || null,
        tax_due_date: taxDueDate || null,
        tax_amount: taxAmount !== '' ? Number(taxAmount) : null,
        current_mileage: Number(currentMileage)
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-brand-secondary text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-primary rounded-lg text-white">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">แก้ไขข้อมูลยานพาหนะ & เลขไมล์</h3>
              <p className="text-xs text-slate-300">แก้ไขข้อมูลทะเบียน เลขไมล์ปัจจุบัน หรือข้อมูลภาษีประจำปี</p>
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

          {/* Highlighted Current Mileage Input Zone */}
          <div className="bg-brand-amber/80 border border-amber-300 p-4 rounded-xl space-y-1.5">
            <label className="block text-xs font-extrabold text-brand-secondary">
              เลขไมล์สะสมปัจจุบัน (Current Odometer Mileage) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={currentMileage}
                onChange={(e) => setCurrentMileage(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="ระบุเลขไมล์จริง..."
                className="w-full bg-white border border-amber-400 rounded-lg p-2.5 text-base font-extrabold text-brand-secondary focus:ring-2 focus:ring-brand-primary shadow-inner"
                required
              />
              <span className="text-xs font-bold text-slate-700 shrink-0">กิโลเมตร (km)</span>
            </div>
            <p className="text-[11px] text-slate-600">
              * ข้อมูลเลขไมล์นี้จะถูกใช้เป็นเลขไมล์เริ่มต้นในการเปิด Work Order เบิกใช้งานครั้งถัดไป
            </p>
          </div>

          {/* Category Radio Buttons */}
          <div className="bg-slate-50 border border-brand-border p-3.5 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-brand-textPrimary">
              หมวดหมู่ยานพาหนะ <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="edit-category"
                  value="ยานพาหนะเดินทาง"
                  checked={category === 'ยานพาหนะเดินทาง'}
                  onChange={() => setCategory('ยานพาหนะเดินทาง')}
                  className="w-4 h-4 text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-sm font-semibold text-slate-800">ยานพาหนะเดินทาง</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="edit-category"
                  value="รถเครื่องจักรกล"
                  checked={category === 'รถเครื่องจักรกล'}
                  onChange={() => setCategory('รถเครื่องจักรกล')}
                  className="w-4 h-4 text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-sm font-semibold text-slate-800">รถเครื่องจักรกล</span>
              </label>
            </div>
          </div>

          {/* Grid Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">
                เลขทะเบียนภายใน กฟผ. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={internalId}
                onChange={(e) => setInternalId(e.target.value)}
                className="w-full border border-brand-border rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-brand-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">
                เลขทะเบียนรถ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="w-full border border-brand-border rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-brand-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">
                ยี่ห้อ (Brand) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full border border-brand-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">
                รุ่น (Model) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full border border-brand-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">ประเภทรถ / ย่อย</label>
              <input
                type="text"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full border border-brand-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">สถานที่ประจำรถ <span className="text-rose-500">*</span></label>
              <select
                value={baseLocation}
                onChange={(e) => setBaseLocation(e.target.value)}
                className="w-full border border-brand-border rounded-lg p-2 text-sm bg-slate-50 font-medium"
              >
                {Array.from(new Set([
                  'สนก.บางกรวย',
                  'สนก. บางกรวย',
                  'รฟ.แม่เมาะ',
                  'เขื่อนท่าทุ่งนา (ศกท-หก.)',
                  'เขื่อนท่าทุ่งนา',
                  'รฟ.วังน้อย',
                  'รฟ.สิรินธร',
                  'รฟ.จะนะ',
                  'โครงการเพรชบุรี',
                  baseLocation
                ].filter(Boolean))).map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">สังกัด</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="เช่น อหก."
                className="w-full border border-brand-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">ชนิดของเชื้อเพลิง</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full border border-brand-border rounded-lg p-2 text-sm bg-slate-50 font-medium"
              >
                <option value="ดีเซล">ดีเซล</option>
                <option value="เบนซิน (Gasohol 95)">เบนซิน (Gasohol 95)</option>
                <option value="เบนซิน (Gasohol 91)">เบนซิน (Gasohol 91)</option>
                <option value="ไฟฟ้า (EV)">ไฟฟ้า (EV)</option>
                <option value="ไฮบริด (HEV)">ไฮบริด (HEV)</option>
                <option value="ไม่ระบุ">ไม่ระบุ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-textPrimary mb-1">คุณลักษณะ / รายละเอียดเพิ่มเติม</label>
            <input
              type="text"
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              className="w-full border border-brand-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">วันจดทะเบียน</label>
              <input
                type="date"
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
                className="w-full border border-brand-border rounded-lg p-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">วันครบกำหนดภาษี</label>
              <input
                type="date"
                value={taxDueDate}
                onChange={(e) => setTaxDueDate(e.target.value)}
                className="w-full border border-brand-border rounded-lg p-2 text-xs font-semibold text-rose-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">ยอดชำระภาษี (บาท)</label>
              <input
                type="number"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border border-brand-border rounded-lg p-2 text-xs"
              />
            </div>
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
              disabled={submitting}
              className="bg-brand-primary hover:bg-brand-primaryHover text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-all shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไขข้อมูล'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
