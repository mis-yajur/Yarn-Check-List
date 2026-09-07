import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle2,
  FileCheck2,
  HelpCircle,
  Upload,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { ChecklistItemChoice, ChecklistItemResponse, ScheduledTask } from '../../types';

interface MarkTaskDoneModalProps {
  task: ScheduledTask | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MarkTaskDoneModal: React.FC<MarkTaskDoneModalProps> = ({ task, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const { checklistTemplates, markTaskAsDone, todayStr } = useTasks();

  if (!task) return null;

  // Find template for this task
  const template = checklistTemplates.find((t) => t.id === task.checklistTemplateId) || checklistTemplates[0];

  // Initialize responses for template items
  const [responses, setResponses] = useState<Record<string, { status: ChecklistItemChoice; remarks?: string }>>(() => {
    const initial: Record<string, { status: ChecklistItemChoice; remarks?: string }> = {};
    template?.items.forEach((item) => {
      initial[item.id] = { status: 'ok', remarks: '' };
    });
    return initial;
  });

  const [remarks, setRemarks] = useState('');
  const [observation, setObservation] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [evidenceName, setEvidenceName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleStatusChange = (itemId: string, status: ChecklistItemChoice) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], status },
    }));
  };

  const handleItemRemarksChange = (itemId: string, text: string) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], remarks: text },
    }));
  };

  const hasNotOkItem = Object.values(responses).some((r: { status: ChecklistItemChoice; remarks?: string }) => r.status === 'not_ok');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate mandatory items
    if (template) {
      for (const item of template.items) {
        if (item.isRequired && !responses[item.id]?.status) {
          setValidationError(`Please respond to mandatory item: "${item.label}"`);
          return;
        }
      }
    }

    // If any item is Not OK, require observation and corrective action
    if (hasNotOkItem) {
      if (!observation.trim()) {
        setValidationError('Observation is required because one or more checklist items are marked "Not OK".');
        return;
      }
      if (!correctiveAction.trim()) {
        setValidationError('Corrective Action is required for abnormal / "Not OK" findings.');
        return;
      }
    }

    setIsSubmitting(true);

    const checklistResponsesList: ChecklistItemResponse[] = (template?.items || []).map((item) => ({
      itemId: item.id,
      label: item.label,
      status: responses[item.id]?.status || 'ok',
      remarks: responses[item.id]?.remarks || '',
      observation: hasNotOkItem ? observation : undefined,
      correctiveAction: hasNotOkItem ? correctiveAction : undefined,
    }));

    const result = markTaskAsDone(task.id, {
      remarks: remarks.trim() || 'All preventive maintenance checks performed as per standard operating procedure.',
      observation: hasNotOkItem ? observation.trim() : undefined,
      correctiveAction: hasNotOkItem ? correctiveAction.trim() : undefined,
      checklistResponses: checklistResponsesList,
      evidenceUrls: evidenceName ? [`/uploads/${evidenceName}`] : undefined,
      overrideCompletionDate: todayStr,
    });

    setIsSubmitting(false);

    if (result.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setValidationError(result.message || 'Error completing task.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="my-8 w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Task Completion &amp; Checklist</h3>
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

        {/* Task Summary Banner */}
        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-emerald-50/40 px-6 py-3 text-xs sm:grid-cols-4">
          <div>
            <span className="text-[11px] text-slate-700 block">Scheduled Due Date</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-800" />
              {task.dueDate}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-700 block">Assigned Doer</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <User className="h-3.5 w-3.5 text-slate-500" />
              {task.assignedUserName}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-700 block">Current Status</span>
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 mt-0.5">
              {task.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-700 block">Completion Date</span>
            <span className="font-semibold text-emerald-800 mt-0.5 block">
              {todayStr} (Today)
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {validationError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Instructions note if any */}
          {task.instructions && (
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-900">
              <span className="font-bold">Standard Instructions:</span> {task.instructions}
            </div>
          )}

          {/* Checklist Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Checklist: {template?.templateName || 'Machine Maintenance'}
              </h4>
              <span className="text-[11px] text-slate-700">
                {template?.items.length || 0} inspection checkpoints
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
              {template?.items.map((item, idx) => {
                const currentStatus = responses[item.id]?.status || 'ok';

                return (
                  <div key={item.id} className="p-3 hover:bg-slate-50/70 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">#{idx + 1}</span>
                          <span className="text-xs font-semibold text-slate-900">{item.label}</span>
                          {item.isRequired && (
                            <span className="text-[10px] text-red-500 font-bold">*Required</span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-slate-700 mt-0.5">{item.description}</p>
                        )}
                      </div>

                      {/* Status Buttons: OK / Not OK / NA */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.id, 'ok')}
                          className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                            currentStatus === 'ok'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          OK
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.id, 'not_ok')}
                          className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                            currentStatus === 'not_ok'
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <XCircle className="h-3 w-3" />
                          Not OK
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.id, 'na')}
                          className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-all ${
                            currentStatus === 'na'
                              ? 'bg-slate-700 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <HelpCircle className="h-3 w-3" />
                          N/A
                        </button>
                      </div>
                    </div>

                    {/* Remarks field for individual item if not OK */}
                    {currentStatus === 'not_ok' && (
                      <div className="mt-2 pl-4 border-l-2 border-red-400">
                        <input
                          type="text"
                          placeholder="Specific defect or abnormal symptom description..."
                          value={responses[item.id]?.remarks || ''}
                          onChange={(e) => handleItemRemarksChange(item.id, e.target.value)}
                          className="w-full rounded-md border border-red-200 bg-red-50/40 px-2.5 py-1 text-xs text-red-900 focus:outline-hidden focus:ring-1 focus:ring-red-400"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conditional Abnormal Observation & Corrective Action Inputs */}
          {hasNotOkItem && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>Abnormal Condition Detected — Documentation Required</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Observation / Defect Finding <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Describe abnormal noise, vibration, overheating, or mechanical wear discovered during checklist..."
                  className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Corrective Action Taken / Planned <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="Details of adjustments made, part replacement requisitioned, or maintenance tag applied..."
                  className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-white"
                  required
                />
              </div>
            </div>
          )}

          {/* General Remarks */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              General Completion Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Cleaned carding cylinder, greased drive bearings, test run verified OK."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Optional Attachment / Proof */}
          <div className="border-t border-slate-100 pt-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Maintenance Evidence / Photo Proof (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:border-emerald-500 hover:bg-slate-50">
                <Camera className="h-4 w-4 text-emerald-700" />
                <span>{evidenceName ? evidenceName : 'Attach Photo or Work Sheet'}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setEvidenceName(file.name);
                  }}
                />
              </label>
              {evidenceName && (
                <button
                  type="button"
                  onClick={() => setEvidenceName(null)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              id="btn-confirm-task-completion"
              className="flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-800 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? 'Recording Completion...' : 'Confirm Task Completion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
