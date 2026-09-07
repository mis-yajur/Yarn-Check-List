import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  PlusCircle,
  X,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { previewSchedule } from '../../services/recurrenceEngine';
import { TaskMaster } from '../../types';

interface SchedulePreviewModalProps {
  task: TaskMaster | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SchedulePreviewModal: React.FC<SchedulePreviewModalProps> = ({
  task,
  onClose,
  onSuccess,
}) => {
  const { generateOneYearSchedule, extendSchedule, scheduledTasks, settings } = useTasks();
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!task) return null;

  const preview = previewSchedule(
    {
      startDate: task.startDate,
      frequencyType: task.frequencyType,
      frequencyValue: task.frequencyValue,
      weeklyDay: task.weeklyDay,
    },
    {
      horizonMonths: 12,
      invalidMonthlyDatePolicy: settings.invalidMonthlyDatePolicy,
    }
  );

  // Check existing occurrences in database
  const existingSchedules = scheduledTasks.filter((s) => s.taskMasterId === task.id);
  const existingDatesSet = new Set(existingSchedules.map((s) => s.dueDate));
  const newOccurrencesCount = preview.dates.filter((d) => !existingDatesSet.has(d)).length;

  const handleGenerate = () => {
    setIsGenerating(true);
    const res = generateOneYearSchedule(task.id);
    setIsGenerating(false);
    setResultMessage(res.message || 'Schedule generation completed.');
    if (res.success && onSuccess) {
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    }
  };

  const handleExtend = (months: number) => {
    setIsGenerating(true);
    const res = extendSchedule(task.id, months);
    setIsGenerating(false);
    setResultMessage(res.message || `Schedule extended by ${months} months.`);
    if (res.success && onSuccess) {
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="my-8 w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Preview 1-Year Schedule</h3>
              <p className="text-xs text-slate-700">
                {task.taskCode} • {task.taskName} ({task.departmentName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Recurrence Summary Box */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-3">
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div>
              <span className="text-[11px] text-slate-700 block">Recurrence Rule</span>
              <span className="font-semibold text-slate-800">{preview.frequencySummary}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-700 block">Start Date</span>
              <span className="font-semibold text-slate-800">{task.startDate}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-700 block">1-Year Horizon</span>
              <span className="font-semibold text-slate-800">{preview.endDate}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-700 block">Calculated Occurrences</span>
              <span className="font-bold text-emerald-800">{preview.totalCount} dates</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {resultMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{resultMessage}</span>
            </div>
          )}

          {/* Status of Existing Schedule */}
          {existingSchedules.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Existing Schedule Found</span>
              </div>
              <p className="text-[11px] text-amber-800">
                This task already has {existingSchedules.length} occurrences recorded in the Master Schedule
                {task.lastScheduleGeneratedThrough ? ` through ${task.lastScheduleGeneratedThrough}` : ''}.
                {newOccurrencesCount > 0 ? (
                  <span className="font-semibold ml-1">
                    ({newOccurrencesCount} new missing occurrences will be added safely).
                  </span>
                ) : (
                  <span className="font-semibold ml-1">
                    (All 1-year dates are already up to date; duplicates are automatically prevented).
                  </span>
                )}
              </p>
            </div>
          )}

          {/* List of Generated Dates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Generated Dates Preview ({preview.dates.length})
              </span>
              <span className="text-[11px] text-slate-700">
                Factory Timezone: {settings.timezone}
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 p-2 bg-slate-50/50">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {preview.dates.map((date, idx) => {
                  const isAlreadySaved = existingDatesSet.has(date);
                  return (
                    <div
                      key={date}
                      className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs border ${
                        isAlreadySaved
                          ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                          : 'border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      <span className="font-mono">{date}</span>
                      <span className="text-[10px] text-slate-700">
                        {isAlreadySaved ? '✓ Exists' : `#${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Extension Options */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <span className="text-xs font-bold text-slate-800 block mb-1.5">
              Schedule Extension Options
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleExtend(3)}
                disabled={isGenerating}
                className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                +3 Months
              </button>
              <button
                type="button"
                onClick={() => handleExtend(6)}
                disabled={isGenerating}
                className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                +6 Months
              </button>
              <button
                type="button"
                onClick={() => handleExtend(12)}
                disabled={isGenerating}
                className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                +1 Year Extension
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-generate-schedule-1-year"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-800 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Schedule for 1 Year'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
