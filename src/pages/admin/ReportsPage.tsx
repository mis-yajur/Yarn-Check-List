import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Printer,
  TrendingUp,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { calculateScorecard } from '../../services/scoringEngine';

export const ReportsPage: React.FC = () => {
  const { scheduledTasks, taskMasters, users, todayStr } = useTasks();
  const [selectedMonth, setSelectedMonth] = useState('2026-09');

  // Month-filtered tasks
  const monthTasks = scheduledTasks.filter((s) => s.dueDate.startsWith(selectedMonth));
  const completedMonthTasks = monthTasks.filter((s) => s.status.startsWith('completed'));
  const overdueMonthTasks = monthTasks.filter((s) => s.status === 'overdue');
  const onTimeMonthTasks = monthTasks.filter((s) => s.status === 'completed_on_time' || s.status === 'completed_early');

  const onTimePercentage = completedMonthTasks.length > 0
    ? Math.round((onTimeMonthTasks.length / completedMonthTasks.length) * 100)
    : 100;

  const totalDelays = completedMonthTasks.reduce((acc, curr) => acc + (curr.delayDays || 0), 0);
  const avgDelay = completedMonthTasks.length > 0 ? (totalDelays / completedMonthTasks.length).toFixed(1) : '0.0';

  const avgScore = completedMonthTasks.length > 0
    ? Math.round(completedMonthTasks.reduce((acc, curr) => acc + (curr.score || 0), 0) / completedMonthTasks.length)
    : 100;

  const handleExportFullReport = () => {
    const headers = [
      'Report Month',
      'Task Code',
      'Machine Name',
      'Checklist',
      'Technician',
      'Employee ID',
      'Due Date',
      'Completed Date',
      'Status',
      'Delay Days',
      'Score Points',
      'Remarks',
      'Observations',
    ];

    const rows = monthTasks.map((t) => [
      selectedMonth,
      t.taskCode,
      `"${t.taskName}"`,
      `"${t.checklistName}"`,
      `"${t.assignedUserName}"`,
      t.assignedEmployeeId,
      t.dueDate,
      t.completedDate || '',
      t.status,
      t.delayDays ?? '',
      t.score ?? '',
      `"${(t.remarks || '').replace(/"/g, '""')}"`,
      `"${(t.observation || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `YFL_Monthly_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Monthly Reports &amp; Compliance Audit
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Comprehensive audit reports for plant engineering, preventive maintenance compliance, and equipment reliability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <option value="2026-09">September 2026</option>
            <option value="2026-10">October 2026</option>
            <option value="2026-11">November 2026</option>
            <option value="2026-12">December 2026</option>
          </select>

          <button
            onClick={handleExportFullReport}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download Full Monthly Report (CSV)
          </button>
        </div>
      </div>

      {/* Month KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-700 block">Total Scheduled Tasks</span>
          <p className="mt-1 text-2xl font-black text-slate-900">{monthTasks.length}</p>
          <span className="text-[10px] text-slate-700">{selectedMonth}</span>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-900 block">On-Time Compliance</span>
          <p className="mt-1 text-2xl font-black text-emerald-900">{onTimePercentage}%</p>
          <span className="text-[10px] text-emerald-900 font-semibold">{onTimeMonthTasks.length} on-time of {completedMonthTasks.length} completed</span>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
          <span className="text-[11px] font-bold text-amber-900 block">Average Delay</span>
          <p className="mt-1 text-2xl font-black text-amber-900">{avgDelay} Days</p>
          <span className="text-[10px] text-amber-900 font-semibold">Across all completed</span>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 shadow-xs">
          <span className="text-[11px] font-bold text-blue-900 block">Division Quality Score</span>
          <p className="mt-1 text-2xl font-black text-blue-900">{avgScore} Pts</p>
          <span className="text-[10px] text-blue-900 font-semibold">Target: &gt;90 Pts (Excellent)</span>
        </div>
      </div>

      {/* Machine Breakdown Performance Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">
            Machine-wise Preventive Maintenance Status ({selectedMonth})
          </h2>
          <span className="text-xs text-slate-700">33 Equipment Units</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="p-3">Task ID</th>
                <th className="p-3">Machine Name</th>
                <th className="p-3">Assigned Doer</th>
                <th className="p-3">Scheduled in Month</th>
                <th className="p-3">Completed</th>
                <th className="p-3">On-Time %</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taskMasters.map((tm) => {
                const tmTasks = monthTasks.filter((s) => s.taskMasterId === tm.id);
                const tmCompleted = tmTasks.filter((s) => s.status.startsWith('completed'));
                const tmOnTime = tmTasks.filter((s) => s.status === 'completed_on_time' || s.status === 'completed_early');
                const rate = tmCompleted.length > 0 ? Math.round((tmOnTime.length / tmCompleted.length) * 100) : 100;

                return (
                  <tr key={tm.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">{tm.taskCode}</td>
                    <td className="p-3 font-bold text-slate-900">{tm.taskName}</td>
                    <td className="p-3 text-slate-700">{tm.assignedUserName}</td>
                    <td className="p-3 font-semibold text-slate-900">{tmTasks.length} cycles</td>
                    <td className="p-3 text-emerald-800 font-bold">{tmCompleted.length}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{rate}%</td>
                    <td className="p-3">
                      {tmCompleted.length === tmTasks.length && tmTasks.length > 0 ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          100% Up to Date
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                          Scheduled Active
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
