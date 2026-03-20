const { Client } = require('pg');
const DB_URL = 'postgresql://postgres.qcnozghkxbnlofahaqig:Vdsrjspq92$123@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const email = 'robindollywild12@hotmail.com';

  // Find the bubble user
  const bu = await client.query("SELECT bubble_id, email, name, first_name, last_name, supabase_user_id FROM bubble_users WHERE lower(email) = lower($1)", [email]);
  console.log('Bubble user:', JSON.stringify(bu.rows[0] || 'NOT FOUND'));

  // Find her Supabase auth account
  const au = await client.query("SELECT id, email FROM auth.users WHERE lower(email) = lower($1)", [email]);
  console.log('Supabase auth user:', JSON.stringify(au.rows[0] || 'NOT FOUND'));

  // Count her bubble shifts
  if (bu.rows[0]) {
    const shifts = await client.query('SELECT count(*) FROM bubble_shifts WHERE bubble_user_id = $1', [bu.rows[0].bubble_id]);
    console.log('Bubble shifts:', shifts.rows[0].count);
  }

  // Count her shifts in the main shifts table
  if (au.rows[0]) {
    const mainShifts = await client.query('SELECT count(*) FROM shifts WHERE user_id = $1', [au.rows[0].id]);
    console.log('Main shifts table:', mainShifts.rows[0].count);
  }

  // Link the accounts if both exist
  if (bu.rows[0] && au.rows[0] && !bu.rows[0].supabase_user_id) {
    await client.query('UPDATE bubble_users SET supabase_user_id = $1 WHERE bubble_id = $2', [au.rows[0].id, bu.rows[0].bubble_id]);
    console.log('\nLINKED: bubble_user ' + bu.rows[0].bubble_id + ' → supabase auth ' + au.rows[0].id);
  } else if (bu.rows[0] && bu.rows[0].supabase_user_id) {
    console.log('\nAlready linked to:', bu.rows[0].supabase_user_id);
  }

  // Check shifts table schema
  const cols = await client.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'shifts' AND table_schema = 'public' ORDER BY ordinal_position");
  console.log('\nShifts table columns:');
  for (const c of cols.rows) {
    console.log('  ' + c.column_name.padEnd(20) + c.data_type.padEnd(30) + ' nullable=' + c.is_nullable + (c.column_default ? '  default=' + c.column_default : ''));
  }

  // Check RLS policies on shifts
  const rls = await client.query("SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'shifts' AND schemaname = 'public'");
  console.log('\nShifts RLS policies:');
  for (const p of rls.rows) {
    console.log('  ' + p.policyname + ' (' + p.cmd + ')');
  }

  // Check if RLS is enabled
  const rlsEnabled = await client.query("SELECT relrowsecurity FROM pg_class WHERE relname = 'shifts'");
  console.log('RLS enabled:', rlsEnabled.rows[0]?.relrowsecurity);

  await client.end();
}

run().catch(e => console.error('ERROR:', e.message));
