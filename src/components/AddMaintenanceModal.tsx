import React, { useState, useEffect } from 'react';
import { X, Wrench, Search, Plus, CheckCircle2, Edit3, Save } from 'lucide-react';
import { Vehicle, MaintenanceRecord } from '../types';
import { fetchVehicles, createMaintenanceRecord, updateMaintenanceRecord } from '../services/api';

interface AddMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  recordToEdit?: MaintenanceRecord | null;
}

export const AddMaintenanceModal: React.FC<AddMaintenanceModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  recordToEdit = null
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | ''>('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [recordType, setRecordType] = useState('ตรอ. / ถ่ายน้ำมันเครื่อง');
  const [serviceDate, setServiceDate] = useState('2026-09-15');
  const [nextDueDate, setNextDueDate] = useState('2027-03-15');
  const [cost, setCost] = useState<number | ''>(3500);
  const [remarks, setRemarks] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      fetchVehicles()
        .then(data => {
          setVehicles(data);
          if (recordToEdit) {
            setSelectedVehicleId(recordToEdit.vehicle_id);
            const found = data.find(v => v.id === recordToEdit.vehicle_id);
            if (found) setSelectedVehicle(found);
            setRecordType(recordToEdit.record_type);
            setServiceDate(recordToEdit.service_date);
            setNextDueDate(recordToEdit.next_due_date || '');
            setCost(recordToEdit.cost);
            setRemarks(recordToEdit.remarks || '');
          } else {
            if (data.length > 0) {
              setSelectedVehicleId(data[0].id);
              setSelectedVehicle(data[0]);
            }
            setRecordType('ตรอ. / ถ่ายน้ำมันเครื่อง');
            const todayStr = new Date().toISOString().substring(0, 10);
            setServiceDate(todayStr);
            setNextDueDate('');
            setCost(3500);
            setRemarks('');
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, recordToEdit]);

  const filteredVehicles = vehicles.filter(v => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      v.internal_id.toLowerCase().includes(term) ||
      v.license_plate.toLowerCase().includes(term) ||
      v.brand.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term)
    );
  });

  const handleSelectVehicle = (v: Vehicle) => {
    setSelectedVehicleId(v.id);
    setSelectedVehicle(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !recordType || cost === '') {
      setErrorMsg('กรุณาเลือกรถ และกรอกข้อมูลประเภทรายการพร้อมค่าใช้จ่ายให้ครบถ้วน');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      if (recordToEdit) {
        await updateMaintenanceRecord(recordToEdit.id, {
          vehicle_id: Number(selectedVehicleId),
          record_type: recordType,
          service_date: serviceDate,
          next_due_date: nextDueDate || null,
          cost: Number(cost),
          remarks: remarks
        });
      } else {
        await createMaintenanceRecord({
          vehicle_id: Number(selectedVehicleId),
          record_type: recordType,
          service_date: serviceDate,
          next_due_date: nextDueDate || null,
          cost: Number(cost),
          remarks: remarks
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลซ่อมบำรุง');
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
              {recordToEdit ? <Edit3 className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {recordToEdit ? 'แก้ไขข้อมูลงานซ่อมบำรุง' : 'เพิ่มข้อมูลงานซ่อมบำรุง'}
              </h3>
              <p className="text-xs text-slate-300">
                {recordToEdit 
                  ? 'ปรับปรุงรายละเอียดการซ่อมบำรุง ยานพาหนะ และค่าใช้จ่าย' 
                  : 'บันทึกประวัติการบำรุงรักษา ถ่ายน้ำมันเครื่อง และตรวจสภาพ ตรอ.'}
              </p>
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

          {/* Searchable Vehicle Picker Zone */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-brand-textPrimary">
              ค้นหาและเลือกรถที่เข้ารับบริการ <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="พิมพ์ค้นหาตาม ทะเบียน กฟผ. / ทะเบียนรถ / ยี่ห้อ..."
                className="w-full pl-9 pr-3 py-2 border border-brand-border rounded-lg text-xs focus:ring-2 focus:ring-brand-primary bg-slate-50"
              />
            </div>

            {/* Vehicle Selection List */}
            <div className="max-h-36 overflow-y-auto border border-brand-border rounded-lg divide-y divide-slate-100 bg-white">
              {filteredVehicles.length === 0 ? (
                <div className="p-3 text-xs text-slate-400 text-center">ไม่พบยานพาหนะตรงตามคำค้นหา</div>
              ) : (
                filteredVehicles.map(v => {
                  const isSelected = selectedVehicleId === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => handleSelectVehicle(v)}
                      className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-brand-amber/90 border-l-4 border-brand-primary' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-brand-secondary">[{v.internal_id}]</span>{' '}
                        <span className="font-medium text-slate-800">{v.license_plate}</span> —{' '}
                        <span className="text-slate-500">{v.brand} {v.model} ({v.category})</span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Vehicle Banner */}
          {selectedVehicle && (
            <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 flex justify-between items-center">
              <div>
                <p className="font-bold text-brand-secondary">เลือกรถ: [{selectedVehicle.internal_id}] {selectedVehicle.license_plate}</p>
                <p className="text-slate-500">{selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.base_location})</p>
              </div>
              <span className="text-xs bg-white px-2.5 py-1 rounded border border-slate-300 font-semibold">
                ไมล์ล่าสุด: {(selectedVehicle.current_mileage || 0).toLocaleString()} km
              </span>
            </div>
          )}

          {/* Record Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">
                ประเภทรายการ <span className="text-rose-500">*</span>
              </label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full border border-brand-border rounded-lg p-2 text-sm bg-slate-50 font-medium"
              >
                <option value="ตรอ. / ถ่ายน้ำมันเครื่อง">ตรอ. / ถ่ายน้ำมันเครื่อง</option>
                <option value="ซ่อมบำรุงประจำปี">ซ่อมบำรุงประจำปี</option>
                <option value="เปลี่ยนถ่ายน้ำมันเครื่อง/ไส้กรอง">เปลี่ยนถ่ายน้ำมันเครื่อง/ไส้กรอง</option>
                <option value="เปลี่ยนยางรถยนต์ / ผ้าเบรก">เปลี่ยนยางรถยนต์ / ผ้าเบรก</option>
                <option value="ซ่อมระบบช่วงล่าง/เครื่องยนต์">ซ่อมระบบช่วงล่าง/เครื่องยนต์</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">
                ค่าใช้จ่ายรวม (บาท) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="เช่น 3500"
                className="w-full border border-brand-border rounded-lg p-2 text-sm font-bold text-brand-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">
                วันที่รับบริการ <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full border border-brand-border rounded-lg p-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-textPrimary mb-1">
                กำหนดบริการครั้งถัดไป
              </label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full border border-brand-border rounded-lg p-2 text-sm text-rose-600 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-textPrimary mb-1">หมายเหตุ / รายละเอียดการซ่อมบำรุง</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="ระบุรายละเอียดชิ้นส่วนที่เปลี่ยน หรืออู่ที่เข้ารับบริการ..."
              className="w-full border border-brand-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary"
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
              {recordToEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{submitting ? 'กำลังบันทึก...' : (recordToEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลซ่อมบำรุง')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
