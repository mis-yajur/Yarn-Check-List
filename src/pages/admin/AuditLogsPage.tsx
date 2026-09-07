import React, { useState } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  Download,
  Eye,
  FileCheck2,
  Filter,
  History,
  Search,
  Shield,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { AuditLog } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { auditLogs, todayStr } = useTasks();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Extract unique action types
  const actionTypes = Array.from(new Set(auditLogs.map((log) => log.action)));

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.recordType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.recordId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.reason || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const handleExportCSV = () => {
    const headers = [
      'Log ID',
      'Action',
      'User Name',
      'Role',
      'Record Type',
      'Record ID',
      'Reason / Details',
      'Timestamp',
    ];

    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.action}"`,
      `"${l.userName}"`,
      l.role,
      l.recordType,
      l.recordId,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      l.timestamp,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `YFL_Audit_Logs_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('CANCEL')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (action.includes('COMPLETE') || action.includes('CREATE') || action.includes('INJECT')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (action.includes('UPDATE') || action.includes('RESET')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-rose-200/80 bg-linear-to-r from-white via-rose-50/40 to-pink-50/50 p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-700 text-white shadow-2xs">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
                System Security &amp; Operations Audit Trail
              </h1>
              <p className="text-xs text-slate-700">
                Immutable chronological log of all task verifications, master schedule alterations, user lifecycle events, and administrative actions.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3.5 py-2 text-xs font-bold text-rose-900 shadow-2xs hover:bg-rose-50 transition-colors"
        >
          <Download className="h-4 w-4 text-rose-700" />
          Export Audit Trail (CSV)
        </button>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Audit Events</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{auditLogs.length}</span>
            <Activity className="h-5 w-5 text-rose-600" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Task Completions</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {auditLogs.filter((l) => l.action.toLowerCase().includes('complete')).length}
            </span>
            <FileCheck2 className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">User &amp; Auth Events</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {auditLogs.filter((l) => l.action.toLowerCase().includes('user') || l.action.toLowerCase().includes('password')).length}
            </span>
            <User className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">System Config Events</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {auditLogs.filter((l) => l.action.toLowerCase().includes('config') || l.action.toLowerCase().includes('settings') || l.action.toLowerCase().includes('inject')).length}
            </span>
            <Shield className="h-5 w-5 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by action, user name, record ID, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-4 text-xs focus:border-rose-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-rose-500 focus:outline-hidden"
          >
            <option value="all">All Action Types</option>
            {actionTypes.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Actor / User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Record Type</th>
                <th className="p-3">Record ID</th>
                <th className="p-3">Details / Reason</th>
                <th className="p-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-slate-400">
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900 whitespace-nowrap">{log.userName}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          log.role === 'admin'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.role}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-700 whitespace-nowrap">{log.recordType}</td>
                    <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {log.recordId}
                    </td>
                    <td className="p-3 max-w-xs truncate text-slate-600" title={log.reason}>
                      {log.reason || 'System operation processed.'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                        title="View Full Audit Snapshot"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Snapshot Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-rose-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Audit Record Snapshot: {selectedLog.id}
                </h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-500">Action:</span>
                  <p className="font-bold text-slate-900">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-slate-500">Timestamp:</span>
                  <p className="font-bold text-slate-900">{selectedLog.timestamp}</p>
                </div>
                <div>
                  <span className="text-slate-500">Actor User:</span>
                  <p className="font-bold text-slate-900">{selectedLog.userName} ({selectedLog.role})</p>
                </div>
                <div>
                  <span className="text-slate-500">Target Record:</span>
                  <p className="font-mono font-bold text-rose-900">{selectedLog.recordType} : {selectedLog.recordId}</p>
                </div>
              </div>

              {selectedLog.reason && (
                <div>
                  <span className="text-slate-500 block mb-1">Reason / Description:</span>
                  <p className="rounded bg-slate-50 p-2 font-medium text-slate-800 border border-slate-200">
                    {selectedLog.reason}
                  </p>
                </div>
              )}

              {selectedLog.previousData && (
                <div>
                  <span className="text-slate-500 block mb-1">Previous Snapshot State:</span>
                  <pre className="max-h-32 overflow-y-auto rounded bg-slate-900 p-2.5 font-mono text-[11px] text-slate-200">
                    {JSON.stringify(selectedLog.previousData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newData && (
                <div>
                  <span className="text-slate-500 block mb-1">New Snapshot State:</span>
                  <pre className="max-h-32 overflow-y-auto rounded bg-slate-900 p-2.5 font-mono text-[11px] text-emerald-300">
                    {JSON.stringify(selectedLog.newData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
