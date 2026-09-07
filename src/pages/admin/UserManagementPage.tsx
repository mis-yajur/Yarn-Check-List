import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Edit2,
  KeyRound,
  PlusCircle,
  Search,
  Shield,
  Trash2,
  UserCheck,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { User, UserRole } from '../../types';

export const UserManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { users, departments, addUser, updateUser, toggleUserStatus, resetUserPassword, deleteUser, scheduledTasks, taskMasters } = useTasks();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    role: 'doer' as UserRole,
    departmentId: '',
    designation: 'Maintenance Technician',
    password: 'password123',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      employeeId: `YFL-${(users.length + 85).toString().padStart(3, '0')}`,
      name: '',
      email: '',
      phone: '+91 98300 00000',
      role: 'doer',
      departmentId: departments[0]?.id || '',
      designation: 'Technician',
      password: 'password123',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      employeeId: u.employeeId,
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      departmentId: u.departmentId,
      designation: u.designation,
      password: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (u: User) => {
    setUserToDelete(u);
    const otherUsers = users.filter((o) => o.id !== u.id && o.status === 'active');
    setReassignTargetId(otherUsers[0]?.id || '');
    setDeleteError(null);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    const res = deleteUser(userToDelete.id, reassignTargetId || undefined);
    if (res.success) {
      setResetSuccessMessage(res.message || `User ${userToDelete.name} deleted.`);
      setUserToDelete(null);
    } else {
      setDeleteError(res.message || 'Failed to delete user.');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const dept = departments.find((d) => d.id === formData.departmentId);

    if (editingUser) {
      const res = updateUser(editingUser.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        departmentId: formData.departmentId,
        departmentName: dept?.departmentName || '',
        designation: formData.designation,
      });

      if (res.success) {
        setIsModalOpen(false);
      } else {
        setFormError(res.message || 'Failed to update user.');
      }
    } else {
      const res = addUser({
        employeeId: formData.employeeId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        departmentId: formData.departmentId,
        departmentName: dept?.departmentName || '',
        designation: formData.designation,
        password: formData.password || 'password123',
        status: 'active',
      });

      if (res.success) {
        setIsModalOpen(false);
      } else {
        setFormError(res.message || 'Failed to add user.');
      }
    }
  };

  const handleResetPassword = (userId: string, userName: string) => {
    const res = resetUserPassword(userId);
    if (res.success) {
      setResetSuccessMessage(`Temporary password for ${userName} reset to: "${res.newPass}"`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            User &amp; Personnel Directory
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Manage factory technicians, supervisors, and administrative credentials for Yarn Division operations.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Add New User
        </button>
      </div>

      {resetSuccessMessage && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
          <span>{resetSuccessMessage}</span>
          <button onClick={() => setResetSuccessMessage(null)} className="text-blue-700 hover:text-blue-900 font-bold">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="all">All Roles</option>
            <option value="admin">System Administrator</option>
            <option value="doer">Technician / Doer</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Emp ID</th>
                <th className="p-3">Department</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Role</th>
                <th className="p-3">Assigned Tasks</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const assignedCount = scheduledTasks.filter((s) => s.assignedUserId === user.id).length;
                const assignedMasterCount = taskMasters.filter((tm) => tm.assignedUserId === user.id).length;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-800 font-bold text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-[11px] text-slate-700">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">{user.employeeId}</td>
                    <td className="p-3 text-slate-700">{user.departmentName}</td>
                    <td className="p-3 font-medium text-slate-800">{user.designation}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {assignedMasterCount > 0 ? (
                        <span>{assignedMasterCount} masters ({assignedCount} sch)</span>
                      ) : (
                        <span>{assignedCount} tasks</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleResetPassword(user.id, user.name)}
                          title="Reset Password"
                          className="rounded p-1.5 text-amber-700 hover:bg-amber-50"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          title="Edit User"
                          className="rounded p-1.5 text-blue-700 hover:bg-blue-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                          className={`rounded p-1.5 ${
                            user.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {user.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleOpenDelete(user)}
                          title={user.id === currentUser?.id ? 'Cannot delete current logged-in user' : 'Delete User Permanently'}
                          disabled={user.id === currentUser?.id}
                          className={`rounded p-1.5 ${
                            user.id === currentUser?.id ? 'text-slate-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50 hover:text-red-800'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-red-100 pb-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900">Confirm User Deletion</h3>
              </div>
              <button onClick={() => setUserToDelete(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <p>
                Are you sure you want to delete user{' '}
                <strong className="text-slate-900">{userToDelete.name}</strong> ({userToDelete.employeeId})?
              </p>

              {deleteError && (
                <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 font-semibold border border-red-200">
                  {deleteError}
                </div>
              )}

              {taskMasters.filter((tm) => tm.assignedUserId === userToDelete.id).length > 0 && (
                <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-amber-900 space-y-2">
                  <p className="font-bold">
                    This user is assigned to {taskMasters.filter((tm) => tm.assignedUserId === userToDelete.id).length} Task Masters.
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Reassign their tasks to:
                    </label>
                    <select
                      value={reassignTargetId}
                      onChange={(e) => setReassignTargetId(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-800"
                    >
                      {users
                        .filter((u) => u.id !== userToDelete.id)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.employeeId} - {u.designation})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500">
                This action will permanently remove the login credentials from the system.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="rounded-lg border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-xs"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? `Edit User: ${editingUser.name}` : 'Register New Factory User'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3">
              {formError && (
                <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-700">{formError}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    disabled={!!editingUser}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Swapan Kr Ghorai"
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.departmentName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  >
                    <option value="doer">Technician / Doer</option>
                    <option value="admin">System Administrator</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. Comber Maintenance Technician"
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
