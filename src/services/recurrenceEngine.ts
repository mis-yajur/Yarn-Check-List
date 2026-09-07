import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  getDay,
  getDaysInMonth,
  isAfter,
  isBefore,
  parseISO,
  setDay,
  subDays,
} from 'date-fns';
import {
  DailyScheduleRow,
  FrequencyType,
  Holiday,
  ScheduledTask,
  TaskMaster,
} from '../types';

export interface SchedulePreviewResult {
  dates: string[];
  totalCount: number;
  startDate: string;
  endDate: string;
  frequencySummary: string;
}

/**
 * Returns human-readable summary of frequency
 */
export function getFrequencySummary(type: FrequencyType, value: number, weeklyDay?: number): string {
  switch (type) {
    case 'sequential_rotation':
      return '17-Day Dual Rotation (M/C 1 & M/C 2)';
    case 'daily':
      return value === 1 ? 'Every Day (Daily)' : `Every ${value} Days`;
    case 'interval_days':
      return `Every ${value} Days (Fixed Interval)`;
    case 'weekly': {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = weeklyDay !== undefined ? days[weeklyDay] : 'Scheduled Day';
      return `Weekly on ${dayName}`;
    }
    case 'monthly_same_date':
      return 'Monthly — Same Calendar Date';
    case 'monthly_last_day':
      return 'Monthly — Last Day of Every Month';
    case 'yearly':
      return 'Yearly (Annual Recurring)';
    case 'custom':
      return `Custom Interval (${value} days)`;
    default:
      return `${type} (${value})`;
  }
}

/**
 * Formats a day name from date string
 */
export function getDayName(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return format(d, 'EEEE');
  } catch {
    return 'Monday';
  }
}

/**
 * Calculates visibility date based on advance visibility setting (e.g. 5 days prior)
 */
export function calculateVisibilityDate(dueDateStr: string, advanceDays: number = 5): string {
  const dueDate = parseISO(dueDateStr);
  const visibilityDate = subDays(dueDate, advanceDays);
  return format(visibilityDate, 'yyyy-MM-dd');
}

/**
 * Checks if a given Date is a valid working day (skips Sunday and optional holidays)
 */
export function isValidWorkingDay(
  date: Date,
  holidaySet: Set<string>,
  options?: { skipSundays?: boolean; skipHolidays?: boolean }
): boolean {
  const skipSundays = options?.skipSundays ?? true;
  const skipHolidays = options?.skipHolidays ?? true;

  const dayOfWeek = getDay(date); // 0 = Sunday
  if (skipSundays && dayOfWeek === 0) {
    return false;
  }

  const dateStr = format(date, 'yyyy-MM-dd');
  if (skipHolidays && holidaySet.has(dateStr)) {
    return false;
  }

  return true;
}

/**
 * Gets the first valid working date starting on or after the candidate date
 */
export function getFirstValidWorkingDay(
  candidate: Date,
  holidaySet: Set<string>,
  options?: { skipSundays?: boolean; skipHolidays?: boolean }
): Date {
  let d = candidate;
  while (!isValidWorkingDay(d, holidaySet, options)) {
    d = addDays(d, 1);
  }
  return d;
}

/**
 * Gets the next valid working date strictly after the given date
 */
export function getNextWorkingDay(
  current: Date,
  holidaySet: Set<string>,
  options?: { skipSundays?: boolean; skipHolidays?: boolean }
): Date {
  let d = addDays(current, 1);
  while (!isValidWorkingDay(d, holidaySet, options)) {
    d = addDays(d, 1);
  }
  return d;
}

export interface YflRotationEngineResult {
  scheduledTasks: ScheduledTask[];
  dailyRows: DailyScheduleRow[];
  totalWorkingDays: number;
  totalTaskRecords: number;
  mc1Total: number;
  mc2Total: number;
  cycleCount: number;
  startDate: string;
  endDate: string;
}

/**
 * Yajur Fibres Limited – Yarn Division Accurate Daily Machine Maintenance Rotation Engine
 * 
 * Rules:
 * 1. M/C 1 is a 17-machine loop (B. Card-1 ... Spg-5)
 * 2. M/C 2 is a 16-machine loop (COMBER-1 ... Polish m/c-3)
 * 3. 17-Working-Day Cycle:
 *    - Cycle Day 1 to 16: M/C 1 and M/C 2 both scheduled.
 *    - Cycle Day 17: M/C 1 (Spg-5) is scheduled alone. M/C 2 is blank ('-').
 *    - Cycle Day 18 (Cycle 2, Day 1): BOTH groups restart together from Day 1 on the next working day.
 * 4. Sunday is ALWAYS skipped.
 * 5. Optional Holidays: skipped and rotation shifts to the next working day without skipping machines.
 */
