const fs = require('fs');
const file = 'app/(tabs)/home.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. Add imports
if (!code.includes('import * as FileSystem')) {
  code = code.replace(
    "import * as Haptics from 'expo-haptics';",
    "import * as Haptics from 'expo-haptics';\nimport * as FileSystem from 'expo-file-system';\nimport AnimatedReanimated, { ZoomIn, FadeIn, FadeOut, withRepeat, withSequence, withTiming, useSharedValue, useDerivedValue, useAnimatedStyle } from 'react-native-reanimated';"
  );
}

// Skia import might need RoundedRect
if (!code.includes('RoundedRect')) {
  code = code.replace('BlurMask, Canvas, Circle, Path, Skia', 'BlurMask, Canvas, Circle, Path, Skia, RoundedRect');
}

// 2. Add state
if (!code.includes('showWalkthrough')) {
  code = code.replace(
    'const bgMint = palette.readyMint ?? palette.background;',
    `const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(0);

  useEffect(() => {
    FileSystem.getInfoAsync(FileSystem.documentDirectory + 'home_walkthrough.txt').then(info => {
      if (!info.exists) setShowWalkthrough(true);
    }).catch(() => {});
  }, []);

  const finishWalkthrough = async () => {
    setShowWalkthrough(false);
    try {
      await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + 'home_walkthrough.txt', 'done');
    } catch {}
  };

  const currentRisk = npiScore != null ? riskBand(npiScore) : null;
  const pulseOpacity = useSharedValue(0.4);
  useEffect(() => {
    const speedMs = currentRisk?.pulseMs ?? 2000;
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: speedMs }),
        withTiming(0.4, { duration: speedMs })
      ),
      -1,
      true
    );
  }, [currentRisk?.pulseMs, pulseOpacity]);

  const bgMint = palette.readyMint ?? palette.background;`
  );
}

// 3. Update verifySurface haptics
code = code.replace(
  /verifyTimerRef\.current = setInterval\(\(\) => \{[\s\S]*?Haptics\.impactAsync\(Haptics\.ImpactFeedbackStyle\.Heavy\)\.catch\(\(\) => \{\}\);[\s\S]*?t -= 1;[\s\S]*?setVerifyCountdown\(Math\.max\(0, t\)\);[\s\S]*?if \(t <= 0\) \{/,
  `verifyTimerRef.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      t -= 1;
      setVerifyCountdown(Math.max(0, t));
      if (t <= 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});`
);

// 4. Update verifySurface animation
code = code.replace(
  '<View style={[styles.verifyCard, { borderColor: palette.border }]}>',
  '<AnimatedReanimated.View entering={ZoomIn.springify().damping(15)} exiting={FadeOut} style={[styles.verifyCard, { borderColor: palette.border }]}>'
);
code = code.replace(
  '             </Pressable>\n          </View>\n        </View>\n      </Modal>',
  '             </Pressable>\n          </AnimatedReanimated.View>\n        </View>\n      </Modal>'
);

// 5. Hero Card radius and padding (Ensure superellipse continuous corners)
code = code.replace(
  'heroGlassShell: { borderRadius: 20, borderWidth: 1, padding: 16, overflow: \'hidden\' },',
  'heroGlassShell: { borderRadius: 24, borderWidth: 1, padding: 20, overflow: \'hidden\' },'
);
code = code.replace(
  'timelineBarsCard: { overflow: \'hidden\', borderRadius: 20, borderWidth: 1, marginTop: 16, height: 180 },',
  'timelineBarsCard: { overflow: \'hidden\', borderRadius: 24, borderWidth: 1, marginTop: 16, height: 180 },'
);
code = code.replace(
  'verifyCard: { margin: 20, borderRadius: 20, borderWidth: 1, padding: 24, alignItems: \'center\', backgroundColor: \'rgba(8,16,12,0.85)\' },',
  'verifyCard: { margin: 20, borderRadius: 24, borderWidth: 1, padding: 24, alignItems: \'center\', backgroundColor: \'rgba(8,16,12,0.85)\' },'
);

// 6. Instagram Status Ring
code = code.replace(
  'style={[styles.heroDogCircle, { borderColor: palette.border }]}',
  'style={[styles.heroDogCircle, { borderColor: currentRisk?.color ?? palette.border }]}'
);
code = code.replace(
  'style={[styles.heroDogCircle, styles.heroDogPh, { borderColor: palette.border }]}',
  'style={[styles.heroDogCircle, styles.heroDogPh, { borderColor: currentRisk?.color ?? palette.border }]}'
);
code = code.replace(
  'heroDogCircle: {\n    width: 144,\n    height: 144,\n    borderRadius: 72,\n    borderWidth: 2,',
  'heroDogCircle: {\n    width: 144,\n    height: 144,\n    borderRadius: 72,\n    borderWidth: 4,'
);

// 7. Location Fallback UI
const oldLocationText = `) : weather.status === 'permission_denied' ? (
                <Text style={[styles.permissionText, { color: palette.text }]}>
                  Turn on location to see your timeline and weather (US).
                </Text>
              ) : weather.status === 'unavailable' ? (`;

const newLocationFallback = `) : weather.status === 'permission_denied' ? (
                <View style={[styles.heroGlassShell, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', backgroundColor: isDark ? 'rgba(15,23,20,0.7)' : 'rgba(255,255,255,0.7)', alignItems: 'center' }]}>
                  <MaterialCommunityIcons name="map-marker-off-outline" size={48} color={palette.textSecondary} style={{ marginBottom: 12 }} />
                  <Text style={[styles.h2, { color: palette.text, textAlign: 'center', marginBottom: 8 }]}>Unlock Your Environment</Text>
                  <Text style={[styles.body, { color: palette.textSecondary, textAlign: 'center', marginBottom: 20 }]}>
                    NorthPaw needs your location to generate safety timelines and calculate pavement temperatures.
                  </Text>
                  <Pressable
                    onPress={() => Linking.openSettings()}
                    style={({ pressed }) => [
                      styles.readinessPrimaryCta,
                      { backgroundColor: FOREST, opacity: pressed ? 0.9 : 1, width: '100%' },
                    ]}>
                    <Text style={styles.readinessPrimaryCtaText}>Open Settings</Text>
                  </Pressable>
                </View>
              ) : weather.status === 'unavailable' ? (`;
code = code.replace(oldLocationText, newLocationFallback);

// 8. Skia Heartbeat Pulse on Timeline
const timelineGradient = `<LinearGradient
                colors={isDark ? ['rgba(8,16,12,0.22)', 'rgba(8,16,12,0.52)'] : ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.52)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />`;

const skiaPulse = `<LinearGradient
                colors={isDark ? ['rgba(8,16,12,0.22)', 'rgba(8,16,12,0.52)'] : ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.52)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {currentRisk && (
                <AnimatedReanimated.View style={[StyleSheet.absoluteFill, { opacity: pulseOpacity }]}>
                  <Canvas style={StyleSheet.absoluteFill}>
                     <RoundedRect x={0} y={0} width={2000} height={180} r={24} color={currentRisk.color}>
                       <BlurMask blur={30} style="normal" />
                     </RoundedRect>
                  </Canvas>
                </AnimatedReanimated.View>
              )}`;
code = code.replace(timelineGradient, skiaPulse);

fs.writeFileSync(file, code);
