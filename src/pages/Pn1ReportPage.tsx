import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Download, 
  Printer, 
  Car, 
  Fuel, 
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Gauge, 
  User, 
  CheckSquare, 
  Edit3, 
  Search, 
  Filter, 
  Activity, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { Vehicle, Pn1Report } from '../types';
import { fetchVehicles, fetchPn1Reports } from '../services/api';
import { Pn1ReportModal } from '../components/Pn1ReportModal';
import { Pn1ImportModal } from '../components/Pn1ImportModal';
import { Pn1ExportModal } from '../components/Pn1ExportModal';
import { VmcForm01PrintView } from '../components/VmcForm01PrintView';

export const Pn1ReportPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reports, setReports] = useState<Pn1Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportVehicleId, setExportVehicleId] = useState<number | null>(null);
  const [printVehicleIds, setPrintVehicleIds] = useState<number[] | null>(null);
  const [reportToEdit, setReportToEdit] = useState<Pn1Report | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);

  const loadData = async (monthToLoad = selectedMonth) => {
    try {
      setLoading(true);
      const [vList, rList] = await Promise.all([
        fetchVehicles(),
        fetchPn1Reports(monthToLoad)
      ]);
      setVehicles(vList);
      setReports(rList);
    } catch (err) {
      console.error('Failed to load PN1 Page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedMonth);
  }, [selectedMonth]);

  const toggleExpand = (id: number) => {
    setExpandedReportId(expandedReportId === id ? null : id);
  };

  const handleOpenEditModal = (report: Pn1Report) => {
    setReportToEdit(report);
    setIsModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setReportToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenExportModal = (vehicleId?: number) => {
    setExportVehicleId(vehicleId || null);
    setIsExportModalOpen(true);
  };

  // Filtered reports
  const filteredReports = reports.filter(r => {
    if (departmentFilter !== 'all' && r.department !== departmentFilter) {
      return false;
    }
    if (statusFilter === 'used' && (r.ur_rate === 0 || r.used_days === 0)) {
      return false;
    }
    if (statusFilter === 'unused' && r.ur_rate > 0) {
      return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchInternal = r.internal_id?.toLowerCase().includes(term);
      const matchPlate = r.license_plate?.toLowerCase().includes(term);
      const matchBrand = r.brand_model?.toLowerCase().includes(term);
      const matchDept = r.department?.toLowerCase().includes(term);
      if (!matchInternal && !matchPlate && !matchBrand && !matchDept) {
        return false;
      }
    }
    return true;
  });

  // Fleet Overview Calculations for this month
  const totalVehiclesCount = reports.length;
  const usedVehiclesCount = reports.filter(r => (r.ur_rate || 0) > 0).length;
  const unusedVehiclesCount = totalVehiclesCount - usedVehiclesCount;
  const avgFleetUrRate = totalVehiclesCount > 0 
    ? (reports.reduce((sum, r) => sum + (r.ur_rate || 0), 0) / totalVehiclesCount).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Page Header & Top Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-brand-secondary">รายงาน พน.1</h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
              ระบบจัดทำรายงานประจำเดือน (รถทุกคัน)
            </span>
          </div>
          <p className="text-sm text-brand-textMuted mt-0.5">
            แบบฟอร์ม พน.1 สรุปข้อมูลการใช้ยานพาหนะและเครื่องจักรกลประจำเดือน (สังกัด อหก. กฟผ.)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-300 shadow-xs">
            <Calendar className="w-4 h-4 text-brand-primary" />
            <span className="text-xs font-extrabold text-slate-700">ประจำเดือน:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold text-brand-secondary bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
 
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-brand-primary hover:bg-brand-primaryHover text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            title="นำเข้าข้อมูลจากไฟล์ Template พน.1.xlsx"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>นำเข้าข้อมูล Excel</span>
          </button>
          <button
            onClick={() => handleOpenExportModal()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            title="ส่งออกรายงาน พน.1 ในรูปแบบ VMC Form 01 (Excel 1 ไฟล์แยก Sheet / PDF 1 หน้า 1 คัน)"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก พน.1 (Excel / PDF)</span>
          </button>
        </div>
      </div>

      {/* Fleet Overview Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-brand-surface p-4 rounded-xl border border-brand-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-brand-textMuted">รถทั้งหมดในเดือนนี้</span>
            <h4 className="text-2xl font-bold text-brand-secondary mt-0.5">{totalVehiclesCount} <span className="text-xs font-normal text-slate-500">คัน</span></h4>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-brand-surface p-4 rounded-xl border border-brand-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-brand-textMuted">รถที่ถูกนำออกใช้งาน</span>
            <h4 className="text-2xl font-bold text-emerald-700 mt-0.5">{usedVehiclesCount} <span className="text-xs font-normal text-slate-500">คัน</span></h4>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-brand-surface p-4 rounded-xl border border-brand-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-brand-textMuted">ไม่ได้ใช้งาน (Default)</span>
            <h4 className="text-2xl font-bold text-slate-700 mt-0.5">{unusedVehiclesCount} <span className="text-xs font-normal text-slate-500">คัน</span></h4>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-brand-surface p-4 rounded-xl border border-brand-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-brand-textMuted">อัตราการใช้งานเฉลี่ย (UR)</span>
            <h4 className="text-2xl font-bold text-brand-primary mt-0.5">{avgFleetUrRate}%</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-brand-primary">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-brand-surface p-4 rounded-xl border border-brand-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            {['all', 'กยค-พ.', 'กคร-พ.', 'กฟค-พ.'].map((dept) => (
              <button
                key={dept}
                onClick={() => setDepartmentFilter(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  departmentFilter === dept
                    ? 'bg-white text-brand-secondary shadow-xs'
                    : 'text-slate-600 hover:text-brand-secondary'
                }`}
              >
                {dept === 'all' ? 'ทุกกองสังกัด' : dept}
              </button>
            ))}
          </div>

          {/* Status / UR Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-brand-secondary shadow-xs' : 'text-slate-600'
              }`}
            >
              ทั้งหมด ({reports.length})
            </button>
            <button
              onClick={() => setStatusFilter('used')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'used' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              มีการใช้งาน ({usedVehiclesCount})
            </button>
            <button
              onClick={() => setStatusFilter('unused')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'unused' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              ไม่ได้ใช้งาน ({unusedVehiclesCount})
            </button>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="ค้นหาตามทะเบียน กฟผ., ทะเบียนรถ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
      </div>

      {/* Main Reports List */}
      {loading ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-12 text-center text-slate-500">
          กำลังโหลดและคำนวณข้อมูลรายงาน พน.1 ประจำเดือน {selectedMonth}...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-12 text-center space-y-3 shadow-sm">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-brand-secondary">ไม่พบรายการยานพาหนะตามเงื่อนไขที่เลือก</h3>
          <p className="text-xs text-brand-textMuted">
            ลองปรับเปลี่ยนตัวกรองสังกัด หรือล้างคำค้นหา
          </p>
          <button
            onClick={() => {
              setDepartmentFilter('all');
              setStatusFilter('all');
              setSearchTerm('');
            }}
            className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between px-1">
            <span>แสดงรายการยานพาหนะ {filteredReports.length} จากทั้งหมด {reports.length} คัน</span>
            <span>ประจำเดือน: <strong className="text-brand-secondary">{selectedMonth}</strong></span>
          </div>

          {filteredReports.map((report) => {
            const isUsed = (report.ur_rate || 0) > 0 || (report.used_days || 0) > 0;
            return (
              <div 
                key={report.id} 
                className={`bg-brand-surface rounded-2xl border shadow-xs overflow-hidden transition-all hover:shadow-md ${
                  isUsed ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-brand-border'
                }`}
              >
                {/* Report Card Header */}
                <div className="bg-slate-50/80 p-4 border-b border-brand-border flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl text-white shadow-xs ${isUsed ? 'bg-emerald-600' : 'bg-slate-400'}`}>
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-brand-secondary">{report.internal_id}</h3>
                        <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {report.license_plate}
                        </span>
                        {/* UR Rate Status Badge */}
                        {isUsed ? (
                          <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>ใช้งาน (UR: {report.ur_rate}%)</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2.5 py-0.5 rounded-full border border-slate-300">
                            ไม่ได้ใช้งาน (UR: 0%)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {report.brand_model} | เชื้อเพลิง: <strong className="text-slate-700">{report.fuel_type || 'ดีเซล'}</strong> | สังกัด: <strong className="text-brand-secondary">{report.department}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Actions for this vehicle report */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(report)}
                      className="bg-brand-primary hover:bg-brand-primaryHover text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                      title="กดเพื่อบันทึกหรือแก้ไขการเดินทางของคันนี้ ระบบจะประเมินค่า Parameter อัตโนมัติ"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>บันทึก / แก้ไขการเดินทาง</span>
                    </button>
                    <button
                      onClick={() => toggleExpand(report.id)}
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      <span>{expandedReportId === report.id ? 'ซ่อน' : `ตารางรายวัน (${report.daily_logs?.length || 0})`}</span>
                      {expandedReportId === report.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleOpenExportModal(report.vehicle_id)}
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                      title="ส่งออกรายงาน พน.1 คันนี้ (Excel / PDF)"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                  </div>
                </div>

                {/* Parameters & Calculated Metrics Section */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">วันทำการในเดือน</span>
                      <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{report.total_working_days || 30} วัน</span>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isUsed ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="block text-[11px] font-extrabold text-emerald-800">ใช้งาน (รหัส /)</span>
                      <span className="text-sm font-black text-emerald-900 mt-0.5 block">{report.used_days || 0} วัน</span>
                      <span className="text-[10px] text-emerald-700 block font-bold">ระยะทาง: {report.total_distance?.toLocaleString() || 0} km</span>
                    </div>
                    <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                      <span className="text-amber-800 block text-[11px] font-extrabold">ว่างงาน (รหัส *)</span>
                      <span className="text-sm font-black text-amber-900 mt-0.5 block">{report.idle_days || 0} วัน</span>
                    </div>
                    <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-200">
                      <span className="text-rose-800 block text-[11px] font-extrabold">ซ่อม (รหัส 0)</span>
                      <span className="text-sm font-black text-rose-900 mt-0.5 block">{report.repair_days || 0} วัน</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-0.5">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">ปริมาณน้ำมันที่เติม</span>
                      <span className="text-sm font-black text-brand-secondary mt-0.5 block">{report.total_liters?.toLocaleString() || 0} ลิตร</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">ราคาเชื้อเพลิงรวม</span>
                      <span className="text-sm font-black text-emerald-700 mt-0.5 block">{report.total_fuel_cost?.toLocaleString() || 0} ฿</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">สิ้นเปลืองเฉลี่ย</span>
                      <span className="text-sm font-black text-brand-primary mt-0.5 block">
                        {report.avg_fuel_consumption ? `${report.avg_fuel_consumption} km/L` : '-'}
                      </span>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isUsed ? 'bg-emerald-100/80 border-emerald-300' : 'bg-slate-100 border-slate-200'}`}>
                      <span className="text-slate-700 block text-[11px] font-extrabold">UR Rate ประจำเดือน</span>
                      <span className={`text-base font-black mt-0.5 block ${isUsed ? 'text-emerald-800' : 'text-slate-600'}`}>
                        {report.ur_rate || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expandable Daily Logs Table */}
                {expandedReportId === report.id && (
                  <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        ตารางการเดินทางรายวัน ({report.daily_logs?.length || 0} วัน)
                      </h4>
                      <button
                        onClick={() => handleOpenEditModal(report)}
                        className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>เพิ่ม / แก้ไขรายการเดินทาง</span>
                      </button>
                    </div>

                    {!report.daily_logs || report.daily_logs.length === 0 ? (
                      <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-500 space-y-2">
                        <p>ยังไม่มีรายการเดินทางในเดือนนี้ (สถานะว่างงาน UR = 0%)</p>
                        <button
                          onClick={() => handleOpenEditModal(report)}
                          className="bg-brand-primary hover:bg-brand-primaryHover text-white px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>บันทึกการใช้งาน</span>
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-inner">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                              <th className="p-2.5">ลำดับ</th>
                              <th className="p-2.5">วันที่</th>
                              <th className="p-2.5">รหัส</th>
                              <th className="p-2.5">กม. ก่อนออก</th>
                              <th className="p-2.5">กม. เสร็จงาน</th>
                              <th className="p-2.5">ระยะทาง</th>
                              <th className="p-2.5">ต้นทาง - ปลายทาง</th>
                              <th className="p-2.5">พนักงานขับ</th>
                              <th className="p-2.5">เติมน้ำมัน (ลิตร / บาท)</th>
                              <th className="p-2.5">ตรวจ 8 รายการ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                            {report.daily_logs.map((log, idx) => {
                              const dist = log.end_mileage >= log.start_mileage ? log.end_mileage - log.start_mileage : 0;
                              const checklistCount = log.checklist ? Object.values(log.checklist).filter(Boolean).length : 0;
                              return (
                                <tr key={log.id || idx} className="hover:bg-slate-50/80">
                                  <td className="p-2.5 font-bold text-slate-500">{idx + 1}</td>
                                  <td className="p-2.5 font-bold">{log.date}</td>
                                  <td className="p-2.5">
                                    <span className={`px-2 py-0.5 rounded font-black text-xs ${
                                      log.status_code === '/' ? 'bg-emerald-100 text-emerald-800' :
                                      log.status_code === '*' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {log.status_code}
                                    </span>
                                  </td>
                                  <td className="p-2.5">{log.start_mileage?.toLocaleString()}</td>
                                  <td className="p-2.5 font-bold text-brand-primary">{log.end_mileage?.toLocaleString()}</td>
                                  <td className="p-2.5 font-bold text-emerald-700">{dist > 0 ? `+${dist} km` : '-'}</td>
                                  <td className="p-2.5">{log.origin} &rarr; {log.destination}</td>
                                  <td className="p-2.5 font-semibold text-slate-800">{log.driver_name || '-'}</td>
                                  <td className="p-2.5">
                                    {log.is_refueled && log.fuel_liters ? (
                                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                        {log.fuel_liters}L ({log.fuel_total_cost}฿)
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </td>
                                  <td className="p-2.5">
                                    {checklistCount > 0 ? (
                                      <span className="text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                        ✓ ผ่าน {checklistCount}/8 รายการ
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pn1 Report Modal (For adding/editing vehicle daily trips) */}
      <Pn1ReportModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setReportToEdit(null);
        }}
        onSuccess={() => {
          loadData(selectedMonth);
        }}
        vehicles={vehicles}
        reportToEdit={reportToEdit}
        defaultMonth={selectedMonth}
      />

      {/* Pn1 Excel Import Modal */}
      <Pn1ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          loadData(selectedMonth);
        }}
        vehicles={vehicles}
        defaultMonth={selectedMonth}
      />

      {/* Pn1 Export Modal (VMC Form 01 Excel & PDF) */}
      <Pn1ExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setExportVehicleId(null);
        }}
        vehicles={vehicles}
        reports={reports}
        defaultMonth={selectedMonth}
        initialSelectedVehicleId={exportVehicleId}
        onPrintPreview={(ids) => setPrintVehicleIds(ids)}
      />

      {/* Hidden Vector Print View for 1-Page-per-Vehicle PDF & Native Print */}
      <VmcForm01PrintView
        vehicles={
          printVehicleIds && printVehicleIds.length > 0
            ? vehicles.filter(v => printVehicleIds.includes(v.id))
            : vehicles
        }
        reports={reports}
        month={selectedMonth}
      />
    </div>
  );
};
