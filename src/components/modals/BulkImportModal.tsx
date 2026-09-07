import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Download,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

interface BulkImportModalProps {
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ onClose, onSuccess }) => {
  const { users, departments, checklistTemplates, addTaskMaster, todayStr } = useTasks();

  const [csvText, setCsvText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleCsv = `Task Code,Machine Name,Checklist Template,Employee ID,Frequency Type,Frequency Value,Start Date
TM-101,COMBER-14,Comber Machine 15-Day Preventive Maintenance Checklist,YFL-084,interval_days,15,${todayStr}
TM-102,COMBER-15,Comber Machine 15-Day Preventive Maintenance Checklist,YFL-084,interval_days,15,${todayStr}
TM-103,B. Card-4,Carding Machine Preventive Maintenance Checklist,YFL-084,interval_days,15,${todayStr}`;

  const handleDownloadSample = () => {
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + sampleCsv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'YFL_Task_Masters_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleParseCsv = () => {
    setErrorMsg(null);
    if (!csvText.trim()) {
      setErrorMsg('Please paste CSV text or select a file.');
      return;
    }

    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        setErrorMsg('CSV must contain header row and at least one data row.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map((c) => c.trim());

        const taskCode = cols[0] || `TM-${Date.now().toString().slice(-4)}`;
        const taskName = cols[1] || `Machine ${i}`;
        const checklistName = cols[2] || 'Comber Machine 15-Day Preventive Maintenance Checklist';
        const empId = cols[3] || 'YFL-084';
        const freqType = cols[4] || 'interval_days';
        const freqVal = parseInt(cols[5]) || 15;
        const startDate = cols[6] || todayStr;

        rows.push({
          taskCode,
          taskName,
          checklistName,
          empId,
          freqType,
          freqVal,
          startDate,
        });
      }

      setParsedRows(rows);
    } catch (err: any) {
      setErrorMsg(`Parsing error: ${err.message}`);
    }
  };

  const handleImportAll = () => {
    let imported = 0;
    const defaultUser = users.find((u) => u.employeeId === 'YFL-084') || users[0];
    const defaultChecklist = checklistTemplates[0];
    const defaultDept = departments[0];

    parsedRows.forEach((row) => {
      const targetUser = users.find((u) => u.employeeId === row.empId) || defaultUser;
      const targetChecklist = checklistTemplates.find((c) => c.templateName.includes(row.checklistName)) || defaultChecklist;

      addTaskMaster({
        taskCode: row.taskCode,
        taskName: row.taskName,
        taskDescription: `Preventive maintenance for ${row.taskName}`,
        checklistTemplateId: targetChecklist.id,
        checklistName: targetChecklist.templateName,
        assignedUserId: targetUser.id,
        assignedUserName: targetUser.name,
        assignedEmployeeId: targetUser.employeeId,
        departmentId: defaultDept.id,
        departmentName: defaultDept.departmentName,
        taskCategory: 'Preventive Maintenance',
        frequencyType: row.freqType as any,
        frequencyValue: row.freqVal,
        startDate: row.startDate,
        priority: 'medium',
        status: 'active',
      });
      imported++;
    });

    onSuccess(imported);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="my-8 w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-700" />
            <h3 className="text-base font-bold text-slate-900">
              Bulk Import Task Masters &amp; Machines (CSV)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <p className="font-bold text-slate-900">Need the CSV Template?</p>
              <p className="text-slate-700 text-[11px]">Download our pre-formatted template with standard headers.</p>
            </div>
            <button
              onClick={handleDownloadSample}
              className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-600" />
              Download Template
            </button>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Paste CSV Data (or upload):
            </label>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={sampleCsv}
              className="w-full rounded-md border border-slate-300 font-mono text-[11px] p-2.5 text-slate-800 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-2.5 text-xs text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {parsedRows.length > 0 && (
            <div>
              <p className="font-bold text-emerald-800 mb-2">
                Parsed {parsedRows.length} Valid Machine Records:
              </p>
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 rounded-md border border-slate-200 text-[11px]">
                {parsedRows.map((r, i) => (
                  <div key={i} className="p-2 flex justify-between">
                    <span className="font-mono font-bold text-slate-900">{r.taskCode} - {r.taskName}</span>
                    <span className="text-slate-700">Doer: {r.empId} • {r.freqType} ({r.freqVal}d)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          {parsedRows.length === 0 ? (
            <button
              type="button"
              onClick={handleParseCsv}
              className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              Parse &amp; Validate CSV
            </button>
          ) : (
            <button
              type="button"
              onClick={handleImportAll}
              className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
            >
              Import {parsedRows.length} Tasks &amp; Schedule
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
