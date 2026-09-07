import {
  AppSettings,
  AuditLog,
  ChecklistTemplate,
  Department,
  NotificationItem,
  ScheduledTask,
  TaskMaster,
  User,
} from '../types';
import { calculateVisibilityDate, generateScheduleDates, getFrequencySummary } from './recurrenceEngine';
import { DEFAULT_RATING_THRESHOLDS, DEFAULT_SCORE_RULES, evaluateTaskCompletion } from './scoringEngine';

const STORAGE_PREFIX = 'yfl_taskms_';

export const INITIAL_DEPARTMENT: Department = {
  id: 'dept-yarn-1',
  departmentId: 'YFL-DEPT-YARN',
  departmentName: 'Yarn Division',
  description: 'Primary yarn spinning, carding, drawing, combing and polishing division.',
  status: 'active',
  createdAt: '2026-08-01T09:00:00Z',
  updatedAt: '2026-08-01T09:00:00Z',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin-1',
    employeeId: 'YFL-ADM-001',
    name: 'YFL Administrator',
    loginId: 'admin',
    email: 'mis@yajurfibres.com',
    mobile: '+91 98765 43210',
    departmentId: 'dept-yarn-1',
    departmentName: 'Yarn Division',
    designation: 'Division Head / Plant Admin',
    role: 'admin',
    status: 'active',
    mustChangePassword: false,
    password: 'Admin@1234',
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-01T09:00:00Z',
    lastLogin: '2026-09-07T06:30:00Z',
  },
  {
    id: 'user-doer-1',
    employeeId: 'YFL-084',
    name: 'Swapan Kr Ghorai',
    loginId: 'swapan',
    email: 'swapan.ghorai@yajurfibres.com',
    mobile: '+91 98321 65490',
    departmentId: 'dept-yarn-1',
    departmentName: 'Yarn Division',
    designation: 'Senior Maintenance Technician',
    role: 'doer',
    status: 'active',
    mustChangePassword: false,
    password: 'User@1234',
    createdAt: '2026-08-15T09:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z',
    lastLogin: '2026-09-07T07:15:00Z',
  },
  {
    id: 'user-doer-2',
    employeeId: 'YFL-102',
    name: 'Ramesh Das',
    loginId: 'ramesh',
    email: 'ramesh.das@yajurfibres.com',
    mobile: '+91 98450 11223',
    departmentId: 'dept-yarn-1',
    departmentName: 'Yarn Division',
    designation: 'Electrical & Instrumentation Tech',
    role: 'doer',
    status: 'active',
    mustChangePassword: false,
    password: 'User@1234',
    createdAt: '2026-08-20T09:00:00Z',
    updatedAt: '2026-08-20T09:00:00Z',
    lastLogin: '2026-09-06T14:20:00Z',
  }
];

export const INITIAL_CHECKLIST_TEMPLATE: ChecklistTemplate = {
  id: 'chk-machine-maint',
  templateName: 'Machine Maintenance',
  departmentId: 'dept-yarn-1',
  taskCategory: 'Preventive Maintenance',
  isActive: true,
  createdAt: '2026-08-01T09:00:00Z',
  updatedAt: '2026-08-01T09:00:00Z',
  items: [
    { id: 'item-1', label: 'Machine cleaning', description: 'Remove accumulated lint, fluff, and fly waste', isRequired: true, displayOrder: 1 },
    { id: 'item-2', label: 'Lubrication check', description: 'Verify grease and lubricant points on main bearings', isRequired: true, displayOrder: 2 },
    { id: 'item-3', label: 'Bearing condition', description: 'Inspect for excessive heating, play, or dry run', isRequired: true, displayOrder: 3 },
    { id: 'item-4', label: 'Belt condition & tension', description: 'Inspect V-belts and flat belts for wear, cracks and tension', isRequired: true, displayOrder: 4 },
    { id: 'item-5', label: 'Safety guard & interlocks', description: 'Check safety covers, emergency stop switches and sensors', isRequired: true, displayOrder: 5 },
    { id: 'item-6', label: 'Electrical connection', description: 'Inspect terminal box, earthing wire, and motor cabling', isRequired: true, displayOrder: 6 },
    { id: 'item-7', label: 'Abnormal noise check', description: 'Listen for unusual gear mesh, grinding, or rattling', isRequired: true, displayOrder: 7 },
    { id: 'item-8', label: 'Vibration check', description: 'Check frame and cylinder balance and vibration', isRequired: true, displayOrder: 8 },
    { id: 'item-9', label: 'Oil / grease level', description: 'Top up gearbox and reservoir to indicated level', isRequired: true, displayOrder: 9 },
    { id: 'item-10', label: 'General mechanical condition', description: 'Verify fastening bolts, alignment, and guides', isRequired: true, displayOrder: 10 },
    { id: 'item-11', label: 'Housekeeping & safety clearance', description: 'Clean surrounding alley and confirm work zone is clear', isRequired: true, displayOrder: 11 },
  ],
};

