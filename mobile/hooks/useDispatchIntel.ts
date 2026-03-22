import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getLocalDateStr } from '../lib/formatters';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TickTotal {
  shift: string;
  date: string;
  pre: string;
  at: string;
}

interface TickSectionJob {
  job: string;
  [key: string]: string;
}

interface TickSection {
  section: string;
  totals: TickTotal[];
  jobs: TickSectionJob[];
}

interface TickDeltaTotalChange {
  shift: string;
  preDelta: number;
  atDelta: number;
}

interface TickDeltaSectionChange {
  section: string;
  shift: string;
  preDelta: number;
  atDelta: number;
}

interface TickDelta {
  location: string;
  totalChanges: TickDeltaTotalChange[];
  sectionChanges: TickDeltaSectionChange[];
  totalPreDelta: number;
  totalAtDelta: number;
}

interface DispatchMonitorTick {
  id: string;
  location: string;
  window_type: string;
  tick_at: string;
  tick_num: number;
  day_of_week: number;
  date: string;
  totals: TickTotal[];
  sections: TickSection[];
  delta: TickDelta | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type SignalLevel = 'Good' | 'Moderate' | 'Low';

export interface DayShiftStats {
  pre: number;
  at: number;
  availableRate: number;
}

export interface SectionBreakdown {
  section: string;
  pre: number;
  at: number;
  delta: number;
}

export interface WindowSummary {
  windowType: string;
  tickCount: number;
  latestTick: DispatchMonitorTick | null;
  dayShift: DayShiftStats | null;
  totalAtDelta: number;
  topChangingSections: SectionBreakdown[];
}

export interface DispatchIntelData {
  signal: SignalLevel;
  signalReason: string;
  dayOfWeek: number;
  dayName: string;
  dateStr: string;
  isWeekend: boolean;
  isStale: boolean;
  activeWindow: WindowSummary | null;
  windows: WindowSummary[];
  latestDayShift: DayShiftStats | null;
  sectionBreakdowns: SectionBreakdown[];
  hasData: boolean;
  recentWindows: WindowSummary[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Untyped Supabase client for tables not in the Database type definition.
// dispatch_monitor_ticks and work_info_snapshots are system tables managed by
// the scraper pipeline and are not included in the mobile app's generated types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function parseDayShift(totals: TickTotal[]): DayShiftStats | null {
  const day = totals.find(t => t.shift === '08:00');
  if (!day) return null;
  const pre = parseInt(day.pre, 10) || 0;
  const at = parseInt(day.at, 10) || 0;
  return {
    pre,
    at,
    availableRate: pre > 0 ? at / pre : 0,
  };
}

function buildSectionBreakdowns(tick: DispatchMonitorTick): SectionBreakdown[] {
  if (!tick.sections) return [];
  return tick.sections.map(section => {
    const dayTotal = section.totals?.find(t => t.shift === '08:00');
    const pre = dayTotal ? parseInt(dayTotal.pre, 10) || 0 : 0;
    const at = dayTotal ? parseInt(dayTotal.at, 10) || 0 : 0;
    const deltaEntry = tick.delta?.sectionChanges?.find(
      sc => sc.section === section.section && sc.shift === '08:00'
    );
    return {
      section: section.section,
      pre,
      at,
      delta: deltaEntry?.atDelta ?? 0,
    };
  }).filter(s => s.pre > 0 || s.at > 0);
}

function buildWindowSummary(ticks: DispatchMonitorTick[], windowType: string): WindowSummary {
  const windowTicks = ticks
    .filter(t => t.window_type === windowType)
    .sort((a, b) => b.tick_num - a.tick_num);

  const latestTick = windowTicks[0] ?? null;
  const dayShift = latestTick ? parseDayShift(latestTick.totals) : null;

  let totalAtDelta = 0;
  for (const t of windowTicks) {
    if (t.delta) {
      totalAtDelta += t.delta.totalAtDelta;
    }
  }

  const topChangingSections = latestTick
    ? buildSectionBreakdowns(latestTick).sort((a, b) => b.delta - a.delta)
    : [];

  return {
    windowType,
    tickCount: windowTicks.length,
    latestTick,
    dayShift,
    totalAtDelta,
    topChangingSections,
  };
}

function computeSignal(
  dayOfWeek: number,
  dayShift: DayShiftStats | null,
  windows: WindowSummary[],
): { signal: SignalLevel; reason: string } {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (!dayShift) {
    return { signal: 'Moderate', reason: 'No day shift data available yet' };
  }

  if (isWeekend) {
    if (dayShift.pre < 100) {
      return { signal: 'Low', reason: 'Weekend with few jobs posted' };
    }
    return { signal: 'Low', reason: 'Weekend -- members take most jobs' };
  }

  const activeWindow = windows.find(w => w.totalAtDelta > 0);
  const fastFill = activeWindow && dayShift.pre > 0 && dayShift.availableRate > 0.8;

  if (dayShift.pre > 250) {
    if (fastFill) {
      return { signal: 'Good', reason: 'High demand, dispatch filling fast' };
    }
    return { signal: 'Good', reason: 'High job count -- strong demand' };
  }

  if (dayShift.pre < 150) {
    return { signal: 'Low', reason: 'Low job count -- fewer opportunities' };
  }

  if (fastFill) {
    return { signal: 'Moderate', reason: 'Moderate demand, dispatch active' };
  }

  return { signal: 'Moderate', reason: 'Average job volume' };
}

function getNextDispatchWindow(): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  if (currentMinutes < 400) return '6:40 AM';
  if (currentMinutes < 900) return '3:00 PM';
  return '6:40 AM tomorrow';
}

function getActiveWindowLabel(windows: WindowSummary[]): string | null {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  if (currentMinutes >= 390 && currentMinutes <= 540) {
    const morningWindow = windows.find(w => w.windowType === 'morning' && w.tickCount > 0);
    if (morningWindow && morningWindow.totalAtDelta > 0) {
      return 'Morning dispatch in progress';
    }
  }

  if (currentMinutes >= 900 && currentMinutes <= 1080) {
    const afternoonWindow = windows.find(w => w.windowType === 'afternoon' && w.tickCount > 0);
    if (afternoonWindow && afternoonWindow.totalAtDelta > 0) {
      return 'Afternoon dispatch in progress';
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Fallback: build signal from work_info_snapshots when no tick data exists
// ---------------------------------------------------------------------------

async function buildFromWorkInfoFallback(todayStr: string): Promise<DispatchIntelData> {
  const dayOfWeek = new Date().getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  try {
    const { data: snapshot } = await db
      .from('work_info_snapshots')
      .select('*')
      .eq('location', 'vancouver')
      .limit(1)
      .single();

    if (!snapshot) {
      return makeEmptyResult(todayStr, dayOfWeek, isWeekend);
    }

    const row = snapshot as Record<string, unknown>;
    const totals = (row.totals ?? []) as TickTotal[];
    const dayShift = parseDayShift(totals);

    const sections = (row.sections ?? []) as TickSection[];
    const sectionBreakdowns: SectionBreakdown[] = sections
      .map(section => {
        const dayTotal = section.totals?.find((t: TickTotal) => t.shift === '08:00');
        const pre = dayTotal ? parseInt(dayTotal.pre, 10) || 0 : 0;
        const at = dayTotal ? parseInt(dayTotal.at, 10) || 0 : 0;
        return { section: section.section, pre, at, delta: 0 };
      })
      .filter(s => s.pre > 0 || s.at > 0);

    const { signal, reason } = computeSignal(dayOfWeek, dayShift, []);
    const signalReason = reason + ' (from latest snapshot)';

    return {
      signal,
      signalReason,
      dayOfWeek,
      dayName: DAY_NAMES[dayOfWeek] ?? 'Unknown',
      dateStr: todayStr,
      isWeekend,
      isStale: true,
      activeWindow: null,
      windows: [],
      latestDayShift: dayShift,
      sectionBreakdowns,
      hasData: true,
      recentWindows: [],
    };
  } catch (err) {
    console.warn('[useDispatchIntel] work_info fallback error:', err);
    return makeEmptyResult(todayStr, dayOfWeek, isWeekend);
  }
}

function makeEmptyResult(
  dateStr: string,
  dayOfWeek: number,
  isWeekend: boolean,
): DispatchIntelData {
  return {
    signal: 'Moderate',
    signalReason: 'No dispatch data available yet',
    dayOfWeek,
    dayName: DAY_NAMES[dayOfWeek] ?? 'Unknown',
    dateStr,
    isWeekend,
    isStale: true,
    activeWindow: null,
    windows: [],
    latestDayShift: null,
    sectionBreakdowns: [],
    hasData: false,
    recentWindows: [],
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDispatchIntel() {
  const todayStr = getLocalDateStr(new Date());

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dispatch-intel', todayStr],
    queryFn: async (): Promise<DispatchIntelData> => {
      // Fetch today's ticks and recent history in parallel to avoid waterfall
      const [todayResult, recentHistoryResult] = await Promise.all([
        db.from('dispatch_monitor_ticks').select('*')
          .eq('date', todayStr).eq('location', 'vancouver')
          .order('tick_num', { ascending: true }),
        db.from('dispatch_monitor_ticks').select('*')
          .eq('location', 'vancouver').neq('date', todayStr)
          .order('date', { ascending: false })
          .order('tick_num', { ascending: false })
          .limit(200),
      ]);

      if (todayResult.error) {
        console.warn('[useDispatchIntel] today fetch error:', todayResult.error.message);
      }

      let ticks = (todayResult.data ?? []) as DispatchMonitorTick[];

      // If no data today, extract most recent date from history
      if (ticks.length === 0) {
        const allRecent = (recentHistoryResult.data ?? []) as DispatchMonitorTick[];
        if (allRecent.length > 0) {
          const mostRecentDate = allRecent[0].date;
          ticks = allRecent.filter(t => t.date === mostRecentDate);
        }
      }

      // No tick data -- fall back to work_info_snapshots
      if (ticks.length === 0) {
        return buildFromWorkInfoFallback(todayStr);
      }

      // Group ticks by date for the current/latest date
      const latestDate = ticks[0].date;
      const latestTicks = ticks.filter(t => t.date === latestDate);
      const rawDayOfWeek = latestTicks[0]?.day_of_week ?? new Date().getDay();
      const dayOfWeek = rawDayOfWeek >= 0 && rawDayOfWeek <= 6 ? rawDayOfWeek : new Date().getDay();

      // Build window summaries
      const windowTypes = [...new Set(latestTicks.map(t => t.window_type))];
      const windows = windowTypes.map(wt => buildWindowSummary(latestTicks, wt));

      // Find the active or most relevant window
      const activeWindowLabel = getActiveWindowLabel(windows);
      const morningWindow = windows.find(w => w.windowType === 'morning');
      const afternoonWindow = windows.find(w => w.windowType === 'afternoon');
      const activeWindow = activeWindowLabel
        ? windows.find(w => w.totalAtDelta > 0) ?? morningWindow ?? null
        : morningWindow ?? afternoonWindow ?? windows[0] ?? null;

      // Get day shift stats from the most relevant window
      const latestDayShift = activeWindow?.dayShift ?? morningWindow?.dayShift ?? null;

      // Build section breakdowns from latest tick
      const latestTick = latestTicks[latestTicks.length - 1];
      const sectionBreakdowns = latestTick ? buildSectionBreakdowns(latestTick) : [];

      // Compute signal
      const { signal, reason } = computeSignal(dayOfWeek, latestDayShift, windows);

      // Use the already-fetched recent history (from parallel query above)
      const isStale = latestDate !== todayStr;
      const recentTicks = ((recentHistoryResult.data ?? []) as DispatchMonitorTick[])
        .filter(t => t.date !== latestDate);
      const recentDates = [...new Set(recentTicks.map(t => t.date))].slice(0, 5);
      const recentWindows: WindowSummary[] = recentDates.map(date => {
        const dateTicks = recentTicks.filter(t => t.date === date);
        const morningDateTicks = dateTicks.filter(t => t.window_type === 'morning');
        return buildWindowSummary(
          morningDateTicks.length > 0 ? morningDateTicks : dateTicks,
          morningDateTicks.length > 0 ? 'morning' : dateTicks[0]?.window_type ?? 'unknown',
        );
      });

      return {
        signal,
        signalReason: reason,
        dayOfWeek,
        dayName: DAY_NAMES[dayOfWeek] ?? 'Unknown',
        dateStr: latestDate,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isStale,
        activeWindow: activeWindowLabel && activeWindow
          ? { ...activeWindow, windowType: activeWindowLabel }
          : null,
        windows,
        latestDayShift,
        sectionBreakdowns,
        hasData: true,
        recentWindows,
      };
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const nextWindow = getNextDispatchWindow();

  return {
    data: data ?? null,
    loading: isLoading,
    error: isError,
    nextWindow,
  };
}
