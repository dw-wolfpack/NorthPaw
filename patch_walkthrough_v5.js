const fs = require('fs');
const file = 'app/(tabs)/home.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. Add refs for targets
code = code.replace(
  'const mainScrollRef = useRef<ScrollView>(null);',
  `const mainScrollRef = useRef<ScrollView>(null);
  const avatarRef = useRef<View>(null);
  const timelineRef = useRef<View>(null);
  const bellRef = useRef<View>(null);`
);

// 2. Attach refs to target components
// Avatar
code = code.replace(
  'style={styles.heroPhotoCol}',
  'ref={avatarRef} style={styles.heroPhotoCol}'
);
// Bell
code = code.replace(
  "onPress={() => router.push('/reminders')}",
  "ref={bellRef} onPress={() => router.push('/reminders')}"
);
// Timeline
code = code.replace(
  'style={[styles.dailyReadinessCard, { borderColor: palette.border, backgroundColor: isDark ? \'rgba(25,30,25,0.7)\' : \'rgba(255,255,255,0.7)\' }]}',
  'ref={timelineRef} style={[styles.dailyReadinessCard, { borderColor: palette.border, backgroundColor: isDark ? \'rgba(25,30,25,0.7)\' : \'rgba(255,255,255,0.7)\' }]}'
);

// 3. Update triggerStep to use measureInWindow
code = code.replace(
  /const triggerStep = \(step: number\) => \{[\s\S]*?if \(step === 0\) \{[\s\S]*?\} else if \(step === 1\) \{[\s\S]*?\} else if \(step === 2\) \{[\s\S]*?\} else if \(step === 3\) \{[\s\S]*?\}/,
  `const triggerStep = (step: number) => {
    setWalkthroughStep(step);
    setShowWalkthrough(true);
    
    if (step === 0) { // Status Ring
      mainScrollRef.current?.scrollTo({ y: 0, animated: true });
      setTimeout(() => {
        avatarRef.current?.measureInWindow((x, y, w, h) => {
          spotlightX.value = withTiming(x - 4, { duration: 500 });
          spotlightY.value = withTiming(y - 4, { duration: 500 });
          spotlightW.value = withTiming(w + 8, { duration: 500 });
          spotlightH.value = withTiming(h + 8, { duration: 500 });
          spotlightR.value = withTiming((w + 8) / 2, { duration: 500 });
        });
      }, 100);
    } else if (step === 1) { // Timeline
      mainScrollRef.current?.scrollTo({ y: 200, animated: true });
      setTimeout(() => {
        timelineRef.current?.measureInWindow((x, y, w, h) => {
          spotlightX.value = withTiming(x - 4, { duration: 500 });
          spotlightY.value = withTiming(y - 4, { duration: 500 });
          spotlightW.value = withTiming(w + 8, { duration: 500 });
          spotlightH.value = withTiming(h + 8, { duration: 500 });
          spotlightR.value = withTiming(24, { duration: 500 });
        });
      }, 100);
    } else if (step === 2) { // Reminder Button
      mainScrollRef.current?.scrollTo({ y: 0, animated: true });
      setTimeout(() => {
        bellRef.current?.measureInWindow((x, y, w, h) => {
          spotlightX.value = withTiming(x - 4, { duration: 500 });
          spotlightY.value = withTiming(y - 4, { duration: 500 });
          spotlightW.value = withTiming(w + 8, { duration: 500 });
          spotlightH.value = withTiming(h + 8, { duration: 500 });
          spotlightR.value = withTiming((w + 8) / 2, { duration: 500 });
        });
      }, 100);
    } else if (step === 3) { // Tabs
      spotlightX.value = withTiming(0, { duration: 500 });
      spotlightY.value = withTiming(screenHeight - 85, { duration: 500 });
      spotlightW.value = withTiming(screenWidth, { duration: 500 });
      spotlightH.value = withTiming(85, { duration: 500 });
      spotlightR.value = withTiming(0, { duration: 500 });
    }
  };`
);

fs.writeFileSync(file, code);
