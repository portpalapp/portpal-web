import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getAuthContext } from '../shared/auth-helper';
import { DATA_DIR, BCMEA_BASE_URL, ACCOUNT_WORKINFO, SUPABASE_URL, SUPABASE_SERVICE_KEY, FORCE_RUN } from '../shared/config';
import { makeLogger, localDateStr, localStamp } from '../shared/utils';

// High-Frequency Dispatch Monitor for PORTPAL
// Polls work-info every 10 seconds during dispatch windows to observe
// job counts dropping as union members and casuals are dispatched.
//
// Morning window:  6:40 AM – 8:05 AM (day dispatch — 08:00 shift)
// Afternoon window: 2:55 PM – 4:35 PM (night/graveyard dispatch — 16:30 + 01:00 shifts)
//
// Uses Playwright with a persistent browser session. Navigates to work-info
// pages and intercepts the /api/work-info/{loc}/all API response on each tick.
// Saves each tick to local JSON + Supabase dispatch_monitor_ticks table.

const MONITOR_DIR = path.join(DATA_DIR, 'dispatch-monitor');
const log = makeLogger('dispatch-mon');

const LOCATIONS = ['vancouver', 'squamish', 'coastwise'] as const;
type Location = typeof LOCATIONS[number];

const POLL_INTERVAL_MS = 10_000; // 10 seconds

// Dispatch windows in local time (hours, minutes)
const WINDOWS = [
  { name: 'morning',   startH: 6,  startM: 40, endH: 8,  endM: 5  },
  { name: 'afternoon', startH: 14, startM: 55, endH: 16, endM: 50 },
] as const;

type WindowName = typeof WINDOWS[number]['name'];

interface ShiftTotal {
  shift: string;
  date: string;
  pre: string;
  at: string;
}

interface SectionData {
  section: string;
  totals: ShiftTotal[];
  jobs: any[];
}

interface LocationData {
  lastUpdate: string;
  totals: ShiftTotal[];
  workInformation: SectionData[];
}

interface TickDelta {
  location: string;
  totalChanges: Array<{
    shift: string;
    preDelta: number;
    atDelta: number;
    prevPre: number;
    prevAt: number;
    currPre: number;
    currAt: number;
  }>;
  sectionChanges: Array<{
    section: string;
    shift: string;
    preDelta: number;
    atDelta: number;
  }>;
  totalPreDelta: number;
  totalAtDelta: number;
}

// ── Helpers ──

function nowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getCurrentWindow(): { name: WindowName; endsAt: number } | null {
  const mins = nowMinutes();
  for (const w of WINDOWS) {
    const start = w.startH * 60 + w.startM;
    const end = w.endH * 60 + w.endM;
    if (mins >= start && mins <= end) {
      return { name: w.name, endsAt: end };
    }
  }
  return null;
}

function getNextWindowStart(): { name: string; startsInMs: number } | null {
  const mins = nowMinutes();
  for (const w of WINDOWS) {
    const start = w.startH * 60 + w.startM;
    if (mins < start) {
      return { name: w.name, startsInMs: (start - mins) * 60_000 };
    }
  }
  // All windows passed for today — next is tomorrow morning
  const tomorrowMorningStart = WINDOWS[0].startH * 60 + WINDOWS[0].startM;
  const minsUntilMidnight = 24 * 60 - mins;
  return {
    name: WINDOWS[0].name,
    startsInMs: (minsUntilMidnight + tomorrowMorningStart) * 60_000,
  };
}

