const fs = require('fs');
const file = 'app/(tabs)/home.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. Add more imports
if (!code.includes('useWindowDimensions')) {
  code = code.replace('import {', 'import { useWindowDimensions,');
}
if (!code.includes('Rect,')) {
  code = code.replace('Circle, Path, Skia, RoundedRect', 'Circle, Path, Skia, RoundedRect, Rect, Group');
}

// 2. Add ScrollView Ref and Shared Values for Spotlight
code = code.replace(
  'const [showWalkthrough, setShowWalkthrough] = useState(false);',
  `const [showWalkthrough, setShowWalkthrough] = useState(false);
  const mainScrollRef = useRef<ScrollView>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Spotlight Shared Values
  const spotlightX = useSharedValue(screenWidth / 2);
  const spotlightY = useSharedValue(screenHeight / 2);
  const spotlightR = useSharedValue(0);
  const spotlightW = useSharedValue(0);
  const spotlightH = useSharedValue(0);
  const spotlightIsCircle = useSharedValue(true);`
);

// 3. Add ScrollView Ref usage
code = code.replace(
  '<ScrollView\n        style={{ flex: 1 }}\n        contentContainerStyle={styles.container}',
  '<ScrollView\n        ref={mainScrollRef}\n        style={{ flex: 1 }}\n        contentContainerStyle={styles.container}'
);

// 4. Update walkthrough trigger to include scrolling and spotlight animation
code = code.replace(
  /if \(!info\.exists\) \{[\s\S]*?setWalkthroughStep\(0\);[\s\S]*?setShowWalkthrough\(true\);[\s\S]*?\}/,
  `if (!info.exists) {
          triggerStep(0);
        }`
);

// 5. Add triggerStep function
code = code.replace(
  'const completeWalkthrough = async () => {',
  `const triggerStep = (step: number) => {
    setWalkthroughStep(step);
    setShowWalkthrough(true);
    
    // Animate Spotlight and Scroll
    if (step === 0) { // Status Ring
      mainScrollRef.current?.scrollTo({ y: 0, animated: true });
      spotlightIsCircle.value = true;
      spotlightX.value = withTiming(92, { duration: 500 });
      spotlightY.value = withTiming(200, { duration: 500 });
      spotlightR.value = withTiming(80, { duration: 500 });
    } else if (step === 1) { // Timeline
      mainScrollRef.current?.scrollTo({ y: 150, animated: true });
      spotlightIsCircle.value = false;
      spotlightX.value = withTiming(20, { duration: 500 });
      spotlightY.value = withTiming(420, { duration: 500 });
      spotlightW.value = withTiming(screenWidth - 40, { duration: 500 });
      spotlightH.value = withTiming(180, { duration: 500 });
    } else if (step === 2) { // Reminder Button
      mainScrollRef.current?.scrollTo({ y: 0, animated: true });
      spotlightIsCircle.value = true;
      spotlightX.value = withTiming(screenWidth - 40, { duration: 500 });
      spotlightY.value = withTiming(85, { duration: 500 });
      spotlightR.value = withTiming(40, { duration: 500 });
    } else if (step === 3) { // Tabs
      spotlightIsCircle.value = false;
      spotlightX.value = withTiming(0, { duration: 500 });
      spotlightY.value = withTiming(screenHeight - 85, { duration: 500 });
      spotlightW.value = withTiming(screenWidth, { duration: 500 });
      spotlightH.value = withTiming(85, { duration: 500 });
    }
  };

  const completeWalkthrough = async () => {`
);

// 6. Update Walkthrough UI with Skia Spotlight
const oldWalkthrough = /\{showWalkthrough && \([\s\S]*?<Modal transparent animationType="fade">[\s\S]*?<\/Modal>[\s\S]*?\)\}/;

