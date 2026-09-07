import {
  AppSettings,
  AuditLog,
  ChecklistTemplate,
  Department,
  Holiday,
  NotificationItem,
  RotationGroup,
  ScheduledTask,
  TaskMaster,
  User,
} from '../types';
import { generateYflDualRotationSchedule } from './recurrenceEngine';
import { DEFAULT_RATING_THRESHOLDS, DEFAULT_SCORE_RULES, evaluateTaskCompletion } from './scoringEngine';

const STORAGE_PREFIX = 'yfl_taskms_';

export const INITIAL_DEPARTMENT: Department = {
  id: 'dept-yarn-1',
  departmentId: 'YFL-DEPT-YARN',
  departmentName: 'Yarn Division',
  description: 'Primary yarn spinning, carding, drawing, combing and polishing division.',
  status: 'active',
  createdAt: '2026-07-01T09:00:00Z',
  updatedAt: '2026-07-01T09:00:00Z',
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
    createdAt: '2026-07-01T09:00:00Z',
    updatedAt: '2026-07-01T09:00:00Z',
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
    createdAt: '2026-07-01T09:00:00Z',
    updatedAt: '2026-07-01T09:00:00Z',
    lastLogin: '2026-09-07T07:15:00Z',
  },
];

export const INITIAL_CHECKLIST_TEMPLATE: ChecklistTemplate = {
  id: 'chk-machine-maint',
  templateName: 'Machine Maintenance Checklist',
  departmentId: 'dept-yarn-1',
  taskCategory: 'Preventive Maintenance',
  isActive: true,
  createdAt: '2026-07-01T09:00:00Z',
  updatedAt: '2026-07-01T09:00:00Z',
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

export const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 'hol-1', date: '2026-08-15', name: 'Independence Day', departmentName: 'Yarn Division', remarks: 'National Holiday' },
  { id: 'hol-2', date: '2026-10-02', name: 'Gandhi Jayanti', departmentName: 'Yarn Division', remarks: 'National Holiday' },
  { id: 'hol-3', date: '2026-10-20', name: 'Durga Puja / Dussehra', departmentName: 'Yarn Division', remarks: 'Festival Holiday' },
  { id: 'hol-4', date: '2026-11-08', name: 'Diwali', departmentName: 'Yarn Division', remarks: 'Festival Holiday' },
  { id: 'hol-5', date: '2027-01-26', name: 'Republic Day', departmentName: 'Yarn Division', remarks: 'National Holiday' },
  { id: 'hol-6', date: '2027-03-23', name: 'Holi', departmentName: 'Yarn Division', remarks: 'Festival Holiday' },
];

export const INITIAL_SETTINGS: AppSettings = {
  companyName: 'Yajur Fibres Limited',
  divisionName: 'Yarn Division',
  appName: 'YFL Yarn Division Checklist & Task Management System',
  appTitle: 'Yajur Fibres Limited • Yarn Division Maintenance System',
  tagline: 'Plan • Maintain • Track • Improve',
  department: 'Yarn Division',
  timezone: 'Asia/Kolkata',
  skipSundays: true,
  holidayPolicy: 'skip_and_shift',
  taskAdvanceVisibilityDays: 5,
  defaultScheduleHorizonMonths: 12,
  invalidMonthlyDatePolicy: 'last_day',
  autoExtendSchedule: true,
  scoreRules: DEFAULT_SCORE_RULES,
  ratingThresholds: DEFAULT_RATING_THRESHOLDS,
};

