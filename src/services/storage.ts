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

// Section 19: Initial Yarn Division Machines (33 Task Masters)
const INITIAL_MACHINE_NAMES = [
  'B. Card-1',
  'B. Card-2',
  'F. Card-1',
  'F. Card-2',
  'F. Card-3',
  'Mono-1',
  'Mono-2',
  'Mono-3',
  'Punjab-1',
  'Punjab-2',
  'Fin-2',
  'Fin-3',
  'Spg-1',
  'Spg-2',
  'Spg-3',
  'Spg-4',
  'Spg-5',
  'Polish m/c-1',
  'Polish m/c-2',
  'Polish m/c-3',
  'COMBER-1',
  'COMBER-2',
  'COMBER-3',
  'COMBER-4',
  'COMBER-5',
  'COMBER-6',
  'COMBER-7',
  'COMBER-8',
  'COMBER-9',
  'COMBER-10',
  'COMBER-11',
  'COMBER-12',
  'COMBER-13',
];

export function generateInitialTaskMasters(): TaskMaster[] {
  return INITIAL_MACHINE_NAMES.map((name, index) => {
    const idNum = index + 1;
    // Alternate recurrence rules for rich variety:
    // Cards & Combers: 15 Days or Monthly Same Date
    const isMonthly = index >= 20 || index % 2 === 0;
    const freqType = isMonthly ? 'monthly_same_date' : 'interval_days';
    const freqValue = isMonthly ? 1 : 15;
    const dayOffset = (index % 12);
    // Start date in early September 2026 (matching prompt's 15-09-2026 or 27-09-2026 examples)
    const day = Math.min(28, 5 + dayOffset);
    const startDate = `2026-09-${day.toString().padStart(2, '0')}`;

    return {
      id: `task-master-${idNum}`,
      taskCode: `TM-${idNum.toString().padStart(3, '0')}`,
      taskName: name,
      taskDescription: `Standard preventive maintenance and checklist inspection for ${name} in the Yarn Division.`,
      checklistTemplateId: INITIAL_CHECKLIST_TEMPLATE.id,
      checklistName: INITIAL_CHECKLIST_TEMPLATE.templateName,
      assignedUserId: 'user-doer-1', // Swapan Kr Ghorai
      assignedUserName: 'Swapan Kr Ghorai',
      assignedEmployeeId: 'YFL-084',
      departmentId: INITIAL_DEPARTMENT.id,
      departmentName: INITIAL_DEPARTMENT.departmentName,
      taskCategory: 'Preventive Maintenance',
      frequencyType: freqType,
      frequencyValue: freqValue,
      startDate: startDate,
      priority: index < 5 || index >= 20 ? 'high' : 'medium',
      estimatedDuration: '45 mins',
      instructions: 'Ensure main supply isolation switch is locked before opening cylinder or beaters. Record all observations.',
      status: 'active',
      createdBy: 'admin',
      createdAt: '2026-08-25T10:00:00Z',
      updatedAt: '2026-08-25T10:00:00Z',
      lastScheduleGeneratedThrough: '2027-09-15',
    };
  });
}

/**
 * Pre-seeds 1-year master schedules for initial task masters with realistic statuses
 */