function computeDelta(
  prev: Record<string, LocationData | null>,
  curr: Record<string, LocationData | null>
): TickDelta[] {
  const deltas: TickDelta[] = [];

  for (const loc of LOCATIONS) {
    const p = prev[loc];
    const c = curr[loc];
    if (!p || !c) continue;

    const totalChanges: TickDelta['totalChanges'] = [];
    let totalPreDelta = 0;
    let totalAtDelta = 0;

    for (let i = 0; i < Math.max(p.totals?.length || 0, c.totals?.length || 0); i++) {
      const pt = p.totals?.[i];
      const ct = c.totals?.[i];
      if (!pt || !ct) continue;

      const prevPre = parseInt(pt.pre) || 0;
      const prevAt = parseInt(pt.at) || 0;
      const currPre = parseInt(ct.pre) || 0;
      const currAt = parseInt(ct.at) || 0;
      const preDelta = currPre - prevPre;
      const atDelta = currAt - prevAt;

      if (preDelta !== 0 || atDelta !== 0) {
        totalChanges.push({
          shift: ct.shift,
          preDelta, atDelta,
          prevPre, prevAt,
          currPre, currAt,
        });
        totalPreDelta += preDelta;
        totalAtDelta += atDelta;
      }
    }

    const sectionChanges: TickDelta['sectionChanges'] = [];
    const pSections = p.workInformation || [];
    const cSections = c.workInformation || [];

    for (let i = 0; i < Math.max(pSections.length, cSections.length); i++) {
      const ps = pSections[i];
      const cs = cSections[i];
      if (!ps || !cs) continue;

      for (let j = 0; j < Math.max(ps.totals?.length || 0, cs.totals?.length || 0); j++) {
        const pst = ps.totals?.[j];
        const cst = cs.totals?.[j];
        if (!pst || !cst) continue;

        const preDelta = (parseInt(cst.pre) || 0) - (parseInt(pst.pre) || 0);
        const atDelta = (parseInt(cst.at) || 0) - (parseInt(pst.at) || 0);

        if (preDelta !== 0 || atDelta !== 0) {
          sectionChanges.push({
            section: cs.section,
            shift: cst.shift,
            preDelta,
            atDelta,
          });
        }
      }
    }

    deltas.push({
      location: loc,
      totalChanges,
      sectionChanges,
      totalPreDelta,
      totalAtDelta,
    });
  }

  return deltas;
}

// ── Browser-based API fetching ──

async function createSession(): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  log('Launching browser + authenticating...');
  const browser = await chromium.launch({ headless: true });
  const context = await getAuthContext(browser, ACCOUNT_WORKINFO, BCMEA_BASE_URL, log);
  const page = await context.newPage();
  log('Browser session ready');
  return { browser, context, page };
}

async function fetchWorkInfoViaPage(
  page: Page,
  location: string
): Promise<LocationData | null> {
  let data: LocationData | null = null;

  const handler = async (resp: any) => {
    if (resp.url().includes(`/api/work-info/${location}/all`)) {
      try {
        data = JSON.parse(await resp.text());
      } catch { /* ignore parse errors */ }
    }
  };

  page.on('response', handler);
  try {
    await page.goto(`${BCMEA_BASE_URL}/work-info/${location}`, {
      waitUntil: 'networkidle',
      timeout: 12000,
    });
    // Brief wait for any async API calls to complete
    await page.waitForTimeout(500);
  } catch (err: any) {
    // Timeout is OK if we already captured the API response
    if (!data) {
      log(`  ${location}: page error — ${err.message?.substring(0, 60)}`);
    }
  }
  page.off('response', handler);

  return data;
}

// ── Storage ──

function saveTick(
  dateStr: string,
  stamp: string,
  windowName: string,
  tickNum: number,
  data: Record<string, LocationData | null>,
  deltas: TickDelta[]
) {
  const dayDir = path.join(MONITOR_DIR, dateStr);
  fs.mkdirSync(dayDir, { recursive: true });

  const tick = {
    tickAt: new Date().toISOString(),
    stamp,
    date: dateStr,
    window: windowName,
    tickNum,
    dayOfWeek: new Date().getDay(), // 0=Sun, 6=Sat
    data,
    deltas,
  };

  const tickFile = path.join(dayDir, `tick_${stamp}_${String(tickNum).padStart(4, '0')}.json`);
  fs.writeFileSync(tickFile, JSON.stringify(tick, null, 2));

  // Update latest
  fs.writeFileSync(path.join(MONITOR_DIR, 'latest.json'), JSON.stringify(tick, null, 2));

  return tick;
}