// 33 Machines categorized into Group 1 (MC1: 17 machines) and Group 2 (MC2: 16 machines)
export const RAW_LIVE_TASKS_DATA: Array<{
  taskId: number;
  taskCode: string;
  name: string;
  category: string;
  rotationGroup: RotationGroup;
  rotationPosition: number;
}> = [
  // MACHINE GROUP 1 – M/C 1 ROTATION (17 Machines)
  { taskId: 1, taskCode: 'MC1-01', name: 'B. Card-1 Machine Maintenance', category: 'Carding Machines', rotationGroup: 'MC1', rotationPosition: 1 },
  { taskId: 2, taskCode: 'MC1-02', name: 'B. Card-2 Machine Maintenance', category: 'Carding Machines', rotationGroup: 'MC1', rotationPosition: 2 },
  { taskId: 3, taskCode: 'MC1-03', name: 'F. Card-1 Machine Maintenance', category: 'Carding Machines', rotationGroup: 'MC1', rotationPosition: 3 },
  { taskId: 4, taskCode: 'MC1-04', name: 'F. Card-2 Machine Maintenance', category: 'Carding Machines', rotationGroup: 'MC1', rotationPosition: 4 },
  { taskId: 5, taskCode: 'MC1-05', name: 'F. Card-3 Machine Maintenance', category: 'Carding Machines', rotationGroup: 'MC1', rotationPosition: 5 },
  { taskId: 6, taskCode: 'MC1-06', name: 'Mono-1 Machine Maintenance', category: 'Mono Machines', rotationGroup: 'MC1', rotationPosition: 6 },
  { taskId: 7, taskCode: 'MC1-07', name: 'Mono-2 Machine Maintenance', category: 'Mono Machines', rotationGroup: 'MC1', rotationPosition: 7 },
  { taskId: 8, taskCode: 'MC1-08', name: 'Mono-3 Machine Maintenance', category: 'Mono Machines', rotationGroup: 'MC1', rotationPosition: 8 },
  { taskId: 9, taskCode: 'MC1-09', name: 'Punjab-1 Machine Maintenance', category: 'Punjab Machines', rotationGroup: 'MC1', rotationPosition: 9 },
  { taskId: 10, taskCode: 'MC1-10', name: 'Punjab-2 Machine Maintenance', category: 'Punjab Machines', rotationGroup: 'MC1', rotationPosition: 10 },
  { taskId: 11, taskCode: 'MC1-11', name: 'Fin-2 Machine Maintenance', category: 'Finishing Machines', rotationGroup: 'MC1', rotationPosition: 11 },
  { taskId: 12, taskCode: 'MC1-12', name: 'Fin-3 Machine Maintenance', category: 'Finishing Machines', rotationGroup: 'MC1', rotationPosition: 12 },
  { taskId: 13, taskCode: 'MC1-13', name: 'Spg-1 Machine Maintenance', category: 'Spinning Machines', rotationGroup: 'MC1', rotationPosition: 13 },
  { taskId: 14, taskCode: 'MC1-14', name: 'Spg-2 Machine Maintenance', category: 'Spinning Machines', rotationGroup: 'MC1', rotationPosition: 14 },
  { taskId: 15, taskCode: 'MC1-15', name: 'Spg-3 Machine Maintenance', category: 'Spinning Machines', rotationGroup: 'MC1', rotationPosition: 15 },
  { taskId: 16, taskCode: 'MC1-16', name: 'Spg-4 Machine Maintenance', category: 'Spinning Machines', rotationGroup: 'MC1', rotationPosition: 16 },
  { taskId: 17, taskCode: 'MC1-17', name: 'Spg-5 Machine Maintenance', category: 'Spinning Machines', rotationGroup: 'MC1', rotationPosition: 17 },

  // MACHINE GROUP 2 – M/C 2 ROTATION (16 Machines)
  { taskId: 18, taskCode: 'MC2-01', name: 'COMBER-1 Machine Maintenance', category: 'Comber Machines', rotationGroup: 'MC2', rotationPosition: 1 },
  { taskId: 19, taskCode: 'MC2-02', name: 'COMBER-2 Machine Maintenance', category: 'Comber Machines', rotationGroup: 'MC2', rotationPosition: 2 },
  { taskId: 20, taskCode: 'MC2-03', name: 'COMBER-3 Machine Maintenance', category: 'Comber Machines', rotationGroup: 'MC2', rotationPosition: 3 },
  { taskId: 21, taskCode: 'MC2-04', name: 'COMBER-4 Machine Maintenance', category: 'Comber Machines', rotationGroup: 'MC2', rotationPosition: 4 },
  { taskId: 22, taskCode: 'MC2-05', name: 'COMBER-5 Machine Maintenance', category: 'Comber Machines', rotationGroup: 'MC2', rotationPosition: 5 },
  { taskId: 23, taskCode: 'MC2-06', name: 'COMBER-6 Machine Maintenance', category: 'Comber Machines', rotationGroup: 'MC2', rotationPosition: 6 },
  { taskId: 24, taskCode: 'MC2-07', name: 'COMBER-7 Machine Maintenance', category: 'Comber Machines', rotationGroup: 'MC2', rotationPosition: 7 },
  { taskId: 25, taskCode: 'MC2-08', name: 'COMBER-8 Machine Maintenance', category: 'Comber Machines', rotationGroup: 'MC2', rotationPosition: 8 },
  { taskId: 26, taskCode: 'MC2-09', name: 'COMBER-9 Machine Maintenance', category: 'Comber Machines', rotationGroup: 'MC2', rotationPosition: 9 },
  { taskId: 27, taskCode: 'MC2-10', name: 'COMBER-10 Machine Maintenance', category: 'Comber Machines', rotationGroup: 'MC2', rotationPosition: 10 },
  { taskId: 28, taskCode: 'MC2-11', name: 'COMBER-11 Machine Maintenance', category: 'Comber Machines', rotationGroup: 'MC2', rotationPosition: 11 },
  { taskId: 29, taskCode: 'MC2-12', name: 'COMBER-12 Machine Maintenance', category: 'Comber Machines', rotationGroup: 'MC2', rotationPosition: 12 },
  { taskId: 30, taskCode: 'MC2-13', name: 'COMBER-13 Machine Maintenance', category: 'Comber Machines', rotationGroup: 'MC2', rotationPosition: 13 },
  { taskId: 31, taskCode: 'MC2-14', name: 'Polish m/c-1 Machine Maintenance', category: 'Polish Machines', rotationGroup: 'MC2', rotationPosition: 14 },
  { taskId: 32, taskCode: 'MC2-15', name: 'Polish m/c-2 Machine Maintenance', category: 'Polish Machines', rotationGroup: 'MC2', rotationPosition: 15 },
  { taskId: 33, taskCode: 'MC2-16', name: 'Polish m/c-3 Machine Maintenance', category: 'Polish Machines', rotationGroup: 'MC2', rotationPosition: 16 },
];

