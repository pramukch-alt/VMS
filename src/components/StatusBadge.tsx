import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  if (status === 'ใช้งาน') {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (status === 'จอดรองาน') {
    // Warm Amber: #FEF3E7 with text #DC9750
    badgeStyle = 'bg-[#FEF3E7] text-[#DC9750] border-[#FCE3C8] font-medium';
  } else if (status === 'รอซ่อม' || status === 'ซ่อม') {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (status === 'ยุบสภาพ' || status === 'รอยุบสภาพ') {
    badgeStyle = 'bg-slate-200 text-slate-600 border-slate-300';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${badgeStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current"></span>
      {status}
    </span>
  );
};
