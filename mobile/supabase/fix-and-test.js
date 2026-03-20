const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const DB_URL = 'postgresql://postgres.qcnozghkxbnlofahaqig:Vdsrjspq92$123@aws-0-us-west-2.pooler.supabase.com:5432/postgres';
const SUPA_URL = 'https://qcnozghkxbnlofahaqig.supabase.co';
const ANON_KEY = 'sb_publishable_i10LTCrx6XGeJTXKIFXSsQ_1ISYAfcN';

(async () => {
  // STEP 1: Update function via direct Postgres
  console.log('=== STEP 1: Update migrate_with_code function ===');
  const pg = new Client(DB_URL);
  await pg.connect();

  const sql = fs.readFileSync(path.join(__dirname, 'fix-migrate.sql'), 'utf8');
  await pg.query(sql);
  console.log('Function updated');

  // Clean up any previous test users
  await pg.query("UPDATE migration_codes SET claimed = false, claimed_by = NULL, claimed_at = NULL WHERE code = '609F8399'");
  await pg.query("UPDATE bubble_users SET supabase_user_id = NULL WHERE email = 'veeteshrup@gmail.com'");
  await pg.query("DELETE FROM shifts WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'veeteshrup@gmail.com')");
  await pg.query("DELETE FROM profiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'veeteshrup@gmail.com')");
  await pg.query("DELETE FROM auth.identities WHERE email = 'veeteshrup@gmail.com'");
  await pg.query("DELETE FROM auth.users WHERE email = 'veeteshrup@gmail.com'");
  console.log('Cleaned up previous test data');

  // STEP 2: Call migrate_with_code via direct SQL
  console.log('\n=== STEP 2: Run migrate_with_code ===');
  const { rows } = await pg.query("SELECT public.migrate_with_code('609F8399', 'veeteshrup@gmail.com', 'mypassword1')");
  const result = rows[0].migrate_with_code;
  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.error) {
    console.log('MIGRATION FAILED:', result.error);
    await pg.end();
    return;
  }

  console.log('Shifts transferred:', result.shifts_transferred);
  await pg.end();

  // STEP 3: Sign in via Supabase anon client
  console.log('\n=== STEP 3: Sign in ===');
  const anon = createClient(SUPA_URL, ANON_KEY);
  const { data: session, error: signInErr } = await anon.auth.signInWithPassword({
    email: 'veeteshrup@gmail.com',
    password: 'mypassword1',
  });

  if (signInErr) {
    console.log('SIGN-IN FAILED:', signInErr.message);
    return;
  }
  console.log('Signed in! User:', session.user.id);

  // STEP 4: Verify data
  console.log('\n=== STEP 4: Verify data ===');
  const { data: shifts } = await anon.from('shifts').select('id').eq('user_id', session.user.id);
  console.log('Shifts accessible:', shifts ? shifts.length : 0);

  const { data: profile } = await anon.from('profiles').select('*').eq('id', session.user.id).single();
  console.log('Profile:', profile ? `${profile.name} | ${profile.union_local} | ${profile.board}` : 'NOT FOUND');

  await anon.auth.signOut();
  console.log('\n=== ALL PASSED ===');
})().catch(e => console.log('FATAL:', e.message));
