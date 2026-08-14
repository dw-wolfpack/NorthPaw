import { getTabScrollPadding } from '@/lib/layout';
import type { ReadinessPresentation } from '@/lib/readiness/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import AnimatedReanimated, { ZoomIn, FadeIn, FadeOut, withRepeat, withSequence, withTiming, useSharedValue, useDerivedValue, useAnimatedStyle, LinearTransition } from 'react-native-reanimated';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  AppStateStatus,
  Easing,
  ImageBackground,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Dimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurMask, Canvas, Circle, Path, Skia, RoundedRect, Rect, Group, SweepGradient } from '@shopify/react-native-skia';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { FeedbackModal, type FeedbackType } from '@/components/FeedbackModal';
import { useSubscription } from '@/context/SubscriptionContext';
import { canAccessPack, getChecklist, getLibrary } from '@/lib/content';
import { IMAGES } from '@/lib/contentVisuals';
import { getChecklistCheckedIds } from '@/lib/database';
import { getDogProfile, toggleGearVaultItem, type DogProfile } from '@/lib/profile';
import { getPreparednessCadenceSnapshot } from '@/lib/readiness/cadence';
import { getReadinessState } from '@/lib/readiness/deriveReadiness';
import { trackEvent, setUserProperties, incrementUserProperties } from '@/lib/analytics';
import { ReviewPromptModal } from '@/components/ReviewPromptModal';
import { REQUIRED_DISCLAIMER_VERSION } from '@/constants/Legal';
import { recordUsageDay, checkReviewEligibility, getReviewData, markShownThisSession } from '@/lib/reviewPrompt';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  loadReadinessDaySignals,
  localCalendarDateString,
  markConditionsViewedForLocalDate,
  setPrimaryChecklistForLocalDate,
} from '@/lib/readiness/persistence';
import { buildHomeTimelineSummary, type TimelineTone } from '@/lib/weather/homeTimeline';
import { buildCompactConditionsSummaryLine } from '@/lib/weather/compactHomeSummary';
import { fetchWeatherForDeviceLocation } from '@/lib/weather/weatherDispatcher';
import { type HomeWeatherState } from '@/lib/weather/nwsWeather';
import { currentWeatherIconName } from '@/lib/weather/currentWeatherIcon';
import {
  WEATHER_CARD_SCRIM_COLORS,
  weatherCardImageOverlayColors,
  weatherCardStyle,
} from '@/lib/weather/weatherCardBackground';
import { weatherCardBackgroundImage } from '@/lib/weather/weatherCardBackgroundImages';
import { weatherConditionKind } from '@/lib/weather/weatherConditionKind';
import { buildWeatherSuggestions } from '@/lib/weather/weatherSuggestions';
import { buildTimelineBarsModel, timelineBounds, timelineHourRatio, type SurfaceType, estimateRoadTempF, roadBandForTemp, type RangeSegment, type RoadTempBand } from '@/lib/weather/roadTemp';
import { useColorScheme } from '@/components/useColorScheme';
import { ShareCard } from '@/components/ShareCard';
import { ShareButton } from '@/components/ShareButton';
import { useShareCard } from '@/hooks/useShareCard';
import { getActiveOuting, startOuting, cancelActiveOuting, extendActiveOuting, type ActiveOuting } from '@/lib/outings';
import * as Notifications from 'expo-notifications';

const FOREST = '#1B4332';
const SAFETY_GREEN = '#2ECC71';
const RISK_AMBER = '#D97706';

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

function formatClockQuarterHour(hour: number): string {
  const normalized = ((hour % 24) + 24) % 24;
  const totalMinutes = Math.round(normalized * 60 / 15) * 15;
  const wrappedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h24 = Math.floor(wrappedMinutes / 60);
  const m = wrappedMinutes % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function rangeLabel(startHour: number, endHour: number): string {
  return `${formatClockFromHour(startHour)} - ${formatClockFromHour(endHour)}`;
}

function npiBandLabel(score: number): string {
  if (score <= 3.0) return 'Green (Low Risk)';
  if (score <= 5.0) return 'Amber (Caution)';
  if (score <= 7.5) return 'Ember (High Risk)';
  return 'Crimson (Danger)';
}

function npiBandColor(score: number): string {
  if (score <= 3.0) return SAFETY_GREEN;
  if (score <= 5.0) return RISK_AMBER;
  if (score <= 7.5) return '#E67E22'; // Ember
  return '#C0392B'; // Crimson
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

function dogRiskMultiplier(profile: DogProfile | null): number {
  let m = 1;
  if (profile?.dogSnoutProfile === 'flat') m *= 1.15;
  if (profile?.dogCoatType === 'Double') m *= 1.1;
  return m;
}

function activityWindowReduction(profile: DogProfile | null): number {
  return profile?.dogActivityBaseline === 'high' ? 0.2 : 0;
}

function clampUnit(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function riskBand(score: number): { label: 'Green' | 'Amber' | 'Ember'; color: string; dimColor: string; pulseMs: number; minPulse: number } {
  if (score <= 3.3) return { label: 'Green', color: '#2ECC71', dimColor: 'rgba(46, 204, 113, 0.15)', pulseMs: 2200, minPulse: 0.40 };
  if (score <= 6.6) return { label: 'Amber', color: '#F39C12', dimColor: 'rgba(243, 156, 18, 0.15)', pulseMs: 1500, minPulse: 0.40 };
  return { label: 'Ember', color: '#C46A2D', dimColor: 'rgba(196, 106, 45, 0.15)', pulseMs: 950, minPulse: 0.40 };
}

function confidenceBadge(weather: Extract<HomeWeatherState, { status: 'ok' }> | null): {
  label: 'High' | 'Medium' | 'Fair';
  detail: string;
} | null {
  if (!weather) return null;
  const dist = weather.stationDistanceMiles;
  const ageMinutes =
    weather.updatedIso && Number.isFinite(new Date(weather.updatedIso).getTime())
      ? (Date.now() - new Date(weather.updatedIso).getTime()) / 60000
      : null;
  if (dist != null && dist < 5 && ageMinutes != null && ageMinutes < 30) {
    return { label: 'High', detail: '<5 mi, <30m old' };
  }
  if (dist != null && dist >= 5 && dist <= 15) {
    return { label: 'Medium', detail: '5-15 mi source' };
  }
  return { label: 'Fair', detail: '>15 mi or stale data' };
}

function confidenceColors(label: 'High' | 'Medium' | 'Fair'): {
  borderColor: string;
  backgroundColor: string;
  textColor: string;
} {
  if (label === 'High') {
    return {
      borderColor: 'rgba(46,204,113,0.38)',
      backgroundColor: 'rgba(46,204,113,0.16)',
      textColor: SAFETY_GREEN,
    };
  }
  return {
    borderColor: 'rgba(243,156,18,0.38)',
    backgroundColor: 'rgba(243,156,18,0.16)',
    textColor: RISK_AMBER,
  };
}

type TacticalInstrumentRingProps = {
  score: number;
  size?: number;
  isDark: boolean;
  roadBand?: RoadTempBand | null;
};

function TacticalInstrumentRing({ score, size = 180, isDark, roadBand }: TacticalInstrumentRingProps) {
  const band = useMemo(() => {
    if (roadBand === 'safe') {
      return { label: 'Green' as const, color: '#2D6A4F', dimColor: 'rgba(45, 106, 79, 0.15)', pulseMs: 2200, minPulse: 0.40 };
    }
    if (roadBand === 'warm') {
      return { label: 'Amber' as const, color: '#D4A017', dimColor: 'rgba(212, 160, 23, 0.15)', pulseMs: 1500, minPulse: 0.40 };
    }
    if (roadBand === 'hot') {
      return { label: 'Ember' as const, color: '#C46A2D', dimColor: 'rgba(196, 106, 45, 0.15)', pulseMs: 1200, minPulse: 0.40 };
    }
    if (roadBand === 'danger') {
      return { label: 'Danger' as const, color: '#B5443A', dimColor: 'rgba(181, 68, 58, 0.15)', pulseMs: 800, minPulse: 0.40 };
    }
    return riskBand(score);
  }, [score, roadBand]);

  const pulse = useRef(new Animated.Value(band.minPulse)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  const baseRadius = (size - 16) / 2;
  const radiusTicks = baseRadius - 8;
  const radiusGlow = baseRadius;
  const radiusOuter = baseRadius + 8;

  const canvasPadding = 30;
  const canvasSize = size + canvasPadding * 2;
  const cx = canvasSize / 2;
  const cy = canvasSize / 2;

  useEffect(() => {
    let active = true;
    pulse.setValue(band.minPulse);

    const animateUpDown = (toUp: boolean) => {
      if (!active) return;

      Animated.timing(pulse, {
        toValue: toUp ? 1 : band.minPulse,
        duration: band.pulseMs,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && active) {
          animateUpDown(!toUp);
        }
      });
    };

    animateUpDown(true);

    return () => {
      active = false;
      pulse.stopAnimation();
    };
  }, [band.pulseMs, band.minPulse, pulse]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: band.pulseMs * 2.5,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [sweep, band.pulseMs]);

  const bezelTicks = useMemo(() => {
    const paths: any[] = [];
    const totalTicks = 120;
    for (let i = 0; i < totalTicks; i++) {
      const angleRad = (i / totalTicks) * 2 * Math.PI - Math.PI / 2;
      const rStart = radiusTicks;
      const rEnd = radiusTicks + 3;

      const x1 = cx + rStart * Math.cos(angleRad);
      const y1 = cy + rStart * Math.sin(angleRad);
      const x2 = cx + rEnd * Math.cos(angleRad);
      const y2 = cy + rEnd * Math.sin(angleRad);

      const path = Skia.Path.Make();
      path.moveTo(x1, y1);
      path.lineTo(x2, y2);
      paths.push(path);
    }
    return paths;
  }, [cx, cy, radiusTicks]);

  const crosshairTopPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx, cy - radiusOuter - 5);
    p.lineTo(cx, cy - radiusOuter + 5);
    return p;
  }, [cx, cy, radiusOuter]);

  const crosshairBottomPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx, cy + radiusOuter - 5);
    p.lineTo(cx, cy + radiusOuter + 5);
    return p;
  }, [cx, cy, radiusOuter]);

  const bezelBgColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
  const outerRingColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';

  const scale = pulse.interpolate({
    inputRange: [band.minPulse, 1],
    outputRange: [0.96, 1.04],
  });

  return (
    <View
      style={{
        position: 'absolute',
        width: canvasSize,
        height: canvasSize,
        left: -canvasPadding,
        top: -canvasPadding,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* 1. Static Bezel & Crosshairs */}
      <Canvas style={StyleSheet.absoluteFill}>
        <Circle
          cx={cx}
          cy={cy}
          r={radiusTicks}
          color={bezelBgColor}
          style="stroke"
          strokeWidth={1}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={radiusOuter}
          color={outerRingColor}
          style="stroke"
          strokeWidth={1}
        />
        <Path
          path={crosshairTopPath}
          color={outerRingColor}
          style="stroke"
          strokeWidth={1}
        />
        <Path
          path={crosshairBottomPath}
          color={outerRingColor}
          style="stroke"
          strokeWidth={1}
        />
      </Canvas>

      {/* 2. Pulsing Glow and Color Rings */}
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          opacity: pulse,
          transform: [{ scale }],
        }}
      >
        <Canvas style={StyleSheet.absoluteFill}>
          <Group opacity={0.45}>
            <Circle
              cx={cx}
              cy={cy}
              r={radiusGlow}
              color={band.color}
              style="stroke"
              strokeWidth={14}
            >
              <BlurMask blur={15} style="normal" />
            </Circle>
          </Group>

          <Circle
            cx={cx}
            cy={cy}
            r={radiusGlow}
            color="rgba(255,255,255,0.06)"
            style="stroke"
            strokeWidth={4.5}
          />

          <Circle
            cx={cx}
            cy={cy}
            r={radiusGlow}
            color={band.color}
            style="stroke"
            strokeWidth={4.5}
          />

          <Circle
            cx={cx}
            cy={cy}
            r={radiusGlow}
            color="#FFF"
            style="stroke"
            strokeWidth={1.5}
            opacity={0.35}
          />
        </Canvas>

        {/* Rotating Bezel Ticks with Sweep Gradient */}
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            transform: [
              {
                rotate: sweep.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          }}
        >
          <Canvas style={StyleSheet.absoluteFill}>
            <Group>
              <SweepGradient
                c={{ x: cx, y: cy }}
                colors={[
                  band.color,
                  band.dimColor,
                  band.dimColor,
                  band.color,
                ]}
                positions={[0, 0.15, 0.85, 1.0]}
              />
              {bezelTicks.map((p, idx) => (
                <Path
                  key={`btick-${idx}`}
                  path={p}
                  style="stroke"
                  strokeWidth={1.25}
                />
              ))}
            </Group>
          </Canvas>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const { width: screenWidth } = Dimensions.get('window');