async function pushToSupabase(
  supabase: SupabaseClient,
  tick: ReturnType<typeof saveTick>
) {
  for (const loc of LOCATIONS) {
    const locData = tick.data[loc];
    if (!locData) continue;

    const delta = tick.deltas.find(d => d.location === loc);

    const { error } = await supabase
      .from('dispatch_monitor_ticks')
      .insert({
        location: loc,
        window_type: tick.window,
        tick_at: tick.tickAt,
        tick_num: tick.tickNum,
        day_of_week: tick.dayOfWeek,
        date: tick.date,
        totals: locData.totals || [],
        sections: locData.workInformation || [],
        delta: delta || null,
      });

    if (error) {
      log(`  Supabase insert failed (${loc}): ${error.message}`);
    }
  }
}

// ── Main Loop ──

async function runDispatchWindow(
  windowName: WindowName,
  windowEndMins: number,
  session: { browser: Browser; context: BrowserContext; page: Page },
  supabase: SupabaseClient | null
): Promise<void> {
  log(`═══ DISPATCH WINDOW: ${windowName.toUpperCase()} ═══`);

  let tickNum = 0;
  let prevData: Record<string, LocationData | null> = {};

  while (nowMinutes() <= windowEndMins) {
    const tickStart = Date.now();
    tickNum++;
    const now = new Date();
    const dateStr = localDateStr(now);
    const stamp = localStamp(now);
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const fullStamp = `${stamp}${seconds}`;

    // Fetch all locations via page navigation
    const data: Record<string, LocationData | null> = {};
    let sessionDead = false;

    for (const loc of LOCATIONS) {
      try {
        data[loc] = await fetchWorkInfoViaPage(session.page, loc);
      } catch (err: any) {
        log(`  ${loc}: critical error — ${err.message?.substring(0, 80)}`);
        // Check if page/browser is still alive
        try {
          await session.page.evaluate(() => true);
        } catch {
          sessionDead = true;
          log('  Browser session died, will restart');
          break;
        }
        data[loc] = null;
      }
    }

    if (sessionDead) {
      // Attempt to restart the session
      try {
        await session.browser.close().catch(() => {});
      } catch { /* ignore */ }
      try {
        const newSession = await createSession();
        session.browser = newSession.browser;
        session.context = newSession.context;
        session.page = newSession.page;
        log('  Session restarted, continuing');
        continue; // Retry this tick
      } catch (err: any) {
        log(`  Session restart failed: ${err.message?.substring(0, 80)}`);
        break;
      }
    }

    // Compute deltas from previous tick
    const deltas = tickNum > 1 ? computeDelta(prevData, data) : [];

    // Log summary
    const vanData = data.vancouver;
    if (vanData?.totals) {
      const shifts = vanData.totals.map(t => `${t.shift}:pre=${t.pre},at=${t.at}`).join(' | ');
      log(`  tick #${tickNum} — VAN ${shifts}`);
    } else {
      log(`  tick #${tickNum} — VAN: no data`);
    }

    // Log significant changes
    for (const d of deltas) {
      if (d.totalPreDelta !== 0 || d.totalAtDelta !== 0) {
        log(`  Δ ${d.location}: pre=${d.totalPreDelta > 0 ? '+' : ''}${d.totalPreDelta} at=${d.totalAtDelta > 0 ? '+' : ''}${d.totalAtDelta}`);
        for (const sc of d.sectionChanges) {
          if (sc.atDelta !== 0) {
            log(`    ${sc.section} [${sc.shift}]: at ${sc.atDelta > 0 ? '+' : ''}${sc.atDelta}`);
          }
        }
      }
    }

    // Save locally
    const tick = saveTick(dateStr, fullStamp, windowName, tickNum, data, deltas);

    // Push to Supabase
    if (supabase) {
      await pushToSupabase(supabase, tick);
    }

    prevData = data;

    // Wait for next tick, accounting for time spent fetching
    const elapsed = Date.now() - tickStart;
    const waitMs = Math.max(1000, POLL_INTERVAL_MS - elapsed);
    if (nowMinutes() <= windowEndMins) {
      await new Promise(r => setTimeout(r, waitMs));
    }
  }

  log(`═══ WINDOW ${windowName.toUpperCase()} COMPLETE — ${tickNum} ticks ═══`);
}

