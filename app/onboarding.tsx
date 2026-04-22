import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { requestMedReminderPermissions } from '@/lib/medReminders';
import { pickAndStoreDogPhoto, saveDogProfile } from '@/lib/profile';
import { fetchUsWeatherForDeviceLocation, type HomeWeatherState } from '@/lib/weather/nwsWeather';
import { buildWeatherSuggestions } from '@/lib/weather/weatherSuggestions';
import { useColorScheme } from '@/components/useColorScheme';

type StepId =
  | 'welcome'
  | 'name'
  | 'photo'
  | 'breed'
  | 'biology'
  | 'age'
  | 'outings'
  | 'location'
  | 'aha'
  | 'notifications';

const STEPS: StepId[] = ['welcome', 'name', 'photo', 'breed', 'biology', 'age', 'outings', 'location', 'aha', 'notifications'];

const BREEDS = [
  'Labrador Retriever',
  'French Bulldog',
  'Golden Retriever',
  'German Shepherd',
  'Poodle',
  'Bulldog',
  'Rottweiler',
  'Beagle',
  'Dachshund',
  'German Shorthaired Pointer',
  'Pembroke Welsh Corgi',
  'Australian Shepherd',
  'Yorkshire Terrier',
  'Cavalier King Charles Spaniel',
  'Doberman Pinscher',
  'Boxer',
  'Siberian Husky',
  'Great Dane',
  'Bernese Mountain Dog',
  'Shih Tzu',
];

const AGE_OPTIONS: Array<{ id: string; title: string; subtitle: string }> = [
  { id: 'puppy', title: 'Puppy (under 1)', subtitle: 'Still building stamina.' },
  { id: 'young', title: 'Young (1-3)', subtitle: 'Energy to spare, still learning pace.' },
  { id: 'adult', title: 'Adult (3-7)', subtitle: 'Steady rhythm for most outings.' },
  { id: 'senior', title: 'Senior (7+)', subtitle: 'Wise and wonderful. Prioritize comfort.' },
];

const OUTING_OPTIONS = [
  'Neighborhood walks',
  'Trail hikes',
  'Park runs',
  'Beach days',
  'Mountain adventures',
  'Dog parks',
];

function displaySlot(isoStart: string, isoEnd: string): string {
  const s = new Date(isoStart);
  const e = new Date(isoEnd);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 'Today';
  return `${s.toLocaleTimeString([], { hour: 'numeric' })} to ${e.toLocaleTimeString([], { hour: 'numeric' })}`;
}

function buildBreedSafetyNote(name: string, breed: string, tempF: number, place: string): string {
  const lowerHeatBreeds = ['Bulldog', 'French Bulldog', 'Pug', 'Boxer', 'Shih Tzu'];
  const coolSensitiveBreeds = ['Siberian Husky', 'Bernese Mountain Dog', 'Great Dane'];
  const displayBreed = breed.trim() || 'your dog';

  const heatThreshold = lowerHeatBreeds.some((b) => displayBreed.includes(b)) ? 80 : 86;
  const location = place || 'your area';
  if (tempF >= heatThreshold) {
    return `${tempF}F in ${location}: too warm for ${displayBreed} past mid-morning. Keep the outing short and shaded.`;
  }
  if (tempF <= 40 && coolSensitiveBreeds.some((b) => displayBreed.includes(b))) {
    return `${tempF}F in ${location}: ${displayBreed} may need a shorter outing window and a warm-up layer.`;
  }
  return `${tempF}F in ${location}: solid conditions for ${name || 'your dog'} with normal hydration breaks.`;
}

function buildPackList(weather: Extract<HomeWeatherState, { status: 'ok' }>, outings: string[]): string[] {
  const list = ['Water and collapsible bowl', 'Waste bags', 'Leash + backup clip'];
  if (weather.tempF >= 82) list.push('Cooling towel or extra water bottle');
  if ((weather.precipChance ?? 0) >= 40 || /rain|storm|mud/i.test(weather.summary)) list.push('Towel for paws');
  if (outings.includes('Trail hikes') || outings.includes('Mountain adventures')) list.push('Tick check card');
  if (outings.includes('Beach days')) list.push('Rinse bottle for paws');
  return [...new Set(list)].slice(0, 5);
}

