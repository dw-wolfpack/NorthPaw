import re

with open('app/onboarding.tsx', 'r') as f:
    content = f.read()

# 1. Add trackOnboardingEvent helper inside the component
# We'll put it right after the state declarations (e.g., after `const [busy, setBusy] = useState(false);`)
helper_code = """
  const onboardingSessionId = useRef('obs-' + Math.random().toString(36).substring(2, 9)).current;
  const sceneVisitCounts = useRef<Record<string, number>>({});
  const sceneStartTime = useRef<number>(Date.now());
  const isTransitioning = useRef(false);

  const trackOnboardingEvent = (eventName: string, extraProps: Record<string, any> = {}) => {
    const timeOnSceneMs = Date.now() - sceneStartTime.current;
    trackEvent(eventName, {
      onboarding_flow_version: "2",
      onboarding_session_id: onboardingSessionId,
      scene_name: SCENES[sceneIdx],
      scene_position: sceneIdx,
      scene_visit_number: sceneVisitCounts.current[SCENES[sceneIdx]] || 1,
      time_on_scene_ms: timeOnSceneMs,
      is_first_onboarding: true, // We assume true for now, can refine if we load state
      ...extraProps
    });
  };

  useEffect(() => {
    const s = SCENES[sceneIdx];
    sceneVisitCounts.current[s] = (sceneVisitCounts.current[s] || 0) + 1;
    sceneStartTime.current = Date.now();
  }, [sceneIdx]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState.match(/inactive|background/)) {
        trackOnboardingEvent('onboarding_interrupted', { reason: 'backgrounded' });
      } else if (nextAppState === 'active') {
        trackOnboardingEvent('onboarding_resumed');
      }
    });
    return () => { subscription.remove(); };
  }, [sceneIdx]);
"""

content = content.replace("const [busy, setBusy] = useState(false);\n", "const [busy, setBusy] = useState(false);\n" + helper_code)

# 2. Replace trackEvent('onboarding_...') with trackOnboardingEvent
content = re.sub(r"trackEvent\('onboarding_", r"trackOnboardingEvent('onboarding_", content)

# Remove onboarding_name_viewed if we added it, or any redundant tracking.
# In `useEffect` for `onboarding_step_viewed`:
content = content.replace("trackEvent('onboarding_step_viewed', {", "trackOnboardingEvent('onboarding_step_viewed', {")

# 3. Update advance() function
advance_old = """  const advance = () => {
    if (!canAdvance || sceneIdx >= SCENES.length - 1) return;
    selectionTick();
    setSceneIdx((s) => s + 1);
  };"""

advance_new = """  const advance = () => {
    if (isTransitioning.current) return;
    if (!canAdvance || sceneIdx >= SCENES.length - 1) {
      if (scene === 'name' && name.trim().length === 0) {
        trackOnboardingEvent('onboarding_name_validation_blocked', { reason: 'empty' });
        trackOnboardingEvent('onboarding_validation_blocked', { reason: 'empty' });
      }
      return;
    }
    isTransitioning.current = true;
    if (scene === 'name') {
      trackOnboardingEvent('onboarding_name_completed');
    }
    trackOnboardingEvent('onboarding_step_completed');
    selectionTick();
    setSceneIdx((s) => s + 1);
    setTimeout(() => { isTransitioning.current = false; }, 400); // Prevent double fire
  };"""

content = content.replace(advance_old, advance_new)

# 4. Name screen UI:
name_scene_old = """    if (scene === 'name') {
      return (
        <AnimatedReanimated.View key="name" style={[styles.glassCard, styles.squircle24, animatedCardStyle, themedCardStyle]}>
          <Text style={[styles.h1, { color: palette.text }]}>What&apos;s your dog&apos;s name?</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>We will personalize every screen for your dog.</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. River"
            placeholderTextColor={palette.textSecondary}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={48}
            returnKeyType="done"
            onSubmitEditing={advance}
            style={[
              styles.input,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
                color: palette.text,
              },
            ]}
          />
          <Pressable
            disabled={!canAdvance}
            onPress={() => { hapticTap(); advance(); }}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: canAdvance ? palette.tint : palette.border,
                opacity: pressed && canAdvance ? 0.9 : 1,
              },
            , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </AnimatedReanimated.View>
      );
    }"""

