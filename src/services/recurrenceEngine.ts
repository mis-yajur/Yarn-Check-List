import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  getDaysInMonth,
  isAfter,
  isBefore,
  isEqual,
  parseISO,
  setDay,
  subDays,
} from 'date-fns';
import { FrequencyType, TaskMaster } from '../types';

export interface SchedulePreviewResult {
  dates: string[]; // YYYY-MM-DD
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
 * Generates an array of occurrence dates (YYYY-MM-DD) for a given TaskMaster
 * across a horizon (e.g., 12 months from startDate).
 */
export function generateScheduleDates(
  task: Pick<TaskMaster, 'startDate' | 'frequencyType' | 'frequencyValue' | 'weeklyDay'>,
  options?: {
    horizonMonths?: number;
    endDate?: string;
    invalidMonthlyDatePolicy?: 'last_day' | 'skip';
  }
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
    // If weeklyDay specified, adjust first occurrence
    if (task.weeklyDay !== undefined) {
      let target = setDay(current, task.weeklyDay);
      if (isBefore(target, current)) {
        target = addWeeks(target, 1);
      }
      current = target;
    }
    while (!isAfter(current, maxEnd)) {
      dates.push(format(current, 'yyyy-MM-dd'));
      current = addWeeks(current, 1);
    }
  } else if (task.frequencyType === 'monthly_same_date') {
    // Exact day of the month preservation
    const originalTargetDay = start.getDate(); // e.g., 27 or 31
    let monthOffset = 0;

    while (true) {
      const monthBase = addMonths(start, monthOffset);
      if (isAfter(monthBase, maxEnd) && monthOffset > 0) {
        break;
      }

      const year = monthBase.getFullYear();
      const month = monthBase.getMonth(); // 0-indexed
      const daysInThisMonth = getDaysInMonth(new Date(year, month, 1));

      if (originalTargetDay <= daysInThisMonth) {
        const candidate = new Date(year, month, originalTargetDay);
        if (!isAfter(candidate, maxEnd)) {
          dates.push(format(candidate, 'yyyy-MM-dd'));
        }
      } else {
        // Date does not exist (e.g. Feb 30 or Feb 31)
        if (policy === 'last_day') {
          const candidate = new Date(year, month, daysInThisMonth);
          if (!isAfter(candidate, maxEnd)) {
            dates.push(format(candidate, 'yyyy-MM-dd'));
          }
        }
        // If policy is 'skip', we simply skip generating an occurrence for this month
      }

      monthOffset++;
      // Guard against runaway loops
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
      if (!isAfter(candidate, maxEnd)) {
        dates.push(format(candidate, 'yyyy-MM-dd'));
      }
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

  // Deduplicate and sort chronologically
  return Array.from(new Set(dates)).sort();
}

/**
 * Previews the schedule for UI presentation
 */
export function previewSchedule(
  task: Pick<TaskMaster, 'startDate' | 'frequencyType' | 'frequencyValue' | 'weeklyDay'>,
  options?: { horizonMonths?: number; invalidMonthlyDatePolicy?: 'last_day' | 'skip' }
): SchedulePreviewResult {
  const dates = generateScheduleDates(task, options);
  return {
    dates,
    totalCount: dates.length,
    startDate: dates[0] || task.startDate,
    endDate: dates[dates.length - 1] || task.startDate,
    frequencySummary: getFrequencySummary(task.frequencyType, task.frequencyValue, task.weeklyDay),
  };
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
 * Convenience helper to simulate and generate 1-year occurrences
 */
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

