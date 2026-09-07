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

// Clean Live Data defaults
export function generateInitialTaskMasters(): TaskMaster[] {
  return [];
}

export function generateInitialScheduledTasks(taskMasters: TaskMaster[], advanceDays: number = 5): ScheduledTask[] {
  return [];
}

export function generateInitialNotifications(): NotificationItem[] {
  return [];
}

export function generateInitialAuditLogs(): AuditLog[] {
  return [];
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
    // Live data migration check: wipe previous dummy data if present
    const cleanedFlag = localStorage.getItem(STORAGE_PREFIX + 'live_data_v1');
    if (!cleanedFlag) {
      localStorage.removeItem(STORAGE_PREFIX + 'taskMasters');
      localStorage.removeItem(STORAGE_PREFIX + 'scheduledTasks');
      localStorage.removeItem(STORAGE_PREFIX + 'notifications');
      localStorage.removeItem(STORAGE_PREFIX + 'auditLogs');
      localStorage.setItem(STORAGE_PREFIX + 'live_data_v1', 'true');
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
      this.setItem('taskMasters', []);
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'scheduledTasks')) {
      this.setItem('scheduledTasks', []);
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'notifications')) {
      this.setItem('notifications', []);
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'auditLogs')) {
      this.setItem('auditLogs', []);
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
