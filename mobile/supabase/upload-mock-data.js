const { Client } = require('pg');

const CONNECTION_STRING =
  'postgresql://postgres.qcnozghkxbnlofahaqig:Vdsrjspq92$123@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

// --- Pay rate helpers based on CLAUDE.md BCMEA Year 3 (Apr 2025) rates ---
// Base longshoreman rates (no differential)
const BASE_RATES = {
  'MON-FRI': { DAY: 53.17, NIGHT: 66.98, GRAVEYARD: 82.73 },
  SATURDAY:  { DAY: 68.06, NIGHT: 85.07, GRAVEYARD: 85.07 },
  SUNDAY:    { DAY: 85.07, NIGHT: 85.07, GRAVEYARD: 85.07 },
};

const DIFFERENTIALS = {
  'TRACTOR TRAILER': 0.65,
  'LOCI':            0.65,
  'HEAD CHECKER':    0.00,
  'LABOUR':          0.00,
  'LIFT TRUCK':      0.50,
  '40 TON (TOP PICK)': 0.65,
  'RUBBER TIRE GANTRY': 1.00,
};

function dayType(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const dow = d.getDay(); // 0=Sun
  if (dow === 0) return 'SUNDAY';
  if (dow === 6) return 'SATURDAY';
  return 'MON-FRI';
}

function regRate(job, shift, dateStr) {
  const dt = dayType(dateStr);
  const base = BASE_RATES[dt][shift];
  return +(base + DIFFERENTIALS[job]).toFixed(2);
}

function otRate(job, shift, dateStr) {
  // OT is time-and-a-half
  return +(regRate(job, shift, dateStr) * 1.5).toFixed(2);
}

function stdHours(location, shift) {
  if (location === 'CENTENNIAL') {
    return shift === 'GRAVEYARD' ? 7.5 : 9;
  }
  return shift === 'GRAVEYARD' ? 6.5 : 8;
}

// --- Mock shift definitions ---
const shifts = [
  // Week of Feb 2-6 (Mon-Fri)
  { date: '2026-02-02', job: 'TRACTOR TRAILER', location: 'CENTENNIAL', subjob: 'RAIL (TT)', shift: 'DAY', otExtra: 0 },
  { date: '2026-02-03', job: 'LABOUR', location: 'VANTERM', subjob: null, shift: 'DAY', otExtra: 0 },
  { date: '2026-02-04', job: 'LOCI', location: 'DELTAPORT', subjob: null, shift: 'NIGHT', otExtra: 1 },
  { date: '2026-02-06', job: 'HEAD CHECKER', location: 'CENTENNIAL', subjob: null, shift: 'DAY', otExtra: 0 },

  // Week of Feb 9-13
  { date: '2026-02-09', job: 'LIFT TRUCK', location: 'FRASER SURREY', subjob: null, shift: 'DAY', otExtra: 0 },
  { date: '2026-02-10', job: 'TRACTOR TRAILER', location: 'DELTAPORT', subjob: 'SHIP (TT)', shift: 'DAY', otExtra: 0.5 },
  { date: '2026-02-11', job: '40 TON (TOP PICK)', location: 'CENTENNIAL', subjob: null, shift: 'NIGHT', otExtra: 0 },
  { date: '2026-02-13', job: 'RUBBER TIRE GANTRY', location: 'VANTERM', subjob: null, shift: 'DAY', otExtra: 0 },

  // Feb 14 (Saturday)
  { date: '2026-02-14', job: 'TRACTOR TRAILER', location: 'CENTENNIAL', subjob: 'RAIL (TT)', shift: 'DAY', otExtra: 2 },

  // Week of Feb 16-20
  { date: '2026-02-16', job: 'LABOUR', location: 'CENTENNIAL', subjob: null, shift: 'DAY', otExtra: 0 },
  { date: '2026-02-17', job: 'LOCI', location: 'VANTERM', subjob: null, shift: 'GRAVEYARD', otExtra: 0 },
  { date: '2026-02-18', job: 'HEAD CHECKER', location: 'DELTAPORT', subjob: null, shift: 'NIGHT', otExtra: 0 },
  { date: '2026-02-20', job: 'TRACTOR TRAILER', location: 'CENTENNIAL', subjob: 'SHIP (TT)', shift: 'GRAVEYARD', otExtra: 0 },

  // Week of Feb 23-27
  { date: '2026-02-23', job: 'LIFT TRUCK', location: 'CENTENNIAL', subjob: null, shift: 'NIGHT', otExtra: 1.5 },
  { date: '2026-02-24', job: '40 TON (TOP PICK)', location: 'DELTAPORT', subjob: null, shift: 'DAY', otExtra: 0 },
  { date: '2026-02-25', job: 'RUBBER TIRE GANTRY', location: 'FRASER SURREY', subjob: null, shift: 'DAY', otExtra: 0 },
  { date: '2026-02-27', job: 'LABOUR', location: 'VANTERM', subjob: null, shift: 'GRAVEYARD', otExtra: 0 },

  // Sunday Feb 15
  { date: '2026-02-15', job: 'TRACTOR TRAILER', location: 'VANTERM', subjob: null, shift: 'DAY', otExtra: 0 },

  // Week of Mar 2-6
  { date: '2026-03-02', job: 'TRACTOR TRAILER', location: 'CENTENNIAL', subjob: 'RAIL (TT)', shift: 'DAY', otExtra: 0 },
  { date: '2026-03-03', job: 'LOCI', location: 'CENTENNIAL', subjob: null, shift: 'NIGHT', otExtra: 0 },
  { date: '2026-03-04', job: 'HEAD CHECKER', location: 'VANTERM', subjob: null, shift: 'DAY', otExtra: 0 },
  { date: '2026-03-05', job: 'LIFT TRUCK', location: 'DELTAPORT', subjob: null, shift: 'DAY', otExtra: 0 },
  { date: '2026-03-06', job: '40 TON (TOP PICK)', location: 'CENTENNIAL', subjob: null, shift: 'GRAVEYARD', otExtra: 0 },

  // Saturday Mar 7
  { date: '2026-03-07', job: 'RUBBER TIRE GANTRY', location: 'VANTERM', subjob: null, shift: 'DAY', otExtra: 1 },

  // Today - Mar 8 (Sunday)
  { date: '2026-03-08', job: 'TRACTOR TRAILER', location: 'CENTENNIAL', subjob: 'SHIP (TT)', shift: 'DAY', otExtra: 0 },
];