async function main() {
  fs.mkdirSync(MONITOR_DIR, { recursive: true });
  log('Dispatch Monitor starting');
  log(`  Locations: ${LOCATIONS.join(', ')}`);
  log(`  Poll interval: ${POLL_INTERVAL_MS / 1000}s`);
  log(`  Windows: ${WINDOWS.map(w => `${w.name} (${w.startH}:${String(w.startM).padStart(2, '0')}-${w.endH}:${String(w.endM).padStart(2, '0')})`).join(', ')}`);
  log(`  Force run: ${FORCE_RUN}`);

  // Init Supabase
  let supabase: SupabaseClient | null = null;
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
    log('  Supabase: connected');
  } else {
    log('  Supabase: NOT configured (local-only mode)');
  }

  // Create browser session
  let session = await createSession();

  // Force-run mode: run one window cycle immediately (for testing)
  if (FORCE_RUN) {
    log('FORCE_RUN: running immediate test window (90 seconds)');
    const testEndMins = nowMinutes() + 2; // ~2 minute test (3 locations × ~5s each = 15s per tick, so ~6 ticks)
    await runDispatchWindow('morning', testEndMins, session, supabase);
    await session.browser.close();
    log('FORCE_RUN test complete');
    return;
  }

  // Main loop: sleep between windows, run during windows
  while (true) {
    const currentWindow = getCurrentWindow();

    if (currentWindow) {
      // We're inside a dispatch window — run it
      await runDispatchWindow(
        currentWindow.name,
        currentWindow.endsAt,
        session,
        supabase
      );
    }

    // Close browser between windows to save resources
    await session.browser.close().catch(() => {});
    log('Browser closed (between windows)');

    // Find next window
    const next = getNextWindowStart();
    if (!next) {
      log('No more windows today, sleeping 1 hour');
      await new Promise(r => setTimeout(r, 60 * 60_000));
      session = await createSession();
      continue;
    }

    // Sleep until 2 minutes before window opens, then re-auth
    const sleepMs = Math.max(0, next.startsInMs - 2 * 60_000);
    const sleepMins = Math.round(sleepMs / 60_000);

    if (sleepMs > 60_000) {
      log(`Next window: ${next.name} in ${sleepMins + 2} min — sleeping ${sleepMins} min...`);
      await new Promise(r => setTimeout(r, sleepMs));
    }

    // Re-create session before window
    log('Pre-window session setup...');
    try {
      session = await createSession();
    } catch (err: any) {
      log(`Pre-window session failed: ${err.message?.substring(0, 80)} — retrying in 30s`);
      await new Promise(r => setTimeout(r, 30_000));
      try {
        session = await createSession();
      } catch (err2: any) {
        log(`FATAL: Cannot create session: ${err2.message?.substring(0, 80)}`);
        process.exit(1);
      }
    }

    // Wait remaining time until window actually starts
    const remaining = Math.max(0, next.startsInMs - sleepMs);
    if (remaining > 0) {
      log(`Waiting ${Math.round(remaining / 1000)}s for window to open...`);
      await new Promise(r => setTimeout(r, remaining));
    }
  }
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  console.error(err);
  process.exit(1);
});