export function generateInitialTaskMasters(): TaskMaster[] {
  return RAW_LIVE_TASKS_DATA.map((t) => ({
    id: `tm-${t.taskId}`,
    taskId: t.taskId,
    machineId: `M-${t.taskCode}`,
    machineName: t.name,
    taskCode: t.taskCode,
    taskName: t.name,
    taskDescription: `17-Day Dual Rotation preventive maintenance and safety check for ${t.name}.`,
    checklistTemplateId: 'chk-machine-maint',
    checklistName: 'Machine Maintenance Checklist',
    assignedUserId: 'user-doer-1',
    assignedUserName: 'Swapan Kr Ghorai',
    assignedEmployeeId: 'YFL-084',
    departmentId: 'dept-yarn-1',
    departmentName: 'Yarn Division',
    scheduleType: '17-Day Dual Rotation',
    rotationGroup: t.rotationGroup,
    rotationPosition: t.rotationPosition,
    frequencyType: 'sequential_rotation',
    frequencyValue: 2,
    startDate: '2026-07-04',
    priority: 'medium',
    status: 'active',
    taskCategory: t.category,
    createdBy: 'YFL Administrator',
    createdAt: '2026-07-01T08:00:00Z',
    updatedAt: '2026-07-01T08:00:00Z',
  }));
}

export function generateInitialScheduledTasks(
  taskMasters: TaskMaster[],
  holidays: Holiday[] = INITIAL_HOLIDAYS,
  advanceDays: number = 5
): ScheduledTask[] {
  const result = generateYflDualRotationSchedule(taskMasters, {
    startDate: '2026-07-04',
    durationDays: 365,
    holidays,
    skipHolidays: true,
    skipSundays: true,
    advanceDays,
  });

  return result.scheduledTasks;
}

export function generateInitialNotifications(): NotificationItem[] {
  return [
    {
      id: 'notif-welcome',
      userId: 'user-admin-1',
      title: 'Yarn Division Accurate 17-Day Rotation Schedule Active',
      message: 'Dual Machine Groups (M/C 1: 17 machines, M/C 2: 16 machines) with Sunday skipping configured for Swapan Kr Ghorai from 04-07-2026.',
      type: 'info',
      isRead: false,
      createdAt: '2026-07-04T08:00:00Z',
    },
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
      recordType: 'MasterSchedule',
      recordId: 'YFL-ROTATION-2026',
      reason: 'Initialized Yarn Division Accurate 17-Working-Day Rotation Schedule (M/C 1 + M/C 2, Sunday skipped).',
      timestamp: '2026-07-04T08:00:00Z',
    },
  ];
}