name_scene_new = """    if (scene === 'name') {
      const isNameEmpty = name.trim().length === 0;
      return (
        <AnimatedReanimated.View key="name" style={[styles.glassCard, styles.squircle24, animatedCardStyle, themedCardStyle]}>
          <Text style={[styles.h1, { color: palette.text }]}>What&apos;s your dog&apos;s name?</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>We will personalize every screen for your dog.</Text>
          <TextInput
            value={name}
            onChangeText={(t) => {
              if (name.length === 0 && t.length > 0) trackOnboardingEvent('onboarding_name_input_started');
              setName(t);
            }}
            placeholder="e.g. River"
            placeholderTextColor={palette.textSecondary}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={48}
            returnKeyType="done"
            onSubmitEditing={() => advance()}
            style={[
              styles.input,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
                color: palette.text,
              },
            ]}
          />
          {isNameEmpty && (
            <Text style={{ color: Colors.light.error, fontSize: 13, marginTop: -10, marginBottom: 10, alignSelf: 'flex-start' }}>
              Please enter a name for your dog.
            </Text>
          )}
          <Pressable
            onPress={() => {
              trackOnboardingEvent('onboarding_name_continue_tapped');
              hapticTap();
              advance();
            }}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: !isNameEmpty ? palette.tint : palette.border,
                opacity: pressed && !isNameEmpty ? 0.9 : 1,
              },
              { transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </AnimatedReanimated.View>
      );
    }"""

content = content.replace(name_scene_old, name_scene_new)

# 5. Load Aha / Weather Handoff
load_aha_old = """  const loadAha = async () => {
    setLoadingAha(true);
    try {
      const weather = await fetchWeatherForDeviceLocation();
      setAhaWeather(weather);
    } catch {
      setAhaWeather({ status: 'unavailable', message: 'Could not load live conditions.' });
    } finally {
      setLoadingAha(false);
    }
  };"""

load_aha_new = """  const loadAha = async () => {
    setLoadingAha(true);
    trackEvent('weather_load_started', { context: 'onboarding' });
    try {
      const weather = await Promise.race([
        fetchWeatherForDeviceLocation(),
        new Promise<HomeWeatherState>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]);
      setAhaWeather(weather);
      trackEvent('weather_loaded', { context: 'onboarding' });
    } catch (err: any) {
      setAhaWeather({ status: 'unavailable', message: 'Could not load live conditions.' });
      trackEvent('weather_fetch_failed', { 
        provider: 'NWS', 
        error_category: err.message === 'timeout' ? 'timeout' : 'network',
        retryable: true,
        cached_fallback_available: false
      });
    } finally {
      setLoadingAha(false);
    }
  };"""

content = content.replace(load_aha_old, load_aha_new)

# 6. Location tracking
request_loc_old = """  const requestLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status === 'granted') {
      setLocationPermission('granted');
      setSceneIdx(SCENES.indexOf('npi-activation'));
      await loadAha();
      return;
    }
    setLocationPermission('denied');
    setSceneIdx(SCENES.indexOf('npi-activation'));
    setAhaWeather({ status: 'permission_denied' });
  };"""

request_loc_new = """  const requestLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    trackEvent('location_permission_result', { result: perm.status });
    if (perm.status === 'granted') {
      setLocationPermission('granted');
      setSceneIdx(SCENES.indexOf('npi-activation'));
      await loadAha();
      return;
    }
    setLocationPermission('denied');
    setSceneIdx(SCENES.indexOf('npi-activation'));
    setAhaWeather({ status: 'permission_denied' });
  };"""

content = content.replace(request_loc_old, request_loc_new)

