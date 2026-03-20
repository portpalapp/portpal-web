const fs = require('fs');
const raw = fs.readFileSync('build_info.txt','utf8');
const idx = raw.indexOf('{');
const json = JSON.parse(raw.substring(idx));
Promise.all(json.logFiles.map((url, i) =>
  fetch(url).then(r => r.text()).then(t => ({i, t}))
)).then(results => {
  results.forEach(({i, t}) => {
    const lines = t.split('\n');
    const errorLines = lines.filter(l => {
      const lower = l.toLowerCase();
      const hasError = lower.includes('error') || lower.includes('failure') || lower.includes('build failed') || lower.includes('exception');
      const isNoise = lower.includes('deprecated') || lower.includes('warn');
      return hasError && !isNoise;
    });
    if (errorLines.length > 0) {
      console.log('=== LOG ' + i + ' ERRORS ===');
      errorLines.slice(0, 25).forEach(l => {
        try { const j = JSON.parse(l); console.log(j.msg); } catch(e) { console.log(l.substring(0,300)); }
      });
    }
  });
});
