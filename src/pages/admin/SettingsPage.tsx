import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CloudUpload,
  Database,
  Flame,
  Flower2,
  Key,
  RefreshCw,
  RotateCcw,
  Save,
  Shield,
  Sliders,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import {
  getActiveFirebaseCredentials,
  getLastSyncTime,
  pullAllDataFromFirestore,
  pushAllDataToFirestore,
  saveFirebaseCredentials,
  testFirebaseConnection,
} from '../../services/firebase';
import { FirebaseCredentials } from '../../types';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, todayStr, setTodayStr, reloadFromStorage, refreshData } = useTasks();

  const [formData, setFormData] = useState({
    companyName: settings.companyName,
    divisionName: settings.divisionName,
    appTitle: settings.appTitle,
    tagline: settings.tagline,
    taskAdvanceVisibilityDays: settings.taskAdvanceVisibilityDays,
    monthEndPolicy: settings.monthEndPolicy,
    timezone: settings.timezone,
    workingDays: settings.workingDays,
  });

  // Firebase Credentials state
  const [fbCreds, setFbCreds] = useState<FirebaseCredentials>(() => getActiveFirebaseCredentials());
  const [fbStatus, setFbStatus] = useState<string | null>(null);
  const [fbLoading, setFbLoading] = useState(false);
  const [fbError, setFbError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(getLastSyncTime());

  const [simulatedDate, setSimulatedDate] = useState(todayStr);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSuccessMsg('System configuration and operational policies saved successfully.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    setFbError(null);
    setFbStatus(null);

    if (!fbCreds.apiKey || !fbCreds.projectId) {
      setFbError('API Key and Project ID are required.');
      return;
    }

    saveFirebaseCredentials(fbCreds);
    setFbStatus('Firebase credentials saved successfully to browser storage and environment.');
    setTimeout(() => setFbStatus(null), 4000);
  };

  const handleTestFirebase = async () => {
    setFbLoading(true);
    setFbError(null);
    setFbStatus(null);
    saveFirebaseCredentials(fbCreds);

    const res = await testFirebaseConnection(fbCreds);
    setFbLoading(false);
    if (res.success) {
      setFbStatus(res.message);
    } else {
      setFbError(res.message);
    }
  };

  const handleSyncToFirestore = async () => {
    setFbLoading(true);
    setFbError(null);
    setFbStatus(null);
    saveFirebaseCredentials(fbCreds);

    const res = await pushAllDataToFirestore();
    setFbLoading(false);
    if (res.success) {
      setFbStatus(res.message);
      setLastSync(getLastSyncTime());
    } else {
      setFbError(res.message);
    }
  };

  const handleSyncFromFirestore = async () => {
    setFbLoading(true);
    setFbError(null);
    setFbStatus(null);
    saveFirebaseCredentials(fbCreds);

    const res = await pullAllDataFromFirestore();
    setFbLoading(false);
    if (res.success) {
      setFbStatus(res.message);
      setLastSync(getLastSyncTime());
      refreshData();
    } else {
      setFbError(res.message);
    }
  };

  const handleApplyDateSimulation = () => {
    setTodayStr(simulatedDate);
    setSuccessMsg(`Simulated factory date updated to ${simulatedDate}. Task due dates, overdue statuses, and score calculations have been dynamically re-evaluated.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset system settings to Yajur Fibres Limited factory defaults?')) {
      localStorage.clear();
      reloadFromStorage();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Lotus Theme */}
      <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-linear-to-r from-rose-50/70 via-pink-50/40 to-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-bold text-rose-800 uppercase tracking-wider">
              <Flower2 className="h-3.5 w-3.5 text-pink-600" />
              Lotus System Configuration
            </span>
          </div>
          <h1 className="text-xl font-black text-rose-950 sm:text-2xl mt-0.5">
            Factory Settings &amp; Firebase Cloud Database
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Configure enterprise parameters, advance task visibility window, recurrence policies, and real-time Firebase credentials.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-50 transition-colors shadow-2xs"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Factory Sample Data
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-900">
          <CheckCircle2 className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Date Simulation Bar */}
      <div className="rounded-xl border border-rose-200 bg-linear-to-r from-rose-50/60 to-pink-50/60 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-rose-700" />
              Factory Date Simulation Sandbox
            </span>
            <p className="text-xs text-slate-600 mt-0.5">
              Change the active factory date to simulate schedule progression across the entire 1-year timeline (e.g. October 2026, January 2027).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={simulatedDate}
              onChange={(e) => setSimulatedDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-rose-500 focus:outline-hidden"
            />
            <button
              onClick={handleApplyDateSimulation}
              className="rounded-lg bg-rose-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-800 shadow-xs transition-colors"
            >
              Apply Simulated Date
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Firebase Cloud Database & All Credentials Section */}
      <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-rose-600 text-white shadow-xs">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-rose-950">Firebase Firestore Cloud Database Credentials</h2>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
                  Real-Time Sync Ready
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Manage all 6 Firebase credentials (API Key, Auth Domain, Project ID, Storage Bucket, Messaging Sender ID, App ID).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={fbLoading}
              onClick={handleTestFirebase}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-50"
            >
              <Database className="h-3.5 w-3.5 text-rose-600" />
              {fbLoading ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              type="button"
              disabled={fbLoading}
              onClick={handleSyncToFirestore}
              className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-rose-700 to-pink-700 px-3.5 py-2 text-xs font-bold text-white hover:from-rose-800 hover:to-pink-800 shadow-xs disabled:opacity-50"
            >
              <CloudUpload className="h-3.5 w-3.5" />
              Sync All Data to Cloud
            </button>
          </div>
        </div>

        {fbStatus && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs font-bold text-rose-900">
            <CheckCircle2 className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{fbStatus}</span>
          </div>
        )}

        {fbError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-900">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{fbError}</span>
          </div>
        )}

        <form onSubmit={handleSaveFirebase} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                API Key (apiKey) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={fbCreds.apiKey}
                onChange={(e) => setFbCreds({ ...fbCreds, apiKey: e.target.value })}
                required
                placeholder="AIzaSy..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Auth Domain (authDomain)
              </label>
              <input
                type="text"
                value={fbCreds.authDomain}
                onChange={(e) => setFbCreds({ ...fbCreds, authDomain: e.target.value })}
                placeholder="project-id.firebaseapp.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project ID (projectId) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={fbCreds.projectId}
                onChange={(e) => setFbCreds({ ...fbCreds, projectId: e.target.value })}
                required
                placeholder="yajur-fibres-lotus"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Storage Bucket (storageBucket)
              </label>
              <input
                type="text"
                value={fbCreds.storageBucket}
                onChange={(e) => setFbCreds({ ...fbCreds, storageBucket: e.target.value })}
                placeholder="project-id.appspot.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Messaging Sender ID (messagingSenderId)
              </label>
              <input
                type="text"
                value={fbCreds.messagingSenderId}
                onChange={(e) => setFbCreds({ ...fbCreds, messagingSenderId: e.target.value })}
                placeholder="1029384756"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                App ID (appId)
              </label>
              <input
                type="text"
                value={fbCreds.appId}
                onChange={(e) => setFbCreds({ ...fbCreds, appId: e.target.value })}
                placeholder="1:1029384756:web:abcd123"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-500">
              {lastSync ? `Last cloud sync: ${new Date(lastSync).toLocaleString()}` : 'No sync recorded yet.'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={fbLoading}
                onClick={handleSyncFromFirestore}
                className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3.5 py-2 text-xs font-bold text-rose-800 hover:bg-rose-50 shadow-2xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Pull From Firestore
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 shadow-xs"
              >
                <Save className="h-3.5 w-3.5" />
                Save Firebase Credentials
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Organization Details */}
          <div className="rounded-xl border border-rose-100 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
              <Building2 className="h-4 w-4 text-rose-700" />
              <h2 className="text-sm font-bold text-slate-900">Organization &amp; Lotus Branding</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Division Name</label>
              <input
                type="text"
                value={formData.divisionName}
                onChange={(e) => setFormData({ ...formData, divisionName: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Application Subtitle</label>
              <input
                type="text"
                value={formData.appTitle}
                onChange={(e) => setFormData({ ...formData, appTitle: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-rose-500"
              />
            </div>
          </div>

          {/* Operational Policies */}
          <div className="rounded-xl border border-rose-100 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
              <Sliders className="h-4 w-4 text-rose-700" />
              <h2 className="text-sm font-bold text-slate-900">Operational &amp; Scheduling Parameters</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technician Advance Visibility Window (Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.taskAdvanceVisibilityDays}
                onChange={(e) => setFormData({ ...formData, taskAdvanceVisibilityDays: Number(e.target.value) })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-rose-500"
              />
              <p className="text-[11px] text-slate-600 mt-1">
                Technicians see tasks due today plus upcoming tasks within this many days (Default: 5 days).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Month-End Date Roll Policy
              </label>
              <select
                value={formData.monthEndPolicy}
                onChange={(e) => setFormData({ ...formData, monthEndPolicy: e.target.value as any })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-rose-500"
              >
                <option value="last_day_of_month">Last Day of Month (Feb 28/29, Apr 30)</option>
                <option value="skip_month">Skip Non-existent Days</option>
                <option value="exact_day_clamp">Exact Day Clamp</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Factory Timezone</label>
              <input
                type="text"
                disabled
                value={formData.timezone}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-600 bg-slate-100 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-600 mt-1">
                Fixed standard timezone for Indian industrial mills (IST UTC+05:30).
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-rose-700 to-pink-700 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:from-rose-800 hover:to-pink-800 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save Configuration Changes
          </button>
        </div>
      </form>
    </div>
  );
};
