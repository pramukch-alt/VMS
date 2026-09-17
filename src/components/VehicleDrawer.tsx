import React, { useState, useEffect } from 'react';
import { X, Car, Wrench, Fuel, FileText, Calendar, MapPin, Gauge, ShieldAlert, Edit3 } from 'lucide-react';
import { Vehicle } from '../types';
import { fetchVehicleDetail, updateVehicleStatus } from '../services/api';
import { StatusBadge } from './StatusBadge';
import { EditVehicleModal } from './EditVehicleModal';

interface VehicleDrawerProps {
  vehicleId: number | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export const VehicleDrawer: React.FC<VehicleDrawerProps> = ({ vehicleId, onClose, onRefresh }) => {
  const [detail, setDetail] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'maintenance' | 'fuel' | 'workOrders'>('maintenance');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadDetail = () => {
    if (vehicleId) {
      setLoading(true);
      fetchVehicleDetail(vehicleId)
        .then(data => setDetail(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setDetail(null);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [vehicleId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!detail) return;
    try {
      setUpdatingStatus(true);
      await updateVehicleStatus(detail.id, newStatus);
      setDetail({ ...detail, status: newStatus });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!vehicleId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-brand-border bg-brand-secondary text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-brand-primary text-white rounded-lg">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold">{detail?.internal_id || 'กำลังโหลด...'}</h3>
                {detail && <StatusBadge status={detail.status} />}
              </div>
              <p className="text-sm text-slate-300">
                ทะเบียน: {detail?.license_plate} | {detail?.brand} {detail?.model}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {detail && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="bg-brand-primary hover:bg-brand-primaryHover text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>แก้ไขข้อมูล & เลขไมล์</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
            <span>กำลังโหลดข้อมูลเชิงลึก...</span>
          </div>
        ) : detail ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status Management Selector */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                <ShieldAlert className="w-4 h-4 text-brand-primary" />
                <span>สถานะการใช้งานปัจจุบัน:</span>
              </div>
              <select
                value={detail.status}
                disabled={updatingStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-brand-primary cursor-pointer"
              >
                <option value="จอดรองาน">จอดรองาน (Standby / Ready)</option>
                <option value="ใช้งาน">ใช้งาน (In Use)</option>
                <option value="รอซ่อม">รอซ่อม (Pending Repair)</option>
                <option value="ซ่อม">ซ่อม (Under Repair)</option>
                <option value="รอยุบสภาพ">รอยุบสภาพ (Pending Decommission)</option>
                <option value="ยุบสภาพ">ยุบสภาพ (Decommissioned)</option>
              </select>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="text-slate-500">หมวดหมู่</p>
                <p className="font-semibold text-slate-800 mt-0.5">{detail.category}</p>
              </div>
              <div>
                <p className="text-slate-500">ประเภทรถ</p>
                <p className="font-semibold text-slate-800 mt-0.5">{detail.vehicle_type}</p>
              </div>
              <div>
                <p className="text-slate-500">สังกัด</p>
                <p className="font-bold text-brand-secondary mt-0.5">{detail.department || 'อหก.'}</p>
              </div>
              <div>
                <p className="text-slate-500">ชนิดเชื้อเพลิง</p>
                <p className="font-semibold text-slate-800 mt-0.5">{detail.fuel_type || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">สถานที่ประจำรถ</p>
                <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                  {detail.base_location}
                </p>
              </div>
              <div className="bg-amber-100/60 p-2 rounded border border-amber-300">
                <p className="text-slate-600 font-bold">เลขไมล์สะสมปัจจุบัน</p>
                <p className="font-extrabold text-brand-primary text-sm mt-0.5 flex items-center gap-1">
                  <Gauge className="w-4 h-4 text-brand-primary" />
                  {detail.current_mileage.toLocaleString()} km
                </p>
              </div>
              <div>
                <p className="text-slate-500">วันครบกำหนดภาษี</p>
                <p className="font-semibold text-rose-600 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {detail.tax_due_date || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">ยอดชำระภาษี</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {detail.tax_amount ? `${detail.tax_amount.toLocaleString()} ฿` : 'ยังไม่ระบุ'}
                </p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="border-b border-slate-200 flex space-x-6">
              <button
                onClick={() => setActiveTab('maintenance')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                  activeTab === 'maintenance'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>ประวัติซ่อมบำรุง & ตรอ. ({detail.maintenanceHistory?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveTab('fuel')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                  activeTab === 'fuel'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Fuel className="w-4 h-4" />
                <span>ประวัติเติมเชื้อเพลิง ({detail.fuelHistory?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveTab('workOrders')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                  activeTab === 'workOrders'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>ประวัติใบงาน ({detail.workOrderHistory?.length || 0})</span>
              </button>
            </div>

            {/* Tab 1: Maintenance */}
            {activeTab === 'maintenance' && (
              <div className="space-y-3">
                {detail.maintenanceHistory && detail.maintenanceHistory.length > 0 ? (
                  detail.maintenanceHistory.map((m) => (
                    <div key={m.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{m.record_type}</span>
                        <span className="text-brand-primary">{m.cost.toLocaleString()} ฿</span>
                      </div>
                      <p className="text-slate-500">วันที่บริการ: {m.service_date} | กำหนดครั้งถัดไป: {m.next_due_date || '-'}</p>
                      {m.remarks && <p className="text-slate-600 bg-white p-2 rounded border border-slate-100 mt-1">{m.remarks}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 py-6 text-center">ไม่มีประวัติซ่อมบำรุง</p>
                )}
              </div>
            )}

            {/* Tab 2: Fuel History */}
            {activeTab === 'fuel' && (
              <div className="space-y-3">
                {detail.fuelHistory && detail.fuelHistory.length > 0 ? (
                  detail.fuelHistory.map((f) => (
                    <div key={f.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">วันที่เติม: {f.refuel_date}</p>
                        <p className="text-slate-500 mt-0.5">เลขไมล์: {f.odometer.toLocaleString()} km | เลขที่ใบเสร็จ: {f.receipt_no || '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 text-sm">{f.liters} ลิตร</p>
                        <p className="text-slate-600">{f.total_amount.toLocaleString()} ฿</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 py-6 text-center">ไม่มีประวัติเติมเชื้อเพลิง</p>
                )}
              </div>
            )}

            {/* Tab 3: Work Orders */}
            {activeTab === 'workOrders' && (
              <div className="space-y-3">
                {detail.workOrderHistory && detail.workOrderHistory.length > 0 ? (
                  detail.workOrderHistory.map((w) => (
                    <div key={w.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>ผู้เบิก: {w.requester_name} ({w.department})</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] ${w.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {w.status === 'COMPLETED' ? 'เสร็จสิ้น' : 'กำลังใช้งาน'}
                        </span>
                      </div>
                      <p className="text-slate-600">วัตถุประสงค์: {w.purpose}</p>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>เริ่ม: {w.start_datetime}</span>
                        <span>กำหนดคืน: {w.planned_end_datetime || '-'}</span>
                        {w.end_datetime && (
                          <span className="text-emerald-700 font-medium">คืนจริง: {w.end_datetime}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-slate-500 bg-white p-2 rounded border border-slate-100 mt-1">
                        <span>ไมล์เริ่ม: {w.start_mileage.toLocaleString()} km</span>
                        <span>ไมล์จบ: {w.end_mileage ? w.end_mileage.toLocaleString() + ' km' : 'ยังไม่ส่งคืน'}</span>
                        <span>ระยะทาง: {w.total_distance ? w.total_distance.toLocaleString() + ' km' : '-'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 py-6 text-center">ไม่มีประวัติการขอใช้รถ</p>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Edit Vehicle Modal */}
        <EditVehicleModal
          vehicle={detail}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            loadDetail();
            if (onRefresh) onRefresh();
          }}
        />
      </div>
    </div>
  );
};
