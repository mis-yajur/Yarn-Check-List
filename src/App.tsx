import React, { useState } from 'react';
import { Flower2 } from 'lucide-react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BulkImportModal } from './components/modals/BulkImportModal';
import { ChangePasswordModal } from './components/modals/ChangePasswordModal';
import { FirebaseModal } from './components/modals/FirebaseModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ChecklistsPage } from './pages/admin/ChecklistsPage';
import { MasterSchedulePage } from './pages/admin/MasterSchedulePage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { SchedulerEnginePage } from './pages/admin/SchedulerEnginePage';
import { ScorecardsPage } from './pages/admin/ScorecardsPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { TaskManagementPage } from './pages/admin/TaskManagementPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { LoginPage } from './pages/auth/LoginPage';
import { DoneTasksPage } from './pages/shared/DoneTasksPage';
import { MyTasksPage } from './pages/user/MyTasksPage';
import { UserDashboard } from './pages/user/UserDashboard';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('yfl_app_theme') || 'lotus-rose';
  });

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('yfl_app_theme', newTheme);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-rose-50 to-pink-50 text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-rose-700 via-rose-800 to-pink-700 text-white shadow-xl animate-pulse">
            <Flower2 className="h-8 w-8" />
          </div>
          <p className="text-sm font-black tracking-tight text-rose-950">
            YAJUR FIBRES LIMITED
          </p>
          <p className="text-xs font-bold text-rose-800">
            Loading Lotus Task Management System...
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
            onOpenFirebase={() => setIsFirebaseOpen(true)}
          />
        ) : (
          <UserDashboard onNavigate={(view) => setCurrentView(view)} />
        );

      case 'my-tasks':
        return <MyTasksPage filterType="all" />;

      case 'due-today':
        return isAdmin ? (
          <MasterSchedulePage />
        ) : (
          <MyTasksPage filterType="due_today" />
        );

      case 'upcoming':
        return isAdmin ? (
          <MasterSchedulePage />
        ) : (
          <MyTasksPage filterType="upcoming" />
        );

      case 'overdue':
        return isAdmin ? (
          <MasterSchedulePage />
        ) : (
          <MyTasksPage filterType="overdue" />
        );

      case 'tasks':
        return <TaskManagementPage onOpenImport={() => setIsBulkImportOpen(true)} />;

      case 'master-schedule':
      case 'machine-history':
        return <MasterSchedulePage />;

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
        return <TaskManagementPage onOpenImport={() => setIsBulkImportOpen(true)} />;

      case 'reports':
        return <ReportsPage />;

      case 'settings':
      case 'audit-logs':
        return <SettingsPage />;

      default:
        return isAdmin ? (
          <AdminDashboard
            onNavigate={(view) => setCurrentView(view)}
            onOpenNewTask={() => setCurrentView('tasks')}
            onOpenFirebase={() => setIsFirebaseOpen(true)}
          />
        ) : (
          <UserDashboard onNavigate={(view) => setCurrentView(view)} />
        );
    }
  };

  const themeClasses = {
    'lotus-rose': 'bg-slate-50/90 text-slate-900',
    'lotus-vibrant': 'bg-rose-50/40 text-slate-900',
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
        onOpenFirebase={() => setIsFirebaseOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-64">
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenChangePassword={() => setIsChangePasswordOpen(false)}
          onOpenFirebase={() => setIsFirebaseOpen(true)}
          currentTheme={theme}
          onSelectTheme={handleThemeChange}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{renderView()}</div>
        </main>
      </div>

      {/* Global Modals */}
      {isFirebaseOpen && (
        <FirebaseModal
          isOpen={isFirebaseOpen}
          onClose={() => setIsFirebaseOpen(false)}
        />
      )}

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
