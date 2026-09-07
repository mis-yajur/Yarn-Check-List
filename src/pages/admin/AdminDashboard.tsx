import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Cpu,
  FileSpreadsheet,
  Flame,
  Flower2,
  ListTodo,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { getActiveFirebaseCredentials, getLastSyncTime } from '../../services/firebase';
import { calculateScorecard, getRatingDetails } from '../../services/scoringEngine';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
  onOpenNewTask: () => void;
  onOpenFirebase?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onOpenNewTask,
  onOpenFirebase,
}) => {
  const { currentUser } = useAuth();
  const { taskMasters, scheduledTasks, users, departments, todayStr } = useTasks();

  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const fbCreds = getActiveFirebaseCredentials();
  const lastSync = getLastSyncTime();

  // KPI calculations
  const totalMasters = taskMasters.length;
  const totalSchedules = scheduledTasks.length;
  const dueTodayTasks = scheduledTasks.filter((s) => s.status === 'due_today');
  const upcomingTasks = scheduledTasks.filter((s) => s.status === 'available' || s.status === 'future');
  const completedTasks = scheduledTasks.filter((s) => s.status.startsWith('completed'));
  const overdueTasks = scheduledTasks.filter((s) => s.status === 'overdue');
  const activeUsers = users.filter((u) => u.status === 'active');

  const completedWithScore = completedTasks.filter((s) => s.score !== undefined);
  const avgScore = completedWithScore.length > 0
    ? Math.round(completedWithScore.reduce((acc, curr) => acc + (curr.score || 0), 0) / completedWithScore.length)
    : 100;
  const ratingDetails = getRatingDetails(avgScore);

  const completedOnTime = completedTasks.filter((s) => s.status === 'completed_on_time' || s.status === 'completed_early').length;
  const completedLate = completedTasks.filter((s) => s.status === 'completed_late').length;
  const onTimeRate = completedTasks.length > 0 ? Math.round((completedOnTime / completedTasks.length) * 100) : 100;

  // Recent completed tasks
  const recentCompletions = [...completedTasks]
    .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner in Lotus Palette */}
      <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-linear-to-r from-rose-50/70 via-pink-50/40 to-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-bold text-rose-800 uppercase tracking-wider">
              <Flower2 className="h-3.5 w-3.5 text-pink-600" />
              Lotus Management Portal
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-700">Factory Date: {todayStr}</span>
          </div>
          <h1 className="text-xl font-black text-rose-950 sm:text-2xl mt-0.5 tracking-tight">
            Yarn Division Checklist &amp; Task Management System
          </h1>
          <p className="text-xs text-slate-700 mt-1">
            Yajur Fibres Limited • <span className="font-bold text-rose-700">Plan • Maintain • Track • Improve</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenFirebase && (
            <button
              onClick={onOpenFirebase}
              id="btn-admin-open-firebase"
              className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3.5 py-2 text-xs font-bold text-rose-800 shadow-2xs hover:bg-rose-50 transition-colors"
            >
              <Flame className="h-4 w-4 text-amber-500 fill-amber-400" />
              Firebase Cloud Sync
            </button>
          )}

          <button
            onClick={onOpenNewTask}
            id="btn-admin-add-task-header"
            className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-rose-700 to-pink-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:from-rose-800 hover:to-pink-800 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Add Task Master
          </button>
          <button
            onClick={() => onNavigate('scheduler')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Calendar className="h-4 w-4 text-rose-700" />
            1-Year Scheduler
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-blue-800" />
            Export Reports
          </button>
        </div>
      </div>

      {/* Firebase Cloud Sync Status Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-200 bg-linear-to-r from-rose-900 via-rose-800 to-pink-900 p-4 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-amber-300 shrink-0">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-200">
                Firebase Firestore Real-Time Data Store
              </span>
              <span className="rounded-full bg-rose-700 px-2 py-0.5 text-[10px] font-bold text-rose-100">
                Connected
              </span>
            </div>
            <p className="text-xs text-rose-100 mt-0.5">
              Project ID: <strong className="font-mono text-amber-300">{fbCreds.projectId}</strong> •
              All 33 machines &amp; maintenance occurrences synced to Firestore collections
            </p>
          </div>
        </div>
        {onOpenFirebase && (
          <button
            onClick={onOpenFirebase}
            className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-rose-900 hover:bg-rose-50 transition-colors shadow-xs shrink-0"
          >
            Manage Firebase Credentials &rarr;
          </button>
        )}
      </div>

      {/* 8 Primary KPI Metric Cards in Lotus Theme */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <div
          onClick={() => onNavigate('tasks')}
          className="cursor-pointer rounded-xl border border-rose-100 bg-white p-3.5 shadow-2xs hover:border-rose-400 hover:bg-rose-50/30 transition-all"
        >
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-bold text-rose-950">Task Masters</span>
            <ListTodo className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-950">{totalMasters}</p>
          <span className="text-[10px] text-slate-600">33 active machines</span>
        </div>

        <div
          onClick={() => onNavigate('master-schedule')}
          className="cursor-pointer rounded-xl border border-rose-100 bg-white p-3.5 shadow-2xs hover:border-rose-400 hover:bg-rose-50/30 transition-all"
        >
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-bold text-rose-950">Schedules</span>
            <Calendar className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-950">{totalSchedules}</p>
          <span className="text-[10px] text-slate-600">1-year occurrences</span>
        </div>

        <div
          onClick={() => onNavigate('due-today')}
          className="cursor-pointer rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 shadow-2xs hover:border-amber-400 transition-all"
        >
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-[11px] font-bold">Due Today</span>
            <Clock className="h-4 w-4 text-amber-800" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-900">{dueTodayTasks.length}</p>
          <span className="text-[10px] text-amber-900 font-semibold">{todayStr}</span>
        </div>

        <div
          onClick={() => onNavigate('upcoming')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-rose-400 transition-all"
        >
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-semibold">Upcoming</span>
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{upcomingTasks.length}</p>
          <span className="text-[10px] text-slate-600">Next cycles</span>
        </div>

        <div
          onClick={() => onNavigate('done')}
          className="cursor-pointer rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 shadow-2xs hover:border-rose-400 transition-all"
        >
          <div className="flex items-center justify-between text-rose-900">
            <span className="text-[11px] font-bold">Completed</span>
            <CheckCircle className="h-4 w-4 text-rose-700" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-900">{completedTasks.length}</p>
          <span className="text-[10px] text-rose-800 font-semibold">Verified tasks</span>
        </div>

        <div
          onClick={() => onNavigate('overdue')}
          className="cursor-pointer rounded-xl border border-red-200 bg-red-50/50 p-3.5 shadow-2xs hover:border-red-400 transition-all"
        >
          <div className="flex items-center justify-between text-red-900">
            <span className="text-[11px] font-bold">Overdue</span>
            <AlertTriangle className="h-4 w-4 text-red-800" />
          </div>
          <p className="mt-2 text-2xl font-black text-red-900">{overdueTasks.length}</p>
          <span className="text-[10px] text-red-900 font-semibold">Requires attention</span>
        </div>

        <div
          onClick={() => onNavigate('users')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-rose-400 transition-all"
        >
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-semibold">Active Doers</span>
            <UserCheck className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{activeUsers.length}</p>
          <span className="text-[10px] text-slate-600">Technicians</span>
        </div>

        <div
          onClick={() => onNavigate('scorecards')}
          className="cursor-pointer rounded-xl border border-rose-200 bg-rose-50/30 p-3.5 shadow-2xs hover:border-rose-400 transition-all"
        >
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-bold text-rose-900">Avg Score</span>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-900">{avgScore}</p>
          <span className={`inline-block px-1 py-0.2 rounded text-[9px] font-bold ${ratingDetails.badgeClass}`}>
            {ratingDetails.label}
          </span>
        </div>
      </div>

      {/* Analytics & Performance Charts Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* On-Time Compliance Meter in Lotus Pink */}
        <div className="rounded-xl border border-rose-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">On-Time Completion Rate</h2>
              <p className="text-[11px] text-slate-600">Preventive maintenance efficiency</p>
            </div>
            <span className="text-xs font-extrabold text-rose-800">{onTimeRate}%</span>
          </div>

          <div className="mt-5 flex flex-col items-center">
            {/* SVG Donut / Gauge Chart */}
            <div className="relative flex h-36 w-36 items-center justify-center">
              <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-rose-600"
                  strokeDasharray={`${onTimeRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-rose-950">{onTimeRate}%</span>
                <span className="block text-[10px] font-bold text-rose-700">On-Time</span>
              </div>
            </div>

            <div className="mt-4 grid w-full grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-600 block">Early</span>
                <span className="font-bold text-rose-800">
                  {completedTasks.filter((s) => s.status === 'completed_early').length}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-600 block">On-Time</span>
                <span className="font-bold text-pink-700">
                  {completedTasks.filter((s) => s.status === 'completed_on_time').length}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-600 block">Late</span>
                <span className="font-bold text-amber-800">{completedLate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Machine Groups Maintenance Distribution */}
        <div className="rounded-xl border border-rose-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Machine Group Distribution</h2>
              <p className="text-[11px] text-slate-600">Yarn Division equipment categories</p>
            </div>
            <span className="text-xs text-rose-800 font-bold">33 Machines</span>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Comber Machines (COMBER 1-13)</span>
                <span className="font-mono text-rose-800">13 units (39%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-rose-700 rounded-full" style={{ width: '39%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Carding Machines (B. Card &amp; F. Card)</span>
                <span className="font-mono text-pink-700">5 units (15%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-pink-600 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Spinning Machines (Spg 1-5)</span>
                <span className="font-mono text-purple-700">5 units (15%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Finishing &amp; Polish (Fin &amp; Polish m/c)</span>
                <span className="font-mono text-amber-700">5 units (15%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-600 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Mono &amp; Punjab Machines</span>
                <span className="font-mono text-blue-700">5 units (15%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Technician Scorecard Summary */}
        <div className="rounded-xl border border-rose-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Technician Performance</h2>
              <p className="text-[11px] text-slate-600">Individual scores &amp; compliance</p>
            </div>
            <button
              onClick={() => onNavigate('scorecards')}
              className="text-xs font-bold text-rose-800 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {users
              .filter((u) => u.role === 'doer')
              .map((u) => {
                const userTasks = scheduledTasks.filter((s) => s.assignedUserId === u.id);
                const stats = calculateScorecard(userTasks, u.employeeId, u.name, u.departmentName);

                return (
                  <div key={u.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{u.name}</p>
                      <p className="text-[10px] text-slate-600">
                        {u.employeeId} • {u.designation}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-rose-950">{stats.averageScore} pts</span>
                      <span className={`block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${stats.ratingColor}`}>
                        {stats.rating}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Due Today & Recent Completed Sections */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Due Today Tasks List */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Tasks Due Today ({dueTodayTasks.length})
              </h2>
            </div>
            <button
              onClick={() => onNavigate('due-today')}
              className="text-xs font-bold text-rose-800 hover:underline"
            >
              View Full List
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {dueTodayTasks.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No tasks scheduled for today.</p>
            ) : (
              dueTodayTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">{task.taskCode}</span>
                      <span className="text-xs font-bold text-slate-900">{task.taskName}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Doer: <span className="font-semibold text-slate-800">{task.assignedUserName}</span> • Checklist: {task.checklistName}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    Due Today
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Completed Tasks */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-rose-700" />
              <h2 className="text-sm font-bold text-slate-900">Recent Completed Tasks</h2>
            </div>
            <button
              onClick={() => onNavigate('done')}
              className="text-xs font-bold text-rose-800 hover:underline"
            >
              View History
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {recentCompletions.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No tasks completed yet.</p>
            ) : (
              recentCompletions.map((task) => (
                <div key={task.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">{task.taskCode}</span>
                      <span className="text-xs font-bold text-slate-900">{task.taskName}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Completed by {task.assignedUserName} on {task.completedDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs text-rose-800">{task.score} pts</span>
                    <span className="block text-[10px] text-slate-500">
                      {task.completionClassification?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
