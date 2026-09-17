import React from 'react';
import { Users, UserPlus } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-brand-secondary">User Management</h2>
            <span className="text-xs bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded font-bold">
              Mockup Module
            </span>
          </div>
          <p className="text-sm text-brand-textMuted mt-0.5">
            ระบบจัดการสิทธิ์ผู้ใช้งาน สมาชิกในองค์กร และการยืนยันตัวตน (Authentication & Permissions)
          </p>
        </div>

        <button
          onClick={() => alert('จำลองการเปิดฟอร์มเพิ่มผู้ใช้งานใหม่')}
          className="bg-brand-primary hover:bg-brand-primaryHover text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>เพิ่มผู้ใช้งานใหม่</span>
        </button>
      </div>

      {/* Mockup Container */}
      <div className="bg-brand-surface rounded-xl border border-brand-border p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-blue-50 text-brand-secondary rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
          <Users className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-bold text-brand-secondary">ระบบจัดการผู้ใช้งาน (Mockup)</h3>
          <p className="text-xs text-brand-textMuted mt-1 leading-relaxed">
            ตำแหน่งสำหรับรองรับการเชื่อมต่อระบบจัดการผู้ใช้ (User Management, Role-Based Access Control, Single Sign-On EGAT) ในเฟสถัดไป
          </p>
        </div>

        {/* Mock Users Table Preview */}
        <div className="pt-6 border-t border-slate-200 text-left space-y-4 w-full">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <span className="font-bold text-slate-700">ตัวอย่างผู้ใช้งานในระบบ (Sample Users)</span>
            <span className="text-slate-500">สิทธิ์ทั้งหมด: 3 ระดับ</span>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="p-3">ชื่อ-นามสกุล</th>
                  <th className="p-3">อีเมล</th>
                  <th className="p-3">แผนก/สังกัด</th>
                  <th className="p-3">สิทธิ์การใช้งาน (Role)</th>
                  <th className="p-3">สถานะบัญชี</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-600">
                <tr>
                  <td className="p-3 font-bold text-slate-800">สมชาย ใจดี</td>
                  <td className="p-3">somchai.j@egat.co.th</td>
                  <td className="p-3">แผนกปฏิบัติการ อหก.</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">Administrator</span></td>
                  <td className="p-3"><span className="text-emerald-600 font-semibold">Active</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-800">วิชัย การช่าง</td>
                  <td className="p-3">wichai.k@egat.co.th</td>
                  <td className="p-3">แผนกบำรุงรักษา อหก.</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">Fleet Staff</span></td>
                  <td className="p-3"><span className="text-emerald-600 font-semibold">Active</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-800">นิภา วงศ์สวัสดิ์</td>
                  <td className="p-3">nipa.w@egat.co.th</td>
                  <td className="p-3">แผนกงานยานพาหนะ อหก.</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">User</span></td>
                  <td className="p-3"><span className="text-emerald-600 font-semibold">Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
