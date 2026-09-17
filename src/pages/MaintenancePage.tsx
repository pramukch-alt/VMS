import React, { useState, useEffect } from 'react';
import { Plus, Wrench } from 'lucide-react';
import { MaintenanceRecord } from '../types';
import { fetchMaintenanceRecords } from '../services/api';
import { AddMaintenanceModal } from '../components/AddMaintenanceModal';

export const MaintenancePage: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetchMaintenanceRecords()
      .then(data => setRecords(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-secondary">งานซ่อมบำรุง</h2>
          <p className="text-sm text-brand-textMuted mt-0.5">
            บันทึกและติดตามการบำรุงรักษายานพาหนะ เปลี่ยนถ่ายน้ำมันเครื่อง และตรวจสภาพประจำปี
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brand-primary hover:bg-brand-primaryHover text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มข้อมูลงานซ่อมบำรุง</span>
        </button>
      </div>

      <div className="bg-brand-surface rounded-xl border border-brand-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-brand-border">
          <h3 className="text-base font-bold text-brand-secondary">รายการบันทึกการซ่อมบำรุง</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-brand-textMuted text-xs font-semibold uppercase tracking-wider border-b border-brand-border">
                <th className="py-3 px-4">วันที่บริการ</th>
                <th className="py-3 px-4">ทะเบียน กฟผ.</th>
                <th className="py-3 px-4">ทะเบียนรถ</th>
                <th className="py-3 px-4">ประเภทรายการ</th>
                <th className="py-3 px-4 text-right">ค่าใช้จ่าย (บาท)</th>
                <th className="py-3 px-4">กำหนดครั้งถัดไป</th>
                <th className="py-3 px-4">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">ไม่พบประวัติซ่อมบำรุง</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-700">{r.service_date}</td>
                    <td className="py-3.5 px-4 font-bold text-brand-secondary">{r.internal_id}</td>
                    <td className="py-3.5 px-4 text-slate-800">{r.license_plate}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {r.record_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-brand-primary text-xs">
                      {r.cost.toLocaleString()} ฿
                    </td>
                    <td className="py-3.5 px-4 text-xs text-rose-600 font-semibold">
                      {r.next_due_date || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                      {r.remarks || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Maintenance Record Modal */}
      <AddMaintenanceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
