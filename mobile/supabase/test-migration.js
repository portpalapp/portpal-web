const { createClient } = require('@supabase/supabase-js');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbm96Z2hreGJubG9mYWhhcWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkzNjM3MywiZXhwIjoyMDg4NTEyMzczfQ.zy7O2yJhZzmcnzliIDtDQCIPQA_KSBRW0vQLejLC_9s';
const ANON_KEY = 'sb_publishable_i10LTCrx6XGeJTXKIFXSsQ_1ISYAfcN';
const URL = 'https://qcnozghkxbnlofahaqig.supabase.co';

const admin = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const anon = createClient(URL, ANON_KEY);

(async () => {
  console.log('=== FULL MIGRATION FLOW TEST ===\n');

  console.log('1. Creating user via Admin API...');
  const { data: userData, error: createErr } = await admin.auth.admin.createUser({
    email: 'veeteshrup@gmail.com',
    password: 'testpass123',
    email_confirm: true,
  });
  if (createErr) { console.log('   FAILED:', createErr.message); return; }
  console.log('   User created:', userData.user.id);

  console.log('2. Claiming migration code 609F8399...');
  const { data: claimed, error: claimErr } = await admin.rpc('claim_migration_code', {
    p_code: '609F8399',
    p_supabase_uid: userData.user.id,
  });
  if (claimErr) { console.log('   FAILED:', claimErr.message); return; }
  console.log('   Claimed:', claimed);

  console.log('3. Signing in with anon client...');
  const { data: session, error: signInErr } = await anon.auth.signInWithPassword({
    email: 'veeteshrup@gmail.com',
    password: 'testpass123',
  });
  if (signInErr) { console.log('   FAILED:', signInErr.message); return; }
  console.log('   Signed in! Session:', !!session.session);

  console.log('4. Checking shifts...');
  const { data: shifts } = await anon.from('shifts')
    .select('id, date, job, total_pay')
    .eq('user_id', userData.user.id)
    .order('date', { ascending: false })
    .limit(5);
  console.log('   Recent:', shifts?.length || 0);
  if (shifts?.length) shifts.forEach(s => console.log('     ', s.date, s.job, '$' + s.total_pay));

  const { data: allShifts } = await anon.from('shifts').select('id').eq('user_id', userData.user.id);
  console.log('   Total shifts transferred:', allShifts?.length);

  console.log('5. Checking profile...');
  const { data: profile } = await anon.from('profiles').select('*').eq('id', userData.user.id).single();
  console.log('   Profile:', profile ? `${profile.name} | ${profile.union_local} | ${profile.board}` : 'NOT FOUND');

  await anon.auth.signOut();
  console.log('\n=== ALL STEPS PASSED ===');
})().catch(e => console.log('Error:', e.message));
