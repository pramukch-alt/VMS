import React, { useState, useEffect } from 'react';
import { Fuel, Plus, DollarSign, Droplet, TrendingUp } from 'lucide-react';
import { FuelLog } from '../types';
import { fetchFuelLogs } from '../services/api';
import { MetricCard } from '../components/MetricCard';

interface FuelLogsPageProps {
  onOpenNewFuelLog: () => void;
}

export const FuelLogsPage: React.FC<FuelLogsPageProps> = ({ onOpenNewFuelLog }) => {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [summary, setSummary] = useState({ totalLiters: 0, totalAmount: 0, avgCostPerLiter: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    fetchFuelLogs()
      .then(res => {
        setLogs(res.logs);
        setSummary(res.summary);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-secondary">บันทึกการใช้เชื้อเพลิง</h2>
          <p className="text-sm text-brand-textMuted mt-0.5">
            บันทึกปริมาณการเติมน้ำมัน ยอดเงิน เลขไมล์ขณะเติม และติดตามอัตราสิ้นเปลือง
          </p>
        </div>
        <button
          onClick={onOpenNewFuelLog}
          className="bg-brand-primary hover:bg-brand-primaryHover text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>บันทึกการเติมน้ำมัน</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="ปริมาณเชื้อเพลิงสะสม"
          value={`${summary.totalLiters.toLocaleString()} ลิตร`}
          icon={Droplet}
          accentColor="text-blue-600"
        />
        <MetricCard
          title="ค่าใช้จ่ายเชื้อเพลิงรวม"
          value={`${summary.totalAmount.toLocaleString()} ฿`}
          icon={DollarSign}
          accentColor="text-emerald-600"
        />
        <MetricCard
          title="ราคาเฉลี่ยต่อลิตร"
          value={`${summary.avgCostPerLiter} ฿/ลิตร`}
          icon={TrendingUp}
          accentColor="text-brand-primary"
        />
      </div>

      {/* Fuel Logs Table */}
      <div className="bg-brand-surface rounded-xl border border-brand-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-brand-border">
          <h3 className="text-base font-bold text-brand-secondary">ประวัติการบันทึกการเติมเชื้อเพลิง</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-brand-textMuted text-xs font-semibold uppercase tracking-wider border-b border-brand-border">
                <th className="py-3 px-4">วันเวลาที่เติม</th>
                <th className="py-3 px-4">ทะเบียน กฟผ.</th>
                <th className="py-3 px-4">ทะเบียนรถ</th>
                <th className="py-3 px-4">เลขไมล์ขณะเติม</th>
                <th className="py-3 px-4 text-right">ปริมาณ (ลิตร)</th>
                <th className="py-3 px-4 text-right">ยอดเงินรวม (บาท)</th>
                <th className="py-3 px-4">เลขที่ใบเสร็จ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">ไม่พบประวัติการเติมน้ำมัน</td>
                </tr>
              ) : (
                logs.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-700">{f.refuel_date}</td>
                    <td className="py-3.5 px-4 font-bold text-brand-secondary">{f.internal_id}</td>
                    <td className="py-3.5 px-4 text-slate-800">{f.license_plate}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                      {f.odometer.toLocaleString()} km
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-brand-primary text-xs">
                      {f.liters} ลิตร
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700 text-xs">
                      {f.total_amount.toLocaleString()} ฿
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                      {f.receipt_no || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
