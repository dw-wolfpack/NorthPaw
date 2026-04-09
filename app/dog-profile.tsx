import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
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
import { getDogProfile, pickAndStoreDogPhoto, saveDogProfile } from '@/lib/profile';
import { useColorScheme } from '@/components/useColorScheme';

export default function DogProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const router = useRouter();
  const [name, setName] = useState('');
  const [savedPhotoUri, setSavedPhotoUri] = useState('');
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const p = await getDogProfile();
    setName(p.dogName);
    setSavedPhotoUri(p.dogPhotoUri);
    setPickedUri(null);
  }, []);

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [load]);

  const displayPhoto = pickedUri || savedPhotoUri;

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
      await saveDogProfile({
        onboardingDone: true,
        dogName: trimmed,
        dogPhotoUri: photoUri,
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

          <Text style={[styles.label, { color: palette.text, marginTop: 20 }]}>Photo</Text>
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
            <View style={{ flex: 1, gap: 8 }}>
              <Pressable onPress={pickPhoto}>
                <Text style={{ color: palette.tint, fontWeight: '700' }}>Choose photo…</Text>
              </Pressable>
              {(savedPhotoUri || pickedUri) && (
                <Pressable
                  onPress={() =>
                    Alert.alert('Remove photo?', 'You can add a new one anytime.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: clearPhoto },
                    ])
                  }>
                  <Text style={{ color: palette.danger, fontWeight: '600' }}>Remove photo</Text>
                </Pressable>
              )}
            </View>
          </View>

          <Pressable
            disabled={!name.trim() || busy}
            onPress={save}
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
});
