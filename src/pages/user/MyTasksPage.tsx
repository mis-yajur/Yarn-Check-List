import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Filter,
  Layers,
  Search,
} from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';
import { MarkTaskDoneModal } from '../../components/modals/MarkTaskDoneModal';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { ScheduledTask } from '../../types';

interface MyTasksPageProps {
  filterType?: 'all' | 'due_today' | 'overdue' | 'upcoming' | 'pending' | 'completed';
}

export const MyTasksPage: React.FC<MyTasksPageProps> = ({ filterType = 'all' }) => {
  const { currentUser } = useAuth();
  const { scheduledTasks, todayStr, settings } = useTasks();
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);
  const [viewingDoneTask, setViewingDoneTask] = useState<ScheduledTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const initialTab = useMemo(() => {
    if (filterType === 'due_today') return 'today';
    if (filterType === 'overdue') return 'overdue';
    if (filterType === 'upcoming') return 'upcoming';
    if (filterType === 'completed') return 'completed';
    if (filterType === 'pending') return 'pending';
    return 'all';
  }, [filterType]);

  const [activeTab, setActiveTab] = useState<'today' | 'pending' | 'overdue' | 'completed' | 'upcoming' | 'all'>(initialTab);

  React.useEffect(() => {
    if (filterType === 'due_today') setActiveTab('today');
    else if (filterType === 'overdue') setActiveTab('overdue');
    else if (filterType === 'upcoming') setActiveTab('upcoming');
    else if (filterType === 'completed') setActiveTab('completed');
    else if (filterType === 'pending') setActiveTab('pending');
    else setActiveTab('all');
  }, [filterType]);

  const advanceDays = settings.taskAdvanceVisibilityDays || 5;

  const fiveDaysLaterStr = useMemo(() => {
    try {
      return format(addDays(parseISO(todayStr), advanceDays), 'yyyy-MM-dd');
    } catch {
      return todayStr;
    }
  }, [todayStr, advanceDays]);

  // Tasks assigned to the logged-in user
  const myTasks = useMemo(() => {
    return scheduledTasks.filter((s) => s.assignedUserId === currentUser?.id);
  }, [scheduledTasks, currentUser?.id]);

  // Category subsets
  const todayTasks = useMemo(() => {
    return myTasks.filter((s) => s.dueDate === todayStr && !s.status.startsWith('completed') && s.status !== 'cancelled');
  }, [myTasks, todayStr]);

  const pendingTasks = useMemo(() => {
    return myTasks.filter((s) => !s.status.startsWith('completed') && s.status !== 'cancelled');
  }, [myTasks]);

  const overdueTasks = useMemo(() => {
    return myTasks.filter((s) => s.dueDate < todayStr && !s.status.startsWith('completed') && s.status !== 'cancelled');
  }, [myTasks, todayStr]);

  const completedTasks = useMemo(() => {
    return myTasks.filter((s) => s.status.startsWith('completed') && Boolean(s.completedAt));
  }, [myTasks]);

  const upcomingTasks = useMemo(() => {
    return myTasks.filter((s) => {
      const isTodayOrNext5Days = s.dueDate >= todayStr && s.dueDate <= fiveDaysLaterStr;
      const isPreviousPending = s.dueDate < todayStr && !s.status.startsWith('completed') && s.status !== 'cancelled';
      return (isTodayOrNext5Days || isPreviousPending) && !s.status.startsWith('completed') && s.status !== 'cancelled';
    });
  }, [myTasks, todayStr, fiveDaysLaterStr]);

  // Determine active task list
  const currentCategoryTasks = useMemo(() => {
    switch (activeTab) {
      case 'today':
        return todayTasks;
      case 'pending':
        return pendingTasks;
      case 'overdue':
        return overdueTasks;
      case 'completed':
        return completedTasks;
      case 'upcoming':
        return upcomingTasks;
      case 'all':
      default:
        return myTasks;
    }
  }, [activeTab, todayTasks, pendingTasks, overdueTasks, completedTasks, upcomingTasks, myTasks]);

  // Filtered by search query
  const filtered = useMemo(() => {
    return currentCategoryTasks.filter((task) => {
      const search = searchQuery.toLowerCase();
      return (
        task.taskCode.toLowerCase().includes(search) ||
        task.taskName.toLowerCase().includes(search) ||
        task.checklistName.toLowerCase().includes(search) ||
        task.dueDate.includes(search)
      );
    });
  }, [currentCategoryTasks, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 uppercase tracking-wider">
              Assigned Maintenance Workspace
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              Doer: {currentUser?.name} ({currentUser?.employeeId})
            </span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            My Machine Maintenance Tasks
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Manage scheduled preventive maintenance checklists, complete today's tasks, and track historical completion records.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-right">
          <span className="block text-[10px] font-semibold uppercase text-slate-500">Current Factory Date</span>
          <span className="font-mono text-sm font-extrabold text-slate-900">{todayStr}</span>
        </div>
      </div>

      {/* KPI Category Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer ${
            activeTab === 'today'
              ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-400'
              : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">Today's Tasks</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-blue-950">{todayTasks.length}</span>
            <span className="block text-[11px] text-blue-700 font-medium">Due for maintenance today</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-400'
              : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900">Pending Tasks</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-indigo-950">{pendingTasks.length}</span>
            <span className="block text-[11px] text-indigo-700 font-medium">All active uncompleted tasks</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer ${
            activeTab === 'overdue'
              ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-400'
              : 'border-slate-200 bg-white hover:border-rose-300 hover:bg-slate-50/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900">Overdue / Missed</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-800">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-950">{overdueTasks.length}</span>
            <span className="block text-[11px] text-rose-700 font-medium">Past scheduled date</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400'
              : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">Completed / Done</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-950">{completedTasks.length}</span>
            <span className="block text-[11px] text-emerald-700 font-medium">Verified completed with checklist</span>
          </div>
        </button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'today'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Today's Tasks ({todayTasks.length})
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Pending Tasks ({pendingTasks.length})
          </button>

          <button
            onClick={() => setActiveTab('overdue')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overdue'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Overdue / Missed ({overdueTasks.length})
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed / Done ({completedTasks.length})
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Upcoming (Next 5 Days) ({upcomingTasks.length})
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Tasks ({myTasks.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search machine, code, checklist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-600">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
            <p className="text-sm font-bold text-slate-800">No tasks found in this section</p>
            <p className="text-xs text-slate-500 mt-1">
              There are currently no tasks matching your selected category or search criteria.
            </p>
          </div>
        ) : (
          filtered.map((task) => {
            const isDone = task.status.startsWith('completed') && Boolean(task.completedAt);
            const isToday = task.dueDate === todayStr && !isDone;
            const isOverdue = task.dueDate < todayStr && !isDone;

            return (
              <div
                key={task.id}
                className={`flex flex-col justify-between rounded-xl border p-5 shadow-xs transition-all ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isToday
                    ? 'border-blue-300 bg-linear-to-b from-blue-50/40 to-white ring-1 ring-blue-400'
                    : isOverdue
                    ? 'border-rose-300 bg-linear-to-b from-rose-50/40 to-white'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {task.taskCode}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 mt-1.5">{task.taskName}</h3>
                      <p className="text-xs font-medium text-slate-600">{task.departmentName}</p>
                    </div>

                    {isDone && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Done ({task.score || 100} pts)
                      </span>
                    )}
                    {isToday && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-300">
                        <Clock className="h-3 w-3" />
                        Due Today (Pending)
                      </span>
                    )}
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-300">
                        <AlertTriangle className="h-3 w-3" />
                        Overdue / Missed
                      </span>
                    )}
                    {!isDone && !isToday && !isOverdue && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
                        Scheduled
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Checklist Template:</span>
                      <span className="font-semibold text-slate-900">{task.checklistName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Recurrence Frequency:</span>
                      <span className="font-semibold text-slate-900">{task.frequencyDisplay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Scheduled Date:</span>
                      <span className={`font-bold font-mono ${isToday ? 'text-blue-900' : isOverdue ? 'text-rose-900' : 'text-slate-900'}`}>
                        {task.dueDate}
                      </span>
                    </div>

                    {isDone && (
                      <>
                        <div className="flex justify-between border-t border-emerald-100 pt-1.5 mt-1.5">
                          <span className="text-emerald-800 font-medium">Completed On:</span>
                          <span className="font-semibold text-emerald-950 font-mono">
                            {task.completedDate} {task.completedTime}
                          </span>
                        </div>
                        {task.remarks && (
                          <div className="mt-1.5 rounded bg-emerald-50 p-2 text-[11px] text-emerald-900 border border-emerald-200">
                            <span className="font-bold">Remarks:</span> {task.remarks}
                          </div>
                        )}
                      </>
                    )}

                    {!isDone && task.instructions && (
                      <p className="mt-2 rounded bg-slate-50 p-2 text-[11px] text-slate-700 italic border border-slate-100">
                        "{task.instructions}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3">
                  {!isDone ? (
                    <button
                      id={`btn-mark-done-card-${task.id}`}
                      onClick={() => setSelectedTask(task)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
                    >
                      <FileCheck2 className="h-4 w-4" />
                      Complete Checklist &amp; Mark as Done
                    </button>
                  ) : (
                    <button
                      onClick={() => setViewingDoneTask(task)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Eye className="h-4 w-4 text-slate-500" />
                      View Completed Details
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Completion Modal */}
      {selectedTask && (
        <MarkTaskDoneModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSuccess={() => setSelectedTask(null)}
        />
      )}

      {/* View Completed Details Modal */}
      {viewingDoneTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Task Completion Record</h3>
              </div>
              <button
                onClick={() => setViewingDoneTask(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg">
                <div>
                  <span className="text-slate-500 block">Machine Name:</span>
                  <span className="font-bold text-slate-900">{viewingDoneTask.taskName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Task Code:</span>
                  <span className="font-bold text-slate-900 font-mono">{viewingDoneTask.taskCode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Scheduled Date:</span>
                  <span className="font-bold text-slate-900">{viewingDoneTask.dueDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Completed Timestamp:</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {viewingDoneTask.completedDate} {viewingDoneTask.completedTime}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Performance Score:</span>
                  <span className="font-bold text-emerald-700">{viewingDoneTask.score ?? 100} / 100</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Classification:</span>
                  <span className="font-bold uppercase text-slate-800">
                    {viewingDoneTask.completionClassification || 'ON TIME'}
                  </span>
                </div>
              </div>

              {viewingDoneTask.checklistResponses && viewingDoneTask.checklistResponses.length > 0 && (
                <div>
                  <span className="font-bold text-slate-800 block mb-1">Checklist Audit:</span>
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 rounded border border-slate-200">
                    {viewingDoneTask.checklistResponses.map((r, i) => (
                      <div key={i} className="p-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-700">{r.label}</span>
                        <span
                          className={`font-bold uppercase px-1.5 py-0.5 rounded text-[10px] ${
                            r.status === 'ok'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'not_ok'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingDoneTask.remarks && (
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block">Doer Remarks:</span>
                  <p className="text-slate-600 mt-0.5">{viewingDoneTask.remarks}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingDoneTask(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
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
