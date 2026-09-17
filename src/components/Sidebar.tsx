import React from 'react';
import { LayoutDashboard, Car, FileText, Fuel, Wrench, FileSpreadsheet, Users, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  interface MenuItem {
    id: string;
    label: string;
    icon: any;
    isMock?: boolean;
  }

  const mainMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', label: 'ข้อมูลยานพาหนะ', icon: Car },
    { id: 'work-orders', label: 'ใบงานใช้รถ', icon: FileText },
    { id: 'fuel-logs', label: 'บันทึกการใช้เชื้อเพลิง', icon: Fuel },
    { id: 'maintenance', label: 'งานซ่อมบำรุง', icon: Wrench },
    { id: 'pn1-report', label: 'รายงาน พน.1', icon: FileSpreadsheet },
  ];

  const adminMenuItems = [
    { id: 'user-management', label: 'User management', icon: Users, isMock: true },
  ];

  const handleLogoutMock = () => {
    alert('ระบบจำลองการออกจากระบบ (Logout Mockup) — สำหรับเชื่อมต่อกับระบบ User Management ในอนาคต');
  };

  return (
    <aside className="w-64 bg-brand-secondary text-white flex flex-col justify-between shrink-0 shadow-lg sticky top-0 h-screen overflow-y-auto">
      <div className="p-4 space-y-5">
        {/* Brand/System Logo Header in Sidebar */}
        <div className="pt-2 pb-1 px-2">
          <h2 className="text-base font-bold text-white tracking-wide">
            VMS Fleet System
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            สายงาน อหก. กฟผ.
          </p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            เมนูหลัก
          </p>
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-slate-300 hover:bg-brand-secondaryLight hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.isMock && (
                  <span className="text-[9px] bg-slate-700/80 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                    Mockup
                  </span>
                )}
              </button>
            );
          })}

          {/* Divider Line */}
          <div className="pt-3 pb-2">
            <div className="border-t border-slate-700/70"></div>
          </div>

          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            ตั้งค่าระบบ
          </p>
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-slate-300 hover:bg-brand-secondaryLight hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.isMock && (
                  <span className="text-[9px] bg-slate-700/80 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                    Mockup
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Logout Zone */}
      <div className="p-4 space-y-3">
        {/* Text above the divider line */}
        <div className="text-[11px] text-slate-400 px-1">
          <p className="font-semibold text-slate-300">VMS Management v1.0</p>
          <p className="text-[10px] text-slate-400 mt-0.5">รองรับระบบ User Management ในอนาคต</p>
        </div>

        {/* Divider Line & Logout Button Zone */}
        <div className="border-t border-slate-700/60 pt-3">
          <button
            onClick={handleLogoutMock}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-rose-300 hover:text-white hover:bg-rose-600/20 border border-rose-500/30 hover:border-rose-500/60 transition-all group"
          >
            <div className="flex items-center space-x-2.5">
              <LogOut className="w-4 h-4 text-rose-400 group-hover:text-rose-300 transition-colors" />
              <span>ออกจากระบบ</span>
            </div>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono">
              Mockup
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};
