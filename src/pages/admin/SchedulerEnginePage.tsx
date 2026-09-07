import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Cpu,
  Download,
  Info,
  Layers,
  Play,
  RefreshCw,
  Repeat,
  Settings2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import {
  generateYflDualRotationSchedule,
  getFrequencySummary,
} from '../../services/recurrenceEngine';
import { Holiday, RotationGroup } from '../../types';

export const SchedulerEnginePage: React.FC = () => {
  const { taskMasters, scheduledTasks, holidays, generateYflRotationSchedule, settings, updateSettings, todayStr } = useTasks();

  const [startDate, setStartDate] = useState<string>('2026-07-04');
  const [horizonOption, setHorizonOption] = useState<'3_months' | '6_months' | '1_year' | 'custom'>('1_year');
  const [customDays, setCustomDays] = useState<number>(365);
  const [skipSundays, setSkipSundays] = useState<boolean>(true);
  const [skipHolidays, setSkipHolidays] = useState<boolean>(true);
  const [previewFilterCycle, setPreviewFilterCycle] = useState<string>('all');
  const [generationLog, setGenerationLog] = useState<{ text: string; count: number; days: number } | null>(null);

  const durationDays = useMemo(() => {
    if (horizonOption === '3_months') return 90;
    if (horizonOption === '6_months') return 180;
    if (horizonOption === '1_year') return 365;
    return customDays;
  }, [horizonOption, customDays]);

  // Live preview calculation using current form settings
  const previewResult = useMemo(() => {
    return generateYflDualRotationSchedule(taskMasters, {
      startDate,
      durationDays,
      holidays,
      skipHolidays,
      skipSundays,
    });
  }, [taskMasters, startDate, durationDays, holidays, skipHolidays, skipSundays]);

  const filteredPreviewRows = useMemo(() => {
    if (previewFilterCycle === 'all') return previewResult.dailyRows;
    const cycleNum = parseInt(previewFilterCycle, 10);
    return previewResult.dailyRows.filter((r) => r.cycleNumber === cycleNum);
  }, [previewResult.dailyRows, previewFilterCycle]);

  const handleGenerate = (days: number, label: string) => {
    const res = generateYflRotationSchedule({
      startDate,
      durationDays: days,
      skipHolidays,
      skipSundays,
    });

    if (res.success && res.result) {
      setGenerationLog({
        text: `Successfully generated ${label} maintenance schedule!`,
        count: res.result.totalTaskRecords,
        days: res.result.totalWorkingDays,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 uppercase tracking-wider">
              Yajur Fibres Limited • Yarn Division
            </span>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Accurate 17-Day Dual Rotation Engine
            </span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            Yearly Daily Machine Maintenance Schedule Generator
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Strict 17-working-day paired rotation across Machine Group 1 (M/C 1: 17 machines) and Machine Group 2 (M/C 2: 16 machines). Sunday is always skipped, and Cycle Day 17 schedules Spg-5 alone before restarting both groups together.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-gen-3mo"
            onClick={() => handleGenerate(90, '3-Month')}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Generate 3 Months
          </button>
          <button
            id="btn-gen-6mo"
            onClick={() => handleGenerate(180, '6-Month')}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Generate 6 Months
          </button>
          <button
            id="btn-generate-1yr"
            onClick={() => handleGenerate(365, '1-Year')}
            className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors"
          >
            <Play className="h-4 w-4 fill-white" />
            Generate 1-Year Schedule
          </button>
        </div>
      </div>

      {generationLog && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">{generationLog.text}</span>
              <span className="block text-[11px] text-emerald-700 mt-0.5">
                Saved {generationLog.count} individual machine task occurrences across {generationLog.days} working days to the Master Schedule.
              </span>
            </div>
          </div>
          <button onClick={() => setGenerationLog(null)} className="font-bold text-emerald-800 hover:underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Rotation Parameters Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Settings2 className="h-4 w-4 text-emerald-800" />
          <h2 className="text-sm font-bold text-slate-900">Rotation Template &amp; Engine Configuration</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
            <input
              type="text"
              readOnly
              value="Yarn Division"
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assigned Doer</label>
            <input
              type="text"
              readOnly
              value="Swapan Kr Ghorai (YFL-084)"
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Schedule Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Schedule Horizon</label>
            <select
              value={horizonOption}
              onChange={(e) => setHorizonOption(e.target.value as any)}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="3_months">3 Months (90 Days)</option>
              <option value="6_months">6 Months (180 Days)</option>
              <option value="1_year">1 Year (365 Days / ~313 Working Days)</option>
              <option value="custom">Custom Days</option>
            </select>
          </div>
        </div>

        {horizonOption === 'custom' && (
          <div className="w-48">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duration (Days)</label>
            <input
              type="number"
              value={customDays}
              onChange={(e) => setCustomDays(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>
        )}

        {/* Working Days & Holiday Handling Options */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 cursor-pointer hover:bg-slate-100/70">
            <input
              type="checkbox"
              checked={skipSundays}
              onChange={(e) => setSkipSundays(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <div>
              <span className="text-xs font-bold text-slate-900">Always Skip Sundays (Mandatory)</span>
              <p className="text-[10px] text-slate-500">
                Saturday maintenance is followed directly by Monday maintenance. No tasks generated on Sunday.
              </p>
            </div>
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 cursor-pointer hover:bg-slate-100/70">
            <input
              type="checkbox"
              checked={skipHolidays}
              onChange={(e) => setSkipHolidays(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <div>
              <span className="text-xs font-bold text-slate-900">Skip Company Holidays &amp; Shift Rotation</span>
              <p className="text-[10px] text-slate-500">
                If schedule date falls on a listed holiday, shift that day's machines to next working day without skipping machines.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Rotation Structure Blueprint */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Machine Group 1 (M/C 1)</span>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">17 Machines</span>
          </div>
          <p className="text-[11px] text-slate-600">
            B.Card-1 &rarr; B.Card-2 &rarr; F.Card-1 &rarr; F.Card-2 &rarr; F.Card-3 &rarr; Mono-1 &rarr; Mono-2 &rarr; Mono-3 &rarr; Punjab-1 &rarr; Punjab-2 &rarr; Fin-2 &rarr; Fin-3 &rarr; Spg-1 &rarr; Spg-2 &rarr; Spg-3 &rarr; Spg-4 &rarr; Spg-5
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Machine Group 2 (M/C 2)</span>
            <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">16 Machines</span>
          </div>
          <p className="text-[11px] text-slate-600">
            COMBER-1 to COMBER-13 &rarr; Polish m/c-1 &rarr; Polish m/c-2 &rarr; Polish m/c-3 (Cycle Day 17 has no M/C 2 task: &lsquo;-&rsquo;)
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">17-Working-Day Cycle</span>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Restarts on Day 18</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Day 17: Spg-5 + &lsquo;-&rsquo;. Next working day immediately restarts at Cycle Day 1 (B.Card-1 + COMBER-1). Non-working days (Sundays/Holidays) are cleanly bypassed.
          </p>
        </div>
      </div>

      {/* Live Paired Schedule Preview Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Live Generated Schedule Preview ({previewResult.totalWorkingDays} Working Days • {previewResult.totalTaskRecords} Tasks)
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-600">Filter Cycle:</label>
            <select
              value={previewFilterCycle}
              onChange={(e) => setPreviewFilterCycle(e.target.value)}
              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="all">All Cycles ({previewResult.cycleCount} Total)</option>
              {Array.from({ length: previewResult.cycleCount }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Cycle #{i + 1} (Days 1 - 17)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rotation Table Matching User Verified Format */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="p-3">M/C 1</th>
                <th className="p-3">M/C 2</th>
                <th className="p-3">Date</th>
                <th className="p-3">Day</th>
                <th className="p-3 text-center">Cycle #</th>
                <th className="p-3 text-center">Cycle Day</th>
                <th className="p-3">Doer</th>
                <th className="p-3">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPreviewRows.map((row, idx) => {
                const isDay17 = row.cycleDay === 17;
                const isCycleStart = row.cycleDay === 1;

                return (
                  <tr
                    key={`${row.date}-${row.cycleNumber}-${row.cycleDay}`}
                    className={`transition-colors ${
                      isDay17
                        ? 'bg-amber-50/80 font-semibold'
                        : isCycleStart
                        ? 'bg-emerald-50/50'
                        : idx % 2 === 0
                        ? 'bg-white'
                        : 'bg-slate-50/40'
                    } hover:bg-slate-100/80`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 font-mono text-[10px] font-bold text-blue-800">
                          1
                        </span>
                        <span className="font-bold text-slate-900">{row.mc1MachineName}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {isDay17 ? (
                          <span className="font-bold text-slate-400 font-mono text-sm">-</span>
                        ) : (
                          <>
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-purple-100 font-mono text-[10px] font-bold text-purple-800">
                              2
                            </span>
                            <span className="font-bold text-slate-900">{row.mc2MachineName}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">{row.date}</td>
                    <td className="p-3">
                      <span className={`font-semibold ${row.dayName === 'Saturday' ? 'text-indigo-700' : 'text-slate-800'}`}>
                        {row.dayName}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        Cycle {row.cycleNumber}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          isDay17
                            ? 'bg-amber-200 text-amber-900'
                            : isCycleStart
                            ? 'bg-emerald-200 text-emerald-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Day {row.cycleDay} / 17
                      </span>
                    </td>
                    <td className="p-3 text-slate-800 font-semibold">{row.doerName}</td>
                    <td className="p-3 text-slate-600">{row.departmentName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
