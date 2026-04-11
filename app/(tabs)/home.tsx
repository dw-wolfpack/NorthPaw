import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import {
  canAccessPack,
  getLibrary,
} from '@/lib/content';
import { gradientForPack, IMAGES } from '@/lib/contentVisuals';
import { getDogProfile, type DogProfile } from '@/lib/profile';
import { fetchUsWeatherForDeviceLocation, type HomeWeatherState } from '@/lib/weather/nwsWeather';
import { buildWeatherSuggestions } from '@/lib/weather/weatherSuggestions';
import { useColorScheme } from '@/components/useColorScheme';

type TabName = 'home' | 'index' | 'checklists' | 'scan';

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

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const navigation = useNavigation();
  const router = useRouter();
  const { isPro } = useSubscription();
  const lib = getLibrary();
  const homeGrad = gradientForPack('trail-basics');

  const accessibleCards = lib.cards.filter((c) => canAccessPack(c.packId, isPro)).length;
  const [weather, setWeather] = useState<HomeWeatherState>({ status: 'loading' });
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);
  const [dogProfile, setDogProfile] = useState<DogProfile | null>(null);

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

  const goToTab = useCallback(
    (screen: TabName) => {
      navigation.navigate(screen as never);
    },
    [navigation]
  );

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
  const checklistSuggestion = weatherSuggestions.find((s) => s.kind === 'checklist');
  const checklistCtaId = checklistSuggestion?.id ?? 'pre-trail-60s';
  const checklistCtaTitle = checklistSuggestion?.title ?? 'Pre-trail 60-second check';
  const checklistCtaLabel = checklistSuggestion ? `Start ${checklistSuggestion.title}` : 'Start quick pre-trail check';

  return (
    <>
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.container}>
      <View style={styles.topQuickRow}>
        {isPro ? (
          <View style={[styles.topQuickChip, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <MaterialCommunityIcons name="shield-check" size={14} color={palette.text} style={styles.heroBadgeIcon} />
            <Text style={styles.topQuickChipText} lightColor={palette.text} darkColor={palette.text}>
              NorthPaw Pro
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={() => router.push({ pathname: '/paywall', params: { returnTo: '/(tabs)/home' } })}
            style={({ pressed }) => [
              styles.topQuickChip,
              { borderColor: palette.border, backgroundColor: palette.surface, opacity: pressed ? 0.9 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Become official, unlock NorthPaw Pro">
            <MaterialCommunityIcons name="shield-outline" size={14} color={palette.text} style={styles.heroBadgeIcon} />
            <Text style={styles.topQuickChipText} lightColor={palette.text} darkColor={palette.text}>
              Become official
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            if (weather.status === 'ok') setWeatherModalOpen(true);
          }}
          style={({ pressed }) => [
            styles.topQuickChip,
            {
              borderColor: palette.border,
              backgroundColor: palette.surface,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Current weather">
          <FontAwesome name="cloud" size={13} color={palette.text} style={{ marginRight: 6 }} />
          <Text style={styles.topQuickChipText} lightColor={palette.text} darkColor={palette.text} numberOfLines={1}>
            {weather.status === 'ok' ? `Current ${weather.tempF}°` : 'Current weather'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/reminders')}
          style={({ pressed }) => [
            styles.topQuickChip,
            { borderColor: palette.border, backgroundColor: palette.surface, opacity: pressed ? 0.9 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Set reminders">
          <MaterialCommunityIcons
            name="bell-ring-outline"
            size={14}
            color={palette.text}
            style={styles.heroReminderBtnIcon}
          />
          <Text style={styles.topQuickChipText} lightColor={palette.text} darkColor={palette.text}>
            Reminders
          </Text>
        </Pressable>
      </View>

      <View style={[styles.hero, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <Image source={IMAGES.homeHero} style={styles.heroImg} contentFit="cover" />
        <LinearGradient
          colors={[`${homeGrad[0]}cc`, homeGrad[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroInner}>
          <View style={styles.heroWeatherTop}>
            <View style={styles.heroTitleCol}>
              <Text style={styles.heroWeatherLabel} lightColor="rgba(255,255,255,0.82)" darkColor="rgba(255,255,255,0.82)">
                Local weather
              </Text>
              <Text style={styles.heroPupName} lightColor="#fff" darkColor="#fff" numberOfLines={1}>
                for {dogProfile?.dogName?.trim() || 'your pup'}
              </Text>
              {weather.status === 'ok' ? (
                <Text style={styles.heroSub} lightColor="rgba(255,255,255,0.88)" darkColor="rgba(255,255,255,0.88)">
                  {weather.place}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => router.push('/dog-profile')}
              style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Dog profile and photo">
              {dogProfile?.dogPhotoUri ? (
                <Image
                  source={{ uri: dogProfile.dogPhotoUri }}
                  style={styles.heroDogAvatarSmall}
                  contentFit="cover"
                  cachePolicy="none"
                  recyclingKey={dogProfile.dogPhotoUri}
                />
              ) : (
                <View style={[styles.heroDogAvatarSmall, styles.heroDogAvatarPlaceholder]}>
                  <MaterialCommunityIcons name="paw" size={24} color="rgba(255,255,255,0.95)" />
                </View>
              )}
            </Pressable>
          </View>

          {weather.status === 'loading' ? (
            <View style={styles.weatherRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={{ marginLeft: 10, color: 'rgba(255,255,255,0.9)' }}>
                Getting local conditions…
              </Text>
            </View>
          ) : weather.status === 'permission_denied' ? (
            <Text style={[styles.weatherSummaryCompact, { color: '#fff' }]}>
              Allow location to show local conditions (US only).
            </Text>
          ) : weather.status === 'unavailable' ? (
            <Text style={[styles.weatherSummaryCompact, { color: '#fff' }]}>{weather.message}</Text>
          ) : (
            <Pressable
              onPress={() => setWeatherModalOpen(true)}
              style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1 }]}>
              <View style={styles.heroWeatherHead}>
                <Text style={styles.heroWeatherSignal} lightColor="#fff" darkColor="#fff" numberOfLines={2}>
                  {readiness?.signal ?? weather.summary}
                </Text>
                <Text style={styles.heroWeatherTemp} lightColor="#fff" darkColor="#fff">
                  {weather.tempF}°F
                </Text>
              </View>
              <Text style={[styles.heroWeatherMeaning, { color: '#fff' }]} numberOfLines={3}>
                {readiness?.meaning ?? weather.summary}
              </Text>
              <Text style={styles.heroWeatherHint} lightColor="rgba(255,255,255,0.85)" darkColor="rgba(255,255,255,0.85)">
                Tap for full weather + weekend outlook
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {weatherOk ? (
        <>
          <View style={[styles.readinessCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <Text style={[styles.readinessLabel, { color: palette.textSecondary }]}>What changed</Text>
            <Text style={[styles.readinessTitle, { color: palette.text }]}>{readiness?.signal}</Text>
            <Text style={[styles.readinessBody, { color: palette.textSecondary }]}>
              Local weather in your area for {dogProfile?.dogName?.trim() || 'your dog'}.
            </Text>
          </View>

          <View style={[styles.readinessCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <Text style={[styles.readinessLabel, { color: palette.textSecondary }]}>What to change</Text>
            <Text style={[styles.readinessTitle, { color: palette.text }]}>{readiness?.meaning}</Text>
            <Text style={[styles.readinessBody, { color: palette.textSecondary }]}>
              {accessibleCards} weather-linked field cards are available right now.
            </Text>
          </View>

          <Pressable
            onPress={() => openSuggestion('checklist', checklistCtaId)}
            style={({ pressed }) => [
              styles.readinessAction,
              { borderColor: palette.border, backgroundColor: palette.surface, opacity: pressed ? 0.92 : 1 },
            ]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.readinessLabel, { color: palette.textSecondary }]}>Do this next</Text>
              <Text style={[styles.readinessTitle, { color: palette.text }]}>{checklistCtaLabel}</Text>
              <Text style={[styles.readinessBody, { color: palette.textSecondary }]} numberOfLines={2}>
                {checklistCtaTitle}
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={palette.textSecondary} />
          </Pressable>

          {readiness?.followThrough ? (
            <View
              style={[
                styles.readinessCard,
                styles.readinessFooterCard,
                { borderColor: palette.border, backgroundColor: palette.surface },
              ]}>
              <Text style={[styles.readinessLabel, { color: palette.textSecondary }]}>Later / follow-through</Text>
              <Text style={[styles.readinessFooterTitle, { color: palette.text }]}>{readiness.followThrough}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={[styles.readinessCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <Text style={[styles.readinessTitle, { color: palette.text }]}>Enable local weather to unlock readiness guidance</Text>
          <Text style={[styles.readinessBody, { color: palette.textSecondary }]}>
            NorthPaw surfaces a conditions signal, what it means for your outing, and one next action.
          </Text>
        </View>
      )}
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
          {weatherOk ? (
          <View style={[styles.modalWeatherBlock, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <View style={styles.weatherHeader}>
              <FontAwesome name="cloud" size={22} color={palette.tint} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.weatherTitle, { color: palette.text, marginBottom: 0 }]}>Local weather</Text>
                <Text style={{ color: palette.textSecondary, fontSize: 13, marginTop: 2 }}>{weatherOk.place}</Text>
              </View>
            </View>
            <Text style={[styles.weatherSectionLabel, { color: palette.textSecondary, marginTop: 6 }]}>Now</Text>
            <View style={styles.weatherNowRow}>
              <Text style={[styles.weatherTemp, { color: palette.text }]}>{weatherOk.tempF}°</Text>
              <Text style={[styles.weatherSummary, { color: palette.text, flex: 1, marginTop: 0 }]}>{weatherOk.summary}</Text>
            </View>
            {weatherOk.windLine ? (
              <Text style={[styles.weatherMeta, { color: palette.textSecondary }]}>Wind {weatherOk.windLine}</Text>
            ) : null}
            {weatherOk.updatedLabel ? (
              <Text style={[styles.weatherMeta, { color: palette.textSecondary, marginTop: 4 }]}>
                Updated {weatherOk.updatedLabel}
              </Text>
            ) : null}
            <View style={[styles.weatherDivider, { backgroundColor: palette.border, marginTop: 14 }]} />
            <Text style={[styles.weatherSectionLabel, { color: palette.textSecondary, marginTop: 12 }]}>
              Weekend outlook
            </Text>
            {weatherOk.weekendOutlook.length > 0 ? (
              weatherOk.weekendOutlook.map((w) => (
                <View key={`modal-${w.dayLabel}`} style={styles.weatherOutlookBlock}>
                  <View style={styles.weatherOutlookHead}>
                    <Text style={[styles.weatherWeekendDay, { color: palette.text }]}>{w.dayLabel}</Text>
                    <Text style={[styles.weatherWeekendTemp, { color: palette.text }]}>{w.tempF}°</Text>
                  </View>
                  <Text style={[styles.weatherWeekendForecast, { color: palette.textSecondary }]} numberOfLines={3}>
                    {w.shortForecast}
                    {w.precipChance != null ? ` · ${w.precipChance}% precip` : ''}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: palette.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 4 }}>
                No Sat/Sun daytime periods in the current forecast window.
              </Text>
            )}
            <Text style={[styles.weatherAttribution, { color: palette.textSecondary }]}>{weatherOk.sourceNote}</Text>
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
              No picks yet — open the Library for full packs.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  topQuickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  topQuickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexShrink: 1,
  },
  topQuickChipText: { fontSize: 12, fontWeight: '700' },
  hero: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 208,
    marginBottom: 20,
  },
  heroImg: { ...StyleSheet.absoluteFillObject },
  heroInner: { padding: 18, minHeight: 208, justifyContent: 'space-between' },
  heroWeatherTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heroDogAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  heroDogAvatarSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  heroDogAvatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWeatherLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  heroWeatherHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  heroWeatherSignal: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4, lineHeight: 30, flex: 1 },
  heroWeatherTemp: { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  heroWeatherMeaning: { fontSize: 15, lineHeight: 21, marginTop: 8, fontWeight: '600' },
  heroWeatherHint: { fontSize: 12, lineHeight: 16, marginTop: 10, fontWeight: '700' },
  heroTitleCol: { flex: 1, minWidth: 0 },
  heroPupName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6, lineHeight: 34 },
  heroNurtureLine: { fontSize: 14, lineHeight: 20, marginTop: 6, fontWeight: '600' },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    marginTop: 12,
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  heroBadgeOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
    paddingVertical: 5,
    paddingLeft: 6,
    paddingRight: 8,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.78)',
  },
  heroReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingVertical: 5,
    paddingLeft: 7,
    paddingRight: 8,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.78)',
  },
  heroReminderBtnIcon: { marginRight: 3 },
  heroReminderBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heroBadgeIcon: { marginRight: 2 },
  heroBadgeKicker: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    flexShrink: 1,
    minWidth: 0,
  },
  heroBadgeDivider: {
    width: 1,
    height: 11,
    marginHorizontal: 5,
    flexShrink: 0,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  heroBadgeTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.1,
    flexShrink: 0,
  },
  heroSub: { fontSize: 13, lineHeight: 18, marginTop: 8 },
  weatherCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  weatherRow: { flexDirection: 'row', alignItems: 'center' },
  weatherHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  weatherTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  weatherBody: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  weatherButton: { alignSelf: 'flex-start', paddingVertical: 8 },
  weatherSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
    marginTop: 12,
    marginBottom: 6,
  },
  weatherNowRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  weatherDivider: { height: StyleSheet.hairlineWidth, marginTop: 14 },
  weatherOutlookBlock: { marginBottom: 14 },
  weatherOutlookHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  weatherWeekendDay: { fontSize: 14, fontWeight: '800', flex: 1 },
  weatherWeekendTemp: { fontSize: 20, fontWeight: '800' },
  weatherWeekendForecast: { fontSize: 13, lineHeight: 18 },
  weatherTemp: { fontSize: 28, fontWeight: '800' },
  weatherSummary: { fontSize: 15, lineHeight: 22, marginTop: 10, fontWeight: '600' },
  weatherSummaryCompact: { fontSize: 15, lineHeight: 21, marginTop: 8, fontWeight: '600' },
  weatherTapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
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
  modalWeatherBlock: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
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
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  readinessCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  readinessAction: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  readinessLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  readinessTitle: { fontSize: 16, fontWeight: '800', lineHeight: 22, marginTop: 6 },
  readinessBody: { fontSize: 13, lineHeight: 18, marginTop: 8 },
  readinessFooterCard: { paddingVertical: 12 },
  readinessFooterTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20, marginTop: 6 },
});
