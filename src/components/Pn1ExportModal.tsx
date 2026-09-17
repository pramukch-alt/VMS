import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  FileText, 
  CheckSquare, 
  Square, 
  Search, 
  Calendar, 
  Car, 
  CheckCircle2, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Vehicle, Pn1Report } from '../types';
import { exportPn1Excel } from '../services/api';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface Pn1ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  reports: Pn1Report[];
  defaultMonth?: string;
  initialSelectedVehicleId?: number | null;
  onPrintPreview?: (selectedVehicleIds: number[]) => void;
}

export const Pn1ExportModal: React.FC<Pn1ExportModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  reports,
  defaultMonth = '2026-09',
  initialSelectedVehicleId = null,
  onPrintPreview
}) => {
  const [month, setMonth] = useState(defaultMonth);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize selected vehicles when modal opens
  useEffect(() => {
    if (isOpen) {
      setMonth(defaultMonth);
      setFeedbackMessage(null);
      if (initialSelectedVehicleId) {
        setSelectedIds(new Set([initialSelectedVehicleId]));
      } else {
        // Default to all vehicles selected
        setSelectedIds(new Set(vehicles.map(v => v.id)));
      }
    }
  }, [isOpen, defaultMonth, initialSelectedVehicleId, vehicles]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      if (departmentFilter !== 'all' && v.department !== departmentFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchInternal = v.internal_id?.toLowerCase().includes(term);
        const matchPlate = v.license_plate?.toLowerCase().includes(term);
        const matchBrand = `${v.brand} ${v.model}`.toLowerCase().includes(term);
        const matchDept = v.department?.toLowerCase().includes(term);
        if (!matchInternal && !matchPlate && !matchBrand && !matchDept) {
          return false;
        }
      }
      return true;
    });
  }, [vehicles, departmentFilter, searchTerm]);

  // Toggle single vehicle
  const toggleVehicle = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Toggle select all (filtered)
  const isAllFilteredSelected = filteredVehicles.length > 0 && filteredVehicles.every(v => selectedIds.has(v.id));

  const handleToggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (isAllFilteredSelected) {
      filteredVehicles.forEach(v => next.delete(v.id));
    } else {
      filteredVehicles.forEach(v => next.add(v.id));
    }
    setSelectedIds(next);
  };

  // Export Excel action
  const handleExportExcel = async () => {
    if (selectedIds.size === 0) {
      setFeedbackMessage({ type: 'error', text: 'กรุณาเลือกยานพาหนะอย่างน้อย 1 คันที่ต้องการส่งออก' });
      return;
    }

    try {
      setIsExportingExcel(true);
      setFeedbackMessage(null);
      const idsArray = Array.from(selectedIds);
      await exportPn1Excel(month, idsArray);
      setFeedbackMessage({
        type: 'success',
        text: `ส่งออกไฟล์ Excel สำเร็จ! รวม ${idsArray.length} คัน (แยก Sheet ตามรายคัน)`
      });
    } catch (err: any) {
      console.error('Export Excel failed:', err);
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'เกิดข้อผิดพลาดในการส่งออก Excel'
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Export PDF action (using html2pdf.js)
  const handleExportPdf = async () => {
    if (selectedIds.size === 0) {
      setFeedbackMessage({ type: 'error', text: 'กรุณาเลือกยานพาหนะอย่างน้อย 1 คันที่ต้องการส่งออก' });
      return;
    }

    try {
      setIsExportingPdf(true);
      setFeedbackMessage(null);

      // Ensure print view has only selected vehicles
      if (onPrintPreview) {
        onPrintPreview(Array.from(selectedIds));
      }

      // Small delay to allow DOM to render updated list
      await new Promise(resolve => setTimeout(resolve, 300));

      const printElement = document.getElementById('vmc-form-print-container');
      if (!printElement) {
        throw new Error('ไม่พบข้อมูลสำหรับสร้าง PDF');
      }

      // Temporarily remove display: none for html2pdf to capture
      const originalDisplay = printElement.style.display;
      printElement.style.display = 'block';

      const opt = {
        margin: [4, 4, 4, 4] as [number, number, number, number],
        filename: `รายงาน_พน1_${month}_${selectedIds.size}คัน.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      await html2pdf().from(printElement).set(opt).save();

      // Restore original display
      printElement.style.display = originalDisplay;

      setFeedbackMessage({
        type: 'success',
        text: `ดาวน์โหลดไฟล์ PDF สำเร็จ! รวม ${selectedIds.size} คัน (1 หน้าต่อ 1 คัน)`
      });
    } catch (err: any) {
      console.error('Export PDF failed:', err);
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'เกิดข้อผิดพลาดในการสร้างไฟล์ PDF'
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Print Preview / Native Browser Save as PDF
  const handleNativePrint = () => {
    if (selectedIds.size === 0) {
      setFeedbackMessage({ type: 'error', text: 'กรุณาเลือกยานพาหนะอย่างน้อย 1 คันที่ต้องการพิมพ์' });
      return;
    }

    if (onPrintPreview) {
      onPrintPreview(Array.from(selectedIds));
    }

    setTimeout(() => {
      window.print();
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <span>ส่งออกรายงาน พน.1 (VMC Form 01)</span>
                <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-semibold">
                  แบบฟอร์มทางการ
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                เลือกยานพาหนะที่ต้องการส่งออกในรูปแบบ Excel (1 ไฟล์ แยก Sheet ตามรายคัน) หรือ PDF (1 หน้า 1 คัน)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className={`px-5 py-2.5 text-xs font-semibold flex items-center space-x-2 border-b ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Month Picker */}
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-brand-primary" />
              <span className="text-xs font-bold text-slate-700">ประจำเดือน:</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
              {['all', 'กยค-พ.', 'กคร-พ.', 'กฟค-พ.'].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setDepartmentFilter(dept)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    departmentFilter === dept
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {dept === 'all' ? 'ทุกกอง' : dept}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาทะเบียน กฟผ. / ขนส่ง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Selection Bar & Select All */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleSelectAll}
                className="flex items-center space-x-1.5 font-bold text-slate-700 hover:text-emerald-700 py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {isAllFilteredSelected ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>เลือกทั้งหมดในรายการ ({filteredVehicles.length} คัน)</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-500">
                เลือกแล้ว:
              </span>
              <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {selectedIds.size} / {vehicles.length} คัน
              </span>
            </div>
          </div>
        </div>

        {/* Vehicles List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[420px] bg-slate-50/50">
          {filteredVehicles.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              ไม่พบยานพาหนะตามคำค้นหา
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredVehicles.map(vehicle => {
                const isSelected = selectedIds.has(vehicle.id);
                const report = reports.find(r => r.vehicle_id === vehicle.id && r.month === month);
                const isUsed = report && (report.ur_rate > 0 || report.used_days > 0);

                return (
                  <div
                    key={vehicle.id}
                    onClick={() => toggleVehicle(vehicle.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs' 
                        : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`p-1 rounded-md transition-colors ${isSelected ? 'text-emerald-600' : 'text-slate-300'}`}>
                        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900 truncate">{vehicle.internal_id}</span>
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {vehicle.license_plate}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {vehicle.brand} {vehicle.model} • <span className="font-medium text-slate-700">{vehicle.department}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-2">
                      {isUsed ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          UR {report?.ur_rate}% ({report?.used_days} วัน)
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          ไม่ได้ใช้งาน
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Export Actions */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            ระบบจะสร้างเอกสารตามแบบฟอร์ม <strong className="text-slate-700">VMC Form 01 (แบบฟอร์มยานพาหนะใหม่)</strong>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Native Print / Save as PDF */}
            <button
              onClick={handleNativePrint}
              disabled={selectedIds.size === 0}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer"
              title="เปิดหน้าต่างพิมพ์เบราว์เซอร์สำหรับตั้งค่าหรือเซฟ PDF คุณภาพเวกเตอร์ (1 หน้า 1 คัน)"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>พิมพ์ / Save as PDF</span>
            </button>

            {/* Download PDF via html2pdf.js */}
            <button
              onClick={handleExportPdf}
              disabled={selectedIds.size === 0 || isExportingPdf}
              className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              title="ดาวน์โหลดไฟล์ PDF โดยตรง (1 หน้า 1 คัน)"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>{isExportingPdf ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF (1 หน้า 1 คัน)'}</span>
            </button>

            {/* Export Excel (Multi-sheet) */}
            <button
              onClick={handleExportExcel}
              disabled={selectedIds.size === 0 || isExportingExcel}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              title="ส่งออกไฟล์ Excel 1 ไฟล์ รวมทุกคันที่เลือก แยก Sheet ตามรายคัน"
            >
              {isExportingExcel ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isExportingExcel ? 'กำลังสร้าง Excel...' : 'ส่งออก Excel (1 ไฟล์ แยก Sheet)'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