export function generateYflDualRotationSchedule(
  taskMasters: TaskMaster[],
  options?: {
    startDate?: string; // YYYY-MM-DD (e.g. '2026-07-04')
    durationDays?: number; // default: 365 (1 year)
    horizonMonths?: number;
    holidays?: Holiday[];
    skipHolidays?: boolean;
    skipSundays?: boolean;
    advanceDays?: number;
  }
): YflRotationEngineResult {
  if (!taskMasters || taskMasters.length === 0) {
    return {
      scheduledTasks: [],
      dailyRows: [],
      totalWorkingDays: 0,
      totalTaskRecords: 0,
      mc1Total: 0,
      mc2Total: 0,
      cycleCount: 0,
      startDate: options?.startDate || '2026-07-04',
      endDate: options?.startDate || '2026-07-04',
    };
  }

  const startDateStr = options?.startDate || '2026-07-04';
  const durationDays = options?.durationDays || (options?.horizonMonths ? options.horizonMonths * 30 : 365);
  const skipHolidays = options?.skipHolidays ?? true;
  const skipSundays = options?.skipSundays ?? true;
  const advanceDays = options?.advanceDays ?? 5;

  const holidayMap = new Map<string, string>();
  if (options?.holidays) {
    options.holidays.forEach((h) => holidayMap.set(h.date, h.name));
  }
  const holidaySet = new Set(holidayMap.keys());

  // Filter and sort Group 1 (MC1: 17 machines) and Group 2 (MC2: 16 machines)
  const mc1List = taskMasters
    .filter((t) => t.rotationGroup === 'MC1' || (!t.rotationGroup && (t.taskId || 0) <= 17))
    .sort((a, b) => (a.rotationPosition || a.taskId || 0) - (b.rotationPosition || b.taskId || 0));

  const mc2List = taskMasters
    .filter((t) => t.rotationGroup === 'MC2' || (!t.rotationGroup && (t.taskId || 0) > 17))
    .sort((a, b) => (a.rotationPosition || a.taskId || 0) - (b.rotationPosition || b.taskId || 0));

  if (mc1List.length === 0 && mc2List.length === 0) {
    return {
      scheduledTasks: [],
      dailyRows: [],
      totalWorkingDays: 0,
      totalTaskRecords: 0,
      mc1Total: 0,
      mc2Total: 0,
      cycleCount: 0,
      startDate: startDateStr,
      endDate: startDateStr,
    };
  }

  const startParsed = parseISO(startDateStr);
  const maxEndDate = addDays(startParsed, durationDays);

  const scheduledTasks: ScheduledTask[] = [];
  const dailyRows: DailyScheduleRow[] = [];

  // Occurrence counters per task master
  const occCountMap: Record<string, number> = {};

  let currentWorkingDate = getFirstValidWorkingDay(startParsed, holidaySet, { skipSundays, skipHolidays });
  let cycleNumber = 1;
  let cycleDay = 1; // 1 to 17

  while (!isAfter(currentWorkingDate, maxEndDate)) {
    const dateStr = format(currentWorkingDate, 'yyyy-MM-dd');
    const dayName = format(currentWorkingDate, 'EEEE');

    const mc1Master = mc1List[(cycleDay - 1) % mc1List.length];
    const mc2Master = cycleDay <= 16 && mc2List.length > 0 ? mc2List[(cycleDay - 1) % mc2List.length] : null;

    let mc1TaskRecord: ScheduledTask | undefined;
    let mc2TaskRecord: ScheduledTask | undefined;

    // 1. Generate M/C 1 Scheduled Task
    if (mc1Master) {
      const occNum = (occCountMap[mc1Master.id] || 0) + 1;
      occCountMap[mc1Master.id] = occNum;
      const visDate = calculateVisibilityDate(dateStr, advanceDays);

      mc1TaskRecord = {
        id: `sch-${mc1Master.id}-${dateStr}-c${cycleNumber}d${cycleDay}-mc1`,
        scheduleId: `SCH-${mc1Master.taskCode}-${occNum.toString().padStart(3, '0')}`,
        taskMasterId: mc1Master.id,
        taskCode: mc1Master.taskCode,
        taskName: mc1Master.taskName,
        checklistTemplateId: mc1Master.checklistTemplateId,
        checklistName: mc1Master.checklistName,
        assignedUserId: mc1Master.assignedUserId,
        assignedUserName: mc1Master.assignedUserName,
        assignedEmployeeId: mc1Master.assignedEmployeeId,
        departmentId: mc1Master.departmentId,
        departmentName: mc1Master.departmentName,
        frequencyType: 'sequential_rotation',
        frequencyValue: 2,
        frequencyDisplay: '17-Day Dual Rotation (M/C 1)',
        originalStartDate: startDateStr,
        dueDate: dateStr,
        dayName,
        visibilityDate: visDate,
        status: 'future',
        priority: mc1Master.priority,
        instructions: mc1Master.instructions,
        rotationGroup: 'MC1',
        rotationPosition: cycleDay,
        cycleNumber,
        cycleDay,
        isSoloDay: cycleDay === 17,
        pairedTaskMasterId: mc2Master?.id,
        pairedTaskName: mc2Master?.taskName,
        generatedBy: 'yfl_dual_rotation_engine',
        generatedDate: format(new Date(), 'yyyy-MM-dd'),
      };

      scheduledTasks.push(mc1TaskRecord);
    }

    // 2. Generate M/C 2 Scheduled Task (Only for Cycle Days 1 to 16)
    if (mc2Master && cycleDay <= 16) {
      const occNum = (occCountMap[mc2Master.id] || 0) + 1;
      occCountMap[mc2Master.id] = occNum;
      const visDate = calculateVisibilityDate(dateStr, advanceDays);

      mc2TaskRecord = {
        id: `sch-${mc2Master.id}-${dateStr}-c${cycleNumber}d${cycleDay}-mc2`,
        scheduleId: `SCH-${mc2Master.taskCode}-${occNum.toString().padStart(3, '0')}`,
        taskMasterId: mc2Master.id,
        taskCode: mc2Master.taskCode,
        taskName: mc2Master.taskName,
        checklistTemplateId: mc2Master.checklistTemplateId,
        checklistName: mc2Master.checklistName,
        assignedUserId: mc2Master.assignedUserId,
        assignedUserName: mc2Master.assignedUserName,
        assignedEmployeeId: mc2Master.assignedEmployeeId,
        departmentId: mc2Master.departmentId,
        departmentName: mc2Master.departmentName,
        frequencyType: 'sequential_rotation',
        frequencyValue: 2,
        frequencyDisplay: '17-Day Dual Rotation (M/C 2)',
        originalStartDate: startDateStr,
        dueDate: dateStr,
        dayName,
        visibilityDate: visDate,
        status: 'future',
        priority: mc2Master.priority,
        instructions: mc2Master.instructions,
        rotationGroup: 'MC2',
        rotationPosition: cycleDay,
        cycleNumber,
        cycleDay,
        isSoloDay: false,
        pairedTaskMasterId: mc1Master?.id,
        pairedTaskName: mc1Master?.taskName,
        generatedBy: 'yfl_dual_rotation_engine',
        generatedDate: format(new Date(), 'yyyy-MM-dd'),
      };

      scheduledTasks.push(mc2TaskRecord);
    }

    // Add paired row for table visualization
    dailyRows.push({
      date: dateStr,
      dayName,
      cycleNumber,
      cycleDay,
      mc1Task: mc1TaskRecord,
      mc2Task: mc2TaskRecord,
      mc1MachineName: mc1Master ? mc1Master.taskName : '-',
      mc2MachineName: mc2Master && cycleDay <= 16 ? mc2Master.taskName : '-',
      doerName: mc1Master?.assignedUserName || 'Swapan Kr Ghorai',
      departmentName: mc1Master?.departmentName || 'Yarn Division',
      isHoliday: holidaySet.has(dateStr),
      holidayName: holidayMap.get(dateStr),
    });

    // Advance cycle day
    if (cycleDay >= 17) {
      cycleDay = 1;
      cycleNumber++;
    } else {
      cycleDay++;
    }

    // Move to next working day (skipping Sunday and holidays)
    currentWorkingDate = getNextWorkingDay(currentWorkingDate, holidaySet, { skipSundays, skipHolidays });
  }

  const lastDueDate = dailyRows[dailyRows.length - 1]?.date || startDateStr;

  return {
    scheduledTasks,
    dailyRows,
    totalWorkingDays: dailyRows.length,
    totalTaskRecords: scheduledTasks.length,
    mc1Total: scheduledTasks.filter((t) => t.rotationGroup === 'MC1').length,
    mc2Total: scheduledTasks.filter((t) => t.rotationGroup === 'MC2').length,
    cycleCount: cycleNumber,
    startDate: startDateStr,
    endDate: lastDueDate,
  };
}