# 7. npi-activation UI for recovery state
npi_old = """    if (scene === 'npi-activation') {
      const topNote = ahaTopChecklist;
      return (
        <AnimatedReanimated.View key="npi-activation" style={[styles.glassCard, styles.squircle24, animatedCardStyle, themedCardStyle]}>
          <Text style={[styles.h1, { color: palette.text }]}>Building {dogName}&apos;s profile</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>
            {CALIBRATION_LINES[activationLineIdx]}
          </Text>
          
          <View style={styles.activationBox}>
            {loadingAha || !activationReady ? (
              <ActivityIndicator size="large" color={palette.tint} style={{ marginVertical: 30 }} />
            ) : (
              <AnimatedReanimated.View entering={FadeInDown.duration(400)}>
                <MaterialCommunityIcons name="check-decagram" size={64} color={Colors.light.success} style={{ alignSelf: 'center' }} />
                <Text style={[styles.h2, { color: palette.text, textAlign: 'center', marginTop: 12 }]}>Ready.</Text>
                {topNote.id && (
                  <Text style={[styles.body, { color: palette.textSecondary, textAlign: 'center', marginTop: 4 }]}>
                    {topNote.reason}
                  </Text>
                )}
              </AnimatedReanimated.View>
            )}
          </View>
          
          <Pressable
            disabled={loadingAha || !activationReady}
            onPress={() => { hapticTap(); advance(); }}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: (loadingAha || !activationReady) ? palette.border : palette.tint,
                opacity: pressed && (!loadingAha && activationReady) ? 0.9 : 1,
              },
            , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </AnimatedReanimated.View>
      );
    }"""

npi_new = """    if (scene === 'npi-activation') {
      const topNote = ahaTopChecklist;
      const isFailed = ahaWeather.status === 'unavailable' || ahaWeather.status === 'permission_denied';
      return (
        <AnimatedReanimated.View key="npi-activation" style={[styles.glassCard, styles.squircle24, animatedCardStyle, themedCardStyle]}>
          <Text style={[styles.h1, { color: palette.text }]}>Building {dogName}&apos;s profile</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>
            {isFailed ? "We couldn't fetch local weather right now." : CALIBRATION_LINES[activationLineIdx]}
          </Text>
          
          <View style={styles.activationBox}>
            {loadingAha || (!activationReady && !isFailed) ? (
              <ActivityIndicator size="large" color={palette.tint} style={{ marginVertical: 30 }} />
            ) : (
              <AnimatedReanimated.View entering={FadeInDown.duration(400)}>
                <MaterialCommunityIcons name={isFailed ? "alert-circle" : "check-decagram"} size={64} color={isFailed ? Colors.light.warning : Colors.light.success} style={{ alignSelf: 'center' }} />
                <Text style={[styles.h2, { color: palette.text, textAlign: 'center', marginTop: 12 }]}>{isFailed ? "Offline Fallback" : "Ready."}</Text>
                {topNote.id && !isFailed && (
                  <Text style={[styles.body, { color: palette.textSecondary, textAlign: 'center', marginTop: 4 }]}>
                    {topNote.reason}
                  </Text>
                )}
                {isFailed && (
                  <Text style={[styles.body, { color: palette.textSecondary, textAlign: 'center', marginTop: 4 }]}>
                    You can still use NorthPaw. Weather updates will resume when your connection improves.
                  </Text>
                )}
              </AnimatedReanimated.View>
            )}
          </View>
          
          <Pressable
            disabled={loadingAha || (!activationReady && !isFailed)}
            onPress={() => {
              if (isFailed && !activationReady) {
                 trackEvent('weather_retry_tapped');
                 loadAha();
              } else {
                 hapticTap();
                 advance();
              }
            }}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: (loadingAha || (!activationReady && !isFailed)) ? palette.border : palette.tint,
                opacity: pressed ? 0.9 : 1,
              },
              { transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}>
            <Text style={styles.ctaText}>{isFailed && !activationReady ? 'Try Again' : 'Continue'}</Text>
          </Pressable>
        </AnimatedReanimated.View>
      );
    }"""

content = content.replace(npi_old, npi_new)

with open('app/onboarding.tsx', 'w') as f:
    f.write(content)

