export type UserRole = 'admin' | 'doer';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  loginId: string;
  email: string;
  mobile: string;
  phone?: string;
  departmentId: string;
  departmentName: string;
  designation: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword?: boolean;
  password?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface Department {
  id: string;
  departmentId: string;
  departmentName: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type ChecklistItemChoice = 'ok' | 'not_ok' | 'na';

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  isRequired: boolean;
  displayOrder: number;
}

export interface ChecklistTemplate {
  id: string;
  templateName: string;
  departmentId: string;
  taskCategory: string;
  items: ChecklistItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FrequencyType =
  | 'sequential_rotation'
  | 'daily'
  | 'interval_days'
  | 'weekly'
  | 'monthly_same_date'
  | 'monthly_last_day'
  | 'yearly'
  | 'custom';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type RotationGroup = 'MC1' | 'MC2';

export interface TaskMaster {
  id: string;
  taskId?: number; // 1 to 33
  machineId?: string;
  machineName?: string;
  taskCode: string;
  taskName: string; // e.g. B. Card-1 Machine Maintenance, COMBER-13 Machine Maintenance
  taskDescription: string;
  checklistTemplateId: string;
  checklistName: string;
  assignedUserId: string;
  assignedUserName: string;
  assignedEmployeeId: string;
  departmentId: string;
  departmentName: string;
  taskCategory: string;
  scheduleType?: string; // 'YFL 17-Day Dual Rotation'
  
  // Dual group rotation model
  rotationGroup: RotationGroup;
  rotationPosition: number; // 1-17 for MC1, 1-16 for MC2

  frequencyType: FrequencyType;
  frequencyValue: number;
  weeklyDay?: number;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  priority: TaskPriority;
  estimatedDuration?: string;
  instructions?: string;
  status: 'active' | 'inactive' | 'deactivated';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastScheduleGeneratedThrough?: string;
}

export type ScheduleStatus =
  | 'future'
  | 'available'
  | 'due_today'
  | 'completed_early'
  | 'completed_on_time'
  | 'completed_late'
  | 'overdue'
  | 'cancelled'
  | 'suspended';

export type CompletionClassification = 'early' | 'on_time' | 'late';

export interface ChecklistItemResponse {
  itemId: string;
  label: string;
  status: ChecklistItemChoice;
  remarks?: string;
  observation?: string;
  correctiveAction?: string;
}

export interface ScheduledTask {
  id: string;
  scheduleId: string;
  taskMasterId: string;
  taskCode: string;
  taskName: string;
  checklistTemplateId: string;
  checklistName: string;
  assignedUserId: string;
  assignedUserName: string;
  assignedEmployeeId: string;
  departmentId: string;
  departmentName: string;
  frequencyType: FrequencyType;
  frequencyValue: number;
  frequencyDisplay: string;
  originalStartDate: string;
  dueDate: string; // YYYY-MM-DD
  dayName: string; // 'Monday', 'Saturday', etc.
  visibilityDate: string; // YYYY-MM-DD (dueDate - advanceDays)
  status: ScheduleStatus;
  priority: TaskPriority;
  instructions?: string;

  // Rotation details
  rotationGroup: RotationGroup;
  rotationPosition: number; // 1-17 or 1-16
  cycleNumber: number; // 1, 2, 3...
  cycleDay: number; // 1 to 17
  isSoloDay?: boolean; // true for Spg-5 on Day 17
  pairedTaskMasterId?: string;
  pairedTaskName?: string;
  
  // Completion details
  completedAt?: string; // ISO string
  completedDate?: string; // YYYY-MM-DD
  completedTime?: string; // HH:mm:ss
  completedByUserId?: string;
  completedByUserName?: string;
  completedByUserRole?: UserRole;
  completionClassification?: CompletionClassification;
  delayDays?: number;
  score?: number;
  remarks?: string;
  observation?: string;
  correctiveAction?: string;
  checklistResponses?: ChecklistItemResponse[];
  evidenceUrls?: string[];
  
  // Audit details
  adminCorrection?: {
    correctedBy: string;
    correctedByName: string;
    correctedAt: string;
    reason: string;
    oldStatus: ScheduleStatus;
    newStatus: ScheduleStatus;
    oldScore?: number;
    newScore?: number;
  };
  
  generatedBy: string;
  generatedDate: string;
}

export interface DailyScheduleRow {
  date: string; // YYYY-MM-DD
  dayName: string; // 'Monday', 'Saturday', etc.
  cycleNumber: number;
  cycleDay: number; // 1 to 17
  mc1Task?: ScheduledTask;
  mc2Task?: ScheduledTask;
  mc1MachineName: string;
  mc2MachineName: string; // '-' if blank
  doerName: string;
  departmentName: string;
  isHoliday?: boolean;
  holidayName?: string;
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  departmentId?: string;
  departmentName?: string;
  remarks?: string;
  createdAt?: string;
}

export interface RotationTemplate {
  id: string;
  name: string;
  departmentName: string;
  workingDays: string;
  excludedDays: string[];
  cycleLengthDays: number;
  mc1GroupLength: number;
  mc2GroupLength: number;
  cycleRestartRule: string;
}

export interface ScoreRules {
  onTimeScore: number;
  earlyScore: number;
  lateScoreRules: {
    oneDayLate: number;
    twoDaysLate: number;
    threeDaysLate: number;
    fourDaysLate: number;
    fivePlusDaysLate: number;
  };
  openOverdueScore: number;
}

export interface RatingThresholds {
  excellent: number; // 95+
  veryGood: number;  // 85-94
  good: number;      // 75-84
  needsImprovement: number; // 60-74
  critical: number;  // below 60
}

export interface AppSettings {
  companyName: string;
  divisionName?: string;
  appName: string;
  appTitle?: string;
  tagline: string;
  department: string;
  timezone: string;
  workingDays?: string;
  skipSundays: boolean;
  holidayPolicy: 'skip_and_shift' | 'keep_scheduled';
  taskAdvanceVisibilityDays: number;
  defaultScheduleHorizonMonths: number;
  invalidMonthlyDatePolicy: 'last_day' | 'skip';
  autoExtendSchedule: boolean;
  scoreRules: ScoreRules;
  ratingThresholds: RatingThresholds;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  role: UserRole;
  recordType: string;
  recordId: string;
  previousData?: any;
  newData?: any;
  reason?: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  isRead: boolean;
  createdAt: string;
  relatedScheduleId?: string;
  relatedTaskCode?: string;
}

export interface ScorecardStats {
  employeeId: string;
  userName?: string;
  employeeName: string;
  departmentName: string;
  totalAssigned?: number;
  completedTotal?: number;
  totalTasksDue: number;
  completedTasks: number;
  completedOnTime: number;
  completedEarly: number;
  completedLate: number;
  overdueTasks: number;
  overdueCount?: number;
  completionRate: number;
  onTimeRate: number;
  lateRate: number;
  averageScore: number;
  rating: string;
  ratingColor: string;
  monthlyTrends: Array<{
    month: string;
    totalDue: number;
    completed: number;
    onTime: number;
    late: number;
    overdue: number;
    avgScore: number;
  }>;
}

export type ScorecardResult = ScorecardStats;
