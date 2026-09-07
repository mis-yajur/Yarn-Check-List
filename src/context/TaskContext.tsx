import React, { createContext, useContext, useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  calculateVisibilityDate,
  generateYflDualRotationSchedule,
  getDayName,
  getFrequencySummary,
  YflRotationEngineResult,
} from '../services/recurrenceEngine';
import { evaluateTaskCompletion } from '../services/scoringEngine';
import { storage } from '../services/storage';
import {
  AppSettings,
  AuditLog,
  ChecklistItemResponse,
  ChecklistTemplate,
  DailyScheduleRow,
  Department,
  Holiday,
  NotificationItem,
  ScheduledTask,
  TaskMaster,
  User,
} from '../types';
import { useAuth } from './AuthContext';

interface TaskContextType {
  taskMasters: TaskMaster[];
  scheduledTasks: ScheduledTask[];
  departments: Department[];
  users: User[];
  checklistTemplates: ChecklistTemplate[];
  settings: AppSettings;
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  holidays: Holiday[];
  todayStr: string;

  // Task Master actions
  addTaskMaster: (data: Omit<TaskMaster, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => { success: boolean; task?: TaskMaster; message?: string };
  updateTaskMaster: (id: string, data: Partial<TaskMaster>, rescheduleOptions?: { applyToFutureOnly: boolean }) => { success: boolean; message?: string };
  deactivateTaskMaster: (id: string) => { success: boolean; message?: string };
  deleteTaskMasterSafe: (id: string, cancelFutureOnly?: boolean) => { success: boolean; message?: string };

  // Schedule actions
  generateYflRotationSchedule: (options?: {
    startDate?: string;
    durationDays?: number;
    horizonMonths?: number;
    skipHolidays?: boolean;
    skipSundays?: boolean;
  }) => { success: boolean; result?: YflRotationEngineResult; message?: string };
  generateOneYearSchedule: (customStartDate?: string) => { success: boolean; count: number; message?: string };
  extendSchedule: (monthsToAdd: number) => { success: boolean; count: number; message?: string };
  bulkGenerateSchedules: (taskMasterIds?: string[]) => { success: boolean; totalCount: number; message?: string };
  generateSequentialSchedule: (options?: any) => { success: boolean; totalCount: number; message?: string };

  // Task Completion actions
  markTaskAsDone: (
    scheduleId: string,
    data: {
      remarks?: string;
      observation?: string;
      correctiveAction?: string;
      checklistResponses?: ChecklistItemResponse[];
      evidenceUrls?: string[];
      overrideCompletionDate?: string;
    }
  ) => { success: boolean; message?: string; task?: ScheduledTask };

  adminCorrectCompletion: (
    scheduleId: string,
    data: {
      reason: string;
      newStatus: ScheduledTask['status'];
      newScore?: number;
      remarks?: string;
    }
  ) => { success: boolean; message?: string };

  // Holidays
  addHoliday: (holidayData: Omit<Holiday, 'id' | 'createdAt'>) => { success: boolean; message?: string };
  updateHoliday: (id: string, data: Partial<Holiday>) => { success: boolean; message?: string };
  deleteHoliday: (id: string) => { success: boolean; message?: string };

  // User management actions
  addUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; user?: User; message?: string };
  updateUser: (userId: string, data: Partial<User>) => { success: boolean; message?: string };
  toggleUserStatus: (userId: string) => { success: boolean; status: 'active' | 'suspended'; message?: string };
  resetUserPassword: (userId: string) => { success: boolean; newPass: string; message?: string };
  deleteUser: (userId: string, reassignToUserId?: string) => { success: boolean; message?: string };

  // Department actions
  addDepartment: (data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; message?: string };
  updateDepartment: (id: string, data: Partial<Department>) => { success: boolean; message?: string };

  // Checklist template actions
  saveChecklistTemplate: (template: ChecklistTemplate) => { success: boolean; message?: string };
  deleteChecklistTemplate: (id: string) => { success: boolean; message?: string };