const cardSize = screenWidth - 36;
const avatarRingSize = Math.round(cardSize * 0.78); // increased size for dominant dog portrait
const avatarPhotoSize = Math.round(avatarRingSize * 0.85);

const hapticTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const palette = Colors[colorScheme];

  const textColors = useMemo(() => {
    return {
      primary: isDark ? 'rgba(234, 234, 234, 0.92)' : 'rgba(18, 31, 24, 0.92)',
      secondary: isDark ? 'rgba(234, 234, 234, 0.68)' : 'rgba(18, 31, 24, 0.68)',
      tertiary: isDark ? 'rgba(234, 234, 234, 0.46)' : 'rgba(18, 31, 24, 0.46)',
      instrument: isDark ? 'rgba(234, 234, 234, 0.72)' : 'rgba(18, 31, 24, 0.72)',
      accent: isDark ? '#2ECC71' : '#157A3F',
    };
  }, [isDark]);
  const insets = useSafeAreaInsets();
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
  const [selectedSurface, setSelectedSurface] = useState<SurfaceType>('asphalt');
  const [npiModalOpen, setNpiModalOpen] = useState(false);
  const [verifySurfaceOpen, setVerifySurfaceOpen] = useState(false);
  const [heroViewMode, setHeroViewMode] = useState<'now' | 'best'>('now');
  const [verifyRunning, setVerifyRunning] = useState(false);
  const [verifyCountdown, setVerifyCountdown] = useState(7);
  const verifyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTimerActiveRef = useRef(false);
  const scrubHourHapticRef = useRef<number | null>(null);
  const confidencePulse = useRef(new Animated.Value(1)).current;
  const [showSecondaryHazard, setShowSecondaryHazard] = useState(false);
  const [gearVaultBusy, setGearVaultBusy] = useState(false);
  const [dogProfile, setDogProfile] = useState<DogProfile | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackInitialType, setFeedbackInitialType] = useState<FeedbackType>('general_feedback');
  const [readinessPresentation, setReadinessPresentation] = useState<ReadinessPresentation | null>(null);
  const [showUpgradeTermsModal, setShowUpgradeTermsModal] = useState(false);
  const [upgradeDisclaimerAgreed, setUpgradeDisclaimerAgreed] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeOuting, setActiveOuting] = useState<ActiveOuting | null>(null);
  const [durationModalOpen, setDurationModalOpen] = useState(false);

  const { viewRef, isSharing, shareCard } = useShareCard();
  const shareRef = useRef<View>(null);
  const outingSectionRef = useRef<View>(null);

  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const mainScrollRef = useRef<ScrollView>(null);
  const avatarRef = useRef<View>(null);
  const timelineRef = useRef<View>(null);
  const bellRef = useRef<View>(null);
  const { height: screenHeight } = Dimensions.get('window');
  
  // Spotlight Shared Values
  const spotlightX = useSharedValue(screenWidth / 2);
  const spotlightY = useSharedValue(screenHeight / 2);
  const spotlightR = useSharedValue(0);
  const spotlightW = useSharedValue(0);
  const spotlightH = useSharedValue(0);
  const [walkthroughStep, setWalkthroughStep] = useState(0);

  useFocusEffect(
    useCallback(() => {
      trackEvent('screen_viewed', { screenName: 'Ready (Home)' });
      getDogProfile().then(setDogProfile).catch(() => {});
      getActiveOuting().then(setActiveOuting).catch(() => {});

      // Automatic 7-day review prompt eligibility check (delayed so it never pops up instantly on launch)
      const reviewTimer = setTimeout(async () => {
        try {
          await recordUsageDay();
          const profile = await getDogProfile();
          const eligible = await checkReviewEligibility({ onboardingDone: profile ? profile.onboardingDone : true });
          if (eligible) {
            markShownThisSession();
            setReviewModalOpen(true);
          }
        } catch (err) {
          console.warn('[Home] Review prompt check error', err);
        }
      }, 6000);

      FileSystem.getInfoAsync(FileSystem.documentDirectory + 'home_walkthrough.txt').then(info => {
        if (!info.exists) {
          triggerStep(0);
        }
      }).catch(() => {});

      return () => {
        clearTimeout(reviewTimer);
      };
    }, [])
  );

  const triggerStep = (step: number) => {
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
      }, 600);
    } else if (step === 1) { // Timeline
      mainScrollRef.current?.scrollTo({ y: 380, animated: true });
      setTimeout(() => {
        timelineRef.current?.measureInWindow((x, y, w, h) => {
          spotlightX.value = withTiming(x - 4, { duration: 500 });
          spotlightY.value = withTiming(y - 4, { duration: 500 });
          spotlightW.value = withTiming(w + 8, { duration: 500 });
          spotlightH.value = withTiming(h + 8, { duration: 500 });
          spotlightR.value = withTiming(24, { duration: 500 });
        });
      }, 600);
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
      }, 600);
    } else if (step === 3) { // Exploring Now Button
      mainScrollRef.current?.scrollTo({ y: 550, animated: true });
      setTimeout(() => {
        outingSectionRef.current?.measureInWindow((x, y, w, h) => {
          spotlightX.value = withTiming(x - 4, { duration: 500 });
          spotlightY.value = withTiming(y - 4, { duration: 500 });
          spotlightW.value = withTiming(w + 8, { duration: 500 });
          spotlightH.value = withTiming(h + 8, { duration: 500 });
          spotlightR.value = withTiming(14, { duration: 500 });
        });
      }, 600);
    } else if (step === 4) { // Tabs
      mainScrollRef.current?.scrollTo({ y: 600, animated: true }); // Scroll down a bit to show tabs area if needed
      setTimeout(() => {
        const bottomPadding = insets.bottom > 0 ? insets.bottom : 12;
        const tabHighlightHeight = 64 + bottomPadding + 28;
        spotlightX.value = withTiming(0, { duration: 500 });
        spotlightY.value = withTiming(screenHeight - tabHighlightHeight, { duration: 500 });
        spotlightW.value = withTiming(screenWidth, { duration: 500 });
        spotlightH.value = withTiming(tabHighlightHeight, { duration: 500 });
        spotlightR.value = withTiming(0, { duration: 500 });
      }, 100);
    }
  };

  const finishWalkthrough = async () => {
    setShowWalkthrough(false);
    try {
      await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + 'home_walkthrough.txt', 'done');
    } catch {}
  };



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

  // Load cached weather from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const cachedStr = await AsyncStorage.getItem('@northpaw/cached_weather_data');
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          if (parsed && parsed.status === 'ok') {
            setWeather(parsed);
          }
        }
      } catch (err) {
        console.warn('[Home] Failed to load cached weather from AsyncStorage', err);
      }
    })();
  }, []);

  // Refresh weather when returning from background if it is stale (older than 30 mins)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        try {
          const lastFetchStr = await AsyncStorage.getItem('@northpaw/last_weather_fetch_time');
          const lastFetch = lastFetchStr ? parseInt(lastFetchStr, 10) : 0;
          const staleThreshold = 5 * 60 * 1000; // 5 minutes
          if (Date.now() - lastFetch > staleThreshold) {
            console.log('[Home] Weather cache is stale. Refreshing...');
            const freshWeather = await fetchWeatherForDeviceLocation();
            if (freshWeather.status === 'ok') {
              setWeather(freshWeather);
              await AsyncStorage.setItem('@northpaw/cached_weather_data', JSON.stringify(freshWeather));
              await AsyncStorage.setItem('@northpaw/last_weather_fetch_time', Date.now().toString());
              if (freshWeather.latitude != null && freshWeather.longitude != null) {
                await AsyncStorage.setItem(
                  '@northpaw/last_fetched_lat_lon',
                  JSON.stringify({ latitude: freshWeather.latitude, longitude: freshWeather.longitude })
                );
              }
            }
          }
        } catch (err) {
          console.warn('[Home] Failed to auto-refresh weather on foreground', err);
        }
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      appStateSub.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let gone = false;
      (async () => {
        const [profile, result, acceptedVer] = await Promise.all([
          getDogProfile(),
          fetchWeatherForDeviceLocation(),
          AsyncStorage.getItem('@northpaw/disclaimer_accepted_version'),
        ]);
        if (!gone) {
          setDogProfile(profile);
          setWeather(result);
          if (profile && profile.onboardingDone && acceptedVer !== REQUIRED_DISCLAIMER_VERSION) {
            setShowUpgradeTermsModal(true);
          }
          if (result.status === 'ok') {
            // Cache fresh weather in AsyncStorage
            try {
              await AsyncStorage.setItem('@northpaw/cached_weather_data', JSON.stringify(result));
              await AsyncStorage.setItem('@northpaw/last_weather_fetch_time', Date.now().toString());
              if (result.latitude != null && result.longitude != null) {
                await AsyncStorage.setItem(
                  '@northpaw/last_fetched_lat_lon',
                  JSON.stringify({ latitude: result.latitude, longitude: result.longitude })
                );
              }
            } catch (err) {
              console.warn('[Home] Failed to cache weather in AsyncStorage', err);
            }

            const providerUsed = result.providerUsed || (result.isCacheHit ? 'cache' : 'nws');

            trackEvent('weather_loaded', {
              cache_hit: result.isCacheHit ?? false,
              load_time_ms: result.loadTimeMs ?? 0,
              weather_provider_used: providerUsed,
            });

            // Calculate Time to Value (TTV)
            let isFirst = false;
            let timeToFirstMs: number | null = null;
            try {
              const alreadyTracked = await AsyncStorage.getItem('@northpaw/first_readiness_tracked');
              if (!alreadyTracked) {
                isFirst = true;
                await AsyncStorage.setItem('@northpaw/first_readiness_tracked', 'true');
                const completedAtStr = await AsyncStorage.getItem('@northpaw/onboarding_completed_at');
                if (completedAtStr) {
                  const completedAt = parseInt(completedAtStr, 10);
                  if (completedAt) {
                    timeToFirstMs = Date.now() - completedAt;
                  }
                }
              }
            } catch (err) {
              console.warn('[Home] Failed to check AsyncStorage readiness flags', err);
            }

            const appVersion = Constants.expoConfig?.version || '1.0.0';

            trackEvent('readiness_viewed', {
              tempF: result.tempF,
              forecast: result.forecastShort,
              is_first_readiness_view: isFirst,
              time_to_first_readiness_ms: timeToFirstMs,
              weather_load_time_ms: result.loadTimeMs ?? 0,
              weather_cache_hit: result.isCacheHit ?? false,
              weather_provider_used: providerUsed,
              surface: selectedSurface,
              dog_breed: profile.dogBreed || 'Unknown',
              app_version: appVersion,
            });

            setUserProperties({
              last_safety_check_timestamp: Date.now(),
            });

            incrementUserProperties({
              total_safety_checks: 1,
            });
          }
        }
      })();
      return () => {
        gone = true;
      };
    }, [selectedSurface])
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
    const riskWeightMultiplier = dogRiskMultiplier(dogProfile);
    const bestWindowReductionFraction = activityWindowReduction(dogProfile);
    return buildTimelineBarsModel({
      hourly: weatherOk.hourlySamples,
      latitude: weatherOk.latitude,
      riskWeightMultiplier,
      bestWindowReductionFraction,
      surfaceType: selectedSurface,
    });
  }, [weatherOk, dogProfile, selectedSurface]);
  const timelineAxis = timelineBounds();
  const timelineColors = useMemo(() => {
    if (!timelineBars || !timelineBars.points.length) {
      return ['#2D6A4F', '#2D6A4F'] as [string, string, ...string[]];
    }
    const colors = timelineBars.points.map(p => {
      if (p.roadBand === 'warm') return '#D4A017';
      if (p.roadBand === 'hot') return '#C46A2D';
      if (p.roadBand === 'danger') return '#B5443A';
      return '#2D6A4F';
    });
    if (colors.length === 1) return [colors[0], colors[0]] as [string, string, ...string[]];
    return colors as [string, string, ...string[]];
  }, [timelineBars]);
  const roadDetailHours = useMemo(() => Array.from({ length: 24 }, (_, hour) => hour), []);
  const scrubMovedRef = useRef(false);
  const scrubStartXRef = useRef(0);
  const scrubStartTsRef = useRef(0);
  const bestWindowPrimary = timelineBars?.bestWindowSegments?.[0] ?? null;
  const bestAmSeg = timelineBars?.bestWindowSegments?.find(s => s.startHour < 12);
  const bestPmSeg = timelineBars?.bestWindowSegments?.find(s => s.startHour >= 12);

  const bestWindowLabel = useMemo(() => {
    const formatHourShort = (h: number) => {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      return `${displayHour}${period}`;
    };
    if (!bestAmSeg && !bestPmSeg) return 'None';
    const am = bestAmSeg ? `${formatHourShort(bestAmSeg.startHour)}–${formatHourShort(bestAmSeg.endHour)}` : '';
    const pm = bestPmSeg ? `${formatHourShort(bestPmSeg.startHour)}–${formatHourShort(bestPmSeg.endHour)}` : '';
    return [am, pm].filter(Boolean).join(' & ');
  }, [bestAmSeg, bestPmSeg]);

  const bestWindows = useMemo(() => {
    const formatHourShort = (h: number) => {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      return `${displayHour}${period}`;
    };
    const list: string[] = [];
    if (bestAmSeg) {
      list.push(`${formatHourShort(bestAmSeg.startHour)}–${formatHourShort(bestAmSeg.endHour)}`);
    }
    if (bestPmSeg) {
      list.push(`${formatHourShort(bestPmSeg.startHour)}–${formatHourShort(bestPmSeg.endHour)}`);
    }
    if (list.length === 0) {
      list.push('None');
    }
    return list;
  }, [bestAmSeg, bestPmSeg]);
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
  const currentRoadPoint = useMemo(() => {
    if (!timelineBars || !timelineBars.points.length) return null;
    const target = Math.round(timelineBars.currentHourPosition);
    return (
      timelineBars.points.reduce((best, p) => {
        const bestDist = Math.abs(best.hour - target);
        const d = Math.abs(p.hour - target);
        return d < bestDist ? p : best;
      }, timelineBars.points[0]) ?? null
    );
  }, [timelineBars]);

  const statusBadge = useMemo(() => {
    const band = currentRoadPoint?.roadBand ?? 'safe';
    if (band === 'warm') {
      return {
        label: 'Caution',
        color: palette.cautionBg,
        textColor: palette.cautionText,
        bg: isDark ? 'rgba(245,158,11,0.22)' : 'rgba(245,158,11,0.26)',
        border: isDark ? '#D97706' : '#B45309',
      };
    }
    if (band === 'hot') {
      return {
        label: 'Caution',
        color: '#D97706',
        textColor: palette.cautionText,
        bg: isDark ? 'rgba(217,119,6,0.22)' : 'rgba(245,158,11,0.26)',
        border: isDark ? '#B45309' : '#92400E',
      };
    }
    if (band === 'danger') {
      return {
        label: 'Danger',
        color: '#DC2626',
        textColor: '#FFFFFF',
        bg: isDark ? 'rgba(220,38,38,0.25)' : '#DC2626',
        border: '#991B1B',
      };
    }
    // safe / default
    return {
      label: 'Ready',
      color: isDark ? SAFETY_GREEN : '#15803D',
      textColor: isDark ? '#86EFAC' : '#064E3B',
      bg: isDark ? 'rgba(46,204,113,0.14)' : 'rgba(22, 163, 74, 0.14)',
      border: isDark ? 'rgba(46,204,113,0.30)' : 'rgba(22, 163, 74, 0.35)',
    };
  }, [currentRoadPoint, isDark, palette]);
  const npiScore = useMemo(() => {
    if (!weatherOk) return null;
    const nearestHourly =
      weatherOk.hourlySamples.reduce((best, sample) => {
        const t = new Date(sample.timeIso).getTime();
        if (!Number.isFinite(t)) return best;
        const d = Math.abs(t - Date.now());
        return d < best.diff ? { diff: d, sample } : best;
      }, { diff: Number.MAX_SAFE_INTEGER, sample: weatherOk.hourlySamples[0] })?.sample ?? null;
    const humidity = clampUnit(nearestHourly?.humidityPct ?? weatherOk.precipChance ?? 45, 0, 100);
    const skyCover = clampUnit(nearestHourly?.skyCover ?? 35, 0, 100);
    const solarLoadRaw = weatherOk.isDaytime ? ((100 - skyCover) / 100) * 10 : 0;
    // Scale solar risk impact by temp: full impact at 85F+, 40% impact at 40F.
    const solarTempScale = Math.max(0.4, Math.min(1.0, ((weatherOk.tempF - 40) / 45) * 0.6 + 0.4));
    const solarLoad = solarLoadRaw * solarTempScale;
    // Canine Heat Stress Index (CHSI): Weights humidity as an additive risk.
    const chsi = (weatherOk.tempF * 0.8) + (humidity * (weatherOk.tempF - 14) / 100) + 20;
    const snoutMultiplier = dogProfile?.dogSnoutProfile === 'flat' ? 1.15 : 1;
    const coatMultiplier = dogProfile?.dogCoatType === 'Double' ? 1.1 : 1;
    const activityPenalty = dogProfile?.dogActivityBaseline === 'high' ? 1 : 0;
    // Base risk: Mapping CHSI range [89, 148] to [0, 5.5] using 10.8 normalization.
    // Anchor shifted to 89 (approx 60F) to prevent over-indexing in cool weather.
    const baseRisk = Math.max(0, (chsi - 89) / 10.8) + solarLoad * 0.35;
    const finalRisk = (baseRisk * snoutMultiplier * coatMultiplier) + activityPenalty;
    return Math.round(Math.min(10, finalRisk) * 10) / 10;
  }, [weatherOk, currentRoadPoint, dogProfile]);

  const currentRisk = npiScore != null ? riskBand(npiScore) : null;

  const npiExplanation = useMemo(() => {
    if (!weatherOk) return null;
    const nearestHourly =
      weatherOk.hourlySamples.reduce((best, sample) => {
        const t = new Date(sample.timeIso).getTime();
        if (!Number.isFinite(t)) return best;
        const d = Math.abs(t - Date.now());
        return d < best.diff ? { diff: d, sample } : best;
      }, { diff: Number.MAX_SAFE_INTEGER, sample: weatherOk.hourlySamples[0] })?.sample ?? null;
    const humidity = clampUnit(nearestHourly?.humidityPct ?? weatherOk.precipChance ?? 45, 0, 100);
    const skyCover = clampUnit(nearestHourly?.skyCover ?? 35, 0, 100);
    const solarLoadRaw = weatherOk.isDaytime ? ((100 - skyCover) / 100) * 10 : 0;
    const solarTempScale = Math.max(0.4, Math.min(1.0, ((weatherOk.tempF - 40) / 45) * 0.6 + 0.4));
    const solarLoad = solarLoadRaw * solarTempScale;
    const chsi = (weatherOk.tempF * 0.8) + (humidity * (weatherOk.tempF - 14) / 100) + 20;
    
    // Calculate optimal AM and PM points (lowest risk hours)
    const daylightPoints = timelineBars?.points.filter(p => p.isDaylight) ?? [];
    const amPoints = daylightPoints.filter(p => p.hour < 12);
    const pmPoints = daylightPoints.filter(p => p.hour >= 12);

    const getOptimal = (pts: any[]) => {
      if (!pts.length) return null;
      return pts.reduce((best, p) => (p.roadTempF < best.roadTempF ? p : best), pts[0]);
    };

    const optAm = getOptimal(amPoints);
    const optPm = getOptimal(pmPoints);

    // Calculate NPIs for these points (Simplified for the hero card)
    const getPointNpi = (p: any) => {
      if (!p) return null;
      // Re-run a simplified risk calc for this point
      const base = Math.max(0, (p.airTempF - 60) / 10); // Very rough proxy for AM/PM comparison
      return Math.round(Math.min(10, base) * 10) / 10;
    };

    const bestAmLabel = optAm ? `${formatClockFromHour(optAm.hour)}` : null;
    const bestPmLabel = optPm ? `${formatClockFromHour(optPm.hour)}` : null;
    const bestAmNpi = getPointNpi(optAm);
    const bestPmNpi = getPointNpi(optPm);

    let advisor = "Good to go right now.";
    const airRisk = Math.max(0, (chsi - 89) / 10.8);
    const sunRisk = solarLoad * 0.35;
    const roadRisk = (currentRoadPoint?.roadTempF ?? 0) > 105 ? 2.0 : 0;

    if ((npiScore ?? 0) >= 3.1) {
      if (roadRisk > 0) {
        advisor = "Hot pavement. Walk on grass or shade.";
      } else if (sunRisk > airRisk && sunRisk > 1.5) {
        advisor = "Direct sun heating coat. Seek shade.";
      } else if (humidity > 65 && weatherOk.tempF > 60) {
        advisor = "High humidity. Take frequent breaks.";
      } else if (weatherOk.tempF > 75) {
        advisor = "High ambient heat. Limit intense play.";
      } else {
        advisor = "Stress elevated. Keep outings short.";
      }
    }

    return {
      thi: Math.round(chsi * 10) / 10,
      humidity,
      solarLoad: Math.round(solarLoad * 10) / 10,
      snoutAdj: dogProfile?.dogSnoutProfile === 'flat' ? '+15%' : '0%',
      coatAdj: dogProfile?.dogCoatType === 'Double' ? '+10%' : '0%',
      activityAdj: dogProfile?.dogActivityBaseline === 'high' ? '+1.0' : '0',
      advisor,
      bestAmLabel,
      bestPmLabel,
      bestAmNpi,
      bestPmNpi,
    };
  }, [weatherOk, currentRoadPoint, dogProfile, npiScore, timelineBars]);
  const confidence = useMemo(() => confidenceBadge(weatherOk), [weatherOk]);
  const confidenceTone = useMemo(
    () => (confidence ? confidenceColors(confidence.label) : null),
    [confidence]
  );
  const shouldShowVerifySurface = (currentRoadPoint?.roadTempF ?? 0) > 100;
  const verifyProgress = useMemo(() => clampUnit((7 - verifyCountdown) / 7, 0, 1), [verifyCountdown]);
  const verifyArcPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc({ x: 20, y: 20, width: 176, height: 176 }, -90, verifyProgress * 360);
    return p;
  }, [verifyProgress]);
  const selectedRoadDetailHour = useMemo(() => {
    const fallback = timelineBars ? Math.round(timelineBars.currentHourPosition) : 12;
    const selected = roadDetailHour ?? fallback;
    return ((selected % 24) + 24) % 24;
  }, [roadDetailHour, timelineBars]);

  const selectedHourSample = useMemo(() => {
    if (!weatherOk?.hourlySamples?.length) return null;
    return weatherOk.hourlySamples.find((s) => new Date(s.timeIso).getHours() === selectedRoadDetailHour) ?? null;
  }, [weatherOk, selectedRoadDetailHour]);
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
    const waitText = bestWindowLabel && bestWindowLabel !== 'None'
      ? `Try again near ${bestWindowLabel} or choose a shaded grass area.`
      : 'Avoid hot pavement today and stick to shaded grass areas.';
    return {
      title: `${dogName} is better off waiting`,
      body: `${hourText} is risky for paws. ${waitText}`,
    };
  }, [roadDetailPoint, dogName, selectedRoadDetailHour, bestWindowLabel]);
  const dailyReadinessLine = useMemo(() => {
    if (!timelineBars) return `${dogName}'s timeline is loading.`;
    const nextBest = timelineBars.bestWindowSegments?.[0] ?? null;
    if (nextBest) {
      return `${dogName}'s optimal outdoor window runs until ${formatClockQuarterHour(nextBest.endHour)} today.`;
    }
    return `${dogName} may need grass-first routes today with shorter outdoor time.`;
  }, [timelineBars, dogName]);
  const hazardInfo = useMemo(() => {
    const alerts = weatherOk?.hazardAlerts ?? [];
    if (!alerts.length) return null;
    return {
      primary: alerts[0],
      secondary: alerts[1] ?? null,
      extraCount: Math.max(0, alerts.length - 1),
    };
  }, [weatherOk?.hazardAlerts]);
  const packPreviewHint = useMemo(() => {
    const precip = weatherOk?.precipChance ?? 0;
    const nearestHumidity =
      weatherOk?.hourlySamples?.reduce((best, sample) => {
        const t = new Date(sample.timeIso).getTime();
        if (!Number.isFinite(t)) return best;
        const d = Math.abs(t - Date.now());
        return d < best.diff ? { diff: d, sample } : best;
      }, { diff: Number.MAX_SAFE_INTEGER, sample: weatherOk?.hourlySamples?.[0] })?.sample?.humidityPct ?? null;
    if (dogProfile?.dogSnoutProfile === 'flat' && (npiScore ?? 0) > 6) {
      return {
        label: `Recommended for ${dogName}'s pack: Cooling spray and extra water now.`,
        conditionKey: 'heat',
        itemId: 'extra-water',
      };
    }
    if (dogProfile?.dogCoatType === 'Double' && nearestHumidity != null && nearestHumidity > 65) {
      return {
        label: `Recommended for ${dogName}'s pack: Humidity fatigue watch for double-coat days.`,
        conditionKey: 'humidity',
        itemId: 'humidity-fatigue-check',
      };
    }
    if ((npiScore ?? 0) > 7) {
      return {
        label: `Recommended for ${dogName}'s pack: Bring extra water.`,
        conditionKey: 'heat',
        itemId: 'extra-water',
      };
    }
    if (precip > 20) {
      return {
        label: `Recommended for ${dogName}'s pack: Towel for muddy paws.`,
        conditionKey: 'rain',
        itemId: 'mud-towel',
      };
    }
    return null;
  }, [npiScore, weatherOk?.precipChance, weatherOk?.hourlySamples, dogName, dogProfile?.dogSnoutProfile, dogProfile?.dogCoatType]);
  const packHintPinned = useMemo(() => {
    if (!packPreviewHint) return false;
    return (dogProfile?.gearVault?.[packPreviewHint.conditionKey] ?? []).includes(packPreviewHint.itemId);
  }, [dogProfile?.gearVault, packPreviewHint]);
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
          trackEvent('walk_window_viewed', { action: 'scrub_timeline' });
          const x = evt.nativeEvent.locationX;
          scrubMovedRef.current = false;
          scrubStartXRef.current = x;
          scrubStartTsRef.current = Date.now();
          const hour =
            timelineAxis.startHour +
            (timelineAxis.endHour - timelineAxis.startHour) *
              Math.max(0, Math.min(1, timelineBarWidth > 0 ? x / timelineBarWidth : 0));
          const rounded = Math.round(hour);
          setTimelineScrubHour(rounded);
          if (scrubHourHapticRef.current !== rounded) {
            scrubHourHapticRef.current = rounded;
            Haptics.selectionAsync().catch(() => {});
          }
        },
        onPanResponderMove: (evt, gesture) => {
          if (Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6) scrubMovedRef.current = true;
          const x = evt.nativeEvent.locationX;
          const hour =
            timelineAxis.startHour +
            (timelineAxis.endHour - timelineAxis.startHour) *
              Math.max(0, Math.min(1, timelineBarWidth > 0 ? x / timelineBarWidth : 0));
          const rounded = Math.round(hour);
          setTimelineScrubHour(rounded);
          if (scrubHourHapticRef.current !== rounded) {
            scrubHourHapticRef.current = rounded;
            Haptics.selectionAsync().catch(() => {});
          }
        },
        onPanResponderRelease: () => {
          const tapDuration = Date.now() - scrubStartTsRef.current;
          const wasTap = !scrubMovedRef.current && tapDuration < 260;
          setTimelineScrubHour(null);
          scrubHourHapticRef.current = null;
          if (wasTap) {
            setRoadTempModalOpen(true);
            trackEvent('walk_window_viewed', { action: 'open_road_temp_details' });
          }
        },
        onPanResponderTerminate: () => {
          setTimelineScrubHour(null);
          scrubHourHapticRef.current = null;
        },
      }),
    [timelineAxis.endHour, timelineAxis.startHour, timelineBarWidth]
  );

  // Record legitimate foreground usage day on Home screen focus
  useFocusEffect(
    useCallback(() => {
      recordUsageDay().catch(() => {});
    }, [])
  );

  // Evaluate Review Prompt Eligibility when idle
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const evaluateReviewEligibility = async () => {
      const isCriticalFlow =
        verifySurfaceOpen ||
        verifyRunning ||
        weatherModalOpen ||
        npiModalOpen ||
        roadTempModalOpen ||
        feedbackModalOpen ||
        showUpgradeTermsModal ||
        gearVaultBusy;

      if (!dogProfile?.onboardingDone || isCriticalFlow) return;

      const isEligible = await checkReviewEligibility({
        onboardingDone: true,
        isCriticalFlow: false,
      });

      if (isEligible) {
        timer = setTimeout(async () => {
          const reCheck = await checkReviewEligibility({
            onboardingDone: true,
            isCriticalFlow:
              verifySurfaceOpen ||
              verifyRunning ||
              weatherModalOpen ||
              npiModalOpen ||
              roadTempModalOpen ||
              feedbackModalOpen ||
              showUpgradeTermsModal,
          });
          if (reCheck) {
            const data = await getReviewData();
            const appVersion = Constants.expoConfig?.version || '1.0.0';
            await trackEvent('review_prompt_eligible', {
              platform: Platform.OS,
              app_version: appVersion,
              unique_usage_days: data.uniqueUsageDays.length,
            });
            await trackEvent('review_prompt_shown', {
              platform: Platform.OS,
              app_version: appVersion,
              unique_usage_days: data.uniqueUsageDays.length,
            });
            markShownThisSession();
            setReviewModalOpen(true);
          }
        }, 1500);
      }
    };

    evaluateReviewEligibility().catch(() => {});

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    dogProfile?.onboardingDone,
    verifySurfaceOpen,
    verifyRunning,
    weatherModalOpen,
    npiModalOpen,
    roadTempModalOpen,
    feedbackModalOpen,
    showUpgradeTermsModal,
    gearVaultBusy,
  ]);

  const onReadinessPrimaryCta = useCallback(() => {
    if (!readinessPresentation) return;
    if (readinessPresentation.ctaAction.kind === 'open_weather') {
      setWeatherModalOpen(true);
    } else {
      router.push(`/checklist/${readinessPresentation.ctaAction.checklistId}`);
    }
  }, [readinessPresentation, router]);

  const stopAndClearVerifyTimer = useCallback((options?: { resetCountdown?: boolean }) => {
    const shouldReset = options?.resetCountdown ?? true;
    if (verifyTimerRef.current) {
      clearInterval(verifyTimerRef.current);
      verifyTimerRef.current = null;
    }
    isTimerActiveRef.current = false;
    setVerifyRunning(false);
    if (shouldReset) {
      setVerifyCountdown(7);
    }
  }, []);

  const startVerifySurface = useCallback(() => {
    // Guaranteed single-instance timer check and cleanup
    stopAndClearVerifyTimer({ resetCountdown: true });

    trackEvent('hand_test_started', { surface: selectedSurface });
    setVerifyRunning(true);
    setVerifyCountdown(7);
    isTimerActiveRef.current = true;

    let t = 7;
    verifyTimerRef.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      t -= 1;
      const nextCount = Math.max(0, t);
      setVerifyCountdown(nextCount);

      if (t <= 0) {
        trackEvent('hand_test_completed', { surface: selectedSurface, duration: 7 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        stopAndClearVerifyTimer({ resetCountdown: false });
      }
    }, 1000);
  }, [selectedSurface, stopAndClearVerifyTimer]);

  const closeVerifySurface = useCallback(() => {
    setVerifySurfaceOpen(false);
    if (isTimerActiveRef.current || verifyRunning) {
      trackEvent('hand_test_cancelled', {
        surface: selectedSurface,
        remainingSeconds: verifyCountdown,
      });
    }
    stopAndClearVerifyTimer({ resetCountdown: true });
  }, [selectedSurface, verifyCountdown, verifyRunning, stopAndClearVerifyTimer]);

  const cycleSurface = useCallback(() => {
    hapticTap();
    const surfaces: SurfaceType[] = ['asphalt', 'concrete', 'cobblestone', 'sand', 'turf'];
    setSelectedSurface((prev) => {
      const idx = surfaces.indexOf(prev);
      const next = surfaces[(idx + 1) % surfaces.length];
      trackEvent('surface_changed', { surface: next });
      return next;
    });
  }, [setSelectedSurface]);
  const onToggleGearVault = useCallback(async () => {
    if (!packPreviewHint || gearVaultBusy) return;
    setGearVaultBusy(true);
    try {
      const updated = await toggleGearVaultItem(packPreviewHint.conditionKey, packPreviewHint.itemId);
      setDogProfile((prev) => (prev ? { ...prev, gearVault: updated } : prev));
      Haptics.selectionAsync().catch(() => {});
    } finally {
      setGearVaultBusy(false);
    }
  }, [packPreviewHint, gearVaultBusy]);
  useEffect(() => {
    if (confidence?.label !== 'Fair') {
      confidencePulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(confidencePulse, { toValue: 0.64, duration: 900, useNativeDriver: true }),
        Animated.timing(confidencePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [confidence?.label, confidencePulse]);
  useEffect(() => {
    if (!verifySurfaceOpen) {
      stopAndClearVerifyTimer();
    }
  }, [verifySurfaceOpen, stopAndClearVerifyTimer]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (isTimerActiveRef.current) {
          stopAndClearVerifyTimer();
          setVerifyCountdown(7);
        }
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      stopAndClearVerifyTimer();
    };
  }, [stopAndClearVerifyTimer]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>

      <ScrollView
        ref={mainScrollRef}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: getTabScrollPadding(insets.bottom) }]}>
        {/* A. Identity strip — name + place; utilities stay quiet */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => { hapticTap();  router.push('/dog-profile'); }}
            style={({ pressed }) => [styles.headerProfile, { opacity: pressed ? 0.88 : 1 }, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            accessibilityRole="button"
            accessibilityLabel="Dog profile">
            <View style={styles.headerProfileText}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.headerName, { color: textColors.primary, fontWeight: '700' }]} numberOfLines={1}>
                  {dogName}
                </Text>
                <View style={[
                  styles.statusPill,
                  {
                    backgroundColor: statusBadge.bg,
                    borderColor: statusBadge.border,
                  }
                ]}>
                  <View style={[
                    styles.statusDot, 
                    { 
                      backgroundColor: statusBadge.color
                    }
                  ]} />
                  <Text style={[
                    styles.statusPillText, 
                    { 
                      color: statusBadge.textColor || statusBadge.color,
                      fontWeight: '800'
                    }
                  ]}>
                    {statusBadge.label}
                  </Text>
                </View>
              </View>
              <Text style={[styles.headerPlace, { color: textColors.secondary, fontWeight: '500' }]} numberOfLines={1}>
                {placeLabel}
              </Text>
            </View>
          </Pressable>
          <View style={styles.headerRight}>
            <Pressable
              ref={bellRef} onPress={() => { hapticTap();  router.push('/reminders'); }}
              style={({ pressed }) => [styles.headerIconBtn, { opacity: pressed ? 0.75 : 1 }, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              accessibilityRole="button"
              accessibilityLabel="Alerts">
              <MaterialCommunityIcons name="bell-outline" size={22} color={textColors.secondary} style={{ opacity: isDark ? 0.85 : 0.60 }} />
            </Pressable>
            {!isPro && (
              <Pressable
                onPress={() => router.push({ pathname: '/paywall', params: { returnTo: '/(tabs)' } })}
                style={({ pressed }) => [
                  styles.headerProGhost,
                  {
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(18, 31, 24, 0.35)',
                    opacity: pressed ? 0.75 : (isDark ? 0.75 : 0.58)
                  }
                ]}
                accessibilityRole="button"
                accessibilityLabel="Upgrade to Pro">
                <Text style={[
                  styles.headerProGhostText,
                  { color: isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(18, 31, 24, 0.75)' }
                ]}>PRO</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* B. Hero — one story: readiness title, one support line, one CTA */}
        <View style={styles.heroBlock}>
          <BlurView
            intensity={60}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.heroGlassShell,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(18, 31, 24, 0.10)',
                backgroundColor: isDark ? 'rgba(15,23,20,0.35)' : 'rgba(242, 248, 239, 0.63)',
                shadowOpacity: isDark ? 0.35 : 0.08,
              },
            ]}>
            {/* Clean frosted glass showing main background */}
            <View style={styles.heroGlassContent}>
              {weather.status === 'loading' ? (
                <View style={styles.heroLoading}>
                  <ActivityIndicator size="large" color={FOREST} />
                  <Text style={[styles.heroLoadingText, { color: palette.textSecondary }]}>
                    Getting local conditions…
                  </Text>
                </View>
              ) : weather.status === 'permission_denied' ? (
                <View style={[styles.heroGlassShell, { shadowOpacity: isDark ? 0.5 : 0.12, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', backgroundColor: isDark ? 'rgba(15,23,20,0.7)' : 'rgba(255,255,255,0.7)', alignItems: 'center' }]}>
                  <MaterialCommunityIcons name="map-marker-off-outline" size={48} color={palette.textSecondary} style={{ marginBottom: 12 }} />
                  <Text style={[styles.h2, { color: palette.text, textAlign: 'center', marginBottom: 8 }]}>Unlock Your Environment</Text>
                  <Text style={[styles.body, { color: palette.textSecondary, textAlign: 'center', marginBottom: 20 }]}>
                    NorthPaw needs your location to generate safety timelines and calculate pavement temperatures.
                  </Text>
                  <Pressable
                    onPress={() => { hapticTap();  Linking.openSettings(); }}
                    style={({ pressed }) => [
                      styles.readinessPrimaryCta,
                      { backgroundColor: FOREST, opacity: pressed ? 0.9 : 1, width: '100%' },
                    , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                    <Text style={styles.readinessPrimaryCtaText}>Open Settings</Text>
                  </Pressable>
                </View>
              ) : weather.status === 'unavailable' ? (
                <Text style={[styles.permissionText, { color: palette.text }]}>{weather.message}</Text>
              ) : (
                <View style={{ width: '100%', alignItems: 'center', height: (cardSize * 0.93) - 40, justifyContent: 'center' }}>
                  {/* Quiet Corner Instrumentation */}
                  <Pressable 
                    onPress={() => {
                      hapticTap();
                      trackEvent('weather_details_viewed');
                      setWeatherModalOpen(true);
                    }}
                    style={styles.hudCornerTl}
                    accessibilityRole="button"
                    accessibilityLabel={`Weather conditions: ${(weather as any).tempF}°F. Tap to open details.`}>
                    <BlurView
                      intensity={45}
                      tint={isDark ? "dark" : "light"}
                      style={[
                        styles.heroBestWindowPill,
                        {
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(18, 31, 24, 0.12)',
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(18, 31, 24, 0.04)',
                        }
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={currentWeatherIconName(weather as any)}
                        size={12}
                        color={isDark ? "rgba(255, 255, 255, 0.75)" : "rgba(18, 31, 24, 0.72)"}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.heroBestWindowPillText,
                          { color: isDark ? "rgba(255, 255, 255, 0.75)" : "rgba(18, 31, 24, 0.72)" }
                        ]}
                      >
                        {(weather as any).tempF}°F
                      </Text>
                    </BlurView>
                  </Pressable>

                  <Pressable 
                    onPress={() => {
                      hapticTap();
                      trackEvent('npi_explanation_viewed', { score: npiScore });
                      setNpiModalOpen(true);
                    }}
                    style={styles.hudCornerTr}
                    accessibilityRole="button"
                    accessibilityLabel={`NPI score ${npiScore}. Tap for details.`}>
                    <BlurView
                      intensity={45}
                      tint={isDark ? "dark" : "light"}
                      style={[
                        styles.heroBestWindowPill,
                        {
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(18, 31, 24, 0.12)',
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(18, 31, 24, 0.04)',
                        }
                      ]}
                    >
                      <Text
                        style={[
                          styles.heroBestWindowPillText,
                          { color: isDark ? "rgba(255, 255, 255, 0.75)" : "rgba(18, 31, 24, 0.72)", marginRight: 4 }
                        ]}
                      >
                        NPI {npiScore}
                      </Text>
                      <MaterialCommunityIcons
                        name="help-circle-outline"
                        size={11}
                        color={isDark ? "rgba(255, 255, 255, 0.75)" : "rgba(18, 31, 24, 0.72)"}
                      />
                    </BlurView>
                  </Pressable>

                  <Pressable 
                    onPress={() => { hapticTap(); setRoadTempModalOpen(true); }}
                    style={[styles.hudCornerBr, { gap: 6 }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Best window: ${bestWindowLabel}. Tap for road temperature details.`}>
                    {bestWindows.map((winStr, idx) => (
                      <BlurView
                        key={`best-win-${idx}`}
                        intensity={45}
                        tint={isDark ? "dark" : "light"}
                        style={[
                          styles.heroBestWindowPill,
                          {
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(18, 31, 24, 0.12)',
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(18, 31, 24, 0.04)',
                          }
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={12}
                          color={isDark ? "rgba(255, 255, 255, 0.75)" : "rgba(18, 31, 24, 0.72)"}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.heroBestWindowPillText,
                            { color: isDark ? "rgba(255, 255, 255, 0.75)" : "rgba(18, 31, 24, 0.72)" }
                          ]}
                        >
                          {winStr.toUpperCase()}
                        </Text>
                      </BlurView>
                    ))}
                  </Pressable>

                  {/* Centered Dog Portrait + Ring */}
                  <View style={styles.avatarWrapper}>
                    {npiScore != null && (
                      <TacticalInstrumentRing
                        score={npiScore}
                        size={avatarRingSize}
                        isDark={isDark}
                        roadBand={currentRoadPoint?.roadBand}
                      />
                    )}
                    <Pressable
                      onPress={() => { hapticTap();  router.push('/dog-profile'); }}
                      ref={avatarRef} style={styles.heroPhotoCol}
                      accessibilityRole="button"
                      accessibilityLabel="Dog photo">
                      {dogProfile?.dogPhotoUri ? (
                        <Image
                          source={{ uri: dogProfile.dogPhotoUri }}
                          style={styles.heroDogCircle}
                          contentFit="cover"
                          cachePolicy="none"
                          recyclingKey={dogProfile.dogPhotoUri}
                        />
                      ) : (
                        <View style={[styles.heroDogCircle, styles.heroDogPh]}>
                          <MaterialCommunityIcons
                            name="dog-side"
                            size={42}
                            color={isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(18, 31, 24, 0.7)'}
                            style={{ marginBottom: 6 }}
                          />
                          <View style={[styles.customizeBadge, { backgroundColor: palette.tint }]}>
                            <MaterialCommunityIcons name="camera" size={10} color="#fff" />
                            <Text style={styles.customizeBadgeText}>Add photo</Text>
                          </View>
                        </View>
                      )}
                    </Pressable>
                  </View>

                  {/* Centered Primary Readiness Sentence */}
                  <Text 
                    style={[
                      styles.readinessHeadline, 
                      { 
                        color: isDark ? 'rgba(234, 234, 234, 0.9)' : 'rgba(18, 31, 24, 0.82)',
                        fontWeight: isDark ? '500' : '600'
                      }
                    ]} 
                    numberOfLines={2}
                  >
                    {npiExplanation?.advisor ?? "Good to go right now."}
                  </Text>
                </View>
              )}
            </View>
          </BlurView>
        </View>
        {timelineBars ? (
          <View style={{ width: '100%' }}>
            <View
              ref={timelineRef}
              style={[
                styles.timelineBarsCard,
                {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(18, 31, 24, 0.10)',
                  backgroundColor: isDark ? 'rgba(10, 22, 15, 0.58)' : 'rgba(242, 248, 239, 0.73)',
                },
              ]}>
              <View style={styles.timelineBarsBg}>
                <BlurView
                  intensity={60}
                  tint={isDark ? 'dark' : 'light'}
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 24, overflow: 'hidden' }]}
                />
                <View style={styles.timelineBarsHeader}>
                  <Text style={[styles.timelineBarsTitle, { color: isDark ? '#EAEAEA' : 'rgba(18, 31, 24, 0.78)' }]}>Today&apos;s timeline</Text>
                </View>
                <View
                  style={styles.timelineBarsWrap}
                  pointerEvents="box-only"
                  onLayout={(e) => {
                    setTimelineBarWidth(e.nativeEvent.layout.width);
                  }}
                  {...timelinePanResponder.panHandlers}>
                {scrubPoint ? (
                  <BlurView
                    intensity={90}
                    tint={isDark ? "dark" : "light"}
                    style={[
                      styles.timelineScrubPopup,
                      {
                        left: scrubPopupLeftPx,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(18, 31, 24, 0.15)',
                        backgroundColor: isDark ? 'rgba(15, 23, 20, 0.85)' : 'rgba(242, 248, 239, 0.85)',
                      },
                    ]}>
                    <Text style={[styles.timelineScrubTime, { color: isDark ? '#EAEAEA' : 'rgba(18, 31, 24, 0.92)' }]}>{formatClockFromHour(scrubPoint.hour)}</Text>
                    <Text style={[styles.timelineScrubTemp, { color: isDark ? 'rgba(234, 234, 234, 0.7)' : 'rgba(18, 31, 24, 0.68)' }]}>
                      {selectedSurface.charAt(0).toUpperCase() + selectedSurface.slice(1)} {Math.round(scrubPoint.roadTempF)}F
                    </Text>
                    <Text style={[styles.timelineScrubBand, { color: isDark ? 'rgba(234, 234, 234, 0.7)' : 'rgba(18, 31, 24, 0.68)' }]}>
                      {roadBandLabel(scrubPoint.roadBand)}
                    </Text>
                  </BlurView>
                ) : null}
                <View
                  style={[
                    styles.timelineNowThumb,
                    {
                      left: `${timelineHourRatio(timelineScrubHour ?? timelineBars.currentHourPosition) * 100}%` as unknown as number,
                    },
                  ]}
                >
                  <View style={styles.timelineNowThumbInner} />
                </View>
  
                <View 
                  accessible={true} 
                  accessibilityLabel={`Timeline pavement temperature risk track for selected surface ${selectedSurface}`}
                  style={styles.barTrack}>
                  <LinearGradient
                    colors={timelineColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </View>
                </View>
  
                <View style={styles.timelineRulerTicks}>
                  {[5, 7, 9, 11, 13, 15, 17, 19, 21, 22].map((hour) => {
                    const left = `${timelineHourRatio(hour) * 100}%`;
                    const isMajor = hour % 3 === 0 || hour === 12 || hour === 22 || hour === 5;
                    return (
                      <View key={`tick-${hour}`} style={[styles.rulerTickContainer, { left: left as any }]}>
                        <View style={[styles.rulerTickLine, { height: isMajor ? 8 : 4, backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }]} />
                        {isMajor && (
                          <Text style={[styles.rulerTickLabel, { color: textColors.tertiary }]}>
                            {hour === 12 ? '12p' : hour > 12 ? `${hour-12}p` : `${hour}a`}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                  <Pressable
                    onPress={cycleSurface}
                    accessibilityRole="button"
                    accessibilityLabel={`Selected surface is ${selectedSurface}. Tap to cycle surface type.`}>
                    <View style={styles.timelinePillButtonYellow}>
                      <Text style={styles.timelinePillButtonTextDark}>
                        Surface: {selectedSurface.charAt(0).toUpperCase() + selectedSurface.slice(1)}
                      </Text>
                      <MaterialCommunityIcons name="cached" size={12} color="#121F18" style={{ marginLeft: 4 }} />
                    </View>
                  </Pressable>
  
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Pressable
                      onPress={() => {
                        hapticTap();
                        setVerifySurfaceOpen(true);
                        trackEvent('hand_test_opened', { surface: selectedSurface });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Start Hand Test verification">
                      <BlurView
                        intensity={45}
                        tint={isDark ? "dark" : "light"}
                        style={[
                          styles.timelinePillButton,
                          {
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(18, 31, 24, 0.12)',
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(18, 31, 24, 0.04)',
                          }
                        ]}
                      >
                        <Text style={[styles.timelinePillButtonText, { color: textColors.primary }]}>
                          Hand Test
                        </Text>
                      </BlurView>
                    </Pressable>
                    <Pressable
                      onPress={() => { hapticTap(); setRoadTempModalOpen(true); }}
                      accessibilityRole="button"
                      accessibilityLabel="Open road temperature details">
                      <BlurView
                        intensity={45}
                        tint={isDark ? "dark" : "light"}
                        style={[
                          styles.timelinePillButton,
                          {
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(18, 31, 24, 0.12)',
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(18, 31, 24, 0.04)',
                          }
                        ]}
                      >
                        <Text style={[styles.timelinePillButtonText, { color: textColors.primary }]}>
                          Details
                        </Text>
                      </BlurView>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
            <View ref={outingSectionRef} collapsable={false}>
            {activeOuting ? (
              <View style={{
                marginTop: 16,
                backgroundColor: '#0D1F17',
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: '#D4AF37',
              }}>
                <View style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <MaterialCommunityIcons name="paw" size={18} color="#D4AF37" />
                    <Text style={{ color: '#D4AF37', fontWeight: '700', fontSize: 15 }}>Active Outing in Progress</Text>
                  </View>
                  <Text style={{ color: '#B0C2B6', fontSize: 12 }}>
                    Started {new Date(activeOuting.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Expected ~{new Date(activeOuting.startedAt + activeOuting.expectedDurationMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Pressable
                    style={{ backgroundColor: palette.tint, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flex: 1, alignItems: 'center' }}
                    onPress={() => {
                      hapticTap();
                      router.push({ pathname: '/post-walk', params: { outingId: activeOuting.id } } as any);
                    }}>
                    <Text style={{ color: '#0A1A12', fontWeight: '800', fontSize: 12 }}>Finish outing</Text>
                  </Pressable>
                  <Pressable
                    style={{ backgroundColor: palette.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                    onPress={async () => {
                      hapticTap();
                      await extendActiveOuting(10);
                      const updated = await getActiveOuting();
                      setActiveOuting(updated);
                    }}>
                    <Text style={{ color: palette.text, fontWeight: '700', fontSize: 12 }}>+10m</Text>
                  </Pressable>
                  <Pressable
                    style={{ backgroundColor: 'rgba(192, 57, 43, 0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                    onPress={async () => {
                      hapticTap();
                      await cancelActiveOuting();
                      setActiveOuting(null);
                    }}>
                    <Text style={{ color: '#C0392B', fontWeight: '700', fontSize: 12 }}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Exploring now, start an outdoor walk session"
                style={({ pressed }) => [
                  {
                    marginTop: 16,
                    backgroundColor: palette.tint,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                onPress={() => {
                  hapticTap();
                  setDurationModalOpen(true);
                }}>
                <MaterialCommunityIcons name="walk" size={20} color="#0A1A12" style={{ marginRight: 6 }} />
                <Text style={{ color: '#0A1A12', fontWeight: '800', fontSize: 14 }}>Exploring now</Text>
              </Pressable>
            )}
            </View>
            <View ref={shareRef} collapsable={false} style={{ marginTop: 16, marginBottom: 8 }}>
              <ShareButton
                onPress={() => shareCard({
                  dogName,
                  dogBreed: dogProfile?.dogBreed || 'Unknown',
                  currentNpi: npiScore ?? 0,
                  selectedSurface: selectedSurface,
                  surfaceTempF: currentRoadPoint?.roadTempF ?? 77,
                  currentTempF: (weather as any)?.tempF ?? 77,
                  roadBand: currentRoadPoint?.roadBand || 'safe',
                })}
                loading={isSharing}
                dogName={dogName}
              />
            </View>

            <View style={{
              backgroundColor: palette.surface,
              borderColor: palette.border,
              borderWidth: 1,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 10,
              marginTop: 10,
              marginBottom: 16,
              alignItems: 'center',
            }}>
              <Text style={{ color: palette.textSecondary, fontSize: 11, lineHeight: 16, textAlign: 'center', fontWeight: '500' }}>
                Estimates only. Local shade, turf, and heat-islands can significantly change pavement temps. Always perform a physical Hand Test before walks.
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={npiModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNpiModalOpen(false)}>
        <SafeAreaView style={[styles.modalRoot, { backgroundColor: palette.background }]} edges={['top', 'left', 'right', 'bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Why this NPI score?</Text>
            <Pressable onPress={() => { hapticTap();  setNpiModalOpen(false); }} hitSlop={12}>
              <FontAwesome name="close" size={22} color={palette.textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            {npiExplanation ? (
              <View style={[styles.npiExplainCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
                <Text style={[styles.npiExplainRow, { color: palette.text }]}>THI (canine-weighted): {npiExplanation.thi}</Text>
                <Text style={[styles.npiExplainRow, { color: palette.textSecondary }]}>Humidity driver: {npiExplanation.humidity}%</Text>
                <Text style={[styles.npiExplainRow, { color: palette.textSecondary }]}>Solar load (sky cover): {npiExplanation.solarLoad}</Text>
                <Text style={[styles.npiExplainRow, { color: palette.textSecondary }]}>Snout Adjustment: {npiExplanation.snoutAdj}</Text>
                <Text style={[styles.npiExplainRow, { color: palette.textSecondary }]}>Coat Adjustment: {npiExplanation.coatAdj}</Text>
                <Text style={[styles.npiExplainRow, { color: palette.textSecondary }]}>Activity Adjustment: {npiExplanation.activityAdj}</Text>
              </View>
            ) : (
              <Text style={{ color: palette.textSecondary }}>NPI details unavailable until weather loads.</Text>
            )}

            <View style={[styles.detailDivider, { backgroundColor: palette.border, marginVertical: 24 }]} />
            
            <View style={styles.scienceSection}>
              <Text style={[styles.scienceTitle, { color: palette.text }]}>Science & Sources</Text>
              <Text style={[styles.scienceBody, { color: palette.textSecondary }]}>
                NorthPaw's risk modeling is based on canine thermal physiology research and established safety guidelines:
              </Text>
              <View style={styles.scienceSourceRow}>
                <MaterialCommunityIcons name="book-open-variant" size={16} color={palette.tint} />
                <Text style={[styles.scienceSourceText, { color: palette.textSecondary }]}>
                  <Text style={{ fontWeight: '700' }}>JAMA:</Text> Surface temperature thermodynamics and burn risk thresholds.
                </Text>
              </View>
              <View style={styles.scienceSourceRow}>
                <MaterialCommunityIcons name="dog" size={16} color={palette.tint} />
                <Text style={[styles.scienceSourceText, { color: palette.textSecondary }]}>
                  <Text style={{ fontWeight: '700' }}>AKC:</Text> "Hand-Test" physical ritual and brachycephalic heat sensitivity guidelines.
                </Text>
              </View>
              <View style={styles.scienceSourceRow}>
                <MaterialCommunityIcons name="weather-sunny" size={16} color={palette.tint} />
                <Text style={[styles.scienceSourceText, { color: palette.textSecondary }]}>
                  <Text style={{ fontWeight: '700' }}>NWS / THI:</Text> The Temperature-Humidity Index (THI) adjusted for canine panting efficiency.
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={verifySurfaceOpen}
        transparent
        animationType="fade"
        onRequestClose={closeVerifySurface}>
        <View style={styles.verifyOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeVerifySurface} />
          <AnimatedReanimated.View entering={ZoomIn.springify().damping(28).stiffness(120)} exiting={FadeOut} style={[styles.verifyCard, { borderColor: palette.border, backgroundColor: palette.cardOpaque }]}>
            <Text style={[styles.verifyTitle, { color: palette.text }]}>Verify Surface</Text>
            <Text style={[styles.verifySub, { color: palette.textSecondary }]}>
              Press your hand to the pavement for a full 7 seconds.
            </Text>
            <View style={styles.verifyCanvasWrap}>
              <Canvas style={{ width: 216, height: 216 }}>
                <Circle cx={108} cy={108} r={88} color={(palette as any).handTestRing || (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(18,31,24,0.14)')} style="stroke" strokeWidth={10} />
                <Path path={verifyArcPath} color="#F39C12" style="stroke" strokeWidth={10} strokeCap="round" />
                <Circle cx={108} cy={108} r={76} color="rgba(243,156,18,0.2)">
                  <BlurMask blur={20} />
                </Circle>
              </Canvas>
              <View style={styles.verifyCenterTextWrap}>
                <Text style={[styles.verifySeconds, { color: palette.text }]}>{verifyCountdown}s</Text>
              </View>
            </View>
            <Text style={[styles.verifyResolution, { color: palette.text }]}>Too hot to hold? Walk on grass.</Text>
            {!verifyRunning ? (
              <Pressable
                onPress={() => { hapticTap(); startVerifySurface(); }}
                style={({ pressed }) => [
                  styles.verifyAction,
                  { backgroundColor: FOREST, opacity: pressed ? 0.9 : 1 },
                  { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
                ]}>
                <Text style={styles.verifyActionText}>{verifyCountdown === 0 ? 'Run again' : 'Start 7-second check'}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={closeVerifySurface}
              style={styles.verifyClose}>
              <Text style={[styles.verifyCloseText, { color: palette.textSecondary }]}>Close</Text>
            </Pressable>
          </AnimatedReanimated.View>
        </View>
      </Modal>

      <ReviewPromptModal
        visible={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
      />

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
              onPress={() => { hapticTap();  setWeatherModalOpen(false); }}
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
                      router.push({ pathname: '/paywall', params: { returnTo: '/(tabs)' } });
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
                  , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
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
                No picks yet. Open the Field guide for full packs.
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
              onPress={() => { hapticTap();  setRoadTempModalOpen(false); }}
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
            <View style={[styles.detailHeroCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
              <View style={styles.detailCardInner}>
                <Text style={[styles.detailCardTitle, { color: palette.text }]}>Best window</Text>
                <Text style={[styles.detailCardValue, { color: palette.text }]}>
                  {bestWindowLabel && bestWindowLabel !== 'None' ? bestWindowLabel : 'No optimal window today'}
                </Text>
                <Text style={[styles.detailCardSub, { color: palette.textSecondary, marginTop: 2 }]}>
                  {bestWindowLabel === 'None'
                    ? 'Pavement heat remains high during peak sun hours.'
                    : 'Pavement temperatures stay below 77°F during this time.'}
                </Text>
                <Text style={[styles.detailCardSub, { color: palette.textSecondary, marginTop: 6, fontWeight: '600' }]}>
                  Daylight: {daylightStart != null && daylightEnd != null ? rangeLabel(daylightStart, daylightEnd) : '6:00 AM – 8:20 PM'}
                </Text>

                <View style={[styles.detailDivider, { backgroundColor: palette.border }]} />

                <Text style={[styles.detailCardTitle, { color: palette.text }]}>Time vs pavement temp</Text>
                <Text style={[styles.detailCardSub, { color: palette.textSecondary, marginBottom: 8, fontWeight: '700' }]}>
                  Air Temp Estimation: {selectedHourSample ? `${Math.round(selectedHourSample.airTempF)}°F` : (weatherOk ? `${Math.round(weatherOk.tempF)}°F` : '—')}
                </Text>
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
                      <Text style={styles.roadDetailBadgeText}>{Math.round(roadDetailPoint.roadTempF)}°F</Text>
                    </View>
                    <Text style={[styles.roadDetailSelectedBand, { color: palette.textSecondary }]}>
                      {selectedSurface.charAt(0).toUpperCase() + selectedSurface.slice(1)} {roadBandLabel(roadDetailPoint.roadBand)}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.surfaceComparisonGrid}>
                  {(['asphalt', 'concrete', 'cobblestone', 'sand', 'turf'] as SurfaceType[]).map((st) => {
                    const sample = weatherOk?.hourlySamples.find(s => {
                       const h = new Date(s.timeIso).getHours();
                       return h === selectedRoadDetailHour;
                    });
                    if (!sample || !weatherOk) return null;
                    
                    const temp = estimateRoadTempF(sample, weatherOk.latitude, selectedRoadDetailHour, new Date(sample.timeIso), st);
                    const band = roadBandForTemp(temp);
                    const isActive = selectedSurface === st;
                    
                    return (
                      <Pressable 
                        key={`compare-${st}`} 
                        onPress={() => { hapticTap(); setSelectedSurface(st); }}
                        style={[
                          styles.compareCard, 
                          { borderColor: isActive ? palette.tint : palette.border, backgroundColor: isActive ? palette.selectedBg : palette.surface },
                          isActive && { borderWidth: 2 }
                        ]}
                      >
                        <Text style={[styles.compareLabel, { color: palette.text, fontWeight: '700' }]}>{st.toUpperCase()}</Text>
                        <Text style={[styles.compareValue, { color: roadBandColor(band) }]}>{Math.round(temp)}°F</Text>
                        <Text style={[styles.compareBand, { color: palette.textSecondary }]}>{roadBandLabel(band)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  onPress={() => {
                    hapticTap();
                    setFeedbackInitialType('surface_request');
                    setFeedbackModalOpen(true);
                  }}
                  style={{ alignSelf: 'flex-start', marginTop: 4, marginBottom: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Suggest a missing surface">
                  <Text style={{ color: palette.tint, fontWeight: '700', fontSize: 13 }}>
                    Missing a surface? Suggest one →
                  </Text>
                </Pressable>
                <View style={[styles.roadDetailSpinner, { borderColor: palette.border, backgroundColor: palette.background }]}>
                  <Pressable
                    onPress={() => { hapticTap(); setRoadDetailHour((selectedRoadDetailHour + 23) % 24); }}
                    style={[styles.roadDetailSpinnerBtn, { borderRightColor: palette.border }]}
                    accessibilityRole="button"
                    accessibilityLabel="Previous hour">
                    <FontAwesome name="chevron-left" size={14} color={palette.text} />
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
                    onPress={() => { hapticTap(); setRoadDetailHour((selectedRoadDetailHour + 1) % 24); }}
                    style={[styles.roadDetailSpinnerBtn, { borderLeftColor: palette.border }]}
                    accessibilityRole="button"
                    accessibilityLabel="Next hour">
                    <FontAwesome name="chevron-right" size={14} color={palette.text} />
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
                        onPress={() => { hapticTap(); setRoadDetailHour(hour); }}
                        style={[
                          styles.roadDetailHourPill,
                          {
                            borderColor: active ? palette.tint : palette.border,
                            backgroundColor: active ? palette.tint : palette.surface,
                          },
                        ]}>
                        <Text style={[styles.roadDetailHourPillText, { color: active ? '#FFFFFF' : palette.text, fontWeight: active ? '800' : '600' }]}>
                          {hour.toString().padStart(2, '0')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Text style={[styles.detailCardSub, { color: palette.textSecondary, marginTop: 8 }]}>
                  Spinner includes all day hours (00 to 23). Timeline estimates are anchored to 5AM to 10PM forecast samples.
                </Text>

                <View style={[styles.detailDivider, { backgroundColor: palette.border }]} />

                <Text style={[styles.detailCardTitle, { color: palette.text }]}>Paw safety rule of thumb</Text>
                <Text style={[styles.detailRuleText, { color: palette.text }]}>
                  If you cannot hold your hand on the pavement for 7 seconds, it is too hot for paws.
                </Text>
                <Text style={[styles.detailCardSub, { color: palette.textSecondary, marginTop: 12 }]}>
                  Estimates only. Local shade, turf, and heat-islands can significantly change pavement temps. Always perform a physical Hand Test.
                </Text>

                <View style={[styles.detailDivider, { backgroundColor: palette.border, marginVertical: 24 }]} />

                <View style={styles.scienceSection}>
                  <Text style={[styles.scienceTitle, { color: palette.text }]}>Science & Sources</Text>
                  <Text style={[styles.scienceBody, { color: palette.textSecondary }]}>
                    Our thermal model is derived from canine-specific burn thresholds and thermodynamic constants:
                  </Text>
                  <View style={styles.scienceSourceRow}>
                    <MaterialCommunityIcons name="book-open-variant" size={16} color={palette.tint} />
                    <Text style={[styles.scienceSourceText, { color: palette.textSecondary }]}>
                      <Text style={{ fontWeight: '700', color: palette.text }}>JAMA Dermatology:</Text> "Thermal Injury from Hot Asphalt" (identifying 125°F as the threshold for second-degree contact burns).
                    </Text>
                  </View>
                  <View style={styles.scienceSourceRow}>
                    <MaterialCommunityIcons name="dog" size={16} color={palette.tint} />
                    <Text style={[styles.scienceSourceText, { color: palette.textSecondary }]}>
                      <Text style={{ fontWeight: '700', color: palette.text }}>AKC / Vet Med:</Text> Validating the "7-Second Rule" and the increased risk for artificial turf.
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={[styles.verifySurfaceButton, { marginTop: 16, backgroundColor: palette.tint }]}
                  onPress={() => {
                    setRoadTempModalOpen(false);
                    setTimeout(() => {
                      setVerifySurfaceOpen(true);
                      startVerifySurface();
                    }, 300);
                  }}>
                  <Text style={[styles.verifySurfaceButtonText, { color: '#FFFFFF', fontWeight: '800' }]}>
                    Launch 7-Second Timer
                  </Text>
                  <Text style={[styles.verifySurfaceButtonSub, { color: 'rgba(255, 255, 255, 0.88)' }]}>
                    Test the pavement heat manually
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      {showWalkthrough && (
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
            </Canvas>
            
            <Pressable style={StyleSheet.absoluteFill} onPress={() => { hapticTap(); finishWalkthrough(); }} />
            
            <AnimatedReanimated.View 
              layout={LinearTransition.duration(400)}
              entering={FadeIn.duration(400)}
              style={[
                { position: 'absolute', left: 40, right: 40, zIndex: 9999, alignItems: 'center' },
                walkthroughStep === 0 ? { top: 290 } :
                walkthroughStep === 1 ? { top: 150 } : // Move tooltip above timeline
                walkthroughStep === 2 ? { top: 150 } :
                walkthroughStep === 3 ? { top: 150 } : // Move tooltip above Exploring Now button
                { bottom: 180 } // Move tooltip above tabs
              ]}
            >
              <View style={{ backgroundColor: palette.cardOpaque, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: palette.border, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 }}>
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
                    <Text style={{ fontSize: 17, fontWeight: '800', color: palette.text, marginBottom: 4 }}>Exploring Now</Text>
                    <Text style={{ fontSize: 13, lineHeight: 18, color: palette.textSecondary, marginBottom: 12 }}>
                      Start walks here. Northpaw will track safety conditions and check in when you return. Completely optional
                    </Text>
                  </>
                )}
                {walkthroughStep === 4 && (
                  <>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: palette.text, marginBottom: 4 }}>Navigation</Text>
                    <Text style={{ fontSize: 13, lineHeight: 18, color: palette.textSecondary, marginBottom: 12 }}>
                      Switch between your checklists, the field guide, and settings here.
                    </Text>
                  </>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: palette.textSecondary }}>Step {walkthroughStep + 1} of 5</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable
                      onPress={() => { hapticTap(); finishWalkthrough(); }}
                      style={{ padding: 6 }}
                      accessibilityRole="button"
                      accessibilityLabel="Skip tutorial">
                      <Text style={{ color: palette.textSecondary, fontSize: 13, fontWeight: '600' }}>Skip</Text>
                    </Pressable>
                    <Pressable 
                      onPress={() => {
                        if (walkthroughStep < 4) triggerStep(walkthroughStep + 1);
                        else finishWalkthrough();
                      }} 
                      style={{ backgroundColor: palette.tint, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={walkthroughStep < 4 ? "Next tutorial step" : "Finish tutorial"}
                    >
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{walkthroughStep < 4 ? 'Next' : 'Got it'}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </AnimatedReanimated.View>
          </View>
        </Modal>
      )}
      <Modal
        visible={durationModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDurationModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 360, borderRadius: 20, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: palette.text, marginBottom: 4 }}>
              How long is {dogName}&apos;s outing?
            </Text>
            <Text style={{ fontSize: 13, color: palette.textSecondary, marginBottom: 16 }}>
              We&apos;ll check in when you&apos;re back.
            </Text>

            <Pressable
              style={{ padding: 14, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}
              onPress={async () => {
                hapticTap();
                setDurationModalOpen(false);
                let notificationId: string | null = null;
                try {
                  notificationId = await Notifications.scheduleNotificationAsync({
                    content: {
                      title: `How did ${dogName} handle the walk?`,
                      body: `Tap to record a 1-tap private check-in for ${dogName}.`,
                      sound: true,
                      data: { 
                        type: 'post_walk_checkin',
                        url: '/post-walk'
                      },
                    },
                    trigger: {
                      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                      seconds: (10 + 5) * 60,
                    },
                  });
                } catch (_) {}
                const out = await startOuting({
                  dogId: dogProfile?.dogName || 'default_dog',
                  expectedDurationMinutes: 10,
                  source: 'home',
                  snapshot: {
                    id: `snap_${Date.now()}`,
                    weatherTimestamp: new Date().toISOString(),
                    algorithmVersion: '5.4.1',
                    surfaceType: selectedSurface,
                    estimatedSurfaceF: currentRoadPoint?.roadTempF ?? 77,
                    confidence: 'high',
                    riskCategory: currentRoadPoint?.roadBand ?? 'safe',
                  },
                  notificationId,
                });
                setActiveOuting(out);
              }}>
              <MaterialCommunityIcons name="timer-sand" size={22} color={palette.tint} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: palette.text }}>Quick (10 min)</Text>
                <Text style={{ fontSize: 12, color: palette.textSecondary }}>Quick potty break around the block</Text>
              </View>
            </Pressable>

            <Pressable
              style={{ padding: 14, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}
              onPress={async () => {
                hapticTap();
                setDurationModalOpen(false);
                let notificationId: string | null = null;
                try {
                  notificationId = await Notifications.scheduleNotificationAsync({
                    content: {
                      title: `How did ${dogName} handle the walk?`,
                      body: `Tap to record a 1-tap private check-in for ${dogName}.`,
                      sound: true,
                      data: { 
                        type: 'post_walk_checkin',
                        url: '/post-walk'
                      },
                    },
                    trigger: {
                      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                      seconds: (25 + 5) * 60,
                    },
                  });
                } catch (_) {}
                const out = await startOuting({
                  dogId: dogProfile?.dogName || 'default_dog',
                  expectedDurationMinutes: 25,
                  source: 'home',
                  snapshot: {
                    id: `snap_${Date.now()}`,
                    weatherTimestamp: new Date().toISOString(),
                    algorithmVersion: '5.4.1',
                    surfaceType: selectedSurface,
                    estimatedSurfaceF: currentRoadPoint?.roadTempF ?? 77,
                    confidence: 'high',
                    riskCategory: currentRoadPoint?.roadBand ?? 'safe',
                  },
                  notificationId,
                });
                setActiveOuting(out);
              }}>
              <MaterialCommunityIcons name="walk" size={22} color={palette.tint} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: palette.text }}>Normal (25 min)</Text>
                <Text style={{ fontSize: 12, color: palette.textSecondary }}>Standard neighbourhood walk</Text>
              </View>
            </Pressable>

            <Pressable
              style={{ padding: 14, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}
              onPress={async () => {
                hapticTap();
                setDurationModalOpen(false);
                let notificationId: string | null = null;
                try {
                  notificationId = await Notifications.scheduleNotificationAsync({
                    content: {
                      title: `How did ${dogName} handle the walk?`,
                      body: `Tap to record a 1-tap private check-in for ${dogName}.`,
                      sound: true,
                      data: { 
                        type: 'post_walk_checkin',
                        url: '/post-walk'
                      },
                    },
                    trigger: {
                      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                      seconds: (45 + 5) * 60,
                    },
                  });
                } catch (_) {}
                const out = await startOuting({
                  dogId: dogProfile?.dogName || 'default_dog',
                  expectedDurationMinutes: 45,
                  source: 'home',
                  snapshot: {
                    id: `snap_${Date.now()}`,
                    weatherTimestamp: new Date().toISOString(),
                    algorithmVersion: '5.4.1',
                    surfaceType: selectedSurface,
                    estimatedSurfaceF: currentRoadPoint?.roadTempF ?? 77,
                    confidence: 'high',
                    riskCategory: currentRoadPoint?.roadBand ?? 'safe',
                  },
                  notificationId,
                });
                setActiveOuting(out);
              }}>
              <MaterialCommunityIcons name="hiking" size={22} color={palette.tint} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: palette.text }}>Long (45 min)</Text>
                <Text style={{ fontSize: 12, color: palette.textSecondary }}>Extended trail or park outing</Text>
              </View>
            </Pressable>

            <Pressable
              style={{ padding: 12, alignItems: 'center' }}
              onPress={() => setDurationModalOpen(false)}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: palette.textSecondary }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <FeedbackModal
        visible={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        initialType={feedbackInitialType}
      />
      <ReviewPromptModal
        visible={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
      />
      <Modal
        visible={showUpgradeTermsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {}}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <BlurView
            intensity={90}
            tint={isDark ? 'dark' : 'light'}
            style={{
              width: '100%',
              maxHeight: '85%',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(18, 31, 24, 0.10)',
              backgroundColor: isDark ? 'rgba(15, 23, 20, 0.92)' : 'rgba(242, 248, 239, 0.95)',
              overflow: 'hidden',
              padding: 24,
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
              <MaterialCommunityIcons name="shield-check" size={54} color={palette.tint} style={{ marginBottom: 16 }} />
              
              <Text style={{ color: palette.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 12 }}>
                Updated Terms & Disclaimer
              </Text>
              
              <Text style={{ color: palette.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
                We've updated our safety guidelines for NorthPaw. This reminder appears once per app update to keep safety standards current. Please review and accept to proceed.
              </Text>

              <View style={{ borderColor: palette.border, backgroundColor: palette.surface, padding: 14, borderRadius: 16, marginBottom: 20, borderWidth: 1, width: '100%' }}>
                <Text style={{ color: palette.textSecondary, fontSize: 12, lineHeight: 18 }}>
                  <Text style={{ fontWeight: '700', color: palette.text }}>Disclaimer: </Text>
                  NorthPaw is for general outdoor education. It is not veterinary, legal, or emergency medical advice. Always perform a physical Hand Test on pavement before walking and consult professionals for health/safety concerns. Pavement estimations are thermodynamic calculations based on localized weather forecasts and can vary from actual conditions.
                </Text>
              </View>

              <Pressable
                onPress={() => { hapticTap(); setUpgradeDisclaimerAgreed(!upgradeDisclaimerAgreed); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, width: '100%', paddingHorizontal: 4 }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: upgradeDisclaimerAgreed }}
                accessibilityLabel="I agree to the Terms of Service & Liability Disclaimer"
              >
                <MaterialCommunityIcons
                  name={upgradeDisclaimerAgreed ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={22}
                  color={upgradeDisclaimerAgreed ? palette.tint : palette.textSecondary}
                />
                <Text style={{ color: palette.text, fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 }}>
                  I agree to the Terms of Service & Liability Disclaimer
                </Text>
              </Pressable>

              <Pressable
                disabled={!upgradeDisclaimerAgreed}
                onPress={async () => {
                  hapticTap();
                  trackEvent('disclaimer_accepted', { is_upgrade_flow: true });
                  try {
                    await AsyncStorage.setItem('@northpaw/disclaimer_accepted_version', REQUIRED_DISCLAIMER_VERSION);
                    setShowUpgradeTermsModal(false);
                  } catch (err) {
                    console.warn('[Home] Failed to save disclaimer version to AsyncStorage', err);
                  }
                }}
                style={({ pressed }) => [
                  {
                    backgroundColor: upgradeDisclaimerAgreed ? palette.tint : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                    width: '100%',
                    paddingVertical: 15,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed && upgradeDisclaimerAgreed ? 0.9 : 1,
                  }
                ]}
              >
                <Text style={{ color: upgradeDisclaimerAgreed ? '#fff' : palette.textSecondary, fontSize: 16, fontWeight: '800' }}>
                  Accept & Continue
                </Text>
              </Pressable>
            </ScrollView>
          </BlurView>
        </View>
      </Modal>
      {/* Off-screen capture container for image generation */}
      <View style={styles.shareCardHiddenWrapper}>
        <ShareCard
          ref={viewRef}
          dogName={dogName}
          dogBreed={dogProfile?.dogBreed || 'Unknown'}
          dogPhotoUri={dogProfile?.dogPhotoUri || null}
          dogSnoutProfile={dogProfile?.dogSnoutProfile || 'standard'}
          dogCoatType={dogProfile?.dogCoatType || 'Standard'}
          locationName={(weather as any)?.place || 'Local Area'}
          currentTempF={(weather as any)?.tempF ?? 77}
          currentNpi={npiScore ?? 0}
          bestWindows={bestWindows}
          selectedSurface={selectedSurface}
          surfaceTempF={currentRoadPoint?.roadTempF ?? 77}
          roadBand={currentRoadPoint?.roadBand || 'safe'}
          formattedDate={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shareCardHiddenWrapper: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  container: { paddingHorizontal: 18, paddingBottom: 140 },
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
  headerProGhost: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  headerProGhostText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroClockButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroClockHandHour: {
    position: 'absolute',
    width: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    top: 5,
    left: 9.5,
  },
  heroClockHandMinute: {
    position: 'absolute',
    width: 4,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    top: 9.5,
    left: 9.5,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroBlock: { alignItems: 'stretch', marginBottom: 28, width: '100%' },
  heroGlassShell: {
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 20,
    shadowColor: '#000',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    height: cardSize * 0.93,
  },
  heroGlassBg: StyleSheet.absoluteFillObject,
  heroGlassBgImage: { opacity: 0.85 },
  heroGlassContent: { position: 'relative' },
  heroLoading: { alignItems: 'center', paddingVertical: 20 },
  heroLoadingText: { marginTop: 12, fontSize: 14 },
  permissionText: { textAlign: 'center', fontSize: 15, lineHeight: 22, paddingHorizontal: 8 },
  heroRowSplit: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  avatarWrapper: {
    width: avatarRingSize,
    height: avatarRingSize,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
  heroPhotoCol: {
    width: avatarPhotoSize,
    height: avatarPhotoSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroReadinessCol: { flex: 1, minWidth: 0, paddingTop: 2 },
  heroReadinessPlaceholder: { justifyContent: 'center', minHeight: 144 },
  heroDogCircle: {
    width: avatarPhotoSize,
    height: avatarPhotoSize,
    borderRadius: avatarPhotoSize / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    backgroundColor: 'rgba(45,106,79,0.08)',
  },
  heroDogPh: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  customizeBadge: {
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  customizeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  hudCornerTl: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudCornerTr: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudCornerBl: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  hudCornerBr: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'flex-end',
  },
  hudLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginTop: 2,
  },
  hudKicker: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textTransform: 'uppercase',
  },
  hudValue: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: '#EAEAEA',
    fontWeight: '700',
  },
  heroBestWindow: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: 'rgba(234, 234, 234, 0.6)',
    marginTop: 6,
    textAlign: 'center',
  },
  heroBestWindowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
  },
  heroBestWindowPillText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '700',
  },
  readinessFieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
    marginBottom: 3,
  },
  readinessHeadline: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(234, 234, 234, 0.9)',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  readinessNpi: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  npiRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  npiTextCol: { flex: 1, minWidth: 0 },
  npiBandText: { fontSize: 12, fontWeight: '700' },
  heroModeToggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  heroModeChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'transparent' },
  heroModeChipText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroAdvisorText: { fontSize: 13, lineHeight: 18, marginTop: 4, fontWeight: '600' },
  bestWindowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bestWindowDot: { width: 8, height: 8, borderRadius: 4 },
  bestWindowTime: { fontSize: 14, fontWeight: '700' },
  bestWindowStatus: { fontSize: 11, fontWeight: '600' },
  heroVerifyCta: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, alignSelf: 'flex-start' },
  heroVerifyCtaText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  breedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  breedBadgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  confidenceBadge: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  confidenceLabel: { fontSize: 11, fontWeight: '800' },
  confidenceDetail: { fontSize: 11, marginTop: 1 },
  whyScoreLink: { marginTop: 4, alignSelf: 'flex-start' },
  whyScoreText: { fontSize: 12, fontWeight: '800', textDecorationLine: 'underline' },
  dailyReadinessCard: {
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  dailyReadinessHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dailyReadinessLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  hazardIconChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(243,156,18,0.35)',
    backgroundColor: 'rgba(243,156,18,0.12)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hazardIconChipText: { color: RISK_AMBER, fontSize: 10, fontWeight: '800' },
  dailyReadinessBody: { fontSize: 15, lineHeight: 21, fontWeight: '700' },
  hazardAlertWrap: { marginTop: 8 },
  hazardAlertLine: { marginTop: 8, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  hazardMoreChip: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hazardMoreText: { color: '#EDEDED', fontSize: 11, fontWeight: '700' },
  hazardSecondaryLine: { marginTop: 6, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  packHintCard: {
    marginTop: 10,
    borderTopWidth: 1,
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  packPreviewHint: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  packToggleButton: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  packToggleButtonText: { fontSize: 12, fontWeight: '700' },
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
  verifySurfaceButton: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(243,156,18,0.14)',
  },
  verifySurfaceButtonText: { fontSize: 13, fontWeight: '800' },
  verifySurfaceButtonSub: { fontSize: 11, marginTop: 2 },
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
    borderRadius: 24,
    marginBottom: 14,
  },
  timelineBarsBg: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timelineBarsBgImage: {
    opacity: 0.95,
  },
  timelineBarsHeader: { marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timelineBarsTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
  timelineDragHint: { fontSize: 11, fontWeight: '700' },
  timelineBarsWrap: { position: 'relative' },
  timelineScrubPopup: {
    position: 'absolute',
    top: -52,
    width: 132,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 8,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
  },
  timelineScrubTime: { fontSize: 13, fontWeight: '800' },
  timelineScrubTemp: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  timelineScrubBand: { fontSize: 11, marginTop: 2, lineHeight: 14 },
  timelineBestOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 8,
    backgroundColor: 'rgba(46, 204, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.25)',
    zIndex: 1,
  },
  timelineNowLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.95)',
    zIndex: 4,
  },
  timelineNowThumb: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    top: '50%',
    transform: [{ translateY: -16 }, { translateX: -16 }],
    zIndex: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  timelineNowThumbInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  barLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' as const, marginBottom: 4, marginTop: 6 },
  barTrack: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 2,
    marginTop: 20,
    marginBottom: 20,
  },
  barSegment: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  timelinePillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  timelinePillButtonYellow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#F5C518',
    overflow: 'hidden',
  },
  timelinePillButtonText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  timelinePillButtonTextDark: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: '#121F18',
  },
  bestWindowLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#2D6A4F',
    zIndex: 5,
  },
  timelineRulerTicks: {
    height: 20,
    position: 'relative',
    marginTop: 10,
    width: '100%',
  },
  rulerTickContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: 30,
    marginLeft: -15,
  },
  rulerTickLine: {
    width: 1,
    height: 6,
    marginBottom: 4,
  },
  rulerTickLabel: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '700',
  },
  surfaceCycleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  surfaceCycleText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(234, 234, 234, 0.5)',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  timelineSecondaryLink: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(234, 234, 234, 0.5)',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
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
  npiExplainCard: { borderWidth: 1, borderRadius: 16, padding: 14 },
  npiExplainRow: { fontSize: 14, lineHeight: 21, marginBottom: 6 },
  verifyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  verifyCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    alignItems: 'center',
  },
  verifyTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  verifySub: { marginTop: 6, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  verifyCanvasWrap: { marginTop: 18, width: 216, height: 216, alignItems: 'center', justifyContent: 'center' },
  verifyCenterTextWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  verifySeconds: { fontSize: 38, fontWeight: '900' },
  verifyResolution: { marginTop: 16, fontSize: 18, fontWeight: '800', textAlign: 'center', lineHeight: 24 },
  verifyAction: {
    marginTop: 18,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    width: '100%',
    alignItems: 'center',
  },
  verifyActionText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  surfaceChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  surfaceChipText: { fontSize: 11, fontWeight: '700' },
  surfaceComparisonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12, marginBottom: 12 },
  compareCard: { flex: 1, minWidth: '45%', borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center' },
  compareLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  compareValue: { fontSize: 24, fontWeight: '800' },
  compareBand: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  scienceSection: { paddingHorizontal: 4, paddingBottom: 20 },
  scienceTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  scienceBody: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  scienceSourceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  scienceSourceText: { flex: 1, fontSize: 13, lineHeight: 18 },
  surfaceChipRow: { flexDirection: 'row', gap: 6 },
  h2: {
    fontSize: 20,
    fontWeight: '800',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  verifyClose: { marginTop: 12, paddingVertical: 6, paddingHorizontal: 12 },
  verifyCloseText: { fontSize: 13, fontWeight: '700' },
});
