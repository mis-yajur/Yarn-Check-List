import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  ListTodo,
  TrendingUp,
} from 'lucide-react';
import { MarkTaskDoneModal } from '../../components/modals/MarkTaskDoneModal';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { calculateScorecard } from '../../services/scoringEngine';
import { ScheduledTask } from '../../types';

interface UserDashboardProps {
  onNavigate: (view: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { scheduledTasks, todayStr, settings } = useTasks();
  const [selectedTaskForDone, setSelectedTaskForDone] = useState<ScheduledTask | null>(null);

  // Filter tasks strictly for this doer
  const myAllTasks = scheduledTasks.filter((s) => s.assignedUserId === currentUser?.id);

  // Visibility window: today through today + advance visibility days (default 5 days)
  const advanceDays = settings.taskAdvanceVisibilityDays || 5;

  const myDueToday = myAllTasks.filter((s) => s.status === 'due_today');
  const myOverdue = myAllTasks.filter((s) => s.status === 'overdue');
  const myAvailableNext5Days = myAllTasks.filter(
    (s) => s.status === 'available' || (s.status === 'due_today')
  );
  const myCompleted = myAllTasks.filter((s) => s.status.startsWith('completed'));

  const scorecard = calculateScorecard(
    myAllTasks,
    currentUser?.employeeId || 'YFL-084',
    currentUser?.name || 'Technician',
    currentUser?.departmentName || 'Yarn Division'
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Technician Workspace
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-700">Factory Date: {todayStr} (Asia/Kolkata)</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mt-0.5 sm:text-2xl">
            Welcome, {currentUser?.name}
          </h1>
          <p className="text-xs text-slate-700 mt-1">
            Employee ID: <span className="font-semibold text-slate-800">{currentUser?.employeeId}</span> • {currentUser?.designation} • {currentUser?.departmentName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('my-tasks')}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors"
          >
            <ListTodo className="h-4 w-4" />
            Open My Active Tasks ({myDueToday.length + myAvailableNext5Days.length})
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-blue-900">
            <span className="text-xs font-bold">Due Today</span>
            <Clock className="h-4 w-4 text-blue-800" />
          </div>
          <p className="mt-2 text-2xl font-black text-blue-900">{myDueToday.length}</p>
          <span className="text-[10px] text-blue-900 font-semibold">{todayStr}</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-xs font-semibold">Next 5 Days</span>
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{myAvailableNext5Days.length}</p>
          <span className="text-[10px] text-slate-700">Advance window</span>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-red-900">
            <span className="text-xs font-bold">Overdue</span>
            <AlertTriangle className="h-4 w-4 text-red-800" />
          </div>
          <p className="mt-2 text-2xl font-black text-red-900">{myOverdue.length}</p>
          <span className="text-[10px] text-red-900 font-semibold">Requires action</span>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-900">
            <span className="text-xs font-bold">Completed</span>
            <CheckCircle className="h-4 w-4 text-emerald-800" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-900">{myCompleted.length}</p>
          <span className="text-[10px] text-emerald-900 font-semibold">Verified</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-xs font-semibold">On-Time %</span>
            <TrendingUp className="h-4 w-4 text-emerald-800" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-900">{scorecard.onTimeRate}%</p>
          <span className="text-[10px] text-slate-700">Compliance</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-xs font-semibold">My Score</span>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{scorecard.averageScore}</p>
          <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${scorecard.ratingColor}`}>
            {scorecard.rating}
          </span>
        </div>
      </div>

      {/* Overdue Alert Banner if any */}
      {myOverdue.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">You have {myOverdue.length} Overdue Preventive Maintenance Task(s)</p>
              <p className="text-[11px] text-red-700">
                Please complete overdue tasks immediately to restore machine reliability and performance score.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('overdue')}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
          >
            Review Overdue
          </button>
        </div>
      )}

      {/* Today's Tasks Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-800" />
            <h2 className="text-sm font-bold text-slate-900">
              Tasks Due Today ({myDueToday.length})
            </h2>
          </div>
          <span className="text-xs text-slate-700">Target Date: {todayStr}</span>
        </div>

        <div className="mt-3 divide-y divide-slate-100">
          {myDueToday.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-600">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-1" />
              <p className="font-semibold text-slate-700">No tasks due for today!</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Check Upcoming Tasks for your next scheduled maintenance.</p>
            </div>
          ) : (
            myDueToday.map((task) => (
              <div
                key={task.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 p-2 rounded-lg transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-700">
                      {task.taskCode}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{task.taskName}</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.2 text-[10px] font-bold text-blue-800">
                      Due Today
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">
                    Checklist: <span className="font-medium text-slate-800">{task.checklistName}</span> • Frequency: {task.frequencyDisplay}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id={`btn-mark-done-${task.id}`}
                    onClick={() => setSelectedTaskForDone(task)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
                  >
                    <FileCheck2 className="h-4 w-4" />
                    Mark as Done
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Tasks in Advance Window (Next 5 Days) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-800" />
            <h2 className="text-sm font-bold text-slate-900">
              Upcoming Tasks Within Allowed Window (Next {advanceDays} Days)
            </h2>
          </div>
          <button
            onClick={() => onNavigate('my-tasks')}
            className="text-xs font-bold text-emerald-800 hover:underline"
          >
            View All My Tasks
          </button>
        </div>

        <div className="mt-3 divide-y divide-slate-100">
          {myAvailableNext5Days.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-600">
              No tasks scheduled within the next {advanceDays} days.
            </p>
          ) : (
            myAvailableNext5Days.slice(0, 6).map((task) => (
              <div key={task.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700">{task.taskCode}</span>
                    <span className="text-xs font-bold text-slate-900">{task.taskName}</span>
                    <span className="text-[10px] text-slate-700 font-medium">Due: {task.dueDate}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 mt-0.5">
                    {task.checklistName} ({task.departmentName})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-700">
                    {task.dueDate === todayStr ? 'Today' : task.dueDate}
                  </span>
                  <button
                    onClick={() => setSelectedTaskForDone(task)}
                    className="rounded-lg border border-emerald-600 px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-50"
                  >
                    Complete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal for task completion */}
      {selectedTaskForDone && (
        <MarkTaskDoneModal
          task={selectedTaskForDone}
          onClose={() => setSelectedTaskForDone(null)}
          onSuccess={() => setSelectedTaskForDone(null)}
        />
      )}
    </div>
  );
};
