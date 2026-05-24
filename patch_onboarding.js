const fs = require('fs');
const file = 'app/onboarding.tsx';
let code = fs.readFileSync(file, 'utf-8');

// Replace all deepLink definitions and usages so it always goes to home
code = code.replace(/const url = ahaTopChecklist\.id \? `\/checklist\/\$\{ahaTopChecklist\.id\}` : undefined;/g, 'const url = undefined;');

fs.writeFileSync(file, code);
