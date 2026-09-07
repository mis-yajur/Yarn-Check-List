import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CloudCheck,
  CloudDownload,
  CloudUpload,
  Database,
  ExternalLink,
  Flame,
  Info,
  Key,
  RefreshCw,
  Save,
  ShieldCheck,
  X,
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

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({ isOpen, onClose }) => {
  const {
    taskMasters,
    scheduledTasks,
    departments,
    users,
    checklistTemplates,
    settings,
    auditLogs,
    refreshData,
  } = useTasks();

  const [credentials, setCredentials] = useState<FirebaseCredentials>(getActiveFirebaseCredentials());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(getLastSyncTime());
  const [activeTab, setActiveTab] = useState<'credentials' | 'sync' | 'overview'>('credentials');

  useEffect(() => {
    setCredentials(getActiveFirebaseCredentials());
    setLastSync(getLastSyncTime());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    saveFirebaseCredentials(credentials);
    setTestResult({
      success: true,
      message: 'Firebase credentials saved to local storage! You can now test the connection.',
    });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testFirebaseConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Error occurred while testing Firebase connection.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handlePushToFirestore = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await pushAllDataToFirestore({
        taskMasters,
        scheduledTasks,
        departments,
        users,
        checklistTemplates,
        settings,
        auditLogs,
      });
      setSyncResult(res);
      setLastSync(getLastSyncTime());
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || 'Failed to push data to Firestore.',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handlePullFromFirestore = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await pullAllDataFromFirestore();
      if (res.success && res.data) {
        setSyncResult({
          success: true,
          message: res.message,
        });
        setLastSync(getLastSyncTime());
        refreshData();
      } else {
        setSyncResult({
          success: false,
          message: res.message,
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || 'Failed to pull data from Firestore.',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-rose-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Lotus & Firebase Gradient Header */}
        <div className="bg-linear-to-r from-rose-700 via-rose-800 to-pink-700 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs shadow-inner border border-white/20">
                <Flame className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight">Firebase Cloud &amp; Firestore</h2>
                  <span className="rounded-full bg-rose-900/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-200 border border-rose-500/40">
                    All Credentials
                  </span>
                </div>
                <p className="text-xs text-rose-100 mt-0.5">
                  Full cloud database synchronization for Yajur Fibres Limited Yarn Division
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-5 flex gap-2 border-b border-rose-600/50 pb-0">
            <button
              onClick={() => setActiveTab('credentials')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'credentials'
                  ? 'border-white text-white'
                  : 'border-transparent text-rose-200 hover:text-white'
              }`}
            >
              <Key className="h-3.5 w-3.5" />
              Firebase Credentials
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'sync'
                  ? 'border-white text-white'
                  : 'border-transparent text-rose-200 hover:text-white'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              Cloud Data Sync
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'overview'
                  ? 'border-white text-white'
                  : 'border-transparent text-rose-200 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Collections &amp; Status
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Notifications / Alerts */}
          {testResult && (
            <div
              className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs font-medium ${
                testResult.success
                  ? 'border-rose-200 bg-rose-50 text-rose-900'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold">{testResult.success ? 'Success: ' : 'Notice: '}</span>
                <span>{testResult.message}</span>
              </div>
            </div>
          )}

          {syncResult && (
            <div
              className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs font-medium ${
                syncResult.success
                  ? 'border-rose-200 bg-rose-50 text-rose-900'
                  : 'border-red-200 bg-red-50 text-red-900'
              }`}
            >
              {syncResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold">{syncResult.success ? 'Sync Complete: ' : 'Sync Error: '}</span>
                <span>{syncResult.message}</span>
              </div>
            </div>
          )}

          {/* TAB 1: Credentials Form */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs text-rose-900 flex items-start gap-2">
                <Info className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
                <p>
                  You can input your live Google Firebase project credentials below or set them via{' '}
                  <code className="font-mono bg-rose-100/70 px-1 py-0.5 rounded text-[11px]">.env.example</code>.
                  Data is securely processed directly in the client and stored in Firestore collections.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    API Key (apiKey) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={credentials.apiKey}
                    onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project ID (projectId) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={credentials.projectId}
                    onChange={(e) => setCredentials({ ...credentials, projectId: e.target.value })}
                    placeholder="yfl-taskms-lotus"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Auth Domain (authDomain)
                  </label>
                  <input
                    type="text"
                    value={credentials.authDomain}
                    onChange={(e) => setCredentials({ ...credentials, authDomain: e.target.value })}
                    placeholder="your-project.firebaseapp.com"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Storage Bucket (storageBucket)
                  </label>
                  <input
                    type="text"
                    value={credentials.storageBucket}
                    onChange={(e) => setCredentials({ ...credentials, storageBucket: e.target.value })}
                    placeholder="your-project.firebasestorage.app"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Messaging Sender ID
                  </label>
                  <input
                    type="text"
                    value={credentials.messagingSenderId}
                    onChange={(e) => setCredentials({ ...credentials, messagingSenderId: e.target.value })}
                    placeholder="28917971364"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    App ID (appId) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={credentials.appId}
                    onChange={(e) => setCredentials({ ...credentials, appId: e.target.value })}
                    placeholder="1:28917971364:web:..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50/80 px-3.5 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
                  {testing ? 'Testing Connection...' : 'Test Firebase Connection'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-800 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Save Credentials
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: Sync Actions */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Current Local Data Snapshot</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Ready to sync to Firestore project:{' '}
                      <span className="font-mono font-bold text-rose-700">{credentials.projectId}</span>
                    </p>
                  </div>
                  {lastSync && (
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                      Last Synced: {new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-white p-2 border border-slate-200">
                    <span className="block font-black text-rose-700 text-sm">{taskMasters.length}</span>
                    <span className="text-[10px] text-slate-600 font-medium">Task Masters</span>
                  </div>
                  <div className="rounded-lg bg-white p-2 border border-slate-200">
                    <span className="block font-black text-rose-700 text-sm">{scheduledTasks.length}</span>
                    <span className="text-[10px] text-slate-600 font-medium">Scheduled Tasks</span>
                  </div>
                  <div className="rounded-lg bg-white p-2 border border-slate-200">
                    <span className="block font-black text-rose-700 text-sm">{checklistTemplates.length}</span>
                    <span className="text-[10px] text-slate-600 font-medium">Checklists</span>
                  </div>
                  <div className="rounded-lg bg-white p-2 border border-slate-200">
                    <span className="block font-black text-rose-700 text-sm">{users.length}</span>
                    <span className="text-[10px] text-slate-600 font-medium">Technicians &amp; Admins</span>
                  </div>
                </div>
              </div>

              {/* Sync Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                      <CloudUpload className="h-4 w-4 text-rose-700" />
                      Push to Firestore Database
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Uploads all 33 machines, 1-year schedules, checklists, and technicians directly into your Firebase Firestore collections.
                    </p>
                  </div>
                  <button
                    onClick={handlePushToFirestore}
                    disabled={syncing}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-rose-700 px-3 py-2 text-xs font-bold text-white hover:bg-rose-800 transition-colors shadow-xs disabled:opacity-50"
                  >
                    <CloudUpload className={`h-3.5 w-3.5 ${syncing ? 'animate-bounce' : ''}`} />
                    {syncing ? 'Pushing to Cloud...' : 'Upload All to Firestore'}
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                      <CloudDownload className="h-4 w-4 text-slate-700" />
                      Pull from Firestore Database
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Fetches latest maintenance updates and task executions logged by technicians across plant shifts from Firestore.
                    </p>
                  </div>
                  <button
                    onClick={handlePullFromFirestore}
                    disabled={syncing}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
                  >
                    <CloudDownload className="h-3.5 w-3.5" />
                    {syncing ? 'Fetching Data...' : 'Pull Latest from Firestore'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Collections Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                The Yarn Division database uses the following Firestore root collections:
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-700">task_masters</span>
                    <span className="text-slate-500 text-[11px]">({taskMasters.length} equipment units)</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700">Carding, Combers, Blow Room</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-700">scheduled_tasks</span>
                    <span className="text-slate-500 text-[11px]">({scheduledTasks.length} cycles)</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700">1-Year maintenance calendar</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-700">checklist_templates</span>
                    <span className="text-slate-500 text-[11px]">({checklistTemplates.length} templates)</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700">ISO PM inspection checkpoints</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-700">users</span>
                    <span className="text-slate-500 text-[11px]">({users.length} accounts)</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700">Admins &amp; Doers (YFL-084, etc.)</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-700">system_settings</span>
                    <span className="text-slate-500 text-[11px]">(active document)</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700">Scoring rules &amp; policies</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between bg-slate-50 px-6 py-3 border-t border-slate-200">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-rose-600" />
            Yajur Fibres Limited • Firebase Cloud Sync
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
