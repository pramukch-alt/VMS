import React, { useState } from 'react';
import { AlertTriangle, Mail, CheckCircle2, ChevronRight } from 'lucide-react';
import { Vehicle } from '../types';
import { sendTaxAlertEmail } from '../services/api';

interface TaxAlertBannerProps {
  vehicles: Vehicle[];
  onSelectVehicle?: (v: Vehicle) => void;
}

export const TaxAlertBanner: React.FC<TaxAlertBannerProps> = ({ vehicles, onSelectVehicle }) => {
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  if (!vehicles || vehicles.length === 0) return null;

  const handleSendEmail = async () => {
    try {
      setSending(true);
      const res = await sendTaxAlertEmail();
      setSentMessage(res.message);
      setTimeout(() => setSentMessage(null), 5000);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการส่งอีเมล: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#FEF3E7] border border-[#FCE3C8] rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left info */}
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-amber-500/10 text-[#DC9750] rounded-lg shrink-0 mt-0.5">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#1E2640] flex items-center gap-2">
              แจ้งเตือน: ยานพาหนะใกล้ครบกำหนดชำระภาษีภายใน 90 วัน
              <span className="bg-[#DC9750] text-white text-xs px-2 py-0.5 rounded-full">
                {vehicles.length} คัน
              </span>
            </h4>
            <p className="text-sm text-slate-600 mt-1">
              ระบบ Background Worker จะสแกนและส่งอีเมลแจ้งเตือนผู้รับผิดชอบล่วงหน้า คุณสามารถกดปุ่มส่งแจ้งเตือนซ้ำได้ทันที
            </p>
          </div>
        </div>

        {/* Right Action Button */}
        <div className="shrink-0 flex items-center space-x-3">
          {sentMessage ? (
            <div className="flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 text-xs px-3.5 py-2 rounded-lg font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{sentMessage}</span>
            </div>
          ) : (
            <button
              onClick={handleSendEmail}
              disabled={sending}
              className="bg-[#DC9750] hover:bg-[#C8823B] text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-all shadow-sm"
            >
              <Mail className="w-4 h-4" />
              <span>{sending ? 'กำลังส่งอีเมล...' : 'ส่งอีเมลแจ้งเตือนอีกครั้ง'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Vehicle Cards Carousel/Grid */}
      <div className="mt-4 pt-4 border-t border-[#FCE3C8]/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {vehicles.slice(0, 6).map((v) => (
          <div
            key={v.id}
            onClick={() => onSelectVehicle && onSelectVehicle(v)}
            className="bg-white/80 hover:bg-white p-3 rounded-lg border border-amber-200/80 cursor-pointer flex items-center justify-between text-xs transition-all hover:shadow-sm"
          >
            <div>
              <p className="font-bold text-[#1E2640]">{v.internal_id} ({v.license_plate})</p>
              <p className="text-slate-500 mt-0.5">{v.brand} {v.model}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-rose-600">กำหนด: {v.tax_due_date}</p>
              <p className="text-slate-500">{v.tax_amount ? `${v.tax_amount.toLocaleString()} ฿` : 'ยังไม่ระบุยอด'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
