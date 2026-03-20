const fs = require('fs');
const raw = fs.readFileSync('build_info.txt','utf8');
const idx = raw.indexOf('{');
const json = JSON.parse(raw.substring(idx));
// Get the last (largest) log file which has the full build output
const lastUrl = json.logFiles[json.logFiles.length - 1];
fetch(lastUrl).then(r => r.text()).then(t => {
  const lines = t.split('\n');
  // Find FAILURE and show surrounding context
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('FAILURE') || lines[i].includes('What went wrong') || lines[i].includes('Execution failed')) {
      // Print 5 lines before and 15 after
      const start = Math.max(0, i - 5);
      const end = Math.min(lines.length, i + 15);
      for (let j = start; j < end; j++) {
        try { const parsed = JSON.parse(lines[j]); console.log(parsed.msg); } catch(e) { console.log(lines[j].substring(0, 400)); }
      }
      console.log('---');
    }
  }
});
