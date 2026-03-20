/**
 * ILWU Vessel Scraper → Supabase
 *
 * Scrapes vessel data from ilwu.besz.ca and saves to Supabase.
 *
 * Strategy:
 *   Phase 1a: Known shipping line prefixes (MSC, MAERSK, etc.) + A-Z drilling
 *   Phase 1b: 3-letter prefix sweep with smart skipping
 *   Phase 2:  Fetch details HTML for each unique vessel
 *   Phase 3:  Parse HTML, upsert to Supabase
 *
 * Usage:
 *   node scrape-vessels.js              # Full scrape + save to Supabase
 *   node scrape-vessels.js search-only  # Just find vessels, save to JSON
 */

let Client; // pg loaded on demand
const fs = require('fs');

const SEARCH_URL = 'https://ilwu.besz.ca/vessels/get-json/';
const DETAILS_URL = 'https://ilwu.besz.ca/vessels/details/';
const DB_URL = 'postgresql://postgres.qcnozghkxbnlofahaqig:Vdsrjspq92$123@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

const API_CAP = 6;
const DELAY = 100;              // ms between requests
const CONCURRENT_DETAILS = 3;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let reqCount = 0;
const allVessels = new Map();   // imo → {imo, name, weight}

// ── API Calls ───────────────────────────────────────────────────────────────

