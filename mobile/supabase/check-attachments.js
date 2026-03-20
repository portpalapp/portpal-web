const BUBBLE_API = 'https://portpal.app/version-test/api/1.1/obj';
const BUBBLE_KEY = '6c87dd86e8db22ad01cc5c05300a4aad';

async function checkAttachments() {
  // Fetch a bigger sample to find records with attachments
  const url = `${BUBBLE_API}/shifts?limit=100`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_KEY}` } });
  const data = await res.json();
  const results = data.response.results;

  // Check ALL keys across all records
  const allKeys = new Set();
  const sampleValues = {};

  for (const r of results) {
    for (const [k, v] of Object.entries(r)) {
      allKeys.add(k);
      if (v !== null && v !== undefined && v !== '' && v !== 0 && v !== false) {
        if (!sampleValues[k]) sampleValues[k] = [];
        if (sampleValues[k].length < 3) {
          const s = JSON.stringify(v).slice(0, 200);
          // Look for anything that could be a file URL
          if (s.includes('http') || s.includes('s3') || s.includes('file') || s.includes('image') || s.includes('appforest')) {
            sampleValues[k].push('🔗 ' + s);
          } else {
            sampleValues[k].push(s);
          }
        }
      }
    }
  }

  console.log('ALL SHIFT FIELDS:');
  for (const k of [...allKeys].sort()) {
    const samples = sampleValues[k] || ['(all empty in sample)'];
    console.log(`  ${k}: ${samples[0]}`);
  }

  // Also check if there are any file-related fields by looking for URL patterns
  console.log('\n\nFIELDS CONTAINING URLs:');
  for (const k of [...allKeys].sort()) {
    const vals = sampleValues[k] || [];
    for (const v of vals) {
      if (v.includes('http') || v.includes('s3') || v.includes('appforest')) {
        console.log(`  ${k}: ${v}`);
      }
    }
  }

  // Now also check for a dedicated "workslip" or "file" data type
  console.log('\n\nChecking other data types for files...');
  for (const type of ['workslip', 'work_slip', 'file', 'attachment', 'document', 'photo', 'image', 'slip']) {
    try {
      const r = await fetch(`${BUBBLE_API}/${type}?limit=1`, { headers: { Authorization: `Bearer ${BUBBLE_KEY}` } });
      const d = await r.json();
      if (d.response && d.response.results) {
        console.log(`  ✅ Found type: ${type} (${d.response.count + d.response.remaining} records)`);
        if (d.response.results[0]) {
          console.log(`     Fields: ${Object.keys(d.response.results[0]).join(', ')}`);
          console.log(`     Sample: ${JSON.stringify(d.response.results[0]).slice(0, 300)}`);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // Try constraints to find shifts with non-null file fields
  // Bubble fields for files might be named differently
  console.log('\n\nSearching for shifts with file-like field values...');
  const url2 = `${BUBBLE_API}/shifts?limit=10&constraints=${encodeURIComponent(JSON.stringify([{key: "notes", constraint_type: "contains", value: "http"}]))}`;
  try {
    const r2 = await fetch(url2, { headers: { Authorization: `Bearer ${BUBBLE_KEY}` } });
    const d2 = await r2.json();
    console.log(`  Shifts with URLs in notes: ${d2.response?.count || 0} + ${d2.response?.remaining || 0}`);
    if (d2.response?.results?.[0]) {
      console.log(`  Sample notes: ${d2.response.results[0].notes?.slice(0, 200)}`);
    }
  } catch(e) {}
}

checkAttachments().catch(console.error);
