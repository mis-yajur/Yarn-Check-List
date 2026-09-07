import React, { useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle,
  Download,
  Eye,
  FileCheck2,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { ScheduledTask } from '../../types';

export const DoneTasksPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { scheduledTasks, users, departments, todayStr } = useTasks();

  const [searchQuery, setSearchQuery] = useState('');
  const [doerFilter, setDoerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);

  // Filter completed tasks
  const completedBase = scheduledTasks.filter((s) => s.status.startsWith('completed'));

  const visibleCompleted = isAdmin
    ? completedBase
    : completedBase.filter((s) => s.assignedUserId === currentUser?.id);

  const filtered = visibleCompleted.filter((task) => {
    const matchesSearch =
      task.taskCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.remarks || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDoer = doerFilter === 'all' || task.assignedUserId === doerFilter;
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

    return matchesSearch && matchesDoer && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = [
      'Schedule ID',
      'Task Code',
      'Machine Name',
      'Checklist',
      'Doer Name',
      'Employee ID',
      'Due Date',
      'Completed Date',
      'Completed Time',
      'Classification',
      'Delay Days',
      'Score',
      'Remarks',
      'Observation',
      'Corrective Action',
    ];

    const rows = filtered.map((t) => [
      t.scheduleId,
      t.taskCode,
      `"${t.taskName}"`,
      `"${t.checklistName}"`,
      `"${t.assignedUserName}"`,
      t.assignedEmployeeId,
      t.dueDate,
      t.completedDate || '',
      t.completedTime || '',
      t.completionClassification || '',
      t.delayDays ?? '',
      t.score ?? '',
      `"${(t.remarks || '').replace(/"/g, '""')}"`,
      `"${(t.observation || '').replace(/"/g, '""')}"`,
      `"${(t.correctiveAction || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `YFL_Done_Tasks_${todayStr}.csv`);
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
            {isAdmin ? 'Done Tasks & Maintenance History' : 'My Completed Tasks History'}
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Audit log of verified maintenance tasks, delay tracking, performance scores, and technical findings.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <Download className="h-4 w-4 text-slate-600" />
          Export Done Tasks (CSV)
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search machine, code, remarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="all">All Classifications</option>
            <option value="completed_on_time">Completed On Time</option>
            <option value="completed_early">Completed Early</option>
            <option value="completed_late">Completed Late</option>
          </select>
        </div>

        {isAdmin && (
          <div>
            <select
              value={doerFilter}
              onChange={(e) => setDoerFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="all">All Doers</option>
              {users
                .filter((u) => u.role === 'doer')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.employeeId})
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="p-3">Task ID</th>
                <th className="p-3">Machine Name</th>
                <th className="p-3">Checklist</th>
                <th className="p-3">Doer</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Completed On</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Delay</th>
                <th className="p-3">Score</th>
                <th className="p-3">Remarks</th>
                <th className="p-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-700">
                    No completed tasks found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">{task.taskCode}</td>
                    <td className="p-3 font-bold text-slate-900">{task.taskName}</td>
                    <td className="p-3 text-slate-700">{task.checklistName}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-900">{task.assignedUserName}</span>
                      <span className="block text-[10px] text-slate-700">{task.assignedEmployeeId}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-700">{task.dueDate}</td>
                    <td className="p-3">
                      <span className="font-mono text-slate-900 block font-semibold">{task.completedDate}</span>
                      <span className="text-[10px] text-slate-700">{task.completedTime}</span>
                    </td>
                    <td className="p-3">
                      {task.completionClassification === 'on_time' && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800 border border-green-300">
                          On Time
                        </span>
                      )}
                      {task.completionClassification === 'early' && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                          Early
                        </span>
                      )}
                      {task.completionClassification === 'late' && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800 border border-orange-300">
                          Late (+{task.delayDays}d)
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {task.delayDays === 0 ? (
                        <span className="text-emerald-800 font-semibold">None</span>
                      ) : (
                        <span className="text-orange-700 font-bold">+{task.delayDays} days</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-black text-slate-900 text-sm">{task.score} pts</span>
                    </td>
                    <td className="p-3 max-w-xs truncate text-slate-700">
                      {task.remarks || '—'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        title="View Full Inspection Record"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Inspection Record: {selectedTask.taskName} ({selectedTask.taskCode})
                  </h3>
                  <p className="text-[11px] text-slate-700 font-mono">
                    Schedule ID: {selectedTask.scheduleId}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-700 block text-[10px]">Due Date</span>
                  <span className="font-bold text-slate-900">{selectedTask.dueDate}</span>
                </div>
                <div>
                  <span className="text-slate-700 block text-[10px]">Completed At</span>
                  <span className="font-bold text-slate-900">{selectedTask.completedDate} {selectedTask.completedTime}</span>
                </div>
                <div>
                  <span className="text-slate-700 block text-[10px]">Doer</span>
                  <span className="font-bold text-slate-900">{selectedTask.assignedUserName}</span>
                </div>
                <div>
                  <span className="text-slate-700 block text-[10px]">Score Awarded</span>
                  <span className="font-black text-emerald-800 text-sm">{selectedTask.score} Points</span>
                </div>
              </div>

              {/* Checklist Responses if any */}
              {selectedTask.checklistResponses && selectedTask.checklistResponses.length > 0 && (
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-slate-700 text-[11px] mb-2">
                    Checklist Inspection Findings ({selectedTask.checklistResponses.length} checkpoints)
                  </h4>
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {selectedTask.checklistResponses.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                        <span className="text-slate-800 font-medium">#{idx + 1} {item.label}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'ok'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'not_ok'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observations & Corrective Actions */}
              {selectedTask.observation && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <span className="font-bold text-red-900 block mb-0.5">Abnormal Observation:</span>
                  <p className="text-red-800">{selectedTask.observation}</p>
                </div>
              )}

              {selectedTask.correctiveAction && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <span className="font-bold text-amber-900 block mb-0.5">Corrective Action Taken:</span>
                  <p className="text-amber-800">{selectedTask.correctiveAction}</p>
                </div>
              )}

              <div>
                <span className="font-bold text-slate-700 block mb-0.5">General Remarks:</span>
                <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedTask.remarks || 'No specific remarks entered.'}
                </p>
              </div>

              {selectedTask.evidenceUrls && selectedTask.evidenceUrls.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Attached Evidence / Proof:</span>
                  <div className="flex gap-2">
                    {selectedTask.evidenceUrls.map((url, i) => (
                      <span key={i} className="rounded bg-slate-100 px-2.5 py-1 text-slate-700 font-mono">
                        📎 {url}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
