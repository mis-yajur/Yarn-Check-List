import React from 'react';
import {
  AlertTriangle,
  Award,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Clock,
  Cpu,
  FileSpreadsheet,
  FileText,
  Flame,
  Flower2,
  History,
  LayoutDashboard,
  ListTodo,
  Settings,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  isOpen?: boolean;
  isOpenMobile?: boolean;
  onClose?: () => void;
  onCloseMobile?: () => void;
  onOpenFirebase: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isOpen,
  isOpenMobile,
  onClose,
  onCloseMobile,
  onOpenFirebase,
}) => {
  const showMobile = isOpen ?? isOpenMobile ?? false;
  const handleClose = onClose || onCloseMobile || (() => {});
  const { currentUser, isAdmin } = useAuth();
  const { scheduledTasks, todayStr } = useTasks();

  // Compute live badges
  const userTasks = isAdmin
    ? scheduledTasks
    : scheduledTasks.filter((s) => s.assignedUserId === currentUser?.id);

  const dueTodayCount = userTasks.filter((s) => s.status === 'due_today').length;
  const overdueCount = userTasks.filter((s) => s.status === 'overdue').length;

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Task Management', icon: ListTodo },
    { id: 'scheduler', label: 'Yearly Scheduler', icon: CalendarDays },
    { id: 'master-schedule', label: 'Master Schedule', icon: Calendar },
    {
      id: 'due-today',
      label: "Today's Tasks",
      icon: Clock,
      badge: dueTodayCount > 0 ? dueTodayCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-300 font-bold',
    },
    { id: 'upcoming', label: 'Upcoming Tasks', icon: CalendarDays },
    {
      id: 'overdue',
      label: 'Overdue Tasks',
      icon: AlertTriangle,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold',
    },
    { id: 'done', label: 'Done Tasks', icon: CheckCircle2 },
    { id: 'users', label: 'Users / Doers', icon: Users },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'templates', label: 'Checklist Templates', icon: CheckSquare },
    { id: 'scorecards', label: 'Scorecards & KPIs', icon: Award },
    { id: 'machine-history', label: 'Machine History', icon: Cpu },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
    { id: 'audit-logs', label: 'Audit Logs', icon: History },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const doerNav = [
    { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    {
      id: 'my-tasks',
      label: 'My Tasks (Next 5 Days)',
      icon: ListTodo,
      badge: dueTodayCount > 0 ? dueTodayCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-300 font-bold',
    },
    {
      id: 'overdue',
      label: 'Overdue Tasks',
      icon: AlertTriangle,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold',
    },
    { id: 'done', label: 'Done Tasks History', icon: CheckCircle2 },
    { id: 'my-score', label: 'My Scorecard', icon: Award },
    { id: 'machine-history', label: 'Machine Maintenance Log', icon: Cpu },
  ];

  const navItems = isAdmin ? adminNav : doerNav;

  const handleItemClick = (id: string) => {
    onSelectView(id);
    handleClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {showMobile && (
        <div
          onClick={handleClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Content - Bright Lotus Executive Theme */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-rose-200/90 bg-white text-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          showMobile ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col shadow-sm`}
      >
        {/* Department Banner in Sidebar with Lotus Pink branding */}
        <div className="border-b border-rose-100 px-4 py-3 bg-linear-to-r from-rose-50 via-pink-50/50 to-rose-50/80">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-600 text-white shadow-2xs">
              <Flower2 className="h-3.5 w-3.5" />
            </div>
            <p className="text-[11px] font-bold tracking-wider text-rose-900 uppercase">
              Lotus Theme • Yarn Plant
            </p>
          </div>
          <p className="text-xs font-black text-slate-900 mt-1">Yajur Fibres Limited</p>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-600">
            <span className="font-medium">Active Role:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[10px] tracking-wide ${
                isAdmin
                  ? 'bg-rose-100 text-rose-900 border border-rose-200'
                  : 'bg-blue-100 text-blue-900 border border-blue-200'
              }`}
            >
              {isAdmin ? 'ADMINISTRATOR' : 'DOER / TECH'}
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-bold text-rose-800/80 uppercase tracking-wider">
            {isAdmin ? 'Management Modules' : 'Technician Tasks'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleItemClick(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-linear-to-r from-rose-700 via-rose-800 to-pink-700 text-white font-bold shadow-sm shadow-rose-700/20'
                    : 'text-slate-700 hover:bg-rose-50 hover:text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                      isActive ? 'bg-white/20 text-white font-bold' : item.badgeColor || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Firebase Quick Button in sidebar */}
          <div className="pt-2">
            <button
              onClick={() => {
                onOpenFirebase();
                handleClose();
              }}
              className="flex w-full items-center justify-between rounded-xl border border-rose-200 bg-linear-to-r from-rose-50 to-pink-50 px-3 py-2 text-xs font-bold text-rose-900 hover:bg-rose-100 hover:border-rose-300 transition-colors shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500 fill-amber-400" />
                <span>Firebase Cloud Sync</span>
              </div>
              <span className="rounded-full bg-rose-200/80 px-2 py-0.5 text-[9px] font-bold text-rose-900 border border-rose-300">
                Connected
              </span>
            </button>
          </div>
        </nav>

        {/* Footer info in sidebar */}
        <div className="border-t border-rose-100 p-3.5 bg-slate-50/80">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Flower2 className="h-3.5 w-3.5 text-rose-700" />
              Lotus Edition v2.4
            </span>
            <span className="text-rose-700 font-bold flex items-center gap-1 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
              Active
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">
            Yajur Fibres Limited • Yarn Division
          </p>
        </div>
      </aside>
    </>
  );
};