export const INITIAL_SETTINGS: AppSettings = {
  companyName: 'Yajur Fibres Limited',
  appName: 'YFL Yarn Division Checklist & Task Management System',
  tagline: 'Plan • Maintain • Track • Improve',
  department: 'Yarn Division',
  timezone: 'Asia/Kolkata',
  taskAdvanceVisibilityDays: 5,
  defaultScheduleHorizonMonths: 12,
  invalidMonthlyDatePolicy: 'last_day',
  autoExtendSchedule: true,
  scoreRules: DEFAULT_SCORE_RULES,
  ratingThresholds: DEFAULT_RATING_THRESHOLDS,
};

// Live Data injection from Yajur Fibres Limited Yarn Division
export const RAW_LIVE_TASKS_DATA = [
  { taskId: 1, taskCode: 'TM-001', name: 'B. Card- 1  Machine Maintaince', category: 'Carding Machines', date: '2026-09-15' },
  { taskId: 2, taskCode: 'TM-002', name: 'B. Card- 2 Machine Maintaince', category: 'Carding Machines', date: '2026-09-16' },
  { taskId: 3, taskCode: 'TM-003', name: 'F. Card- 1 Machine Maintaince', category: 'Carding Machines', date: '2026-09-17' },
  { taskId: 4, taskCode: 'TM-004', name: 'F. Card- 2 Machine Maintaince', category: 'Carding Machines', date: '2026-09-18' },
  { taskId: 5, taskCode: 'TM-005', name: 'F. Card- 3 Machine Maintaince', category: 'Carding Machines', date: '2026-09-19' },
  { taskId: 6, taskCode: 'TM-006', name: 'Mono- 1 Machine Maintaince', category: 'Mono Machines', date: '2026-09-20' },
  { taskId: 7, taskCode: 'TM-007', name: 'Mono- 2 Machine Maintaince', category: 'Mono Machines', date: '2026-09-21' },
  { taskId: 8, taskCode: 'TM-008', name: 'Mono- 3 Machine Maintaince', category: 'Mono Machines', date: '2026-09-22' },
  { taskId: 9, taskCode: 'TM-009', name: 'Punjab- 1 Machine Maintaince', category: 'Punjab Machines', date: '2026-09-23' },
  { taskId: 10, taskCode: 'TM-010', name: 'Punjab- 2 Machine Maintaince', category: 'Punjab Machines', date: '2026-09-24' },
  { taskId: 11, taskCode: 'TM-011', name: 'Fin- 2 Machine Maintaince', category: 'Finishing Machines', date: '2026-09-25' },
  { taskId: 12, taskCode: 'TM-012', name: 'Fin- 3 Machine Maintaince', category: 'Finishing Machines', date: '2026-09-26' },
  { taskId: 13, taskCode: 'TM-013', name: 'Spg- 1 Machine Maintaince', category: 'Spinning Machines', date: '2026-09-27' },
  { taskId: 14, taskCode: 'TM-014', name: 'Spg- 2 Machine Maintaince', category: 'Spinning Machines', date: '2026-09-28' },
  { taskId: 15, taskCode: 'TM-015', name: 'Spg- 3 Machine Maintaince', category: 'Spinning Machines', date: '2026-09-29' },
  { taskId: 16, taskCode: 'TM-016', name: 'Spg- 4 Machine Maintaince', category: 'Spinning Machines', date: '2026-09-30' },
  { taskId: 17, taskCode: 'TM-017', name: 'Spg- 5 Machine Maintaince', category: 'Spinning Machines', date: '2026-09-30' },
  { taskId: 18, taskCode: 'TM-018', name: 'Polish m/c- 1 Machine Maintaince', category: 'Polish Machines', date: '2026-10-01' },
  { taskId: 19, taskCode: 'TM-019', name: 'Polish m/c- 2 Machine Maintaince', category: 'Polish Machines', date: '2026-10-02' },
  { taskId: 20, taskCode: 'TM-020', name: 'Polish m/c- 3 Machine Maintaince', category: 'Polish Machines', date: '2026-10-03' },
  { taskId: 21, taskCode: 'TM-021', name: 'COMBER- 1 Machine Maintaince', category: 'Comber Machines', date: '2026-09-15' },
  { taskId: 22, taskCode: 'TM-022', name: 'COMBER- 2 Machine Maintaince', category: 'Comber Machines', date: '2026-09-16' },
  { taskId: 23, taskCode: 'TM-023', name: 'COMBER- 3 Machine Maintaince', category: 'Comber Machines', date: '2026-09-17' },
  { taskId: 24, taskCode: 'TM-024', name: 'COMBER- 4 Machine Maintaince', category: 'Comber Machines', date: '2026-09-18' },
  { taskId: 25, taskCode: 'TM-025', name: 'COMBER- 5 Machine Maintaince', category: 'Comber Machines', date: '2026-09-19' },
  { taskId: 26, taskCode: 'TM-026', name: 'COMBER- 6 Machine Maintaince', category: 'Comber Machines', date: '2026-09-20' },
  { taskId: 27, taskCode: 'TM-027', name: 'COMBER- 7 Machine Maintaince', category: 'Comber Machines', date: '2026-09-21' },
  { taskId: 28, taskCode: 'TM-028', name: 'COMBER- 8 Machine Maintaince', category: 'Comber Machines', date: '2026-09-22' },
  { taskId: 29, taskCode: 'TM-029', name: 'COMBER- 9 Machine Maintaince', category: 'Comber Machines', date: '2026-09-23' },
  { taskId: 30, taskCode: 'TM-030', name: 'COMBER- 10 Machine Maintaince', category: 'Comber Machines', date: '2026-09-24' },
  { taskId: 31, taskCode: 'TM-031', name: 'COMBER- 11 Machine Maintaince', category: 'Comber Machines', date: '2026-09-25' },
  { taskId: 32, taskCode: 'TM-032', name: 'COMBER- 12 Machine Maintaince', category: 'Comber Machines', date: '2026-09-26' },
  { taskId: 33, taskCode: 'TM-033', name: 'COMBER- 13 Machine Maintaince', category: 'Comber Machines', date: '2026-09-27' },
];

