import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  Filter,
  History,
  Layers,
  Search,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { ScheduledTask, TaskMaster } from '../../types';

export const MachineHistoryPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { taskMasters, scheduledTasks, todayStr, completeTask } = useTasks();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMachineId, setSelectedMachineId] = useState<string>(
    taskMasters[0]?.id || 'tm-1'
  );
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<ScheduledTask | null>(null);

  // Quick Complete modal state
  const [completingTask, setCompletingTask] = useState<ScheduledTask | null>(null);
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [completionObservation, setCompletionObservation] = useState('');
  const [completionSuccess, setCompletionSuccess] = useState<string | null>(null);

  // Extract unique machine categories
  const categories = Array.from(new Set(taskMasters.map((tm) => tm.taskCategory || 'General')));

  const filteredMasters = taskMasters.filter((tm) => {
    const matchesSearch =
      tm.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tm.taskCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tm.taskCategory || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      tm.assignedUserName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = selectedCategory === 'all' || tm.taskCategory === selectedCategory;

    return matchesSearch && matchesCat;
  });

  const activeMachine = taskMasters.find((tm) => tm.id === selectedMachineId) || filteredMasters[0] || taskMasters[0];

  // Get all schedules for the active machine sorted by due date
  const machineSchedules = activeMachine
    ? scheduledTasks
        .filter((s) => s.taskMasterId === activeMachine.id || s.taskCode === activeMachine.taskCode)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    : [];

  const completedCount = machineSchedules.filter((s) => s.status.startsWith('completed')).length;
  const onTimeCount = machineSchedules.filter((s) => s.status === 'completed_on_time' || s.status === 'completed_early').length;
  const overdueCount = machineSchedules.filter((s) => s.status === 'overdue').length;
  const nextDue = machineSchedules.find((s) => !s.status.startsWith('completed') && s.dueDate >= todayStr);

  const handleExportMachineCSV = () => {
    if (!activeMachine) return;
    const headers = [
      'Machine Code',
      'Machine Name',
      'Category',
      'Schedule ID',
      'Due Date',
      'Status',
      'Completed Date',
      'Completed Time',
      'Delay Days',
      'Performance Score',
      'Technician',
      'Remarks',
      'Observations',
    ];

    const rows = machineSchedules.map((s) => [
      activeMachine.taskCode,
      `"${activeMachine.taskName}"`,
      `"${activeMachine.taskCategory}"`,
      s.scheduleId,
      s.dueDate,
      s.status,
      s.completedDate || '',
      s.completedTime || '',
      s.delayDays ?? '',
      s.score ?? '',
      `"${s.assignedUserName}"`,
      `"${(s.remarks || '').replace(/"/g, '""')}"`,
      `"${(s.observation || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeMachine.taskCode}_Maintenance_History_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenCompleteModal = (task: ScheduledTask) => {
    setCompletingTask(task);
    setCompletionRemarks('Routine preventive maintenance and inspection completed successfully.');
    setCompletionObservation('Machine bearings, alignment, and drive components verified in normal condition.');
  };

  const handlePerformComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTask) return;

    const res = completeTask(completingTask.id, {
      remarks: completionRemarks,
      observation: completionObservation,
      completedChecklistItems: ['Inspect drive components', 'Lubricate bearings', 'Electrical safety check'],
    });

    if (res.success) {
      setCompletionSuccess(`Task ${completingTask.scheduleId} completed with Score: ${res.task?.score} pts!`);
      setCompletingTask(null);
      setTimeout(() => setCompletionSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-rose-200/80 bg-linear-to-r from-white via-rose-50/40 to-pink-50/50 p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-700 text-white shadow-2xs">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
                Machine Maintenance Lifecycle &amp; History
              </h1>
              <p className="text-xs text-slate-700">
                Full service ledger, 15-day recurrence timelines, technical findings, and preventive records for all 33 plant machines.
              </p>
            </div>
          </div>
        </div>

        {activeMachine && (
          <button
            onClick={handleExportMachineCSV}
            className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3.5 py-2 text-xs font-bold text-rose-900 shadow-2xs hover:bg-rose-50 transition-colors"
          >
            <Download className="h-4 w-4 text-rose-700" />
            Export {activeMachine.taskCode} History (CSV)
          </button>
        )}
      </div>

      {completionSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-xs font-bold text-green-900 shadow-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <span>{completionSuccess}</span>
        </div>
      )}

      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
            selectedCategory === 'all'
              ? 'bg-rose-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Machines ({taskMasters.length})
        </button>
        {categories.map((cat) => {
          const count = taskMasters.filter((tm) => tm.taskCategory === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                selectedCategory === cat
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* 2-Column Layout: Left Machine List, Right Machine Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Machine Roster Selector */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search machine or code (e.g. Comber 5, TM-021)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="max-h-[620px] overflow-y-auto space-y-2 rounded-xl border border-slate-200 bg-white p-2 shadow-xs">
            {filteredMasters.map((tm) => {
              const isSelected = activeMachine?.id === tm.id;
              const mSchedules = scheduledTasks.filter((s) => s.taskMasterId === tm.id || s.taskCode === tm.taskCode);
              const mCompleted = mSchedules.filter((s) => s.status.startsWith('completed')).length;

              return (
                <div
                  key={tm.id}
                  onClick={() => setSelectedMachineId(tm.id)}
                  className={`cursor-pointer rounded-lg p-3 transition-all border ${
                    isSelected
                      ? 'border-rose-400 bg-rose-50/80 text-rose-950 shadow-xs'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-black text-rose-800 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                      {tm.taskCode}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {tm.taskCategory}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">{tm.taskName}</h4>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Doer: {tm.assignedUserName}</span>
                    <span className="font-semibold text-emerald-700">
                      {mCompleted} / {mSchedules.length} done
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Machine Deep Ledger */}
        <div className="lg:col-span-8 space-y-4">
          {activeMachine ? (
            <>
              {/* Machine Bio Card */}
              <div className="rounded-xl border border-rose-200 bg-white p-5 shadow-xs">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-white bg-rose-700 px-2.5 py-1 rounded-lg">
                        {activeMachine.taskCode}
                      </span>
                      <h2 className="text-lg font-black text-slate-900">
                        {activeMachine.taskName}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {activeMachine.taskDescription || '15-day preventive maintenance and mechanical inspection.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800">
                      Active Operational
                    </span>
                  </div>
                </div>

                {/* Key Machine Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4 text-xs">
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Division</span>
                    <p className="font-bold text-slate-900 mt-0.5">{activeMachine.departmentName}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Assigned Technician</span>
                    <p className="font-bold text-blue-900 mt-0.5">{activeMachine.assignedUserName}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Recurrence</span>
                    <p className="font-bold text-emerald-800 mt-0.5">Every 15 Days</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Next Due Date</span>
                    <p className="font-bold text-rose-800 mt-0.5">{nextDue?.dueDate || 'Current Horizon End'}</p>
                  </div>
                </div>
              </div>

              {/* Maintenance Schedule Timeline */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      1-Year Preventive Maintenance Schedule Ledger ({machineSchedules.length} Cycles)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Complete cycle history, due dates, visibility thresholds, and technical inspection records.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Cycle #</th>
                        <th className="p-3">Schedule ID</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Score / Delay</th>
                        <th className="p-3">Completed On</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {machineSchedules.map((s, idx) => {
                        const isDone = s.status.startsWith('completed');
                        const isOverdue = s.status === 'overdue';
                        const isDueToday = s.status === 'due_today';
                        const isAvailable = s.status === 'available';

                        return (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-bold text-slate-500">#{idx + 1}</td>
                            <td className="p-3 font-mono font-bold text-slate-900">{s.scheduleId}</td>
                            <td className="p-3 font-mono font-semibold text-slate-800">{s.dueDate}</td>
                            <td className="p-3">
                              {isDone ? (
                                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold text-green-800 border border-green-300">
                                  {s.status.replace('_', ' ').toUpperCase()}
                                </span>
                              ) : isOverdue ? (
                                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-800 border border-red-300">
                                  OVERDUE
                                </span>
                              ) : isDueToday ? (
                                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-300 animate-pulse">
                                  DUE TODAY
                                </span>
                              ) : isAvailable ? (
                                <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-[10px] font-bold text-cyan-800 border border-cyan-300">
                                  AVAILABLE (NEXT 5D)
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
                                  FUTURE SCHEDULED
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {isDone ? (
                                <span className="font-bold text-green-700">
                                  {s.score ?? 100} pts {s.delayDays ? `(${s.delayDays}d delay)` : '(On Time)'}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-slate-600">
                              {s.completedDate ? `${s.completedDate} ${s.completedTime || ''}` : 'Pending'}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedScheduleDetail(s)}
                                  className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {!isDone && (
                                  <button
                                    onClick={() => handleOpenCompleteModal(s)}
                                    className="flex items-center gap-1 rounded bg-rose-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-800 shadow-2xs"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Complete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              Select a machine from the left panel to inspect full maintenance history.
            </div>
          )}
        </div>
      </div>

      {/* Task Inspection Detail Modal */}
      {selectedScheduleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedScheduleDetail.taskName}
                </h3>
                <span className="font-mono text-xs text-rose-800 font-bold">
                  {selectedScheduleDetail.scheduleId}
                </span>
              </div>
              <button
                onClick={() => setSelectedScheduleDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-500">Due Date:</span>
                  <p className="font-bold text-slate-900">{selectedScheduleDetail.dueDate}</p>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>
                  <p className="font-bold uppercase text-rose-800">{selectedScheduleDetail.status}</p>
                </div>
                <div>
                  <span className="text-slate-500">Assigned Technician:</span>
                  <p className="font-bold text-slate-900">{selectedScheduleDetail.assignedUserName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Checklist Template:</span>
                  <p className="font-bold text-slate-900">{selectedScheduleDetail.checklistName}</p>
                </div>
              </div>

              {selectedScheduleDetail.status.startsWith('completed') && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Completed Date/Time:</span>
                    <span className="font-bold text-slate-900">
                      {selectedScheduleDetail.completedDate} {selectedScheduleDetail.completedTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Score Earned:</span>
                    <span className="font-bold text-green-700">{selectedScheduleDetail.score ?? 100} Points</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Technician Remarks:</span>
                    <p className="rounded bg-slate-50 p-2 font-medium text-slate-800 border border-slate-200">
                      {selectedScheduleDetail.remarks || 'Standard preventive maintenance completed.'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Technical Observations:</span>
                    <p className="rounded bg-slate-50 p-2 font-medium text-slate-800 border border-slate-200">
                      {selectedScheduleDetail.observation || 'No abnormalities detected.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
              <button
                onClick={() => setSelectedScheduleDetail(null)}
                className="rounded-lg bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Perform Maintenance Modal */}
      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-800">
                <Wrench className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900">
                  Complete Maintenance for {completingTask.taskName}
                </h3>
              </div>
              <button onClick={() => setCompletingTask(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePerformComplete} className="mt-4 space-y-3">
              <div className="rounded-lg bg-rose-50/70 p-3 text-xs border border-rose-200 text-rose-950">
                <p><strong>Schedule:</strong> {completingTask.scheduleId} (Due: {completingTask.dueDate})</p>
                <p><strong>Technician:</strong> {completingTask.assignedUserName} ({completingTask.assignedEmployeeId})</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Maintenance Actions &amp; Work Done *
                </label>
                <textarea
                  rows={3}
                  required
                  value={completionRemarks}
                  onChange={(e) => setCompletionRemarks(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Technical Observations &amp; Machine Condition
                </label>
                <textarea
                  rows={2}
                  value={completionObservation}
                  onChange={(e) => setCompletionObservation(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompletingTask(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 shadow-xs"
                >
                  Verify &amp; Submit Completion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
