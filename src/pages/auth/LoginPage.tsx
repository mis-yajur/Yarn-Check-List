import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  Flower2,
  KeyRound,
  Lock,
  LogIn,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotModal, setForgotModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const res = login(loginId, password);
      setLoading(false);
      if (!res.success) {
        setError(res.message || 'Login failed. Please check credentials.');
      }
    }, 300);
  };

  const handleQuickLogin = (id: string, pass: string) => {
    setLoginId(id);
    setPassword(pass);
    setError(null);
    setLoading(true);
    setTimeout(() => {
      const res = login(id, pass);
      setLoading(false);
      if (!res.success) {
        setError(res.message || 'Login failed.');
      }
    }, 200);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-rose-50 via-slate-50 to-pink-50 p-4 text-slate-900">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-2xl">
        {/* Top Lotus Branding Section - Rich Lotus Rose Corporate Header */}
        <div className="bg-linear-to-br from-rose-700 via-rose-800 to-pink-800 p-8 text-center text-white shadow-inner">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md text-white shadow-lg ring-4 ring-white/20">
            <Flower2 className="h-9 w-9 text-pink-200 animate-pulse" />
          </div>

          <h1 className="mt-4 text-xl font-black tracking-tight sm:text-2xl text-white">
            YAJUR FIBRES LIMITED
          </h1>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="rounded-full bg-white/20 px-3 py-0.5 text-[11px] font-bold text-rose-100 border border-white/25">
              LOTUS EDITION • YARN DIVISION
            </span>
          </div>
          <p className="mt-2 text-xs font-medium text-rose-100/90 max-w-xs mx-auto">
            Checklist, Preventive Maintenance &amp; Automatic Task Scheduling System
          </p>
        </div>

        {/* Login Form */}
        <div className="p-7 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username / Login ID / Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="input-login-id"
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  placeholder="e.g. admin or swapan"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModal(true)}
                  className="text-[11px] font-semibold text-rose-700 hover:text-rose-800"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-9 pr-10 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span>Remember Session</span>
              </label>
              <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                <Flame className="h-3 w-3 text-amber-500" />
                Firestore Real-Time
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="btn-login-submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-rose-700 via-rose-800 to-pink-700 px-4 py-3 text-xs font-bold text-white shadow-md shadow-rose-900/20 hover:from-rose-800 hover:to-pink-800 disabled:opacity-50 transition-all cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Authenticating...' : 'Sign In to Lotus Task System'}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Instant 1-Click Demonstration Access
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="btn-demo-admin-login"
                onClick={() => handleQuickLogin('admin', 'Admin@1234')}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-rose-100 bg-rose-50/50 p-2.5 text-center hover:border-rose-400 hover:bg-rose-50 transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-1 text-xs font-bold text-rose-900 group-hover:text-rose-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-rose-700" />
                  <span>Admin Portal</span>
                </div>
                <span className="text-[10px] text-slate-600 font-mono mt-0.5">admin / Admin@1234</span>
                <span className="text-[9px] font-bold text-rose-700 mt-1 flex items-center gap-0.5">
                  Click to Enter &rarr;
                </span>
              </button>

              <button
                type="button"
                id="btn-demo-doer-login"
                onClick={() => handleQuickLogin('swapan', 'User@1234')}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-pink-100 bg-pink-50/40 p-2.5 text-center hover:border-pink-400 hover:bg-pink-50 transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-1 text-xs font-bold text-pink-900 group-hover:text-pink-700">
                  <User className="h-3.5 w-3.5 text-pink-700" />
                  <span>Doer Portal</span>
                </div>
                <span className="text-[10px] text-slate-600 font-mono mt-0.5">swapan / User@1234</span>
                <span className="text-[9px] font-bold text-pink-700 mt-1 flex items-center gap-0.5">
                  Click to Enter &rarr;
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-3 text-center text-xs text-slate-600 flex items-center justify-center gap-1.5 font-medium">
          <Flower2 className="h-3.5 w-3.5 text-rose-700" />
          <span>Yajur Fibres Limited • Plan • Maintain • Track • Improve</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 text-slate-800 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-rose-700" />
              Password Reset Protocol
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              In Yajur Fibres factory environment, credentials are securely managed by the Plant MIS &amp; Administration team.
            </p>
            <div className="mt-3 rounded-xl bg-rose-50/60 p-3 text-xs border border-rose-100">
              <p className="font-bold text-rose-950">Default initial passwords:</p>
              <ul className="list-disc pl-4 text-slate-700 space-y-1 mt-1 text-xs">
                <li>Administrator: <span className="font-mono font-bold text-rose-800">Admin@1234</span></li>
                <li>Technicians / Doers: <span className="font-mono font-bold text-pink-800">User@1234</span></li>
              </ul>
              <p className="mt-2 text-[11px] text-slate-600">
                To reset an employee password, plant administrators can use the Reset Password action in the Users / Doers module.
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setForgotModal(false)}
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