export function generateInitialTaskMasters(): TaskMaster[] {
  return RAW_LIVE_TASKS_DATA.map((t) => ({
    id: `tm-${t.taskId}`,
    taskCode: t.taskCode,
    taskName: t.name,
    taskDescription: `15-day scheduled preventive maintenance and mechanical inspection for ${t.name}.`,
    checklistTemplateId: 'chk-machine-maint',
    checklistName: 'Machine Maintenance Checklist',
    assignedUserId: 'user-doer-1',
    assignedUserName: 'Swapan Kr Ghorai',
    assignedEmployeeId: 'YFL-084',
    departmentId: 'dept-yarn-1',
    departmentName: 'Yarn Division',
    frequencyType: 'interval_days',
    frequencyValue: 15,
    startDate: t.date,
    priority: 'medium',
    status: 'active',
    taskCategory: t.category,
    createdBy: 'YFL Administrator',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z',
  }));
}

export function generateInitialScheduledTasks(taskMasters: TaskMaster[], advanceDays: number = 5): ScheduledTask[] {
  const allSchedules: ScheduledTask[] = [];

  taskMasters.forEach((tm) => {
    const dates = generateScheduleDates(
      {
        startDate: tm.startDate,
        frequencyType: tm.frequencyType,
        frequencyValue: tm.frequencyValue,
        weeklyDay: tm.weeklyDay,
      },
      { horizonMonths: 12 }
    );

    dates.forEach((dueDate, index) => {
      const occurrenceNumber = index + 1;
      const visDate = calculateVisibilityDate(dueDate, advanceDays);

      allSchedules.push({
        id: `sch-${tm.id}-${occurrenceNumber}-${dueDate}`,
        scheduleId: `SCH-${tm.taskCode}-${occurrenceNumber.toString().padStart(3, '0')}`,
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
        frequencyDisplay: 'Every 15 Days',
        originalStartDate: tm.startDate,
        dueDate,
        visibilityDate: visDate,
        status: 'future',
        priority: tm.priority,
        generatedBy: 'system_init',
        generatedDate: tm.createdAt,
      });
    });
  });

  return allSchedules;
}

