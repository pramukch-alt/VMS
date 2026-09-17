import React, { useState } from 'react';
import { X, Car, Plus, CheckCircle2 } from 'lucide-react';
import { createVehicle } from '../services/api';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [category, setCategory] = useState<'ยานพาหนะเดินทาง' | 'รถเครื่องจักรกล'>('ยานพาหนะเดินทาง');
  const [internalId, setInternalId] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [vehicleType, setVehicleType] = useState('รถตู้โดยสารที่มีที่นั่งไม่เกิน 12 ที่นั่ง');
  const [department, setDepartment] = useState('อหก.');
  const [fuelType, setFuelType] = useState('ดีเซล');
  const [specifications, setSpecifications] = useState('');
  const [baseLocation, setBaseLocation] = useState('สนก.บางกรวย');
  const [registrationDate, setRegistrationDate] = useState('2026-09-15');
  const [taxDueDate, setTaxDueDate] = useState('2027-09-15');
  const [taxAmount, setTaxAmount] = useState<number | ''>(1600);
  const [currentMileage, setCurrentMileage] = useState<number | ''>(12000);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalId || !licensePlate || !brand || !model) {
      setErrorMsg('กรุณากรอกข้อมูลสำคัญ (ทะเบียน กฟผ., ทะเบียนรถ, ยี่ห้อ, รุ่น) ให้ครบถ้วน');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await createVehicle({
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
        status: 'จอดรองาน',
        registration_date: registrationDate || null,
        tax_due_date: taxDueDate || null,
        tax_amount: taxAmount !== '' ? Number(taxAmount) : null,
        current_mileage: currentMileage !== '' ? Number(currentMileage) : 0
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลยานพาหนะ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-brand-secondary text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-primary rounded-lg text-white">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">เพิ่มยานพาหนะใหม่</h3>
              <p className="text-xs text-slate-300">บันทึกข้อมูลยานพาหนะหรือรถเครื่องจักรกลเข้าสู่ระบบ VMS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-300 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Category Radio Buttons */}
          <div className="bg-slate-50 border border-brand-border p-3.5 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-brand-textPrimary">
              หมวดหมู่ยานพาหนะ <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
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
                  name="category"
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
                placeholder="เช่น 02-3999 หก."
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
                placeholder="เช่น นข9988"
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
                placeholder="เช่น Toyota, Isuzu, Honda"
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
                placeholder="เช่น COMMUTER, D-MAX, FTR"
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
                placeholder="เช่น รถตู้โดยสาร, รถบรรทุก 6 ล้อ, กระบะบรรทุก"
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
                {[
                  'สนก.บางกรวย',
                  'สนก. บางกรวย',
                  'รฟ.แม่เมาะ',
                  'เขื่อนท่าทุ่งนา (ศกท-หก.)',
                  'เขื่อนท่าทุ่งนา',
                  'รฟ.วังน้อย',
                  'รฟ.สิรินธร',
                  'รฟ.จะนะ',
                  'โครงการเพรชบุรี'
                ].map((loc) => (
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
              placeholder="ระบุคุณลักษณะเฉพาะของรถ..."
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
                placeholder="เช่น 1600"
                className="w-full border border-brand-border rounded-lg p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-textPrimary mb-1">เลขไมล์เริ่มต้น (Start Mileage)</label>
            <input
              type="number"
              value={currentMileage}
              onChange={(e) => setCurrentMileage(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="เช่น 0 หรือ 15000"
              className="w-full border border-brand-border rounded-lg p-2 text-sm font-bold text-slate-800"
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
              disabled={submitting}
              className="bg-brand-primary hover:bg-brand-primaryHover text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'กำลังบันทึก...' : 'บันทึกเพิ่มยานพาหนะ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
