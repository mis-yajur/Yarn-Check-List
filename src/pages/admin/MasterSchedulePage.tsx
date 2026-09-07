import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  Filter,
  LayoutGrid,
  List,
  Search,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { ScheduledTask, ScheduleStatus } from '../../types';

interface MasterSchedulePageProps {
  initialFilter?: string;
  title?: string;
  subtitle?: string;
}

export const MasterSchedulePage: React.FC<MasterSchedulePageProps> = ({
  initialFilter = 'all',
  title,
  subtitle,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const { scheduledTasks, departments, users, adminCorrectCompletion, todayStr } = useTasks();

  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [doerFilter, setDoerFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<ScheduledTask | null>(null);

  // Sync if initialFilter prop changes
  React.useEffect(() => {
    setStatusFilter(initialFilter);
  }, [initialFilter]);

  // Admin correction modal state
  const [correctionModalTask, setCorrectionModalTask] = useState<ScheduledTask | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionStatus, setCorrectionStatus] = useState<ScheduleStatus>('completed_on_time');
  const [correctionScore, setCorrectionScore] = useState<number>(100);

  // Filter tasks: if doer, restricted to their own tasks unless admin
  const baseTasks = isAdmin
    ? scheduledTasks
    : scheduledTasks.filter((s) => s.assignedUserId === currentUser?.id);

  const filteredTasks = baseTasks.filter((task) => {
    const matchesSearch =
      task.taskCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.checklistName.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'due_today') {
      matchesStatus = task.status === 'due_today' || task.dueDate === todayStr;
    } else if (statusFilter === 'upcoming') {
      matchesStatus =
        (task.status === 'available' || task.status === 'future' || task.status === 'due_today') &&
        task.dueDate >= todayStr;
    } else if (statusFilter === 'overdue') {
      matchesStatus = task.status === 'overdue' || (task.dueDate < todayStr && !task.status.startsWith('completed'));
    } else if (statusFilter === 'done' || statusFilter === 'completed') {
      matchesStatus = task.status.startsWith('completed');
    } else {
      matchesStatus = task.status === statusFilter;
    }

    const matchesDoer = doerFilter === 'all' || task.assignedUserId === doerFilter;
    const matchesMonth = monthFilter === 'all' || task.dueDate.startsWith(monthFilter);

    return matchesSearch && matchesStatus && matchesDoer && matchesMonth;
  });

  const getStatusBadge = (status: ScheduleStatus) => {
    switch (status) {
      case 'completed_on_time':
        return <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold text-green-800 border border-green-300">Completed On Time</span>;
      case 'completed_early':
        return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">Completed Early</span>;
      case 'completed_late':
        return <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-orange-800 border border-orange-300">Completed Late</span>;
      case 'due_today':
        return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-300 animate-pulse">Due Today</span>;
      case 'available':
        return <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-[10px] font-bold text-cyan-800 border border-cyan-300">Available (Next 5D)</span>;
      case 'overdue':
        return <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-800 border border-red-300">Overdue</span>;
      case 'cancelled':
        return <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">Cancelled</span>;
      case 'future':
      default:
        return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">Future Scheduled</span>;
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Schedule ID',
      'Task Code',
      'Machine Name',
      'Checklist',
      'Assigned Doer',
      'Department',
      'Due Date',
      'Status',
      'Completed Date',
      'Completed Time',
      'Delay Days',
      'Score',
      'Remarks',
    ];

    const rows = filteredTasks.map((t) => [
      t.scheduleId,
      t.taskCode,
      `"${t.taskName}"`,
      `"${t.checklistName}"`,
      `"${t.assignedUserName}"`,
      `"${t.departmentName}"`,
      t.dueDate,
      t.status,
      t.completedDate || '',
      t.completedTime || '',
      t.delayDays ?? '',
      t.score ?? '',
      `"${(t.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `YFL_Master_Schedule_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenCorrection = (task: ScheduledTask) => {
    setCorrectionModalTask(task);
    setCorrectionStatus(task.status);
    setCorrectionScore(task.score ?? 100);
    setCorrectionReason('');
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionModalTask) return;
    if (!correctionReason.trim()) {
      alert('A valid reason is required for administrative completion correction audit.');
      return;
    }

    adminCorrectCompletion(correctionModalTask.id, {
      reason: correctionReason.trim(),
      newStatus: correctionStatus,
      newScore: Number(correctionScore),
    });

    setCorrectionModalTask(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {title || (isAdmin ? 'Master Schedule Registry' : 'My Schedule View')}
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            {subtitle || 'Full one-year preventive maintenance schedule with real-time status classifications.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-slate-300 p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                viewMode === 'table' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Table View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                viewMode === 'calendar' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Calendar View
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Download className="h-4 w-4 text-slate-600" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Machine, Code, Doer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="due_today">Due Today</option>
            <option value="upcoming">Upcoming &amp; Next Due</option>
            <option value="available">Available (Next 5 Days)</option>
            <option value="overdue">Overdue</option>
            <option value="completed_on_time">Completed On Time</option>
            <option value="completed_early">Completed Early</option>
            <option value="completed_late">Completed Late</option>
            <option value="future">Future Scheduled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Doer Filter (Admin only) */}
        {isAdmin && (
          <div>
            <select
              value={doerFilter}
              onChange={(e) => setDoerFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="all">All Technicians</option>
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

        {/* Month Filter */}
        <div>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="all">All Months (1-Year)</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-10">October 2026</option>
            <option value="2026-11">November 2026</option>
            <option value="2026-12">December 2026</option>
            <option value="2027-01">January 2027</option>
            <option value="2027-02">February 2027</option>
            <option value="2027-03">March 2027</option>
            <option value="2027-04">April 2027</option>
            <option value="2027-05">May 2027</option>
            <option value="2027-06">June 2027</option>
            <option value="2027-07">July 2027</option>
            <option value="2027-08">August 2027</option>
            <option value="2027-09">September 2027</option>
          </select>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Schedule ID</th>
                  <th className="p-3">Task / Machine</th>
                  <th className="p-3">Checklist</th>
                  <th className="p-3">Doer</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Completed At</th>
                  <th className="p-3">Delay</th>
                  <th className="p-3">Score</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-700">
                      No schedule records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.slice(0, 50).map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-slate-700">{task.scheduleId}</td>
                      <td className="p-3 font-bold text-slate-900">
                        {task.taskName}
                        <span className="block font-mono text-[10px] font-normal text-slate-700">{task.taskCode}</span>
                      </td>
                      <td className="p-3 text-slate-700">{task.checklistName}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900">{task.assignedUserName}</span>
                        <span className="block text-[10px] text-slate-700">{task.assignedEmployeeId}</span>
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-900">{task.dueDate}</td>
                      <td className="p-3">{getStatusBadge(task.status)}</td>
                      <td className="p-3 text-slate-700">
                        {task.completedDate ? (
                          <>
                            <span className="font-mono">{task.completedDate}</span>
                            <span className="block text-[10px] text-slate-700">{task.completedTime}</span>
                          </>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {task.delayDays !== undefined ? (
                          <span className={task.delayDays > 0 ? 'font-bold text-amber-800' : 'text-emerald-800'}>
                            {task.delayDays === 0 ? '0d (On Time)' : `+${task.delayDays}d late`}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {task.score !== undefined ? (
                          <span className="font-extrabold text-slate-900">{task.score} pts</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedTaskDetails(task)}
                            title="View Full Task Record"
                            className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {isAdmin && task.completedAt && (
                            <button
                              onClick={() => handleOpenCorrection(task)}
                              title="Admin Correction"
                              className="rounded p-1.5 text-blue-700 hover:bg-blue-50 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredTasks.length > 50 && (
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs text-slate-700">
              Showing top 50 occurrences of {filteredTasks.length} total. Use search or filter for specific dates.
            </div>
          )}
        </div>
      ) : (
        /* Calendar View (Section 61) */
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              Schedule Calendar — September 2026
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-600" /> Done
              </span>
              <span className="flex items-center gap-1 text-blue-800 font-semibold">
                <span className="h-2 w-2 rounded-full bg-blue-600" /> Today
              </span>
              <span className="flex items-center gap-1 text-red-800 font-semibold">
                <span className="h-2 w-2 rounded-full bg-red-600" /> Overdue
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs text-slate-700 pb-2 border-b border-slate-100">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-2">
            {Array.from({ length: 30 }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `2026-09-${day.toString().padStart(2, '0')}`;
              const dayTasks = filteredTasks.filter((t) => t.dueDate === dateStr);
              const isToday = dateStr === todayStr;

              return (
                <div
                  key={day}
                  className={`min-h-24 rounded-lg border p-1.5 text-left transition-all ${
                    isToday
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${isToday ? 'text-blue-900' : 'text-slate-700'}`}>
                      {day}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="rounded-full bg-slate-200 px-1 py-0.2 text-[9px] font-bold text-slate-700">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 space-y-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTaskDetails(t)}
                        className={`truncate rounded px-1 py-0.5 text-[9px] font-semibold cursor-pointer ${
                          t.status.startsWith('completed')
                            ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                            : t.status === 'due_today'
                            ? 'bg-blue-200 text-blue-900 font-bold'
                            : t.status === 'overdue'
                            ? 'bg-red-100 text-red-900 font-bold'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                        title={`${t.taskCode}: ${t.taskName}`}
                      >
                        {t.taskName}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[9px] text-slate-600 block text-center">
                        +{dayTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTaskDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedTaskDetails.taskCode} • {selectedTaskDetails.taskName}
                </h3>
                <p className="text-[11px] text-slate-700 font-mono">
                  {selectedTaskDetails.scheduleId}
                </p>
              </div>
              <button onClick={() => setSelectedTaskDetails(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-700 block text-[10px]">Due Date</span>
                  <span className="font-bold text-slate-900">{selectedTaskDetails.dueDate}</span>
                </div>
                <div>
                  <span className="text-slate-700 block text-[10px]">Status</span>
                  <div className="mt-0.5">{getStatusBadge(selectedTaskDetails.status)}</div>
                </div>
                <div>
                  <span className="text-slate-700 block text-[10px]">Assigned Doer</span>
                  <span className="font-bold text-slate-900">{selectedTaskDetails.assignedUserName} ({selectedTaskDetails.assignedEmployeeId})</span>
                </div>
                <div>
                  <span className="text-slate-700 block text-[10px]">Frequency Rule</span>
                  <span className="font-bold text-slate-900">{selectedTaskDetails.frequencyDisplay}</span>
                </div>
              </div>

              {selectedTaskDetails.completedAt && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 space-y-2">
                  <div className="flex justify-between items-center font-bold text-emerald-900">
                    <span>Completion Record</span>
                    <span>Score: {selectedTaskDetails.score} pts</span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    <strong>Timestamp:</strong> {selectedTaskDetails.completedDate} at {selectedTaskDetails.completedTime} ({selectedTaskDetails.completionClassification?.toUpperCase()})
                  </p>
                  {selectedTaskDetails.remarks && (
                    <p className="text-[11px] text-slate-700">
                      <strong>Remarks:</strong> {selectedTaskDetails.remarks}
                    </p>
                  )}
                  {selectedTaskDetails.observation && (
                    <p className="text-[11px] text-red-700">
                      <strong>Observation:</strong> {selectedTaskDetails.observation}
                    </p>
                  )}
                  {selectedTaskDetails.correctiveAction && (
                    <p className="text-[11px] text-amber-800">
                      <strong>Corrective Action:</strong> {selectedTaskDetails.correctiveAction}
                    </p>
                  )}
                </div>
              )}

              {selectedTaskDetails.adminCorrection && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">
                  <p className="font-bold">Admin Correction Applied:</p>
                  <p className="mt-0.5">Corrected by {selectedTaskDetails.adminCorrection.correctedByName} on {selectedTaskDetails.adminCorrection.correctedAt.slice(0, 10)}</p>
                  <p className="mt-0.5"><strong>Reason:</strong> {selectedTaskDetails.adminCorrection.reason}</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedTaskDetails(null)}
                className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Correction Modal */}
      {correctionModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900">
              Admin Completion Correction
            </h3>
            <p className="text-xs text-slate-700 mt-1">
              Correcting task record for {correctionModalTask.taskName} ({correctionModalTask.scheduleId}). This action is recorded in the permanent audit log.
            </p>

            <form onSubmit={handleSaveCorrection} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjusted Status
                </label>
                <select
                  value={correctionStatus}
                  onChange={(e) => setCorrectionStatus(e.target.value as ScheduleStatus)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="completed_on_time">Completed On Time (100 pts)</option>
                  <option value="completed_early">Completed Early (100 pts)</option>
                  <option value="completed_late">Completed Late</option>
                  <option value="due_today">Reopen as Due Today</option>
                  <option value="cancelled">Mark Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjusted Score
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={correctionScore}
                  onChange={(e) => setCorrectionScore(Number(e.target.value))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Reason for Correction <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="State the audit justification (e.g. machine maintenance was verified by shift supervisor on scheduled date)..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectionModalTask(null)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
                >
                  Apply Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
