const fs = require('fs');
const file = 'app/(tabs)/home.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. Fix the ScrollView ref
if (!code.includes('ref={mainScrollRef}')) {
  code = code.replace(
    /<ScrollView\s+style=\{\{ flex: 1, backgroundColor: bgMint \}\}\s+contentContainerStyle=\{styles\.container\}>/,
    '<ScrollView ref={mainScrollRef} style={{ flex: 1, backgroundColor: bgMint }} contentContainerStyle={styles.container}>'
  );
}

// 2. Fix the Timeline ref
// First, undo the wrong one at 1721 if it exists
code = code.replace(
  'ref={timelineRef}\n              style={[\n                styles.dailyReadinessCard,\n                { borderColor: palette.border, backgroundColor: isDark ? \'rgba(25,30,25,0.7)\' : \'rgba(255,255,255,0.7)\' },\n              ]}',
  'style={[\n                styles.petInsightCardLarge,\n                { borderColor: palette.border, backgroundColor: palette.surface },\n              ]}'
);

// Now apply the correct one at 1086
code = code.replace(
  'style={[\n              styles.dailyReadinessCard,\n              { borderColor: \'rgba(255,255,255,0.08)\', backgroundColor: \'rgba(15,23,20,0.7)\' },\n            ]}',
  'ref={timelineRef} style={[\n              styles.dailyReadinessCard,\n              { borderColor: \'rgba(255,255,255,0.08)\', backgroundColor: \'rgba(15,23,20,0.7)\' },\n            ]}'
);

fs.writeFileSync(file, code);
