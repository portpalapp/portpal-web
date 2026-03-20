const { Client } = require('pg');
const fs = require('fs');

const DB_URL = 'postgresql://postgres.qcnozghkxbnlofahaqig:Vdsrjspq92$123@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to Supabase.');

  // Run auth-migration.sql
  console.log('\n1. Running auth-migration.sql...');
  const authSql = fs.readFileSync('supabase/auth-migration.sql', 'utf8');
  await client.query(authSql);
  console.log('   Done.');

  // Run storage-setup.sql
  console.log('\n2. Running storage-setup.sql...');
  const storageSql = fs.readFileSync('supabase/storage-setup.sql', 'utf8');
  await client.query(storageSql);
  console.log('   Done.');

  // Verify everything
  console.log('\n── Verification ─────────────────────');

  const col = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bubble_users' AND column_name = 'supabase_user_id'");
  console.log('  bubble_users.supabase_user_id:', col.rows.length > 0 ? 'EXISTS (' + col.rows[0].data_type + ')' : 'MISSING');

  const funcs = await client.query("SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('link_bubble_user', 'verify_bubble_identity', 'update_bubble_user_email')");
  console.log('  Auth functions:', funcs.rows.map(r => r.routine_name).join(', '));

  const bucket = await client.query("SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'work-slips'");
  console.log('  work-slips bucket:', bucket.rows.length > 0 ? 'EXISTS (public=' + bucket.rows[0].public + ', limit=' + (bucket.rows[0].file_size_limit/1024/1024) + 'MB)' : 'MISSING');

  const attachCol = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'attachments'");
  console.log('  shifts.attachments:', attachCol.rows.length > 0 ? 'EXISTS (' + attachCol.rows[0].data_type + ')' : 'MISSING');

  const policies = await client.query("SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%work slips%'");
  console.log('  Storage RLS policies:', policies.rows.length > 0 ? policies.rows.map(r => r.policyname).join(', ') : 'NONE');

  await client.end();
  console.log('\nAll migrations applied successfully.');
}

run().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
