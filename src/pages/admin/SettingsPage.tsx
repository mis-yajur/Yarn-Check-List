import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Key,
  RotateCcw,
  Save,
  Shield,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { generateInitialTaskMasters, generateInitialScheduledTasks, storage } from '../../services/storage';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, todayStr, setTodayStr, reloadFromStorage, clearAllData } = useTasks();

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

  const [simulatedDate, setSimulatedDate] = useState(todayStr);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSuccessMsg('System configuration and operational policies saved successfully.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleApplyDateSimulation = () => {
    setTodayStr(simulatedDate);
    setSuccessMsg(`Simulated factory date updated to ${simulatedDate}. Task due dates, overdue statuses, and score calculations have been dynamically re-evaluated.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all tasks and start with an empty slate?')) {
      clearAllData();
      setSuccessMsg('All tasks cleared successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleRestoreLive33 = () => {
    if (confirm('Load/Restore the 33 live Yarn Division machines and 1-year schedules?')) {
      const masters = generateInitialTaskMasters();
      const schedules = generateInitialScheduledTasks(masters, settings.taskAdvanceVisibilityDays || 5);
      storage.saveTaskMasters(masters);
      storage.saveScheduledTasks(schedules);
      reloadFromStorage();
      setSuccessMsg('Successfully loaded 33 live Yarn Division machines and 1-year recurring maintenance schedules.');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-linear-to-r from-rose-50/70 via-pink-50/40 to-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-bold text-rose-800 uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5 text-rose-700" />
              System Configuration
            </span>
          </div>
          <h1 className="text-xl font-black text-rose-950 sm:text-2xl mt-0.5">
            Factory &amp; Operations Settings
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Configure enterprise parameters, advance task visibility window, recurrence policies, and operational schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRestoreLive33}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
          >
            <Sparkles className="h-4 w-4 text-emerald-700" />
            Load 33 Live Machines
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-50 transition-colors shadow-2xs"
          >
            <RotateCcw className="h-4 w-4" />
            Clear All Tasks
          </button>
        </div>
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

      {/* Configuration Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Organization Details */}
          <div className="rounded-xl border border-rose-100 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
              <Building2 className="h-4 w-4 text-rose-700" />
              <h2 className="text-sm font-bold text-slate-900">Organization Details</h2>
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
