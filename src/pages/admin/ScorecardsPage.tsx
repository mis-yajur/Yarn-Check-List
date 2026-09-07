import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileCheck,
  TrendingDown,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { calculateScorecard, getRatingDetails, SCORING_TABLE } from '../../services/scoringEngine';
import { ScorecardResult } from '../../types';

export const ScorecardsPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { users, scheduledTasks, todayStr } = useTasks();
  const [selectedScorecardUser, setSelectedScorecardUser] = useState<ScorecardResult | null>(null);

  // Calculate scorecards for all doers
  const doerUsers = users.filter((u) => u.role === 'doer');
  const allScorecards: ScorecardResult[] = doerUsers.map((u) => {
    const userTasks = scheduledTasks.filter((s) => s.assignedUserId === u.id);
    return calculateScorecard(userTasks, u.employeeId, u.name, u.departmentName);
  });

  const handleExportCSV = () => {
    const headers = [
      'Employee ID',
      'Name',
      'Department',
      'Total Assigned',
      'Completed Total',
      'On Time',
      'Late',
      'Overdue',
      'On Time Rate %',
      'Average Score',
      'Rating',
    ];

    const rows = allScorecards.map((s) => [
      s.employeeId,
      `"${s.userName}"`,
      `"${s.departmentName}"`,
      s.totalAssigned,
      s.completedTotal,
      s.completedOnTime,
      s.completedLate,
      s.overdueCount,
      `${s.onTimeRate}%`,
      s.averageScore,
      s.rating,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `YFL_Technician_Scorecards_${todayStr}.csv`);
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
            Technician Performance &amp; Scorecards
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Automated compliance scoring: 100 points for on-time completion, -10 pts per day of delay, 0 pts for ≥10 days late or overdue.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <Download className="h-4 w-4 text-slate-600" />
          Export Scorecard CSV
        </button>
      </div>

      {/* Scoring Matrix Reference Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          YFL Delay Penalty &amp; Scoring Matrix
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {SCORING_TABLE.map((tier) => (
            <div
              key={tier.delayDays}
              className={`rounded-lg p-2.5 text-center border ${
                tier.score >= 90
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : tier.score >= 70
                  ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                  : tier.score >= 50
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-red-50/70 border-red-200 text-red-900'
              }`}
            >
              <span className="block text-[11px] font-semibold">{tier.label}</span>
              <span className="block text-lg font-black mt-0.5">{tier.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Technician Scorecard Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="p-3">Technician</th>
                <th className="p-3">Emp ID</th>
                <th className="p-3">Department</th>
                <th className="p-3">Assigned</th>
                <th className="p-3">Completed</th>
                <th className="p-3">On-Time</th>
                <th className="p-3">Late</th>
                <th className="p-3">Overdue</th>
                <th className="p-3">On-Time %</th>
                <th className="p-3">Avg Score</th>
                <th className="p-3">Rating</th>
                <th className="p-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allScorecards.map((sc) => (
                <tr key={sc.employeeId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      {sc.userName.charAt(0)}
                    </div>
                    {sc.userName}
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-700">{sc.employeeId}</td>
                  <td className="p-3 text-slate-700">{sc.departmentName}</td>
                  <td className="p-3 font-semibold text-slate-900">{sc.totalAssigned}</td>
                  <td className="p-3 font-bold text-emerald-800">{sc.completedTotal}</td>
                  <td className="p-3 text-blue-800 font-bold">{sc.completedOnTime}</td>
                  <td className="p-3 text-amber-800 font-bold">{sc.completedLate}</td>
                  <td className="p-3 text-red-800 font-bold">{sc.overdueCount}</td>
                  <td className="p-3 font-mono font-bold text-slate-900">{sc.onTimeRate}%</td>
                  <td className="p-3">
                    <span className="text-base font-black text-slate-900">{sc.averageScore}</span>
                    <span className="text-[10px] text-slate-700 block">/ 100</span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${sc.ratingColor}`}>
                      {sc.rating}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedScorecardUser(sc)}
                      className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      title="Inspect Technician Tasks"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technician Detailed Modal */}
      {selectedScorecardUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Performance Breakdown: {selectedScorecardUser.userName} ({selectedScorecardUser.employeeId})
                </h3>
                <p className="text-xs text-slate-700">{selectedScorecardUser.departmentName}</p>
              </div>
              <button onClick={() => setSelectedScorecardUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-slate-700 text-[10px] block">Average Score</span>
                  <span className="text-2xl font-black text-slate-900">{selectedScorecardUser.averageScore} pts</span>
                  <span className={`inline-block px-2 py-0.2 rounded text-[10px] font-bold mt-1 ${selectedScorecardUser.ratingColor}`}>
                    {selectedScorecardUser.rating}
                  </span>
                </div>
                <div>
                  <span className="text-slate-700 text-[10px] block">On-Time Rate</span>
                  <span className="text-2xl font-black text-emerald-800">{selectedScorecardUser.onTimeRate}%</span>
                  <span className="text-[10px] text-slate-700 block mt-1">Compliance</span>
                </div>
                <div>
                  <span className="text-slate-700 text-[10px] block">Total Verified</span>
                  <span className="text-2xl font-black text-blue-800">{selectedScorecardUser.completedTotal}</span>
                  <span className="text-[10px] text-slate-700 block mt-1">tasks</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2">Completed Tasks History</h4>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {scheduledTasks
                    .filter((s) => s.assignedEmployeeId === selectedScorecardUser.employeeId && s.completedAt)
                    .map((t) => (
                      <div key={t.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{t.taskName} ({t.taskCode})</p>
                          <p className="text-[11px] text-slate-700">
                            Due: {t.dueDate} • Completed: {t.completedDate} ({t.delayDays === 0 ? 'On Time' : `+${t.delayDays}d late`})
                          </p>
                        </div>
                        <span className="font-black text-slate-900 text-sm">{t.score} pts</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedScorecardUser(null)}
                className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