// Notes for some shifts to add realism
const NOTES_MAP = {
  '2026-02-04': 'Stayed extra hour for vessel finish',
  '2026-02-14': 'Saturday call-in, double OT at end',
  '2026-02-23': 'Busy night, worked through break',
  '2026-03-07': 'Weekend dispatch, extra hour',
};

async function main() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');

    // 1. Find user UUID
    const userRes = await client.query(
      `SELECT id FROM auth.users WHERE email = $1`,
      ['veeteshrup@gmail.com']
    );

    if (userRes.rows.length === 0) {
      console.error('User veeteshrup@gmail.com not found in auth.users');
      process.exit(1);
    }

    const userId = userRes.rows[0].id;
    console.log(`Found user: ${userId}`);

    // 2. Delete existing shifts
    const delRes = await client.query(
      `DELETE FROM shifts WHERE user_id = $1`,
      [userId]
    );
    console.log(`Deleted ${delRes.rowCount} existing shifts`);

    // 3. Insert mock shifts
    let inserted = 0;
    for (const s of shifts) {
      const rh = stdHours(s.location, s.shift);
      const oh = s.otExtra;
      const rr = regRate(s.job, s.shift, s.date);
      const or_ = otRate(s.job, s.shift, s.date);
      const tp = +(rh * rr + oh * or_).toFixed(2);
      const notes = NOTES_MAP[s.date] || null;

      await client.query(
        `INSERT INTO shifts (user_id, date, job, location, subjob, shift, reg_hours, ot_hours, reg_rate, ot_rate, total_pay, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [userId, s.date, s.job, s.location, s.subjob, s.shift, rh, oh, rr, or_, tp, notes]
      );
      inserted++;
      console.log(
        `  [${inserted}] ${s.date} | ${s.job.padEnd(22)} | ${s.location.padEnd(14)} | ${s.shift.padEnd(9)} | ${rh}h + ${oh}OT | $${rr}/hr | $${tp}`
      );
    }

    console.log(`\nInserted ${inserted} mock shifts for user ${userId}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
