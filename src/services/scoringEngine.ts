import { differenceInCalendarDays, parseISO } from 'date-fns';
import { CompletionClassification, RatingThresholds, ScheduledTask, ScorecardStats, ScoreRules } from '../types';

export const SCORING_TABLE = [
  { delayDays: 0, score: 100, label: 'Same Day (+0d)' },
  { delayDays: 1, score: 90, label: '+1 Day Late' },
  { delayDays: 2, score: 80, label: '+2 Days Late' },
  { delayDays: 3, score: 70, label: '+3 Days Late' },
  { delayDays: 4, score: 60, label: '+4 Days Late' },
  { delayDays: 5, score: 50, label: '+5 Days Late' },
  { delayDays: 6, score: 40, label: '+6 Days Late' },
  { delayDays: 7, score: 30, label: '+7 Days Late' },
  { delayDays: 8, score: 20, label: '+8 Days Late' },
  { delayDays: 9, score: 10, label: '+9 Days Late' },
  { delayDays: 10, score: 0, label: '≥10 Days Late / Overdue' },
];

export const DEFAULT_SCORE_RULES: ScoreRules = {
  onTimeScore: 100,
  earlyScore: 100,
  lateScoreRules: {
    oneDayLate: 90,
    twoDaysLate: 80,
    threeDaysLate: 70,
    fourDaysLate: 60,
    fivePlusDaysLate: 50,
  },
  openOverdueScore: 0,
};

export const DEFAULT_RATING_THRESHOLDS: RatingThresholds = {
  excellent: 95,
  veryGood: 85,
  good: 75,
  needsImprovement: 60,
  critical: 0,
};

/**
 * Computes completion classification, delay in days, and score for a completed task
 */
export function evaluateTaskCompletion(
  dueDateStr: string,
  completionDateStr: string, // YYYY-MM-DD
  scoreRules: ScoreRules = DEFAULT_SCORE_RULES
): {
  classification: CompletionClassification;
  delayDays: number;
  score: number;
} {
  const dueDate = parseISO(dueDateStr);
  const completionDate = parseISO(completionDateStr);
  const diffDays = differenceInCalendarDays(completionDate, dueDate);

  if (diffDays < 0) {
    return {
      classification: 'early',
      delayDays: 0,
      score: scoreRules.earlyScore,
    };
  } else if (diffDays === 0) {
    return {
      classification: 'on_time',
      delayDays: 0,
      score: scoreRules.onTimeScore,
    };
  } else {
    // Late completion
    let score = scoreRules.lateScoreRules.fivePlusDaysLate;
    if (diffDays === 1) score = scoreRules.lateScoreRules.oneDayLate;
    else if (diffDays === 2) score = scoreRules.lateScoreRules.twoDaysLate;
    else if (diffDays === 3) score = scoreRules.lateScoreRules.threeDaysLate;
    else if (diffDays === 4) score = scoreRules.lateScoreRules.fourDaysLate;

    return {
      classification: 'late',
      delayDays: diffDays,
      score,
    };
  }
}

/**
 * Determines current status of an uncompleted task relative to today's date
 */
export function determineCurrentTaskStatus(
  dueDateStr: string,
  visibilityDateStr: string,
  todayStr: string
): 'future' | 'available' | 'due_today' | 'overdue' {
  const dueDate = parseISO(dueDateStr);
  const visibilityDate = parseISO(visibilityDateStr);
  const today = parseISO(todayStr);

  if (differenceInCalendarDays(today, dueDate) > 0) {
    return 'overdue';
  } else if (differenceInCalendarDays(today, dueDate) === 0) {
    return 'due_today';
  } else if (differenceInCalendarDays(today, visibilityDate) >= 0) {
    return 'available';
  } else {
    return 'future';
  }
}

/**
 * Returns qualitative rating category and badge styling from an average score
 */
