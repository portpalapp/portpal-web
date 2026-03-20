const { createClient } = require('@supabase/supabase-js');
const anon = createClient(
  'https://qcnozghkxbnlofahaqig.supabase.co',
  'sb_publishable_i10LTCrx6XGeJTXKIFXSsQ_1ISYAfcN'
);

(async () => {
  console.log('=== TEST: migrate_with_code via anon client ===\n');

  const { data, error } = await anon.rpc('migrate_with_code', {
    p_code: '609F8399',
    p_email: 'veeteshrup@gmail.com',
    p_password: 'mypassword1'
  });
  console.log('Result:', JSON.stringify(data, null, 2));
  console.log('Error:', error ? error.message : 'none');

  if (data && data.success) {
    console.log('\nShifts transferred:', data.shifts_transferred);

    const { data: session, error: signInErr } = await anon.auth.signInWithPassword({
      email: 'veeteshrup@gmail.com',
      password: 'mypassword1',
    });
    console.log('Sign-in:', signInErr ? signInErr.message : 'SUCCESS');

    if (session && session.session) {
      const { data: shifts } = await anon.from('shifts').select('id').eq('user_id', data.user_id);
      console.log('Shifts accessible:', shifts ? shifts.length : 0);

      const { data: profile } = await anon.from('profiles').select('*').eq('id', data.user_id).single();
      console.log('Profile:', profile ? `${profile.name} | ${profile.union_local} | ${profile.board}` : 'none');

      await anon.auth.signOut();
      console.log('\n=== ALL PASSED ===');
    }
  }
})().catch(e => console.log('Error:', e.message));