export function generateInitialNotifications(): NotificationItem[] {
  return [
    {
      id: 'notif-welcome',
      userId: 'user-admin-1',
      title: '33 Live Task Masters Injected',
      message: '33 Yarn Division machines and 1-year schedules (15-day recurrence) have been successfully activated for Swapan Kr Ghorai.',
      type: 'info',
      isRead: false,
      createdAt: '2026-09-07T08:00:00Z',
    }
  ];
}

export function generateInitialAuditLogs(): AuditLog[] {
  return [
    {
      id: 'audit-live-init',
      action: 'SYSTEM_CONFIG_UPDATED',
      userId: 'user-admin-1',
      userName: 'YFL Administrator',
      role: 'admin',
      recordType: 'TaskMaster',
      recordId: 'YFL-YARN-33',
      reason: 'Injected 33 live Yarn Division machine maintenance task masters with 1-year schedules.',
      timestamp: '2026-09-07T08:00:00Z',
    }
  ];
}

// Storage Manager
class StorageManager {
  private getItem<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setItem<T>(key: string, val: T): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
    } catch (err) {
      console.error('LocalStorage write error:', err);
    }
  }

  init(): void {
    // Live data injection v3: inject user's exact 33 machines
    const liveDataV3 = localStorage.getItem(STORAGE_PREFIX + 'live_data_v3');
    if (!liveDataV3) {
      const initialMasters = generateInitialTaskMasters();
      const initialSchedules = generateInitialScheduledTasks(initialMasters, 5);
      this.setItem('taskMasters', initialMasters);
      this.setItem('scheduledTasks', initialSchedules);
      this.setItem('notifications', generateInitialNotifications());
      this.setItem('auditLogs', generateInitialAuditLogs());
      this.setItem('departments', [INITIAL_DEPARTMENT]);
      this.setItem('users', INITIAL_USERS);
      this.setItem('checklistTemplates', [INITIAL_CHECKLIST_TEMPLATE]);
      this.setItem('settings', INITIAL_SETTINGS);
      localStorage.setItem(STORAGE_PREFIX + 'live_data_v3', 'true');
      return;
    }

    if (!localStorage.getItem(STORAGE_PREFIX + 'departments')) {
      this.setItem('departments', [INITIAL_DEPARTMENT]);
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'users')) {
      this.setItem('users', INITIAL_USERS);
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'checklistTemplates')) {
      this.setItem('checklistTemplates', [INITIAL_CHECKLIST_TEMPLATE]);
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'settings')) {
      this.setItem('settings', INITIAL_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'taskMasters')) {
      const masters = generateInitialTaskMasters();
      this.setItem('taskMasters', masters);
      this.setItem('scheduledTasks', generateInitialScheduledTasks(masters, 5));
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'scheduledTasks')) {
      const masters = this.getTaskMasters();
      this.setItem('scheduledTasks', generateInitialScheduledTasks(masters, 5));
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'notifications')) {
      this.setItem('notifications', generateInitialNotifications());
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'auditLogs')) {
      this.setItem('auditLogs', generateInitialAuditLogs());
    }
  }

  // Users
  getUsers(): User[] {
    return this.getItem<User[]>('users', INITIAL_USERS);
  }
  saveUsers(users: User[]): void {
    this.setItem('users', users);
  }

  // Departments
  getDepartments(): Department[] {
    return this.getItem<Department[]>('departments', [INITIAL_DEPARTMENT]);
  }
  saveDepartments(depts: Department[]): void {
    this.setItem('departments', depts);
  }

  // Checklist Templates
  getChecklistTemplates(): ChecklistTemplate[] {
    return this.getItem<ChecklistTemplate[]>('checklistTemplates', [INITIAL_CHECKLIST_TEMPLATE]);
  }
  saveChecklistTemplates(templates: ChecklistTemplate[]): void {
    this.setItem('checklistTemplates', templates);
  }

  // Task Masters
  getTaskMasters(): TaskMaster[] {
    return this.getItem<TaskMaster[]>('taskMasters', []);
  }
  saveTaskMasters(tasks: TaskMaster[]): void {
    this.setItem('taskMasters', tasks);
  }

  // Scheduled Tasks
  getScheduledTasks(): ScheduledTask[] {
    return this.getItem<ScheduledTask[]>('scheduledTasks', []);
  }
  saveScheduledTasks(schedules: ScheduledTask[]): void {
    this.setItem('scheduledTasks', schedules);
  }

  // Settings
  getSettings(): AppSettings {
    return this.getItem<AppSettings>('settings', INITIAL_SETTINGS);
  }
  saveSettings(settings: AppSettings): void {
    this.setItem('settings', settings);
  }

  // Bulk Data Export/Import
  loadAllData() {
    return {
      taskMasters: this.getTaskMasters(),
      scheduledTasks: this.getScheduledTasks(),
      departments: this.getDepartments(),
      users: this.getUsers(),
      checklistTemplates: this.getChecklistTemplates(),
      settings: this.getSettings(),
      auditLogs: this.getAuditLogs(),
    };
  }

  saveAllData(data: {
    taskMasters?: TaskMaster[];
    scheduledTasks?: ScheduledTask[];
    departments?: Department[];
    users?: User[];
    checklistTemplates?: ChecklistTemplate[];
    settings?: AppSettings;
    auditLogs?: AuditLog[];
  }): void {
    if (data.taskMasters) this.saveTaskMasters(data.taskMasters);
    if (data.scheduledTasks) this.saveScheduledTasks(data.scheduledTasks);
    if (data.departments) this.saveDepartments(data.departments);
    if (data.users) this.saveUsers(data.users);
    if (data.checklistTemplates) this.saveChecklistTemplates(data.checklistTemplates);
    if (data.settings) this.saveSettings(data.settings);
  }

  // Notifications
  getNotifications(): NotificationItem[] {
    return this.getItem<NotificationItem[]>('notifications', []);
  }
  saveNotifications(notifs: NotificationItem[]): void {
    this.setItem('notifications', notifs);
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>('auditLogs', []);
  }
  addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep last 500 logs
    this.setItem('auditLogs', logs.slice(0, 500));
  }

  clearAllTaskData(): void {
    this.saveTaskMasters([]);
    this.saveScheduledTasks([]);
    this.saveNotifications([]);
    this.saveAuditLogs([]);
  }

  saveAuditLogs(logs: AuditLog[]): void {
    this.setItem('auditLogs', logs);
  }

  resetToDefault(): void {
    localStorage.clear();
    this.init();
  }
}

export const storage = new StorageManager();
storage.init();
export const storageService = storage;
