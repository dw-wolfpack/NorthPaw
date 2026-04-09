import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import {
  canAccessPack,
  getAllChecklists,
  getAllPacks,
  getLibrary,
} from '@/lib/content';
import { gradientForPack, IMAGES } from '@/lib/contentVisuals';
import { listChecklistOutings, listFavorites } from '@/lib/database';
import { getDogProfile, type DogProfile } from '@/lib/profile';
import { fetchUsWeatherForDeviceLocation, type HomeWeatherState } from '@/lib/weather/nwsWeather';
import { buildWeatherSuggestions } from '@/lib/weather/weatherSuggestions';
import { useColorScheme } from '@/components/useColorScheme';

type TabName = 'home' | 'index' | 'checklists' | 'scan';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const navigation = useNavigation();
  const router = useRouter();
  const { isPro } = useSubscription();
  const lib = getLibrary();
  const packs = getAllPacks();
  const lists = getAllChecklists();
  const homeGrad = gradientForPack('trail-basics');

  const accessibleCards = lib.cards.filter((c) => canAccessPack(c.packId, isPro)).length;
  const totalCards = lib.cards.length;

  const [favoritesCount, setFavoritesCount] = useState(0);
  const [outingsCount, setOutingsCount] = useState(0);
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
        const favs = await listFavorites();
        const outings = await listChecklistOutings(500);
        const profile = await getDogProfile();
        if (!gone) {
          setFavoritesCount(favs.length);
          setOutingsCount(outings.length);
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

  return (
    <>
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.container}>
      <View style={[styles.hero, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <Image source={IMAGES.homeHero} style={styles.heroImg} contentFit="cover" />
        <LinearGradient
          colors={[`${homeGrad[0]}cc`, homeGrad[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroInner}>
          <View style={styles.heroTitleRow}>
            <Pressable
              onPress={() => router.push('/dog-profile')}
              style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Dog profile and photo">
              {dogProfile?.dogPhotoUri ? (
                <Image
                  source={{ uri: dogProfile.dogPhotoUri }}
                  style={styles.heroDogAvatar}
                  contentFit="cover"
                  cachePolicy="none"
                  recyclingKey={dogProfile.dogPhotoUri}
                />
              ) : (
                <View style={[styles.heroDogAvatar, styles.heroDogAvatarPlaceholder]}>
                  <MaterialCommunityIcons name="paw" size={52} color="rgba(255,255,255,0.95)" />
                </View>
              )}
            </Pressable>
            <View style={styles.heroTitleCol}>
              <Text
                style={styles.heroPupName}
                lightColor="#fff"
                darkColor="#fff"
                numberOfLines={2}>
                Welcome {dogProfile?.dogName?.trim() || 'your pup'}
              </Text>
              <Text
                style={styles.heroNurtureLine}
                lightColor="rgba(255,255,255,0.94)"
                darkColor="rgba(255,255,255,0.94)">
                {dogProfile?.dogName?.trim()
                  ? 'Good to see you both — here’s what’s ready for your next outing.'
                  : 'Add their name and a photo from your dog’s profile.'}
              </Text>
              <Text
                style={styles.heroSub}
                lightColor="rgba(255,255,255,0.88)"
                darkColor="rgba(255,255,255,0.88)">
                Field cards stay on-device; US weather uses your location and api.weather.gov when you allow it.
              </Text>
            </View>
          </View>
          <View style={styles.heroBadgeRow}>
            {isPro ? (
              <View
                style={styles.heroBadgeOutline}
                accessibilityRole="text"
                accessibilityLabel="NorthPaw Pro, official badge">
                <MaterialCommunityIcons
                  name="shield-check"
                  size={14}
                  color="rgba(255,255,255,0.98)"
                  style={styles.heroBadgeIcon}
                />
                <Text
                  style={styles.heroBadgeKicker}
                  lightColor="rgba(255,255,255,0.9)"
                  darkColor="rgba(255,255,255,0.9)"
                  numberOfLines={1}>
                  Official
                </Text>
                <View style={styles.heroBadgeDivider} />
                <Text
                  style={styles.heroBadgeTitle}
                  lightColor="#fff"
                  darkColor="#fff"
                  numberOfLines={1}>
                  NorthPaw
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/paywall', params: { returnTo: '/(tabs)/home' } })
                }
                style={({ pressed }) => [styles.heroBadgeOutline, { opacity: pressed ? 0.86 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Become official, unlock NorthPaw Pro">
                <MaterialCommunityIcons
                  name="shield-outline"
                  size={14}
                  color="rgba(255,255,255,0.95)"
                  style={styles.heroBadgeIcon}
                />
                <Text
                  style={styles.heroBadgeKicker}
                  lightColor="rgba(255,255,255,0.9)"
                  darkColor="rgba(255,255,255,0.9)"
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  Become official
                </Text>
                <View style={styles.heroBadgeDivider} />
                <Text
                  style={styles.heroBadgeTitle}
                  lightColor="#fff"
                  darkColor="#fff"
                  numberOfLines={1}>
                  NorthPaw
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => router.push('/reminders')}
              style={({ pressed }) => [styles.heroReminderBtn, { opacity: pressed ? 0.88 : 1 }]}
              accessibilityRole="button"
              accessibilityHint="Opens schedules for heartworm, flea and tick, and optional custom reminders"
              accessibilityLabel="Set reminders">
              <MaterialCommunityIcons
                name="bell-ring-outline"
                size={14}
                color="rgba(255,255,255,0.98)"
                style={styles.heroReminderBtnIcon}
              />
              <Text
                style={styles.heroReminderBtnText}
                lightColor="#fff"
                darkColor="#fff"
                numberOfLines={1}>
                Reminders
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.weatherCard,
          { borderColor: palette.border, backgroundColor: palette.surface },
        ]}>
        {weather.status === 'loading' && (
          <View style={styles.weatherRow}>
            <ActivityIndicator size="small" color={palette.tint} />
            <Text style={{ marginLeft: 10, color: palette.textSecondary }}>Loading local weather…</Text>
          </View>
        )}
        {weather.status === 'permission_denied' && (
          <>
            <Text style={[styles.weatherTitle, { color: palette.text }]}>Local weather</Text>
            <Text style={[styles.weatherBody, { color: palette.textSecondary }]}>
              Allow location to show conditions from the National Weather Service for where you are (US only).
            </Text>
            <Pressable
              onPress={() => Linking.openSettings()}
              style={({ pressed }) => [styles.weatherButton, { opacity: pressed ? 0.85 : 1 }]}>
              <Text style={{ color: palette.tint, fontWeight: '700' }}>Open Settings</Text>
            </Pressable>
          </>
        )}
        {weather.status === 'unavailable' && (
          <>
            <Text style={[styles.weatherTitle, { color: palette.text }]}>Local weather</Text>
            <Text style={[styles.weatherBody, { color: palette.textSecondary }]}>{weather.message}</Text>
          </>
        )}
        {weather.status === 'ok' && (
          <Pressable
            onPress={() => setWeatherModalOpen(true)}
            style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1 }]}>
            <View style={styles.weatherHeader}>
              <FontAwesome name="cloud" size={22} color={palette.tint} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.weatherTitle, { color: palette.text, marginBottom: 0 }]}>Local weather</Text>
                <Text style={{ color: palette.textSecondary, fontSize: 13, marginTop: 2 }}>{weather.place}</Text>
              </View>
              <Text style={[styles.weatherTemp, { color: palette.text }]}>{weather.tempF}°F</Text>
            </View>
            <Text style={[styles.weatherSummaryCompact, { color: palette.text }]} numberOfLines={2}>
              {weather.summary}
            </Text>
            <View style={styles.weatherTapHint}>
              <Text style={{ color: palette.tint, fontWeight: '700', fontSize: 13 }}>
                Trail suggestions for these conditions
              </Text>
              <FontAwesome name="chevron-right" size={13} color={palette.tint} />
            </View>
          </Pressable>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: palette.text }]}>At a glance</Text>
      <Text style={{ color: palette.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 10 }}>
        Tap a tile to open that part of the app.
      </Text>
      <View style={styles.statGrid}>
        <Pressable
          onPress={() => goToTab('index')}
          style={({ pressed }) => [
            styles.statCard,
            {
              borderColor: palette.border,
              backgroundColor: palette.surface,
              opacity: pressed ? 0.92 : 1,
            },
          ]}>
          <Text style={[styles.statValue, { color: palette.text }]}>{accessibleCards}</Text>
          <Text style={[styles.statLabel, { color: palette.textSecondary }]}>
            Field cards{!isPro && totalCards > accessibleCards ? ` · ${totalCards} total with Pro` : ''}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => goToTab('index')}
          style={({ pressed }) => [
            styles.statCard,
            {
              borderColor: palette.border,
              backgroundColor: palette.surface,
              opacity: pressed ? 0.92 : 1,
            },
          ]}>
          <Text style={[styles.statValue, { color: palette.text }]}>{packs.length}</Text>
          <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Packs</Text>
        </Pressable>
        <Pressable
          onPress={() => goToTab('checklists')}
          style={({ pressed }) => [
            styles.statCard,
            {
              borderColor: palette.border,
              backgroundColor: palette.surface,
              opacity: pressed ? 0.92 : 1,
            },
          ]}>
          <Text style={[styles.statValue, { color: palette.text }]}>{lists.length}</Text>
          <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Checklists</Text>
        </Pressable>
        <Pressable
          onPress={() => goToTab('index')}
          style={({ pressed }) => [
            styles.statCard,
            {
              borderColor: palette.border,
              backgroundColor: palette.surface,
              opacity: pressed ? 0.92 : 1,
            },
          ]}>
          <Text style={[styles.statValue, { color: palette.text }]}>{favoritesCount}</Text>
          <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Favorites</Text>
        </Pressable>
        <Pressable
          onPress={() => goToTab('checklists')}
          style={({ pressed }) => [
            styles.statCard,
            styles.statCardWide,
            {
              borderColor: palette.border,
              backgroundColor: palette.surface,
              opacity: pressed ? 0.92 : 1,
            },
          ]}>
          <Text style={[styles.statValue, { color: palette.text }]}>
            {isPro ? outingsCount : '-'}
          </Text>
          <Text style={[styles.statLabel, { color: palette.textSecondary }]}>
            {isPro ? 'Outing logs' : 'Outing logs (Pro)'}
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 8 }]}>Go to</Text>
      {(
        [
          { label: 'Library', screen: 'index' as const, icon: 'book' as const },
          { label: 'Checklists', screen: 'checklists' as const, icon: 'list-ul' as const },
          { label: 'Scan QR', screen: 'scan' as const, icon: 'qrcode' as const },
        ] as const
      ).map((item) => (
        <Pressable
          key={item.screen}
          onPress={() => goToTab(item.screen)}
          style={({ pressed }) => [
            styles.linkRow,
            {
              borderColor: palette.border,
              backgroundColor: palette.surface,
              opacity: pressed ? 0.92 : 1,
            },
          ]}>
          <FontAwesome name={item.icon} size={20} color={palette.tint} style={styles.linkIcon} />
          <Text style={{ flex: 1, color: palette.text, fontWeight: '700', fontSize: 16 }}>{item.label}</Text>
          <FontAwesome name="chevron-right" size={14} color={palette.textSecondary} />
        </Pressable>
      ))}
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
              <Text style={[styles.weatherTemp, { color: palette.text }]}>{weatherOk.tempF}°F</Text>
            </View>
            <Text style={[styles.weatherSummary, { color: palette.text }]}>{weatherOk.summary}</Text>
            {weatherOk.windLine ? (
              <Text style={[styles.weatherMeta, { color: palette.textSecondary }]}>Wind {weatherOk.windLine}</Text>
            ) : null}
            {weatherOk.updatedLabel ? (
              <Text style={[styles.weatherMeta, { color: palette.textSecondary, marginTop: 4 }]}>
                Updated {weatherOk.updatedLabel}
              </Text>
            ) : null}
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
  hero: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 208,
    marginBottom: 20,
  },
  heroImg: { ...StyleSheet.absoluteFillObject },
  heroInner: { padding: 18, minHeight: 210, justifyContent: 'flex-end' },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 16 },
  heroDogAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  heroDogAvatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  statCard: {
    width: '47%',
    flexGrow: 1,
    minWidth: '42%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  statCardWide: {
    width: '100%',
    minWidth: '100%',
  },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 13, lineHeight: 18, marginTop: 6 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  linkIcon: { marginRight: 14, width: 24 },
});
