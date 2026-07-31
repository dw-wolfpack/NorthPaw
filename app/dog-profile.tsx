import * as Haptics from 'expo-haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
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

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { getDogProfile, pickAndStoreDogPhoto, saveDogProfile } from '@/lib/profile';
import { useColorScheme } from '@/components/useColorScheme';
import { trackEvent } from '@/lib/analytics';
import { BREEDS } from '@/app/onboarding';

const hapticTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

export default function DogProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const palette = Colors[colorScheme];
  const router = useRouter();
  const [name, setName] = useState('');
  const [savedPhotoUri, setSavedPhotoUri] = useState('');
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [dogWeightLbs, setDogWeightLbs] = useState('');
  const [dogCoatType, setDogCoatType] = useState('');
  const [dogColor, setDogColor] = useState('');
  const [dogBreed, setDogBreed] = useState('');
  const [dogBreedMix, setDogBreedMix] = useState('');
  const [isMixedBreed, setIsMixedBreed] = useState(false);
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [breedSearchQuery, setBreedSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const p = await getDogProfile();
    setName(p.dogName);
    setSavedPhotoUri(p.dogPhotoUri);
    setDogWeightLbs(p.dogWeightLbs ? p.dogWeightLbs.toString() : '');
    setDogCoatType(p.dogCoatType || '');
    setDogColor(p.dogColor || '');
    setDogBreed(p.dogBreed || '');
    setDogBreedMix(p.dogBreedMix || '');
    setIsMixedBreed(p.dogBreed === 'Mixed Breed / Rescue' || p.dogBreed === 'Mixed breed');
    setPickedUri(null);
  }, []);

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    trackEvent('screen_viewed', { screenName: 'Edit Dog Profile' });
  }, []);

  const displayPhoto = pickedUri || savedPhotoUri;

  const filteredBreeds = useMemo(() => {
    const base = BREEDS.filter((b) => b !== 'Mixed Breed / Rescue');
    const q = breedSearchQuery.trim().toLowerCase();
    if (!q) return base;
    const compactQ = q.replace(/[\s\-]/g, '');
    return base.filter((b) => {
      const lower = b.toLowerCase();
      const compactLower = lower.replace(/[\s\-]/g, '');
      return lower.includes(q) || compactLower.includes(compactQ);
    });
  }, [breedSearchQuery]);

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

  const clearPhoto = () => {
    setPickedUri(null);
    setSavedPhotoUri('');
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      let photoUri = '';
      if (pickedUri) {
        photoUri = await pickAndStoreDogPhoto(pickedUri);
      } else {
        photoUri = savedPhotoUri;
      }
      const resolvedBreed = isMixedBreed ? 'Mixed breed' : dogBreed;
      await saveDogProfile({
        onboardingDone: true,
        dogName: trimmed,
        dogPhotoUri: photoUri,
        dogWeightLbs: parseInt(dogWeightLbs, 10) || null,
        dogCoatType: dogCoatType,
        dogColor: dogColor,
        dogBreed: resolvedBreed,
        dogBreedMix: isMixedBreed ? dogBreedMix : '',
      });
      trackEvent('dog_profile_saved', {
        hasPhoto: !!photoUri,
        dogWeightLbs: parseInt(dogWeightLbs, 10) || null,
        dogCoatType,
        dogColor,
        dogBreed: resolvedBreed,
        dogBreedMix: isMixedBreed ? dogBreedMix : '',
      });
      router.back();
    } catch (e) {
      console.error('[DogProfile] save failed', e);
      Alert.alert(
        'Could not save',
        e instanceof Error
          ? e.message
          : 'Something went wrong saving the profile or photo. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const breedDisplay = useMemo(() => {
    if (isMixedBreed) {
      return dogBreedMix ? `Mixed breed (${dogBreedMix})` : 'Mixed breed';
    }
    return dogBreed || 'Select breed';
  }, [isMixedBreed, dogBreed, dogBreedMix]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.body, { color: palette.textSecondary }]}>
            Shown on Home. Photo and name stay on your device.
          </Text>

          <Text style={[styles.label, { color: palette.text }]}>Dog&apos;s name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={palette.textSecondary}
            autoCapitalize="words"
            maxLength={48}
            style={[
              styles.input,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
                color: palette.text,
              },
            ]}
          />

          <Text style={[styles.label, { color: palette.text, marginTop: 20 }]}>Weight (lbs)</Text>
          <TextInput
            value={dogWeightLbs}
            onChangeText={setDogWeightLbs}
            placeholder="e.g. 45"
            placeholderTextColor={palette.textSecondary}
            keyboardType="numeric"
            maxLength={3}
            style={[
              styles.input,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
                color: palette.text,
              },
            ]}
          />

          <Text style={[styles.label, { color: palette.text, marginTop: 20 }]}>Breed</Text>
          <Pressable
            onPress={() => { hapticTap(); setShowBreedModal(true); }}
            style={({ pressed }) => [
              styles.input,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
                opacity: pressed ? 0.8 : 1,
                justifyContent: 'center',
                flexDirection: 'row',
                alignItems: 'center',
              },
            ]}
          >
            <Text style={{ flex: 1, color: (isMixedBreed || dogBreed) ? palette.text : palette.textSecondary, fontSize: 17 }}>
              {breedDisplay}
            </Text>
            <FontAwesome name="chevron-right" size={16} color={palette.textSecondary} />
          </Pressable>

          <Text style={[styles.label, { color: palette.text, marginTop: 20 }]}>Coat Type</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {['Single', 'Double', 'Hairless'].map(coat => (
              <Pressable
                key={coat}
                onPress={() => { hapticTap();  setDogCoatType(coat); }}
                style={[{ flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }, dogCoatType === coat ? { borderColor: palette.tint, backgroundColor: palette.selectedBg } : { borderColor: palette.border, backgroundColor: palette.surface }]}
              >
                <Text style={[{ fontSize: 13, fontWeight: '700' }, dogCoatType === coat ? { color: palette.text } : { color: palette.textSecondary }]}>{coat}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: palette.text, marginTop: 20 }]}>Fur Color</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {['Light', 'Medium', 'Dark'].map(colorOpt => (
              <Pressable
                key={colorOpt}
                onPress={() => { hapticTap();  setDogColor(colorOpt); }}
                style={[{ flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }, dogColor === colorOpt ? { borderColor: palette.tint, backgroundColor: palette.selectedBg } : { borderColor: palette.border, backgroundColor: palette.surface }]}
              >
                <Text style={[{ fontSize: 13, fontWeight: '700' }, dogColor === colorOpt ? { color: palette.text } : { color: palette.textSecondary }]}>{colorOpt}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: palette.text, marginTop: 32 }]}>Photo</Text>
          <View style={styles.photoRow}>
            <Pressable
              onPress={() => { hapticTap(); pickPhoto(); }}
              style={({ pressed }) => [
                styles.photoPreview,
                {
                  borderColor: displayPhoto ? palette.tint : palette.border,
                  backgroundColor: displayPhoto ? palette.selectedBg : palette.surface,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}>
              {displayPhoto ? (
                <Image
                  source={{ uri: displayPhoto }}
                  style={styles.photoImg}
                  contentFit="cover"
                  cachePolicy="none"
                  recyclingKey={displayPhoto}
                />
              ) : (
                <View style={[styles.photoPlaceholder, { backgroundColor: palette.border }]}>
                  <FontAwesome name="camera" size={28} color={palette.textSecondary} />
                </View>
              )}
            </Pressable>
            <View style={{ flex: 1, gap: 10 }}>
              <Pressable
                onPress={() => { hapticTap(); pickPhoto(); }}
                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: palette.tint, backgroundColor: palette.selectedBg, alignSelf: 'flex-start' }}>
                <Text style={{ color: palette.tint, fontWeight: '800', fontSize: 13 }}>Choose photo</Text>
              </Pressable>
              {(savedPhotoUri || pickedUri) && (
                <Pressable
                  style={{ paddingVertical: 4, paddingHorizontal: 12 }}
                  onPress={() =>
                    Alert.alert('Remove photo?', 'You can add a new one anytime.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: clearPhoto },
                    ])
                  }>
                  <Text style={{ color: palette.danger, fontWeight: '700', fontSize: 13 }}>Remove photo</Text>
                </Pressable>
              )}
            </View>
          </View>

          <Pressable
            disabled={!name.trim() || busy}
            onPress={() => { hapticTap(); save(); }}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: name.trim() && !busy ? palette.tint : palette.border,
                opacity: pressed && name.trim() && !busy ? 0.9 : 1,
              },
            ]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Save</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showBreedModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBreedModal(false)}
      >
        <SafeAreaView
          style={[styles.modalRoot, { backgroundColor: palette.background }]}
          edges={['top', 'left', 'right', 'bottom']}
        >
          <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Select Breed</Text>
            <Pressable onPress={() => { hapticTap(); setShowBreedModal(false); }} hitSlop={12}>
              <FontAwesome name="close" size={24} color={palette.textSecondary} />
            </Pressable>
          </View>

          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          >
            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              <TextInput
                value={breedSearchQuery}
                onChangeText={setBreedSearchQuery}
                placeholder="Search breeds"
                placeholderTextColor={palette.textSecondary}
                style={[
                  styles.input,
                  {
                    borderColor: palette.border,
                    backgroundColor: palette.surface,
                    color: palette.text,
                    marginBottom: 12,
                  },
                ]}
              />

              <Pressable
                onPress={() => {
                  hapticTap();
                  const nextVal = !isMixedBreed;
                  setIsMixedBreed(nextVal);
                  if (nextVal) {
                    setDogBreed('Mixed breed');
                  } else {
                    setDogBreed('');
                  }
                }}
                style={({ pressed }) => [
                  styles.mixedRow,
                  {
                    borderColor: palette.border,
                    backgroundColor: isMixedBreed ? palette.selectedBg : palette.surface,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={isMixedBreed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                  size={20}
                  color={palette.tint}
                />
                <Text style={[styles.mixedLabel, { color: palette.text, marginLeft: 10 }]}>Mixed Breed / Rescue</Text>
              </Pressable>

              {isMixedBreed ? (
                <TextInput
                  value={dogBreedMix}
                  onChangeText={setDogBreedMix}
                  placeholder="Primary mix (e.g. Lab mix)"
                  placeholderTextColor={palette.textSecondary}
                  style={[
                    styles.input,
                    {
                      borderColor: palette.border,
                      backgroundColor: palette.surface,
                      color: palette.text,
                      marginTop: 8,
                      marginBottom: 12,
                    },
                  ]}
                />
              ) : null}
            </View>

            <ScrollView
              style={[styles.breedScroll]}
              contentContainerStyle={styles.breedGrid}
              keyboardShouldPersistTaps="handled"
            >
              {filteredBreeds.map((item) => {
                const selected = !isMixedBreed && dogBreed === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => {
                      hapticTap();
                      setIsMixedBreed(false);
                      setDogBreed(item);
                      setDogBreedMix('');
                      setShowBreedModal(false);
                    }}
                    style={({ pressed }) => [
                      styles.breedCard,
                      {
                        borderColor: selected ? palette.tint : palette.border,
                        backgroundColor: selected ? palette.selectedBg : palette.surface,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.breedIcon}>🐾</Text>
                    <Text style={[styles.breedText, { color: palette.text }]}>{item}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {isMixedBreed ? (
              <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                <Pressable
                  disabled={!dogBreedMix.trim()}
                  onPress={() => {
                    hapticTap();
                    setShowBreedModal(false);
                  }}
                  style={({ pressed }) => [
                    styles.cta,
                    {
                      backgroundColor: dogBreedMix.trim() ? palette.tint : palette.border,
                      opacity: pressed && dogBreedMix.trim() ? 0.9 : 1,
                    },
                  ]}
                >
                  <Text style={styles.ctaText}>Confirm Mix</Text>
                </Pressable>
              </View>
            ) : null}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  body: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 17,
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 28 },
  photoPreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImg: { width: '100%', height: '100%' },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
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
  breedScroll: { flex: 1, marginHorizontal: 20, marginBottom: 14 },
  breedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 12 },
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
});
