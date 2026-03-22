/**
 * Bubble → Supabase Sync Script
 *
 * Pulls data from Bubble Data API and upserts into Supabase.
 *
 * Data types synced:
 *   - users (Bubble) → bubble_users (Supabase)
 *   - shifts (Bubble) → bubble_shifts (Supabase)
 *   - PayDiff (Bubble) → bubble_paydiffs (Supabase)
 *
 * Usage:
 *   node bubble-sync.js              # Sync everything
 *   node bubble-sync.js users        # Sync only users
 *   node bubble-sync.js shifts       # Sync only shifts
 *   node bubble-sync.js paydiffs     # Sync only pay diffs
 *   node bubble-sync.js shifts 100   # Sync 100 shifts (for testing)
 */

const { Client } = require('pg');

// ── Configuration ────────────────────────────────────────────────────────────

const BUBBLE_API = process.env.BUBBLE_API_URL || 'https://portpal.app/api/1.1/obj';
const BUBBLE_KEY = process.env.BUBBLE_API_KEY || 'f5a34eaa19896b29d0635d9dbe4f0630';
const DB_URL = 'postgresql://postgres.qcnozghkxbnlofahaqig:Vdsrjspq92$123@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

const BATCH_SIZE = 100; // Bubble API max per request
const CURSOR_LIMIT = 9900; // Bubble's cursor caps around 10K; reset before hitting it

// ── Bubble API Helper ────────────────────────────────────────────────────────

