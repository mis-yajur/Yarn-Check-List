import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Cpu,
  Edit2,
  FolderTree,
  Plus,
  Search,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { Department } from '../../types';

export const DepartmentsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const {
    departments,
    taskMasters,
    scheduledTasks,
    users,
    addDepartment,
    updateDepartment,
  } = useTasks();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptDetail, setSelectedDeptDetail] = useState<Department | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    departmentName: '',
    departmentId: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  const filteredDepartments = departments.filter((d) => {
    const name = d.departmentName || '';
    const code = d.departmentId || '';
    const desc = d.description || '';
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData({
      departmentName: '',
      departmentId: `DEPT-${(departments.length + 1).toString().padStart(2, '0')}`,
      description: 'Yajur Fibres Limited manufacturing and maintenance division.',
      status: 'active',
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      departmentName: dept.departmentName,
      departmentId: dept.departmentId,
      description: dept.description || '',
      status: dept.status || 'active',
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.departmentName.trim() || !formData.departmentId.trim()) {
      setErrorMessage('Department Name and ID Code are required.');
      return;
    }

    if (editingDept) {
      const res = updateDepartment(editingDept.id, formData);
      if (res.success) {
        setSuccessMessage(`Department "${formData.departmentName}" updated successfully.`);
        setIsModalOpen(false);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(res.message || 'Failed to update department.');
      }
    } else {
      const res = addDepartment({
        departmentName: formData.departmentName.trim(),
        departmentId: formData.departmentId.trim().toUpperCase(),
        description: formData.description.trim(),
        status: formData.status,
      });
      if (res.success) {
        setSuccessMessage(`Department "${formData.departmentName}" created successfully.`);
        setIsModalOpen(false);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(res.message || 'Failed to create department.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-rose-200/80 bg-linear-to-r from-white via-rose-50/30 to-pink-50/40 p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-700 text-white shadow-2xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
                Plant Departments &amp; Operational Divisions
              </h1>
              <p className="text-xs text-slate-700">
                Manage plant divisions (Yarn Division, Carding, Spinning, Finishing), oversee assigned machinery rosters, and audit technician allocations.
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-rose-700 to-rose-800 px-4 py-2 text-xs font-bold text-white shadow-xs hover:from-rose-800 hover:to-rose-900 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Department
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-900 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-900 shadow-xs">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Top Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Divisions</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{departments.length}</span>
            <FolderTree className="h-5 w-5 text-rose-600" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Registered Machines</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{taskMasters.length}</span>
            <Cpu className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Maintenance Technicians</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {users.filter((u) => u.role === 'doer').length}
            </span>
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Scheduled Tasks (1-Yr)</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{scheduledTasks.length}</span>
            <Wrench className="h-5 w-5 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search departments by name, code, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-4 text-xs focus:border-rose-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDepartments.map((dept) => {
          const deptUsers = users.filter(
            (u) =>
              u.departmentId === dept.id ||
              u.departmentName === dept.departmentName ||
              u.departmentId === dept.departmentId
          );
          const deptMachines = taskMasters.filter(
            (tm) =>
              tm.departmentId === dept.id ||
              tm.departmentName === dept.departmentName ||
              tm.departmentId === dept.departmentId
          );
          const deptSchedules = scheduledTasks.filter(
            (s) =>
              s.departmentId === dept.id ||
              s.departmentName === dept.departmentName ||
              s.departmentId === dept.departmentId
          );

          return (
            <div
              key={dept.id}
              className="flex flex-col justify-between rounded-xl border border-rose-100 bg-white p-5 shadow-xs hover:border-rose-300 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{dept.departmentName}</h3>
                      <span className="inline-block rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                        {dept.departmentId}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleOpenEdit(dept)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Edit Department"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <p className="mt-3 text-xs text-slate-600 line-clamp-2">
                  {dept.description || 'Primary manufacturing & preventive machine maintenance center.'}
                </p>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Status:</span>
                    <span
                      className={`font-bold capitalize ${
                        dept.status === 'active' ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {dept.status || 'active'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Assigned Technicians:</span>
                    <span className="font-bold text-blue-700">{deptUsers.length} Users</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Machines / Masters:</span>
                    <span className="font-bold text-rose-800">{deptMachines.length} Machines</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Yearly Schedule Slots:</span>
                    <span className="font-bold text-emerald-700">{deptSchedules.length} Tasks</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedDeptDetail(dept)}
                  className="w-full rounded-lg bg-slate-50 py-2 text-xs font-bold text-rose-800 border border-slate-200 hover:bg-rose-50 transition-colors"
                >
                  View Department Machine Roster ({deptMachines.length})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Machine Roster Detail Modal */}
      {selectedDeptDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-rose-700" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedDeptDetail.departmentName} ({selectedDeptDetail.departmentId}) - Machine Roster
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    All machines and preventive maintenance masters assigned to this division.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeptDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {taskMasters.filter(
                (tm) =>
                  tm.departmentId === selectedDeptDetail.id ||
                  tm.departmentName === selectedDeptDetail.departmentName ||
                  tm.departmentId === selectedDeptDetail.departmentId
              ).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No machines assigned to this department yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Machine Name</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Technician</th>
                        <th className="p-2.5">Frequency</th>
                        <th className="p-2.5">Start Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {taskMasters
                        .filter(
                          (tm) =>
                            tm.departmentId === selectedDeptDetail.id ||
                            tm.departmentName === selectedDeptDetail.departmentName ||
                            tm.departmentId === selectedDeptDetail.departmentId
                        )
                        .map((tm) => (
                          <tr key={tm.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-mono font-bold text-rose-900">{tm.taskCode}</td>
                            <td className="p-2.5 font-bold text-slate-900">{tm.taskName}</td>
                            <td className="p-2.5">
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                {tm.taskCategory || 'Preventive Maintenance'}
                              </span>
                            </td>
                            <td className="p-2.5 text-blue-700 font-bold">{tm.assignedUserName}</td>
                            <td className="p-2.5 font-mono text-emerald-800 font-bold">
                              {tm.frequencyType === 'interval_days'
                                ? `${tm.frequencyValue} Days`
                                : tm.frequencyType}
                            </td>
                            <td className="p-2.5 font-mono text-slate-600">{tm.startDate}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                onClick={() => setSelectedDeptDetail(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingDept ? 'Edit Department Details' : 'Create New Department'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs text-slate-700">
              <div>
                <label className="mb-1 block font-bold text-slate-900">Department / Division Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yarn Division, Weaving, Carding"
                  value={formData.departmentName}
                  onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-900">Department Code / ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DEPT-01, YARN-DIV"
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-900">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
                  }
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-rose-500 focus:outline-hidden"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-900">Description &amp; Purpose</label>
                <textarea
                  rows={3}
                  placeholder="Describe plant area and functions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800"
                >
                  {editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
