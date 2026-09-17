import React, { useState, useEffect } from 'react';
import { Plus, Wrench, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import { MaintenanceRecord } from '../types';
import { fetchMaintenanceRecords, deleteMaintenanceRecord } from '../services/api';
import { AddMaintenanceModal } from '../components/AddMaintenanceModal';

export const MaintenancePage: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<MaintenanceRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<MaintenanceRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleOpenAdd = () => {
    setSelectedRecordForEdit(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (record: MaintenanceRecord) => {
    setSelectedRecordForEdit(record);
    setIsAddModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!recordToDelete) return;
    try {
      setIsDeleting(true);
      await deleteMaintenanceRecord(recordToDelete.id);
      setRecordToDelete(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete maintenance record:', err);
      alert('เกิดข้อผิดพลาดในการลบรายการ');
    } finally {
      setIsDeleting(false);
    }
  };

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
          onClick={handleOpenAdd}
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
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">ไม่พบประวัติซ่อมบำรุง</td>
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
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          title="แก้ไขรายการ"
                          className="p-1.5 text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRecordToDelete(r)}
                          title="ลบรายการ"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Maintenance Record Modal */}
      <AddMaintenanceModal
        isOpen={isAddModalOpen}
        recordToEdit={selectedRecordForEdit}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedRecordForEdit(null);
        }}
        onSuccess={loadData}
      />

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <div className="p-2.5 bg-rose-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">ยืนยันการลบรายการซ่อมบำรุง</h3>
                <p className="text-xs text-slate-500">การดำเนินการนี้ไม่สามารถเรียกคืนได้</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-700 mb-5">
              <div><span className="font-semibold text-slate-500">ทะเบียน กฟผ.:</span> <span className="font-bold text-brand-secondary">[{recordToDelete.internal_id}]</span> {recordToDelete.license_plate}</div>
              <div><span className="font-semibold text-slate-500">ประเภทรายการ:</span> <span className="font-medium text-slate-800">{recordToDelete.record_type}</span></div>
              <div><span className="font-semibold text-slate-500">วันที่รับบริการ:</span> {recordToDelete.service_date}</div>
              <div><span className="font-semibold text-slate-500">ค่าใช้จ่าย:</span> <span className="font-bold text-brand-primary">{recordToDelete.cost.toLocaleString()} บาท</span></div>
              {recordToDelete.remarks && (
                <div><span className="font-semibold text-slate-500">หมายเหตุ:</span> {recordToDelete.remarks}</div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-all shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'กำลังลบ...' : 'ยืนยันลบรายการ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