/**
 * Legacy/Standard helpers for fallback
 */
export function generateScheduleDates(
  task: Pick<TaskMaster, 'startDate' | 'frequencyType' | 'frequencyValue' | 'weeklyDay'>,
  options?: { horizonMonths?: number; endDate?: string; invalidMonthlyDatePolicy?: 'last_day' | 'skip' }
): string[] {
  const horizonMonths = options?.horizonMonths ?? 12;
  const policy = options?.invalidMonthlyDatePolicy ?? 'last_day';
  const start = parseISO(task.startDate);
  const maxEnd = options?.endDate ? parseISO(options.endDate) : addMonths(start, horizonMonths);

  const dates: string[] = [];
  let current = start;

  if (task.frequencyType === 'daily') {
    const step = Math.max(1, task.frequencyValue || 1);
    while (!isAfter(current, maxEnd)) {
      dates.push(format(current, 'yyyy-MM-dd'));
      current = addDays(current, step);
    }
  } else if (task.frequencyType === 'interval_days' || task.frequencyType === 'custom') {
    const step = Math.max(1, task.frequencyValue || 15);
    while (!isAfter(current, maxEnd)) {
      dates.push(format(current, 'yyyy-MM-dd'));
      current = addDays(current, step);
    }
  } else if (task.frequencyType === 'weekly') {
    if (task.weeklyDay !== undefined) {
      let target = setDay(current, task.weeklyDay);
      if (isBefore(target, current)) target = addWeeks(target, 1);
      current = target;
    }
    while (!isAfter(current, maxEnd)) {
      dates.push(format(current, 'yyyy-MM-dd'));
      current = addWeeks(current, 1);
    }
  } else if (task.frequencyType === 'monthly_same_date') {
    const originalTargetDay = start.getDate();
    let monthOffset = 0;
    while (true) {
      const monthBase = addMonths(start, monthOffset);
      if (isAfter(monthBase, maxEnd) && monthOffset > 0) break;
      const year = monthBase.getFullYear();
      const month = monthBase.getMonth();
      const daysInThisMonth = getDaysInMonth(new Date(year, month, 1));
      if (originalTargetDay <= daysInThisMonth) {
        const candidate = new Date(year, month, originalTargetDay);
        if (!isAfter(candidate, maxEnd)) dates.push(format(candidate, 'yyyy-MM-dd'));
      } else if (policy === 'last_day') {
        const candidate = new Date(year, month, daysInThisMonth);
        if (!isAfter(candidate, maxEnd)) dates.push(format(candidate, 'yyyy-MM-dd'));
      }
      monthOffset++;
      if (monthOffset > horizonMonths + 2) break;
    }
  } else if (task.frequencyType === 'monthly_last_day') {
    let monthOffset = 0;
    while (true) {
      const monthBase = addMonths(start, monthOffset);
      if (isAfter(monthBase, maxEnd) && monthOffset > 0) break;
      const year = monthBase.getFullYear();
      const month = monthBase.getMonth();
      const daysInThisMonth = getDaysInMonth(new Date(year, month, 1));
      const candidate = new Date(year, month, daysInThisMonth);
      if (!isAfter(candidate, maxEnd)) dates.push(format(candidate, 'yyyy-MM-dd'));
      monthOffset++;
      if (monthOffset > horizonMonths + 2) break;
    }
  } else if (task.frequencyType === 'yearly') {
    let yearOffset = 0;
    while (true) {
      const candidate = addYears(start, yearOffset);
      if (isAfter(candidate, maxEnd)) break;
      dates.push(format(candidate, 'yyyy-MM-dd'));
      yearOffset++;
      if (yearOffset > Math.ceil(horizonMonths / 12) + 1) break;
    }
  }

  return Array.from(new Set(dates)).sort();
}