async function fetchBubble(type, cursor = 0, limit = BATCH_SIZE, constraints = []) {
  let url = `${BUBBLE_API}/${type}?cursor=${cursor}&limit=${limit}&sort_field=Created Date&descending=no`;
  if (constraints.length > 0) {
    url += `&constraints=${encodeURIComponent(JSON.stringify(constraints))}`;
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${BUBBLE_KEY}` },
  });

  if (!res.ok) {
    throw new Error(`Bubble API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.response;
}

/**
 * Fetch all records for a type. For large datasets (>9900), uses date-range
 * windowing to work around Bubble's cursor limit.
 * @param {string} type - Bubble data type
 * @param {number} maxRecords - Max records to fetch
 * @param {Array} baseConstraints - Additional constraints (e.g. Modified Date filter)
 */
async function fetchAll(type, maxRecords = Infinity, baseConstraints = []) {
  const all = [];
  let cursor = 0;
  let remaining = 1;
  let constraints = [...baseConstraints];
  let lastDate = null;

  while (remaining > 0 && all.length < maxRecords) {
    const limit = Math.min(BATCH_SIZE, maxRecords - all.length);
    const response = await fetchBubble(type, cursor, limit, constraints);

    if (response.results.length === 0) break;

    all.push(...response.results);
    remaining = response.remaining;
    cursor += response.results.length;

    // Track the last Created Date for windowing
    const lastRecord = response.results[response.results.length - 1];
    lastDate = lastRecord['Created Date'];

    process.stdout.write(`\r  Fetched ${all.length} ${type} (${remaining} remaining)...`);

    // If cursor is approaching the limit and there are more records,
    // reset cursor and use a date constraint to continue from where we left off
    if (cursor >= CURSOR_LIMIT && remaining > 0) {
      console.log(`\n  ↳ Cursor limit reached at ${cursor}, windowing from ${lastDate}...`);
      constraints = [
        ...baseConstraints,
        { key: 'Created Date', constraint_type: 'greater than', value: lastDate }
      ];
      cursor = 0;
    }
  }

  console.log(`\r  Fetched ${all.length} ${type} total.                                        `);
  return all;
}

// ── Transform Functions ──────────────────────────────────────────────────────

function transformUser(bubbleUser) {
  return {
    bubble_id: bubbleUser._id,
    email: bubbleUser.authentication?.email?.email || null,
    name: [bubbleUser.FirstName, bubbleUser.LastName].filter(Boolean).join(' ') || null,
    first_name: bubbleUser.FirstName || null,
    last_name: bubbleUser.LastName || null,
    union_local: bubbleUser.LOCAL || '500',
    other_local: bubbleUser.otherlocal || null,
    board: bubbleUser.board || null,
    is_admin: bubbleUser.admin || false,
    user_signed_up: bubbleUser.user_signed_up || false,
    glasses_total: bubbleUser.glassestotal || 0,
    glasses_used: bubbleUser.glassesused || 0,
    personal_total: bubbleUser.personaltotal || 0,
    personal_used: bubbleUser.personalused || 0,
    sick_total: bubbleUser.sicktotal || 0,
    sick_used: bubbleUser.sickused || 0,
    xp_earned: bubbleUser.xpEarned || 0,
    created_at: bubbleUser['Created Date'],
    modified_at: bubbleUser['Modified Date'],
  };
}

function transformShift(bubbleShift) {
  const date = bubbleShift.DATE ? new Date(bubbleShift.DATE) : null;

  return {
    bubble_id: bubbleShift._id,
    bubble_user_id: bubbleShift.relUser || bubbleShift['Created By'],
    date: date ? date.toISOString().split('T')[0] : null,
    job: bubbleShift.JOB || null,
    job_other: bubbleShift['job-other'] || null,
    location: bubbleShift.LOCATION || null,
    location_other: bubbleShift.locationother || null,
    subjob: bubbleShift.SUBJOB || bubbleShift.subjob || null,
    shift: bubbleShift.DNG || 'DAY',
    reg_hours: bubbleShift['REG HR'] || 0,
    ot_hours: bubbleShift['OT HR'] || 0,
    reg_rate: bubbleShift['REG RT'] || 0,
    ot_rate: bubbleShift['OT RT'] || 0,
    total_pay: bubbleShift.totalpay || 0,
    travel_hours: bubbleShift.travelhours || 0,
    double_time: bubbleShift.double || false,
    notes: bubbleShift.notes || null,
    vessel: bubbleShift.vessel || null,
    foreman: bubbleShift.foreman || null,
    paid_check: bubbleShift['paid-check'] || false,
    stat_check: bubbleShift['stat-check'] || false,
    stat_desc: bubbleShift['stat - desc'] || null,
    holiday_desc: bubbleShift['holidaydesc-other'] || null,
    sickday_check: bubbleShift['sickday-check'] || false,
    personalday_check: bubbleShift['personalday-check'] || false,
    vacday_check: bubbleShift['vacday-check'] || false,
    stat_counting_days: bubbleShift.StatCountingDays || null,
    created_at: bubbleShift['Created Date'],
    modified_at: bubbleShift['Modified Date'],
  };
}

function transformPayDiff(bubblePayDiff) {
  return {
    bubble_id: bubblePayDiff._id,
    jobs: bubblePayDiff.JOBS || [],
    shift: bubblePayDiff.SHIFT || null,
    location: bubblePayDiff.LOCATION || [],
    reg_hours: bubblePayDiff.REGHRS || 0,
    ot_hours: bubblePayDiff.OTHRS || 0,
    created_at: bubblePayDiff['Created Date'],
    modified_at: bubblePayDiff['Modified Date'],
  };
}

// ── Sync Functions ───────────────────────────────────────────────────────────

async function syncUsers(client, maxRecords, since = null) {
  console.log('\n📥 Syncing users...');
  const constraints = since
    ? [{ key: 'Modified Date', constraint_type: 'greater than', value: since }]
    : [];
  const bubbleUsers = await fetchAll('user', maxRecords, constraints);

  // Create staging table for bubble users
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.bubble_users (
      bubble_id text PRIMARY KEY,
      email text,
      name text,
      first_name text,
      last_name text,
      union_local text DEFAULT '500',
      other_local text,
      board text,
      is_admin boolean DEFAULT false,
      user_signed_up boolean DEFAULT false,
      glasses_total numeric DEFAULT 0,
      glasses_used numeric DEFAULT 0,
      personal_total numeric DEFAULT 0,
      personal_used numeric DEFAULT 0,
      sick_total numeric DEFAULT 0,
      sick_used numeric DEFAULT 0,
      xp_earned numeric DEFAULT 0,
      created_at timestamptz,
      modified_at timestamptz,
      synced_at timestamptz DEFAULT now()
    );
  `);

  // Add new columns if table already exists (idempotent)
  const newUserCols = [
    ['other_local', 'text'],
    ['is_admin', 'boolean DEFAULT false'],
    ['user_signed_up', 'boolean DEFAULT false'],
    ['glasses_total', 'numeric DEFAULT 0'],
    ['glasses_used', 'numeric DEFAULT 0'],
    ['personal_total', 'numeric DEFAULT 0'],
    ['personal_used', 'numeric DEFAULT 0'],
    ['sick_total', 'numeric DEFAULT 0'],
    ['sick_used', 'numeric DEFAULT 0'],
    ['xp_earned', 'numeric DEFAULT 0'],
  ];
  for (const [col, type] of newUserCols) {
    await client.query(`ALTER TABLE public.bubble_users ADD COLUMN IF NOT EXISTS ${col} ${type}`).catch(() => {});
  }

  let synced = 0;
  for (const u of bubbleUsers) {
    const t = transformUser(u);
    try {
      await client.query(`
        INSERT INTO public.bubble_users (
          bubble_id, email, name, first_name, last_name, union_local, other_local, board,
          is_admin, user_signed_up, glasses_total, glasses_used, personal_total, personal_used,
          sick_total, sick_used, xp_earned, created_at, modified_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
        ON CONFLICT (bubble_id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          union_local = EXCLUDED.union_local,
          other_local = EXCLUDED.other_local,
          board = EXCLUDED.board,
          is_admin = EXCLUDED.is_admin,
          user_signed_up = EXCLUDED.user_signed_up,
          glasses_total = EXCLUDED.glasses_total,
          glasses_used = EXCLUDED.glasses_used,
          personal_total = EXCLUDED.personal_total,
          personal_used = EXCLUDED.personal_used,
          sick_total = EXCLUDED.sick_total,
          sick_used = EXCLUDED.sick_used,
          xp_earned = EXCLUDED.xp_earned,
          modified_at = EXCLUDED.modified_at,
          synced_at = now()
      `, [t.bubble_id, t.email, t.name, t.first_name, t.last_name, t.union_local, t.other_local, t.board,
          t.is_admin, t.user_signed_up, t.glasses_total, t.glasses_used, t.personal_total, t.personal_used,
          t.sick_total, t.sick_used, t.xp_earned, t.created_at, t.modified_at]);
      synced++;
    } catch (e) {
      console.error(`  Error syncing user ${t.bubble_id}: ${e.message}`);
    }
  }

  console.log(`  ✓ Synced ${synced}/${bubbleUsers.length} users`);
  return synced;
}

async function syncShifts(client, maxRecords, since = null) {
  console.log('\n📥 Syncing shifts...');
  const constraints = since
    ? [{ key: 'Modified Date', constraint_type: 'greater than', value: since }]
    : [];
  const bubbleShifts = await fetchAll('shifts', maxRecords, constraints);

  // Create staging table for bubble shifts (all fields)
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.bubble_shifts (
      bubble_id text PRIMARY KEY,
      bubble_user_id text,
      date date,
      job text,
      job_other text,
      location text,
      location_other text,
      subjob text,
      shift text DEFAULT 'DAY',
      reg_hours numeric DEFAULT 0,
      ot_hours numeric DEFAULT 0,
      reg_rate numeric DEFAULT 0,
      ot_rate numeric DEFAULT 0,
      total_pay numeric DEFAULT 0,
      travel_hours numeric DEFAULT 0,
      double_time boolean DEFAULT false,
      notes text,
      vessel text,
      foreman text,
      paid_check boolean DEFAULT false,
      stat_check boolean DEFAULT false,
      stat_desc text,
      holiday_desc text,
      sickday_check boolean DEFAULT false,
      personalday_check boolean DEFAULT false,
      vacday_check boolean DEFAULT false,
      stat_counting_days text,
      created_at timestamptz,
      modified_at timestamptz,
      synced_at timestamptz DEFAULT now()
    );
  `);

  // Add new columns if table already exists
  const newShiftCols = [
    ['modified_at', 'timestamptz'],
    ['job_other', 'text'],
    ['location_other', 'text'],
    ['double_time', 'boolean DEFAULT false'],
    ['stat_check', 'boolean DEFAULT false'],
    ['stat_desc', 'text'],
    ['holiday_desc', 'text'],
    ['sickday_check', 'boolean DEFAULT false'],
    ['personalday_check', 'boolean DEFAULT false'],
    ['vacday_check', 'boolean DEFAULT false'],
    ['stat_counting_days', 'text'],
  ];
  for (const [col, type] of newShiftCols) {
    await client.query(`ALTER TABLE public.bubble_shifts ADD COLUMN IF NOT EXISTS ${col} ${type}`).catch(() => {});
  }

  let synced = 0;
  let errors = 0;

  // Use transaction batches of 500 for much faster inserts
  const txBatchSize = 500;
  for (let i = 0; i < bubbleShifts.length; i += txBatchSize) {
    const batch = bubbleShifts.slice(i, i + txBatchSize);

    try {
      await client.query('BEGIN');

      for (const s of batch) {
        const t = transformShift(s);
        if (!t.date) { errors++; continue; }

        await client.query(`
          INSERT INTO public.bubble_shifts
            (bubble_id, bubble_user_id, date, job, job_other, location, location_other, subjob, shift,
             reg_hours, ot_hours, reg_rate, ot_rate, total_pay, travel_hours, double_time,
             notes, vessel, foreman, paid_check,
             stat_check, stat_desc, holiday_desc, sickday_check, personalday_check, vacday_check,
             stat_counting_days, created_at, modified_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)
          ON CONFLICT (bubble_id) DO UPDATE SET
            date = EXCLUDED.date,
            job = EXCLUDED.job,
            job_other = EXCLUDED.job_other,
            location = EXCLUDED.location,
            location_other = EXCLUDED.location_other,
            subjob = EXCLUDED.subjob,
            shift = EXCLUDED.shift,
            reg_hours = EXCLUDED.reg_hours,
            ot_hours = EXCLUDED.ot_hours,
            reg_rate = EXCLUDED.reg_rate,
            ot_rate = EXCLUDED.ot_rate,
            total_pay = EXCLUDED.total_pay,
            travel_hours = EXCLUDED.travel_hours,
            double_time = EXCLUDED.double_time,
            paid_check = EXCLUDED.paid_check,
            stat_check = EXCLUDED.stat_check,
            stat_desc = EXCLUDED.stat_desc,
            holiday_desc = EXCLUDED.holiday_desc,
            sickday_check = EXCLUDED.sickday_check,
            personalday_check = EXCLUDED.personalday_check,
            vacday_check = EXCLUDED.vacday_check,
            stat_counting_days = EXCLUDED.stat_counting_days,
            modified_at = EXCLUDED.modified_at,
            synced_at = now()
        `, [t.bubble_id, t.bubble_user_id, t.date, t.job, t.job_other, t.location, t.location_other, t.subjob, t.shift,
            t.reg_hours, t.ot_hours, t.reg_rate, t.ot_rate, t.total_pay, t.travel_hours, t.double_time,
            t.notes, t.vessel, t.foreman, t.paid_check,
            t.stat_check, t.stat_desc, t.holiday_desc, t.sickday_check, t.personalday_check, t.vacday_check,
            t.stat_counting_days, t.created_at, t.modified_at]);
        synced++;
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      errors += batch.length;
      console.error(`  Batch error at ${i}: ${e.message}`);
    }

    process.stdout.write(`\r  Inserted ${synced} shifts (${errors} errors)...`);
  }

  console.log(`\r  ✓ Synced ${synced}/${bubbleShifts.length} shifts (${errors} errors)         `);
  return synced;
}

async function syncPayDiffs(client, maxRecords, since = null) {
  console.log('\n📥 Syncing PayDiffs...');
  const constraints = since
    ? [{ key: 'Modified Date', constraint_type: 'greater than', value: since }]
    : [];
  const bubblePayDiffs = await fetchAll('PayDiff', maxRecords, constraints);

  // Create staging table
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.bubble_paydiffs (
      bubble_id text PRIMARY KEY,
      jobs text[],
      shift text,
      location text[],
      reg_hours numeric DEFAULT 0,
      ot_hours numeric DEFAULT 0,
      created_at timestamptz,
      modified_at timestamptz,
      synced_at timestamptz DEFAULT now()
    );
  `);

  // Add timestamp columns if table already exists
  await client.query(`ALTER TABLE public.bubble_paydiffs ADD COLUMN IF NOT EXISTS created_at timestamptz`).catch(() => {});
  await client.query(`ALTER TABLE public.bubble_paydiffs ADD COLUMN IF NOT EXISTS modified_at timestamptz`).catch(() => {});

  let synced = 0;
  for (const pd of bubblePayDiffs) {
    const t = transformPayDiff(pd);
    try {
      await client.query(`
        INSERT INTO public.bubble_paydiffs (bubble_id, jobs, shift, location, reg_hours, ot_hours, created_at, modified_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (bubble_id) DO UPDATE SET
          jobs = EXCLUDED.jobs,
          shift = EXCLUDED.shift,
          location = EXCLUDED.location,
          reg_hours = EXCLUDED.reg_hours,
          ot_hours = EXCLUDED.ot_hours,
          modified_at = EXCLUDED.modified_at,
          synced_at = now()
      `, [t.bubble_id, t.jobs, t.shift, t.location, t.reg_hours, t.ot_hours, t.created_at, t.modified_at]);
      synced++;
    } catch (e) {
      console.error(`  Error syncing paydiff ${t.bubble_id}: ${e.message}`);
    }
  }

  console.log(`  ✓ Synced ${synced}/${bubblePayDiffs.length} PayDiffs`);
  return synced;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const mode = process.argv[2] || 'all';
  const maxRecords = process.argv[3] ? parseInt(process.argv[3]) : Infinity;

  // Parse --since=DATE or --incremental (reads last sync time from state file)
  const sinceArg = process.argv.find(a => a.startsWith('--since='));
  const isIncremental = process.argv.includes('--incremental');
  const stateFile = `${process.env.HOME}/.portpal-sync/last-sync.txt`;
  let since = null;

  if (sinceArg) {
    since = sinceArg.split('=')[1];
  } else if (isIncremental) {
    const fs = require('fs');
    const path = require('path');
    try {
      since = fs.readFileSync(stateFile, 'utf8').trim();
    } catch {
      // First incremental run — sync last 6 hours
      since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    }
  }

  console.log('🔄 PORTPAL Bubble → Supabase Sync');
  console.log(`   Mode: ${mode}${maxRecords < Infinity ? ` (limit: ${maxRecords})` : ''}${since ? ` (since: ${since})` : ''}`);

  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('   Connected to Supabase PostgreSQL.');

  const results = {};

  try {
    if (mode === 'all' || mode === 'users') {
      results.users = await syncUsers(client, maxRecords, since);
    }
    if (mode === 'all' || mode === 'shifts') {
      results.shifts = await syncShifts(client, maxRecords, since);
    }
    if (mode === 'all' || mode === 'paydiffs') {
      results.paydiffs = await syncPayDiffs(client, maxRecords, since);
    }

    // Print summary
    console.log('\n── Summary ──────────────────────────');
    for (const [key, count] of Object.entries(results)) {
      console.log(`  ${key}: ${count} records synced`);
    }

    // Show table counts
    console.log('\n── Table Counts ─────────────────────');
    for (const table of ['bubble_users', 'bubble_shifts', 'bubble_paydiffs']) {
      try {
        const res = await client.query(`SELECT count(*) FROM public.${table}`);
        console.log(`  ${table}: ${res.rows[0].count} rows`);
      } catch (e) {
        console.log(`  ${table}: not created yet`);
      }
    }
  } catch (e) {
    console.error('\n❌ Fatal error:', e.message);
  }

  // Save sync timestamp for incremental mode
  if (isIncremental || sinceArg) {
    const fs = require('fs');
    const dir = require('path').dirname(stateFile);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(stateFile, new Date().toISOString());
    console.log(`   Saved sync timestamp to ${stateFile}`);
  }

  await client.end();
  console.log('\n✅ Done!');
}

run().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
