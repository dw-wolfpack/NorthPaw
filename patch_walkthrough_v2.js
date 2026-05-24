const fs = require('fs');
const file = 'app/(tabs)/home.tsx';
let code = fs.readFileSync(file, 'utf-8');

// Redesign the Walkthrough Modal into a Coach Mark system (V2)
const oldWalkthrough = /\{showWalkthrough && \([\s\S]*?<Modal transparent animationType="fade">[\s\S]*?<\/Modal>[\s\S]*?\)\}/;

const newWalkthrough = `{showWalkthrough && (
        <Modal transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <Pressable style={StyleSheet.absoluteFill} onPress={finishWalkthrough} />
            
            <AnimatedReanimated.View 
              layout={LinearTransition.duration(400)}
              entering={FadeIn.duration(400)}
              style={[
                { position: 'absolute', left: 40, right: 40, zIndex: 9999, alignItems: 'center' },
                walkthroughStep === 0 ? { top: 220 } :
                walkthroughStep === 1 ? { top: 380 } :
                walkthroughStep === 2 ? { top: 120 } :
                { bottom: 120 }
              ]}
            >
              {/* Arrow (outside BlurView to avoid clipping) */}
              <View style={[
                { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 15, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' },
                walkthroughStep === 0 ? { marginBottom: -1, alignSelf: 'flex-start', marginLeft: 30, transform: [{ rotate: '0deg' }] } :
                walkthroughStep === 1 ? { marginTop: -1, alignSelf: 'center', transform: [{ rotate: '180deg' }], order: 2 } :
                walkthroughStep === 2 ? { marginBottom: -1, alignSelf: 'flex-end', marginRight: 30, transform: [{ rotate: '0deg' }] } :
                { marginTop: -1, alignSelf: 'center', transform: [{ rotate: '180deg' }], order: 2 }
              ]} />
              
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
                        if (walkthroughStep < 3) setWalkthroughStep(s => s + 1);
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

fs.writeFileSync(file, code);
