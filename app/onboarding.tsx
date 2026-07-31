import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurMask, Canvas, Circle } from '@shopify/react-native-skia';
import AnimatedReanimated, {
  FadeIn,
  FadeInDown,
  useDerivedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { requestMedReminderPermissions } from '@/lib/medReminders';
import { pickAndStoreDogPhoto, saveDogProfile } from '@/lib/profile';
import { fetchWeatherForDeviceLocation } from '@/lib/weather/weatherDispatcher';
import { type HomeWeatherState } from '@/lib/weather/nwsWeather';
import { buildWeatherSuggestions } from '@/lib/weather/weatherSuggestions';
import { useColorScheme } from '@/components/useColorScheme';
import { trackEvent, setUserProperties } from '@/lib/analytics';
import { FeedbackModal } from '@/components/FeedbackModal';

type SceneId =
  | 'welcome'
  | 'name'
  | 'photo'
  | 'breed-snout'
  | 'biology-activity'
  | 'age'
  | 'outings'
  | 'location'
  | 'npi-activation'
  | 'morning-brief'
  | 'commitment';

const SCENES: SceneId[] = [
  'welcome',
  'name',
  'photo',
  'breed-snout',
  'biology-activity',
  'age',
  'outings',
  'location',
  'npi-activation',
  'morning-brief',
  'commitment',
];

export const BREEDS = [
  'Mixed Breed / Rescue',
  'Akita',
  'Alaskan Malamute',
  'American Eskimo',
  'American Pit Bull Terrier',
  'American Staffordshire Terrier',
  'Aussiedoodle',
  'Australian Cattle Dog',
  'Australian Shepherd',
  'Basset Hound',
  'Beagle',
  'Belgian Malinois',
  'Bernedoodle',
  'Bernese Mountain Dog',
  'Bichon Frise',
  'Border Collie',
  'Boston Terrier',
  'Boxer',
  'Brittany',
  'Bull Terrier',
  'Bulldog',
  'Cane Corso',
  'Cavalier King Charles Spaniel',
  'Chihuahua',
  'Cocker Spaniel',
  'Cockapoo',
  'Collie',
  'Dachshund',
  'Doberman Pinscher',
  'English Springer Spaniel',
  'Flat-Coated Retriever',
  'French Bulldog',
  'German Shepherd',
  'German Shorthaired Pointer',
  'Golden Retriever',
  'Goldendoodle',
  'Great Dane',
  'Great Pyrenees',
  'Greater Swiss Mountain Dog',
  'Greyhound',
  'Havanese',
  'Italian Greyhound',
  'Jack Russell Terrier',
  'Labradoodle',
  'Labrador Retriever',
  'Maltese',
  'Maltipoo',
  'Mastiff',
  'Miniature American Shepherd',
  'Miniature Poodle',
  'Miniature Schnauzer',
  'Newfoundland',
  'Nova Scotia Duck Tolling Retriever',
  'Old English Sheepdog',
  'Papillon',
  'Pembroke Welsh Corgi',
  'Pomeranian',
  'Poodle',
  'Pug',
  'Rhodesian Ridgeback',
  'Rottweiler',
  'Saint Bernard',
  'Samoyed',
  'Shetland Sheepdog',
  'Shih Tzu',
  'Shiba Inu',
  'Siberian Husky',
  'Staffordshire Bull Terrier',
  'Standard Schnauzer',
  'Vizsla',
  'Weimaraner',
  'West Highland White Terrier',
  'Wheaten',
  'Whippet',
  'Yorkshire Terrier',
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

const SNOUT_OPTIONS: Array<{ id: 'flat' | 'standard' | 'long'; title: string; subtitle: string }> = [
  { id: 'flat', title: 'Flat / Smushed', subtitle: 'Pug, Bulldog, Boxer-style airway' },
  { id: 'standard', title: 'Standard', subtitle: 'Balanced cooling profile' },
  { id: 'long', title: 'Long', subtitle: 'Greyhound-style airflow advantage' },
];

const ACTIVITY_OPTIONS: Array<{ id: 'low' | 'moderate' | 'high'; title: string; subtitle: string }> = [
  { id: 'low', title: 'Low energy', subtitle: 'Easy pace and shorter outings' },
  { id: 'moderate', title: 'Moderate', subtitle: 'Typical daily exertion' },
  { id: 'high', title: 'High intensity', subtitle: 'Higher metabolic heat buildup' },
];

const CALIBRATION_LINES = [
  'Checking temperature and humidity...',
  'Adjusting for snout length...',
  'Fetching local conditions...',
  'Checking pavement warmth...',
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

const hapticTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

export default function OnboardingScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const palette = Colors[colorScheme];
  const router = useRouter();
  const [sceneIdx, setSceneIdx] = useState(0);
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
  const [dogSnoutProfile, setDogSnoutProfile] = useState<'flat' | 'standard' | 'long'>('standard');
  const [dogActivityBaseline, setDogActivityBaseline] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [morningBriefTime, setMorningBriefTime] = useState('7:00 AM');
  const [outingTypes, setOutingTypes] = useState<string[]>([]);
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [notificationsPermission, setNotificationsPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [ahaWeather, setAhaWeather] = useState<HomeWeatherState>({ status: 'loading' });
  const [loadingAha, setLoadingAha] = useState(false);
  const [activationReady, setActivationReady] = useState(false);
  const [activationLineIdx, setActivationLineIdx] = useState(0);
  const [previewInteracted, setPreviewInteracted] = useState(false);
  const [busy, setBusy] = useState(false);

  const [requestBreedModalOpen, setRequestBreedModalOpen] = useState(false);
  const [disclaimerAgreed, setDisclaimerAgreed] = useState(false);

  const spin = useRef(new Animated.Value(0)).current;
  const displayPhoto = pickedUri;
  const dogName = name.trim() || 'your dog';
  const scene = SCENES[sceneIdx];
  const cardTranslateY = useSharedValue(24);
  const cardOpacity = useSharedValue(0);
  const pulse = useSharedValue(0.82);
  const screenFade = useSharedValue(1);
  const headerFade = useSharedValue(1);

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
    trackEvent('onboarding_started');
  }, []);

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

  useEffect(() => {
    cardTranslateY.value = 24;
    cardOpacity.value = 0;
    cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 130 });
    cardOpacity.value = withTiming(1, { duration: 260 });
  }, [cardOpacity, cardTranslateY, scene]);

  useEffect(() => {
    trackEvent('onboarding_step_viewed', {
      scene,
      stepIndex: sceneIdx,
      totalSteps: SCENES.length,
    });
  }, [scene, sceneIdx]);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 760 }), withTiming(0.78, { duration: 760 })),
      -1,
      true
    );
  }, [pulse]);

  useEffect(() => {
    if (scene !== 'npi-activation') return;
    setActivationReady(false);
    setActivationLineIdx(0);
    const lineTicker = setInterval(() => {
      setActivationLineIdx((i) => (i + 1) % CALIBRATION_LINES.length);
    }, 420);
    const timer = setTimeout(() => {
      setActivationReady(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 2000);
    return () => {
      clearTimeout(timer);
      clearInterval(lineTicker);
    };
  }, [scene]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
    opacity: cardOpacity.value,
  }));
  const screenFadeStyle = useAnimatedStyle(() => ({ opacity: screenFade.value }));
  const headerFadeStyle = useAnimatedStyle(() => ({ opacity: headerFade.value }));
  const glowRadius = useDerivedValue(() => 46 + 20 * pulse.value, [pulse]);
  const glowOpacity = useDerivedValue(() => 0.22 + 0.28 * pulse.value, [pulse]);

  const filteredBreeds = useMemo(() => {
    const base = BREEDS.filter((b) => b !== 'Mixed Breed / Rescue');
    const q = breedQuery.trim().toLowerCase();
    if (!q) return base;
    const compactQ = q.replace(/[\s\-]/g, '');
    return base.filter((b) => {
      const lower = b.toLowerCase();
      const compactLower = lower.replace(/[\s\-]/g, '');
      return lower.includes(q) || compactLower.includes(compactQ);
    });
  }, [breedQuery]);

  const legacyStep = useMemo(() => {
    if (scene === 'breed-snout') return 'breed';
    if (scene === 'biology-activity') return 'biology';
    if (scene === 'npi-activation') return 'aha';
    if (scene === 'morning-brief' || scene === 'commitment') return 'notifications';
    if (scene === 'welcome' || scene === 'name' || scene === 'photo' || scene === 'age' || scene === 'outings' || scene === 'location') {
      return scene;
    }
    return 'welcome';
  }, [scene]);

  const canAdvance = useMemo(() => {
    if (scene === 'name') return name.trim().length > 0;
    if (legacyStep === 'breed') {
      if (isMixedBreed) return mixedPrimary.trim().length > 0;
      return breed.trim().length > 0;
    }
    if (legacyStep === 'age') return ageGroup.length > 0;
    if (legacyStep === 'outings') return outingTypes.length > 0;
    return true;
  }, [ageGroup, breed, isMixedBreed, legacyStep, mixedPrimary, name, outingTypes, scene]);

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

  const handlePhotoContinue = async () => {
    if (pickedUri) {
      advance();
      return;
    }
    setBusy(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.granted) {
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });
        if (!res.canceled && res.assets[0]?.uri) {
          setPickedUri(res.assets[0].uri);
        }
      }
      advance();
    } catch (e) {
      console.warn('[NorthPaw] Photo permission/picker error', e);
      advance();
    } finally {
      setBusy(false);
    }
  };

  const selectionTick = () => {
    Haptics.selectionAsync().catch(() => {});
  };

  const buildPreviewBody = (time: string): string => {
    const start = time === 'Custom' ? 'your selected time' : time;
    return `Good morning! ${dogName}'s safest window starts around ${start}. Check pavement before your first walk.`;
  };

  const loadAha = async () => {
    setLoadingAha(true);
    try {
      const weather = await fetchWeatherForDeviceLocation();
      setAhaWeather(weather);
    } catch {
      setAhaWeather({ status: 'unavailable', message: 'Could not load live conditions.' });
    } finally {
      setLoadingAha(false);
    }
  };

  const advance = () => {
    if (!canAdvance || sceneIdx >= SCENES.length - 1) return;
    selectionTick();
    setSceneIdx((s) => s + 1);
  };

  const advanceFromWelcome = () => {
    trackEvent('disclaimer_accepted', { is_upgrade_flow: false });
    advance();
  };

  const goBack = () => {
    if (sceneIdx <= 0 || busy) return;
    setSceneIdx((s) => s - 1);
  };

  const requestLocation = async () => {
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
      if (finalNotif === 'granted') {
        trackEvent('notification_enabled', { context: 'onboarding' });
      }

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
        dogSnoutProfile,
        dogActivityBaseline,
        morningBriefTime,
      });

      trackEvent('onboarding_completed', {
        dogBreed: resolvedBreed,
        dogAgeGroup: ageGroup,
        dogWeightLbs: parseInt(dogWeightLbs, 10) || null,
        dogCoatType: dogCoatType,
        dogColor: dogColor,
        dogSnoutProfile,
        dogActivityBaseline,
        hasPhoto: !!pickedUri,
        notificationsPermission: finalNotif,
        locationPermission,
      });

      try {
        await AsyncStorage.setItem('@northpaw/onboarding_completed_at', Date.now().toString());
        await AsyncStorage.setItem('@northpaw/disclaimer_accepted_version', 'v4.3');
      } catch (err) {
        console.warn('[Onboarding] Failed to save completed timestamp/disclaimer to AsyncStorage', err);
      }

      trackEvent('dog_created', {
        dogBreed: resolvedBreed,
        dogAgeGroup: ageGroup,
        dogWeightLbs: parseInt(dogWeightLbs, 10) || null,
        dogCoatType: dogCoatType,
        dogColor: dogColor,
        dogSnoutProfile,
        dogActivityBaseline,
      });

      setUserProperties({
        dog_breed: resolvedBreed,
        dog_size: parseInt(dogWeightLbs, 10) ? (parseInt(dogWeightLbs, 10) < 25 ? 'Small' : parseInt(dogWeightLbs, 10) < 60 ? 'Medium' : 'Large') : 'Unknown',
        dog_weight_lbs: parseInt(dogWeightLbs, 10) || null,
        dog_coat_type: dogCoatType,
        dog_color: dogColor,
        dog_snout_profile: dogSnoutProfile,
        dog_activity_baseline: dogActivityBaseline,
        notifications_permission: finalNotif,
        location_permission: locationPermission,
        subscription_status: 'free',
      });

      if (deepLink) {
        router.replace(deepLink as any);
      } else {
        router.replace('/(tabs)');
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
    const themedCardStyle = {
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      backgroundColor: isDark ? 'rgba(15,23,20,0.7)' : 'rgba(255,255,255,0.85)',
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.5 : 0.1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 8 },
    };
    if (scene === 'welcome') {
      return (
        <AnimatedReanimated.View 
          entering={FadeIn.duration(280)} 
          style={[
            styles.glassCard, 
            styles.squircle24, 
            animatedCardStyle,
            { 
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', 
              backgroundColor: isDark ? 'rgba(15,23,20,0.7)' : 'rgba(255,255,255,0.85)',
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.5 : 0.1,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 8 },
            }
          ]}
        >
          <Animated.View style={[styles.compassWrap, { transform: [{ rotate: compassSpin }] }]}>
            <MaterialCommunityIcons name="compass-rose" size={84} color={palette.tint} />
          </Animated.View>
          <Text style={[styles.h1, { color: palette.text }]}>Getting {dogName} ready for the trail.</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>
            Set up a custom profile to get personalized safety checklists.
          </Text>
          <Pressable
            onPress={() => { hapticTap(); advance(); }}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: palette.tint, opacity: pressed ? 0.9 : 1 },
              { transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}>
            <Text style={styles.ctaText}>Let&apos;s get started</Text>
          </Pressable>
        </AnimatedReanimated.View>
      );
    }

    if (scene === 'name') {
      return (
        <AnimatedReanimated.View entering={FadeIn.duration(280)} style={[styles.glassCard, styles.squircle24, animatedCardStyle, themedCardStyle]}>
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
    }

    if (scene === 'photo') {
      return (
        <AnimatedReanimated.View entering={FadeIn.duration(280)} style={[styles.glassCard, styles.squircle24, animatedCardStyle, themedCardStyle]}>
          <Text style={[styles.h1, { color: palette.text }]}>Add a photo of {dogName}.</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>
            Optional. Photos stay on your device and are never uploaded.
          </Text>
          <Pressable
            onPress={() => {
              selectionTick();
              void pickPhoto();
            }}
            style={({ pressed }) => [
              styles.photoPreviewLarge,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
                opacity: pressed ? 0.92 : 1,
              },
            , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            {displayPhoto ? (
              <Image source={{ uri: displayPhoto }} style={styles.photoImg} contentFit="cover" cachePolicy="none" />
            ) : (
              <View style={[styles.photoWarmPlaceholder, { backgroundColor: palette.border + '40' }]}>
                <MaterialCommunityIcons name="dog-side" size={74} color={palette.textSecondary} />
                <Text style={[styles.placeholderText, { color: palette.textSecondary }]}>Choose a photo of {dogName}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => { hapticTap(); void handlePhotoContinue(); }}
            style={({ pressed }) => [styles.cta, { backgroundColor: palette.tint, opacity: pressed ? 0.9 : 1 }, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </AnimatedReanimated.View>
      );
    }

    if (scene === 'breed-snout') {
      return (
        <AnimatedReanimated.View entering={FadeIn.duration(280)} style={[styles.glassCard, styles.squircle24, animatedCardStyle, themedCardStyle]}>
          <Text style={[styles.h1, { color: palette.text }]}>What breed is {dogName}, and how is {dogName}&apos;s snout?</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>
            Pick your dog’s breed for their profile. You’ll customize snout, coat, and activity next.
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
              selectionTick();
              setIsMixedBreed(!isMixedBreed);
              if (!isMixedBreed) setBreed('');
            }}
            style={({ pressed }) => [
              styles.mixedRow,
              { borderColor: palette.border, backgroundColor: isMixedBreed ? palette.surface : 'transparent', opacity: pressed ? 0.9 : 1 },
            , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <MaterialCommunityIcons name={isMixedBreed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={20} color={palette.tint} />
            <Text style={[styles.mixedLabel, { color: palette.text }]}>Mixed Breed / Rescue</Text>
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
                    selectionTick();
                    setIsMixedBreed(false);
                    setBreed(item);
                  }}
                  style={({ pressed }) => [
                    styles.breedCard,
                    {
                      borderColor: selected ? palette.tint : palette.border,
                      backgroundColor: selected ? palette.selectedBg : palette.surface,
                      opacity: pressed ? 0.8 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}>
                  <Text style={styles.breedIcon}>🐾</Text>
                  <Text style={[styles.breedText, { color: palette.text }]}>{item}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable
            onPress={() => { hapticTap(); setRequestBreedModalOpen(true); }}
            style={{ marginBottom: 16, alignSelf: 'flex-start' }}
            accessibilityRole="button"
            accessibilityLabel="Request a missing breed">
            <Text style={{ color: palette.tint, fontWeight: '700', fontSize: 14 }}>
              Can&apos;t find your breed? Request a breed →
            </Text>
          </Pressable>
          <Text style={[styles.label, { color: palette.text, marginBottom: 8 }]}>How is {dogName}&apos;s snout?</Text>
          <View style={styles.cardList}>
            {SNOUT_OPTIONS.map((opt) => {
              const selected = dogSnoutProfile === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    selectionTick();
                    setDogSnoutProfile(opt.id);
                  }}
                  style={({ pressed }) => [
                    styles.infoCard,
                    {
                      borderColor: selected ? palette.tint : palette.border,
                      backgroundColor: selected ? palette.selectedBg : palette.surface,
                      opacity: pressed ? 0.92 : 1,
                    },
                  , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                  <Text style={[styles.cardTitle, { color: palette.text }]}>{opt.title}</Text>
                  <Text style={[styles.cardSubtitle, { color: palette.textSecondary }]}>{opt.subtitle}</Text>
                </Pressable>
              );
            })}
          </View>
          <AnimatedReanimated.Text
            entering={FadeInDown.duration(300)}
            style={[styles.didYouKnowCaption, { color: palette.textSecondary }]}>
            {dogSnoutProfile === 'flat'
              ? `Did you know? Flat-faced dogs like ${dogName} can cool less efficiently through panting.`
              : dogSnoutProfile === 'long'
              ? `Did you know? Long-snouted dogs like ${dogName} are generally more efficient at panting to cool down.`
              : `Did you know? Snout length directly affects how efficiently a dog cools down through panting.`}
          </AnimatedReanimated.Text>
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
    }

    if (scene === 'biology-activity') {
      return (
        <AnimatedReanimated.View entering={FadeIn.duration(280)} style={[styles.glassCard, styles.squircle24, animatedCardStyle, themedCardStyle]}>
          <Text style={[styles.h1, { color: palette.text }]}>Let&apos;s finish {dogName}&apos;s custom profile.</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>
            Weight, coat, color, and energy help build safe outing guides and checklists.
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
                onPress={() => {
                  selectionTick();
                  setDogCoatType(coat);
                }}
                style={[{ flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }, dogCoatType === coat ? { borderColor: palette.tint, backgroundColor: palette.selectedBg } : { borderColor: palette.border, backgroundColor: palette.surface }]}
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
                onPress={() => {
                  selectionTick();
                  setDogColor(colorOpt);
                }}
                style={[{ flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }, dogColor === colorOpt ? { borderColor: palette.tint, backgroundColor: palette.selectedBg } : { borderColor: palette.border, backgroundColor: palette.surface }]}
              >
                <Text style={[{ fontSize: 13, fontWeight: '700' }, dogColor === colorOpt ? { color: palette.text } : { color: palette.textSecondary }]}>{colorOpt}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.label, { color: palette.text, marginBottom: 8 }]}>{dogName}&apos;s activity baseline</Text>
          <View style={styles.cardList}>
            {ACTIVITY_OPTIONS.map((opt) => {
              const selected = dogActivityBaseline === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    selectionTick();
                    setDogActivityBaseline(opt.id);
                  }}
                  style={({ pressed }) => [
                    styles.infoCard,
                    {
                      borderColor: selected ? palette.tint : palette.border,
                      backgroundColor: selected ? palette.selectedBg : palette.surface,
                      opacity: pressed ? 0.92 : 1,
                    },
                  , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                  <Text style={[styles.cardTitle, { color: palette.text }]}>{opt.title}</Text>
                  <Text style={[styles.cardSubtitle, { color: palette.textSecondary }]}>{opt.subtitle}</Text>
                </Pressable>
              );
            })}
          </View>
          <AnimatedReanimated.Text
            entering={FadeInDown.duration(300)}
            style={[styles.didYouKnowCaption, { color: palette.textSecondary }]}>
            {dogColor === 'Dark'
              ? `Did you know? Darker coats like ${dogName}'s can absorb more heat in direct sun.`
              : dogColor === 'Light'
              ? `Did you know? Lighter coats like ${dogName}'s reflect more solar heat, but their skin can still be sensitive.`
              : `Did you know? A dog's fur color directly affects how much solar heat they absorb in direct sun.`}
          </AnimatedReanimated.Text>

          <View style={[styles.rowButtons, { marginTop: 10 }]}>
            <Pressable onPress={() => { hapticTap(); advance(); }} style={[styles.ghostBtn, { borderColor: palette.border, flex: 1 }]}>
               <Text style={[styles.ghostText, { color: palette.text, textAlign: 'center' }]}>Continue</Text>
            </Pressable>
            <Pressable onPress={() => { hapticTap(); advance(); }} style={[styles.ghostBtn, { borderColor: palette.border, flex: 1 }]}>
               <Text style={[styles.ghostText, { color: palette.textSecondary, textAlign: 'center' }]}>Skip for now</Text>
            </Pressable>
          </View>
        </AnimatedReanimated.View>
      );
    }

    if (legacyStep === 'age') {
      return (
        <AnimatedReanimated.View entering={FadeIn.duration(280)} style={[styles.glassCard, styles.squircle24, animatedCardStyle, themedCardStyle]}>
          <Text style={[styles.h1, { color: palette.text }]}>How old is {dogName}?</Text>
          <View style={styles.cardList}>
            {AGE_OPTIONS.map((opt) => {
              const selected = ageGroup === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    selectionTick();
                    setAgeGroup(opt.id);
                  }}
                  style={({ pressed }) => [
                    styles.infoCard,
                    {
                      borderColor: selected ? palette.tint : palette.border,
                      backgroundColor: selected ? palette.selectedBg : palette.surface,
                      opacity: pressed ? 0.92 : 1,
                    },
                  , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                  <Text style={[styles.cardTitle, { color: palette.text }]}>{opt.title}</Text>
                  <Text style={[styles.cardSubtitle, { color: palette.textSecondary }]}>{opt.subtitle}</Text>
                </Pressable>
              );
            })}
          </View>
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
    }

    if (legacyStep === 'outings') {
      return (
        <AnimatedReanimated.View entering={FadeIn.duration(280)} style={[styles.glassCard, styles.squircle24, animatedCardStyle, themedCardStyle]}>
          <Text style={[styles.h1, { color: palette.text }]}>What does {dogName} love?</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>These choices shape pack lists and reminders.</Text>
          <View style={styles.cardList}>
            {OUTING_OPTIONS.map((item) => {
              const selected = outingTypes.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    selectionTick();
                    toggleOuting(item);
                  }}
                  style={({ pressed }) => [
                    styles.infoCard,
                    {
                      borderColor: selected ? palette.tint : palette.border,
                      backgroundColor: selected ? palette.surface : palette.background,
                      opacity: pressed ? 0.92 : 1,
                    },
                  , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                  <Text style={[styles.cardTitle, { color: palette.text }]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
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
    }

    if (legacyStep === 'location') {
      return (
        <AnimatedReanimated.View entering={FadeIn.duration(280)} style={[styles.glassCard, styles.squircle24, animatedCardStyle, themedCardStyle]}>
          <Text style={[styles.h1, { color: palette.text }]}>{dogName} is ready. NorthPaw needs your local conditions.</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>
            We only read conditions when you open the app. No background tracking.
          </Text>
          <AnimatedReanimated.Text entering={FadeInDown.duration(300)} style={[styles.didYouKnowCaption, { color: palette.textSecondary }]}>
            Did you know? Local solar and humidity data are the most critical inputs for predicting pavement heat soak.
          </AnimatedReanimated.Text>
          <Pressable
            onPress={() => { hapticTap(); requestLocation(); }}
            style={({ pressed }) => [styles.cta, { backgroundColor: palette.tint, opacity: pressed ? 0.9 : 1 }, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </AnimatedReanimated.View>
      );
    }

    if (scene === 'npi-activation') {
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
        <AnimatedReanimated.View entering={FadeIn.duration(280)} style={[styles.glassCard, styles.squircle24, animatedCardStyle, themedCardStyle]}>
          <Text style={[styles.h1, { color: palette.text }]}>Setting up {dogName}&apos;s personalized guides.</Text>
          {loadingAha ? (
            <View style={styles.ahaLoading}>
              <ActivityIndicator color={palette.tint} size="small" />
              <Text style={[styles.body, { color: palette.textSecondary, marginBottom: 0 }]}>Loading live local conditions...</Text>
            </View>
          ) : null}
          <View style={[styles.ahaCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            {!activationReady ? (
              <View style={styles.activationWrap}>
                <Canvas style={styles.activationCanvas}>
                  <Circle cx={70} cy={70} r={glowRadius} color="#2ECC71" opacity={glowOpacity}>
                    <BlurMask blur={14} />
                  </Circle>
                  <Circle cx={70} cy={70} r={26} color="#2ECC71" opacity={0.35} />
                </Canvas>
                <Text style={[styles.activationTitle, { color: palette.text }]}>Reviewing conditions</Text>
                <Text style={[styles.activationLine, { color: palette.textSecondary }]}>
                  {CALIBRATION_LINES[activationLineIdx]}
                </Text>
              </View>
            ) : (
              <>
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
              </>
            )}
          </View>
          <Pressable
            disabled={!activationReady}
            onPress={() => { hapticTap();  setSceneIdx(SCENES.indexOf('morning-brief')); }}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: activationReady ? palette.tint : palette.border, opacity: pressed ? 0.9 : 1 },
            , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </AnimatedReanimated.View>
      );
    }

    if (scene === 'morning-brief') {
      const times = ['7:00 AM', '8:00 AM', 'Custom'];
      return (
        <AnimatedReanimated.View entering={FadeIn.duration(280)} style={[styles.glassCard, styles.squircle24, animatedCardStyle, themedCardStyle]}>
          <Text style={[styles.h1, { color: palette.text }]}>When should we send {dogName}&apos;s Morning Brief?</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>
            Pick a time so NorthPaw can deliver a daily safety window before your first outing.
          </Text>
          <Pressable
            onPress={() => {
              selectionTick();
              setPreviewInteracted(true);
            }}
            style={({ pressed }) => [
              styles.notificationPreviewCard,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
                opacity: pressed ? 0.95 : 1,
              },
            , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <Text style={[styles.notificationPreviewKicker, { color: palette.textSecondary }]}>Preview notification</Text>
            <Text style={[styles.notificationPreviewTitle, { color: palette.text }]}>NorthPaw Morning Brief</Text>
            <Text style={[styles.notificationPreviewBody, { color: palette.textSecondary }]}>
              {buildPreviewBody(morningBriefTime)}
            </Text>
          </Pressable>
          <View style={styles.cardList}>
            {times.map((t) => {
              const selected = morningBriefTime === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => {
                    selectionTick();
                    setMorningBriefTime(t);
                    setPreviewInteracted(true);
                  }}
                  style={({ pressed }) => [
                    styles.infoCard,
                    {
                      borderColor: selected ? palette.tint : palette.border,
                      backgroundColor: selected ? palette.selectedBg : palette.surface,
                      opacity: pressed ? 0.92 : 1,
                    },
                  , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                  <Text style={[styles.cardTitle, { color: palette.text }]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            disabled={!previewInteracted || busy}
            onPress={async () => {
              selectionTick();
              if (!previewInteracted || busy) return;
              setBusy(true);
              try {
                const permission = await requestMedReminderPermissions();
                setNotificationsPermission(permission.ok ? 'granted' : 'denied');
                setSceneIdx(SCENES.indexOf('commitment'));
              } finally {
                setBusy(false);
              }
            }}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: previewInteracted && !busy ? palette.tint : palette.border,
                opacity: pressed && previewInteracted && !busy ? 0.9 : 1,
              },
            , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Enable Morning Brief alerts</Text>}
          </Pressable>
          <Text style={[styles.didYouKnowCaption, { color: palette.textSecondary }]}>
            Tap the preview or choose a time to continue.
          </Text>
        </AnimatedReanimated.View>
      );
    }

    if (scene === 'commitment') {
      return (
        <AnimatedReanimated.View entering={FadeIn.duration(280)} style={[styles.glassCard, styles.squircle24, animatedCardStyle, themedCardStyle]}>
          <Text style={[styles.h1, { color: palette.text }]}>Ready to keep {dogName} safe?</Text>
          <Text style={[styles.body, { color: palette.textSecondary, marginBottom: 12 }]}>
            We will use this profile to create personalized safety checklists and safe walking times.
          </Text>

          <View style={{ borderColor: palette.border, backgroundColor: palette.surface, padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1 }}>
            <Text style={{ color: palette.textSecondary, fontSize: 11, lineHeight: 16 }}>
              <Text style={{ fontWeight: '700' }}>Disclaimer: </Text>
              NorthPaw is for general outdoor education. It is not veterinary, legal, or emergency medical advice. Always perform a physical Hand Test on pavement before walking and consult professionals for health/safety concerns.
            </Text>
          </View>

          <Pressable
            onPress={() => { hapticTap(); setDisclaimerAgreed(!disclaimerAgreed); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: disclaimerAgreed }}
            accessibilityLabel="I agree to the Terms of Service & Liability Disclaimer"
          >
            <MaterialCommunityIcons
              name={disclaimerAgreed ? "checkbox-marked" : "checkbox-blank-outline"}
              size={20}
              color={disclaimerAgreed ? palette.tint : palette.textSecondary}
            />
            <Text style={{ color: palette.text, fontSize: 12, fontWeight: '600', flex: 1 }}>
              I agree to the Terms of Service & Liability Disclaimer
            </Text>
          </Pressable>

          <Pressable
            disabled={!disclaimerAgreed || busy}
            onPress={async () => {
              if (!disclaimerAgreed || busy) return;
              const url = undefined;
              setBusy(true);
              trackEvent('disclaimer_accepted', { is_upgrade_flow: false });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              headerFade.value = withTiming(0, { duration: 180 });
              screenFade.value = withTiming(0, { duration: 320 });
              await new Promise((resolve) => setTimeout(resolve, 260));
              await finishWithNotifications(false, url);
            }}
            style={({ pressed }) => [
              styles.cta,
              { 
                backgroundColor: disclaimerAgreed && !busy ? palette.tint : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                opacity: pressed && disclaimerAgreed && !busy ? 0.9 : 1 
              },
              { transform: [{ scale: pressed && disclaimerAgreed && !busy ? 0.98 : 1 }] }
            ]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={[styles.ctaText, { color: disclaimerAgreed ? '#fff' : palette.textSecondary }]}>I&apos;m ready to go</Text>}
          </Pressable>

          <Pressable
            disabled={!disclaimerAgreed || busy}
            onPress={() => {
              if (!disclaimerAgreed || busy) return;
              trackEvent('disclaimer_accepted', { is_upgrade_flow: false });
              const url = undefined;
              void skipNotifications(url);
            }}
            style={[styles.skipLink, { opacity: disclaimerAgreed ? 1 : 0.4 }]}>
            <Text style={[styles.skipText, { color: disclaimerAgreed ? palette.tint : palette.textSecondary }]}>Not right now</Text>
          </Pressable>
        </AnimatedReanimated.View>
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
            const url = undefined;
            finish(url);
          }}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: busy ? palette.border : palette.tint, opacity: pressed && !busy ? 0.9 : 1 },
          , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Allow notifications</Text>}
        </Pressable>
        <Pressable
          disabled={busy}
          onPress={() => {
            const url = undefined;
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
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {displayPhoto ? (
          <Image source={{ uri: displayPhoto }} style={styles.heroBg} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colorScheme === 'dark' ? '#1D2B24' : '#DDE8DE' }]} />
        )}
        <BlurView intensity={20} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}>
        <AnimatedReanimated.View style={[styles.flex, screenFadeStyle]}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
          <AnimatedReanimated.View style={[styles.stepRow, headerFadeStyle]}>
            <Text style={[styles.stepLabel, { color: palette.textSecondary }]}>Scene {sceneIdx + 1} of {SCENES.length}</Text>
            {sceneIdx > 0 ? (
              <Pressable onPress={() => { hapticTap(); goBack(); }} hitSlop={8}>
                <Text style={[styles.backText, { color: palette.tint }]}>Back</Text>
              </Pressable>
            ) : <View />}
          </AnimatedReanimated.View>
          {renderStep()}
        </ScrollView>
        </AnimatedReanimated.View>
      </KeyboardAvoidingView>
      <FeedbackModal
        visible={requestBreedModalOpen}
        onClose={() => setRequestBreedModalOpen(false)}
        initialType="breed_request"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  heroBg: { width: '100%', height: '100%' },
  scroll: { padding: 24, paddingBottom: 46 },
  glassCard: {
    borderWidth: 1,
    padding: 20,
  },
  squircle24: { borderRadius: 24 },
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
  didYouKnowCaption: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
    marginBottom: 12,
    fontWeight: '600',
    opacity: 0.95,
  },
  skipLink: { alignSelf: 'center', paddingVertical: 10 },
  skipText: { fontSize: 14, fontWeight: '600' },
  ahaLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  ahaCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16 },
  activationWrap: { alignItems: 'center', paddingVertical: 8, marginBottom: 6 },
  activationCanvas: { width: 140, height: 140, marginBottom: 10 },
  activationTitle: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  activationLine: { fontSize: 13, lineHeight: 18, marginTop: 6, textAlign: 'center' },
  ahaTemp: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  ahaNote: { marginTop: 10, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  packItem: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  mockPush: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16 },
  mockPushLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  mockPushBody: { fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 8 },
  notificationPreviewCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  notificationPreviewKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  notificationPreviewTitle: { fontSize: 14, fontWeight: '800', marginTop: 4 },
  notificationPreviewBody: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  cta: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSubtitle: { fontSize: 15, lineHeight: 22 },
  modalScroll: { padding: 20 },
  modalSuccessContainer: { alignItems: 'stretch', paddingVertical: 40 },
  modalSuccessText: { fontSize: 16, lineHeight: 24, textAlign: 'center', fontWeight: '600' },
  inputLabel: { fontSize: 14, fontWeight: '700' },
  helperText: { fontSize: 12, marginTop: 4 },
  errorLabel: { fontSize: 13, fontWeight: '700' },
});