const newWalkthrough = `{showWalkthrough && (
        <Modal transparent animationType="fade">
          <View style={{ flex: 1 }}>
            <Canvas style={StyleSheet.absoluteFill}>
              <Group>
                <Rect x={0} y={0} width={screenWidth} height={screenHeight} color="rgba(0,0,0,0.7)" />
                {spotlightIsCircle.value ? (
                  <Circle cx={spotlightX} cy={spotlightY} r={spotlightR} color="white" blendMode="dstOut" />
                ) : (
                  <RoundedRect x={spotlightX} y={spotlightY} width={spotlightW} height={spotlightH} r={24} color="white" blendMode="dstOut" />
                )}
              </Group>
            </Canvas>
            
            <Pressable style={StyleSheet.absoluteFill} onPress={finishWalkthrough} />
            
            <AnimatedReanimated.View 
              layout={LinearTransition.duration(400)}
              entering={FadeIn.duration(400)}
              style={[
                { position: 'absolute', left: 40, right: 40, zIndex: 9999, alignItems: 'center' },
                walkthroughStep === 0 ? { top: 290 } :
                walkthroughStep === 1 ? { top: 150 } : // Move tooltip above timeline
                walkthroughStep === 2 ? { top: 150 } :
                { bottom: 180 } // Move tooltip above tabs
              ]}
            >
              <BlurView intensity={90} tint={isDark ? "dark" : "light"} style={{ borderRadius: 20, padding: 20, borderWidth: 1, borderColor: palette.border, overflow: 'hidden', width: '100%' }}>
                {walkthroughStep === 0 && (
                  <>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: palette.text, marginBottom: 4 }}>NPI Status Ring</Text>
                    <Text style={{ fontSize: 13, lineHeight: 18, color: palette.textSecondary, marginBottom: 12 }}>
                      The ring around your dog's photo glows to show risk. Green is safe, Red is dangerous.
                    </Text>
                  </>
                )}
                {walkthroughStep === 1 && (
                  <>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: palette.text, marginBottom: 4 }}>Safety Timeline</Text>
                    <Text style={{ fontSize: 13, lineHeight: 18, color: palette.textSecondary, marginBottom: 12 }}>
                      Scrub here to see how pavement temps and hazards change throughout the day.
                    </Text>
                  </>
                )}
                {walkthroughStep === 2 && (
                  <>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: palette.text, marginBottom: 4 }}>Smart Reminders</Text>
                    <Text style={{ fontSize: 13, lineHeight: 18, color: palette.textSecondary, marginBottom: 12 }}>
                      Tap the bell to set morning briefs or tick-check reminders for your outings.
                    </Text>
                  </>
                )}
                {walkthroughStep === 3 && (
                  <>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: palette.text, marginBottom: 4 }}>Navigation</Text>
                    <Text style={{ fontSize: 13, lineHeight: 18, color: palette.textSecondary, marginBottom: 12 }}>
                      Switch between your checklists, the field guide, and settings here.
                    </Text>
                  </>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: palette.textSecondary }}>Step {walkthroughStep + 1} of 4</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable onPress={finishWalkthrough} style={{ padding: 6 }}>
                      <Text style={{ color: palette.textSecondary, fontSize: 13, fontWeight: '600' }}>Skip</Text>
                    </Pressable>
                    <Pressable 
                      onPress={() => {
                        if (walkthroughStep < 3) triggerStep(walkthroughStep + 1);
                        else finishWalkthrough();
                      }} 
                      style={{ backgroundColor: palette.tint, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{walkthroughStep < 3 ? 'Next' : 'Got it'}</Text>
                    </Pressable>
                  </View>
                </View>
              </BlurView>
            </AnimatedReanimated.View>
          </View>
        </Modal>
      )}`;

code = code.replace(oldWalkthrough, newWalkthrough);

// 7. Fix Settings trigger to use the new triggerStep logic? No, just keep it deleting the file.
// But wait, the settings button should ideally trigger it.

fs.writeFileSync(file, code);