  // Settings & Notifications
  updateSettings: (newSettings: Partial<AppSettings>) => { success: boolean; message?: string };
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Bulk Import
  bulkImportTasks: (rows: Array<Partial<TaskMaster>>) => { success: boolean; importedCount: number; errors: string[] };

  // Refresh & Reset
  refreshData: () => void;
  reloadFromStorage: () => void;
  setTodayStr: (date: string) => void;
  clearAllData: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const getLiveDateStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [taskMasters, setTaskMasters] = useState<TaskMaster[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // Real factory date or simulated date (default '2026-07-04' or live date)
  const [todayStr, setTodayStrState] = useState<string>(() => {
    return localStorage.getItem('yfl_simulated_date') || '2026-07-04';
  });

  const setTodayStr = (newDate: string) => {
    localStorage.setItem('yfl_simulated_date', newDate);
    setTodayStrState(newDate);
  };

  const updateDynamicStatuses = (tasks: ScheduledTask[], advanceDays: number, currentToday: string): ScheduledTask[] => {
    return tasks.map((task) => {
      // If already completed or cancelled/suspended, keep as is
      if (
        task.status === 'completed_early' ||
        task.status === 'completed_on_time' ||
        task.status === 'completed_late' ||
        task.status === 'cancelled' ||
        task.status === 'suspended'
      ) {
        return task;
      }

      const dueDate = task.dueDate;
      const visDate = task.visibilityDate || calculateVisibilityDate(dueDate, advanceDays);

      if (dueDate < currentToday) {
        return { ...task, status: 'overdue' };
      } else if (dueDate === currentToday) {
        return { ...task, status: 'due_today' };
      } else if (visDate <= currentToday) {
        return { ...task, status: 'available' };
      } else {
        return { ...task, status: 'future' };
      }
    });
  };

  const loadAll = () => {
    const rawMasters = storage.getTaskMasters();
    const rawHolidays = storage.getHolidays();
    const rawSchedules = storage.getScheduledTasks();
    const currentSettings = storage.getSettings();
    const updatedSchedules = updateDynamicStatuses(rawSchedules, currentSettings.taskAdvanceVisibilityDays || 5, todayStr);

    setTaskMasters(rawMasters);
    setHolidays(rawHolidays);
    setScheduledTasks(updatedSchedules);
    setDepartments(storage.getDepartments());
    setUsers(storage.getUsers());
    setChecklistTemplates(storage.getChecklistTemplates());
    setSettings(currentSettings);
    setNotifications(storage.getNotifications());
    setAuditLogs(storage.getAuditLogs());
  };

  const clearAllData = () => {
    storage.clearAllData();
    loadAll();
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Update dynamic task statuses whenever todayStr or advanceDays changes
  useEffect(() => {
    setScheduledTasks((prev) => updateDynamicStatuses(prev, settings.taskAdvanceVisibilityDays || 5, todayStr));
  }, [todayStr, settings.taskAdvanceVisibilityDays]);

  // Task Master actions
  const addTaskMaster = (data: Omit<TaskMaster, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const newId = `tm-${Date.now()}`;
    const newTask: TaskMaster = {
      ...data,
      id: newId,
      status: 'active',
      createdBy: currentUser?.name || 'Administrator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...taskMasters, newTask];
    storage.saveTaskMasters(updated);
    setTaskMasters(updated);

    storage.addAuditLog({
      action: 'TASK_MASTER_CREATED',
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Admin',
      role: currentUser?.role || 'admin',
      recordType: 'TaskMaster',
      recordId: newTask.taskCode,
      reason: `Added new machine task master: ${newTask.taskName}`,
    });

    return { success: true, task: newTask, message: 'Machine Task Master created successfully.' };
  };

  const updateTaskMaster = (id: string, data: Partial<TaskMaster>, rescheduleOptions?: { applyToFutureOnly: boolean }) => {
    const index = taskMasters.findIndex((t) => t.id === id);
    if (index === -1) return { success: false, message: 'Task Master not found' };

    const old = taskMasters[index];
    const updatedMaster: TaskMaster = {
      ...old,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const newMasters = [...taskMasters];
    newMasters[index] = updatedMaster;
    storage.saveTaskMasters(newMasters);
    setTaskMasters(newMasters);

    // If future tasks need updating (assigned user, department, checklist name)
    if (rescheduleOptions?.applyToFutureOnly) {
      const updatedSchedules = scheduledTasks.map((st) => {
        if (st.taskMasterId === id && !st.completedAt && st.dueDate >= todayStr) {
          return {
            ...st,
            taskName: updatedMaster.taskName,
            assignedUserId: updatedMaster.assignedUserId,
            assignedUserName: updatedMaster.assignedUserName,
            assignedEmployeeId: updatedMaster.assignedEmployeeId,
            departmentId: updatedMaster.departmentId,
            departmentName: updatedMaster.departmentName,
            checklistTemplateId: updatedMaster.checklistTemplateId,
            checklistName: updatedMaster.checklistName,
            priority: updatedMaster.priority,
            instructions: updatedMaster.instructions,
          };
        }
        return st;
      });

      storage.saveScheduledTasks(updatedSchedules);
      setScheduledTasks(updatedSchedules);
    }

    storage.addAuditLog({
      action: 'TASK_MASTER_UPDATED',
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Admin',
      role: currentUser?.role || 'admin',
      recordType: 'TaskMaster',
      recordId: old.taskCode,
      previousData: old,
      newData: updatedMaster,
      reason: `Updated machine task master ${updatedMaster.taskName}`,
    });

    return { success: true, message: 'Machine Task Master updated successfully.' };
  };

  const deactivateTaskMaster = (id: string) => {
    return updateTaskMaster(id, { status: 'inactive' });
  };

  const deleteTaskMasterSafe = (id: string, cancelFutureOnly: boolean = true) => {
    const master = taskMasters.find((t) => t.id === id);
    if (!master) return { success: false, message: 'Task Master not found.' };

    const hasCompleted = scheduledTasks.some((s) => s.taskMasterId === id && s.completedAt);

    if (hasCompleted) {
      // Soft-deactivate to protect historic audit records
      const newMasters = taskMasters.map((t) => (t.id === id ? { ...t, status: 'deactivated' as const } : t));
      storage.saveTaskMasters(newMasters);
      setTaskMasters(newMasters);

      if (cancelFutureOnly) {
        const updatedSchedules = scheduledTasks.map((s) => {
          if (s.taskMasterId === id && !s.completedAt && s.dueDate >= todayStr) {
            return { ...s, status: 'cancelled' as const };
          }
          return s;
        });
        storage.saveScheduledTasks(updatedSchedules);
        setScheduledTasks(updatedSchedules);
      }

      storage.addAuditLog({
        action: 'TASK_MASTER_DEACTIVATED',
        userId: currentUser?.id || 'sys',
        userName: currentUser?.name || 'Admin',
        role: currentUser?.role || 'admin',
        recordType: 'TaskMaster',
        recordId: master.taskCode,
        reason: 'Task Master marked as deactivated to preserve completed audit records.',
      });

      return {
        success: true,
        message: 'Task Master deactivated and future occurrences cancelled. Historic completion data was preserved.',
      };
    } else {
      // Hard delete if no completions exist
      const newMasters = taskMasters.filter((t) => t.id !== id);
      const newSchedules = scheduledTasks.filter((s) => s.taskMasterId !== id);
      storage.saveTaskMasters(newMasters);
      storage.saveScheduledTasks(newSchedules);
      setTaskMasters(newMasters);
      setScheduledTasks(newSchedules);

      return { success: true, message: 'Task Master and schedule deleted.' };
    }
  };

  // 17-Day Dual Rotation Scheduling Engine
  const generateYflRotationSchedule = (options?: {
    startDate?: string;
    durationDays?: number;
    horizonMonths?: number;
    skipHolidays?: boolean;
    skipSundays?: boolean;
  }) => {
    const startDate = options?.startDate || '2026-07-04';
    const durationDays = options?.durationDays || (options?.horizonMonths ? options.horizonMonths * 30 : 365);
    const skipHolidays = options?.skipHolidays ?? (settings.holidayPolicy === 'skip_and_shift');
    const skipSundays = options?.skipSundays ?? settings.skipSundays ?? true;
    const advanceDays = settings.taskAdvanceVisibilityDays || 5;

    const activeMasters = taskMasters.filter((t) => t.status === 'active');
    if (activeMasters.length === 0) {
      return { success: false, message: 'No active Task Masters found in Yarn Division.' };
    }

    const engineResult = generateYflDualRotationSchedule(activeMasters, {
      startDate,
      durationDays,
      holidays,
      skipHolidays,
      skipSundays,
      advanceDays,
    });

    // Retain previously completed tasks to protect audit trail
    const completedTasks = scheduledTasks.filter((s) => s.completedAt);
    const completedKeySet = new Set(completedTasks.map((s) => `${s.taskMasterId}_${s.dueDate}`));

    const freshSchedules = engineResult.scheduledTasks
      .filter((s) => !completedKeySet.has(`${s.taskMasterId}_${s.dueDate}`))
      .map((s) => {
        let initialStatus: ScheduledTask['status'] = 'future';
        if (s.dueDate < todayStr) initialStatus = 'overdue';
        else if (s.dueDate === todayStr) initialStatus = 'due_today';
        else if (s.visibilityDate <= todayStr) initialStatus = 'available';
        return { ...s, status: initialStatus };
      });

    const merged = [...completedTasks, ...freshSchedules].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    storage.saveScheduledTasks(merged);
    setScheduledTasks(merged);

    // Update masters with last generated through date
    const updatedMasters = taskMasters.map((t) => ({ ...t, lastScheduleGeneratedThrough: engineResult.endDate }));
    storage.saveTaskMasters(updatedMasters);
    setTaskMasters(updatedMasters);

    storage.addAuditLog({
      action: 'SCHEDULE_GENERATED',
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Admin',
      role: currentUser?.role || 'admin',
      recordType: 'MasterSchedule',
      recordId: 'YFL-17DAY-ROTATION',
      reason: `Generated ${freshSchedules.length} dual-group rotation task occurrences (${engineResult.totalWorkingDays} working days, Sunday skipped) from ${startDate} through ${engineResult.endDate}.`,
    });

    return {
      success: true,
      result: engineResult,
      message: `Successfully generated ${freshSchedules.length} machine maintenance tasks across ${engineResult.totalWorkingDays} working days through ${engineResult.endDate}.`,
    };
  };

  const generateOneYearSchedule = (customStartDate?: string) => {
    const res = generateYflRotationSchedule({
      startDate: customStartDate || '2026-07-04',
      durationDays: 365,
      skipHolidays: true,
      skipSundays: true,
    });
    return {
      success: res.success,
      count: res.result?.totalTaskRecords || 0,
      message: res.message,
    };
  };

  const extendSchedule = (monthsToAdd: number) => {
    const currentEnd = scheduledTasks[scheduledTasks.length - 1]?.dueDate || '2026-07-04';
    const res = generateYflRotationSchedule({
      startDate: '2026-07-04',
      durationDays: 365 + monthsToAdd * 30,
    });
    return {
      success: res.success,
      count: res.result?.totalTaskRecords || 0,
      message: res.message,
    };
  };

  const bulkGenerateSchedules = () => {
    return generateOneYearSchedule('2026-07-04');
  };

  const generateSequentialSchedule = (options?: any) => {
    return generateOneYearSchedule(options?.startDate || '2026-07-04');
  };

  // Task Completion (Individual Machine Support)
  const markTaskAsDone = (
    scheduleId: string,
    data: {
      remarks?: string;
      observation?: string;
      correctiveAction?: string;
      checklistResponses?: ChecklistItemResponse[];
      evidenceUrls?: string[];
      overrideCompletionDate?: string;
    }
  ) => {
    const taskIndex = scheduledTasks.findIndex((s) => s.id === scheduleId || s.scheduleId === scheduleId);
    if (taskIndex === -1) {
      return { success: false, message: 'Scheduled task not found' };
    }

    const task = scheduledTasks[taskIndex];
    const completionDate = data.overrideCompletionDate || todayStr;
    const nowIso = new Date().toISOString();
    const timeStr = format(new Date(), 'HH:mm:ss');

    const evalResult = evaluateTaskCompletion(task.dueDate, completionDate, settings.scoreRules);

    let finalStatus: ScheduledTask['status'] = 'completed_on_time';
    if (evalResult.classification === 'early') finalStatus = 'completed_early';
    if (evalResult.classification === 'late') finalStatus = 'completed_late';

    const completedTask: ScheduledTask = {
      ...task,
      status: finalStatus,
      completedAt: nowIso,
      completedDate: completionDate,
      completedTime: timeStr,
      completionClassification: evalResult.classification,
      delayDays: evalResult.delayDays,
      score: evalResult.score,
      remarks: data.remarks || '',
      observation: data.observation || '',
      correctiveAction: data.correctiveAction || '',
      checklistResponses: data.checklistResponses || [],
      evidenceUrls: data.evidenceUrls || [],
    };

    const updatedTasks = [...scheduledTasks];
    updatedTasks[taskIndex] = completedTask;

    storage.saveScheduledTasks(updatedTasks);
    setScheduledTasks(updatedTasks);

    storage.addAuditLog({
      action: 'TASK_COMPLETED',
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Doer',
      role: currentUser?.role || 'doer',
      recordType: 'ScheduledTask',
      recordId: task.scheduleId,
      reason: `Completed ${task.taskName} (${finalStatus.replace('completed_', '').replace('_', ' ')}) with score ${evalResult.score}.`,
    });

    return {
      success: true,
      task: completedTask,
      message: `Machine task ${task.taskName} marked as completed (${evalResult.classification.toUpperCase()}). Score: ${evalResult.score}`,
    };
  };

  const adminCorrectCompletion = (
    scheduleId: string,
    data: {
      reason: string;
      newStatus: ScheduledTask['status'];
      newScore?: number;
      remarks?: string;
    }
  ) => {
    const taskIndex = scheduledTasks.findIndex((s) => s.id === scheduleId || s.scheduleId === scheduleId);
    if (taskIndex === -1) return { success: false, message: 'Task not found' };

    const old = scheduledTasks[taskIndex];
    const updated: ScheduledTask = {
      ...old,
      status: data.newStatus,
      score: data.newScore !== undefined ? data.newScore : old.score,
      remarks: data.remarks || old.remarks,
      adminCorrection: {
        correctedBy: currentUser?.id || 'admin',
        correctedByName: currentUser?.name || 'Admin',
        correctedAt: new Date().toISOString(),
        reason: data.reason,
        oldStatus: old.status,
        newStatus: data.newStatus,
        oldScore: old.score,
        newScore: data.newScore,
      },
    };

    const nextTasks = [...scheduledTasks];
    nextTasks[taskIndex] = updated;
    storage.saveScheduledTasks(nextTasks);
    setScheduledTasks(nextTasks);

    storage.addAuditLog({
      action: 'ADMIN_CORRECTION',
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Admin',
      role: 'admin',
      recordType: 'ScheduledTask',
      recordId: old.scheduleId,
      reason: `Admin correction on ${old.taskName}: ${data.reason}`,
    });

    return { success: true, message: 'Task completion corrected by admin.' };
  };

  // Holiday management
  const addHoliday = (holidayData: Omit<Holiday, 'id' | 'createdAt'>) => {
    const newHoliday: Holiday = {
      ...holidayData,
      id: `hol-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...holidays, newHoliday].sort((a, b) => a.date.localeCompare(b.date));
    storage.saveHolidays(updated);
    setHolidays(updated);

    storage.addAuditLog({
      action: 'HOLIDAY_ADDED',
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Admin',
      role: 'admin',
      recordType: 'Holiday',
      recordId: newHoliday.date,
      reason: `Added holiday: ${newHoliday.name} on ${newHoliday.date}`,
    });

    return { success: true, message: `Holiday "${newHoliday.name}" added successfully.` };
  };

  const updateHoliday = (id: string, data: Partial<Holiday>) => {
    const updated = holidays.map((h) => (h.id === id ? { ...h, ...data } : h));
    storage.saveHolidays(updated);
    setHolidays(updated);
    return { success: true, message: 'Holiday updated successfully.' };
  };

  const deleteHoliday = (id: string) => {
    const target = holidays.find((h) => h.id === id);
    const updated = holidays.filter((h) => h.id !== id);
    storage.saveHolidays(updated);
    setHolidays(updated);

    if (target) {
      storage.addAuditLog({
        action: 'HOLIDAY_DELETED',
        userId: currentUser?.id || 'admin',
        userName: currentUser?.name || 'Admin',
        role: 'admin',
        recordType: 'Holiday',
        recordId: target.date,
        reason: `Removed holiday: ${target.name} (${target.date})`,
      });
    }

    return { success: true, message: 'Holiday removed successfully.' };
  };

  // User management
  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...users, newUser];
    storage.saveUsers(updated);
    setUsers(updated);
    return { success: true, user: newUser, message: 'User created successfully.' };
  };

  const updateUser = (userId: string, data: Partial<User>) => {
    const updated = users.map((u) => (u.id === userId ? { ...u, ...data, updatedAt: new Date().toISOString() } : u));
    storage.saveUsers(updated);
    setUsers(updated);
    return { success: true, message: 'User updated successfully.' };
  };

  const toggleUserStatus = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, status: 'active', message: 'User not found' };
    const nextStatus: User['status'] = user.status === 'active' ? 'suspended' : 'active';
    updateUser(userId, { status: nextStatus });
    return { success: true, status: nextStatus, message: `User status changed to ${nextStatus}.` };
  };

  const resetUserPassword = (userId: string) => {
    const defaultNewPass = 'User@1234';
    updateUser(userId, { password: defaultNewPass, mustChangePassword: true });
    return { success: true, newPass: defaultNewPass, message: 'Password reset to default User@1234.' };
  };

  const deleteUser = (userId: string) => {
    const updated = users.filter((u) => u.id !== userId);
    storage.saveUsers(updated);
    setUsers(updated);
    return { success: true, message: 'User deleted.' };
  };

  // Department
  const addDepartment = (data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDept: Department = {
      ...data,
      id: `dept-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...departments, newDept];
    storage.saveDepartments(updated);
    setDepartments(updated);
    return { success: true, message: 'Department added successfully.' };
  };

  const updateDepartment = (id: string, data: Partial<Department>) => {
    const updated = departments.map((d) => (d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d));
    storage.saveDepartments(updated);
    setDepartments(updated);
    return { success: true, message: 'Department updated successfully.' };
  };

  // Checklist template
  const saveChecklistTemplate = (template: ChecklistTemplate) => {
    const existingIndex = checklistTemplates.findIndex((c) => c.id === template.id);
    let updated: ChecklistTemplate[];
    if (existingIndex >= 0) {
      updated = [...checklistTemplates];
      updated[existingIndex] = { ...template, updatedAt: new Date().toISOString() };
    } else {
      updated = [...checklistTemplates, { ...template, id: `chk-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
    }
    storage.saveChecklistTemplates(updated);
    setChecklistTemplates(updated);
    return { success: true, message: 'Checklist template saved.' };
  };

  const deleteChecklistTemplate = (id: string) => {
    const updated = checklistTemplates.filter((c) => c.id !== id);
    storage.saveChecklistTemplates(updated);
    setChecklistTemplates(updated);
    return { success: true, message: 'Checklist template deleted.' };
  };

  // Settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    storage.saveSettings(updated);
    setSettings(updated);
    return { success: true, message: 'System settings saved.' };
  };

  const markNotificationAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    storage.saveNotifications(updated);
    setNotifications(updated);
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    storage.saveNotifications(updated);
    setNotifications(updated);
  };

  const bulkImportTasks = (rows: Array<Partial<TaskMaster>>) => {
    const validTasks: TaskMaster[] = [];
    const errors: string[] = [];

    rows.forEach((row, idx) => {
      if (!row.taskName) {
        errors.push(`Row ${idx + 1}: Missing machine task name`);
        return;
      }
      const taskCode = row.taskCode || `TM-${(taskMasters.length + validTasks.length + 1).toString().padStart(3, '0')}`;
      const rotGroup = row.rotationGroup || 'MC1';
      const rotPos = row.rotationPosition || (validTasks.length + 1);

      validTasks.push({
        id: `tm-imp-${Date.now()}-${idx}`,
        taskId: row.taskId || (validTasks.length + 1),
        machineId: `M-${taskCode}`,
        machineName: row.taskName,
        taskCode,
        taskName: row.taskName,
        taskDescription: row.taskDescription || `Preventive maintenance for ${row.taskName}`,
        checklistTemplateId: row.checklistTemplateId || 'chk-machine-maint',
        checklistName: row.checklistName || 'Machine Maintenance Checklist',
        assignedUserId: row.assignedUserId || 'user-doer-1',
        assignedUserName: row.assignedUserName || 'Swapan Kr Ghorai',
        assignedEmployeeId: row.assignedEmployeeId || 'YFL-084',
        departmentId: row.departmentId || 'dept-yarn-1',
        departmentName: row.departmentName || 'Yarn Division',
        rotationGroup: rotGroup,
        rotationPosition: rotPos,
        scheduleType: '17-Day Dual Rotation',
        frequencyType: 'sequential_rotation',
        frequencyValue: 2,
        startDate: row.startDate || '2026-07-04',
        priority: row.priority || 'medium',
        status: 'active',
        taskCategory: row.taskCategory || 'Machinery Maintenance',
        createdBy: currentUser?.name || 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    if (validTasks.length > 0) {
      const merged = [...validTasks, ...taskMasters];
      storage.saveTaskMasters(merged);
      setTaskMasters(merged);

      storage.addAuditLog({
        action: 'BULK_TASK_IMPORT',
        userId: currentUser?.id || 'admin',
        userName: currentUser?.name || 'Admin',
        role: 'admin',
        recordType: 'TaskMaster',
        recordId: `Batch-${Date.now()}`,
        reason: `Bulk imported ${validTasks.length} task masters.`,
      });
    }

    return {
      success: validTasks.length > 0,
      importedCount: validTasks.length,
      errors,
    };
  };

  const refreshData = () => {
    loadAll();
  };

  return (
    <TaskContext.Provider
      value={{
        taskMasters,
        scheduledTasks: updateDynamicStatuses(scheduledTasks, settings.taskAdvanceVisibilityDays || 5, todayStr),
        departments,
        users,
        checklistTemplates,
        settings,
        notifications,
        auditLogs,
        holidays,
        todayStr,
        addTaskMaster,
        updateTaskMaster,
        deactivateTaskMaster,
        deleteTaskMasterSafe,
        generateYflRotationSchedule,
        generateOneYearSchedule,
        extendSchedule,
        bulkGenerateSchedules,
        generateSequentialSchedule,
        markTaskAsDone,
        adminCorrectCompletion,
        addHoliday,
        updateHoliday,
        deleteHoliday,
        addUser,
        updateUser,
        toggleUserStatus,
        resetUserPassword,
        deleteUser,
        addDepartment,
        updateDepartment,
        saveChecklistTemplate,
        deleteChecklistTemplate,
        updateSettings,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        bulkImportTasks,
        refreshData,
        reloadFromStorage: loadAll,
        setTodayStr,
        clearAllData,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