async function search(query) {
  reqCount++;
  try {
    const res = await fetch(`${SEARCH_URL}?name=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const text = await res.text();
    if (!text || text.trim() === '') return []; // API returns empty body for no matches
    return JSON.parse(text);
  } catch {
    return []; // silently handle parse errors (empty responses)
  }
}

function collect(results) {
  let added = 0;
  for (const v of results) {
    if (!allVessels.has(v.imo)) {
      allVessels.set(v.imo, v);
      added++;
    }
  }
  return added;
}

async function fetchDetails(imo) {
  reqCount++;
  try {
    const res = await fetch(`${DETAILS_URL}?imo=${imo}`);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ── Search Strategies ───────────────────────────────────────────────────────

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Quick search a shipping line: just LINE + A-Z (26 queries, no drilling).
 * Grabs up to 156 vessels per line (6 per letter × 26 letters).
 * The comprehensive sweep in Phase 1b catches everything else.
 */
async function searchShippingLine(linePrefix) {
  for (const ch of ALPHA) {
    const results = await search(linePrefix + ch);
    await sleep(DELAY);
    collect(results);
  }
}

/**
 * Comprehensive 3-letter combo sweep.
 * Iterates all 17,576 three-letter combos (AAA-ZZZ).
 * No probing or drilling — just flat iteration.
 * ~30 min at 100ms delay.
 */
async function sweepPrefixes() {
  let queryNum = 0;
  const total = 26 * 26 * 26; // 17,576

  for (const a of ALPHA) {
    for (const b of ALPHA) {
      for (const c of ALPHA) {
        queryNum++;
        const results = await search(a + b + c);
        await sleep(DELAY);
        collect(results);

        if (queryNum % 100 === 0) {
          const pct = ((queryNum / total) * 100).toFixed(1);
          process.stdout.write(`\r  [${queryNum}/${total}] ${pct}% | ${allVessels.size} vessels | ${reqCount} reqs`);
        }
      }
    }
  }

  return queryNum;
}

// ── HTML Parser ─────────────────────────────────────────────────────────────

function parseDetailsHtml(html, imo) {
  if (!html || !html.includes('vessel-info')) return null;

  const vessel = {
    imo,
    name: null,
    year_built: null,
    teu: null,
    bays: null,
    width: null,
    deck_lashing: [],
    walkways: [],
    lashing: [],
    bars: [],
    turnbuckles: [],
    stackers: [],
    notes: [],
    former_names: null,
    raw_html: html,
  };

  const nameMatch = html.match(/<h3>([^<]+)/);
  if (nameMatch) vessel.name = nameMatch[1].trim();

  const yearMatch = html.match(/Built in (\d{4})/);
  if (yearMatch) vessel.year_built = parseInt(yearMatch[1]);

  const teuMatch = html.match(/([\d,]+)\s*TEU/);
  if (teuMatch) vessel.teu = parseInt(teuMatch[1].replace(/,/g, ''));

  const bayMatch = html.match(/(\d+)\s*bays?/i);
  if (bayMatch) vessel.bays = parseInt(bayMatch[1]);

  const widthMatch = html.match(/(\d+)\s*wide/i);
  if (widthMatch) vessel.width = parseInt(widthMatch[1]);

  const sections = html.split(/<p class="vi-header">/);
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const headerMatch = section.match(/^([^<]+)<\/p>/);
    if (!headerMatch) continue;
    const header = headerMatch[1].trim().toLowerCase();

    const items = [];
    const liRegex = /<li>([^<]+)<\/li>/g;
    let m;
    while ((m = liRegex.exec(section)) !== null) items.push(m[1].trim());

    if (header.includes('deck lashing')) vessel.deck_lashing = items;
    else if (header === 'walkways') vessel.walkways = items;
    else if (header === 'lashing') vessel.lashing = items;
    else if (header === 'bars') vessel.bars = items;
    else if (header.includes('turnbuckle')) vessel.turnbuckles = items;
    else if (header.includes('stacker')) vessel.stackers = items;
    else if (header.includes('note')) vessel.notes = items;
  }

  const formerMatch = html.match(/Former Names<\/p>([^<]+)/);
  if (formerMatch) vessel.former_names = formerMatch[1].trim();

  return vessel;
}

// ── Database ────────────────────────────────────────────────────────────────

async function createTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.vessels (
      imo integer PRIMARY KEY,
      name text NOT NULL,
      year_built integer,
      teu integer,
      bays integer,
      width integer,
      deck_lashing text[] DEFAULT '{}',
      walkways text[] DEFAULT '{}',
      lashing text[] DEFAULT '{}',
      bars text[] DEFAULT '{}',
      turnbuckles text[] DEFAULT '{}',
      stackers text[] DEFAULT '{}',
      notes text[] DEFAULT '{}',
      former_names text,
      raw_html text,
      scraped_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    ALTER TABLE public.vessels ENABLE ROW LEVEL SECURITY;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vessels' AND policyname = 'vessels_read_all'
      ) THEN
        CREATE POLICY vessels_read_all ON public.vessels FOR SELECT USING (true);
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS idx_vessels_name ON public.vessels USING gin (to_tsvector('english', name));
  `);
  console.log('  vessels table ready');
}

async function upsertVessels(client, vessels) {
  console.log(`\n=== Phase 3: Upserting ${vessels.length} vessels to Supabase ===\n`);
  let inserted = 0, updated = 0, errors = 0;

  for (const v of vessels) {
    try {
      const result = await client.query(`
        INSERT INTO public.vessels (imo, name, year_built, teu, bays, width,
          deck_lashing, walkways, lashing, bars, turnbuckles, stackers, notes,
          former_names, raw_html, scraped_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now(),now())
        ON CONFLICT (imo) DO UPDATE SET
          name=EXCLUDED.name, year_built=EXCLUDED.year_built, teu=EXCLUDED.teu,
          bays=EXCLUDED.bays, width=EXCLUDED.width, deck_lashing=EXCLUDED.deck_lashing,
          walkways=EXCLUDED.walkways, lashing=EXCLUDED.lashing, bars=EXCLUDED.bars,
          turnbuckles=EXCLUDED.turnbuckles, stackers=EXCLUDED.stackers,
          notes=EXCLUDED.notes, former_names=EXCLUDED.former_names,
          raw_html=EXCLUDED.raw_html, updated_at=now()
        RETURNING (xmax = 0) AS is_insert
      `, [v.imo, v.name, v.year_built, v.teu, v.bays, v.width,
          v.deck_lashing, v.walkways, v.lashing, v.bars,
          v.turnbuckles, v.stackers, v.notes, v.former_names, v.raw_html]);

      if (result.rows[0].is_insert) inserted++; else updated++;
    } catch (err) {
      errors++;
      console.error(`  ✗ IMO ${v.imo}: ${err.message}`);
    }
    if ((inserted + updated + errors) % 50 === 0)
      process.stdout.write(`\r  ${inserted} inserted, ${updated} updated, ${errors} errors`);
  }

  console.log(`\n  Done: ${inserted} inserted, ${updated} updated, ${errors} errors`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const mode = process.argv[2] || 'full';
  const startTime = Date.now();

  console.log('╔══════════════════════════════════════════╗');
  console.log('║   ILWU Vessel Scraper → Supabase         ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  Mode: ${mode}\n`);

  // ── Load cached IMOs if available ──
  // fs already required at top
  if (mode === 'upload' && fs.existsSync('vessel-imos.json')) {
    console.log('  Loading cached vessel-imos.json...');
    const cached = JSON.parse(fs.readFileSync('vessel-imos.json', 'utf8'));
    for (const v of cached) allVessels.set(v.imo, v);
    console.log(`  Loaded ${allVessels.size} vessels from cache\n`);
  } else {

  // ── Phase 1a: Known shipping lines ──
  console.log('=== Phase 1a: Known shipping lines ===\n');

  const shippingLines = [
    // Major container lines at Vancouver
    'MSC ',  'MAERSK ',  'CMA CGM ',  'COSCO ',  'EVER ',
    'OOCL ', 'HAPAG ',   'ZIM ',      'HMM ',    'ONE ',
    'PIL ',  'WAN HAI ', 'APL ',      'NYK ',    'MOL ',
    'YANG MING ',  'YM ',

    // Regional/feeder lines seen in database
    'SEASPAN ', 'WESTWOOD ', 'CAPE ', 'STAR ',

    // Chinese vessel prefixes
    'XIN ',  'ZHONG GU ', 'ZHONG ', 'FAN YA ',
    'SM ',   'SC ',       'AS ',    'HS ',

    // Bulk carriers and other common patterns
    'NORTHERN ', 'GOLDEN ',  'PACIFIC ', 'OCEAN ',
    'SEA ',      'ORIENT ',  'GLOBAL ',  'HYUNDAI ',
    'HAMBURG ',  'HANJIN ',  'ATLANTIC ',

    // Other common vessel name starters
    'SPIRIT ', 'CAPE ', 'ISLAND ', 'BAY ',
    'BRIDGE',  'STRAIT ', 'SAN ',   'REN JIAN ',
    'PANDA ',  'BOX ',    'TIGER ', 'EAGLE ',
    'SANTA ',  'GREAT ',  'KING ',  'PRINCESS ',
  ];

  for (const line of shippingLines) {
    const before = allVessels.size;
    await searchShippingLine(line);
    const found = allVessels.size - before;
    if (found > 0) {
      console.log(`  "${line.trim()}" → +${found} (total: ${allVessels.size}, ${reqCount} reqs)`);
    }
  }

  console.log(`\n  After known lines: ${allVessels.size} vessels (${reqCount} requests)\n`);

  // ── Phase 1b: Comprehensive sweep ──
  console.log('=== Phase 1b: 3-letter prefix sweep ===\n');

  await sweepPrefixes();

  console.log(`\n\n  After sweep: ${allVessels.size} vessels (${reqCount} requests)\n`);

  // Summary
  console.log(`  TOTAL: ${allVessels.size} unique vessels found\n`);

  } // end of search block (skipped in 'upload' mode)

  if (mode === 'search-only') {
    const data = [...allVessels.values()].sort((a, b) => a.name.localeCompare(b.name));
    // fs already required at top
    fs.writeFileSync('vessel-imos.json', JSON.stringify(data, null, 2));
    console.log(`  Saved to vessel-imos.json`);
    console.log('\n  Sample:');
    data.slice(0, 25).forEach(v => console.log(`    ${v.imo} - ${v.name}`));
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n  Done in ${elapsed} min (${reqCount} requests)`);
    return;
  }

  // ── Phase 2: Fetch details ──
  console.log(`=== Phase 2: Fetching details for ${allVessels.size} vessels ===\n`);

  const imos = [...allVessels.keys()];
  const parsed = [];
  let done = 0;

  for (let i = 0; i < imos.length; i += CONCURRENT_DETAILS) {
    const batch = imos.slice(i, i + CONCURRENT_DETAILS);
    const results = await Promise.all(batch.map(async (imo) => {
      const html = await fetchDetails(imo);
      await sleep(DELAY);
      return html ? parseDetailsHtml(html, imo) : null;
    }));
    for (const r of results) if (r) parsed.push(r);
    done += batch.length;
    process.stdout.write(`\r  ${done}/${imos.length} fetched (${parsed.length} parsed)`);
  }

  console.log(`\n\n  Parsed ${parsed.length} vessels\n`);

  // Save local backup
  fs.writeFileSync('vessels-data.json', JSON.stringify(parsed, null, 2));
  console.log(`  Backup: vessels-data.json`);

  // ── Phase 3: Upsert to Supabase ──
  Client = require('pg').Client;
  const client = new Client({ connectionString: DB_URL });
  try {
    await client.connect();
    console.log('  Connected to Supabase');
    await createTable(client);
    await upsertVessels(client, parsed);
    const { rows } = await client.query('SELECT count(*) as total FROM public.vessels');
    console.log(`\n  Total vessels in database: ${rows[0].total}`);
  } finally {
    await client.end();
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n  Completed in ${elapsed} min (${reqCount} HTTP requests)\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
