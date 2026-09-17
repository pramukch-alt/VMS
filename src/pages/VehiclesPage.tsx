import React, { useState } from 'react';
import { Search, MapPin, Gauge, Plus } from 'lucide-react';
import { Vehicle } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AddVehicleModal } from '../components/AddVehicleModal';

interface VehiclesPageProps {
  vehicles: Vehicle[];
  onSelectVehicle: (v: Vehicle) => void;
  onRefreshVehicles?: () => void;
  selectedDepartmentFilter?: string;
  onDepartmentFilterChange?: (dept: string) => void;
  taxDueOnlyFilter?: boolean;
  onTaxDueOnlyChange?: (val: boolean) => void;
}

export const VehiclesPage: React.FC<VehiclesPageProps> = ({
  vehicles,
  onSelectVehicle,
  onRefreshVehicles,
  selectedDepartmentFilter = 'all',
  onDepartmentFilterChange,
  taxDueOnlyFilter = false,
  onTaxDueOnlyChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>(selectedDepartmentFilter);
  const [isTaxDueOnly, setIsTaxDueOnly] = useState<boolean>(taxDueOnlyFilter);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  React.useEffect(() => {
    setSelectedDepartment(selectedDepartmentFilter);
  }, [selectedDepartmentFilter]);

  React.useEffect(() => {
    setIsTaxDueOnly(taxDueOnlyFilter);
  }, [taxDueOnlyFilter]);

  const departments = React.useMemo(() => {
    return Array.from(new Set(vehicles.map((v) => v.department).filter(Boolean)));
  }, [vehicles]);

  const locations = React.useMemo(() => {
    return Array.from(new Set(vehicles.map((v) => v.base_location).filter(Boolean))).sort();
  }, [vehicles]);

  const filteredVehicles = vehicles.filter((v) => {
    if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && v.status !== selectedStatus) return false;
    if (selectedLocation !== 'all' && v.base_location !== selectedLocation) return false;
    if (selectedDepartment !== 'all' && (v.department || '') !== selectedDepartment) return false;

    if (isTaxDueOnly) {
      if (!v.tax_due_date) return false;
      const today = new Date('2026-09-15');
      const limit90 = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
      const d = new Date(v.tax_due_date);
      if (!(d >= today && d <= limit90)) return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchId = v.internal_id.toLowerCase().includes(term);
      const matchPlate = v.license_plate.toLowerCase().includes(term);
      const matchBrand = v.brand.toLowerCase().includes(term);
      const matchModel = v.model.toLowerCase().includes(term);
      const matchDept = (v.department || '').toLowerCase().includes(term);
      const matchFuel = (v.fuel_type || '').toLowerCase().includes(term);
      return matchId || matchPlate || matchBrand || matchModel || matchDept || matchFuel;
    }
    return true;
  });

  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    if (onDepartmentFilterChange) {
      onDepartmentFilterChange(dept);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Vehicle Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-secondary">ข้อมูลยานพาหนะ</h2>
          <p className="text-sm text-brand-textMuted mt-0.5">
            ระบบจัดเก็บทะเบียนประวัติ ค้นหาข้อมูล และติดตามสถานะยานพาหนะรวม {vehicles.length} คัน
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brand-primary hover:bg-brand-primaryHover text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มยานพาหนะ</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-brand-surface p-4 rounded-xl border border-brand-border shadow-sm space-y-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-brand-secondary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({vehicles.length})
          </button>
          <button
            onClick={() => setSelectedCategory('ยานพาหนะเดินทาง')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'ยานพาหนะเดินทาง'
                ? 'bg-brand-secondary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ยานพาหนะเดินทาง ({vehicles.filter(v => v.category === 'ยานพาหนะเดินทาง').length})
          </button>
          <button
            onClick={() => setSelectedCategory('รถเครื่องจักรกล')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'รถเครื่องจักรกล'
                ? 'bg-brand-secondary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            รถเครื่องจักรกล ({vehicles.filter(v => v.category === 'รถเครื่องจักรกล').length})
          </button>
        </div>

        {/* Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาตามทะเบียน กฟผ. / ทะเบียนรถ / สังกัด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-xs focus:ring-2 focus:ring-brand-primary focus:bg-white"
            />
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            className="bg-slate-50 border border-brand-border rounded-lg px-3 py-2 text-xs font-semibold text-brand-secondary focus:ring-2 focus:ring-brand-primary cursor-pointer"
          >
            <option value="all">-- สังกัดทั้งหมด ({vehicles.length} คัน) --</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                สังกัด: {dept} ({vehicles.filter(v => v.department === dept).length} คัน)
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-brand-border rounded-lg px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="all">-- สถานะรถทั้งหมด --</option>
            <option value="จอดรองาน">จอดรองาน (Standby)</option>
            <option value="ใช้งาน">ใช้งาน (In Use)</option>
            <option value="รอซ่อม">รอซ่อม / Maintenance</option>
          </select>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-slate-50 border border-brand-border rounded-lg px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="all">-- สถานที่ประจำรถทั้งหมด ({vehicles.length} คัน) --</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc} ({vehicles.filter(v => v.base_location === loc).length} คัน)
              </option>
            ))}
          </select>
        </div>

        {/* Active Filter Notice Banners */}
        {isTaxDueOnly && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center space-x-2">
              <span className="font-bold">⚠️ กรองยานพาหนะภาษีใกล้ครบกำหนด (ภายใน 90 วัน):</span>
              {selectedDepartment !== 'all' && (
                <span className="bg-rose-200/80 px-2.5 py-0.5 rounded font-extrabold text-rose-950 border border-rose-300">
                  สังกัด {selectedDepartment}
                </span>
              )}
              <span className="text-slate-600 font-medium">
                (พบทั้งหมด {filteredVehicles.length} คัน)
              </span>
            </div>
            <button
              onClick={() => {
                setIsTaxDueOnly(false);
                if (onTaxDueOnlyChange) onTaxDueOnlyChange(false);
                handleDepartmentChange('all');
              }}
              className="text-rose-800 hover:text-rose-950 font-bold underline text-xs cursor-pointer"
            >
              แสดงยานพาหนะทั้งหมด (ล้างตัวกรองภาษี)
            </button>
          </div>
        )}

        {selectedDepartment !== 'all' && !isTaxDueOnly && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center space-x-2">
              <span className="font-bold">กำลังแสดงรายการรถเฉพาะสังกัด/กอง:</span>
              <span className="bg-amber-200/80 px-2.5 py-0.5 rounded font-extrabold text-amber-950 border border-amber-300">
                {selectedDepartment}
              </span>
              <span className="text-slate-600 font-medium">
                (พบทั้งหมด {filteredVehicles.length} คัน)
              </span>
            </div>
            <button
              onClick={() => handleDepartmentChange('all')}
              className="text-amber-800 hover:text-amber-950 font-bold underline text-xs cursor-pointer"
            >
              แสดงยานพาหนะทุกสังกัด (ล้างตัวกรอง)
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-brand-surface rounded-xl border border-brand-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-brand-textMuted text-xs font-semibold uppercase tracking-wider border-b border-brand-border">
                <th className="py-3 px-4">ทะเบียน กฟผ.</th>
                <th className="py-3 px-4">ทะเบียนรถ</th>
                <th className="py-3 px-4">ยี่ห้อ / รุ่น</th>
                <th className="py-3 px-4">หมวดหมู่ & ประเภท</th>
                <th className="py-3 px-4">สังกัด</th>
                <th className="py-3 px-4">เชื้อเพลิง</th>
                <th className="py-3 px-4">ประจำที่</th>
                <th className="py-3 px-4">เลขไมล์ล่าสุด</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">วันหมดอายุภาษี</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-sm">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                    ไม่พบยานพาหนะตรงตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => onSelectVehicle(v)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-brand-secondary">{v.internal_id}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{v.license_plate}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div>{v.brand} {v.model}</div>
                      <div className="text-[11px] text-slate-400">{v.specifications || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="font-semibold text-slate-700">{v.category}</div>
                      <div className="text-[11px] text-slate-400">{v.vehicle_type}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-brand-secondary">
                      {v.department || 'อหก.'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                        {v.fuel_type || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                        {v.base_location}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-slate-400" />
                        {(v.current_mileage || 0).toLocaleString()} km
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs font-semibold text-rose-600">
                      {v.tax_due_date || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          if (onRefreshVehicles) onRefreshVehicles();
        }}
      />
    </div>
  );
};