export const storage = {
  // Task Masters
  getTaskMasters(): TaskMaster[] {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}task_masters_v3`);
    if (!raw) {
      const initial = generateInitialTaskMasters();
      this.saveTaskMasters(initial);
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return generateInitialTaskMasters();
    }
  },

  saveTaskMasters(tasks: TaskMaster[]): void {
    localStorage.setItem(`${STORAGE_PREFIX}task_masters_v3`, JSON.stringify(tasks));
  },

  // Scheduled Tasks
  getScheduledTasks(): ScheduledTask[] {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}scheduled_tasks_v3`);
    if (!raw) {
      const masters = this.getTaskMasters();
      const holidays = this.getHolidays();
      const initial = generateInitialScheduledTasks(masters, holidays);
      this.saveScheduledTasks(initial);
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      const masters = this.getTaskMasters();
      const holidays = this.getHolidays();
      const initial = generateInitialScheduledTasks(masters, holidays);
      this.saveScheduledTasks(initial);
      return initial;
    }
  },

  saveScheduledTasks(tasks: ScheduledTask[]): void {
    localStorage.setItem(`${STORAGE_PREFIX}scheduled_tasks_v3`, JSON.stringify(tasks));
  },

  // Holidays
  getHolidays(): Holiday[] {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}holidays_v1`);
    if (!raw) {
      this.saveHolidays(INITIAL_HOLIDAYS);
      return INITIAL_HOLIDAYS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_HOLIDAYS;
    }
  },

  saveHolidays(holidays: Holiday[]): void {
    localStorage.setItem(`${STORAGE_PREFIX}holidays_v1`, JSON.stringify(holidays));
  },

  // Departments
  getDepartments(): Department[] {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}departments`);
    if (!raw) {
      const initial = [INITIAL_DEPARTMENT];
      this.saveDepartments(initial);
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [INITIAL_DEPARTMENT];
    }
  },

  saveDepartments(departments: Department[]): void {
    localStorage.setItem(`${STORAGE_PREFIX}departments`, JSON.stringify(departments));
  },

  // Users
  getUsers(): User[] {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}users_v2`);
    if (!raw) {
      this.saveUsers(INITIAL_USERS);
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(`${STORAGE_PREFIX}users_v2`, JSON.stringify(users));
  },

  // Checklist Templates
  getChecklistTemplates(): ChecklistTemplate[] {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}checklist_templates`);
    if (!raw) {
      const initial = [INITIAL_CHECKLIST_TEMPLATE];
      this.saveChecklistTemplates(initial);
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [INITIAL_CHECKLIST_TEMPLATE];
    }
  },

  saveChecklistTemplates(templates: ChecklistTemplate[]): void {
    localStorage.setItem(`${STORAGE_PREFIX}checklist_templates`, JSON.stringify(templates));
  },

  // App Settings
  getSettings(): AppSettings {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}settings_v3`);
    if (!raw) {
      this.saveSettings(INITIAL_SETTINGS);
      return INITIAL_SETTINGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(`${STORAGE_PREFIX}settings_v3`, JSON.stringify(settings));
  },

  // Notifications
  getNotifications(): NotificationItem[] {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}notifications`);
    if (!raw) {
      const initial = generateInitialNotifications();
      this.saveNotifications(initial);
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveNotifications(notifications: NotificationItem[]): void {
    localStorage.setItem(`${STORAGE_PREFIX}notifications`, JSON.stringify(notifications));
  },

  addNotification(notification: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>): void {
    const list = this.getNotifications();
    const newItem: NotificationItem = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    list.unshift(newItem);
    this.saveNotifications(list.slice(0, 50));
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}audit_logs`);
    if (!raw) {
      const initial = generateInitialAuditLogs();
      this.saveAuditLogs(initial);
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveAuditLogs(logs: AuditLog[]): void {
    localStorage.setItem(`${STORAGE_PREFIX}audit_logs`, JSON.stringify(logs));
  },

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const list = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newLog);
    this.saveAuditLogs(list.slice(0, 500));
  },

  clearAllData(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  },
};
