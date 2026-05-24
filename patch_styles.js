const fs = require('fs');

function patchFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf-8');
  
  // Replace style={({ pressed }) => [...]} with a version that includes scale
  code = code.replace(/style=\{\(\{\s*pressed\s*\}\)\s*=>\s*\[([\s\S]*?)\]\}/g, (match, p1) => {
    if (p1.includes('scale')) return match; // Already patched
    return `style={({ pressed }) => [${p1}, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}`;
  });

  fs.writeFileSync(filePath, code);
}

const files = [
    'app/(tabs)/home.tsx',
    'app/(tabs)/settings.tsx',
    'app/onboarding.tsx'
];

files.forEach(f => {
    if (fs.existsSync(f)) {
        patchFile(f);
    }
});
