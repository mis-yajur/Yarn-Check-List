import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle,
  CheckCircle2,
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
  Play,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { DailyScheduleRow, ScheduledTask, ScheduleStatus } from '../../types';

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
  const { scheduledTasks, holidays, adminCorrectCompletion, markTaskAsDone, todayStr } = useTasks();

  const [viewMode, setViewMode] = useState<'paired' | 'flat'>('paired');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [cycleFilter, setCycleFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState<'all' | 'MC1' | 'MC2'>('all');
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<ScheduledTask | null>(null);

  // Completion modal state
  const [activeCompletingTask, setActiveCompletingTask] = useState<ScheduledTask | null>(null);
  const [completeRemarks, setCompleteRemarks] = useState('');
  const [completeObservation, setCompleteObservation] = useState('');

  // Pagination
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  React.useEffect(() => {
    setStatusFilter(initialFilter);
    setCurrentPage(1);
  }, [initialFilter]);

  // Admin correction modal state
  const [correctionModalTask, setCorrectionModalTask] = useState<ScheduledTask | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionStatus, setCorrectionStatus] = useState<ScheduleStatus>('completed_on_time');
  const [correctionScore, setCorrectionScore] = useState<number>(100);

  // Group tasks into paired daily rows
  interface PairedDailyRow {
    mc1?: ScheduledTask;
    mc2?: ScheduledTask;
    date: string;
    dayName: string;
    cycleNumber?: number;
    cycleDay?: number;
  }

  const pairedDailyRows = useMemo(() => {
    const map = new Map<string, PairedDailyRow>();

    scheduledTasks.forEach((task) => {
      const key = task.dueDate;
      const existing: PairedDailyRow = map.get(key) || {
        date: task.dueDate,
        dayName: task.dayName || format(parseISO(task.dueDate), 'EEEE'),
        cycleNumber: task.cycleNumber || 1,
        cycleDay: task.cycleDay || 1,
      };

      if (task.rotationGroup === 'MC1') {
        existing.mc1 = task;
        existing.cycleNumber = task.cycleNumber;
        existing.cycleDay = task.cycleDay;
      } else if (task.rotationGroup === 'MC2') {
        existing.mc2 = task;
      }
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [scheduledTasks]);

  const fiveDaysLaterStr = useMemo(() => {
    try {
      return format(addDays(parseISO(todayStr), 5), 'yyyy-MM-dd');
    } catch {
      return todayStr;
    }
  }, [todayStr]);

  // Filter paired rows
  const filteredPairedRows = useMemo(() => {
    return pairedDailyRows.filter((row) => {
      const mc1Name = row.mc1?.taskName || '';
      const mc2Name = row.mc2?.taskName || '';
      const search = searchQuery.toLowerCase();

      const matchesSearch =
        row.date.includes(search) ||
        row.dayName.toLowerCase().includes(search) ||
        mc1Name.toLowerCase().includes(search) ||
        mc2Name.toLowerCase().includes(search);

      if (!matchesSearch) return false;

      if (cycleFilter !== 'all' && row.cycleNumber !== parseInt(cycleFilter, 10)) {
        return false;
      }

      if (statusFilter !== 'all') {
        const mc1Status = row.mc1?.status;
        const mc2Status = row.mc2?.status;

        if (statusFilter === 'due_today') {
          if (row.date !== todayStr) return false;
        } else if (statusFilter === 'upcoming') {
          // Today + upcoming 5 days task AND Previous all Pending Task
          const isTodayOrNext5Days = row.date >= todayStr && row.date <= fiveDaysLaterStr;
          const isPreviousPending =
            row.date < todayStr &&
            ((row.mc1 && !row.mc1.status.startsWith('completed') && row.mc1.status !== 'cancelled') ||
              (row.mc2 && !row.mc2.status.startsWith('completed') && row.mc2.status !== 'cancelled'));
          if (!isTodayOrNext5Days && !isPreviousPending) return false;
        } else if (statusFilter === 'completed') {
          const hasCompleted = mc1Status?.startsWith('completed') || mc2Status?.startsWith('completed');
          if (!hasCompleted) return false;
        } else if (statusFilter === 'overdue') {
          const hasOverdue = (mc1Status === 'overdue' || mc2Status === 'overdue') ||
            (row.date < todayStr && ((row.mc1 && !mc1Status?.startsWith('completed')) || (row.mc2 && !mc2Status?.startsWith('completed'))));
          if (!hasOverdue) return false;
        } else if (statusFilter === 'pending') {
          const hasPending = (row.mc1 && !mc1Status?.startsWith('completed')) || (row.mc2 && !mc2Status?.startsWith('completed'));
          if (!hasPending) return false;
        }
      }

      return true;
    });
  }, [pairedDailyRows, searchQuery, cycleFilter, statusFilter, todayStr, fiveDaysLaterStr]);

  // Filter flat tasks
  const filteredFlatTasks = useMemo(() => {
    return scheduledTasks.filter((task) => {
      const search = searchQuery.toLowerCase();
      const matchesSearch =
        task.taskCode.toLowerCase().includes(search) ||
        task.taskName.toLowerCase().includes(search) ||
        task.dueDate.includes(search) ||
        task.assignedUserName.toLowerCase().includes(search);

      if (!matchesSearch) return false;

      if (groupFilter !== 'all' && task.rotationGroup !== groupFilter) return false;
      if (cycleFilter !== 'all' && task.cycleNumber !== parseInt(cycleFilter, 10)) return false;

      if (statusFilter !== 'all') {
        if (statusFilter === 'due_today') {
          if (task.dueDate !== todayStr || task.status.startsWith('completed')) return false;
        } else if (statusFilter === 'upcoming') {
          // Today + upcoming 5 days task AND Previous all Pending Task
          const isTodayOrNext5Days = task.dueDate >= todayStr && task.dueDate <= fiveDaysLaterStr;
          const isPreviousPending = task.dueDate < todayStr && !task.status.startsWith('completed') && task.status !== 'cancelled';
          if (!isTodayOrNext5Days && !isPreviousPending) return false;
        } else if (statusFilter === 'completed') {
          if (!task.status.startsWith('completed')) return false;
        } else if (statusFilter === 'overdue') {
          if (task.dueDate >= todayStr || task.status.startsWith('completed')) return false;
        } else if (statusFilter === 'pending') {
          if (task.status.startsWith('completed') || task.status === 'cancelled') return false;
        }
      }

      return true;
    });
  }, [scheduledTasks, searchQuery, groupFilter, cycleFilter, statusFilter, todayStr, fiveDaysLaterStr]);

  // Metrics
  const totalDays = pairedDailyRows.length;
  const totalTasks = scheduledTasks.length;
  const completedTasks = scheduledTasks.filter((t) => t.status.startsWith('completed')).length;
  const overdueTasks = scheduledTasks.filter((t) => t.dueDate < todayStr && !t.status.startsWith('completed')).length;
  const todayTasks = scheduledTasks.filter((t) => t.dueDate === todayStr);
  const upcomingTasksCount = useMemo(() => {
    return scheduledTasks.filter((task) => {
      const isTodayOrNext5Days = task.dueDate >= todayStr && task.dueDate <= fiveDaysLaterStr;
      const isPreviousPending = task.dueDate < todayStr && !task.status.startsWith('completed') && task.status !== 'cancelled';
      return isTodayOrNext5Days || isPreviousPending;
    }).length;
  }, [scheduledTasks, todayStr, fiveDaysLaterStr]);

  // Pagination slice
  const totalItems = viewMode === 'paired' ? filteredPairedRows.length : filteredFlatTasks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedPairedRows = filteredPairedRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedFlatTasks = filteredFlatTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (task?: ScheduledTask) => {
    if (!task) return <span className="font-mono text-slate-400 font-bold">-</span>;

    if (task.status === 'completed_on_time') {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
          <CheckCircle className="h-3 w-3" /> Done (100)
        </span>
      );
    }
    if (task.status === 'completed_early') {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
          <CheckCircle className="h-3 w-3" /> Early ({task.score || 100})
        </span>
      );
    }
    if (task.status === 'completed_late') {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
          <Clock className="h-3 w-3" /> Late ({task.score || 80})
        </span>
      );
    }
    if (task.dueDate < todayStr) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
          <AlertTriangle className="h-3 w-3" /> Overdue
        </span>
      );
    }
    if (task.dueDate === todayStr) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
          <Clock className="h-3 w-3" /> Due Today
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
        Scheduled
      </span>
    );
  };

  const handleQuickComplete = (task: ScheduledTask) => {
    setActiveCompletingTask(task);
    setCompleteRemarks('Routine preventive maintenance completed per standard checklist.');
    setCompleteObservation('Machine running smoothly within vibration and temperature limits.');
  };

  const submitCompletion = () => {
    if (!activeCompletingTask) return;
    markTaskAsDone(activeCompletingTask.id, {
      remarks: completeRemarks,
      observation: completeObservation,
    });
    setActiveCompletingTask(null);
  };

  const exportCSV = () => {
    const headers = ['Date', 'Day', 'M/C 1 Machine', 'M/C 1 Status', 'M/C 2 Machine', 'M/C 2 Status', 'Cycle', 'Cycle Day', 'Doer', 'Department'];
    const rows = filteredPairedRows.map((r) => [
      r.date,
      r.dayName,
      `"${r.mc1?.taskName || '-'}"`,
      r.mc1?.status || 'None',
      `"${r.mc2?.taskName || '-'}"`,
      r.mc2?.status || 'None',
      `Cycle ${r.cycleNumber}`,
      `Day ${r.cycleDay}`,
      `"${r.mc1?.assignedUserName || 'Swapan Kr Ghorai'}"`,
      `"Yarn Division"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `YFL_Yarn_Maintenance_Schedule_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 uppercase tracking-wider">
              Yajur Fibres Limited • Yarn Division
            </span>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              17-Day Paired Rotation Active
            </span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            {title || 'Master Daily Machine Maintenance Schedule'}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {subtitle || 'Full year paired daily schedule for Swapan Kr Ghorai (M/C 1 and M/C 2 parallel groups, Sunday skipped).'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setViewMode('paired')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
                viewMode === 'paired' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Paired Daily (M/C 1 &amp; M/C 2)
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
                viewMode === 'flat' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Flat Tasks ({totalTasks})
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Working Days</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{totalDays}</p>
          <span className="text-[10px] text-slate-500">Sundays skipped</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Machine Tasks</span>
          <p className="text-xl font-bold text-blue-700 mt-1">{totalTasks}</p>
          <span className="text-[10px] text-blue-600">M/C 1 &amp; M/C 2 combined</span>
        </div>

        <div
          onClick={() => {
            setStatusFilter('upcoming');
            setCurrentPage(1);
          }}
          className={`cursor-pointer rounded-xl border p-4 shadow-xs transition-all ${
            statusFilter === 'upcoming'
              ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-200'
              : 'border-indigo-200 bg-white hover:border-indigo-400'
          }`}
        >
          <span className="text-[11px] font-bold text-indigo-900">Upcoming + Pending</span>
          <p className="text-xl font-black text-indigo-700 mt-1">{upcomingTasksCount}</p>
          <span className="text-[10px] text-indigo-800 font-semibold">Today + 5 Days &amp; Open Pending</span>
        </div>

        <div
          onClick={() => {
            setStatusFilter('due_today');
            setCurrentPage(1);
          }}
          className={`cursor-pointer rounded-xl border p-4 shadow-xs transition-all ${
            statusFilter === 'due_today'
              ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-200'
              : 'border-slate-200 bg-white hover:border-amber-400'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-600">Due Today</span>
          <p className="text-xl font-bold text-amber-700 mt-1">{todayTasks.length}</p>
          <span className="text-[10px] text-amber-800 font-mono">{todayStr}</span>
        </div>

        <div
          onClick={() => {
            setStatusFilter('overdue');
            setCurrentPage(1);
          }}
          className={`cursor-pointer rounded-xl border p-4 shadow-xs transition-all ${
            statusFilter === 'overdue'
              ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-200'
              : 'border-slate-200 bg-white hover:border-rose-400'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-600">Overdue Pending</span>
          <p className="text-xl font-bold text-rose-700 mt-1">{overdueTasks}</p>
          <span className="text-[10px] text-rose-800 font-semibold">Needs attention</span>
        </div>

        <div
          onClick={() => {
            setStatusFilter('completed');
            setCurrentPage(1);
          }}
          className={`cursor-pointer rounded-xl border p-4 shadow-xs transition-all ${
            statusFilter === 'completed'
              ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-200'
              : 'border-slate-200 bg-white hover:border-emerald-400'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-600">Completed Done</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">{completedTasks}</p>
          <span className="text-[10px] text-emerald-800">
            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completion
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search machine, date, code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming (Today + 5 Days &amp; Previous Pending) ({upcomingTasksCount})</option>
              <option value="due_today">Due Today ({todayTasks.length})</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed ({completedTasks})</option>
              <option value="overdue">Overdue ({overdueTasks})</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={cycleFilter}
              onChange={(e) => {
                setCycleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="all">All Cycles</option>
              <option value="1">Cycle 1 (Days 1 - 17)</option>
              <option value="2">Cycle 2 (Days 1 - 17)</option>
              <option value="3">Cycle 3 (Days 1 - 17)</option>
              <option value="4">Cycle 4 (Days 1 - 17)</option>
              <option value="5">Cycle 5 (Days 1 - 17)</option>
            </select>
          </div>

          {viewMode === 'flat' && (
            <div className="flex items-center gap-2">
              <select
                value={groupFilter}
                onChange={(e) => {
                  setGroupFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="all">All Groups (M/C 1 &amp; M/C 2)</option>
                <option value="MC1">Group 1 (M/C 1 - 17 Machines)</option>
                <option value="MC2">Group 2 (M/C 2 - 16 Machines)</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Rows per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
      </div>

      {statusFilter === 'upcoming' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/80 p-3.5 text-xs text-indigo-950 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-5 w-5 text-indigo-700 shrink-0" />
            <div>
              <span className="font-bold">Upcoming Maintenance Horizon (Today + 5 Days &amp; Previous Open Pending Tasks)</span>
              <span className="block text-[11px] text-indigo-800 mt-0.5">
                Displaying scheduled tasks for Today ({todayStr}), upcoming working days through {fiveDaysLaterStr}, plus all previous uncompleted/overdue tasks requiring technical action.
              </span>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('all')}
            className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-800 hover:bg-indigo-50 transition-colors shrink-0 shadow-2xs"
          >
            Show All Dates
          </button>
        </div>
      )}

      {/* Main Table Content */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {viewMode === 'paired' ? (
          /* Paired Daily View (M/C 1 & M/C 2 Parallel Columns) */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Day</th>
                  <th className="p-3">M/C 1 (Group 1)</th>
                  <th className="p-3 text-center">M/C 1 Status</th>
                  <th className="p-3">M/C 2 (Group 2)</th>
                  <th className="p-3 text-center">M/C 2 Status</th>
                  <th className="p-3 text-center">Cycle / Day</th>
                  <th className="p-3">Doer</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedPairedRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      No schedule records matched your filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedPairedRows.map((row, idx) => {
                    const isDay17 = row.cycleDay === 17;
                    const isToday = row.date === todayStr;

                    return (
                      <tr
                        key={row.date}
                        className={`transition-colors ${
                          isToday
                            ? 'bg-blue-50/70 font-semibold'
                            : isDay17
                            ? 'bg-amber-50/50'
                            : idx % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/40'
                        } hover:bg-slate-100/80`}
                      >
                        {/* Date */}
                        <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {row.date}
                          {isToday && (
                            <span className="ml-1.5 rounded bg-blue-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                              TODAY
                            </span>
                          )}
                        </td>

                        {/* Day */}
                        <td className="p-3 whitespace-nowrap">
                          <span className={`font-semibold ${row.dayName === 'Saturday' ? 'text-indigo-700 font-bold' : 'text-slate-800'}`}>
                            {row.dayName}
                          </span>
                        </td>

                        {/* M/C 1 */}
                        <td className="p-3">
                          {row.mc1 ? (
                            <div className="flex items-center gap-1.5">
                              <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 font-mono text-[10px] font-bold text-blue-800 shrink-0">
                                1
                              </span>
                              <span className="font-bold text-slate-900">{row.mc1.taskName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>

                        {/* M/C 1 Status */}
                        <td className="p-3 text-center whitespace-nowrap">
                          {getStatusBadge(row.mc1)}
                        </td>

                        {/* M/C 2 */}
                        <td className="p-3">
                          {row.mc2 ? (
                            <div className="flex items-center gap-1.5">
                              <span className="flex h-5 w-5 items-center justify-center rounded bg-purple-100 font-mono text-[10px] font-bold text-purple-800 shrink-0">
                                2
                              </span>
                              <span className="font-bold text-slate-900">{row.mc2.taskName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-slate-400 font-bold text-sm">-</span>
                              <span className="text-[10px] text-amber-700 font-medium italic">(Day 17 Spg-5 Solo)</span>
                            </div>
                          )}
                        </td>

                        {/* M/C 2 Status */}
                        <td className="p-3 text-center whitespace-nowrap">
                          {row.mc2 ? getStatusBadge(row.mc2) : <span className="font-mono text-slate-400">-</span>}
                        </td>

                        {/* Cycle / Day */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 mr-1">
                            C{row.cycleNumber}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              isDay17 ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            D{row.cycleDay}/17
                          </span>
                        </td>

                        {/* Doer */}
                        <td className="p-3 whitespace-nowrap text-slate-800 font-semibold">
                          {row.mc1?.assignedUserName || 'Swapan Kr Ghorai'}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {row.mc1 && (
                              <button
                                title="View/Complete M/C 1"
                                onClick={() => setSelectedTaskDetails(row.mc1!)}
                                className="rounded bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-800 hover:bg-blue-100 transition-colors"
                              >
                                M/C 1
                              </button>
                            )}
                            {row.mc2 && (
                              <button
                                title="View/Complete M/C 2"
                                onClick={() => setSelectedTaskDetails(row.mc2!)}
                                className="rounded bg-purple-50 px-2 py-1 text-[10px] font-bold text-purple-800 hover:bg-purple-100 transition-colors"
                              >
                                M/C 2
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
        ) : (
          /* Flat Task View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Task Code</th>
                  <th className="p-3">Group</th>
                  <th className="p-3">Machine / Task Name</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Day</th>
                  <th className="p-3 text-center">Cycle / Day</th>
                  <th className="p-3">Doer</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Score</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedFlatTasks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      No task records found.
                    </td>
                  </tr>
                ) : (
                  paginatedFlatTasks.map((task, idx) => (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        task.dueDate === todayStr ? 'bg-blue-50/50 font-semibold' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-slate-900">{task.taskCode}</td>
                      <td className="p-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            task.rotationGroup === 'MC1' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {task.rotationGroup}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{task.taskName}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">{task.dueDate}</td>
                      <td className="p-3">{task.dayName}</td>
                      <td className="p-3 text-center">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 mr-1">
                          C{task.cycleNumber}
                        </span>
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-800">
                          D{task.cycleDay}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{task.assignedUserName}</td>
                      <td className="p-3 text-center">{getStatusBadge(task)}</td>
                      <td className="p-3 text-center font-mono font-bold">
                        {task.score !== undefined ? (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              task.score >= 95
                                ? 'bg-emerald-100 text-emerald-800'
                                : task.score >= 80
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {task.score}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedTaskDetails(task)}
                          className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-200 transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-600">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <span className="font-bold text-slate-900">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Task Details & Completion Modal */}
      {selectedTaskDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      selectedTaskDetails.rotationGroup === 'MC1'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    Group {selectedTaskDetails.rotationGroup} • Pos {selectedTaskDetails.rotationPosition}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                    Cycle {selectedTaskDetails.cycleNumber}, Day {selectedTaskDetails.cycleDay} / 17
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedTaskDetails.taskName}</h2>
                <p className="text-xs text-slate-500 font-mono">
                  Task Code: {selectedTaskDetails.taskCode} • Due Date: {selectedTaskDetails.dueDate} ({selectedTaskDetails.dayName})
                </p>
              </div>
              <button
                onClick={() => setSelectedTaskDetails(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-3 text-xs">
              <div>
                <span className="text-slate-500 block">Assigned Doer:</span>
                <span className="font-bold text-slate-900">{selectedTaskDetails.assignedUserName}</span>
                <span className="text-[10px] text-slate-500 block">Employee ID: {selectedTaskDetails.assignedEmployeeId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Status:</span>
                <div className="mt-0.5">{getStatusBadge(selectedTaskDetails)}</div>
              </div>
            </div>

            {selectedTaskDetails.completedAt ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">Task Completed Details</span>
                  <span className="rounded bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                    Score: {selectedTaskDetails.score} / 100
                  </span>
                </div>
                <p className="text-slate-700">
                  <span className="font-semibold">Completed On:</span> {selectedTaskDetails.completedDate} at {selectedTaskDetails.completedTime}
                </p>
                {selectedTaskDetails.remarks && (
                  <p className="text-slate-700">
                    <span className="font-semibold">Remarks:</span> {selectedTaskDetails.remarks}
                  </p>
                )}
                {selectedTaskDetails.observation && (
                  <p className="text-slate-700">
                    <span className="font-semibold">Observations:</span> {selectedTaskDetails.observation}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border border-slate-200 p-4">
                <h3 className="text-xs font-bold text-slate-900">Mark This Machine Task Done</h3>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Technician Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Enter maintenance observations or checklist summary..."
                    value={completeRemarks}
                    onChange={(e) => setCompleteRemarks(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      markTaskAsDone(selectedTaskDetails.id, {
                        remarks: completeRemarks || 'Routine maintenance completed per standard checklist.',
                      });
                      setSelectedTaskDetails(null);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm Completion
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTaskDetails(null)}
                className="rounded-lg border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
