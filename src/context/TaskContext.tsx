import React, { createContext, useContext, useEffect, useState } from 'react';
import { calculateVisibilityDate, generateScheduleDates, getFrequencySummary } from '../services/recurrenceEngine';
import { evaluateTaskCompletion } from '../services/scoringEngine';
import { storage } from '../services/storage';
import {
  AppSettings,
  AuditLog,
  ChecklistItemResponse,
  ChecklistTemplate,
  Department,
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
  todayStr: string;

  // Task Master actions
  addTaskMaster: (data: Omit<TaskMaster, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => { success: boolean; task?: TaskMaster; message?: string };
  updateTaskMaster: (id: string, data: Partial<TaskMaster>, rescheduleOptions?: { applyToFutureOnly: boolean }) => { success: boolean; message?: string };
  deactivateTaskMaster: (id: string) => { success: boolean; message?: string };
  deleteTaskMasterSafe: (id: string, cancelFutureOnly?: boolean) => { success: boolean; message?: string };

  // Schedule actions
  generateOneYearSchedule: (taskMasterId: string, customMonths?: number) => { success: boolean; count: number; message?: string };
  extendSchedule: (taskMasterId: string, monthsToAdd: number) => { success: boolean; count: number; message?: string };
  bulkGenerateSchedules: (taskMasterIds: string[]) => { success: boolean; totalCount: number; message?: string };

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

  // Live real factory date by default
  const [todayStr, setTodayStrState] = useState<string>(() => {
    return localStorage.getItem('yfl_simulated_date') || getLiveDateStr();
  });

  const setTodayStr = (newDate: string) => {
    localStorage.setItem('yfl_simulated_date', newDate);
    setTodayStrState(newDate);
  };

  const loadAll = () => {
    setTaskMasters(storage.getTaskMasters());
    setScheduledTasks(storage.getScheduledTasks());
    setDepartments(storage.getDepartments());
    setUsers(storage.getUsers());
    setChecklistTemplates(storage.getChecklistTemplates());
    setSettings(storage.getSettings());
    setNotifications(storage.getNotifications());
    setAuditLogs(storage.getAuditLogs());
  };

  const clearAllData = () => {
    storage.clearAllTaskData();
    loadAll();
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Update task statuses dynamically based on today's date if still open
  const updateDynamicStatuses = (tasks: ScheduledTask[], advanceDays: number): ScheduledTask[] => {
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

      if (dueDate < todayStr) {
        return { ...task, status: 'overdue' };
      } else if (dueDate === todayStr) {
        return { ...task, status: 'due_today' };
      } else if (visDate <= todayStr) {
        return { ...task, status: 'available' };
      } else {
        return { ...task, status: 'future' };
      }
    });
  };

  // Add Task Master
  const addTaskMaster = (data: Omit<TaskMaster, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const existing = taskMasters.find((t) => t.taskCode.toLowerCase() === data.taskCode.toLowerCase());
    if (existing) {
      return { success: false, message: `Task Code ${data.taskCode} already exists.` };
    }

    const newTask: TaskMaster = {
      ...data,
      id: `task-master-${Date.now()}`,
      createdBy: currentUser?.loginId || 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newTask, ...taskMasters];
    storage.saveTaskMasters(updated);
    setTaskMasters(updated);

    storage.addAuditLog({
      action: 'TASK_MASTER_CREATED',
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Admin',
      role: currentUser?.role || 'admin',
      recordType: 'TaskMaster',
      recordId: newTask.taskCode,
      reason: `Created master task for ${newTask.taskName} (${newTask.departmentName}).`,
      newData: newTask,
    });

    return { success: true, task: newTask, message: 'Task Master created successfully.' };
  };

  // Update Task Master
  const updateTaskMaster = (
    id: string,
    data: Partial<TaskMaster>,
    rescheduleOptions?: { applyToFutureOnly: boolean }
  ) => {
    const target = taskMasters.find((t) => t.id === id);
    if (!target) return { success: false, message: 'Task Master not found.' };

    const oldData = { ...target };
    const updatedTask: TaskMaster = {
      ...target,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = taskMasters.map((t) => (t.id === id ? updatedTask : t));
    storage.saveTaskMasters(updatedList);
    setTaskMasters(updatedList);

    // If rescheduling future occurrences
    if (rescheduleOptions?.applyToFutureOnly) {
      const updatedSchedules = scheduledTasks.map((sch) => {
        if (sch.taskMasterId === id && !sch.completedAt && sch.dueDate >= todayStr) {
          return {
            ...sch,
            taskName: updatedTask.taskName,
            assignedUserId: updatedTask.assignedUserId,
            assignedUserName: updatedTask.assignedUserName,
            assignedEmployeeId: updatedTask.assignedEmployeeId,
            departmentId: updatedTask.departmentId,
            departmentName: updatedTask.departmentName,
            priority: updatedTask.priority,
            instructions: updatedTask.instructions,
            frequencyDisplay: getFrequencySummary(updatedTask.frequencyType, updatedTask.frequencyValue, updatedTask.weeklyDay),
          };
        }
        return sch;
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
      recordId: target.taskCode,
      reason: `Updated master properties for ${target.taskName}.`,
      previousData: oldData,
      newData: updatedTask,
    });

    return { success: true, message: 'Task Master updated successfully.' };
  };

  // Deactivate Task Master
  const deactivateTaskMaster = (id: string) => {
    const target = taskMasters.find((t) => t.id === id);
    if (!target) return { success: false, message: 'Task not found.' };

    const updated = taskMasters.map((t) => (t.id === id ? { ...t, status: 'deactivated' as const } : t));
    storage.saveTaskMasters(updated);
    setTaskMasters(updated);

    // Cancel open future tasks
    const updatedSchedules = scheduledTasks.map((sch) => {
      if (sch.taskMasterId === id && !sch.completedAt && sch.dueDate >= todayStr) {
        return { ...sch, status: 'cancelled' as const };
      }
      return sch;
    });
    storage.saveScheduledTasks(updatedSchedules);
    setScheduledTasks(updatedSchedules);

    storage.addAuditLog({
      action: 'TASK_MASTER_DEACTIVATED',
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Admin',
      role: currentUser?.role || 'admin',
      recordType: 'TaskMaster',
      recordId: target.taskCode,
      reason: `Deactivated task master. Future occurrences marked cancelled; completed history preserved.`,
    });

    return { success: true, message: 'Task Master deactivated. Future occurrences cancelled.' };
  };

  // Safe delete
  const deleteTaskMasterSafe = (id: string, cancelFutureOnly: boolean = true) => {
    const target = taskMasters.find((t) => t.id === id);
    if (!target) return { success: false, message: 'Task not found.' };

    const hasCompleted = scheduledTasks.some((s) => s.taskMasterId === id && s.completedAt);
    if (hasCompleted) {
      // Must soft-deactivate to protect historical audit trail
      deactivateTaskMaster(id);
      return {
        success: true,
        message: 'Task has historical completion records. Deactivated and cancelled future occurrences to protect audit history.',
      };
    }

    // No historical completions: safe to delete cleanly
    const updatedTms = taskMasters.filter((t) => t.id !== id);
    storage.saveTaskMasters(updatedTms);
    setTaskMasters(updatedTms);

    const updatedSchedules = scheduledTasks.filter((s) => s.taskMasterId !== id);
    storage.saveScheduledTasks(updatedSchedules);
    setScheduledTasks(updatedSchedules);

    storage.addAuditLog({
      action: 'TASK_MASTER_DELETED',
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Admin',
      role: currentUser?.role || 'admin',
      recordType: 'TaskMaster',
      recordId: target.taskCode,
      reason: `Deleted master record and uncompleted schedules for ${target.taskName}.`,
    });

    return { success: true, message: 'Task Master deleted successfully.' };
  };

  // One-Year Schedule Generator
  const generateOneYearSchedule = (taskMasterId: string, customMonths?: number) => {
    const tm = taskMasters.find((t) => t.id === taskMasterId);
    if (!tm) return { success: false, count: 0, message: 'Task Master not found.' };

    const horizon = customMonths || settings.defaultScheduleHorizonMonths || 12;
    const generatedDates = generateScheduleDates(
      {
        startDate: tm.startDate,
        frequencyType: tm.frequencyType,
        frequencyValue: tm.frequencyValue,
        weeklyDay: tm.weeklyDay,
      },
      {
        horizonMonths: horizon,
        invalidMonthlyDatePolicy: settings.invalidMonthlyDatePolicy,
      }
    );

    // Check duplicates: taskMasterId + dueDate
    const existingDates = new Set(
      scheduledTasks.filter((s) => s.taskMasterId === taskMasterId).map((s) => s.dueDate)
    );

    const newSchedules: ScheduledTask[] = [];
    const advanceDays = settings.taskAdvanceVisibilityDays || 5;

    generatedDates.forEach((dueDate) => {
      if (!existingDates.has(dueDate)) {
        const scheduleId = `SCH-${tm.taskCode}-${dueDate.replace(/-/g, '')}`;
        const visDate = calculateVisibilityDate(dueDate, advanceDays);

        let initialStatus: ScheduledTask['status'] = 'future';
        if (dueDate < todayStr) initialStatus = 'overdue';
        else if (dueDate === todayStr) initialStatus = 'due_today';
        else if (visDate <= todayStr) initialStatus = 'available';

        newSchedules.push({
          id: scheduleId,
          scheduleId,
          taskMasterId: tm.id,
          taskCode: tm.taskCode,
          taskName: tm.taskName,
          checklistTemplateId: tm.checklistTemplateId,
          checklistName: tm.checklistName,
          assignedUserId: tm.assignedUserId,
          assignedUserName: tm.assignedUserName,
          assignedEmployeeId: tm.assignedEmployeeId,
          departmentId: tm.departmentId,
          departmentName: tm.departmentName,
          frequencyType: tm.frequencyType,
          frequencyValue: tm.frequencyValue,
          frequencyDisplay: getFrequencySummary(tm.frequencyType, tm.frequencyValue, tm.weeklyDay),
          originalStartDate: tm.startDate,
          dueDate,
          visibilityDate: visDate,
          status: initialStatus,
          priority: tm.priority,
          instructions: tm.instructions,
          generatedBy: currentUser?.loginId || 'Admin',
          generatedDate: todayStr,
        });
      }
    });

    if (newSchedules.length === 0) {
      return {
        success: true,
        count: 0,
        message: `Schedule already generated through ${generatedDates[generatedDates.length - 1]}. No missing dates found.`,
      };
    }

    const merged = [...scheduledTasks, ...newSchedules];
    storage.saveScheduledTasks(merged);
    setScheduledTasks(merged);

    // Update last generated through date
    const lastDate = generatedDates[generatedDates.length - 1];
    const updatedTms = taskMasters.map((t) => (t.id === tm.id ? { ...t, lastScheduleGeneratedThrough: lastDate } : t));
    storage.saveTaskMasters(updatedTms);
    setTaskMasters(updatedTms);

    storage.addAuditLog({
      action: 'SCHEDULE_GENERATED',
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Admin',
      role: currentUser?.role || 'admin',
      recordType: 'MasterSchedule',
      recordId: tm.taskCode,
      reason: `Generated ${newSchedules.length} new occurrences for ${tm.taskName} through ${lastDate}.`,
    });

    return {
      success: true,
      count: newSchedules.length,
      message: `Generated ${newSchedules.length} scheduled occurrences through ${lastDate}.`,
    };
  };

  // Extend Schedule (+3 mo, +6 mo, +1 yr)
  const extendSchedule = (taskMasterId: string, monthsToAdd: number) => {
    return generateOneYearSchedule(taskMasterId, 12 + monthsToAdd);
  };

  // Bulk generate
  const bulkGenerateSchedules = (taskMasterIds: string[]) => {
    let total = 0;
    taskMasterIds.forEach((id) => {
      const res = generateOneYearSchedule(id);
      total += res.count;
    });
    return { success: true, totalCount: total, message: `Successfully generated ${total} occurrences across selected tasks.` };
  };

  // Mark task as done
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
    const target = scheduledTasks.find((s) => s.id === scheduleId);
    if (!target) return { success: false, message: 'Scheduled task not found.' };

    if (target.completedAt) {
      return { success: false, message: 'This task has already been completed.' };
    }

    // Role check: Doer can only complete their own tasks
    if (currentUser?.role === 'doer' && target.assignedUserId !== currentUser.id) {
      return { success: false, message: 'You are not authorized to complete another employee’s assigned task.' };
    }

    const completionDate = data.overrideCompletionDate || todayStr;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const completedAt = `${completionDate}T${timeStr}Z`;

    const evalResult = evaluateTaskCompletion(target.dueDate, completionDate, settings.scoreRules);
    let newStatus: ScheduledTask['status'] = 'completed_on_time';
    if (evalResult.classification === 'early') newStatus = 'completed_early';
    if (evalResult.classification === 'late') newStatus = 'completed_late';

    const updatedTask: ScheduledTask = {
      ...target,
      status: newStatus,
      completedAt,
      completedDate: completionDate,
      completedTime: timeStr,
      completionClassification: evalResult.classification,
      delayDays: evalResult.delayDays,
      score: evalResult.score,
      remarks: data.remarks || 'Completed with all verification checks satisfied.',
      observation: data.observation,
      correctiveAction: data.correctiveAction,
      checklistResponses: data.checklistResponses,
      evidenceUrls: data.evidenceUrls,
    };

    const updatedList = scheduledTasks.map((s) => (s.id === scheduleId ? updatedTask : s));
    storage.saveScheduledTasks(updatedList);
    setScheduledTasks(updatedList);

    // Audit log
    storage.addAuditLog({
      action: 'TASK_COMPLETED',
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Doer',
      role: currentUser?.role || 'doer',
      recordType: 'ScheduledTask',
      recordId: target.scheduleId,
      reason: `Task ${target.taskName} marked Done (${evalResult.classification.toUpperCase()}, Delay: ${evalResult.delayDays}d, Score: ${evalResult.score}pts).`,
      newData: updatedTask,
    });

    // In-app notification for admin
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: 'user-admin-1',
      title: 'Task Completed',
      message: `${target.taskName} maintenance completed by ${currentUser?.name || target.assignedUserName} (${evalResult.classification}, Score: ${evalResult.score}).`,
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString(),
      relatedScheduleId: target.id,
      relatedTaskCode: target.taskCode,
    };
    const updatedNotifs = [newNotif, ...notifications];
    storage.saveNotifications(updatedNotifs);
    setNotifications(updatedNotifs);

    return { success: true, message: 'Task completed successfully! Score recorded.', task: updatedTask };
  };

  // Admin correction
  const adminCorrectCompletion = (
    scheduleId: string,
    data: {
      reason: string;
      newStatus: ScheduledTask['status'];
      newScore?: number;
      remarks?: string;
    }
  ) => {
    if (currentUser?.role !== 'admin') {
      return { success: false, message: 'Only administrators are authorized to perform completion corrections.' };
    }

    const target = scheduledTasks.find((s) => s.id === scheduleId);
    if (!target) return { success: false, message: 'Task not found.' };

    const oldStatus = target.status;
    const oldScore = target.score;

    const updatedTask: ScheduledTask = {
      ...target,
      status: data.newStatus,
      score: data.newScore !== undefined ? data.newScore : target.score,
      remarks: data.remarks || target.remarks,
      adminCorrection: {
        correctedBy: currentUser.id,
        correctedByName: currentUser.name,
        correctedAt: new Date().toISOString(),
        reason: data.reason,
        oldStatus,
        newStatus: data.newStatus,
        oldScore,
        newScore: data.newScore,
      },
    };

    const updatedList = scheduledTasks.map((s) => (s.id === scheduleId ? updatedTask : s));
    storage.saveScheduledTasks(updatedList);
    setScheduledTasks(updatedList);

    storage.addAuditLog({
      action: 'ADMIN_COMPLETION_CORRECTION',
      userId: currentUser.id,
      userName: currentUser.name,
      role: 'admin',
      recordType: 'ScheduledTask',
      recordId: target.scheduleId,
      reason: `Admin correction applied. Reason: ${data.reason}`,
      previousData: { status: oldStatus, score: oldScore },
      newData: { status: data.newStatus, score: data.newScore },
    });

    return { success: true, message: 'Admin completion correction applied and logged.' };
  };

  // User management
  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    const existing = users.find(
      (u) => u.loginId.toLowerCase() === userData.loginId.toLowerCase() || u.employeeId.toLowerCase() === userData.employeeId.toLowerCase()
    );
    if (existing) {
      return { success: false, message: 'A user with this Login ID or Employee ID already exists.' };
    }

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...users, newUser];
    storage.saveUsers(updated);
    setUsers(updated);

    storage.addAuditLog({
      action: 'USER_CREATED',
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Admin',
      role: 'admin',
      recordType: 'User',
      recordId: newUser.employeeId,
      reason: `Registered new employee ${newUser.name} (${newUser.designation}).`,
    });

    return { success: true, user: newUser, message: 'New employee registered successfully.' };
  };

  const updateUser = (userId: string, data: Partial<User>) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };

    const updatedUser = { ...target, ...data, updatedAt: new Date().toISOString() };
    const updatedList = users.map((u) => (u.id === userId ? updatedUser : u));
    storage.saveUsers(updatedList);
    setUsers(updatedList);

    storage.addAuditLog({
      action: 'USER_UPDATED',
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Admin',
      role: 'admin',
      recordType: 'User',
      recordId: target.employeeId,
      reason: `Updated details for ${target.name}.`,
    });

    return { success: true, message: 'Employee updated successfully.' };
  };

  const toggleUserStatus = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, status: 'active', message: 'User not found.' };
    if (target.id === currentUser?.id) {
      return { success: false, status: target.status, message: 'You cannot suspend your own account.' };
    }

    const newStatus: 'active' | 'suspended' = target.status === 'active' ? 'suspended' : 'active';
    const updated = users.map((u) => (u.id === userId ? { ...u, status: newStatus, updatedAt: new Date().toISOString() } : u));
    storage.saveUsers(updated);
    setUsers(updated);

    storage.addAuditLog({
      action: newStatus === 'suspended' ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Admin',
      role: 'admin',
      recordType: 'User',
      recordId: target.employeeId,
      reason: `Employee account status set to ${newStatus}. Historical data preserved.`,
    });

    return { success: true, status: newStatus, message: `Employee account ${newStatus}.` };
  };

  const resetUserPassword = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, newPass: '', message: 'User not found.' };

    const tempPassword = 'User@1234';
    const updated = users.map((u) =>
      u.id === userId ? { ...u, password: tempPassword, mustChangePassword: true, updatedAt: new Date().toISOString() } : u
    );
    storage.saveUsers(updated);
    setUsers(updated);

    storage.addAuditLog({
      action: 'PASSWORD_RESET_BY_ADMIN',
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Admin',
      role: 'admin',
      recordType: 'User',
      recordId: target.employeeId,
      reason: `Administrator reset password for ${target.name} to default initial password.`,
    });

    return { success: true, newPass: tempPassword, message: `Password reset to ${tempPassword}. User must change on next login.` };
  };

  const deleteUser = (userId: string, reassignToUserId?: string) => {
    if (currentUser?.role !== 'admin') {
      return { success: false, message: 'Only administrators can delete user accounts.' };
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };
    if (target.id === currentUser?.id) {
      return { success: false, message: 'You cannot delete your own logged-in admin account.' };
    }

    // Check if user has assigned task masters or schedules
    const assignedMasters = taskMasters.filter((tm) => tm.assignedUserId === userId);
    const assignedSchedules = scheduledTasks.filter((s) => s.assignedUserId === userId);

    let reassignUser: User | undefined;
    if (reassignToUserId) {
      reassignUser = users.find((u) => u.id === reassignToUserId);
    }

    if (assignedMasters.length > 0 || assignedSchedules.length > 0) {
      if (reassignUser) {
        // Reassign task masters
        const updatedMasters = taskMasters.map((tm) =>
          tm.assignedUserId === userId
            ? { ...tm, assignedUserId: reassignUser!.id, assignedUserName: reassignUser!.name, assignedUserEmpId: reassignUser!.employeeId }
            : tm
        );
        storage.saveTaskMasters(updatedMasters);
        setTaskMasters(updatedMasters);

        // Reassign schedules
        const updatedSchedules = scheduledTasks.map((s) =>
          s.assignedUserId === userId
            ? { ...s, assignedUserId: reassignUser!.id, assignedUserName: reassignUser!.name }
            : s
        );
        storage.saveScheduledTasks(updatedSchedules);
        setScheduledTasks(updatedSchedules);
      } else {
        // Mark as archived in tasks
        const updatedMasters = taskMasters.map((tm) =>
          tm.assignedUserId === userId
            ? { ...tm, assignedUserName: `${target.name} (Archived)` }
            : tm
        );
        storage.saveTaskMasters(updatedMasters);
        setTaskMasters(updatedMasters);

        const updatedSchedules = scheduledTasks.map((s) =>
          s.assignedUserId === userId
            ? { ...s, assignedUserName: `${target.name} (Archived)` }
            : s
        );
        storage.saveScheduledTasks(updatedSchedules);
        setScheduledTasks(updatedSchedules);
      }
    }

    const updatedUsers = users.filter((u) => u.id !== userId);
    storage.saveUsers(updatedUsers);
    setUsers(updatedUsers);

    storage.addAuditLog({
      action: 'USER_DELETED',
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Admin',
      role: 'admin',
      recordType: 'User',
      recordId: target.employeeId,
      reason: `Permanently deleted user account ${target.name} (${target.employeeId}).${
        reassignUser ? ` Tasks reassigned to ${reassignUser.name}.` : ''
      }`,
    });

    return {
      success: true,
      message: `User ${target.name} (${target.employeeId}) deleted successfully.${
        reassignUser ? ` Tasks transferred to ${reassignUser.name}.` : ''
      }`,
    };
  };

  // Departments
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

  // Checklist Templates
  const saveChecklistTemplate = (template: ChecklistTemplate) => {
    const existing = checklistTemplates.some((t) => t.id === template.id);
    let updated: ChecklistTemplate[];
    if (existing) {
      updated = checklistTemplates.map((t) => (t.id === template.id ? { ...template, updatedAt: new Date().toISOString() } : t));
    } else {
      updated = [...checklistTemplates, { ...template, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
    }
    storage.saveChecklistTemplates(updated);
    setChecklistTemplates(updated);
    return { success: true, message: 'Checklist template saved successfully.' };
  };

  const deleteChecklistTemplate = (id: string) => {
    const inUse = taskMasters.some((t) => t.checklistTemplateId === id);
    if (inUse) {
      return { success: false, message: 'Cannot delete template while it is assigned to existing Task Masters.' };
    }
    const updated = checklistTemplates.filter((t) => t.id !== id);
    storage.saveChecklistTemplates(updated);
    setChecklistTemplates(updated);
    return { success: true, message: 'Checklist template removed.' };
  };

  // Settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    storage.saveSettings(updated);
    setSettings(updated);
    storage.addAuditLog({
      action: 'SETTINGS_UPDATED',
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Admin',
      role: 'admin',
      recordType: 'Settings',
      recordId: 'global',
      reason: 'Application configuration updated.',
      newData: updated,
    });
    return { success: true, message: 'Settings saved.' };
  };

  // Notifications
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

  // Bulk import
  const bulkImportTasks = (rows: Array<Partial<TaskMaster>>) => {
    const errors: string[] = [];
    const validTasks: TaskMaster[] = [];
    const existingCodes = new Set(taskMasters.map((t) => t.taskCode.toLowerCase()));

    rows.forEach((r, idx) => {
      const rowNum = idx + 1;
      if (!r.taskName) {
        errors.push(`Row ${rowNum}: Missing machine/task name.`);
        return;
      }
      const code = r.taskCode || `TM-${(taskMasters.length + validTasks.length + 1).toString().padStart(3, '0')}`;
      if (existingCodes.has(code.toLowerCase())) {
        errors.push(`Row ${rowNum}: Task Code '${code}' already exists.`);
        return;
      }

      const assignedDoer = users.find((u) => u.id === r.assignedUserId) || users.find((u) => u.role === 'doer') || users[0];
      const dept = departments.find((d) => d.id === r.departmentId) || departments[0];
      const chk = checklistTemplates.find((c) => c.id === r.checklistTemplateId) || checklistTemplates[0];

      validTasks.push({
        id: `task-master-${Date.now()}-${idx}`,
        taskCode: code,
        taskName: r.taskName,
        taskDescription: r.taskDescription || `Preventive maintenance for ${r.taskName}`,
        checklistTemplateId: chk.id,
        checklistName: chk.templateName,
        assignedUserId: assignedDoer.id,
        assignedUserName: assignedDoer.name,
        assignedEmployeeId: assignedDoer.employeeId,
        departmentId: dept.id,
        departmentName: dept.departmentName,
        taskCategory: r.taskCategory || 'Preventive Maintenance',
        frequencyType: r.frequencyType || 'interval_days',
        frequencyValue: r.frequencyValue || 15,
        startDate: r.startDate || todayStr,
        priority: r.priority || 'medium',
        estimatedDuration: r.estimatedDuration || '45 mins',
        instructions: r.instructions || 'Perform checklist items safely.',
        status: 'active',
        createdBy: currentUser?.loginId || 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      existingCodes.add(code.toLowerCase());
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
        reason: `Bulk imported ${validTasks.length} task masters from CSV/data.`,
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
        scheduledTasks: updateDynamicStatuses(scheduledTasks, settings.taskAdvanceVisibilityDays),
        departments,
        users,
        checklistTemplates,
        settings,
        notifications,
        auditLogs,
        todayStr,
        addTaskMaster,
        updateTaskMaster,
        deactivateTaskMaster,
        deleteTaskMasterSafe,
        generateOneYearSchedule,
        extendSchedule,
        bulkGenerateSchedules,
        markTaskAsDone,
        adminCorrectCompletion,
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
