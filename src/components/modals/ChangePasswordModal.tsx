import React, { useState } from 'react';
import { Eye, EyeOff, Key, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  mandatory?: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  mandatory = false,
}) => {
  const { changePassword, currentUser } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const res = changePassword(newPassword);
    if (res.success) {
      setSuccess('Password updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setError(res.message || 'Failed to change password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {mandatory ? 'Initial Password Change Required' : 'Change Password'}
              </h3>
              <p className="text-[11px] text-slate-700">
                {currentUser?.loginId} ({currentUser?.name})
              </p>
            </div>
          </div>
          {!mandatory && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {mandatory && (
          <div className="mt-3 rounded-md bg-amber-50 p-2.5 text-xs text-amber-900 border border-amber-200">
            For security reasons in Yajur Fibres plant systems, all new accounts must change their default initial password before proceeding.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-emerald-50 p-2.5 text-xs text-emerald-800 border border-emerald-200">
              {success}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                placeholder="Enter new strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              placeholder="Confirm new password"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {!mandatory && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
            >
              <ShieldCheck className="h-4 w-4" />
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
