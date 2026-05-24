const fs = require('fs');
const file = 'app/(tabs)/home.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. Update imports - add LinearTransition
code = code.replace(
  'ZoomIn, FadeIn, FadeOut, withRepeat, withSequence, withTiming, useSharedValue, useDerivedValue, useAnimatedStyle',
  'ZoomIn, FadeIn, FadeOut, withRepeat, withSequence, withTiming, useSharedValue, useDerivedValue, useAnimatedStyle, LinearTransition'
);

// 2. Remove logs and update walkthrough trigger
code = code.replace(
  /useFocusEffect\([\s\S]*?console\.log\('\[Walkthrough\] Checking for flag file\.\.\.'\);[\s\S]*?if \(!info\.exists\) \{[\s\S]*?setShowWalkthrough\(true\);[\s\S]*?\}\);[\s\S]*?\}, \[\]\)\n  \);/,
  `useFocusEffect(
    useCallback(() => {
      FileSystem.getInfoAsync(FileSystem.documentDirectory + 'home_walkthrough.txt').then(info => {
        if (!info.exists) {
          setWalkthroughStep(0);
          setShowWalkthrough(true);
        }
      }).catch(() => {});
    }, [])
  );`
);

// 3. Redesign the Walkthrough Modal into a Coach Mark system
const oldWalkthrough = /\{showWalkthrough && \([\s\S]*?<Modal transparent animationType="fade">[\s\S]*?<\/Modal>[\s\S]*?\)\}/;

const newWalkthrough = `{showWalkthrough && (
        <Modal transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <Pressable style={StyleSheet.absoluteFill} onPress={finishWalkthrough} />
            <AnimatedReanimated.View 
              layout={LinearTransition.springify().damping(20)}
              entering={FadeIn.duration(400)}
              style={[
                { position: 'absolute', left: 20, right: 20, zIndex: 9999 },
                walkthroughStep === 0 ? { top: 220 } :
                walkthroughStep === 1 ? { top: 380 } :
                walkthroughStep === 2 ? { top: 120 } :
                { bottom: 120 }
              ]}
            >
              <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={{ borderRadius: 24, padding: 24, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' }}>
                {/* Arrow */}
                <View style={[
                  { position: 'absolute', width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 15, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: palette.border },
                  walkthroughStep === 0 ? { top: -15, left: 40, transform: [{ rotate: '0deg' }] } :
                  walkthroughStep === 1 ? { bottom: -15, alignSelf: 'center', transform: [{ rotate: '180deg' }] } :
                  walkthroughStep === 2 ? { top: -15, right: 40, transform: [{ rotate: '0deg' }] } :
                  { bottom: -15, alignSelf: 'center', transform: [{ rotate: '180deg' }] }
                ]} />
                
                {walkthroughStep === 0 && (
                  <>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: palette.text, marginBottom: 8 }}>NPI Status Ring</Text>
                    <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textSecondary, marginBottom: 16 }}>
                      The ring around your dog's photo glows to show current risk. Green is safe, Red is dangerous.
                    </Text>
                  </>
                )}
                {walkthroughStep === 1 && (
                  <>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: palette.text, marginBottom: 8 }}>Safety Timeline</Text>
                    <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textSecondary, marginBottom: 16 }}>
                      Scrub here to see how pavement temps and hazards change throughout the day.
                    </Text>
                  </>
                )}
                {walkthroughStep === 2 && (
                  <>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: palette.text, marginBottom: 8 }}>Smart Reminders</Text>
                    <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textSecondary, marginBottom: 16 }}>
                      Tap the bell to set morning briefs or tick-check reminders for your outings.
                    </Text>
                  </>
                )}
                {walkthroughStep === 3 && (
                  <>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: palette.text, marginBottom: 8 }}>Navigation</Text>
                    <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textSecondary, marginBottom: 16 }}>
                      Switch between your checklists, the field guide, and settings here.
                    </Text>
                  </>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: palette.textSecondary }}>Step {walkthroughStep + 1} of 4</Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable onPress={finishWalkthrough} style={{ padding: 8 }}>
                      <Text style={{ color: palette.textSecondary, fontWeight: '600' }}>Skip</Text>
                    </Pressable>
                    <Pressable 
                      onPress={() => {
                        if (walkthroughStep < 3) setWalkthroughStep(s => s + 1);
                        else finishWalkthrough();
                      }} 
                      style={{ backgroundColor: palette.tint, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '800' }}>{walkthroughStep < 3 ? 'Next' : 'Got it'}</Text>
                    </Pressable>
                  </View>
                </View>
              </BlurView>
            </AnimatedReanimated.View>
          </View>
        </Modal>
      )}`;

code = code.replace(oldWalkthrough, newWalkthrough);

fs.writeFileSync(file, code);