export function generateInitialScheduledTasks(taskMasters: TaskMaster[], advanceDays: number = 5): ScheduledTask[] {
  const schedules: ScheduledTask[] = [];
  const todayStr = '2026-09-07';

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

    dates.forEach((dueDate, dIdx) => {
      const scheduleId = `SCH-${tm.taskCode}-${dueDate.replace(/-/g, '')}`;
      const visibilityDate = calculateVisibilityDate(dueDate, advanceDays);

      let status: ScheduledTask['status'] = 'future';
      let completedAt: string | undefined;
      let completedDate: string | undefined;
      let completedTime: string | undefined;
      let completionClassification: ScheduledTask['completionClassification'];
      let delayDays: number | undefined;
      let score: number | undefined;
      let remarks: string | undefined;
      let observation: string | undefined;
      let correctiveAction: string | undefined;

      // Realistic seeding around 2026-09-07:
      if (dueDate < todayStr) {
        // In the past - mark completed on time or 1 day late for historical score
        const isLate = dIdx % 5 === 0;
        completedDate = isLate ? dueDate : dueDate; // same day or 1 day late
        completedTime = '11:45:00';
        completedAt = `${completedDate}T${completedTime}Z`;
        
        const evalResult = evaluateTaskCompletion(dueDate, completedDate);
        completionClassification = evalResult.classification;
        delayDays = evalResult.delayDays;
        score = evalResult.score;
        status = evalResult.classification === 'on_time' ? 'completed_on_time' : (evalResult.classification === 'early' ? 'completed_early' : 'completed_late');
        remarks = 'Routine maintenance completed. All parameters checked and verified normal.';
      } else if (dueDate === todayStr) {
        // Today!
        status = 'due_today';
      } else if (dueDate <= '2026-09-12') {
        // Next 5 days
        status = 'available';
      } else {
        status = 'future';
      }

      schedules.push({
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
        visibilityDate,
        status,
        priority: tm.priority,
        instructions: tm.instructions,
        completedAt,
        completedDate,
        completedTime,
        completionClassification,
        delayDays,
        score,
        remarks,
        observation,
        correctiveAction,
        generatedBy: 'System Auto-Scheduler',
        generatedDate: '2026-08-25',
      });
    });
  });

  return schedules;
}

export function generateInitialNotifications(): NotificationItem[] {
  return [
    {
      id: 'notif-1',
      userId: 'user-doer-1',
      title: 'Task Due Today',
      message: 'B. Card-1 machine maintenance checklist is due today (07-09-2026).',
      type: 'alert',
      isRead: false,
      createdAt: '2026-09-07T06:00:00Z',
      relatedTaskCode: 'TM-001',
    },
    {
      id: 'notif-2',
      userId: 'user-doer-1',
      title: 'Upcoming Maintenance',
      message: 'COMBER-13 scheduled for inspection on 27-09-2026 is visible in your upcoming queue.',
      type: 'info',
      isRead: false,
      createdAt: '2026-09-06T09:00:00Z',
      relatedTaskCode: 'TM-033',
    },
    {
      id: 'notif-3',
      userId: 'user-admin-1',
      title: 'Schedule Generated',
      message: 'One-year master schedule for all 33 Yarn Division machines generated successfully.',
      type: 'success',
      isRead: true,
      createdAt: '2026-08-25T10:05:00Z',
    },
  ];
}

export function generateInitialAuditLogs(): AuditLog[] {
  return [
    {
      id: 'audit-1',
      action: 'SYSTEM_INITIALIZATION',
      userId: 'user-admin-1',
      userName: 'YFL Administrator',
      role: 'admin',
      recordType: 'System',
      recordId: 'init-001',
      reason: 'YFL Yarn Division Checklist & Task Management System configured with initial machine masters.',
      timestamp: '2026-08-01T09:00:00Z',
    },
    {
      id: 'audit-2',
      action: 'SCHEDULE_GENERATED',
      userId: 'user-admin-1',
      userName: 'YFL Administrator',
      role: 'admin',
      recordType: 'MasterSchedule',
      recordId: 'SCH-BATCH-001',
      reason: '1-Year Master schedule generated for 33 Yarn Division machines through 2027-09-15.',
      timestamp: '2026-08-25T10:00:00Z',
    },
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
      const tms = generateInitialTaskMasters();
      this.setItem('taskMasters', tms);
      const schedules = generateInitialScheduledTasks(tms, INITIAL_SETTINGS.taskAdvanceVisibilityDays);
      this.setItem('scheduledTasks', schedules);
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

  resetToDefault(): void {
    localStorage.clear();
    this.init();
  }
}

export const storage = new StorageManager();
storage.init();
export const storageService = storage;
