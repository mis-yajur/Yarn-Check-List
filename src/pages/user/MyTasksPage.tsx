import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  Filter,
  Search,
} from 'lucide-react';
import { MarkTaskDoneModal } from '../../components/modals/MarkTaskDoneModal';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { ScheduledTask } from '../../types';

interface MyTasksPageProps {
  filterType?: 'all' | 'due_today' | 'overdue' | 'upcoming';
}

export const MyTasksPage: React.FC<MyTasksPageProps> = ({ filterType = 'all' }) => {
  const { currentUser } = useAuth();
  const { scheduledTasks, todayStr, settings } = useTasks();
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'due_today' | 'overdue' | 'available'>(
    filterType === 'due_today' ? 'due_today' : (filterType === 'overdue' ? 'overdue' : 'all')
  );

  const advanceDays = settings.taskAdvanceVisibilityDays || 5;

  // Filter tasks assigned to current user
  const myTasks = scheduledTasks.filter((s) => s.assignedUserId === currentUser?.id);

  // Visible tasks: overdue + due_today + available in next advanceDays
  const visibleTasks = myTasks.filter((s) => {
    // Exclude completed or cancelled
    if (s.completedAt || s.status === 'cancelled') return false;

    // Must be overdue, due today, or within advance window
    return s.status === 'overdue' || s.status === 'due_today' || s.status === 'available';
  });

  const filtered = visibleTasks.filter((task) => {
    const matchesSearch =
      task.taskCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.checklistName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'all') return true;
    return task.status === activeTab;
  });

  const overdueCount = visibleTasks.filter((s) => s.status === 'overdue').length;
  const dueTodayCount = visibleTasks.filter((s) => s.status === 'due_today').length;
  const availableCount = visibleTasks.filter((s) => s.status === 'available').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            My Assigned Tasks
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Displaying tasks due today and within the next {advanceDays} days, plus open overdue items.
          </p>
        </div>

        <div className="text-xs text-slate-700">
          Factory Date: <strong className="text-slate-900">{todayStr}</strong> (Asia/Kolkata)
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Active ({visibleTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('due_today')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'due_today'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-50'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Due Today ({dueTodayCount})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'available'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Next {advanceDays} Days ({availableCount})
          </button>
          {overdueCount > 0 && (
            <button
              onClick={() => setActiveTab('overdue')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                activeTab === 'overdue'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white text-red-800 border border-red-200 hover:bg-red-50'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Overdue ({overdueCount})
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by machine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-600">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
            <p className="text-sm font-bold text-slate-800">No matching active tasks</p>
            <p className="text-xs text-slate-600 mt-1">
              All tasks for this filter have been completed or are beyond your {advanceDays}-day visibility window.
            </p>
          </div>
        ) : (
          filtered.map((task) => {
            const isToday = task.status === 'due_today';
            const isOverdue = task.status === 'overdue';

            return (
              <div
                key={task.id}
                className={`flex flex-col justify-between rounded-xl border p-5 shadow-xs transition-all ${
                  isToday
                    ? 'border-blue-300 bg-linear-to-b from-blue-50/40 to-white ring-1 ring-blue-400'
                    : isOverdue
                    ? 'border-red-300 bg-linear-to-b from-red-50/40 to-white'
                    : 'border-slate-200 bg-white hover:border-emerald-400'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-700">{task.taskCode}</span>
                      <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{task.taskName}</h3>
                      <p className="text-xs font-medium text-slate-700">{task.departmentName}</p>
                    </div>

                    {isToday && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">
                        Due Today
                      </span>
                    )}
                    {isOverdue && (
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-800 border border-red-200">
                        Overdue
                      </span>
                    )}
                    {!isToday && !isOverdue && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700">
                        Next {advanceDays}D
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-700">Checklist Template:</span>
                      <span className="font-semibold text-slate-900">{task.checklistName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">Recurrence Rule:</span>
                      <span className="font-semibold text-slate-900">{task.frequencyDisplay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">Target Due Date:</span>
                      <span className={`font-bold font-mono ${isToday ? 'text-blue-900' : isOverdue ? 'text-red-900' : 'text-slate-900'}`}>
                        {task.dueDate}
                      </span>
                    </div>
                    {task.instructions && (
                      <p className="mt-2 rounded bg-slate-50 p-2 text-[11px] text-slate-700 italic border border-slate-100">
                        "{task.instructions}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-end">
                  <button
                    id={`btn-mark-done-card-${task.id}`}
                    onClick={() => setSelectedTask(task)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
                  >
                    <FileCheck2 className="h-4 w-4" />
                    Open Checklist &amp; Mark Done
                  </button>
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
    </div>
  );
};
