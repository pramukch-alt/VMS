import React from 'react';
import { Car, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { DashboardStats, Vehicle, Pn1Report } from '../types';
import { MetricCard } from '../components/MetricCard';
import { TaxAlertBanner } from '../components/TaxAlertBanner';
import { StatusBadge } from '../components/StatusBadge';
import { fetchPn1Reports } from '../services/api';

interface DashboardProps {
  stats: DashboardStats | null;
  vehicles: Vehicle[];
  onSelectVehicle: (v: Vehicle) => void;
  onNavigateToTab: (tab: string) => void;
  onSelectDepartmentFilter?: (dept: string, taxDueOnly?: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  vehicles,
  onSelectVehicle,
  onNavigateToTab,
  onSelectDepartmentFilter
}) => {
  const metrics = stats?.metrics || { total: 0, standby: 0, inUse: 0, maintenance: 0, taxDue90Days: 0 };
  const taxAlerts = stats?.taxAlerts || [];

  // Group vehicle count by department (สังกัด/กอง)
  const deptCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach((v) => {
      const dept = v.department || 'ไม่ระบุ';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return counts;
  }, [vehicles]);

  // Tax Due Vehicles within 90 days
  const taxAlertVehicles = React.useMemo(() => {
    if (taxAlerts && taxAlerts.length > 0) {
      return taxAlerts;
    }
    const today = new Date('2026-09-15');
    const limit90 = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    return vehicles.filter(v => {
      if (!v.tax_due_date) return false;
      const d = new Date(v.tax_due_date);
      return d >= today && d <= limit90;
    });
  }, [taxAlerts, vehicles]);

  // Group tax due vehicle count by department (สังกัด/กอง)
  const taxDueDeptCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    taxAlertVehicles.forEach((v) => {
      const dept = v.department || 'ไม่ระบุ';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return counts;
  }, [taxAlertVehicles]);

  const [pn1Reports, setPn1Reports] = React.useState<Pn1Report[]>([]);

  React.useEffect(() => {
    fetchPn1Reports('2026-09')
      .then(res => setPn1Reports(res))
      .catch(err => console.error('Failed to load pn1 reports for dashboard:', err));
  }, []);

  // Calculate average UR Rate per department from PN1 reports
  const deptUrRates = React.useMemo(() => {
    if (pn1Reports && pn1Reports.length > 0) {
      const deptSums: Record<string, { sum: number; count: number }> = {};
      pn1Reports.forEach(r => {
        const dept = r.department || 'ไม่ระบุ';
        if (!deptSums[dept]) {
          deptSums[dept] = { sum: 0, count: 0 };
        }
        deptSums[dept].sum += (r.ur_rate || 0);
        deptSums[dept].count += 1;
      });

      const res: Record<string, number> = {};
      Object.keys(deptSums).forEach(dept => {
        const count = deptSums[dept].count;
        res[dept] = count > 0 ? Number((deptSums[dept].sum / count).toFixed(1)) : 0.0;
      });
      return res;
    }

    // Default when no reports loaded yet
    const counts: Record<string, number> = {};
    vehicles.forEach(v => {
      const dept = v.department || 'ไม่ระบุ';
      counts[dept] = 0.0;
    });
    return counts;
  }, [pn1Reports, vehicles]);

  // Overall average UR rate
  const overallUrRate = React.useMemo(() => {
    const values = Object.values(deptUrRates);
    if (values.length === 0) return '0.0%';
    const sum = values.reduce((a, b) => a + b, 0);
    return `${(sum / values.length).toFixed(1)}%`;
  }, [deptUrRates]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-brand-secondary">Dashboard</h2>
        <p className="text-sm text-brand-textMuted mt-0.5">
          ภาพรวมสถานะยานพาหนะ เครื่องจักรกล และการแจ้งเตือนภาษีประจำปี (สังกัด อหก.)
        </p>
      </div>

      {/* Metric Cards Container - Rearranged Layout */}
      <div className="space-y-4">
        {/* Top Section: 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Column 1: Card จำนวนยานพาหนะทั้งหมด */}
          <div className="flex flex-col h-full">
            <MetricCard
              title="จำนวนยานพาหนะทั้งหมด"
              value={metrics.total}
              icon={Car}
              description="รวมทุกกองในสายงาน อหก."
              accentColor="text-blue-600"
              className="h-full"
            >
              <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                    จำนวนรถแยกตามสังกัด / กอง
                  </span>
                  <span className="text-[11px] font-bold text-brand-primary bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    คลิกเพื่อกรอง
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Object.entries(deptCounts).map(([dept, count]) => (
                    <button
                      key={dept}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectDepartmentFilter) {
                          onSelectDepartmentFilter(dept, false);
                        }
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-brand-primary text-slate-800 hover:text-white transition-all border border-slate-200 hover:border-brand-primary shadow-xs hover:shadow-md group cursor-pointer"
                      title={`คลิกเพื่อดูรายการรถสังกัด ${dept}`}
                    >
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary group-hover:bg-white transition-colors" />
                        <span className="text-xs font-extrabold text-slate-800 group-hover:text-white">
                          {dept}
                        </span>
                      </div>
                      <span className="bg-brand-secondary text-white group-hover:bg-white group-hover:text-brand-primary px-1.5 py-0.5 rounded-md text-[11px] font-black transition-colors shadow-2xs">
                        {count} คัน
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </MetricCard>
          </div>

          {/* Column 2: Top : Card พร้อมใช้งาน | Bottom : Card กำลังถูกใช้งาน */}
          <div className="flex flex-col gap-4 justify-between h-full">
            <MetricCard
              title="พร้อมใช้งาน (จอดรองาน)"
              value={metrics.standby}
              icon={CheckCircle2}
              badgeText="พร้อมเบิก"
              badgeBg="bg-[#FEF3E7] text-[#DC9750] border-[#FCE3C8]"
              accentColor="text-[#DC9750]"
              className="flex-1"
            />
            <MetricCard
              title="กำลังถูกใช้งาน (In Use)"
              value={metrics.inUse}
              icon={Clock}
              badgeText="อยู่ในภารกิจ"
              badgeBg="bg-emerald-100 text-emerald-700 border-emerald-200"
              accentColor="text-emerald-600"
              className="flex-1"
            />
          </div>

          {/* Column 3: Card Monthly UR Rate */}
          <div className="flex flex-col h-full">
            <MetricCard
              title="Monthly UR Rate"
              value={overallUrRate}
              icon={TrendingUp}
              description="ค่าเฉลี่ยอัตราการใช้งานยานพาหนะ"
              badgeText="ประจำเดือน"
              badgeBg="bg-emerald-100 text-emerald-700 border-emerald-200"
              accentColor="text-emerald-600"
              className="h-full"
            >
              <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                    ค่าเฉลี่ย UR Rate แยกตามกอง
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    อัตราใช้งาน
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Object.entries(deptUrRates).map(([dept, rate]) => (
                    <div
                      key={dept}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 text-slate-800 border border-emerald-200 shadow-xs"
                    >
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-extrabold text-slate-800">
                          {dept}
                        </span>
                      </div>
                      <span className="bg-emerald-600 text-white px-1.5 py-0.5 rounded-md text-[11px] font-black shadow-2xs">
                        {rate.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </MetricCard>
          </div>
        </div>

        {/* Bottom Section: Card ภาษีใกล้ครบกำหนด 3 เดือน */}
        <div>
          <MetricCard
            title="ภาษีใกล้ครบกำหนด 3 เดือน"
            value={metrics.taxDue90Days}
            icon={AlertTriangle}
            description="รวมทุกกองในสายงาน อหก."
            badgeText="เตือนล่วงหน้า 90 วัน"
            badgeBg="bg-rose-100 text-rose-700 border-rose-200"
            accentColor="text-rose-600"
          >
            <div className="mt-4 pt-3 border-t border-rose-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                  ภาษีใกล้หมดอายุแยกตามกอง
                </span>
                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  คลิกที่กองเพื่อกรองรถภาษีใกล้หมด
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {Object.entries(taxDueDeptCounts).map(([dept, count]) => (
                  <button
                    key={dept}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectDepartmentFilter) {
                        onSelectDepartmentFilter(dept, true);
                      }
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 hover:bg-rose-600 text-slate-800 hover:text-white transition-all border border-rose-200 hover:border-rose-600 shadow-xs hover:shadow-md group cursor-pointer"
                    title={`คลิกเพื่อดูรถสังกัด ${dept} ที่ภาษีใกล้หมดอายุ`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2 h-2 rounded-full bg-rose-500 group-hover:bg-white transition-colors" />
                      <span className="text-xs font-extrabold text-slate-800 group-hover:text-white">
                        {dept}
                      </span>
                    </div>
                    <span className="bg-rose-600 text-white group-hover:bg-white group-hover:text-rose-700 px-2 py-0.5 rounded-md text-xs font-black transition-colors shadow-2xs">
                      {count} คัน
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </MetricCard>
        </div>
      </div>

      {/* Tax Alert Banner (Warm Amber #FEF3E7) */}
      <TaxAlertBanner vehicles={taxAlerts} onSelectVehicle={onSelectVehicle} />

      {/* Quick Vehicle Table */}
      <div className="bg-brand-surface rounded-xl border border-brand-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-brand-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-brand-secondary">รายการยานพาหนะล่าสุด</h3>
            <p className="text-xs text-brand-textMuted mt-0.5">คลิกที่แถวเพื่อเปิด Side Drawer ดูรายละเอียดเชิงลึก</p>
          </div>
          <button
            onClick={() => onNavigateToTab('vehicles')}
            className="text-xs font-semibold text-brand-primary hover:underline"
          >
            ดูข้อมูลยานพาหนะทั้งหมด ({vehicles.length}) &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-brand-textMuted text-xs font-semibold uppercase tracking-wider border-b border-brand-border">
                <th className="py-3 px-4">ทะเบียน กฟผ.</th>
                <th className="py-3 px-4">ทะเบียนรถ</th>
                <th className="py-3 px-4">ยี่ห้อ / รุ่น</th>
                <th className="py-3 px-4">สังกัด</th>
                <th className="py-3 px-4">เชื้อเพลิง</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4">ประจำที่</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">กำหนดภาษี</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-sm">
              {vehicles.slice(0, 10).map((v) => (
                <tr
                  key={v.id}
                  onClick={() => onSelectVehicle(v)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-brand-secondary">{v.internal_id}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{v.license_plate}</td>
                  <td className="py-3 px-4 text-slate-600">{v.brand} {v.model}</td>
                  <td className="py-3 px-4 text-xs font-semibold text-brand-secondary">{v.department || 'อหก.'}</td>
                  <td className="py-3 px-4 text-xs font-medium text-slate-700">{v.fuel_type || '-'}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">{v.category}</td>
                  <td className="py-3 px-4 text-xs text-slate-600">{v.base_location}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="py-3 px-4 text-right text-xs font-semibold text-rose-600">
                    {v.tax_due_date || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
