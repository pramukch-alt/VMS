import React from 'react';
import { Bell, Truck, User } from 'lucide-react';

interface NavbarProps {
  taxAlertCount: number;
  onOpenAlerts?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ taxAlertCount, onOpenAlerts }) => {
  return (
    <header className="bg-brand-surface border-b border-brand-border h-16 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Brand & App Title */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-brand-primary flex items-center justify-center text-white shadow-sm">
          <Truck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-brand-secondary leading-tight">
            VMS — EGAT Fleet Management
          </h1>
          <p className="text-xs text-brand-textMuted">
            ระบบบริหารจัดการยานพาหนะและเครื่องจักรกล (สายงาน อหก.)
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-lg text-brand-textMuted hover:text-brand-secondary hover:bg-slate-100 transition-colors"
          title="แจ้งเตือนภาษียานพาหนะ"
        >
          <Bell className="w-5 h-5" />
          {taxAlertCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {taxAlertCount}
            </span>
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-3 border-l border-brand-border pl-4">
          <div className="w-9 h-9 rounded-full bg-brand-secondary text-white flex items-center justify-center font-medium text-sm">
            <User className="w-5 h-5" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-brand-textPrimary leading-none">เจ้าหน้าที่ อหก.</p>
            <p className="text-xs text-brand-textMuted mt-0.5">ฝ่ายการผลิต กฟผ.</p>
          </div>
        </div>
      </div>
    </header>
  );
};