export default function OnboardingScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [name, setName] = useState('');
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [breedQuery, setBreedQuery] = useState('');
  const [breed, setBreed] = useState('');
  const [isMixedBreed, setIsMixedBreed] = useState(false);
  const [mixedPrimary, setMixedPrimary] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [dogWeightLbs, setDogWeightLbs] = useState('');
  const [dogCoatType, setDogCoatType] = useState('');
  const [dogColor, setDogColor] = useState('');
  const [outingTypes, setOutingTypes] = useState<string[]>([]);
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [notificationsPermission, setNotificationsPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [ahaWeather, setAhaWeather] = useState<HomeWeatherState>({ status: 'loading' });
  const [loadingAha, setLoadingAha] = useState(false);
  const [busy, setBusy] = useState(false);

  const spin = useRef(new Animated.Value(0)).current;
  const displayPhoto = pickedUri;
  const dogName = name.trim() || 'your dog';
  const step = STEPS[stepIdx];

  const ahaTopChecklist = useMemo(() => {
    if (ahaWeather.status !== 'ok') return { id: null as string | null, reason: null as string | null };
    const suggs = buildWeatherSuggestions(
      {
        tempF: ahaWeather.tempF,
        forecastShort: ahaWeather.forecastShort,
        summary: ahaWeather.summary,
        precipChance: ahaWeather.precipChance,
        isDaytime: ahaWeather.isDaytime,
        sunsetTimeIso: ahaWeather.sunsetTimeIso,
        mockAqi: ahaWeather.mockAqi,
        mockRecentRain: ahaWeather.mockRecentRain,
      },
      true,
      []
    );
    const firstCl = suggs.find((s) => s.kind === 'checklist');
    return {
      id: firstCl?.id ?? null,
      reason: firstCl?.reason ?? null,
    };
  }, [ahaWeather]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 18000,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [spin]);

  const compassSpin = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const filteredBreeds = useMemo(() => {
    const q = breedQuery.trim().toLowerCase();
    if (!q) return BREEDS;
    return BREEDS.filter((b) => b.toLowerCase().includes(q));
  }, [breedQuery]);

  const canAdvance = useMemo(() => {
    if (step === 'name') return name.trim().length > 0;
    if (step === 'breed') {
      if (isMixedBreed) return mixedPrimary.trim().length > 0;
      return breed.trim().length > 0;
    }
    if (step === 'age') return ageGroup.length > 0;
    if (step === 'outings') return outingTypes.length > 0;
    return true;
  }, [ageGroup, breed, isMixedBreed, mixedPrimary, name, outingTypes, step]);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setPickedUri(res.assets[0].uri);
    }
  };

  const loadAha = async () => {
    setLoadingAha(true);
    try {
      const weather = await fetchUsWeatherForDeviceLocation();
      setAhaWeather(weather);
    } catch {
      setAhaWeather({ status: 'unavailable', message: 'Could not load live conditions.' });
    } finally {
      setLoadingAha(false);
    }
  };

  const advance = () => {
    if (!canAdvance || stepIdx >= STEPS.length - 1) return;
    setStepIdx((s) => s + 1);
  };

  const goBack = () => {
    if (stepIdx <= 0 || busy) return;
    setStepIdx((s) => s - 1);
  };

  const requestLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status === 'granted') {
      setLocationPermission('granted');
      setStepIdx(STEPS.indexOf('aha'));
      await loadAha();
      return;
    }
    setLocationPermission('denied');
    setStepIdx(STEPS.indexOf('aha'));
    setAhaWeather({ status: 'permission_denied' });
  };

  const toggleOuting = (item: string) => {
    setOutingTypes((prev) => (prev.includes(item) ? prev.filter((o) => o !== item) : [...prev, item]));
  };

  const finishWithNotifications = async (askNative: boolean, deepLink?: string) => {
    if (busy) return;
    setBusy(true);
    try {
      let finalNotif: 'granted' | 'denied' = notificationsPermission === 'granted' ? 'granted' : 'denied';
      if (askNative) {
        const n = await requestMedReminderPermissions();
        finalNotif = n.ok ? 'granted' : 'denied';
      }
      setNotificationsPermission(finalNotif);

      let photoUri = '';
      if (pickedUri) {
        photoUri = await pickAndStoreDogPhoto(pickedUri);
      }
      const resolvedBreed = isMixedBreed ? 'Mixed breed' : breed.trim();
      await saveDogProfile({
        onboardingDone: true,
        dogName: name.trim(),
        dogPhotoUri: photoUri,
        dogBreed: resolvedBreed,
        dogBreedMix: isMixedBreed ? mixedPrimary.trim() : '',
        dogAgeGroup: ageGroup,
        dogOutingTypes: outingTypes,
        locationPermission,
        notificationsPermission: finalNotif,
        dogWeightLbs: parseInt(dogWeightLbs, 10) || null,
        dogCoatType: dogCoatType,
        dogColor: dogColor,
      });
      if (deepLink) {
        router.replace(deepLink as any);
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (e) {
      console.error('[Onboarding] save failed', e);
      Alert.alert(
        'Could not finish setup',
        e instanceof Error ? e.message : 'Something went wrong while saving setup. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const finish = async (deepLink?: string) => {
    await finishWithNotifications(true, deepLink);
  };

  const skipNotifications = async (deepLink?: string) => {
    await finishWithNotifications(false, deepLink);
  };

  const renderStep = () => {
    if (step === 'welcome') {
      return (
        <View>
          <Animated.View style={[styles.compassWrap, { transform: [{ rotate: compassSpin }] }]}>
            <MaterialCommunityIcons name="compass-rose" size={84} color={palette.tint} />
          </Animated.View>
          <Text style={[styles.h1, { color: palette.text }]}>Your dog&apos;s outdoor life, prepared.</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>
            We will set up NorthPaw around your dog in under a minute.
          </Text>
          <Pressable
            onPress={advance}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: palette.tint, opacity: pressed ? 0.9 : 1 },
            ]}>
            <Text style={styles.ctaText}>Get started</Text>
          </Pressable>
        </View>
      );
    }

    if (step === 'name') {
      return (
        <View>
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
            onPress={advance}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: canAdvance ? palette.tint : palette.border,
                opacity: pressed && canAdvance ? 0.9 : 1,
              },
            ]}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </View>
      );
    }

    if (step === 'photo') {
      return (
        <View>
          <Text style={[styles.h1, { color: palette.text }]}>Add a photo of {dogName}.</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>
            Optional. Photos stay on your device and are never uploaded.
          </Text>
          <Pressable
            onPress={pickPhoto}
            style={({ pressed }) => [
              styles.photoPreviewLarge,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
                opacity: pressed ? 0.92 : 1,
              },
            ]}>
            {displayPhoto ? (
              <Image source={{ uri: displayPhoto }} style={styles.photoImg} contentFit="cover" cachePolicy="none" />
            ) : (
              <View style={styles.photoWarmPlaceholder}>
                <MaterialCommunityIcons name="dog-side" size={74} color={palette.textSecondary} />
                <Text style={[styles.placeholderText, { color: palette.textSecondary }]}>Warm portrait placeholder</Text>
              </View>
            )}
          </Pressable>
          <View style={styles.rowButtons}>
            <Pressable onPress={pickPhoto} style={[styles.ghostBtn, { borderColor: palette.border }]}>
              <Text style={[styles.ghostText, { color: palette.text }]}>Choose photo</Text>
            </Pressable>
            <Pressable onPress={advance} style={[styles.ghostBtn, { borderColor: palette.border }]}>
              <Text style={[styles.ghostText, { color: palette.textSecondary }]}>Skip for now</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={advance}
            style={({ pressed }) => [styles.cta, { backgroundColor: palette.tint, opacity: pressed ? 0.9 : 1 }]}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </View>
      );
    }

    if (step === 'breed') {
      return (
        <View>
          <Text style={[styles.h1, { color: palette.text }]}>What breed is {dogName}?</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>
            We use this to set safe temperature and exertion thresholds for {dogName}.
          </Text>
          <TextInput
            value={breedQuery}
            onChangeText={setBreedQuery}
            placeholder="Search breeds"
            placeholderTextColor={palette.textSecondary}
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
            onPress={() => {
              setIsMixedBreed(!isMixedBreed);
              if (!isMixedBreed) setBreed('');
            }}
            style={({ pressed }) => [
              styles.mixedRow,
              { borderColor: palette.border, backgroundColor: isMixedBreed ? palette.surface : 'transparent', opacity: pressed ? 0.9 : 1 },
            ]}>
            <MaterialCommunityIcons name={isMixedBreed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={20} color={palette.tint} />
            <Text style={[styles.mixedLabel, { color: palette.text }]}>Mixed breed</Text>
          </Pressable>
          {isMixedBreed ? (
            <TextInput
              value={mixedPrimary}
              onChangeText={setMixedPrimary}
              placeholder="Primary mix (e.g. Lab mix)"
              placeholderTextColor={palette.textSecondary}
              style={[
                styles.input,
                {
                  marginTop: 10,
                  borderColor: palette.border,
                  backgroundColor: palette.surface,
                  color: palette.text,
                },
              ]}
            />
          ) : null}
          <ScrollView style={styles.breedScroll} contentContainerStyle={styles.breedGrid}>
            {filteredBreeds.map((item) => {
              const selected = !isMixedBreed && breed === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    setIsMixedBreed(false);
                    setBreed(item);
                  }}
                  style={({ pressed }) => [
                    styles.breedCard,
                    {
                      borderColor: selected ? palette.tint : palette.border,
                      backgroundColor: selected ? palette.surface : palette.background,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}>
                  <Text style={styles.breedIcon}>🐾</Text>
                  <Text style={[styles.breedText, { color: palette.text }]}>{item}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable
            disabled={!canAdvance}
            onPress={advance}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: canAdvance ? palette.tint : palette.border,
                opacity: pressed && canAdvance ? 0.9 : 1,
              },
            ]}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </View>
      );
    }

    if (step === 'biology') {
      return (
        <View>
          <Text style={[styles.h1, { color: palette.text }]}>Tell us more about {dogName}.</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>
            This adjusts heat warnings and hydration needs on packing lists.
          </Text>

          <Text style={[styles.label, { color: palette.text, marginBottom: 8 }]}>Weight (lbs)</Text>
          <TextInput
            value={dogWeightLbs}
            onChangeText={setDogWeightLbs}
            placeholder="e.g. 45"
            placeholderTextColor={palette.textSecondary}
            keyboardType="numeric"
            maxLength={3}
            style={[
              styles.input,
              { borderColor: palette.border, backgroundColor: palette.surface, color: palette.text, marginBottom: 16 }
            ]}
          />

          <Text style={[styles.label, { color: palette.text, marginBottom: 8 }]}>Coat Type</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {['Single', 'Double', 'Hairless'].map(coat => (
              <Pressable
                key={coat}
                onPress={() => setDogCoatType(coat)}
                style={[{ flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }, dogCoatType === coat ? { borderColor: palette.tint, backgroundColor: palette.surface } : { borderColor: palette.border }]}
              >
                <Text style={[{ fontSize: 13, fontWeight: '700' }, dogCoatType === coat ? { color: palette.text } : { color: palette.textSecondary }]}>{coat}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: palette.text, marginBottom: 8 }]}>Fur Color</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {['Light', 'Medium', 'Dark'].map(colorOpt => (
              <Pressable
                key={colorOpt}
                onPress={() => setDogColor(colorOpt)}
                style={[{ flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }, dogColor === colorOpt ? { borderColor: palette.tint, backgroundColor: palette.surface } : { borderColor: palette.border }]}
              >
                <Text style={[{ fontSize: 13, fontWeight: '700' }, dogColor === colorOpt ? { color: palette.text } : { color: palette.textSecondary }]}>{colorOpt}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.rowButtons, { marginTop: 10 }]}>
            <Pressable onPress={advance} style={[styles.ghostBtn, { borderColor: palette.border, flex: 1 }]}>
               <Text style={[styles.ghostText, { color: palette.text, textAlign: 'center' }]}>Continue</Text>
            </Pressable>
            <Pressable onPress={advance} style={[styles.ghostBtn, { borderColor: palette.border, flex: 1 }]}>
               <Text style={[styles.ghostText, { color: palette.textSecondary, textAlign: 'center' }]}>Skip for now</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (step === 'age') {
      return (
        <View>
          <Text style={[styles.h1, { color: palette.text }]}>How old is {dogName}?</Text>
          <View style={styles.cardList}>
            {AGE_OPTIONS.map((opt) => {
              const selected = ageGroup === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setAgeGroup(opt.id)}
                  style={({ pressed }) => [
                    styles.infoCard,
                    {
                      borderColor: selected ? palette.tint : palette.border,
                      backgroundColor: selected ? palette.surface : palette.background,
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}>
                  <Text style={[styles.cardTitle, { color: palette.text }]}>{opt.title}</Text>
                  <Text style={[styles.cardSubtitle, { color: palette.textSecondary }]}>{opt.subtitle}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            disabled={!canAdvance}
            onPress={advance}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: canAdvance ? palette.tint : palette.border,
                opacity: pressed && canAdvance ? 0.9 : 1,
              },
            ]}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </View>
      );
    }

    if (step === 'outings') {
      return (
        <View>
          <Text style={[styles.h1, { color: palette.text }]}>What does {dogName} love?</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>These choices shape pack lists and reminders.</Text>
          <View style={styles.cardList}>
            {OUTING_OPTIONS.map((item) => {
              const selected = outingTypes.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() => toggleOuting(item)}
                  style={({ pressed }) => [
                    styles.infoCard,
                    {
                      borderColor: selected ? palette.tint : palette.border,
                      backgroundColor: selected ? palette.surface : palette.background,
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}>
                  <Text style={[styles.cardTitle, { color: palette.text }]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            disabled={!canAdvance}
            onPress={advance}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: canAdvance ? palette.tint : palette.border,
                opacity: pressed && canAdvance ? 0.9 : 1,
              },
            ]}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </View>
      );
    }

    if (step === 'location') {
      return (
        <View>
          <Text style={[styles.h1, { color: palette.text }]}>{dogName} is ready. NorthPaw needs to know where you are.</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>
            We only read conditions when you open the app. No background tracking.
          </Text>
          <Pressable
            onPress={requestLocation}
            style={({ pressed }) => [styles.cta, { backgroundColor: palette.tint, opacity: pressed ? 0.9 : 1 }]}>
            <Text style={styles.ctaText}>Allow location access</Text>
          </Pressable>
          <Pressable onPress={() => setStepIdx(STEPS.indexOf('aha'))} style={styles.skipLink}>
            <Text style={[styles.skipText, { color: palette.textSecondary }]}>Continue without location</Text>
          </Pressable>
        </View>
      );
    }

    if (step === 'aha') {
      const selectedBreed = isMixedBreed ? `Mixed breed (${mixedPrimary.trim() || 'primary mix'})` : breed;
      const note =
        ahaWeather.status === 'ok'
          ? buildBreedSafetyNote(dogName, selectedBreed, ahaWeather.tempF, ahaWeather.place)
          : `${dogName} can still use NorthPaw. Turn location on anytime for live conditions.`;
      const bestWindow =
        ahaWeather.status === 'ok' && ahaWeather.timelineSlots.length > 0
          ? displaySlot(ahaWeather.timelineSlots[0].startTime, ahaWeather.timelineSlots[0].endTime)
          : 'Today, once location is enabled';
      const packList = ahaWeather.status === 'ok' ? buildPackList(ahaWeather, outingTypes) : ['Water and collapsible bowl', 'Waste bags', 'Leash and backup clip'];

      return (
        <View>
          <Text style={[styles.h1, { color: palette.text }]}>Here&apos;s {dogName}&apos;s day, right now.</Text>
          {loadingAha ? (
            <View style={styles.ahaLoading}>
              <ActivityIndicator color={palette.tint} size="small" />
              <Text style={[styles.body, { color: palette.textSecondary, marginBottom: 0 }]}>Loading live local conditions...</Text>
            </View>
          ) : null}
          <View style={[styles.ahaCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <Text style={[styles.ahaTemp, { color: palette.text }]}>
              {ahaWeather.status === 'ok' ? `${ahaWeather.tempF}F · ${ahaWeather.place}` : 'Live weather unavailable'}
            </Text>
            <Text style={[styles.cardSubtitle, { color: palette.textSecondary }]}>
              {ahaWeather.status === 'ok' ? ahaWeather.summary : 'Enable location to see a live readiness read.'}
            </Text>
            <Text style={[styles.ahaNote, { color: palette.text }]}>{note}</Text>
            <Text style={[styles.cardTitle, { color: palette.text, marginTop: 12 }]}>Best outing window today</Text>
            <Text style={[styles.cardSubtitle, { color: palette.textSecondary }]}>{bestWindow}</Text>
            {ahaTopChecklist.id ? (
              <>
                <Text style={[styles.cardTitle, { color: palette.text, marginTop: 12 }]}>Your first dynamic checklist:</Text>
                <Text style={{ color: palette.tint, fontWeight: '700', fontSize: 15, marginTop: 4 }}>{ahaTopChecklist.reason}</Text>
              </>
            ) : (
              <>
                <Text style={[styles.cardTitle, { color: palette.text, marginTop: 12 }]}>Pack list for today</Text>
                {packList.map((item) => (
                  <Text key={item} style={[styles.packItem, { color: palette.textSecondary }]}>• {item}</Text>
                ))}
              </>
            )}
          </View>
          <Pressable
            onPress={() => setStepIdx(STEPS.indexOf('notifications'))}
            style={({ pressed }) => [styles.cta, { backgroundColor: palette.tint, opacity: pressed ? 0.9 : 1 }]}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View>
        <Text style={[styles.h1, { color: palette.text }]}>Want a heads-up when {dogName}&apos;s conditions change?</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>You will only get useful alerts. No spam, no noisy daily blasts.</Text>
        <View style={[styles.mockPush, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <Text style={[styles.mockPushLabel, { color: palette.textSecondary }]}>Example notification</Text>
          <Text style={[styles.mockPushBody, { color: palette.text }]}>
            🐾 {dogName}&apos;s window: rain clears by 3pm. Good afternoon walk today.
          </Text>
        </View>
        <Pressable
          disabled={busy}
          onPress={() => {
            const url = ahaTopChecklist.id ? `/checklist/${ahaTopChecklist.id}` : undefined;
            finish(url);
          }}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: busy ? palette.border : palette.tint, opacity: pressed && !busy ? 0.9 : 1 },
          ]}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Allow notifications</Text>}
        </Pressable>
        <Pressable
          disabled={busy}
          onPress={() => {
            const url = ahaTopChecklist.id ? `/checklist/${ahaTopChecklist.id}` : undefined;
            void skipNotifications(url);
          }}
          style={styles.skipLink}>
          <Text style={[styles.skipText, { color: palette.textSecondary }]}>Not right now</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.stepRow}>
            <Text style={[styles.stepLabel, { color: palette.textSecondary }]}>Step {stepIdx + 1} of {STEPS.length}</Text>
            {stepIdx > 0 ? (
              <Pressable onPress={goBack} hitSlop={8}>
                <Text style={[styles.backText, { color: palette.tint }]}>Back</Text>
              </Pressable>
            ) : <View />}
          </View>
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 46 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  stepLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  backText: { fontSize: 14, fontWeight: '700' },
  compassWrap: { alignSelf: 'center', marginVertical: 18 },
  h1: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6, marginBottom: 10, lineHeight: 36 },
  body: { fontSize: 16, lineHeight: 24, marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 17,
  },
  photoPreviewLarge: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  photoImg: { width: '100%', height: '100%' },
  photoWarmPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  placeholderText: { marginTop: 8, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  rowButtons: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 14 },
  ghostBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  ghostText: { fontSize: 14, fontWeight: '700' },
  mixedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 10,
  },
  mixedLabel: { fontSize: 15, fontWeight: '700' },
  breedScroll: { maxHeight: 260, marginBottom: 14 },
  breedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 4 },
  breedCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'flex-start',
    minHeight: 74,
  },
  breedIcon: { fontSize: 18, marginBottom: 4 },
  breedText: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  cardList: { gap: 10, marginBottom: 16 },
  infoCard: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800', lineHeight: 20 },
  cardSubtitle: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  skipLink: { alignSelf: 'center', paddingVertical: 10 },
  skipText: { fontSize: 14, fontWeight: '600' },
  ahaLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  ahaCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16 },
  ahaTemp: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  ahaNote: { marginTop: 10, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  packItem: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  mockPush: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16 },
  mockPushLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  mockPushBody: { fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 8 },
  cta: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 17 },
});
