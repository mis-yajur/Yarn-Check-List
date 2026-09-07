import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Edit2,
  FileSpreadsheet,
  Filter,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { SchedulePreviewModal } from '../../components/modals/SchedulePreviewModal';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { getFrequencySummary } from '../../services/recurrenceEngine';
import { FrequencyType, TaskMaster, TaskPriority } from '../../types';

interface TaskManagementPageProps {
  onOpenImport: () => void;
}

export const TaskManagementPage: React.FC<TaskManagementPageProps> = ({ onOpenImport }) => {
  const {
    taskMasters,
    scheduledTasks,
    departments,
    users,
    checklistTemplates,
    addTaskMaster,
    updateTaskMaster,
    deactivateTaskMaster,
    deleteTaskMasterSafe,
    bulkGenerateSchedules,
    todayStr,
  } = useTasks();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [selectedTaskForPreview, setSelectedTaskForPreview] = useState<TaskMaster | null>(null);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskMaster | null>(null);
  const [formData, setFormData] = useState({
    taskCode: '',
    taskName: '',
    taskDescription: '',
    checklistTemplateId: '',
    assignedUserId: '',
    departmentId: '',
    taskCategory: 'Preventive Maintenance',
    frequencyType: 'interval_days' as FrequencyType,
    frequencyValue: 15,
    weeklyDay: 1,
    startDate: todayStr,
    priority: 'medium' as TaskPriority,
    estimatedDuration: '45 mins',
    instructions: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Bulk Selection
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Filtering
  const filteredTasks = taskMasters.filter((task) => {
    const matchesSearch =
      task.taskCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.checklistName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = departmentFilter === 'all' || task.departmentId === departmentFilter;
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesFreq = frequencyFilter === 'all' || task.frequencyType === frequencyFilter;

    return matchesSearch && matchesDept && matchesStatus && matchesFreq;
  });

  const handleOpenAdd = () => {
    setEditingTask(null);
    const nextCode = `TM-${(taskMasters.length + 1).toString().padStart(3, '0')}`;
    setFormData({
      taskCode: nextCode,
      taskName: '',
      taskDescription: '',
      checklistTemplateId: checklistTemplates[0]?.id || '',
      assignedUserId: users.find((u) => u.role === 'doer')?.id || users[0]?.id || '',
      departmentId: departments[0]?.id || '',
      taskCategory: 'Preventive Maintenance',
      frequencyType: 'interval_days',
      frequencyValue: 15,
      weeklyDay: 1,
      startDate: todayStr,
      priority: 'medium',
      estimatedDuration: '45 mins',
      instructions: 'Isolate main breaker, verify interlocks, and record checklist results.',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: TaskMaster) => {
    setEditingTask(task);
    setFormData({
      taskCode: task.taskCode,
      taskName: task.taskName,
      taskDescription: task.taskDescription,
      checklistTemplateId: task.checklistTemplateId,
      assignedUserId: task.assignedUserId,
      departmentId: task.departmentId,
      taskCategory: task.taskCategory,
      frequencyType: task.frequencyType,
      frequencyValue: task.frequencyValue,
      weeklyDay: task.weeklyDay || 1,
      startDate: task.startDate,
      priority: task.priority,
      estimatedDuration: task.estimatedDuration || '45 mins',
      instructions: task.instructions || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.taskName.trim()) {
      setFormError('Task / Machine Name is required.');
      return;
    }

    const assignedUser = users.find((u) => u.id === formData.assignedUserId);
    const dept = departments.find((d) => d.id === formData.departmentId);
    const chk = checklistTemplates.find((c) => c.id === formData.checklistTemplateId);

    if (editingTask) {
      // Update
      const res = updateTaskMaster(
        editingTask.id,
        {
          taskName: formData.taskName,
          taskDescription: formData.taskDescription,
          checklistTemplateId: formData.checklistTemplateId,
          checklistName: chk?.templateName || 'Checklist',
          assignedUserId: formData.assignedUserId,
          assignedUserName: assignedUser?.name || '',
          assignedEmployeeId: assignedUser?.employeeId || '',
          departmentId: formData.departmentId,
          departmentName: dept?.departmentName || '',
          taskCategory: formData.taskCategory,
          frequencyType: formData.frequencyType,
          frequencyValue: Number(formData.frequencyValue),
          weeklyDay: formData.weeklyDay,
          startDate: formData.startDate,
          priority: formData.priority,
          estimatedDuration: formData.estimatedDuration,
          instructions: formData.instructions,
        },
        { applyToFutureOnly: true }
      );

      if (res.success) {
        setIsModalOpen(false);
        setSuccessBanner(`Task Master ${formData.taskCode} updated successfully.`);
      } else {
        setFormError(res.message || 'Error updating task.');
      }
    } else {
      // Add
      const res = addTaskMaster({
        taskCode: formData.taskCode,
        taskName: formData.taskName,
        taskDescription: formData.taskDescription,
        checklistTemplateId: formData.checklistTemplateId,
        checklistName: chk?.templateName || 'Checklist',
        assignedUserId: formData.assignedUserId,
        assignedUserName: assignedUser?.name || '',
        assignedEmployeeId: assignedUser?.employeeId || '',
        departmentId: formData.departmentId,
        departmentName: dept?.departmentName || '',
        taskCategory: formData.taskCategory,
        frequencyType: formData.frequencyType,
        frequencyValue: Number(formData.frequencyValue),
        weeklyDay: formData.weeklyDay,
        startDate: formData.startDate,
        priority: formData.priority,
        estimatedDuration: formData.estimatedDuration,
        instructions: formData.instructions,
        status: 'active',
      });

      if (res.success && res.task) {
        setIsModalOpen(false);
        setSuccessBanner(`Task Master created successfully! Previewing 1-year schedule...`);
        // Immediately offer schedule preview
        setSelectedTaskForPreview(res.task);
      } else {
        setFormError(res.message || 'Error creating task master.');
      }
    }
  };

  const handleBulkSchedule = () => {
    if (selectedTaskIds.length === 0) return;
    const res = bulkGenerateSchedules(selectedTaskIds);
    setSuccessBanner(res.message || `Schedule generated for selected tasks.`);
    setSelectedTaskIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Task Masters &amp; Equipment</h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Configure machine checklists, assigned technicians, recurrence frequencies, and generate schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenImport}
            id="btn-bulk-import-csv"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Upload className="h-4 w-4 text-slate-600" />
            Bulk Import (CSV)
          </button>
          <button
            id="btn-add-task-master"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Add Task Master
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="input-task-search"
              type="text"
              placeholder="Search by Task Code, Machine, Doer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.departmentName}
                </option>
              ))}
            </select>
          </div>

          {/* Frequency Filter */}
          <div>
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="all">All Recurrence Rules</option>
              <option value="interval_days">Every 15 Days (Interval)</option>
              <option value="monthly_same_date">Monthly Same Date</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Strip */}
        {selectedTaskIds.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-900 border border-emerald-200">
            <span className="font-semibold">{selectedTaskIds.length} tasks selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkSchedule}
                className="rounded-md bg-emerald-700 px-3 py-1 font-bold text-white shadow-2xs hover:bg-emerald-800"
              >
                Generate 1-Year Schedule for Selected
              </button>
              <button
                onClick={() => setSelectedTaskIds([])}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task Masters Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedTaskIds(filteredTasks.map((t) => t.id));
                      else setSelectedTaskIds([]);
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                  />
                </th>
                <th className="p-3">Task ID</th>
                <th className="p-3">Machine / Task Name</th>
                <th className="p-3">Checklist Template</th>
                <th className="p-3">Assigned Doer</th>
                <th className="p-3">Frequency</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">Occurrences</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-700">
                    No task masters match your criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const occurrencesCount = scheduledTasks.filter((s) => s.taskMasterId === task.id).length;
                  const isSelected = selectedTaskIds.includes(task.id);

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedTaskIds([...selectedTaskIds, task.id]);
                            else setSelectedTaskIds(selectedTaskIds.filter((id) => id !== task.id));
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                        />
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">{task.taskCode}</td>
                      <td className="p-3 font-semibold text-slate-900">{task.taskName}</td>
                      <td className="p-3 text-slate-700">{task.checklistName}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900">{task.assignedUserName}</span>
                        <span className="block text-[10px] text-slate-700">ID: {task.assignedEmployeeId}</span>
                      </td>
                      <td className="p-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-800">
                          {getFrequencySummary(task.frequencyType, task.frequencyValue, task.weeklyDay)}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-700">{task.startDate}</td>
                      <td className="p-3">
                        <span className="font-bold text-emerald-800">{occurrencesCount}</span>
                        <span className="text-[10px] text-slate-700 block">scheduled</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            task.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedTaskForPreview(task)}
                            title="Preview 1-Year Schedule"
                            className="rounded p-1.5 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(task)}
                            title="Edit Task Master"
                            className="rounded p-1.5 text-blue-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to deactivate ${task.taskName}? Future occurrences will be cancelled.`)) {
                                deactivateTaskMaster(task.id);
                              }
                            }}
                            title="Deactivate"
                            className="rounded p-1.5 text-amber-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete or safe-deactivate ${task.taskName}? Historical completed records will remain protected.`)) {
                                deleteTaskMasterSafe(task.id);
                              }
                            }}
                            title="Delete"
                            className="rounded p-1.5 text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingTask ? `Edit Task Master: ${editingTask.taskCode}` : 'Add New Task Master'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Task Code / ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.taskCode}
                    onChange={(e) => setFormData({ ...formData, taskCode: e.target.value })}
                    required
                    disabled={!!editingTask}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 focus:border-emerald-500 focus:outline-hidden disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Machine / Task Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.taskName}
                    onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                    placeholder="e.g. COMBER-14 or B. Card-3"
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Checklist Template <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.checklistTemplateId}
                    onChange={(e) => setFormData({ ...formData, checklistTemplateId: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  >
                    {checklistTemplates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.templateName} ({c.items.length} items)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Doer / Technician <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.assignedUserId}
                    onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  >
                    {users
                      .filter((u) => u.status === 'active')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.employeeId} - {u.designation})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical (Plant Line)</option>
                  </select>
                </div>
              </div>

              {/* Recurrence Rule Picker (Sections 7 & 8) */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Recurrence Engine Configuration
                  </span>
                  <span className="text-[11px] text-emerald-800 font-semibold">
                    Separate Interval vs Monthly Rules
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Recurrence Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.frequencyType}
                      onChange={(e) => setFormData({ ...formData, frequencyType: e.target.value as FrequencyType })}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden bg-white"
                    >
                      <option value="interval_days">Interval Days (e.g. Every 15 Days)</option>
                      <option value="monthly_same_date">Monthly — Same Calendar Date</option>
                      <option value="monthly_last_day">Monthly — Last Valid Day of Month</option>
                      <option value="daily">Daily (Every X Days)</option>
                      <option value="weekly">Weekly (Specific Weekday)</option>
                      <option value="yearly">Yearly (Annual Recurring)</option>
                    </select>
                  </div>

                  {formData.frequencyType === 'interval_days' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Interval Step (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={formData.frequencyValue}
                        onChange={(e) => setFormData({ ...formData, frequencyValue: parseInt(e.target.value) || 15 })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden bg-white"
                      />
                    </div>
                  )}

                  {formData.frequencyType === 'weekly' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Day of Week
                      </label>
                      <select
                        value={formData.weeklyDay}
                        onChange={(e) => setFormData({ ...formData, weeklyDay: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden bg-white"
                      >
                        <option value={1}>Monday</option>
                        <option value={2}>Tuesday</option>
                        <option value={3}>Wednesday</option>
                        <option value={4}>Thursday</option>
                        <option value={5}>Friday</option>
                        <option value={6}>Saturday</option>
                        <option value={0}>Sunday</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden bg-white"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-700">
                  {formData.frequencyType === 'monthly_same_date'
                    ? 'Generates exact same calendar date each month (e.g. 27th of Sep, Oct, Nov). For day 29/30/31, uses configured last-day-of-month policy.'
                    : 'Adds fixed days intervals iteratively (e.g. 15 days = Sep 15, Sep 30, Oct 15, etc).'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Safety Instructions / Operating Procedure
                </label>
                <textarea
                  rows={2}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="e.g. Ensure main power isolator is padlocked before opening carding cover..."
                  className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-task-master"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
                >
                  {editingTask ? 'Save Changes' : 'Save Task Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Preview Modal */}
      {selectedTaskForPreview && (
        <SchedulePreviewModal
          task={selectedTaskForPreview}
          onClose={() => setSelectedTaskForPreview(null)}
          onSuccess={() => {
            setSelectedTaskForPreview(null);
            setSuccessBanner(`Master schedule generation confirmed.`);
          }}
        />
      )}
    </div>
  );
};
