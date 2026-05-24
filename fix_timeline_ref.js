const fs = require('fs');
const file = 'app/(tabs)/home.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. Remove ref from the wrong card (Daily Readiness)
code = code.replace(
  'ref={timelineRef} style={[\n              styles.dailyReadinessCard,',
  'style={[\n              styles.dailyReadinessCard,'
);

// 2. Add ref to the correct card (Today's Timeline)
code = code.replace(
  'style={[\n              styles.timelineBarsCard,',
  'ref={timelineRef} style={[\n              styles.timelineBarsCard,'
);

fs.writeFileSync(file, code);
