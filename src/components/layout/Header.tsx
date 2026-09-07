import React, { useState } from 'react';
import {
  Bell,
  CheckCircle,
  ChevronDown,
  Clock,
  Database,
  Flame,
  Flower2,
  Key,
  LogOut,
  Menu,
  Palette,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { getActiveFirebaseCredentials } from '../../services/firebase';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenChangePassword: () => void;
  onOpenFirebase: () => void;
  currentTheme?: string;
  onSelectTheme?: (theme: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenChangePassword,
  onOpenFirebase,
  currentTheme = 'lotus-rose',
  onSelectTheme,
}) => {
  const { currentUser, logout, quickSwitchUser } = useAuth();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, todayStr, users } = useTasks();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const fbCreds = getActiveFirebaseCredentials();
  const unreadNotifs = notifications.filter(
    (n) => !n.isRead && (currentUser?.role === 'admin' || n.userId === currentUser?.id)
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-rose-200/80 bg-white/95 backdrop-blur-md px-4 shadow-xs lg:px-6">
      <div className="flex items-center gap-3">
        <button
          id="btn-sidebar-toggle"
          onClick={onToggleSidebar}
          className="rounded-md p-2 text-slate-600 hover:bg-rose-50 hover:text-rose-800 lg:hidden focus:outline-hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          {/* Sacred Lotus Flower Emblem */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-rose-600 via-rose-700 to-pink-700 text-white shadow-xs ring-2 ring-rose-400/30">
            <Flower2 className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-rose-950 text-sm sm:text-base">
                YAJUR FIBRES LIMITED
              </span>
              <span className="hidden rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200 sm:inline-block">
                LOTUS THEME
              </span>
              <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 sm:inline-block">
                YARN DIVISION
              </span>
            </div>
            <p className="hidden text-[11px] text-slate-600 sm:block">
              Checklist, Preventive Maintenance &amp; Automatic Task Scheduling System
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Firebase Cloud Sync Button */}
        <button
          id="btn-header-firebase-modal"
          onClick={onOpenFirebase}
          title={`Connected to Firestore project: ${fbCreds.projectId}`}
          className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-linear-to-r from-rose-50 to-pink-50 px-2.5 py-1.5 text-xs font-bold text-rose-800 hover:border-rose-300 hover:bg-rose-100 transition-colors shadow-2xs"
        >
          <Flame className="h-4 w-4 text-amber-500 fill-amber-400" />
          <span className="hidden sm:inline">Firebase Cloud</span>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600"></span>
          </span>
        </button>

        {/* Factory Date & Time Display */}
        <div className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 md:flex">
          <Clock className="h-3.5 w-3.5 text-rose-700" />
          <span>Factory Date: <strong className="text-slate-900">{todayStr}</strong> (Asia/Kolkata)</span>
        </div>

        {/* Theme Picker Selector */}
        {onSelectTheme && (
          <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 py-1.5 text-xs text-rose-950 font-bold shadow-2xs">
            <Palette className="h-3.5 w-3.5 text-rose-700" />
            <select
              id="select-active-theme"
              value={currentTheme}
              onChange={(e) => onSelectTheme(e.target.value)}
              className="bg-transparent text-xs font-bold text-rose-900 focus:outline-hidden cursor-pointer"
              title="Select Visual Theme"
            >
              <option value="lotus-rose">🌸 Lotus Rose Corporate</option>
              <option value="lotus-vibrant">🌺 Lotus Vivid Mill</option>
              <option value="yarn-classic">🧵 Yarn Division Steel</option>
            </select>
          </div>
        )}

        {/* Quick Role / User Switcher for immediate testing */}
        <div className="relative hidden sm:block">
          <select
            id="select-quick-switch-user"
            value={currentUser?.id || ''}
            onChange={(e) => quickSwitchUser(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-rose-400 focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
            title="Switch user to test Admin or Doer views"
          >
            <option disabled value="">Switch Persona</option>
            {users.map((u) => (
              <option key={u.id} value={u.id} disabled={u.status === 'suspended'}>
                {u.role === 'admin' ? '🛡️ [Admin]' : '🔧 [Doer]'} {u.name} ({u.employeeId})
                {u.status === 'suspended' ? ' (Suspended)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            id="btn-notifications-toggle"
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative rounded-lg p-2 text-slate-600 hover:bg-rose-50 hover:text-rose-800 focus:outline-hidden"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-rose-200 bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                  Notifications ({unreadNotifs.length} new)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] font-medium text-rose-700 hover:underline"
                  >
                    Mark all read
                  </button>
                  <button onClick={() => setShowNotifs(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-1">
                {notifications.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-500">No notifications.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-2.5 transition-colors cursor-pointer rounded-lg ${
                        n.isRead ? 'bg-white opacity-75' : 'bg-rose-50/70 border border-rose-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-900">{n.title}</span>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-rose-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                      <span className="text-[9px] text-slate-400 block mt-1">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            id="btn-user-profile-menu"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg p-1.5 text-slate-700 hover:bg-rose-50 focus:outline-hidden"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-rose-100 to-pink-200 text-xs font-black text-rose-900 border border-rose-300">
              {currentUser?.name.substring(0, 2).toUpperCase() || 'YF'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-bold leading-tight text-slate-900">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                {currentUser?.role === 'admin' ? (
                  <span className="font-semibold text-rose-700">Administrator</span>
                ) : (
                  <span className="font-semibold text-blue-700">Doer ({currentUser?.employeeId})</span>
                )}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-rose-100 bg-white py-1 shadow-lg z-50">
              <div className="border-b border-slate-100 px-3 py-2 bg-rose-50/50">
                <p className="text-xs font-bold text-slate-900">{currentUser?.name}</p>
                <p className="text-[11px] text-slate-600">{currentUser?.designation}</p>
                <p className="text-[10px] text-slate-500 font-mono">{currentUser?.email}</p>
              </div>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenFirebase();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-rose-800 hover:bg-rose-50"
              >
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                Firebase Credentials &amp; Sync
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenChangePassword();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Key className="h-3.5 w-3.5 text-slate-500" />
                Change Password
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 border-t border-slate-100"
              >
                <LogOut className="h-3.5 w-3.5 text-red-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
