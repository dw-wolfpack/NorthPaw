const fs = require('fs');
const file = 'app/(tabs)/home.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. Remove spotlightIsCircle and simplify shared values
code = code.replace(
  'const spotlightH = useSharedValue(0);\n  const spotlightIsCircle = useSharedValue(true);',
  'const spotlightH = useSharedValue(0);\n  const spotlightR = useSharedValue(0);'
);

// 2. Update triggerStep to use RoundedRect morphing
code = code.replace(
  /const triggerStep = \(step: number\) => \{[\s\S]*?if \(step === 0\) \{[\s\S]*?\} else if \(step === 1\) \{[\s\S]*?\} else if \(step === 2\) \{[\s\S]*?\} else if \(step === 3\) \{[\s\S]*?\}/,
  `const triggerStep = (step: number) => {
    setWalkthroughStep(step);
    setShowWalkthrough(true);
    
    // Animate Spotlight and Scroll
    if (step === 0) { // Status Ring
      mainScrollRef.current?.scrollTo({ y: 0, animated: true });
      spotlightX.value = withTiming(92 - 76, { duration: 500 });
      spotlightY.value = withTiming(200 - 76, { duration: 500 });
      spotlightW.value = withTiming(152, { duration: 500 });
      spotlightH.value = withTiming(152, { duration: 500 });
      spotlightR.value = withTiming(76, { duration: 500 });
    } else if (step === 1) { // Timeline
      mainScrollRef.current?.scrollTo({ y: 150, animated: true });
      spotlightX.value = withTiming(20, { duration: 500 });
      spotlightY.value = withTiming(420, { duration: 500 });
      spotlightW.value = withTiming(screenWidth - 40, { duration: 500 });
      spotlightH.value = withTiming(180, { duration: 500 });
      spotlightR.value = withTiming(24, { duration: 500 });
    } else if (step === 2) { // Reminder Button
      mainScrollRef.current?.scrollTo({ y: 0, animated: true });
      spotlightX.value = withTiming(screenWidth - 40 - 24, { duration: 500 });
      spotlightY.value = withTiming(85 - 24, { duration: 500 });
      spotlightW.value = withTiming(48, { duration: 500 });
      spotlightH.value = withTiming(48, { duration: 500 });
      spotlightR.value = withTiming(24, { duration: 500 });
    } else if (step === 3) { // Tabs
      spotlightX.value = withTiming(0, { duration: 500 });
      spotlightY.value = withTiming(screenHeight - 85, { duration: 500 });
      spotlightW.value = withTiming(screenWidth, { duration: 500 });
      spotlightH.value = withTiming(85, { duration: 500 });
      spotlightR.value = withTiming(0, { duration: 500 });
    }
  };`
);

// 3. Update Walkthrough UI to use a single morphing RoundedRect
const oldWalkthrough = /\{showWalkthrough && \([\s\S]*?<Canvas style=\{StyleSheet\.absoluteFill\}>[\s\S]*?<\/Canvas>/;

const newWalkthrough = `{showWalkthrough && (
        <Modal transparent animationType="fade">
          <View style={{ flex: 1 }}>
            <Canvas style={StyleSheet.absoluteFill}>
              <Group>
                <Rect x={0} y={0} width={screenWidth} height={screenHeight} color="rgba(0,0,0,0.7)" />
                <RoundedRect 
                  x={spotlightX} 
                  y={spotlightY} 
                  width={spotlightW} 
                  height={spotlightH} 
                  r={spotlightR} 
                  color="white" 
                  blendMode="dstOut" 
                />
              </Group>
            </Canvas>`;

code = code.replace(oldWalkthrough, newWalkthrough);

fs.writeFileSync(file, code);
