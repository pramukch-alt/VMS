import React from 'react';
import { Vehicle, Pn1Report, Pn1DailyLog } from '../types';

interface VmcForm01PrintViewProps {
  vehicles: Vehicle[];
  reports: Pn1Report[];
  month: string;
}

const THAI_MONTHS = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const VmcForm01PrintView: React.FC<VmcForm01PrintViewProps> = ({
  vehicles,
  reports,
  month
}) => {
  const [yearStr, monthStr] = month.split('-');
  const yearCe = parseInt(yearStr || '2026', 10);
  const monthNum = parseInt(monthStr || '9', 10);
  const yearBe = yearCe + 543;
  const monthNameTh = THAI_MONTHS[monthNum] || monthStr;
  const daysInMonth = new Date(yearCe, monthNum, 0).getDate();

  return (
    <div id="vmc-form-print-container" className="print-only text-black bg-white">
      <style>{`
        @media screen {
          .print-only {
            display: none !important;
          }
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 6mm 6mm 6mm;
          }
          body * {
            visibility: hidden;
          }
          #vmc-form-print-container, #vmc-form-print-container * {
            visibility: visible;
          }
          #vmc-form-print-container {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          .vmc-page {
            page-break-after: always;
            break-after: page;
            height: 284mm;
            max-height: 284mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 2mm;
            overflow: hidden;
          }
          .vmc-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>

      {vehicles.map((vehicle, vIdx) => {
        const report = reports.find(r => r.vehicle_id === vehicle.id && r.month === month);
        const logsMap = new Map<number, Pn1DailyLog>();

        if (report?.daily_logs) {
          report.daily_logs.forEach(l => {
            if (l.date) {
              const day = parseInt(l.date.split('-')[2], 10);
              logsMap.set(day, l);
            }
          });
        }

        // Summary calculations
        let usedDaysCount = 0;
        let repairDaysCount = 0;
        let totalDistance = 0;
        let totalLiters = 0;
        let totalFuelCost = 0;

        for (let d = 1; d <= daysInMonth; d++) {
          const log = logsMap.get(d);
          if (log) {
            const isUsed = log.status_code === '/' || (log.status_code as string) === 'ใช้งาน';
            const isRepair = log.status_code === '0' || (log.status_code as string) === 'ซ่อม';
            if (isUsed) {
              usedDaysCount++;
              const dist = (log.end_mileage || 0) - (log.start_mileage || 0);
              if (dist > 0) totalDistance += dist;
            } else if (isRepair) {
              repairDaysCount++;
            }

            if (log.fuel_liters && log.fuel_liters > 0) {
              totalLiters += log.fuel_liters;
              totalFuelCost += (log.fuel_total_cost || (log.fuel_liters * (log.fuel_price_per_liter || 0)));
            }
          }
        }

        const idleDaysCount = Math.max(0, daysInMonth - usedDaysCount - repairDaysCount);
        const avgKmPerLiter = totalLiters > 0 ? (totalDistance / totalLiters).toFixed(2) : '-';

        return (
          <div key={vehicle.id || vIdx} className="vmc-page font-sans text-[9px] leading-tight select-none">
            <div>
              {/* Header Titles */}
              <div className="text-center space-y-0.5 mb-1.5">
                <h1 className="text-xs font-bold tracking-wide">การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย</h1>
                <h2 className="text-[11px] font-bold">รายละเอียดการใช้ยานพาหนะประจำวัน</h2>
                <h3 className="text-[9.5px] font-medium text-slate-800">
                  ฝ่ายบริหารและก่อสร้างโรงไฟฟ้า (อหก.) {vehicle.department ? `กอง${vehicle.department}` : 'กองเครื่องกลและระบบควบคุม (กคร-พ.)'}
                </h3>
              </div>

              {/* Vehicle & Month Meta Table */}
              <div className="border border-black text-[9px] mb-1">
                <div className="grid grid-cols-12 border-b border-black">
                  <div className="col-span-2 px-1.5 py-0.5 bg-slate-100 font-bold border-r border-black">ทะเบียน กฟผ.</div>
                  <div className="col-span-5 px-1.5 py-0.5 font-bold border-r border-black">{vehicle.internal_id}</div>
                  <div className="col-span-2 px-1.5 py-0.5 bg-slate-100 font-bold border-r border-black">ชนิดน้ำมันเชื้อเพลิง</div>
                  <div className="col-span-3 px-1.5 py-0.5 font-bold">{vehicle.fuel_type || 'ดีเซล'}</div>
                </div>
                <div className="grid grid-cols-12 border-b border-black">
                  <div className="col-span-2 px-1.5 py-0.5 bg-slate-100 font-bold border-r border-black">ทะเบียนขนส่ง</div>
                  <div className="col-span-5 px-1.5 py-0.5 font-bold border-r border-black">{vehicle.license_plate}</div>
                  <div className="col-span-2 px-1.5 py-0.5 bg-slate-100 font-bold border-r border-black">หน่วยงาน</div>
                  <div className="col-span-3 px-1.5 py-0.5 font-bold">{vehicle.department}</div>
                </div>
                <div className="grid grid-cols-12">
                  <div className="col-span-2 px-1.5 py-0.5 bg-slate-100 font-bold border-r border-black">ยี่ห้อและรุ่นของรถ</div>
                  <div className="col-span-5 px-1.5 py-0.5 font-bold border-r border-black">{vehicle.brand} {vehicle.model}</div>
                  <div className="col-span-2 px-1.5 py-0.5 bg-slate-100 font-bold border-r border-black">ประจำเดือน</div>
                  <div className="col-span-3 px-1.5 py-0.5 flex items-center justify-between">
                    <span className="font-bold">{monthNameTh}</span>
                    <span className="font-bold mr-2">พ.ศ. {yearBe}</span>
                  </div>
                </div>
              </div>

              {/* 31-Day Table */}
              <table className="w-full border-collapse border border-black text-[8px] text-center table-fixed">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-black">
                    <th rowSpan={2} className="border-r border-black w-[24px] p-0.5">วันที่</th>
                    <th rowSpan={2} className="border-r border-black w-[40px] p-0.5">สถานะ</th>
                    <th colSpan={3} className="border-r border-black p-0.5">เลขกิโลเมตร</th>
                    <th colSpan={8} className="border-r border-black p-0.5">ตรวจสอบก่อนการใช้งาน</th>
                    <th colSpan={3} className="border-r border-black p-0.5">น้ำมันเชื้อเพลิง</th>
                    <th rowSpan={2} className="border-r border-black w-[48px] p-0.5">หน่วยงาน<br/>ผู้ใช้งาน</th>
                    <th rowSpan={2} className="border-r border-black w-[68px] p-0.5">ชื่อพนักงาน<br/>ขับรถ</th>
                    <th rowSpan={2} className="p-0.5">สถานที่ปฏิบัติงาน</th>
                  </tr>
                  <tr className="bg-slate-50 font-semibold border-b border-black text-[7.5px]">
                    {/* Mileage cols */}
                    <th className="border-r border-black w-[38px] p-0.5">ก่อนออก</th>
                    <th className="border-r border-black w-[38px] p-0.5">เข้าเก็บ</th>
                    <th className="border-r border-black w-[38px] p-0.5">เติมน้ำมัน</th>
                    {/* Checklist cols */}
                    <th className="border-r border-black w-[15px] p-0.5" title="น้ำหล่อเย็น">น้ำ</th>
                    <th className="border-r border-black w-[15px] p-0.5" title="น้ำมันเครื่อง">นมค</th>
                    <th className="border-r border-black w-[15px] p-0.5" title="เบรก">เบรก</th>
                    <th className="border-r border-black w-[15px] p-0.5" title="คลัช">คลัช</th>
                    <th className="border-r border-black w-[15px] p-0.5" title="ยาง">ยาง</th>
                    <th className="border-r border-black w-[15px] p-0.5" title="ไฟสัญญาณ">ไฟ</th>
                    <th className="border-r border-black w-[15px] p-0.5" title="ไฮดรอลิค">ไฮด</th>
                    <th className="border-r border-black w-[15px] p-0.5" title="ตัวรถ">ตัวรถ</th>
                    {/* Fuel cols */}
                    <th className="border-r border-black w-[26px] p-0.5">ลิตร</th>
                    <th className="border-r border-black w-[28px] p-0.5">บ./ล.</th>
                    <th className="border-r border-black w-[34px] p-0.5">รวม(บ.)</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                    const isOutOfMonth = day > daysInMonth;
                    const log = logsMap.get(day);

                    let status = 'ว่างงาน';
                    let isUsed = false;
                    let isRepair = false;

                    if (log) {
                      if (log.status_code === '/' || (log.status_code as string) === 'ใช้งาน') {
                        status = 'ใช้งาน';
                        isUsed = true;
                      } else if (log.status_code === '0' || (log.status_code as string) === 'ซ่อม') {
                        status = 'ซ่อม';
                        isRepair = true;
                      }
                    }

                    return (
                      <tr 
                        key={day} 
                        className={`border-b border-slate-300 h-[5.6mm] max-h-[5.6mm] leading-none ${
                          isOutOfMonth ? 'bg-slate-100 text-slate-400' : isUsed ? 'bg-emerald-50/40' : isRepair ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="border-r border-black font-bold">{day}</td>
                        <td className={`border-r border-black font-medium ${isUsed ? 'text-emerald-800 font-bold' : isRepair ? 'text-amber-800 font-bold' : 'text-slate-500'}`}>
                          {isOutOfMonth ? '-' : status}
                        </td>
                        
                        {/* Mileage */}
                        <td className="border-r border-black text-right pr-1">
                          {!isOutOfMonth && log?.start_mileage ? log.start_mileage.toLocaleString() : ''}
                        </td>
                        <td className="border-r border-black text-right pr-1">
                          {!isOutOfMonth && log?.end_mileage ? log.end_mileage.toLocaleString() : ''}
                        </td>
                        <td className="border-r border-black text-right pr-1">
                          {!isOutOfMonth && log?.fuel_mileage ? log.fuel_mileage.toLocaleString() : ''}
                        </td>

                        {/* 8 Checklists */}
                        <td className="border-r border-black">{!isOutOfMonth && log?.checklist?.coolant ? '✓' : ''}</td>
                        <td className="border-r border-black">{!isOutOfMonth && log?.checklist?.engine_oil ? '✓' : ''}</td>
                        <td className="border-r border-black">{!isOutOfMonth && log?.checklist?.brake ? '✓' : ''}</td>
                        <td className="border-r border-black">{!isOutOfMonth && log?.checklist?.clutch ? '✓' : ''}</td>
                        <td className="border-r border-black">{!isOutOfMonth && log?.checklist?.tire ? '✓' : ''}</td>
                        <td className="border-r border-black">{!isOutOfMonth && log?.checklist?.signal_light ? '✓' : ''}</td>
                        <td className="border-r border-black">{!isOutOfMonth && log?.checklist?.hydraulic ? '✓' : ''}</td>
                        <td className="border-r border-black">{!isOutOfMonth && log?.checklist?.vehicle_body ? '✓' : ''}</td>

                        {/* Fuel */}
                        <td className="border-r border-black text-right pr-0.5">
                          {!isOutOfMonth && log?.fuel_liters ? log.fuel_liters.toFixed(1) : ''}
                        </td>
                        <td className="border-r border-black text-right pr-0.5">
                          {!isOutOfMonth && log?.fuel_price_per_liter ? log.fuel_price_per_liter.toFixed(2) : ''}
                        </td>
                        <td className="border-r border-black text-right pr-0.5 font-medium">
                          {!isOutOfMonth && (log?.fuel_total_cost || (log?.fuel_liters && log?.fuel_price_per_liter)) 
                            ? ((log.fuel_total_cost || log.fuel_liters! * log.fuel_price_per_liter!)).toLocaleString() 
                            : ''}
                        </td>

                        {/* Dept, Driver, Destination */}
                        <td className="border-r border-black truncate px-0.5 text-left">
                          {!isOutOfMonth && (log?.department || (isUsed ? vehicle.department : ''))}
                        </td>
                        <td className="border-r border-black truncate px-0.5 text-left">
                          {!isOutOfMonth && (log?.driver_name || '')}
                        </td>
                        <td className="truncate px-0.5 text-left">
                          {!isOutOfMonth && (log?.destination || '')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Summary (Matching rows 44-49 in VMC Form 01) */}
            <div className="mt-1 space-y-1">
              <div className="border border-black text-[8px]">
                <div className="grid grid-cols-12 border-b border-black bg-slate-50">
                  <div className="col-span-2 px-1 py-0.5 border-r border-black">วันทำการเดือนนี้ (วัน)</div>
                  <div className="col-span-1 px-1 py-0.5 font-bold text-center border-r border-black">{daysInMonth}</div>
                  <div className="col-span-2 px-1 py-0.5 border-r border-black">ระยะทางรวม (กม.)</div>
                  <div className="col-span-2 px-1 py-0.5 font-bold text-center border-r border-black">{totalDistance.toLocaleString()}</div>
                  <div className="col-span-2 px-1 py-0.5 border-r border-black">เชื้อเพลิงรวม (ลิตร)</div>
                  <div className="col-span-3 px-1 py-0.5 font-bold text-center">{totalLiters.toFixed(1)}</div>
                </div>

                <div className="grid grid-cols-12 border-b border-black">
                  <div className="col-span-2 px-1 py-0.5 border-r border-black">ใช้งาน (วัน)</div>
                  <div className="col-span-1 px-1 py-0.5 font-bold text-center border-r border-black text-emerald-800">{usedDaysCount}</div>
                  <div className="col-span-2 px-1 py-0.5 border-r border-black">ระยะทางช่วงใช้งาน (กม.)</div>
                  <div className="col-span-2 px-1 py-0.5 font-bold text-center border-r border-black">{totalDistance.toLocaleString()}</div>
                  <div className="col-span-2 px-1 py-0.5 border-r border-black">ค่าเชื้อเพลิงรวม (บาท)</div>
                  <div className="col-span-3 px-1 py-0.5 font-bold text-center">{totalFuelCost.toLocaleString()}</div>
                </div>

                <div className="grid grid-cols-12 border-b border-black bg-slate-50">
                  <div className="col-span-2 px-1 py-0.5 border-r border-black">ว่างงาน (วัน)</div>
                  <div className="col-span-1 px-1 py-0.5 font-bold text-center border-r border-black text-slate-600">{idleDaysCount}</div>
                  <div className="col-span-2 px-1 py-0.5 border-r border-black">สิ้นเปลืองเฉลี่ย (กม./ลิตร)</div>
                  <div className="col-span-2 px-1 py-0.5 font-bold text-center border-r border-black">{avgKmPerLiter}</div>
                  <div className="col-span-2 px-1 py-0.5 border-r border-black">บันทึกสถานะแล้ว (วัน)</div>
                  <div className="col-span-3 px-1 py-0.5 font-bold text-center">{daysInMonth}</div>
                </div>

                <div className="grid grid-cols-12">
                  <div className="col-span-2 px-1 py-0.5 border-r border-black">ซ่อม (วัน)</div>
                  <div className="col-span-1 px-1 py-0.5 font-bold text-center border-r border-black text-amber-800">{repairDaysCount}</div>
                  <div className="col-span-9 px-1 py-0.5 text-slate-500 italic">
                    หมายเหตุ: เติมน้ำมันให้เต็มถังทุกครั้ง และตรวจสภาพรถยนต์ก่อนออกปฏิบัติภารกิจ
                  </div>
                </div>
              </div>

              {/* Signatures Row */}
              <div className="flex justify-between items-end px-6 pt-1 text-[8.5px]">
                <div className="text-center space-y-3">
                  <div>ลงชื่อ ................................................................ ผู้ขับขี่/ผู้รายงาน</div>
                  <div>(................................................................)</div>
                  <div>ตำแหน่ง ................................................................</div>
                </div>
                <div className="text-center space-y-3">
                  <div>ลงชื่อ ................................................................ ผู้ควบคุมรถ / หัวหน้างาน</div>
                  <div>(................................................................)</div>
                  <div>ตำแหน่ง ................................................................</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
