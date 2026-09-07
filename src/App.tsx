import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BulkImportModal } from './components/modals/BulkImportModal';
import { ChangePasswordModal } from './components/modals/ChangePasswordModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { ChecklistsPage } from './pages/admin/ChecklistsPage';
import { DepartmentsPage } from './pages/admin/DepartmentsPage';
import { HolidayMasterPage } from './pages/admin/HolidayMasterPage';
import { MasterSchedulePage } from './pages/admin/MasterSchedulePage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { SchedulerEnginePage } from './pages/admin/SchedulerEnginePage';
import { ScorecardsPage } from './pages/admin/ScorecardsPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { TaskManagementPage } from './pages/admin/TaskManagementPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { LoginPage } from './pages/auth/LoginPage';
import { DoneTasksPage } from './pages/shared/DoneTasksPage';
import { MachineHistoryPage } from './pages/shared/MachineHistoryPage';
import { MyTasksPage } from './pages/user/MyTasksPage';
import { UserDashboard } from './pages/user/UserDashboard';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [theme, setTheme] = useState<string>(() => {
    const saved = localStorage.getItem('yfl_app_theme');
    if (saved === 'vibrant-rose' || saved === 'yarn-classic') {
      return saved;
    }
    return 'corporate-rose';
  });

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('yfl_app_theme', newTheme);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-rose-50 to-pink-50 text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-rose-700 via-rose-800 to-pink-700 text-white shadow-xl">
            <Building2 className="h-8 w-8" />
          </div>
          <p className="text-sm font-black tracking-tight text-rose-950">
            YAJUR FIBRES LIMITED
          </p>
          <p className="text-xs font-bold text-rose-800">
            Loading Task Management System...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return isAdmin ? (
          <AdminDashboard
            onNavigate={(view) => setCurrentView(view)}
            onOpenNewTask={() => setCurrentView('tasks')}
          />
        ) : (
          <UserDashboard onNavigate={(view) => setCurrentView(view)} />
        );

      case 'my-tasks':
        return <MyTasksPage filterType="all" />;

      case 'due-today':
        return isAdmin ? (
          <MasterSchedulePage
            initialFilter="due_today"
            title="Today's Maintenance Tasks"
            subtitle="Preventive maintenance schedules strictly due today for verification."
          />
        ) : (
          <MyTasksPage filterType="due_today" />
        );

      case 'upcoming':
        return isAdmin ? (
          <MasterSchedulePage
            initialFilter="upcoming"
            title="Upcoming & Pending Maintenance Tasks"
            subtitle="Showing Today's tasks + next 5 days upcoming tasks + all previous pending/overdue maintenance tasks."
          />
        ) : (
          <MyTasksPage filterType="upcoming" />
        );

      case 'overdue':
        return isAdmin ? (
          <MasterSchedulePage
            initialFilter="overdue"
            title="Overdue Maintenance Tasks"
            subtitle="Critical delayed machine maintenance tasks requiring immediate technical intervention and audit."
          />
        ) : (
          <MyTasksPage filterType="overdue" />
        );

      case 'tasks':
        return <TaskManagementPage onOpenImport={() => setIsBulkImportOpen(true)} />;

      case 'master-schedule':
        return <MasterSchedulePage initialFilter="all" />;

      case 'holidays':
        return <HolidayMasterPage />;

      case 'machine-history':
        return <MachineHistoryPage />;

      case 'done':
        return <DoneTasksPage />;

      case 'scheduler':
        return <SchedulerEnginePage />;

      case 'scorecards':
      case 'my-score':
        return <ScorecardsPage />;

      case 'users':
        return <UserManagementPage />;

      case 'checklists':
      case 'templates':
        return <ChecklistsPage />;

      case 'departments':
        return <DepartmentsPage />;

      case 'reports':
        return <ReportsPage />;

      case 'audit-logs':
        return <AuditLogsPage />;

      case 'settings':
        return <SettingsPage />;

      default:
        return isAdmin ? (
          <AdminDashboard
            onNavigate={(view) => setCurrentView(view)}
            onOpenNewTask={() => setCurrentView('tasks')}
          />
        ) : (
          <UserDashboard onNavigate={(view) => setCurrentView(view)} />
        );
    }
  };

  const themeClasses = {
    'corporate-rose': 'bg-slate-50/90 text-slate-900',
    'vibrant-rose': 'bg-rose-50/40 text-slate-900',
    'yarn-classic': 'bg-slate-100 text-slate-900',
  }[theme] || 'bg-slate-50/90 text-slate-900';

  return (
    <div className={`flex min-h-screen ${themeClasses} font-sans antialiased`}>
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => setCurrentView(view)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-64">
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenChangePassword={() => setIsChangePasswordOpen(false)}
          currentTheme={theme}
          onSelectTheme={handleThemeChange}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{renderView()}</div>
        </main>
      </div>

      {/* Global Modals */}
      {isChangePasswordOpen && (
        <ChangePasswordModal onClose={() => setIsChangePasswordOpen(false)} />
      )}

      {isBulkImportOpen && (
        <BulkImportModal
          onClose={() => setIsBulkImportOpen(false)}
          onSuccess={(count) => {
            setCurrentView('tasks');
          }}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <MainLayout />
      </TaskProvider>
    </AuthProvider>
  );
}

export default App;
