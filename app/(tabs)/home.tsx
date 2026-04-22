import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useSubscription } from '@/context/SubscriptionContext';
import { canAccessPack, getChecklist, getLibrary } from '@/lib/content';
import { IMAGES } from '@/lib/contentVisuals';
import { getChecklistCheckedIds } from '@/lib/database';
import { getDogProfile, type DogProfile } from '@/lib/profile';
import { getPreparednessCadenceSnapshot } from '@/lib/readiness/cadence';
import { getReadinessState } from '@/lib/readiness/deriveReadiness';
import type { ReadinessPresentation } from '@/lib/readiness/types';
import {
  loadReadinessDaySignals,
  localCalendarDateString,
  markConditionsViewedForLocalDate,
  setPrimaryChecklistForLocalDate,
} from '@/lib/readiness/persistence';
import { buildHomeTimelineSummary, type TimelineTone } from '@/lib/weather/homeTimeline';
import { buildCompactConditionsSummaryLine } from '@/lib/weather/compactHomeSummary';
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
import { buildTimelineBarsModel, timelineBounds, timelineHourRatio } from '@/lib/weather/roadTemp';
import { useColorScheme } from '@/components/useColorScheme';

const FOREST = '#1B4332';

/** Weather narrative for timeline / hero — not product outing readiness (see `lib/readiness/`). */
type WeatherDayNarrative = {
  signal: string;
  meaning: string;
  followThrough: string | null;
};

