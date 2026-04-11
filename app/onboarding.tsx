import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
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
import { pickAndStoreDogPhoto, saveDogProfile } from '@/lib/profile';
import { useColorScheme } from '@/components/useColorScheme';

export default function OnboardingScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const router = useRouter();
  const [name, setName] = useState('');
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const displayPhoto = pickedUri;

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

  const finish = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      let photoUri = '';
      if (pickedUri) {
        photoUri = await pickAndStoreDogPhoto(pickedUri);
      }
      await saveDogProfile({
        onboardingDone: true,
        dogName: trimmed,
        dogPhotoUri: photoUri,
      });
      router.replace('/(tabs)/home');
    } catch (e) {
      console.error('[Onboarding] save failed', e);
      Alert.alert(
        'Could not finish setup',
        e instanceof Error
          ? e.message
          : 'Something went wrong saving the profile or photo. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const canContinue = name.trim().length > 0;

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
          <Text style={[styles.h1, { color: palette.text }]}>Welcome to NorthPaw</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>
            Add your dog so the app feels yours. Your main tab becomes <Text style={{ fontWeight: '700' }}>Ready</Text>{' '}
            (today’s conditions), and field cards live under <Text style={{ fontWeight: '700' }}>Field guide</Text>. Name and
            photo stay on this device—never uploaded to our servers.
          </Text>

          <Text style={[styles.label, { color: palette.text }]}>Dog&apos;s name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. River"
            placeholderTextColor={palette.textSecondary}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={48}
            returnKeyType="done"
            onSubmitEditing={finish}
            style={[
              styles.input,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
                color: palette.text,
              },
            ]}
          />

          <Text style={[styles.label, { color: palette.text, marginTop: 20 }]}>Photo (optional)</Text>
          <View style={styles.photoRow}>
            <Pressable
              onPress={pickPhoto}
              style={({ pressed }) => [
                styles.photoPreview,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.surface,
                  opacity: pressed ? 0.9 : 1,
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
            <Text style={[styles.hint, { color: palette.textSecondary, flex: 1 }]}>
              Tap to choose from your library. You can skip and add one later in Settings.
            </Text>
          </View>

          <Pressable
            disabled={!canContinue || busy}
            onPress={finish}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: canContinue && !busy ? palette.tint : palette.border,
                opacity: pressed && canContinue && !busy ? 0.9 : 1,
              },
            ]}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>Continue</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 40 },
  h1: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 10 },
  body: { fontSize: 15, lineHeight: 22, marginBottom: 28 },
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
    width: 102,
    height: 102,
    borderRadius: 51,
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
  hint: { fontSize: 14, lineHeight: 20 },
  cta: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 17 },
});
