const fs = require('fs');

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf-8');
  
  // Fix the weird (func())() syntax
  code = code.replace(/onPress=\{\(\) => \{ hapticTap\(\); \((.*?)\)\(\); \}\}/g, 'onPress={() => { hapticTap(); $1; }}');
  
  fs.writeFileSync(filePath, code);
}

const files = [
    'app/(tabs)/home.tsx',
    'app/(tabs)/settings.tsx',
    'app/onboarding.tsx',
    'app/dog-profile.tsx',
    'app/reminders.tsx'
];

files.forEach(f => {
    if (fs.existsSync(f)) {
        fixFile(f);
    }
});