function buildWeatherDayNarrative(weather: Extract<HomeWeatherState, { status: 'ok' }>): WeatherDayNarrative {
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

function toneColor(tone: TimelineTone, palette: (typeof Colors)['light']): string {
  if (tone === 'good') return palette.tint;
  if (tone === 'warn') return '#d4a017';
  return palette.textSecondary;
}

function formatClockFromHour(hour: number): string {
  const h = Math.max(0, Math.min(23, Math.floor(hour)));
  const suffix = h >= 12 ? 'PM' : 'AM';
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}${suffix}`;
}

function rangeLabel(startHour: number, endHour: number): string {
  return `${formatClockFromHour(startHour)} - ${formatClockFromHour(endHour)}`;
}

function roadBandLabel(band: 'safe' | 'warm' | 'hot' | 'danger'): string {
  if (band === 'safe') return 'Safe';
  if (band === 'warm') return 'Warm, check paws';
  if (band === 'hot') return 'Hot, limit time';
  return 'Dangerous for paws';
}

function roadBandColor(band: 'safe' | 'warm' | 'hot' | 'danger'): string {
  if (band === 'safe') return '#2D6A4F';
  if (band === 'warm') return '#D4A017';
  if (band === 'hot') return '#C46A2D';
  return '#B5443A';
}

function clampNum(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const router = useRouter();
  const { isPro, activeEntitlements } = useSubscription();
  const lib = getLibrary();

  const accessibleCards = lib.cards.filter((c) => canAccessPack(c.packId, isPro, activeEntitlements)).length;
  const [weather, setWeather] = useState<HomeWeatherState>({ status: 'loading' });
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);
  const [roadTempModalOpen, setRoadTempModalOpen] = useState(false);
  const [roadDetailHour, setRoadDetailHour] = useState<number | null>(null);
  const [timelineScrubHour, setTimelineScrubHour] = useState<number | null>(null);
  const [timelineBarWidth, setTimelineBarWidth] = useState(0);
  const [dogProfile, setDogProfile] = useState<DogProfile | null>(null);
  const [readinessPresentation, setReadinessPresentation] = useState<ReadinessPresentation | null>(null);

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
        dogProfile,
        sunsetTimeIso: weather.sunsetTimeIso,
        mockAqi: weather.mockAqi,
        mockRecentRain: weather.mockRecentRain,
      },
      isPro,
      activeEntitlements
    );
  }, [weather, isPro, activeEntitlements, dogProfile]);

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
  const weatherDayNarrative = weatherOk ? buildWeatherDayNarrative(weatherOk) : null;
  const timelineSummary =
    weatherOk && weatherDayNarrative ? buildHomeTimelineSummary(weatherOk, weatherDayNarrative) : [];
  const compactConditionsLine = weatherOk ? buildCompactConditionsSummaryLine(weatherOk) : '';

  const checklistSuggestion = weatherSuggestions.find((s) => s.kind === 'checklist');
  const checklistCtaId = checklistSuggestion?.id ?? 'pre-trail-60s';

  const dogName = dogProfile?.dogName?.trim() || 'Your pup';

  const refreshReadinessPresentation = useCallback(async () => {
    if (weather.status !== 'ok') {
      setReadinessPresentation(null);
      return;
    }
    const date = localCalendarDateString();
    await setPrimaryChecklistForLocalDate(date, checklistCtaId);
    const signals = await loadReadinessDaySignals(date);
    const checked = await getChecklistCheckedIds(checklistCtaId);
    const cl = getChecklist(checklistCtaId);
    const totalItems = cl?.items.length ?? 0;
    const completedItems = checked.size;
    const cadence = await getPreparednessCadenceSnapshot();
    const pres = getReadinessState({
      localDate: date,
      conditionsViewedToday: signals.conditionsViewedToday,
      checklistOpenedToday: signals.checklistOpenedToday,
      completedItems,
      totalItems,
      dogName,
      useDogFirstTone: false,
      careRemindersOnTrack: cadence.careRemindersOnTrack,
      primaryChecklistId: checklistCtaId,
    });
    setReadinessPresentation(pres);
  }, [weather.status, checklistCtaId, dogName]);

  useFocusEffect(
    useCallback(() => {
      refreshReadinessPresentation().catch(() => {});
      return undefined;
    }, [refreshReadinessPresentation])
  );

  useEffect(() => {
    if (!weatherModalOpen || weather.status !== 'ok') return;
    markConditionsViewedForLocalDate(localCalendarDateString()).catch(() => {});
    refreshReadinessPresentation().catch(() => {});
  }, [weatherModalOpen, weather.status, refreshReadinessPresentation]);

  useEffect(() => {
    if (weather.status !== 'ok') return;
    refreshReadinessPresentation().catch(() => {});
  }, [weather.status, checklistCtaId, refreshReadinessPresentation]);

  const suggestedStrip = useMemo(
    () => [IMAGES.pack, IMAGES.card, IMAGES.pack, IMAGES.card],
    []
  );

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

  const timelineBars = useMemo(() => {
    if (!weatherOk || !weatherOk.hourlySamples.length) return null;
    return buildTimelineBarsModel({
      hourly: weatherOk.hourlySamples,
      latitude: weatherOk.latitude,
    });
  }, [weatherOk]);
  const timelineAxis = timelineBounds();
  const roadDetailHours = useMemo(() => Array.from({ length: 24 }, (_, hour) => hour), []);
  const scrubMovedRef = useRef(false);
  const scrubStartXRef = useRef(0);
  const scrubStartTsRef = useRef(0);
  const bestWindowPrimary = timelineBars?.bestWindowSegments?.[0] ?? null;
  const bestWindowLabel = bestWindowPrimary
    ? rangeLabel(bestWindowPrimary.startHour, bestWindowPrimary.endHour)
    : 'No cool daylight window';
  const daylightStart = timelineBars?.daylightSegments?.[0]?.startHour ?? null;
  const daylightEnd = timelineBars?.daylightSegments?.[timelineBars.daylightSegments.length - 1]?.endHour ?? null;
  const scrubPoint = useMemo(() => {
    if (!timelineBars || timelineScrubHour == null) return null;
    if (!timelineBars.points.length) return null;
    let best = timelineBars.points[0];
    let bestDist = Math.abs(best.hour - timelineScrubHour);
    for (const p of timelineBars.points) {
      const d = Math.abs(p.hour - timelineScrubHour);
      if (d < bestDist) {
        best = p;
        bestDist = d;
      }
    }
    return best;
  }, [timelineBars, timelineScrubHour]);
  const roadDetailPoint = useMemo(() => {
    if (!timelineBars || !timelineBars.points.length) return null;
    const target = roadDetailHour ?? Math.round(timelineBars.currentHourPosition);
    let best = timelineBars.points[0];
    let dist = Math.abs(best.hour - target);
    for (const p of timelineBars.points) {
      const d = Math.abs(p.hour - target);
      if (d < dist) {
        best = p;
        dist = d;
      }
    }
    return best;
  }, [timelineBars, roadDetailHour]);
  const selectedRoadDetailHour = useMemo(() => {
    const fallback = timelineBars ? Math.round(timelineBars.currentHourPosition) : 12;
    const selected = roadDetailHour ?? fallback;
    return ((selected % 24) + 24) % 24;
  }, [roadDetailHour, timelineBars]);
  const petRoadInsight = useMemo(() => {
    if (!roadDetailPoint) {
      return {
        title: `${dogName}'s outing cue`,
        body: 'Pick an hour to see paw comfort guidance for your pup.',
      };
    }

    const hourText = formatClockFromHour(selectedRoadDetailHour);
    if (roadDetailPoint.roadBand === 'safe') {
      return {
        title: `${dogName} has a paw-friendly window`,
        body: `${hourText} looks comfortable for pavement contact. Great moment for a longer sniff walk.`,
      };
    }
    if (roadDetailPoint.roadBand === 'warm') {
      return {
        title: `${dogName} can go with a heat check`,
        body: `${hourText} is warming up. Favor shade, carry water, and keep the route shorter on asphalt.`,
      };
    }
    if (roadDetailPoint.roadBand === 'hot') {
      return {
        title: `${dogName} needs a cooler surface`,
        body: `${hourText} may feel hot on paws. Choose grass-first routes and quick potty breaks.`,
      };
    }
    return {
      title: `${dogName} is better off waiting`,
      body: `${hourText} is risky for paws. Try again near ${bestWindowLabel} or pick a shaded grass area.`,
    };
  }, [roadDetailPoint, dogName, selectedRoadDetailHour, bestWindowLabel]);
  const scrubPopupLeftPx = useMemo(() => {
    if (!scrubPoint || timelineBarWidth <= 0) return 0;
    const popupWidth = 132;
    const centerPx = timelineHourRatio(scrubPoint.hour) * timelineBarWidth;
    return clampNum(centerPx - popupWidth / 2, 0, Math.max(0, timelineBarWidth - popupWidth));
  }, [scrubPoint, timelineBarWidth]);

  const timelinePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const x = evt.nativeEvent.locationX;
          scrubMovedRef.current = false;
          scrubStartXRef.current = x;
          scrubStartTsRef.current = Date.now();
          const hour =
            timelineAxis.startHour +
            (timelineAxis.endHour - timelineAxis.startHour) *
              Math.max(0, Math.min(1, timelineBarWidth > 0 ? x / timelineBarWidth : 0));
          setTimelineScrubHour(hour);
        },
        onPanResponderMove: (evt, gesture) => {
          if (Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6) scrubMovedRef.current = true;
          const x = evt.nativeEvent.locationX;
          const hour =
            timelineAxis.startHour +
            (timelineAxis.endHour - timelineAxis.startHour) *
              Math.max(0, Math.min(1, timelineBarWidth > 0 ? x / timelineBarWidth : 0));
          setTimelineScrubHour(hour);
        },
        onPanResponderRelease: () => {
          const tapDuration = Date.now() - scrubStartTsRef.current;
          const wasTap = !scrubMovedRef.current && tapDuration < 260;
          setTimelineScrubHour(null);
          if (wasTap) setRoadTempModalOpen(true);
        },
        onPanResponderTerminate: () => {
          setTimelineScrubHour(null);
        },
      }),
    [timelineAxis.endHour, timelineAxis.startHour, timelineBarWidth]
  );

  const onReadinessPrimaryCta = useCallback(() => {
    if (!readinessPresentation) return;
    if (readinessPresentation.ctaAction.kind === 'open_weather') {
      setWeatherModalOpen(true);
    } else {
      router.push(`/checklist/${readinessPresentation.ctaAction.checklistId}`);
    }
  }, [readinessPresentation, router]);

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: bgMint }}
        contentContainerStyle={styles.container}>
        {/* A. Identity strip — name + place; utilities stay quiet */}
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
              onPress={() => router.push('/reminders')}
              style={({ pressed }) => [styles.headerIconBtn, { opacity: pressed ? 0.75 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Alerts">
              <MaterialCommunityIcons name="bell-outline" size={22} color={palette.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() =>
                isPro
                  ? router.push('/(tabs)/settings')
                  : router.push({ pathname: '/paywall', params: { returnTo: '/(tabs)/home' } })
              }
              style={({ pressed }) => [styles.headerProQuiet, { opacity: pressed ? 0.75 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={isPro ? 'Pro membership' : 'Upgrade to Pro'}>
              <Text style={[styles.headerProQuietText, { color: palette.textSecondary }]}>
                {isPro ? 'Pro' : 'Go Pro'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* B. Hero — one story: readiness title, one support line, one CTA */}
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
            <View style={styles.heroRowSplit}>
              <Pressable
                onPress={() => router.push('/dog-profile')}
                style={styles.heroPhotoCol}
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
                    <MaterialCommunityIcons name="camera-plus" size={44} color={palette.textSecondary} />
                  </View>
                )}
              </Pressable>
              {readinessPresentation ? (
                <View style={styles.heroReadinessCol}>
                  <Text style={[styles.readinessFieldLabel, { color: palette.textSecondary }]}>Status</Text>
                  <Text style={[styles.readinessHeadline, { color: palette.text }]}>
                    {readinessPresentation.title}
                  </Text>
                  <Text
                    style={[styles.readinessFieldLabel, { color: palette.textSecondary, marginTop: 8 }]}>
                    Details
                  </Text>
                  <Text style={[styles.readinessSub, { color: palette.textSecondary }]}>
                    {readinessPresentation.subtitle}
                  </Text>
                  {timelineBars ? (
                    <Pressable
                      onPress={() => setRoadTempModalOpen(true)}
                      style={({ pressed }) => [
                        styles.bestWindowInline,
                        {
                          borderColor: palette.border,
                          backgroundColor: palette.surface,
                          opacity: pressed ? 0.92 : 1,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Best window ${bestWindowLabel}. Open road temperature details`}>
                      <Text style={[styles.bestWindowInlineLabel, { color: palette.textSecondary }]}>Best window</Text>
                      <Text style={[styles.bestWindowInlineValue, { color: palette.text }]}>{bestWindowLabel}</Text>
                      <FontAwesome name="chevron-right" size={12} color={palette.textSecondary} />
                    </Pressable>
                  ) : null}
                  <View style={styles.readinessCtaRow}>
                    <Pressable
                      onPress={onReadinessPrimaryCta}
                      style={({ pressed }) => [
                        styles.readinessPrimaryCta,
                        { backgroundColor: FOREST, opacity: pressed ? 0.92 : 1 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={readinessPresentation.ctaLabel}>
                      <Text style={styles.readinessPrimaryCtaText}>{readinessPresentation.ctaLabel}</Text>
                    </Pressable>
                    {readinessPresentation.careChipLabel ? (
                      <View
                        style={[
                          styles.readinessChip,
                          { borderColor: palette.border, backgroundColor: palette.surface },
                        ]}>
                        <Text style={[styles.readinessChipText, { color: palette.textSecondary }]}>
                          {readinessPresentation.careChipLabel}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : (
                <View style={[styles.heroReadinessCol, styles.heroReadinessPlaceholder]}>
                  <ActivityIndicator size="small" color={FOREST} />
                </View>
              )}
            </View>
          )}
        </View>

        {/* C. Compact conditions (opens detail — full hero imagery lives in the modal) */}
        {weatherOk ? (
          <Pressable
            onPress={() => setWeatherModalOpen(true)}
            style={({ pressed }) => [
              styles.compactConditionsRow,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Weather details and suggestions">
            <MaterialCommunityIcons
              name={currentWeatherIconName(weatherOk)}
              size={18}
              color={palette.tint}
              style={{ marginRight: 10 }}
            />
            <Text
              style={[styles.compactConditionsText, { color: palette.text }]}
              numberOfLines={2}>
              {compactConditionsLine}
            </Text>
            <FontAwesome name="chevron-right" size={12} color={palette.textSecondary} style={{ marginLeft: 8 }} />
          </Pressable>
        ) : null}

        {/* D. Interpretation — best window + next change only */}
        {timelineSummary.length > 0 ? (
          <View style={styles.interpretSection}>
            <Text style={[styles.interpretSectionKicker, { color: palette.textSecondary }]}>
              Today’s plan
            </Text>
            {timelineSummary.map((row, i) => (
              <View
                key={`${row.sectionLabel}-${i}`}
                style={[
                  styles.interpretRow,
                  { borderBottomColor: palette.border },
                  i === timelineSummary.length - 1 ? styles.interpretRowLast : null,
                ]}>
                <View style={styles.interpretRowLeft}>
                  <View style={[styles.interpretDot, { backgroundColor: toneColor(row.tone, palette) }]} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.interpretLabel, { color: palette.textSecondary }]}>
                      {row.sectionLabel}
                    </Text>
                    <Text style={[styles.interpretRange, { color: palette.text }]}>{row.rangeLabel}</Text>
                    <Text style={[styles.interpretBody, { color: palette.textSecondary }]} numberOfLines={3}>
                      {row.body}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {timelineBars ? (
          <View
            style={[
              styles.timelineBarsCard,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
              },
            ]}>
            <ImageBackground
              source={weatherCardBgSource ?? undefined}
              style={styles.timelineBarsBg}
              imageStyle={styles.timelineBarsBgImage}
              resizeMode="cover">
              <LinearGradient
                colors={['rgba(8,16,12,0.22)', 'rgba(8,16,12,0.52)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.timelineBarsHeader}>
                <Text style={[styles.timelineBarsTitle, { color: palette.text }]}>Today&apos;s timeline</Text>
                <Text style={[styles.timelineDragHint, { color: palette.textSecondary }]}>Drag to inspect</Text>
              </View>
              <View
                style={styles.timelineBarsWrap}
                onLayout={(e) => {
                  setTimelineBarWidth(e.nativeEvent.layout.width);
                }}
                {...timelinePanResponder.panHandlers}>
              {scrubPoint ? (
                <View
                  style={[
                    styles.timelineScrubPopup,
                    {
                      left: scrubPopupLeftPx,
                      borderColor: palette.border,
                      backgroundColor: palette.surface,
                    },
                  ]}>
                  <Text style={[styles.timelineScrubTime, { color: palette.text }]}>{formatClockFromHour(scrubPoint.hour)}</Text>
                  <Text style={[styles.timelineScrubTemp, { color: palette.textSecondary }]}>
                    Pavement {Math.round(scrubPoint.roadTempF)}F
                  </Text>
                  <Text style={[styles.timelineScrubBand, { color: palette.textSecondary }]}>
                    {roadBandLabel(scrubPoint.roadBand)}
                  </Text>
                </View>
              ) : null}
              {timelineBars.bestWindowSegments.map((seg, idx) => {
                const left = `${timelineHourRatio(seg.startHour) * 100}%`;
                const width = `${(timelineHourRatio(seg.endHour) - timelineHourRatio(seg.startHour)) * 100}%`;
                return (
                  <View
                    key={`best-${idx}`}
                    style={[styles.timelineBestOverlay, { left: left as unknown as number, width: width as unknown as number }]}
                  />
                );
              })}
              <View
                style={[
                  styles.timelineNowLine,
                  {
                    left: `${timelineHourRatio(timelineBars.currentHourPosition) * 100}%` as unknown as number,
                  },
                ]}
              />

              <Text style={[styles.barLabel, { color: palette.textSecondary }]}>Daylight</Text>
              <View style={[styles.barTrack, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                {timelineBars.daylightSegments.map((seg, idx) => {
                  const left = `${timelineHourRatio(seg.startHour) * 100}%`;
                  const width = `${(timelineHourRatio(seg.endHour) - timelineHourRatio(seg.startHour)) * 100}%`;
                  return (
                    <View
                      key={`day-${idx}`}
                      style={[
                        styles.barSegment,
                        { left: left as unknown as number, width: width as unknown as number, backgroundColor: 'rgba(221, 208, 165, 0.88)' },
                      ]}
                    />
                  );
                })}
              </View>

              <Text style={[styles.barLabel, { color: palette.textSecondary, marginTop: 10 }]}>Road temp</Text>
              <View style={[styles.barTrack, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                {timelineBars.points.map((p) => {
                  const left = `${timelineHourRatio(p.hour) * 100}%`;
                  const width = `${(timelineHourRatio(p.hour + 1) - timelineHourRatio(p.hour)) * 100}%`;
                  let color = '#2D6A4F';
                  if (p.roadBand === 'warm') color = '#D4A017';
                  if (p.roadBand === 'hot') color = '#C46A2D';
                  if (p.roadBand === 'danger') color = '#B5443A';
                  return (
                    <View
                      key={`road-${p.hour}`}
                      style={[
                        styles.barSegment,
                        { left: left as unknown as number, width: width as unknown as number, backgroundColor: color },
                      ]}
                    />
                  );
                })}
              </View>

              {timelineBars.bestWindowSegments.length > 0 ? (
                <Text style={styles.bestWindowLabel}>Best window</Text>
              ) : null}
              </View>

              <View style={styles.timelineAxisRow}>
                {[timelineAxis.startHour, 9, 13, 17, timelineAxis.endHour].map((h) => (
                  <Text key={`axis-${h}`} style={[styles.timelineAxisLabel, { color: palette.textSecondary }]}>
                    {h === 13 ? '1p' : h === 17 ? '5p' : h === 9 ? '9a' : h === 22 ? '10p' : '5a'}
                  </Text>
                ))}
              </View>
              <Pressable
                onPress={() => setRoadTempModalOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Open road temperature timeline details"
                style={styles.timelineDetailLink}>
                <Text style={[styles.timelineDetailLinkText, { color: palette.textSecondary }]}>
                  Road temp is estimated from NWS conditions. Tap for details.
                </Text>
              </Pressable>
            </ImageBackground>
          </View>
        ) : null}

        {/* Suggested strip + CTA */}
        {weatherOk ? (
          <View style={styles.sectionSuggested}>
            <Text style={[styles.sectionKickerMuted, { color: palette.textSecondary }]}>Explore</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stripScroll}
              style={{ marginBottom: 10 }}>
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
              onPress={() => setWeatherModalOpen(true)}
              style={({ pressed }) => [
                styles.suggestedSecondaryCta,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.surface,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open weather and suggestions">
              <Text style={[styles.suggestedSecondaryCtaText, { color: palette.tint }]}>
                More suggestions in weather
              </Text>
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

        {weatherDayNarrative?.followThrough && weatherOk ? (
          <Text style={[styles.followThroughNote, { color: palette.textSecondary }]}>
            {weatherDayNarrative.followThrough}
          </Text>
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
                  onPress={() => {
                    if (s.locked) {
                      setWeatherModalOpen(false);
                      router.push({ pathname: '/paywall', params: { returnTo: '/(tabs)/home' } });
                    } else {
                      openSuggestion(s.kind, s.id);
                    }
                  }}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Text style={{ color: palette.textSecondary, fontSize: 11, opacity: 0.85 }}>
                        {s.kind === 'card' ? 'Field card' : 'Checklist'}
                      </Text>
                      {s.locked ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderColor: palette.tint, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <MaterialCommunityIcons name="lock" size={10} color={palette.tint} />
                          <Text style={{ color: palette.tint, fontSize: 10, fontWeight: '700' }}>Pro</Text>
                        </View>
                      ) : null}
                    </View>
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

      <Modal
        visible={roadTempModalOpen && !!timelineBars}
        animationType="slide"
        presentationStyle="pageSheet"
        onShow={() => {
          if (timelineBars?.points.length) {
            setRoadDetailHour(Math.round(timelineBars.currentHourPosition));
          }
        }}
        onRequestClose={() => setRoadTempModalOpen(false)}>
        <SafeAreaView
          style={[styles.modalRoot, { backgroundColor: palette.background }]}
          edges={['top', 'left', 'right', 'bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Road temp details</Text>
            <Pressable
              onPress={() => setRoadTempModalOpen(false)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <FontAwesome name="close" size={22} color={palette.textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalScroll}>
            <View
              style={[
                styles.petInsightCardLarge,
                { borderColor: palette.border, backgroundColor: palette.surface },
              ]}>
              {dogProfile?.dogPhotoUri ? (
                <Image
                  source={{ uri: dogProfile.dogPhotoUri }}
                  style={[styles.petInsightPhotoLarge, { borderColor: palette.border }]}
                  recyclingKey={dogProfile.dogPhotoUri}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[
                    styles.petInsightPhotoLarge,
                    styles.petInsightPhotoFallback,
                    { borderColor: palette.border },
                  ]}>
                  <MaterialCommunityIcons name="dog-side" size={30} color={palette.textSecondary} />
                </View>
              )}
              <View style={styles.petInsightTextWrapLarge}>
                <Text style={[styles.petInsightTitleLarge, { color: palette.text }]}>{petRoadInsight.title}</Text>
                <Text style={[styles.petInsightBodyLarge, { color: palette.textSecondary }]}>{petRoadInsight.body}</Text>
                <Text style={[styles.petInsightMeta, { color: palette.textSecondary }]}>
                  Based on {formatClockFromHour(selectedRoadDetailHour)} and current weather inputs.
                </Text>
              </View>
            </View>
            <ImageBackground
              source={weatherCardBgSource ?? undefined}
              style={[styles.detailHeroCard, { borderColor: palette.border }]}
              imageStyle={styles.detailCardBgImage}
              resizeMode="cover">
              <LinearGradient
                colors={weatherCardOverlay ?? ['rgba(8,16,12,0.2)', 'rgba(8,16,12,0.62)']}
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
              <View style={styles.detailCardInner}>
                <Text style={[styles.detailCardTitle, { color: palette.text }]}>Best window</Text>
                <Text style={[styles.detailCardValue, { color: palette.text }]}>{bestWindowLabel}</Text>
                <Text style={[styles.detailCardSub, { color: palette.textSecondary }]}>
                  Daylight
                  {daylightStart != null && daylightEnd != null ? `: ${rangeLabel(daylightStart, daylightEnd)}` : ': unavailable'}
                </Text>

                <View style={[styles.detailDivider, { backgroundColor: palette.border }]} />

                <Text style={[styles.detailCardTitle, { color: palette.text }]}>Time vs pavement temp</Text>
                {roadDetailPoint ? (
                  <View style={styles.roadDetailSelected}>
                    <Text style={[styles.roadDetailSelectedTime, { color: palette.text }]}>
                      {formatClockFromHour(selectedRoadDetailHour)}
                    </Text>
                    <View
                      style={[
                        styles.roadDetailBadge,
                        { backgroundColor: roadBandColor(roadDetailPoint.roadBand) },
                      ]}>
                      <Text style={styles.roadDetailBadgeText}>{Math.round(roadDetailPoint.roadTempF)}F</Text>
                    </View>
                    <Text style={[styles.roadDetailSelectedBand, { color: palette.textSecondary }]}>
                      {roadBandLabel(roadDetailPoint.roadBand)}
                    </Text>
                  </View>
                ) : null}
                <View style={[styles.roadDetailSpinner, { borderColor: palette.border }]}>
                  <Pressable
                    onPress={() => setRoadDetailHour((selectedRoadDetailHour + 23) % 24)}
                    style={[styles.roadDetailSpinnerBtn, { borderRightColor: palette.border }]}
                    accessibilityRole="button"
                    accessibilityLabel="Previous hour">
                    <FontAwesome name="chevron-left" size={14} color={palette.textSecondary} />
                  </Pressable>
                  <View style={styles.roadDetailSpinnerCenter}>
                    <Text style={[styles.roadDetailSpinnerValue, { color: palette.text }]}>
                      {formatClockFromHour(selectedRoadDetailHour)}
                    </Text>
                    <Text style={[styles.roadDetailSpinnerLabel, { color: palette.textSecondary }]}>
                      Hour {selectedRoadDetailHour.toString().padStart(2, '0')}:00
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setRoadDetailHour((selectedRoadDetailHour + 1) % 24)}
                    style={[styles.roadDetailSpinnerBtn, { borderLeftColor: palette.border }]}
                    accessibilityRole="button"
                    accessibilityLabel="Next hour">
                    <FontAwesome name="chevron-right" size={14} color={palette.textSecondary} />
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.roadDetailHourRail}>
                  {roadDetailHours.map((hour) => {
                    const active = hour === selectedRoadDetailHour;
                    return (
                      <Pressable
                        key={`hour-spin-${hour}`}
                        onPress={() => setRoadDetailHour(hour)}
                        style={[
                          styles.roadDetailHourPill,
                          {
                            borderColor: active ? palette.tint : palette.border,
                            backgroundColor: active ? 'rgba(45,106,79,0.22)' : 'rgba(255,255,255,0.05)',
                          },
                        ]}>
                        <Text style={[styles.roadDetailHourPillText, { color: palette.text }]}>
                          {hour.toString().padStart(2, '0')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Text style={[styles.detailCardSub, { color: palette.textSecondary, marginTop: 6 }]}>
                  Spinner includes all day hours (00 to 23). Timeline estimates are anchored to 5AM to 10PM forecast samples.
                </Text>

                <View style={[styles.detailDivider, { backgroundColor: palette.border }]} />

                <Text style={[styles.detailCardTitle, { color: palette.text }]}>Paw safety rule of thumb</Text>
                <Text style={[styles.detailRuleText, { color: palette.text }]}>
                  If you cannot hold your hand on the pavement for 7 seconds, it is too hot for paws.
                </Text>
                <Text style={[styles.detailFormula, { color: palette.textSecondary, marginTop: 12 }]}>
                  daytime road temp = air temp + (solar intensity x 4.5) - (wind mph x 0.6)
                </Text>
                <Text style={[styles.detailFormula, { color: palette.textSecondary, marginTop: 4 }]}>
                  at night road temp = air temp - 3
                </Text>
              </View>
            </ImageBackground>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerProfile: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, gap: 12 },
  headerProfileText: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 16, fontWeight: '800' },
  headerPlace: { fontSize: 12, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  headerProQuiet: { paddingHorizontal: 8, paddingVertical: 8 },
  headerProQuietText: { fontSize: 12, fontWeight: '600' },
  heroBlock: { alignItems: 'stretch', marginBottom: 12, width: '100%' },
  heroLoading: { alignItems: 'center', paddingVertical: 20 },
  heroLoadingText: { marginTop: 12, fontSize: 14 },
  permissionText: { textAlign: 'center', fontSize: 15, lineHeight: 22, paddingHorizontal: 8 },
  heroRowSplit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    gap: 12,
  },
  heroPhotoCol: { flexShrink: 0 },
  heroReadinessCol: { flex: 1, minWidth: 0, paddingTop: 2 },
  heroReadinessPlaceholder: { justifyContent: 'center', minHeight: 144 },
  heroDogCircle: {
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(45,106,79,0.08)',
  },
  heroDogPh: { alignItems: 'center', justifyContent: 'center' },
  readinessFieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
    marginBottom: 3,
  },
  readinessHeadline: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'left',
    lineHeight: 24,
  },
  readinessSub: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'left',
    marginTop: 2,
  },
  bestWindowInline: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bestWindowInlineLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  bestWindowInlineValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  readinessCtaRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  readinessPrimaryCta: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  readinessPrimaryCtaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  readinessChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  readinessChipText: { fontSize: 12, fontWeight: '700' },
  compactConditionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  compactConditionsText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  interpretSection: { marginBottom: 14 },
  interpretSectionKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  interpretRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  interpretRowLast: { borderBottomWidth: 0 },
  interpretRowLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  interpretDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  interpretLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' as const },
  interpretRange: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  interpretBody: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  timelineBarsCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  timelineBarsBg: {
    borderRadius: 10,
    overflow: 'visible',
    padding: 10,
  },
  timelineBarsBgImage: {
    borderRadius: 10,
    opacity: 0.95,
  },
  timelineBarsHeader: { marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timelineBarsTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
  timelineDragHint: { fontSize: 11, fontWeight: '700' },
  timelineBarsWrap: { position: 'relative' },
  timelineScrubPopup: {
    position: 'absolute',
    top: -68,
    width: 132,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    zIndex: 8,
    backgroundColor: 'rgba(13,31,23,0.95)',
  },
  timelineScrubTime: { fontSize: 13, fontWeight: '800' },
  timelineScrubTemp: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  timelineScrubBand: { fontSize: 11, marginTop: 2, lineHeight: 14 },
  timelineBestOverlay: {
    position: 'absolute',
    top: 8,
    bottom: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(45,106,79,0.18)',
    zIndex: 1,
  },
  timelineNowLine: {
    position: 'absolute',
    top: 6,
    bottom: 24,
    width: 1.5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    zIndex: 4,
  },
  barLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' as const, marginBottom: 6 },
  barTrack: {
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 2,
  },
  barSegment: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  bestWindowLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#2D6A4F',
    zIndex: 5,
  },
  timelineAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timelineAxisLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  timelineDetailLink: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  timelineDetailLinkText: {
    fontSize: 11,
    lineHeight: 15,
    textDecorationLine: 'underline',
  },
  detailCard: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  detailHeroCard: {
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  detailCardBgImage: {
    opacity: 0.95,
  },
  detailCardInner: {
    padding: 14,
  },
  detailCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  detailCardValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  detailCardSub: {
    fontSize: 13,
    lineHeight: 19,
  },
  detailFormula: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  detailRuleText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  roadDetailSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  roadDetailSelectedTime: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  roadDetailSelectedBand: {
    fontSize: 13,
    fontWeight: '600',
  },
  roadDetailBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roadDetailBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  roadDetailSpinner: {
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    marginBottom: 10,
  },
  roadDetailSpinnerBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'transparent',
    borderWidth: 1,
  },
  roadDetailSpinnerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  roadDetailSpinnerValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  roadDetailSpinnerLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  roadDetailHourRail: {
    gap: 6,
    paddingBottom: 2,
  },
  roadDetailHourPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 40,
    alignItems: 'center',
  },
  roadDetailHourPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  petInsightCardLarge: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  petInsightPhotoLarge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    overflow: 'hidden',
  },
  petInsightPhotoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  petInsightTextWrapLarge: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  petInsightTitleLarge: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  petInsightBodyLarge: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  petInsightMeta: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 6,
    opacity: 0.9,
  },
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: 14,
    opacity: 0.8,
  },
  followThroughNote: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  /** Subtle edge for temp/summary on busy photos; works with both light and dark `weatherCardTint` colors */
  weatherCardTextShadow: {
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  section: { marginBottom: 8 },
  sectionSuggested: { marginBottom: 6 },
  sectionKickerMuted: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
    opacity: 0.85,
  },
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
  suggestedSecondaryCta: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  suggestedSecondaryCtaText: { fontWeight: '800', fontSize: 15 },
  stripHint: { fontSize: 12, lineHeight: 17, marginTop: 8, textAlign: 'center' },
  secondaryLink: { alignSelf: 'center', marginTop: 8, paddingVertical: 8 },
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
