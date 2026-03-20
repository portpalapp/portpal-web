// Quick script to inspect Bubble API schema for all data types
const BUBBLE_API = 'https://portpal.app/version-test/api/1.1/obj';
const BUBBLE_KEY = '6c87dd86e8db22ad01cc5c05300a4aad';

async function inspect(type, count = 10) {
  const url = `${BUBBLE_API}/${type}?limit=${count}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_KEY}` } });
  const data = await res.json();
  const results = data.response.results;
  const total = data.response.count + data.response.remaining;

  // Collect all keys and sample values across all records
  const fields = {};
  for (const r of results) {
    for (const [k, v] of Object.entries(r)) {
      if (!fields[k]) fields[k] = { type: typeof v, samples: [], nullCount: 0, totalCount: 0 };
      fields[k].totalCount++;
      if (v === null || v === undefined || v === '' || v === 0) {
        fields[k].nullCount++;
      } else {
        if (fields[k].samples.length < 3) {
          fields[k].samples.push(JSON.stringify(v).slice(0, 100));
        }
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`${type.toUpperCase()} — ${total} total records`);
  console.log(`${'='.repeat(60)}`);

  const keys = Object.keys(fields).sort();
  for (const k of keys) {
    const f = fields[k];
    const fill = `${f.totalCount - f.nullCount}/${f.totalCount}`;
    console.log(`  ${k.padEnd(25)} [${fill.padEnd(5)}] ${f.samples[0] || '(empty)'}`);
  }
  console.log(`  --- ${keys.length} fields total ---`);
}

async function main() {
  await inspect('shifts', 20);
  await inspect('user', 20);
  await inspect('PayDiff', 20);
}

main().catch(e => console.error(e));
