import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Cpu,
  Layers,
  Play,
  RefreshCw,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { generateOneYearOccurrences, getFrequencySummary } from '../../services/recurrenceEngine';
import { FrequencyType } from '../../types';

export const SchedulerEnginePage: React.FC = () => {
  const { taskMasters, scheduledTasks, bulkGenerateSchedules, todayStr, settings } = useTasks();

  const [selectedTaskMasterId, setSelectedTaskMasterId] = useState<string>(taskMasters[0]?.id || '');
  const [selectedIdsForBulk, setSelectedIdsForBulk] = useState<string[]>([]);
  const [generationLog, setGenerationLog] = useState<string | null>(null);

  // Recurrence Simulator test sandbox
  const [simFreqType, setSimFreqType] = useState<FrequencyType>('interval_days');
  const [simInterval, setSimInterval] = useState<number>(15);
  const [simStartDate, setSimStartDate] = useState<string>(todayStr);
  const [simulatedDates, setSimulatedDates] = useState<string[]>([]);

  const handleSimulate = () => {
    const dates = generateOneYearOccurrences(
      simStartDate,
      simFreqType,
      simInterval,
      1,
      settings.monthEndPolicy || 'last_day_of_month',
      365
    );
    setSimulatedDates(dates.slice(0, 26)); // show first 26
  };

  const handleBulkGenerateAll = () => {
    const allIds = taskMasters.map((t) => t.id);
    const res = bulkGenerateSchedules(allIds);
    setGenerationLog(`Success: Generated 1-year master occurrences across all ${taskMasters.length} machines! Total scheduled occurrences: ${res.createdCount}.`);
  };

  const selectedTask = taskMasters.find((t) => t.id === selectedTaskMasterId);
  const currentOccurrences = scheduledTasks.filter((s) => s.taskMasterId === selectedTaskMasterId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            1-Year Schedule Generator &amp; Recurrence Engine
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Engineered specifically for Yajur Fibres Limited yarn machinery: strict interval calculation, month-end date policies, and leap-year compliance.
          </p>
        </div>

        <button
          id="btn-run-all-schedules"
          onClick={handleBulkGenerateAll}
          className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors"
        >
          <Play className="h-4 w-4 fill-white" />
          Generate 1-Year Master Schedules for All (33 Machines)
        </button>
      </div>

      {generationLog && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{generationLog}</span>
          </div>
          <button onClick={() => setGenerationLog(null)} className="font-bold text-emerald-800 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Grid of Recurrence Engine Architecture & Simulator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recurrence Rules Explanation */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings2 className="h-4 w-4 text-emerald-800" />
            <h2 className="text-sm font-bold text-slate-900">YFL Recurrence Architecture</h2>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">
                Rule 1: Strict Interval Days (e.g. 15 Days)
              </span>
              <p className="text-[11px]">
                Adds exact step days iteratively. For a 15-day cycle: Start Sep 15 &rarr; Sep 30 &rarr; Oct 15 &rarr; Oct 30 &rarr; Nov 14 &rarr; Nov 29. Note: In 31-day months, two occurrences will occur within the same month!
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">
                Rule 2: Monthly — Same Calendar Date
              </span>
              <p className="text-[11px]">
                Preserves exact calendar day (e.g. 27th of Sep, Oct, Nov, Dec). If date is 31st and next month is February (28 days), the engine clamps to Feb 28th, then safely returns to Mar 31st!
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">
                Rule 3: Leap Year &amp; Month-End Protection
              </span>
              <p className="text-[11px]">
                Configured with <code>last_day_of_month</code> policy. In leap years (e.g. 2028), February automatically produces 29 days without shifting calendar alignment.
              </p>
            </div>
          </div>
        </div>

        {/* Live Recurrence Sandbox */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">Interactive Recurrence Sandbox &amp; Tester</h2>
            </div>
            <button
              onClick={handleSimulate}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              Simulate Dates
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Recurrence Rule</label>
              <select
                value={simFreqType}
                onChange={(e) => setSimFreqType(e.target.value as FrequencyType)}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="interval_days">Interval Days (Every 15 Days)</option>
                <option value="monthly_same_date">Monthly Same Date</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {simFreqType === 'interval_days' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Interval Step (Days)</label>
                <input
                  type="number"
                  value={simInterval}
                  onChange={(e) => setSimInterval(Number(e.target.value))}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Anchor Start Date</label>
              <input
                type="date"
                value={simStartDate}
                onChange={(e) => setSimStartDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Simulation Output */}
          <div>
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Generated Occurrence Sequence ({simulatedDates.length > 0 ? simulatedDates.length : 0} Projected Dates)
            </span>

            {simulatedDates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-700">
                Click <strong>"Simulate Dates"</strong> above to preview the recurrence engine date generation.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
                {simulatedDates.map((date, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs"
                  >
                    <span className="text-slate-700 font-medium">#{idx + 1}</span>
                    <span className="font-mono font-bold text-slate-900">{date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Machine-by-Machine Schedule Status Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-800" />
            <h2 className="text-sm font-bold text-slate-900">
              YFL Machinery Master Scheduling Registry (33 Units)
            </h2>
          </div>
          <span className="text-xs text-slate-700 font-semibold">
            {scheduledTasks.length} total active occurrences
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="p-3">Task ID</th>
                <th className="p-3">Machine Name</th>
                <th className="p-3">Assigned Doer</th>
                <th className="p-3">Recurrence Type</th>
                <th className="p-3">First Due Date</th>
                <th className="p-3">Total Occurrences</th>
                <th className="p-3">Completed</th>
                <th className="p-3">Pending / Future</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taskMasters.map((task) => {
                const taskOccurrences = scheduledTasks.filter((s) => s.taskMasterId === task.id);
                const completedCount = taskOccurrences.filter((s) => s.status.startsWith('completed')).length;
                const pendingCount = taskOccurrences.length - completedCount;

                return (
                  <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">{task.taskCode}</td>
                    <td className="p-3 font-bold text-slate-900">{task.taskName}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-900">{task.assignedUserName}</span>
                      <span className="block text-[10px] text-slate-700">{task.assignedEmployeeId}</span>
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-800">
                        {getFrequencySummary(task.frequencyType, task.frequencyValue, task.weeklyDay)}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-700">{task.startDate}</td>
                    <td className="p-3 font-bold text-slate-900">{taskOccurrences.length}</td>
                    <td className="p-3 text-emerald-800 font-bold">{completedCount}</td>
                    <td className="p-3 text-blue-800 font-bold">{pendingCount}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          bulkGenerateSchedules([task.id]);
                          setGenerationLog(`Schedule regenerated for ${task.taskName}.`);
                        }}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Regenerate
                      </button>
                    </td>
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
