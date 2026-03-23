import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────────

interface BubbleUser {
  bubble_id: string;
  created_at: string | null;
  supabase_user_id: string | null;
}

interface BubbleShift {
  bubble_id: string;
  bubble_user_id: string;
  date: string;
  job: string | null;
  location: string | null;
  shift: string | null;
  reg_hours: number;
  ot_hours: number;
  total_pay: number;
  created_at: string | null;
}

// ── Computed Metric Types ────────────────────────────────────────────────────

export interface WeeklyMetric {
  week: string; // YYYY-WW or label like "Jan 6"
  weekStart: string; // YYYY-MM-DD
  activeUsers: number;
  newUsers: number;
  cumulativeUsers: number;
  shiftsLogged: number;
  payTracked: number;
}

export interface StickinessBucket {
  week: string;
  weekStart: string;
  dau: number;
  wau: number;
  mau: number;
  dauWauRatio: number;
  dauMauRatio: number;
}

export interface CohortRow {
  cohortMonth: string; // "Jan 2024"
  cohortKey: string; // "2024-01"
  size: number;
  retention: (number | null)[]; // M0, M1, M2, ..., M12
}

export interface PeakHourBucket {
  hour: number; // 0-23
  label: string; // "6 AM"
  count: number;
}

export interface JobDistribution {
  job: string;
  count: number;
  pay: number;
}

export interface ShiftTypeBreakdown {
  type: string;
  count: number;
}

export interface MetricsSummary {
  totalUsers: number;
  activeUsersThisWeek: number;
  activeUsersLastWeek: number;
  weeklyShifts: number;
  weeklyShiftsLastWeek: number;
  totalPayTracked: number;
  monthlyPayTracked: number;
  retentionRateM1: number | null;
  migratedUsers: number;
}

export interface MetricsData {
  summary: MetricsSummary;
  weeklyGrowth: WeeklyMetric[];
  stickiness: StickinessBucket[];
  cohorts: CohortRow[];
  peakHours: PeakHourBucket[];
  jobDistribution: JobDistribution[];
  shiftTypes: ShiftTypeBreakdown[];
}

// ── Helper Functions ─────────────────────────────────────────────────────────

/** Get ISO week start (Monday) for a date string */
function getWeekStart(dateStr: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(y, m - 1, d + diff);
  const yy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Get month key from date string */
function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // "2024-01"
}

