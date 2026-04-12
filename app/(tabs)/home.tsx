import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useSubscription } from '@/context/SubscriptionContext';
import { canAccessPack, getLibrary } from '@/lib/content';
import { IMAGES } from '@/lib/contentVisuals';
import { getDogProfile, type DogProfile } from '@/lib/profile';
import { buildHomeTimeline, type TimelineTone } from '@/lib/weather/homeTimeline';
import { fetchUsWeatherForDeviceLocation, type HomeWeatherState } from '@/lib/weather/nwsWeather';
import { currentWeatherIconName } from '@/lib/weather/currentWeatherIcon';
import {
  WEATHER_CARD_SCRIM_COLORS,
  weatherCardImageOverlayColors,
  weatherCardStyle,
} from '@/lib/weather/weatherCardBackground';
import { weatherCardBackgroundImage } from '@/lib/weather/weatherCardBackgroundImages';
import { weatherConditionKind } from '@/lib/weather/weatherConditionKind';
import { buildWeatherSuggestions } from '@/lib/weather/weatherSuggestions';
import { useColorScheme } from '@/components/useColorScheme';

const FOREST = '#1B4332';

type HomeReadiness = {
  signal: string;
  meaning: string;
  followThrough: string | null;
};

function buildHomeReadiness(weather: Extract<HomeWeatherState, { status: 'ok' }>): HomeReadiness {
  const blob = `${weather.forecastShort}\n${weather.summary}`.toLowerCase();
  const precip = weather.precipChance ?? 0;
  const looksWet = precip >= 38 || /rain|shower|storm|drizzle|snow|slush|ice/i.test(blob);
  const windy = /wind|breezy|gust/i.test(blob);
  const hot = weather.tempF >= 86 || (weather.tempF >= 80 && /sunny|clear|hot/i.test(blob));
  const cool = weather.tempF <= 55 && !looksWet;

  if (hot) {
    return {
      signal: 'Warm afternoon conditions',
      meaning: 'Bring extra water and bias toward shade or shorter exposed stretches.',
      followThrough: 'After outing: quick cool-down and hydration check.',
    };
  }
  if (looksWet) {
    return {
      signal: 'Wet trail conditions likely',
      meaning: 'Expect mud and slick footing; pack a towel and plan for cleaner paws.',
      followThrough: 'After outing: towel + paw cleanup.',
    };
  }
  if (windy) {
    return {
      signal: 'Windier than usual',
      meaning: 'Keep routes simple and watch for debris, noise sensitivity, and quick weather shifts.',
      followThrough: null,
    };
  }
  if (cool) {
    return {
      signal: 'Cool, light-outing day',
      meaning: 'Good conditions for a steady outing with a basic readiness check.',
      followThrough: null,
    };
  }
  return {
    signal: 'Steady outing conditions',
    meaning: 'Run a quick pack check and keep water and turn-back judgment in mind.',
    followThrough: null,
  };
}

function headlineFromReadiness(r: HomeReadiness, weather: Extract<HomeWeatherState, { status: 'ok' }>): string {
  const blob = `${weather.forecastShort}\n${weather.summary}`.toLowerCase();
  const looksWet =
    (weather.precipChance ?? 0) >= 38 || /rain|shower|storm|drizzle/i.test(blob);
  if (looksWet) {
    return 'Good conditions with rain later—plan around it.';
  }
  if (/rain|shower/i.test(blob)) {
    return 'Mixed sky—watch timing for your walk.';
  }
  return 'Good conditions for a normal outing—stay aware as the day shifts.';
}