export function generateOneYearOccurrences(
  startDate: string,
  frequencyType: FrequencyType,
  frequencyValue: number,
  weeklyDay: number = 1,
  invalidMonthlyDatePolicy: 'last_day' | 'skip' = 'last_day',
  horizonDays: number = 365
): string[] {
  return generateScheduleDates(
    { startDate, frequencyType, frequencyValue, weeklyDay },
    { horizonMonths: Math.ceil(horizonDays / 30), invalidMonthlyDatePolicy }
  );
}

export function previewSchedule(
  task: Pick<TaskMaster, 'startDate' | 'frequencyType' | 'frequencyValue'> & { weeklyDay?: number },
  options?: { horizonMonths?: number; invalidMonthlyDatePolicy?: 'last_day' | 'skip' }
): SchedulePreviewResult {
  const horizonMonths = options?.horizonMonths || 12;
  const dates = generateScheduleDates(task, { horizonMonths, invalidMonthlyDatePolicy: options?.invalidMonthlyDatePolicy });
  return {
    dates,
    totalCount: dates.length,
    startDate: dates[0] || task.startDate,
    endDate: dates[dates.length - 1] || task.startDate,
    frequencySummary: getFrequencySummary(task.frequencyType, task.frequencyValue, task.weeklyDay),
  };
}