export function getRatingDetails(
  score: number,
  thresholds: RatingThresholds = DEFAULT_RATING_THRESHOLDS
): { label: string; color: string; badgeClass: string } {
  if (score >= thresholds.excellent) {
    return {
      label: 'Excellent',
      color: '#10b981',
      badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    };
  } else if (score >= thresholds.veryGood) {
    return {
      label: 'Very Good',
      color: '#3b82f6',
      badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300',
    };
  } else if (score >= thresholds.good) {
    return {
      label: 'Good',
      color: '#0d9488',
      badgeClass: 'bg-teal-100 text-teal-800 border border-teal-300',
    };
  } else if (score >= thresholds.needsImprovement) {
    return {
      label: 'Needs Improvement',
      color: '#f59e0b',
      badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300',
    };
  } else {
    return {
      label: 'Critical',
      color: '#ef4444',
      badgeClass: 'bg-red-100 text-red-800 border border-red-300',
    };
  }
}

/**
 * Calculates complete scorecard metrics for a list of scheduled tasks
 */
export function calculateScorecard(
  tasks: ScheduledTask[],
  employeeId: string,
  employeeName: string,
  departmentName: string,
  thresholds: RatingThresholds = DEFAULT_RATING_THRESHOLDS
): ScorecardStats {
  // Only consider tasks whose due date has arrived or passed, or that were completed early
  const relevantTasks = tasks.filter(t => 
    t.status === 'completed_early' ||
    t.status === 'completed_on_time' ||
    t.status === 'completed_late' ||
    t.status === 'due_today' ||
    t.status === 'overdue'
  );

  const completedEarly = tasks.filter(t => t.status === 'completed_early').length;
  const completedOnTime = tasks.filter(t => t.status === 'completed_on_time').length;
  const completedLate = tasks.filter(t => t.status === 'completed_late').length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
  const completedTasks = completedEarly + completedOnTime + completedLate;
  const totalTasksDue = relevantTasks.length;

  const completionRate = totalTasksDue > 0 ? Math.round((completedTasks / totalTasksDue) * 100) : 100;
  const onTimeRate = completedTasks > 0 ? Math.round(((completedOnTime + completedEarly) / completedTasks) * 100) : 100;
  const lateRate = completedTasks > 0 ? Math.round((completedLate / completedTasks) * 100) : 0;

  // Calculate average score across relevant tasks
  // For open overdue tasks, they contribute 0 score until completed
  let totalScore = 0;
  let scoreCount = 0;

  tasks.forEach(t => {
    if (t.completedAt && t.score !== undefined) {
      totalScore += t.score;
      scoreCount++;
    } else if (t.status === 'overdue') {
      totalScore += 0;
      scoreCount++;
    }
  });

  const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 100;
  const ratingDetails = getRatingDetails(averageScore, thresholds);

  // Group by month for historical trend
  const monthMap = new Map<string, { total: number; completed: number; onTime: number; late: number; overdue: number; scores: number[] }>();

  tasks.forEach(t => {
    const monthKey = t.dueDate.slice(0, 7); // YYYY-MM
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { total: 0, completed: 0, onTime: 0, late: 0, overdue: 0, scores: [] });
    }
    const entry = monthMap.get(monthKey)!;
    if (t.status.startsWith('completed') || t.status === 'due_today' || t.status === 'overdue') {
      entry.total++;
    }
    if (t.status.startsWith('completed')) {
      entry.completed++;
      if (t.status === 'completed_on_time' || t.status === 'completed_early') {
        entry.onTime++;
      } else if (t.status === 'completed_late') {
        entry.late++;
      }
      if (t.score !== undefined) entry.scores.push(t.score);
    } else if (t.status === 'overdue') {
      entry.overdue++;
      entry.scores.push(0);
    }
  });

  const monthlyTrends = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, data]) => {
      const avgScore = data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 100;
      return {
        month,
        totalDue: data.total,
        completed: data.completed,
        onTime: data.onTime,
        late: data.late,
        overdue: data.overdue,
        avgScore,
      };
    });

  return {
    employeeId,
    userName: employeeName,
    employeeName,
    departmentName,
    totalAssigned: tasks.length,
    completedTotal: completedTasks,
    totalTasksDue,
    completedTasks,
    completedOnTime,
    completedEarly,
    completedLate,
    overdueTasks,
    overdueCount: overdueTasks,
    completionRate,
    onTimeRate,
    lateRate,
    averageScore,
    rating: ratingDetails.label,
    ratingColor: ratingDetails.color,
    monthlyTrends,
  };
}
