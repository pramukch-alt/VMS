import React, { useState, useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  RotateCcw,
  Check,
  AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Vehicle } from '../types';
import { importPn1ExcelData } from '../services/api';

interface Pn1ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicles: Vehicle[];
  defaultMonth?: string;
}

interface ParsedImportRow {
  rowNum: number;
  rawVehicleId: string;
  matchedVehicle: Vehicle | null;
  month: string;
  date: string;
  status_code: '/' | '*' | '0';
  start_mileage: number;
  end_mileage: number;
  fuel_mileage?: number;
  checklist: {
    coolant: boolean;
    engine_oil: boolean;
    brake: boolean;
    clutch: boolean;
    tire: boolean;
    signal_light: boolean;
    hydraulic: boolean;
    vehicle_body: boolean;
  };
  fuel_liters?: number;
  fuel_price_per_liter?: number;
  fuel_total_cost?: number;
  department: string;
  driver_name: string;
  destination: string;
  isValid: boolean;
  error?: string;
}

export const Pn1ImportModal: React.FC<Pn1ImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vehicles,
  defaultMonth = '2026-09'
}) => {
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [activeTab, setActiveTab] = useState<'valid' | 'invalid'>('valid');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const cleanStr = (s: any) => (s || '').toString().trim().replace(/\s+/g, '').toLowerCase();

  const parseExcelDate = (val: any, monthStr: string): string => {
    if (val === null || val === undefined || val === '') return '';
    
    if (typeof val === 'number') {
      // Day of month 1-31
      if (val >= 1 && val <= 31) {
        return `${monthStr}-${String(Math.floor(val)).padStart(2, '0')}`;
      }
      // Excel serial date code
      try {
        const utc_days = Math.floor(val - 25569);
        const date_info = new Date(utc_days * 86400 * 1000);
        let y = date_info.getUTCFullYear();
        if (y > 2400) y -= 543;
        const m = String(date_info.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date_info.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      } catch {
        return '';
      }
    }

    const str = String(val).trim();
    if (/^\d{1,2}$/.test(str)) {
      const day = parseInt(str, 10);
      if (day >= 1 && day <= 31) {
        return `${monthStr}-${String(day).padStart(2, '0')}`;
      }
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const parts = str.split('-').map(Number);
      let y = parts[0];
      if (y > 2400) y -= 543;
      return `${y}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
    }

    const slashMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (slashMatch) {
      let d = Number(slashMatch[1]);
      let m = Number(slashMatch[2]);
      let y = Number(slashMatch[3]);
      if (y > 2400) y -= 543;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    return str;
  };

  const parseExcelMonth = (val: any, fallbackMonth: string): string => {
    if (!val) return fallbackMonth;
    if (typeof val === 'number' && val > 30000) {
      const date = new Date((val - 25569) * 86400 * 1000);
      let y = date.getUTCFullYear();
      if (y > 2400) y -= 543;
      return `${y}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    }
    const str = String(val).trim();
    if (/^\d{4}-\d{2}$/.test(str)) {
      const parts = str.split('-').map(Number);
      let y = parts[0];
      if (y > 2400) y -= 543;
      return `${y}-${String(parts[1]).padStart(2, '0')}`;
    }
    const match = str.match(/^(\d{1,2})[\/\-](\d{4})$/);
    if (match) {
      let m = Number(match[1]);
      let y = Number(match[2]);
      if (y > 2400) y -= 543;
      return `${y}-${String(m).padStart(2, '0')}`;
    }
    return fallbackMonth;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setFileName(file.name);
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (!rawData || rawData.length < 2) {
          throw new Error('ไฟล์ไม่มีข้อมูลหรือรูปแบบไม่ถูกต้อง');
        }

        // Detect start row: if row 0 has "ทะเบียน" and row 1 has "ก่อนออก", data starts at row 2
        let startRowIndex = 2;
        for (let i = 0; i < Math.min(rawData.length, 5); i++) {
          const rowText = (rawData[i] || []).join(' ');
          if (rowText.includes('ก่อนออกใช้งาน') || rowText.includes('นำรถกลับเข้าเก็บ')) {
            startRowIndex = i + 1;
            break;
          }
        }

        const rows: ParsedImportRow[] = [];
        let lastKnownVehicleId = '';

        for (let r = startRowIndex; r < rawData.length; r++) {
          const row = rawData[r];
          if (!row || row.length === 0 || row.every((c: any) => c === null || c === undefined || c === '')) {
            continue; // skip empty rows
          }

          const rawId = (row[0] !== null && row[0] !== undefined && String(row[0]).trim()) 
            ? String(row[0]).trim() 
            : lastKnownVehicleId;
          
          if (rawId) {
            lastKnownVehicleId = rawId;
          }

          const targetMonth = parseExcelMonth(row[1], selectedMonth);
          const dateStr = parseExcelDate(row[2], targetMonth);

          // Find vehicle in system
          const matched = rawId ? vehicles.find(v => 
            cleanStr(v.internal_id) === cleanStr(rawId) ||
            cleanStr(v.license_plate) === cleanStr(rawId)
          ) || null : null;

          // Status code
          let code: '/' | '*' | '0' = '/';
          const rawCode = String(row[3] || '').trim();
          if (rawCode === '0' || rawCode === 'ซ่อม') code = '0';
          else if (rawCode === '*' || rawCode === 'ว่างงาน' || rawCode === 'ว่าง') code = '*';
          else code = '/';

          const startM = Number(row[4]) || 0;
          const endM = Number(row[5]) || 0;
          const fuelM = Number(row[6]) || 0;

          const isChecked = (c: any) => {
            if (c === null || c === undefined || c === '') return true; // default pass
            const s = String(c).trim();
            return s === '/' || s === '1' || s.toLowerCase() === 'true' || s === 'ผ่าน' || s.toLowerCase() === 'y';
          };

          const liters = row[15] !== undefined && row[15] !== null && row[15] !== '' ? Number(row[15]) : undefined;
          const pricePerLiter = row[16] !== undefined && row[16] !== null && row[16] !== '' ? Number(row[16]) : undefined;
          const totalCost = row[17] !== undefined && row[17] !== null && row[17] !== '' 
            ? Number(row[17]) 
            : (liters && pricePerLiter ? liters * pricePerLiter : undefined);

          const dept = String(row[18] || matched?.department || 'อหก.').trim();
          const driver = String(row[19] || 'พนักงานขับรถ กฟผ.').trim();
          const dest = String(row[20] || 'ปฏิบัติงานตามภารกิจ').trim();

          let isValid = true;
          let rowError = '';

          if (!rawId) {
            isValid = false;
            rowError = 'ไม่ได้ระบุทะเบียน กฟผ.';
          } else if (!matched) {
            isValid = false;
            rowError = `ไม่พบรถ "${rawId}" ในฐานข้อมูลระบบ`;
          } else if (!dateStr) {
            isValid = false;
            rowError = 'ไม่ได้ระบุวันที่หรือรูปแบบวันที่ไม่ถูกต้อง';
          }

          rows.push({
            rowNum: r + 1,
            rawVehicleId: rawId,
            matchedVehicle: matched,
            month: targetMonth,
            date: dateStr,
            status_code: code,
            start_mileage: startM,
            end_mileage: endM,
            fuel_mileage: fuelM,
            checklist: {
              coolant: isChecked(row[7]),
              engine_oil: isChecked(row[8]),
              brake: isChecked(row[9]),
              clutch: isChecked(row[10]),
              tire: isChecked(row[11]),
              signal_light: isChecked(row[12]),
              hydraulic: isChecked(row[13]),
              vehicle_body: isChecked(row[14])
            },
            fuel_liters: liters,
            fuel_price_per_liter: pricePerLiter,
            fuel_total_cost: totalCost,
            department: dept,
            driver_name: driver,
            destination: dest,
            isValid,
            error: rowError
          });
        }

        setParsedRows(rows);
        if (rows.filter(r => r.isValid).length === 0 && rows.length > 0) {
          setActiveTab('invalid');
        } else {
          setActiveTab('valid');
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg(`เกิดข้อผิดพลาดในการอ่านไฟล์: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validRows = parsedRows.filter(r => r.isValid);
  const invalidRows = parsedRows.filter(r => !r.isValid);

  // Stats
  const distinctVehicles = new Set(validRows.map(r => r.matchedVehicle?.id)).size;
  const totalLiters = validRows.reduce((sum, r) => sum + (r.fuel_liters || 0), 0);
  const totalDistance = validRows.reduce((sum, r) => sum + Math.max(0, r.end_mileage - r.start_mileage), 0);

  const handleConfirmImport = async () => {
    if (validRows.length === 0) {
      setErrorMsg('ไม่มีรายการที่พร้อมนำเข้า');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      
      const payload = {
        defaultMonth: selectedMonth,
        records: validRows.map(r => ({
          internal_id: r.matchedVehicle?.internal_id || r.rawVehicleId,
          month: r.month,
          date: r.date,
          status_code: r.status_code,
          start_mileage: r.start_mileage,
          end_mileage: r.end_mileage,
          fuel_mileage: r.fuel_mileage,
          checklist: r.checklist,
          fuel_liters: r.fuel_liters,
          fuel_price_per_liter: r.fuel_price_per_liter,
          fuel_total_cost: r.fuel_total_cost,
          department: r.department,
          driver_name: r.driver_name,
          destination: r.destination
        }))
      };

      const res = await importPn1ExcelData(payload);
      setSuccessMsg(`✅ ${res.message}`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-brand-secondary text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">นำเข้าข้อมูลรายงาน พน.1 (จากไฟล์ Excel)</h3>
              <p className="text-xs text-slate-300">
                รองรับไฟล์แบบฟอร์ม <strong>Template พน.1.xlsx</strong> สำหรับบันทึกการใช้งานรถประจำเดือนแบบรวดเร็ว
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href="http://localhost:5000/api/pn1-reports/template"
              download="Template พน.1.xlsx"
              className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors"
              title="ดาวน์โหลดไฟล์แบบฟอร์มเปล่าเพื่อนำไปกรอกข้อมูล"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด Template</span>
            </a>
            <button onClick={onClose} className="p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Month Selector & File Upload Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block text-xs font-bold text-brand-secondary">
                เลือกเดือนเป้าหมาย (Default Month)
              </label>
              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-slate-300">
                <Calendar className="w-4 h-4 text-brand-primary" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none w-full cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                * ใช้กรณีในไฟล์ Excel ระบุเพียงวันที่ (1-31) โดยไม่ได้ระบุเดือน
              </p>
            </div>

            {/* Dropzone */}
            <div className="md:col-span-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 p-4 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all h-full"
              >
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-full mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {fileName ? `ไฟล์ที่เลือก: ${fileName}` : 'คลิกเพื่อเลือกไฟล์ Excel (.xlsx, .xls) หรือลากไฟล์มาวางที่นี่'}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  รองรับแบบฟอร์ม <strong>Source/Template พน.1.xlsx</strong> ของสายงาน อหก.
                </span>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
              <RotateCcw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>กำลังอ่านและตรวจสอบข้อมูลจากไฟล์ Excel...</span>
            </div>
          )}

          {/* Parsed Rows Section */}
          {parsedRows.length > 0 && !loading && (
            <div className="space-y-3">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs">
                  <span className="text-slate-500 block">แถวข้อมูลทั้งหมด</span>
                  <span className="text-base font-bold text-slate-800">{parsedRows.length} แถว</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs">
                  <span className="text-emerald-700 block">รถที่จับคู่สำเร็จ</span>
                  <span className="text-base font-bold text-emerald-800">{distinctVehicles} คัน</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs">
                  <span className="text-blue-700 block">ระยะทางใช้งานรวม</span>
                  <span className="text-base font-bold text-blue-800">{totalDistance.toLocaleString()} km</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs">
                  <span className="text-amber-800 block">น้ำมันที่เติมรวม</span>
                  <span className="text-base font-bold text-amber-900">{totalLiters.toLocaleString()} ลิตร</span>
                </div>
              </div>

              {/* Tabs: Valid vs Invalid */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="flex items-center space-x-2 text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('valid')}
                    className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ${
                      activeTab === 'valid'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>รายการที่พร้อมนำเข้า ({validRows.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('invalid')}
                    className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ${
                      activeTab === 'invalid'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>รายการที่พบปัญหา ({invalidRows.length})</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-500">
                  แสดงตัวอย่างข้อมูลที่สกัดได้จากไฟล์
                </span>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 text-[11px] font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">แถว</th>
                      <th className="p-2.5">ทะเบียน กฟผ.</th>
                      <th className="p-2.5">วันที่</th>
                      <th className="p-2.5">รหัส</th>
                      <th className="p-2.5 text-right">ไมล์เริ่ม</th>
                      <th className="p-2.5 text-right">ไมล์เสร็จ</th>
                      <th className="p-2.5 text-right">ระยะทาง</th>
                      <th className="p-2.5 text-right">น้ำมัน (ลิตร)</th>
                      <th className="p-2.5">ผู้ขับขี่</th>
                      <th className="p-2.5">สถานที่</th>
                      {activeTab === 'invalid' && <th className="p-2.5 text-rose-600">ปัญหาที่พบ</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(activeTab === 'valid' ? validRows : invalidRows).map((row, i) => {
                      const dist = Math.max(0, row.end_mileage - row.start_mileage);
                      return (
                        <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-2 text-slate-400 font-mono text-[10px]">#{row.rowNum}</td>
                          <td className="p-2 font-bold text-slate-800">
                            {row.matchedVehicle ? (
                              <div>
                                <span>{row.matchedVehicle.internal_id}</span>
                                <span className="text-[10px] text-slate-400 block font-normal">({row.matchedVehicle.license_plate})</span>
                              </div>
                            ) : (
                              <span className="text-rose-600 font-semibold">{row.rawVehicleId || '(ว่าง)'}</span>
                            )}
                          </td>
                          <td className="p-2 font-mono text-[11px] text-slate-600">{row.date || '-'}</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.status_code === '/' ? 'bg-emerald-100 text-emerald-800' :
                              row.status_code === '0' ? 'bg-rose-100 text-rose-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {row.status_code === '/' ? '/ (ใช้งาน)' : row.status_code === '0' ? '0 (ซ่อม)' : '* (ว่าง)'}
                            </span>
                          </td>
                          <td className="p-2 text-right font-mono">{row.start_mileage ? row.start_mileage.toLocaleString() : '-'}</td>
                          <td className="p-2 text-right font-mono">{row.end_mileage ? row.end_mileage.toLocaleString() : '-'}</td>
                          <td className="p-2 text-right font-mono font-bold text-blue-700">{dist > 0 ? dist.toLocaleString() : '-'}</td>
                          <td className="p-2 text-right font-mono text-amber-800">{row.fuel_liters ? row.fuel_liters.toLocaleString() : '-'}</td>
                          <td className="p-2 text-slate-600 truncate max-w-[120px]">{row.driver_name || '-'}</td>
                          <td className="p-2 text-slate-600 truncate max-w-[140px]">{row.destination || '-'}</td>
                          {activeTab === 'invalid' && (
                            <td className="p-2 text-rose-600 text-[11px] font-semibold">{row.error}</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {validRows.length > 0 ? (
              <span>พร้อมนำเข้า <strong>{validRows.length}</strong> รายการสำหรับรถ <strong>{distinctVehicles}</strong> คัน</span>
            ) : (
              <span>กรุณาเลือกไฟล์ Excel เพื่อเริ่มต้นการนำเข้า</span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={submitting || validRows.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>กำลังนำเข้าข้อมูล...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยืนยันนำเข้าข้อมูล ({validRows.length} รายการ)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