/** Format month key to label */
function monthKeyToLabel(key: string): string {
  const [y, m] = key.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

/** Format week start to short label */
function weekStartToLabel(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}`;
}

/** Format hour to label */
function hourToLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

/** Months between two month keys */
function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}

// ── Data Processing ──────────────────────────────────────────────────────────

function computeMetrics(users: BubbleUser[], shifts: BubbleShift[]): MetricsData {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const thisWeekStart = getWeekStart(todayStr);

  // Previous week start
  const prevWeekDate = new Date(now);
  prevWeekDate.setDate(prevWeekDate.getDate() - 7);
  const prevWeekStr = `${prevWeekDate.getFullYear()}-${String(prevWeekDate.getMonth() + 1).padStart(2, '0')}-${String(prevWeekDate.getDate()).padStart(2, '0')}`;
  const lastWeekStart = getWeekStart(prevWeekStr);

  // Current month start
  const monthStart = todayStr.slice(0, 7) + '-01';

  // Pre-index shifts by date for O(1) lookups (used by stickiness, peak hours, etc.)
  const shiftsByDate = new Map<string, Set<string>>();
  for (const s of shifts) {
    const sd = s.date?.slice(0, 10);
    if (!sd) continue;
    if (!shiftsByDate.has(sd)) shiftsByDate.set(sd, new Set());
    shiftsByDate.get(sd)!.add(s.bubble_user_id);
  }

  // ── Summary Metrics ──────────────────────────────────────────────────────

  const usersActiveThisWeek = new Set<string>();
  const usersActiveLastWeek = new Set<string>();
  let weeklyShifts = 0;
  let weeklyShiftsLastWeek = 0;
  let monthlyPay = 0;
  const totalPay = shifts.reduce((sum, s) => sum + (s.total_pay || 0), 0);

  for (const s of shifts) {
    const shiftDate = s.date?.slice(0, 10);
    if (!shiftDate) continue;

    const weekStart = getWeekStart(shiftDate);
    if (weekStart === thisWeekStart) {
      usersActiveThisWeek.add(s.bubble_user_id);
      weeklyShifts++;
    }
    if (weekStart === lastWeekStart) {
      usersActiveLastWeek.add(s.bubble_user_id);
      weeklyShiftsLastWeek++;
    }
    if (shiftDate >= monthStart) {
      monthlyPay += s.total_pay || 0;
    }
  }

  const migratedUsers = users.filter(u => u.supabase_user_id != null).length;

  // ── Weekly Growth ────────────────────────────────────────────────────────

  // Group shifts by week
  const shiftsByWeek = new Map<string, Set<string>>();
  const shiftsCountByWeek = new Map<string, number>();
  const payByWeek = new Map<string, number>();

  for (const s of shifts) {
    const shiftDate = s.date?.slice(0, 10);
    if (!shiftDate) continue;
    const ws = getWeekStart(shiftDate);

    if (!shiftsByWeek.has(ws)) shiftsByWeek.set(ws, new Set());
    shiftsByWeek.get(ws)!.add(s.bubble_user_id);
    shiftsCountByWeek.set(ws, (shiftsCountByWeek.get(ws) || 0) + 1);
    payByWeek.set(ws, (payByWeek.get(ws) || 0) + (s.total_pay || 0));
  }

  // Group signups by week
  const signupsByWeek = new Map<string, number>();
  for (const u of users) {
    const createdAt = u.created_at?.slice(0, 10);
    if (!createdAt) continue;
    const ws = getWeekStart(createdAt);
    signupsByWeek.set(ws, (signupsByWeek.get(ws) || 0) + 1);
  }

  // Build weekly growth series (last 26 weeks)
  const weeklyGrowth: WeeklyMetric[] = [];
  let cumUsers = 0;

  // Calculate cumulative users up to 26 weeks ago
  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() - 26 * 7);
  const cutoffStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-${String(cutoffDate.getDate()).padStart(2, '0')}`;
  const cutoffWeekStart = getWeekStart(cutoffStr);

  // Count all users who signed up before the cutoff
  for (const u of users) {
    const createdAt = u.created_at?.slice(0, 10);
    if (createdAt && createdAt < cutoffWeekStart) {
      cumUsers++;
    }
  }

  // Build series for last 26 weeks
  for (let i = 25; i >= 0; i--) {
    const weekDate = new Date(now);
    weekDate.setDate(weekDate.getDate() - i * 7);
    const weekStr = `${weekDate.getFullYear()}-${String(weekDate.getMonth() + 1).padStart(2, '0')}-${String(weekDate.getDate()).padStart(2, '0')}`;
    const ws = getWeekStart(weekStr);

    const newUsers = signupsByWeek.get(ws) || 0;
    cumUsers += newUsers;

    weeklyGrowth.push({
      week: weekStartToLabel(ws),
      weekStart: ws,
      activeUsers: shiftsByWeek.get(ws)?.size || 0,
      newUsers,
      cumulativeUsers: cumUsers,
      shiftsLogged: shiftsCountByWeek.get(ws) || 0,
      payTracked: payByWeek.get(ws) || 0,
    });
  }

  // ── Stickiness (DAU/WAU/MAU) ─────────────────────────────────────────────

  // For each of the last 12 weeks, compute DAU (avg), WAU, MAU
  // Uses pre-indexed shiftsByDate map for O(days) instead of O(shifts) per week
  const stickiness: StickinessBucket[] = [];

  const formatDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  for (let i = 11; i >= 0; i--) {
    const weekDate = new Date(now);
    weekDate.setDate(weekDate.getDate() - i * 7);
    const ws = getWeekStart(formatDateStr(weekDate));
    const [wy, wm, wd] = ws.split('-').map(Number);

    // WAU: unique users who logged a shift this week
    const wau = shiftsByWeek.get(ws)?.size || 0;

    // DAU: average daily unique users over the 7 days of this week
    let totalDailyUsers = 0;
    let daysWithData = 0;
    for (let d = 0; d < 7; d++) {
      const dayDate = new Date(wy, wm - 1, wd + d);
      const dayStr = formatDateStr(dayDate);
      const dayUsers = shiftsByDate.get(dayStr);
      if (dayUsers && dayUsers.size > 0) {
        totalDailyUsers += dayUsers.size;
        daysWithData++;
      }
    }
    const dau = daysWithData > 0 ? Math.round(totalDailyUsers / 7) : 0;

    // MAU: unique users over the 28-day window ending at end of this week
    const mauStartDate = new Date(wy, wm - 1, wd - 21);
    const mauStartStr = formatDateStr(mauStartDate);
    const weekEndDate = new Date(wy, wm - 1, wd + 6);
    const weekEndStr = formatDateStr(weekEndDate);

    const mauUsers = new Set<string>();
    for (const [dateKey, userSet] of shiftsByDate) {
      if (dateKey >= mauStartStr && dateKey <= weekEndStr) {
        for (const uid of userSet) {
          mauUsers.add(uid);
        }
      }
    }
    const mau = mauUsers.size;

    stickiness.push({
      week: weekStartToLabel(ws),
      weekStart: ws,
      dau,
      wau,
      mau,
      dauWauRatio: wau > 0 ? Math.round((dau / wau) * 100) : 0,
      dauMauRatio: mau > 0 ? Math.round((dau / mau) * 100) : 0,
    });
  }

  // ── Cohort Retention ─────────────────────────────────────────────────────

  // Group users by signup month
  const usersBySignupMonth = new Map<string, string[]>();
  for (const u of users) {
    const createdAt = u.created_at?.slice(0, 10);
    if (!createdAt) continue;
    const mk = getMonthKey(createdAt);
    if (!usersBySignupMonth.has(mk)) usersBySignupMonth.set(mk, []);
    usersBySignupMonth.get(mk)!.push(u.bubble_id);
  }

  // Group shifts by user + month
  const userActivityByMonth = new Map<string, Set<string>>(); // "userId:2024-01" => exists
  for (const s of shifts) {
    const sd = s.date?.slice(0, 10);
    if (!sd) continue;
    const mk = getMonthKey(sd);
    const key = `${s.bubble_user_id}:${mk}`;
    if (!userActivityByMonth.has(key)) userActivityByMonth.set(key, new Set());
    userActivityByMonth.get(key)!.add(sd);
  }

  const currentMonthKey = getMonthKey(todayStr);
  const sortedCohortMonths = [...usersBySignupMonth.keys()].sort();

  // Only include last 12 cohorts
  const recentCohortMonths = sortedCohortMonths.slice(-12);

  const cohorts: CohortRow[] = recentCohortMonths.map(cohortMonth => {
    const cohortUserIds = usersBySignupMonth.get(cohortMonth)!;
    const size = cohortUserIds.length;
    const maxMonths = monthsBetween(cohortMonth, currentMonthKey);
    const retention: (number | null)[] = [];

    for (let m = 0; m <= Math.min(maxMonths, 12); m++) {
      const [cy, cm] = cohortMonth.split('-').map(Number);
      const targetDate = new Date(cy, cm - 1 + m, 1);
      const targetKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

      let activeInMonth = 0;
      for (const uid of cohortUserIds) {
        if (userActivityByMonth.has(`${uid}:${targetKey}`)) {
          activeInMonth++;
        }
      }

      retention.push(size > 0 ? Math.round((activeInMonth / size) * 100) : 0);
    }

    // Pad with nulls for months that haven't happened yet
    while (retention.length <= 12) {
      retention.push(null);
    }

    return {
      cohortMonth: monthKeyToLabel(cohortMonth),
      cohortKey: cohortMonth,
      size,
      retention,
    };
  });

  // ── Retention M1 ─────────────────────────────────────────────────────────

  // Average M1 retention across last 6 cohorts
  const recentCohortsForM1 = cohorts.slice(-6);
  const m1Values = recentCohortsForM1
    .map(c => c.retention[1])
    .filter((v): v is number => v != null);
  const retentionRateM1 = m1Values.length > 0
    ? Math.round(m1Values.reduce((a, b) => a + b, 0) / m1Values.length)
    : null;

  // ── Peak Hours ───────────────────────────────────────────────────────────

  // Use created_at timestamp to determine when shifts are logged
  const hourCounts = new Array(24).fill(0);
  for (const s of shifts) {
    if (s.created_at) {
      const hour = new Date(s.created_at).getHours();
      hourCounts[hour]++;
    }
  }

  const peakHours: PeakHourBucket[] = hourCounts.map((count, hour) => ({
    hour,
    label: hourToLabel(hour),
    count,
  }));

  // ── Job Distribution ─────────────────────────────────────────────────────

  const jobMap = new Map<string, { count: number; pay: number }>();
  for (const s of shifts) {
    const job = s.job || 'Unknown';
    const prev = jobMap.get(job) || { count: 0, pay: 0 };
    jobMap.set(job, { count: prev.count + 1, pay: prev.pay + (s.total_pay || 0) });
  }

  const jobDistribution: JobDistribution[] = [...jobMap.entries()]
    .map(([job, data]) => ({ job, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // ── Shift Type Breakdown ─────────────────────────────────────────────────

  const typeMap = new Map<string, number>();
  for (const s of shifts) {
    const type = s.shift || 'Unknown';
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  }

  const shiftTypes: ShiftTypeBreakdown[] = [...typeMap.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // ── Assemble ─────────────────────────────────────────────────────────────

  return {
    summary: {
      totalUsers: users.length,
      activeUsersThisWeek: usersActiveThisWeek.size,
      activeUsersLastWeek: usersActiveLastWeek.size,
      weeklyShifts,
      weeklyShiftsLastWeek,
      totalPayTracked: totalPay,
      monthlyPayTracked: monthlyPay,
      retentionRateM1,
      migratedUsers,
    },
    weeklyGrowth,
    stickiness,
    cohorts,
    peakHours,
    jobDistribution,
    shiftTypes,
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useMetrics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['platform-metrics'],
    queryFn: async () => {
      // Fetch all bubble_users
      const { data: usersData, error: usersError } = await supabase
        .from('bubble_users')
        .select('bubble_id, created_at, supabase_user_id');

      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }

      // Fetch all bubble_shifts
      // Supabase default limit is 1000, we need all shifts
      // Paginate to get everything
      const allShifts: BubbleShift[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: shiftsPage, error: shiftsError } = await supabase
          .from('bubble_shifts')
          .select('bubble_id, bubble_user_id, date, job, location, shift, reg_hours, ot_hours, total_pay, created_at')
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('date', { ascending: false });

        if (shiftsError) {
          throw new Error(`Failed to fetch shifts: ${shiftsError.message}`);
        }

        if (shiftsPage && shiftsPage.length > 0) {
          allShifts.push(...(shiftsPage as BubbleShift[]));
          hasMore = shiftsPage.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      return computeMetrics(usersData as BubbleUser[], allShifts);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes — metrics don't need real-time refresh
    gcTime: 30 * 60 * 1000, // Keep in cache 30 minutes
  });

  return {
    metrics: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
  };
}
