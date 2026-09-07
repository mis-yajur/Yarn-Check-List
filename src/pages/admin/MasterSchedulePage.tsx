import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  Filter,
  LayoutGrid,
  List,
  ListTodo,
  Search,
  X,
} from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';
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

  // Pagination state: Page-wise entries (100 or 250)
  const [itemsPerPage, setItemsPerPage] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sync if initialFilter prop changes
  React.useEffect(() => {
    setStatusFilter(initialFilter);
    setCurrentPage(1);
  }, [initialFilter]);

  // Admin correction modal state
  const [correctionModalTask, setCorrectionModalTask] = useState<ScheduledTask | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionStatus, setCorrectionStatus] = useState<ScheduleStatus>('completed_on_time');
  const [correctionScore, setCorrectionScore] = useState<number>(100);

  // Filter tasks: if doer, restricted to their own tasks unless admin
  const baseTasks = useMemo(() => {
    return isAdmin
      ? scheduledTasks
      : scheduledTasks.filter((s) => s.assignedUserId === currentUser?.id);
  }, [isAdmin, scheduledTasks, currentUser?.id]);

  // Compute Today + 5 days date string for the upcoming filter (Today through Today+5 days)
  const todayPlus5Str = useMemo(() => {
    try {
      const parsedToday = parseISO(todayStr);
      return format(addDays(parsedToday, 5), 'yyyy-MM-dd');
    } catch {
      return todayStr;
    }
  }, [todayStr]);

  // Summary Metrics calculated from the entire dataset (Total Tasks, Due Today, Upcoming 5 Days, Overdue, Completed)
  const metrics = useMemo(() => {
    const totalCount = baseTasks.length;
    const dueTodayCount = baseTasks.filter(
      (t) => (t.status === 'due_today' || t.dueDate === todayStr) && !t.status.startsWith('completed')
    ).length;
    const upcoming5DaysCount = baseTasks.filter(
      (t) => !t.status.startsWith('completed') && t.dueDate >= todayStr && t.dueDate <= todayPlus5Str
    ).length;
    const overdueCount = baseTasks.filter(
      (t) => t.dueDate < todayStr && !t.status.startsWith('completed')
    ).length;
    const completedCount = baseTasks.filter((t) => t.status.startsWith('completed')).length;

    return {
      totalCount,
      dueTodayCount,
      upcoming5DaysCount,
      overdueCount,
      completedCount,
    };
  }, [baseTasks, todayStr, todayPlus5Str]);

  // Filter and sort tasks by due date
  const filteredTasks = useMemo(() => {
    const result = baseTasks.filter((task) => {
      const matchesSearch =
        task.taskCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignedUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.checklistName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      let matchesStatus = true;
      if (statusFilter === 'all') {
        matchesStatus = true;
      } else if (statusFilter === 'due_today') {
        // Due today strictly
        matchesStatus = (task.status === 'due_today' || task.dueDate === todayStr) && !task.status.startsWith('completed');
      } else if (statusFilter === 'upcoming') {
        // Today + upcoming 5 days task only (non-completed)
        matchesStatus =
          !task.status.startsWith('completed') &&
          task.dueDate >= todayStr &&
          task.dueDate <= todayPlus5Str;
      } else if (statusFilter === 'overdue') {
        // Only if task due date is crossed (past today) and not completed
        matchesStatus = task.dueDate < todayStr && !task.status.startsWith('completed');
      } else if (statusFilter === 'available') {
        // Next 5 days
        matchesStatus =
          !task.status.startsWith('completed') &&
          task.dueDate >= todayStr &&
          task.dueDate <= todayPlus5Str;
      } else if (statusFilter === 'done' || statusFilter === 'completed') {
        matchesStatus = task.status.startsWith('completed');
      } else if (statusFilter === 'future') {
        matchesStatus = !task.status.startsWith('completed') && task.dueDate > todayPlus5Str;
      } else {
        matchesStatus = task.status === statusFilter;
      }

      const matchesDoer = doerFilter === 'all' || task.assignedUserId === doerFilter;
      const matchesMonth = monthFilter === 'all' || task.dueDate.startsWith(monthFilter);

      return matchesStatus && matchesDoer && matchesMonth;
    });

    // Chronological sort by due date ascending, then schedule ID
    return result.sort((a, b) => {
      const cmp = a.dueDate.localeCompare(b.dueDate);
      if (cmp !== 0) return cmp;
      return a.scheduleId.localeCompare(b.scheduleId);
    });
  }, [baseTasks, searchQuery, statusFilter, doerFilter, monthFilter, todayStr, todayPlus5Str]);

  // Reset to page 1 whenever filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, doerFilter, monthFilter, itemsPerPage]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedTasks = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTasks, validCurrentPage, itemsPerPage]);

  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredTasks.length);

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
        return <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-[10px] font-bold text-cyan-800 border border-cyan-300">Upcoming (5D)</span>;
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
    <div className="space-y-5">
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
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-600" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary KPI Cards with Total Task Calculations */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${
            statusFilter === 'all'
              ? 'border-slate-800 bg-slate-900 text-white ring-2 ring-slate-800'
              : 'border-slate-200 bg-white hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold ${statusFilter === 'all' ? 'text-slate-200' : 'text-slate-700'}`}>
              Total Tasks
            </span>
            <ListTodo className={`h-4 w-4 ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-600'}`} />
          </div>
          <p className={`mt-2 text-2xl font-black ${statusFilter === 'all' ? 'text-white' : 'text-slate-900'}`}>
            {metrics.totalCount}
          </p>
          <span className={`text-[10px] ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-600'}`}>
            All 1-Year Entries
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('due_today')}
          className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${
            statusFilter === 'due_today'
              ? 'border-blue-600 bg-blue-600 text-white ring-2 ring-blue-500'
              : 'border-amber-200 bg-amber-50/60 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold ${statusFilter === 'due_today' ? 'text-blue-100' : 'text-amber-900'}`}>
              Due Today
            </span>
            <Clock className={`h-4 w-4 ${statusFilter === 'due_today' ? 'text-blue-100' : 'text-amber-800'}`} />
          </div>
          <p className={`mt-2 text-2xl font-black ${statusFilter === 'due_today' ? 'text-white' : 'text-amber-900'}`}>
            {metrics.dueTodayCount}
          </p>
          <span className={`text-[10px] font-semibold ${statusFilter === 'due_today' ? 'text-blue-100' : 'text-amber-800'}`}>
            {todayStr}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('upcoming')}
          className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${
            statusFilter === 'upcoming'
              ? 'border-cyan-700 bg-cyan-700 text-white ring-2 ring-cyan-600'
              : 'border-cyan-200 bg-cyan-50/50 hover:border-cyan-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold ${statusFilter === 'upcoming' ? 'text-cyan-100' : 'text-cyan-900'}`}>
              Upcoming (Today + 5D)
            </span>
            <Calendar className={`h-4 w-4 ${statusFilter === 'upcoming' ? 'text-cyan-100' : 'text-cyan-700'}`} />
          </div>
          <p className={`mt-2 text-2xl font-black ${statusFilter === 'upcoming' ? 'text-white' : 'text-cyan-900'}`}>
            {metrics.upcoming5DaysCount}
          </p>
          <span className={`text-[10px] ${statusFilter === 'upcoming' ? 'text-cyan-100' : 'text-cyan-800'}`}>
            Next 5 Days Horizon
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('overdue')}
          className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${
            statusFilter === 'overdue'
              ? 'border-red-600 bg-red-600 text-white ring-2 ring-red-500'
              : 'border-red-200 bg-red-50/60 hover:border-red-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold ${statusFilter === 'overdue' ? 'text-red-100' : 'text-red-900'}`}>
              Overdue Tasks
            </span>
            <AlertTriangle className={`h-4 w-4 ${statusFilter === 'overdue' ? 'text-red-100' : 'text-red-800'}`} />
          </div>
          <p className={`mt-2 text-2xl font-black ${statusFilter === 'overdue' ? 'text-white' : 'text-red-900'}`}>
            {metrics.overdueCount}
          </p>
          <span className={`text-[10px] font-semibold ${statusFilter === 'overdue' ? 'text-red-100' : 'text-red-900'}`}>
            Due Date Crossed
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('done')}
          className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${
            statusFilter === 'done' || statusFilter === 'completed'
              ? 'border-emerald-700 bg-emerald-700 text-white ring-2 ring-emerald-600'
              : 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold ${statusFilter === 'done' || statusFilter === 'completed' ? 'text-emerald-100' : 'text-emerald-900'}`}>
              Done / Completed
            </span>
            <CheckCircle className={`h-4 w-4 ${statusFilter === 'done' || statusFilter === 'completed' ? 'text-emerald-100' : 'text-emerald-700'}`} />
          </div>
          <p className={`mt-2 text-2xl font-black ${statusFilter === 'done' || statusFilter === 'completed' ? 'text-white' : 'text-emerald-900'}`}>
            {metrics.completedCount}
          </p>
          <span className={`text-[10px] font-semibold ${statusFilter === 'done' || statusFilter === 'completed' ? 'text-emerald-100' : 'text-emerald-800'}`}>
            Verified History
          </span>
        </div>
      </div>

      {/* Filter and Page Size Controls */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Machine, Code, Doer, Checklist..."
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
            <option value="all">All Statuses ({metrics.totalCount})</option>
            <option value="due_today">Due Today ({metrics.dueTodayCount})</option>
            <option value="upcoming">Upcoming (Today + 5 Days) ({metrics.upcoming5DaysCount})</option>
            <option value="overdue">Overdue (Due Crossed) ({metrics.overdueCount})</option>
            <option value="done">Done / Completed ({metrics.completedCount})</option>
            <option value="future">Future Scheduled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Doer Filter (Admin only) or Month */}
        {isAdmin ? (
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
        ) : (
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
        )}

        {/* Page Wise Entries Selector (100 Entries or 250 Entries) */}
        <div>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-hidden bg-slate-50"
          >
            <option value={100}>100 Entries / Page</option>
            <option value={250}>250 Entries / Page</option>
            <option value={50}>50 Entries / Page</option>
          </select>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          {/* Table Top Status / Pagination Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3 gap-2">
            <div className="text-xs text-slate-700">
              Showing <strong className="text-slate-900">{filteredTasks.length === 0 ? 0 : startIndex + 1}</strong> to{' '}
              <strong className="text-slate-900">{endIndex}</strong> of{' '}
              <strong className="text-slate-900">{filteredTasks.length}</strong> matching entries{' '}
              <span className="text-slate-700">(Total Scheduled Tasks in Database: {metrics.totalCount})</span>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-medium">
                  Page {validCurrentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={validCurrentPage === 1}
                    className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={validCurrentPage === totalPages}
                    className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-100/90 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Schedule ID</th>
                  <th className="p-3">Task / Machine</th>
                  <th className="p-3">Checklist</th>
                  <th className="p-3">Doer</th>
                  <th className="p-3">Due Date (Sorted)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Completed At</th>
                  <th className="p-3">Delay</th>
                  <th className="p-3">Score</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-700">
                      <ListTodo className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                      <p className="font-semibold text-slate-800">No schedule records found</p>
                      <p className="text-xs text-slate-600 mt-0.5">Adjust your search or status filters to view records.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedTasks.map((task) => {
                    const isTaskDueToday = (task.status === 'due_today' || task.dueDate === todayStr) && !task.status.startsWith('completed');
                    const isTaskOverdue = task.dueDate < todayStr && !task.status.startsWith('completed');

                    return (
                      <tr
                        key={task.id}
                        className={`transition-colors ${
                          isTaskOverdue
                            ? 'bg-red-50/30 hover:bg-red-50/60'
                            : isTaskDueToday
                            ? 'bg-blue-50/30 hover:bg-blue-50/60'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="p-3 font-mono text-[11px] font-medium text-slate-700">{task.scheduleId}</td>
                        <td className="p-3 font-bold text-slate-900">
                          {task.taskName}
                          <span className="block font-mono text-[10px] font-normal text-slate-700">{task.taskCode}</span>
                        </td>
                        <td className="p-3 text-slate-700">{task.checklistName}</td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-900">{task.assignedUserName}</span>
                          <span className="block text-[10px] text-slate-700">{task.assignedEmployeeId}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900">
                          <span
                            className={
                              isTaskOverdue
                                ? 'text-red-700'
                                : isTaskDueToday
                                ? 'text-blue-700'
                                : 'text-slate-900'
                            }
                          >
                            {task.dueDate}
                          </span>
                        </td>
                        <td className="p-3">{getStatusBadge(task.status)}</td>
                        <td className="p-3 text-slate-700">
                          {task.completedDate ? (
                            <>
                              <span className="font-mono text-emerald-800 font-semibold">{task.completedDate}</span>
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
                          ) : isTaskOverdue ? (
                            <span className="font-bold text-red-700">Overdue</span>
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
                              className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {isAdmin && task.completedAt && (
                              <button
                                onClick={() => handleOpenCorrection(task)}
                                title="Admin Correction"
                                className="rounded p-1.5 text-blue-700 hover:bg-blue-50 hover:text-blue-900 cursor-pointer"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-3 gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-700">
              <span>
                Showing page <strong>{validCurrentPage}</strong> of <strong>{totalPages}</strong> (
                {filteredTasks.length === 0 ? 0 : startIndex + 1}–{endIndex} of {filteredTasks.length} filtered)
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800"
                >
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={validCurrentPage === 1}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                  className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </button>
                <span className="px-2 text-xs font-bold text-slate-800">
                  {validCurrentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage === totalPages}
                  className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={validCurrentPage === totalPages}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  Last
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Calendar View */
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
              <button onClick={() => setSelectedTaskDetails(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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
                className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 cursor-pointer"
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
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 cursor-pointer"
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
