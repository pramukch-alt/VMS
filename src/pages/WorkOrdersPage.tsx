import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Clock, User, Navigation, Search, Calendar, RotateCw } from 'lucide-react';
import { WorkOrder } from '../types';
import { fetchWorkOrders } from '../services/api';

interface WorkOrdersPageProps {
  onOpenNewWorkOrder: () => void;
  onOpenCompleteWorkOrder: (wo: WorkOrder) => void;
  refreshTrigger?: number;
  highlightId?: number | null;
}

export const WorkOrdersPage: React.FC<WorkOrdersPageProps> = ({
  onOpenNewWorkOrder,
  onOpenCompleteWorkOrder,
  refreshTrigger,
  highlightId
}) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = () => {
    setLoading(true);
    fetchWorkOrders()
      .then(data => setWorkOrders(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    if (highlightId) {
      setFilterStatus('ALL');
      setSearchTerm('');
    }
  }, [refreshTrigger, highlightId]);

  const filteredOrders = workOrders.filter(wo => {
    // 1. Status Filter
    if (filterStatus === 'IN_PROGRESS' && wo.status !== 'IN_PROGRESS') return false;
    if (filterStatus === 'COMPLETED' && wo.status !== 'COMPLETED') return false;

    // 2. Search Term Filter (Search by WO ID, internal_id, license_plate, requester_name, etc.)
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();

      const woIdStr = wo.id.toString();
      const woHashStr = `#${wo.id}`;
      const woFullStr = `wo #${wo.id}`;

      const matchWo = woIdStr.includes(term) || woHashStr.toLowerCase().includes(term) || woFullStr.toLowerCase().includes(term);
      const matchInternalId = wo.internal_id ? wo.internal_id.toLowerCase().includes(term) : false;
      const matchLicensePlate = wo.license_plate ? wo.license_plate.toLowerCase().includes(term) : false;
      const matchRequester = wo.requester_name ? wo.requester_name.toLowerCase().includes(term) : false;
      const matchPurpose = wo.purpose ? wo.purpose.toLowerCase().includes(term) : false;
      const matchBrand = wo.brand ? wo.brand.toLowerCase().includes(term) : false;
      const matchModel = wo.model ? wo.model.toLowerCase().includes(term) : false;

      return matchWo || matchInternalId || matchLicensePlate || matchRequester || matchPurpose || matchBrand || matchModel;
    }

    return true;
  });

  const activeCount = workOrders.filter(w => w.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-secondary">ใบงานใช้รถ</h2>
          <p className="text-sm text-brand-textMuted mt-0.5">
            ระบบ Self-Service เบิกใช้งานรถได้ทันทีโดยไม่ต้องผ่านอนุมัติ พร้อมบันทึกไมล์เริ่ม/จบ
          </p>
        </div>
        <button
          onClick={onOpenNewWorkOrder}
          className="bg-brand-primary hover:bg-brand-primaryHover text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-md transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>เปิดใบงานใช้รถ</span>
        </button>
      </div>

      {/* Control Bar: Status Filter Tabs + Search Input */}
      <div className="bg-brand-surface p-4 rounded-xl border border-brand-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold shrink-0">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filterStatus === 'ALL'
                ? 'bg-brand-secondary text-white shadow-sm'
                : 'text-slate-600 hover:text-brand-secondary'
            }`}
          >
            ใบงานทั้งหมด ({workOrders.length})
          </button>
          <button
            onClick={() => setFilterStatus('IN_PROGRESS')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 ${
              filterStatus === 'IN_PROGRESS'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-amber-600'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>กำลังถูกใช้งาน ({activeCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETED')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 ${
              filterStatus === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-600'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ปิดงานแล้ว ({workOrders.length - activeCount})</span>
          </button>
        </div>

        {/* Search Bar & Refresh Button */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยเลข WO (เช่น 1, 15) หรือ ทะเบียน กฟผ. / รถ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-xs focus:ring-2 focus:ring-brand-primary focus:bg-white"
            />
          </div>
          <button
            onClick={loadData}
            title="รีเฟรชข้อมูลใบงานล่าสุด"
            className="p-2 border border-brand-border bg-slate-50 hover:bg-white text-slate-600 hover:text-brand-primary rounded-lg transition-all shadow-sm shrink-0"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="bg-brand-surface rounded-xl border border-brand-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">กำลังโหลดข้อมูลใบงาน...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            {searchTerm ? `ไม่พบรายการใบงานที่ตรงกับคำค้นหา "${searchTerm}"` : 'ไม่พบรายการใบงานในขณะนี้'}
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {filteredOrders.map((wo) => {
              const isInProgress = wo.status === 'IN_PROGRESS';
              const isEarlyReturn = !isInProgress && wo.planned_end_datetime && wo.end_datetime
                ? new Date(wo.end_datetime.replace(' ', 'T')).getTime() < new Date(wo.planned_end_datetime.replace(' ', 'T')).getTime()
                : false;
              const isRecent = highlightId === wo.id;

              return (
                <div
                  key={wo.id}
                  className={`p-5 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isRecent ? 'bg-amber-50/40 border-l-4 border-l-brand-primary' : ''
                  }`}
                >
                  {/* Left Info */}
                  <div className="space-y-2.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        WO #{wo.id}
                      </span>
                      <span className="font-bold text-base text-brand-secondary">
                        {wo.internal_id} ({wo.license_plate})
                      </span>
                      <span className="text-xs text-slate-500">
                        {wo.brand} {wo.model}
                      </span>
                      {isRecent && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                          ✨ รายการล่าสุด
                        </span>
                      )}
                      {isEarlyReturn && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="w-3 h-3 text-blue-600" />
                          คืนก่อนกำหนด
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-medium text-slate-800">
                        <User className="w-3.5 h-3.5 text-brand-primary" />
                        {wo.requester_name} ({wo.department})
                      </span>
                    </div>

                    {/* Booking Dates & Return Info */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                        <span><strong>เริ่มใช้งาน:</strong> {wo.start_datetime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span><strong>กำหนดคืน:</strong> {wo.planned_end_datetime || '-'}</span>
                      </div>
                      {wo.end_datetime && (
                        <div className="col-span-1 sm:col-span-2 pt-1 border-t border-slate-200/60 flex items-center gap-1.5 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span><strong>คืนจริงเมื่อ:</strong> {wo.end_datetime}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                      <strong className="text-slate-700">วัตถุประสงค์:</strong> {wo.purpose}
                    </p>
                  </div>

                  {/* Mileage & Status Info */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0">
                    <div className="text-left md:text-right text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">ไมล์เริ่ม:</span>
                        <span className="font-bold text-slate-800">{wo.start_mileage.toLocaleString()} km</span>
                      </div>
                      {wo.end_mileage ? (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">ไมล์ส่งคืน:</span>
                          <span className="font-bold text-emerald-700">{wo.end_mileage.toLocaleString()} km</span>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-semibold block">ยังไม่ส่งคืน</span>
                      )}

                      {wo.total_distance && (
                        <div className="text-xs font-extrabold text-emerald-600 flex items-center gap-1 justify-end mt-1">
                          <Navigation className="w-3 h-3" />
                          <span>ระยะทางรวม: {wo.total_distance.toLocaleString()} km</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {isInProgress ? (
                      <button
                        onClick={() => onOpenCompleteWorkOrder(wo)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>บันทึกคืนรถ / ปิดงาน</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        สมบูรณ์
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
