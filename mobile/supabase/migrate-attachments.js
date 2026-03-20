/**
 * Bubble Attachment Migration Script
 *
 * Scans all Bubble shifts for attachments (work slip photos), downloads
 * them from Bubble's CDN, uploads to Supabase Storage, and links them
 * to the corresponding bubble_shifts rows.
 *
 * Phases:
 *   1. Scan  — Fetch all shifts with attachments from Bubble API
 *   2. Schema — Add columns, ensure bucket, create temp storage policy
 *   3. Migrate — Download from Bubble CDN, upload to Supabase Storage
 *   4. Summary — Print results, clean up temp policy
 *
 * Usage:
 *   node migrate-attachments.js           # Full run
 *   node migrate-attachments.js scan      # Phase 1 only (count attachments)
 */

const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

// ── Configuration ────────────────────────────────────────────────────────────

const BUBBLE_API = 'https://portpal.app/version-test/api/1.1/obj';
const BUBBLE_KEY = '6c87dd86e8db22ad01cc5c05300a4aad';
const DB_URL = 'postgresql://postgres.qcnozghkxbnlofahaqig:Vdsrjspq92$123@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

// Read .env for Supabase Storage API
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
}

const SUPABASE_URL = envVars.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const BATCH_SIZE = 100;    // Bubble API max per request
const CURSOR_LIMIT = 9900; // Bubble cursor cap — window past this

// Temporary RLS policy name (created at start, dropped at end)
const TEMP_POLICY = 'migration_temp_workslips';

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
 * Fetch all shifts that have attachments from Bubble API.
 * Uses "not empty" constraint on the attachments field,
 * with date-range windowing to get past Bubble's 10K cursor limit.
 */
async function fetchShiftsWithAttachments() {
  const all = [];
  let cursor = 0;
  let remaining = 1;
  const baseConstraints = [
    { key: 'attachments', constraint_type: 'not empty' }
  ];
  let constraints = [...baseConstraints];
  let lastDate = null;

  console.log('  Fetching shifts with attachments from Bubble API...');

  while (remaining > 0) {
    const response = await fetchBubble('shifts', cursor, BATCH_SIZE, constraints);

    if (response.results.length === 0) break;

    all.push(...response.results);
    remaining = response.remaining;
    cursor += response.results.length;

    const lastRecord = response.results[response.results.length - 1];
    lastDate = lastRecord['Created Date'];

    process.stdout.write(`\r  Fetched ${all.length} shifts with attachments (${remaining} remaining)...`);

    // Window past cursor limit
    if (cursor >= CURSOR_LIMIT && remaining > 0) {
      console.log(`\n  -> Cursor limit reached at ${cursor}, windowing from ${lastDate}...`);
      constraints = [
        ...baseConstraints,
        { key: 'Created Date', constraint_type: 'greater than', value: lastDate }
      ];
      cursor = 0;
    }
  }

  console.log(`\r  Fetched ${all.length} shifts with attachments total.                              `);
  return all;
}

// ── File Helpers ─────────────────────────────────────────────────────────────

/**
 * Determine MIME type from filename extension.
 */
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeMap = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.pdf': 'application/pdf',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

/**
 * Extract a clean filename from a Bubble CDN URL.
 * URLs look like: //xxx.cdn.bubble.io/f1753222736298x131123747149381800/IMG_3933.png
 */
