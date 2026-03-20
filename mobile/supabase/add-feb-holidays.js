const { Client } = require('pg');

const USER_ID = '91fc3863-060b-4431-9828-864572f1ac79';

const CONNECTION_STRING = 'postgresql://postgres.qcnozghkxbnlofahaqig:Vdsrjspq92$123@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

const NEW_SHIFTS = [
  {
    date: '2026-02-05',
    job: 'TRACTOR TRAILER',
    location: 'VANTERM',
    subjob: null,
    shift: 'DAY',
    reg_hours: 8,
    ot_hours: 0,
    reg_rate: 53.82,
    ot_rate: 80.73,
    total_pay: 470.93,
    notes: null,
  },
  {
    date: '2026-02-12',
    job: 'LOCI',
    location: 'CENTENNIAL',
    subjob: null,
    shift: 'DAY',
    reg_hours: 9,
    ot_hours: 0,
    reg_rate: 53.82,
    ot_rate: 80.73,
    total_pay: 484.85,
    notes: null,
  },
  {
    date: '2026-02-19',
    job: 'HEAD CHECKER',
    location: 'DELTAPORT',
    subjob: null,
    shift: 'NIGHT',
    reg_hours: 8,
    ot_hours: 0,
    reg_rate: 66.98,
    ot_rate: 100.47,
    total_pay: 535.84,
    notes: null,
  },
  {
    date: '2026-02-21',
    job: 'TRACTOR TRAILER',
    location: 'CENTENNIAL',
    subjob: null,
    shift: 'DAY',
    reg_hours: 9,
    ot_hours: 0,
    reg_rate: 53.82,
    ot_rate: 80.73,
    total_pay: 484.38,
    notes: null,
  },
  {
    date: '2026-02-26',
    job: '40 TON (TOP PICK)',
    location: 'VANTERM',
    subjob: null,
    shift: 'DAY',
    reg_hours: 8,
    ot_hours: 0,
    reg_rate: 53.82,
    ot_rate: 80.73,
    total_pay: 430.56,
    notes: null,
  },
  {
    date: '2026-02-28',
    job: 'LIFT TRUCK',
    location: 'CENTENNIAL',
    subjob: null,
    shift: 'DAY',
    reg_hours: 9,
    ot_hours: 0,
    reg_rate: 53.82,
    ot_rate: 80.73,
    total_pay: 484.38,
    notes: null,
  },
  {
    date: '2026-03-02',
    job: 'TRACTOR TRAILER',
    location: 'DELTAPORT',
    subjob: null,
    shift: 'DAY',
    reg_hours: 8,
    ot_hours: 0,
    reg_rate: 53.82,
    ot_rate: 80.73,
    total_pay: 470.93,
    notes: null,
  },
  {
    date: '2026-03-04',
    job: 'LABOUR',
    location: 'VANTERM',
    subjob: null,
    shift: 'NIGHT',
    reg_hours: 8,
    ot_hours: 0,
    reg_rate: 66.98,
    ot_rate: 100.47,
    total_pay: 535.84,
    notes: null,
  },
];

async function main() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');

    // 1. Update the Feb 16 Family Day shift to double time
    console.log('\n--- Updating Feb 16 Family Day shift ---');
    const updateResult = await client.query(
      `UPDATE shifts SET total_pay = 957.06, notes = 'Worked Family Day stat holiday - double time' WHERE user_id = $1 AND date = '2026-02-16'`,
      [USER_ID]
    );
    console.log(`Updated ${updateResult.rowCount} row(s) for Feb 16 Family Day`);

    // 2. Insert new shifts
    console.log('\n--- Inserting new shifts ---');
    for (const shift of NEW_SHIFTS) {
      const result = await client.query(
        `INSERT INTO shifts (user_id, date, job, location, subjob, shift, reg_hours, ot_hours, reg_rate, ot_rate, total_pay, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT DO NOTHING`,
        [
          USER_ID,
          shift.date,
          shift.job,
          shift.location,
          shift.subjob,
          shift.shift,
          shift.reg_hours,
          shift.ot_hours,
          shift.reg_rate,
          shift.ot_rate,
          shift.total_pay,
          shift.notes,
        ]
      );
      console.log(`Inserted ${shift.date} - ${shift.job} at ${shift.location} (${shift.shift}): $${shift.total_pay}`);
    }

    // 3. Verify: count all Feb+Mar shifts for this user
    console.log('\n--- Verification ---');
    const febCount = await client.query(
      `SELECT date, job, location, shift, total_pay, notes FROM shifts WHERE user_id = $1 AND date >= '2026-02-01' AND date <= '2026-02-28' ORDER BY date`,
      [USER_ID]
    );
    console.log(`\nFebruary 2026 shifts: ${febCount.rows.length}`);
    febCount.rows.forEach((r) => {
      const notesTag = r.notes ? ` [${r.notes}]` : '';
      console.log(`  ${r.date.toISOString().slice(0, 10)} - ${r.job} @ ${r.location} (${r.shift}) $${r.total_pay}${notesTag}`);
    });

    const marCount = await client.query(
      `SELECT date, job, location, shift, total_pay FROM shifts WHERE user_id = $1 AND date >= '2026-03-01' AND date <= '2026-03-31' ORDER BY date`,
      [USER_ID]
    );
    console.log(`\nMarch 2026 shifts: ${marCount.rows.length}`);
    marCount.rows.forEach((r) => {
      console.log(`  ${r.date.toISOString().slice(0, 10)} - ${r.job} @ ${r.location} (${r.shift}) $${r.total_pay}`);
    });

    console.log('\nDone!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