function toneColor(tone: TimelineTone, palette: (typeof Colors)['light']): string {
  if (tone === 'good') return palette.tint;
  if (tone === 'warn') return '#d4a017';
  return palette.textSecondary;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const router = useRouter();
  const { isPro } = useSubscription();
  const lib = getLibrary();

  const accessibleCards = lib.cards.filter((c) => canAccessPack(c.packId, isPro)).length;
  const [weather, setWeather] = useState<HomeWeatherState>({ status: 'loading' });
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);
  const [dogProfile, setDogProfile] = useState<DogProfile | null>(null);

  const bgMint = palette.readyMint ?? palette.background;

  const weatherSuggestions = useMemo(() => {
    if (weather.status !== 'ok') return [];
    return buildWeatherSuggestions(
      {
        tempF: weather.tempF,
        forecastShort: weather.forecastShort,
        summary: weather.summary,
        precipChance: weather.precipChance,
        isDaytime: weather.isDaytime,
      },
      isPro
    );
  }, [weather, isPro]);

  useEffect(() => {
    if (weather.status !== 'ok') {
      setWeatherModalOpen(false);
    }
  }, [weather.status]);

  useFocusEffect(
    useCallback(() => {
      let gone = false;
      (async () => {
        const profile = await getDogProfile();
        if (!gone) {
          setDogProfile(profile);
        }
      })();
      return () => {
        gone = true;
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      let gone = false;
      (async () => {
        const result = await fetchUsWeatherForDeviceLocation();
        if (!gone) {
          setWeather(result);
        }
      })();
      return () => {
        gone = true;
      };
    }, [])
  );

  const openSuggestion = useCallback(
    (kind: 'card' | 'checklist', id: string) => {
      setWeatherModalOpen(false);
      router.push(kind === 'card' ? `/card/${id}` : `/checklist/${id}`);
    },
    [router]
  );

  const weatherOk = weather.status === 'ok' ? weather : null;
  const readiness = weatherOk ? buildHomeReadiness(weatherOk) : null;
  const timeline = weatherOk && readiness ? buildHomeTimeline(weatherOk, readiness) : [];
  const heroLine = weatherOk && readiness ? headlineFromReadiness(readiness, weatherOk) : '';

  const checklistSuggestion = weatherSuggestions.find((s) => s.kind === 'checklist');
  const checklistCtaId = checklistSuggestion?.id ?? 'pre-trail-60s';

  const suggestedStrip = useMemo(
    () => [IMAGES.pack, IMAGES.card, IMAGES.pack, IMAGES.card],
    []
  );

  const dogName = dogProfile?.dogName?.trim() || 'Your pup';
  const placeLabel =
    weatherOk?.place ?? (weather.status === 'permission_denied' ? 'Location off' : '—');

  const weatherCardBgSource = useMemo(() => {
    if (!weatherOk) return null;
    return weatherCardBackgroundImage(weatherConditionKind(weatherOk));
  }, [weatherOk]);

  const weatherCardTint = useMemo(() => {
    if (!weatherOk) return null;
    return weatherCardStyle(weatherConditionKind(weatherOk), colorScheme);
  }, [weatherOk, colorScheme]);

  const weatherCardOverlay = useMemo(() => {
    if (!weatherCardTint) return null;
    return weatherCardImageOverlayColors(weatherCardTint.gradientColors, colorScheme);
  }, [weatherCardTint, colorScheme]);

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: bgMint }}
        contentContainerStyle={styles.container}>
        {/* Header: name + Go Pro + Alerts */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.push('/dog-profile')}
            style={({ pressed }) => [styles.headerProfile, { opacity: pressed ? 0.88 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Dog profile">
            <View style={styles.headerProfileText}>
              <Text style={[styles.headerName, { color: palette.text }]} numberOfLines={1}>
                {dogName}
              </Text>
              <Text style={[styles.headerPlace, { color: palette.textSecondary }]} numberOfLines={1}>
                {placeLabel}
              </Text>
            </View>
          </Pressable>
          <View style={styles.headerRight}>
            <Pressable
              onPress={() =>
                isPro
                  ? router.push('/(tabs)/settings')
                  : router.push({ pathname: '/paywall', params: { returnTo: '/(tabs)/home' } })
              }
              style={({ pressed }) => [
                styles.headerPill,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.surface,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={isPro ? 'Pro membership' : 'Upgrade to Pro'}>
              <Text style={[styles.headerPillLabel, { color: palette.text }]}>
                {isPro ? 'Pro' : 'Go Pro'}
              </Text>
              <View style={[styles.proBadge, { backgroundColor: isPro ? palette.tint : '#c9a227' }]}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => router.push('/reminders')}
              style={({ pressed }) => [
                styles.headerPill,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.surface,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Alerts">
              <MaterialCommunityIcons name="bell-outline" size={17} color={palette.text} />
              <Text style={[styles.headerPillLabel, { color: palette.text }]}>Alerts</Text>
            </Pressable>
          </View>
        </View>

        {/* Hero: dog photo */}
        <View style={styles.heroBlock}>
          {weather.status === 'loading' ? (
            <View style={styles.heroLoading}>
              <ActivityIndicator size="large" color={FOREST} />
              <Text style={[styles.heroLoadingText, { color: palette.textSecondary }]}>
                Getting local conditions…
              </Text>
            </View>
          ) : weather.status === 'permission_denied' ? (
            <Text style={[styles.permissionText, { color: palette.text }]}>
              Turn on location to see your timeline and weather (US).
            </Text>
          ) : weather.status === 'unavailable' ? (
            <Text style={[styles.permissionText, { color: palette.text }]}>{weather.message}</Text>
          ) : (
            <>
              <View style={styles.heroRow}>
                <Pressable
                  onPress={() => router.push('/dog-profile')}
                  accessibilityRole="button"
                  accessibilityLabel="Dog photo">
                  {dogProfile?.dogPhotoUri ? (
                    <Image
                      source={{ uri: dogProfile.dogPhotoUri }}
                      style={[styles.heroDogCircle, { borderColor: palette.border }]}
                      contentFit="cover"
                      cachePolicy="none"
                      recyclingKey={dogProfile.dogPhotoUri}
                    />
                  ) : (
                    <View style={[styles.heroDogCircle, styles.heroDogPh, { borderColor: palette.border }]}>
                      <MaterialCommunityIcons name="camera-plus" size={40} color={palette.textSecondary} />
                    </View>
                  )}
                </Pressable>
              </View>
              <Text style={[styles.readyTitle, { color: palette.text }]}>
                {dogName} Ready for Today
              </Text>
              <Text style={[styles.readySub, { color: palette.textSecondary }]}>{heroLine}</Text>
            </>
          )}
        </View>

        {/* Weather summary row — photo + condition-colored overlay + light scrim (PNGs in assets/images/weather-cards/) */}
        {weatherOk && weatherCardBgSource && weatherCardTint && weatherCardOverlay ? (
          <Pressable
            onPress={() => setWeatherModalOpen(true)}
            style={({ pressed }) => [styles.weatherCardOuter, { opacity: pressed ? 0.92 : 1 }]}>
            <ImageBackground
              source={weatherCardBgSource}
              style={styles.weatherRowImageBg}
              imageStyle={styles.weatherRowImageRadius}
              resizeMode="cover">
              <LinearGradient
                colors={weatherCardOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={WEATHER_CARD_SCRIM_COLORS}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.weatherRowInner}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[
                      styles.weatherTempBig,
                      styles.weatherCardTextShadow,
                      { color: weatherCardTint.tempColor },
                    ]}>
                    {weatherOk.tempF}°
                  </Text>
                  <Text
                    style={[
                      styles.weatherLine,
                      styles.weatherCardTextShadow,
                      { color: weatherCardTint.summaryColor },
                    ]}
                    numberOfLines={2}>
                    {weatherOk.summary}
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color={weatherCardTint.chevronColor} />
              </View>
            </ImageBackground>
          </Pressable>
        ) : null}

        {/* Timeline */}
        {timeline.length > 0 ? (
          <View style={styles.section}>
            <View style={[styles.timelineHairline, { backgroundColor: palette.border }]} />
            <Text style={[styles.sectionKicker, { color: palette.textSecondary }]}>Timeline</Text>
            {timeline.map((item, i) => (
              <View key={i} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={[styles.timelineDot, { backgroundColor: toneColor(item.tone, palette) }]} />
                  {i < timeline.length - 1 ? (
                    <View style={[styles.timelineConnector, { backgroundColor: palette.border }]} />
                  ) : null}
                </View>
                <View style={styles.timelineBody}>
                  <Text style={[styles.timelineRange, { color: palette.textSecondary }]}>
                    {item.rangeLabel}
                  </Text>
                  <Text style={[styles.timelineTitle, { color: palette.textSecondary }]}>{item.title}</Text>
                  <Text style={[styles.timelineDetail, { color: palette.tint }]}>
                    {item.detail}
                  </Text>
                </View>
              </View>
            ))}
            <View style={[styles.timelineHairline, { backgroundColor: palette.border, marginTop: 4 }]} />
          </View>
        ) : null}

        {/* Suggested strip + CTA */}
        {weatherOk ? (
          <View style={styles.section}>
            <Text style={[styles.sectionKicker, { color: palette.textSecondary }]}>Suggested</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stripScroll}
              style={{ marginBottom: 14 }}>
              {suggestedStrip.map((src, idx) => (
                <Image
                  key={idx}
                  source={src}
                  style={[styles.stripThumb, { borderColor: palette.border }]}
                  contentFit="cover"
                />
              ))}
            </ScrollView>
            <Pressable
              onPress={() => openSuggestion('checklist', checklistCtaId)}
              style={({ pressed }) => [
                styles.primaryCta,
                { backgroundColor: FOREST, opacity: pressed ? 0.92 : 1 },
              ]}>
              <Text style={styles.primaryCtaText}>Start pre-walk checklist</Text>
            </Pressable>
            <Text style={[styles.stripHint, { color: palette.textSecondary }]}>
              {accessibleCards} field cards available · tailored to today’s conditions
            </Text>
          </View>
        ) : null}

        {weather.status === 'permission_denied' ? (
          <Pressable onPress={() => Linking.openSettings()} style={styles.secondaryLink}>
            <Text style={{ color: palette.tint, fontWeight: '700' }}>Open Settings</Text>
          </Pressable>
        ) : null}

        {readiness?.followThrough && weatherOk ? (
          <View style={[styles.footerCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <Text style={[styles.sectionKicker, { color: palette.textSecondary, marginBottom: 6 }]}>
              Later / follow-through
            </Text>
            <Text style={{ color: palette.text, fontWeight: '600', fontSize: 14, lineHeight: 20 }}>
              {readiness.followThrough}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={weatherModalOpen && weather.status === 'ok'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setWeatherModalOpen(false)}>
        <SafeAreaView
          style={[styles.modalRoot, { backgroundColor: palette.background }]}
          edges={['top', 'left', 'right', 'bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Weather & suggestions</Text>
            <Pressable
              onPress={() => setWeatherModalOpen(false)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <FontAwesome name="close" size={22} color={palette.textSecondary} />
            </Pressable>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled">
            {weatherOk && weatherCardBgSource && weatherCardTint && weatherCardOverlay ? (
              <View style={[styles.modalWeatherOuter, { borderColor: palette.border }]}>
                <ImageBackground
                  source={weatherCardBgSource}
                  style={styles.modalWeatherHeroBg}
                  resizeMode="cover">
                  <LinearGradient
                    colors={weatherCardOverlay}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <LinearGradient
                    colors={WEATHER_CARD_SCRIM_COLORS}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.85, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.modalWeatherHeroInner}>
                    <View style={styles.weatherHeader}>
                      <MaterialCommunityIcons
                        name={currentWeatherIconName(weatherOk)}
                        size={26}
                        color={weatherCardTint.chevronColor}
                        style={{ marginRight: 10 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.weatherTitle,
                            styles.weatherCardTextShadow,
                            { color: weatherCardTint.tempColor, marginBottom: 0 },
                          ]}>
                          Local weather
                        </Text>
                        <Text style={{ color: weatherCardTint.summaryColor, fontSize: 13, marginTop: 2 }}>
                          {weatherOk.place}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.weatherSectionLabel,
                        { color: weatherCardTint.summaryColor, marginTop: 10, marginBottom: 6 },
                      ]}>
                      Now
                    </Text>
                    <View style={styles.weatherNowRow}>
                      <Text
                        style={[
                          styles.weatherTemp,
                          styles.weatherCardTextShadow,
                          { color: weatherCardTint.tempColor },
                        ]}>
                        {weatherOk.tempF}°
                      </Text>
                      <Text
                        style={[
                          styles.weatherSummary,
                          styles.weatherCardTextShadow,
                          {
                            color: weatherCardTint.summaryColor,
                            flex: 1,
                            marginTop: 0,
                          },
                        ]}>
                        {weatherOk.summary}
                      </Text>
                    </View>
                    {weatherOk.windLine ? (
                      <Text style={[styles.weatherMeta, { color: weatherCardTint.summaryColor, marginTop: 6 }]}>
                        Wind {weatherOk.windLine}
                      </Text>
                    ) : null}
                    {weatherOk.updatedLabel ? (
                      <Text style={[styles.weatherMeta, { color: weatherCardTint.summaryColor, marginTop: 4 }]}>
                        Updated {weatherOk.updatedLabel}
                      </Text>
                    ) : null}
                  </View>
                </ImageBackground>
                <View
                  style={[
                    styles.modalWeatherFooter,
                    {
                      backgroundColor: palette.surface,
                      borderTopColor: palette.border,
                    },
                  ]}>
                  <View style={[styles.timelineHairline, { backgroundColor: palette.border }]} />
                  <Text style={[styles.weatherSectionLabel, { color: palette.textSecondary, marginTop: 0 }]}>
                    Weekend outlook
                  </Text>
                  {weatherOk.weekendOutlook.length > 0 ? (
                    weatherOk.weekendOutlook.map((w, i) => {
                      const n = weatherOk.weekendOutlook.length;
                      const showBridge = i < n - 1;
                      const showTail = i === n - 1 && n > 1;
                      return (
                      <View key={`modal-${w.dayLabel}`} style={styles.modalWeekendRow}>
                        <View style={styles.modalWeekendRail}>
                          <View style={[styles.timelineDot, { backgroundColor: palette.tint }]} />
                          {showBridge || showTail ? (
                            <View style={[styles.modalWeekendConnector, { backgroundColor: palette.border }]} />
                          ) : null}
                        </View>
                        <View style={styles.timelineBody}>
                          <Text style={[styles.timelineRange, { color: palette.textSecondary }]}>{w.dayLabel}</Text>
                          <Text
                            style={[
                              styles.timelineTitle,
                              { color: palette.textSecondary, fontSize: 20, letterSpacing: -0.3 },
                            ]}>
                            {w.tempF}°
                          </Text>
                          <Text style={[styles.timelineDetail, { color: palette.tint }]} numberOfLines={4}>
                            {w.shortForecast}
                            {w.precipChance != null ? ` · ${w.precipChance}% precip` : ''}
                          </Text>
                        </View>
                      </View>
                      );
                    })
                  ) : (
                    <Text style={{ color: palette.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 4 }}>
                      No Sat/Sun daytime periods in the current forecast window.
                    </Text>
                  )}
                  <View style={[styles.timelineHairline, { backgroundColor: palette.border, marginTop: 4 }]} />
                  <Text style={[styles.weatherAttribution, { color: palette.textSecondary }]}>{weatherOk.sourceNote}</Text>
                </View>
              </View>
            ) : null}

            <Text style={[styles.suggestHeading, { color: palette.text, marginTop: 8, marginBottom: 4 }]}>
              Suggested for these conditions
            </Text>
            <Text style={[styles.suggestSub, { color: palette.textSecondary, marginBottom: 12 }]}>
              From temperature, precipitation chance, time of day, and forecast wording.
            </Text>
            {weatherSuggestions.length > 0 ? (
              weatherSuggestions.map((s) => (
                <Pressable
                  key={`modal-${s.kind}-${s.id}`}
                  onPress={() => openSuggestion(s.kind, s.id)}
                  style={({ pressed }) => [
                    styles.suggestRow,
                    {
                      borderColor: palette.border,
                      backgroundColor: palette.surface,
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}>
                  <FontAwesome
                    name={s.kind === 'card' ? 'file-text-o' : 'list-ul'}
                    size={18}
                    color={palette.tint}
                    style={styles.suggestIcon}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: palette.text, fontWeight: '700', fontSize: 15 }} numberOfLines={3}>
                      {s.title}
                    </Text>
                    <Text style={{ color: palette.textSecondary, fontSize: 12, lineHeight: 16, marginTop: 3 }}>
                      {s.reason}
                    </Text>
                    <Text style={{ color: palette.textSecondary, fontSize: 11, marginTop: 4, opacity: 0.85 }}>
                      {s.kind === 'card' ? 'Field card' : 'Checklist'}
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={12} color={palette.textSecondary} style={{ marginLeft: 6 }} />
                </Pressable>
              ))
            ) : (
              <Text style={{ color: palette.textSecondary, fontSize: 14, lineHeight: 20 }}>
                No picks yet — open the Field guide for full packs.
              </Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerProfile: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, gap: 12 },
  headerProfileText: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 17, fontWeight: '800' },
  headerPlace: { fontSize: 13, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerPillLabel: { fontSize: 13, fontWeight: '700' },
  proBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  heroBlock: { alignItems: 'center', marginBottom: 20 },
  heroLoading: { alignItems: 'center', paddingVertical: 24 },
  heroLoadingText: { marginTop: 12, fontSize: 14 },
  permissionText: { textAlign: 'center', fontSize: 15, lineHeight: 22, paddingHorizontal: 8 },
  heroRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
  },
  heroDogCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(45,106,79,0.08)',
  },
  heroDogPh: { alignItems: 'center', justifyContent: 'center' },
  readyTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  readySub: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8, paddingHorizontal: 8 },
  weatherCardOuter: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 22,
  },
  weatherRowImageBg: {
    width: '100%',
    minHeight: 112,
    justifyContent: 'center',
  },
  weatherRowImageRadius: {
    borderRadius: 16,
  },
  weatherRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  /** Subtle edge for temp/summary on busy photos; works with both light and dark `weatherCardTint` colors */
  weatherCardTextShadow: {
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  weatherTempBig: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  weatherLine: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  section: { marginBottom: 8 },
  sectionKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    marginBottom: 12,
  },
  timelineHairline: { height: StyleSheet.hairlineWidth, width: '100%', marginBottom: 12 },
  timelineRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  timelineRail: { width: 18, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, zIndex: 1 },
  timelineConnector: {
    width: 2,
    height: 52,
    marginTop: 3,
    borderRadius: 1,
    opacity: 0.55,
  },
  /** Modal weekend outlook: stretch rail so connector reaches the next dot; tail line under last dot */
  modalWeekendRow: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  modalWeekendRail: {
    width: 18,
    alignItems: 'center',
  },
  modalWeekendConnector: {
    width: 2,
    flexGrow: 1,
    minHeight: 20,
    marginTop: 3,
    borderRadius: 1,
    opacity: 0.55,
  },
  timelineBody: { flex: 1, paddingBottom: 12 },
  timelineRange: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  timelineTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  timelineDetail: { fontSize: 13, lineHeight: 19 },
  stripScroll: { gap: 10, paddingRight: 8 },
  stripThumb: { width: 88, height: 88, borderRadius: 14, borderWidth: 1 },
  primaryCta: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  stripHint: { fontSize: 12, lineHeight: 17, marginTop: 10, textAlign: 'center' },
  secondaryLink: { alignSelf: 'center', marginTop: 8, paddingVertical: 8 },
  footerCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 8 },
  weatherHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  weatherTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  weatherSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
    marginTop: 12,
    marginBottom: 6,
  },
  weatherNowRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  weatherTemp: { fontSize: 28, fontWeight: '800' },
  weatherSummary: { fontSize: 15, lineHeight: 22, marginTop: 10, fontWeight: '600' },
  weatherMeta: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  weatherAttribution: { fontSize: 11, lineHeight: 15, marginTop: 12 },
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalScroll: { padding: 16, paddingBottom: 32 },
  modalWeatherOuter: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  modalWeatherHeroBg: {
    width: '100%',
    minHeight: 172,
  },
  modalWeatherHeroInner: {
    padding: 16,
  },
  modalWeatherFooter: {
    padding: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  suggestHeading: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  suggestSub: { fontSize: 12, lineHeight: 16, marginBottom: 10 },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  suggestIcon: { marginRight: 12, width: 22 },
});