function extractFilename(bubbleUrl) {
  try {
    const cleaned = bubbleUrl.replace(/^(https?:)?\/\//, '');
    const parts = cleaned.split('/');
    const raw = parts[parts.length - 1];
    return decodeURIComponent(raw.split('?')[0]);
  } catch {
    return `attachment_${Date.now()}.png`;
  }
}

/**
 * Download a file from Bubble CDN. Returns the buffer or null on error.
 */
async function downloadFromBubble(bubbleUrl, retries = 3) {
  let fullUrl = bubbleUrl;
  if (fullUrl.startsWith('//')) {
    fullUrl = 'https:' + fullUrl;
  } else if (!fullUrl.startsWith('http')) {
    fullUrl = 'https://' + fullUrl;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(fullUrl, { redirect: 'follow' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (attempt === retries) {
        return null;
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return null;
}

/**
 * Upload a file buffer to Supabase Storage.
 * Uses the REST API with the apikey header (requires a permissive RLS policy).
 * Returns the public URL on success, null on error.
 */
async function uploadToSupabase(storagePath, buffer, mimeType, retries = 3) {
  // Encode each path segment individually but keep slashes
  const encodedPath = storagePath
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
  const url = `${SUPABASE_URL}/storage/v1/object/work-slips/${encodedPath}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': mimeType,
          'x-upsert': 'true',
        },
        body: buffer,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      return `${SUPABASE_URL}/storage/v1/object/public/work-slips/${storagePath}`;
    } catch (e) {
      if (attempt === retries) {
        return null;
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return null;
}

// ── Phase 1: Scan ────────────────────────────────────────────────────────────

async function phaseScan() {
  console.log('\n=== PHASE 1: SCAN ===');
  console.log('Scanning Bubble API for shifts with attachments...\n');

  const shifts = await fetchShiftsWithAttachments();

  let totalFiles = 0;
  const fileTypes = {};
  const userCounts = {};

  for (const shift of shifts) {
    const attachments = shift.attachments || [];
    totalFiles += attachments.length;

    for (const url of attachments) {
      const ext = path.extname(extractFilename(url)).toLowerCase() || '.unknown';
      fileTypes[ext] = (fileTypes[ext] || 0) + 1;
    }

    const userId = shift.relUser || shift['Created By'] || 'unknown';
    userCounts[userId] = (userCounts[userId] || 0) + 1;
  }

  console.log('\n-- Scan Results ------------------------------------');
  console.log(`  Shifts with attachments: ${shifts.length}`);
  console.log(`  Total files to migrate:  ${totalFiles}`);
  console.log(`  Unique users with files: ${Object.keys(userCounts).length}`);
  console.log('\n  File types:');
  for (const [ext, count] of Object.entries(fileTypes).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${ext}: ${count}`);
  }

  const topUsers = Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  console.log('\n  Top users by shift attachments:');
  for (const [uid, count] of topUsers) {
    console.log(`    ${uid.slice(0, 20)}...: ${count} shifts`);
  }

  return shifts;
}

// ── Phase 2: Schema ──────────────────────────────────────────────────────────

async function phaseSchema(client) {
  console.log('\n=== PHASE 2: SCHEMA ===');

  // Add attachments column (text array for Supabase Storage URLs)
  console.log('  Adding attachments column to bubble_shifts...');
  await client.query(`
    ALTER TABLE public.bubble_shifts
    ADD COLUMN IF NOT EXISTS attachments text[]
  `);

  // Add migration tracking column
  console.log('  Adding attachments_migrated column...');
  await client.query(`
    ALTER TABLE public.bubble_shifts
    ADD COLUMN IF NOT EXISTS attachments_migrated boolean DEFAULT false
  `);

  // Create storage bucket if it doesn't exist
  console.log('  Ensuring work-slips storage bucket exists...');
  await client.query(`
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('work-slips', 'work-slips', true)
    ON CONFLICT (id) DO NOTHING
  `);

  // Create a temporary permissive RLS policy for storage uploads.
  // The anon/publishable key doesn't carry an authenticated role, so we need
  // a policy that allows uploads to the work-slips bucket without auth.
  // This is safe because the bucket name is specific and we drop the policy after.
  console.log('  Creating temporary storage upload policy...');
  await client.query(`DROP POLICY IF EXISTS "${TEMP_POLICY}" ON storage.objects`);
  await client.query(`
    CREATE POLICY "${TEMP_POLICY}" ON storage.objects
    FOR ALL
    USING (bucket_id = 'work-slips')
    WITH CHECK (bucket_id = 'work-slips')
  `);

  console.log('  Schema updates complete.');
}

// ── Phase 3: Download & Upload ───────────────────────────────────────────────

async function phaseMigrate(client, shifts) {
  console.log('\n=== PHASE 3: DOWNLOAD & UPLOAD ===');
  console.log(`  Processing ${shifts.length} shifts with attachments...\n`);

  // Check which shifts are already migrated (idempotent)
  const bubbleIds = shifts.map(s => s._id);
  const alreadyMigrated = new Set();

  for (let i = 0; i < bubbleIds.length; i += 500) {
    const batch = bubbleIds.slice(i, i + 500);
    const placeholders = batch.map((_, j) => `$${j + 1}`).join(',');
    const res = await client.query(
      `SELECT bubble_id FROM public.bubble_shifts
       WHERE bubble_id IN (${placeholders}) AND attachments_migrated = true`,
      batch
    );
    for (const row of res.rows) {
      alreadyMigrated.add(row.bubble_id);
    }
  }

  const toProcess = shifts.filter(s => !alreadyMigrated.has(s._id));
  console.log(`  Already migrated: ${alreadyMigrated.size}`);
  console.log(`  To process: ${toProcess.length}\n`);

  if (toProcess.length === 0) {
    console.log('  Nothing to migrate — all shifts already processed.');
    return { migrated: 0, files: 0, errors: 0, skipped: alreadyMigrated.size };
  }

  let totalMigrated = 0;
  let totalFiles = 0;
  let totalErrors = 0;
  const errorLog = [];
  const startTime = Date.now();

  for (let i = 0; i < toProcess.length; i++) {
    const shift = toProcess[i];
    const bubbleId = shift._id;
    const userId = shift.relUser || shift['Created By'] || 'unknown';
    const attachments = shift.attachments || [];

    // Progress indicator with ETA
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = i > 0 ? elapsed / i : 0;
    const eta = rate > 0 ? Math.round(rate * (toProcess.length - i)) : '?';
    process.stdout.write(
      `\r  [${i + 1}/${toProcess.length}] ${totalFiles} files uploaded, ${totalErrors} errors | ETA: ${eta}s    `
    );

    const supabaseUrls = [];

    for (let j = 0; j < attachments.length; j++) {
      const bubbleUrl = attachments[j];
      const filename = extractFilename(bubbleUrl);
      const mimeType = getMimeType(filename);
      const storagePath = `${userId}/${bubbleId}/${filename}`;

      // Download from Bubble CDN
      const buffer = await downloadFromBubble(bubbleUrl);
      if (!buffer) {
        totalErrors++;
        errorLog.push({ type: 'download', shift: bubbleId, url: bubbleUrl });
        continue;
      }

      // Upload to Supabase Storage
      const publicUrl = await uploadToSupabase(storagePath, buffer, mimeType);
      if (!publicUrl) {
        totalErrors++;
        errorLog.push({ type: 'upload', shift: bubbleId, path: storagePath });
        continue;
      }

      supabaseUrls.push(publicUrl);
      totalFiles++;
    }

    // Update the bubble_shifts row
    try {
      await client.query(
        `UPDATE public.bubble_shifts
         SET attachments = $1,
             attachments_migrated = true
         WHERE bubble_id = $2`,
        [supabaseUrls.length > 0 ? supabaseUrls : null, bubbleId]
      );
      totalMigrated++;
    } catch (e) {
      totalErrors++;
      errorLog.push({ type: 'db_update', shift: bubbleId, error: e.message });
    }
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  console.log(`\r  Processed ${toProcess.length} shifts in ${totalTime}s.                                          `);

  // Log errors to file if any
  if (errorLog.length > 0) {
    const errFile = path.join(__dirname, 'migrate-attachments-errors.json');
    fs.writeFileSync(errFile, JSON.stringify(errorLog, null, 2));
    console.log(`  Error log written to: ${errFile}`);
  }

  return {
    migrated: totalMigrated,
    files: totalFiles,
    errors: totalErrors,
    skipped: alreadyMigrated.size,
    seconds: totalTime,
  };
}

// ── Phase 4: Summary ─────────────────────────────────────────────────────────

async function phaseSummary(client, results) {
  console.log('\n=== PHASE 4: SUMMARY ===\n');

  // Clean up: drop temporary storage policy
  console.log('  Removing temporary storage upload policy...');
  await client.query(`DROP POLICY IF EXISTS "${TEMP_POLICY}" ON storage.objects`);

  // Query actual DB state
  const countRes = await client.query(
    `SELECT
       count(*) FILTER (WHERE attachments_migrated = true) AS migrated,
       count(*) FILTER (WHERE attachments IS NOT NULL AND array_length(attachments, 1) > 0) AS with_files,
       count(*) AS total
     FROM public.bubble_shifts`
  );
  const dbStats = countRes.rows[0];

  console.log('\n-- Migration Results --------------------------------');
  console.log(`  Shifts migrated this run:   ${results.migrated}`);
  console.log(`  Files uploaded this run:     ${results.files}`);
  console.log(`  Errors this run:             ${results.errors}`);
  console.log(`  Skipped (already migrated):  ${results.skipped}`);
  console.log(`  Duration:                    ${results.seconds}s`);
  console.log('');
  console.log('-- Database State -----------------------------------');
  console.log(`  Total bubble_shifts:         ${dbStats.total}`);
  console.log(`  Marked as migrated:          ${dbStats.migrated}`);
  console.log(`  With attachment URLs:         ${dbStats.with_files}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const mode = process.argv[2] || 'all';

  console.log('='.repeat(60));
  console.log('  PORTPAL — Bubble Attachment Migration');
  console.log(`  Mode: ${mode}`);
  console.log('='.repeat(60));

  // Phase 1: Scan
  const shifts = await phaseScan();

  if (mode === 'scan') {
    console.log('\nScan complete. Run without arguments to execute full migration.');
    return;
  }

  // Connect to database for phases 2-4
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('\n  Connected to Supabase PostgreSQL.');

  try {
    // Phase 2: Schema + temp policy
    await phaseSchema(client);

    // Phase 3: Download & Upload
    const results = await phaseMigrate(client, shifts);

    // Phase 4: Summary + cleanup
    await phaseSummary(client, results);
  } catch (e) {
    console.error('\nFATAL ERROR:', e.message);
    console.error(e.stack);

    // Always try to clean up the temp policy
    console.log('  Cleaning up temporary policy...');
    await client.query(`DROP POLICY IF EXISTS "${TEMP_POLICY}" ON storage.objects`).catch(() => {});
  } finally {
    await client.end();
  }

  console.log('\nDone!');
}

run().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
