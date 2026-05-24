const fs = require('fs');

function patchFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf-8');
  
  // 1. Add hapticTap helper if Haptics is imported but helper isn't there
  if (code.includes('import * as Haptics') && !code.includes('const hapticTap')) {
    code = code.replace(
      'export default function',
      'const hapticTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});\n\nexport default function'
    );
  } else if (!code.includes('import * as Haptics') && code.includes('<Pressable')) {
      // Add import if missing
      code = "import * as Haptics from 'expo-haptics';\n" + code;
      code = code.replace(
        'export default function',
        'const hapticTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});\n\nexport default function'
      );
  }

  // 2. Inject hapticTap into onPress
  // Matches onPress={() => ...} or onPress={handlePress}
  // This is tricky. Let's target the most common arrow function ones first.
  code = code.replace(/onPress=\{([^{}]*?)\}/g, (match, p1) => {
    if (p1.includes('hapticTap')) return match; // Already patched
    if (p1.startsWith('() =>')) {
      return `onPress={() => { hapticTap(); (${p1.slice(5)})(); }}`;
    }
    // If it's a direct function reference, wrap it
    if (/^[a-zA-Z0-9]+$/.test(p1.trim())) {
        return `onPress={() => { hapticTap(); ${p1.trim()}(); }}`;
    }
    return match;
  });

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
        console.log('Patching', f);
        patchFile(f);
    }
});
