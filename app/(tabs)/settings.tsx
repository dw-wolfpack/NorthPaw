import * as Haptics from 'expo-haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useCallback, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import {
  APPLE_MANAGE_SUBSCRIPTIONS_URL,
  PRIVACY_POLICY_URL,
  SUPPORT_URL,
  TERMS_OF_USE_URL,
} from '@/constants/Legal';
import { useSubscription } from '@/context/SubscriptionContext';
import { openExternalLink } from '@/lib/openExternalLink';
import { getDogProfile, saveDogProfile } from '@/lib/profile';
import { useColorScheme } from '@/components/useColorScheme';
import * as FileSystem from 'expo-file-system/legacy';
import { FeedbackModal, type FeedbackType } from '@/components/FeedbackModal';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const hapticTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const { isPro, configured, expoGo, loading, error } = useSubscription();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackInitialType, setFeedbackInitialType] = useState<FeedbackType>('general_feedback');
  useFocusEffect(
    useCallback(() => {
      trackEvent('screen_viewed', { screenName: 'Settings' });
    }, [])
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 96 }]}>
      <Text style={styles.h1}>Your dog</Text>
      <Pressable
        onPress={() => { hapticTap();  router.push('/dog-profile'); }}
        style={({ pressed }) => [
          styles.linkCard,
          {
            borderColor: palette.border,
            backgroundColor: palette.surface,
            opacity: pressed ? 0.92 : 1,
            marginBottom: 8,
          },
        , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          <Text style={{ color: palette.text, fontWeight: '800', fontSize: 16 }}>Name &amp; photo</Text>
          <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 16 }}>
            Shown on Home. Stored only on this device.
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={palette.textSecondary} />
      </Pressable>
      <Pressable
        onPress={() => { hapticTap();  router.push('/reminders'); }}
        style={({ pressed }) => [
          styles.linkCard,
          {
            borderColor: palette.border,
            backgroundColor: palette.surface,
            opacity: pressed ? 0.92 : 1,
            marginBottom: 8,
          },
        , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          <Text style={{ color: palette.text, fontWeight: '800', fontSize: 16 }}>Care reminders</Text>
          <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 16 }}>
            Heartworm and flea & tick alerts on your device. Custom schedules with Pro. Alerts are scheduled
            locally with no server required.
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={palette.textSecondary} />
      </Pressable>

      <Pressable
        onPress={async () => {
          try {
            await FileSystem.deleteAsync(FileSystem.documentDirectory + 'home_walkthrough.txt', { idempotent: true });
            router.replace('/(tabs)');
          } catch (e) {
            Alert.alert('Error', 'Could not reset walkthrough.');
          }
        }}
        style={({ pressed }) => [
          styles.linkCard,
          {
            borderColor: palette.border,
            backgroundColor: palette.surface,
            opacity: pressed ? 0.92 : 1,
            marginBottom: 8,
          },
        , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          <Text style={{ color: palette.text, fontWeight: '800', fontSize: 16 }}>App walkthrough</Text>
          <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 16 }}>
            Review the guided tour of the Home screen features.
          </Text>
        </View>
        <FontAwesome name="info-circle" size={16} color={palette.tint} />
      </Pressable>

      <Text style={[styles.h1, { marginTop: 28 }]}>Help improve NorthPaw</Text>
      <Text style={[styles.body, { color: palette.textSecondary, marginBottom: 12 }]}>
        Share your thoughts or suggest content directly to the developer.
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8, backgroundColor: 'transparent' }}>
        {[
          { label: 'Suggest a Breed', type: 'breed_request', icon: 'dog' },
          { label: 'Suggest a Surface', type: 'surface_request', icon: 'road-variant' },
          { label: 'Request a Feature', type: 'feature_request', icon: 'lightbulb-outline' },
          { label: 'Report a Bug', type: 'bug_report', icon: 'bug-outline' },
        ].map((opt) => (
          <Pressable
            key={opt.label}
            onPress={() => {
              hapticTap();
              setFeedbackInitialType(opt.type as FeedbackType);
              setFeedbackModalOpen(true);
            }}
            style={({ pressed }) => [
              styles.feedbackCardButton,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
                opacity: pressed ? 0.92 : 1,
              }
            ]}
          >
            <MaterialCommunityIcons name={opt.icon as any} size={20} color={palette.tint} />
            <Text style={{ color: palette.text, fontWeight: '700', fontSize: 14 }}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* 
      <Text style={[styles.h1, { marginTop: 24 }]}>Subscription</Text>
      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <Text style={{ color: palette.text, fontWeight: '800', fontSize: 16 }}>
          {loading ? 'Checking Status...' : isPro ? 'NorthPaw Pro Active' : 'Free Library + Locked Pro Packs'}
        </Text>
        <Text style={{ color: palette.textSecondary, marginTop: 8, lineHeight: 20, fontSize: 14 }}>
          {loading
            ? 'Verifying subscription details...'
            : isPro
              ? 'Thank you for testing the NorthPaw Pro beta! You have access to all premium checklists and offline reference cards.'
              : 'NorthPaw Pro is currently in beta. Unlock custom safety checklists, offline regional guide packs, and location logging.'}
        </Text>
        {error ? <Text style={{ color: palette.danger, marginTop: 10 }}>{error}</Text> : null}
        {!loading && !isPro ? (
          <Pressable
            onPress={() => { hapticTap();  router.push('/paywall'); }}
            style={[styles.cta, { backgroundColor: palette.tint, marginTop: 14 }]}>
            <Text style={styles.ctaText}>Unlock Pro</Text>
          </Pressable>
        ) : null}
      </View>
      */}


      <Text style={[styles.h1, { marginTop: 28 }]}>Legal &amp; listing</Text>
      <Text style={[styles.body, { color: palette.textSecondary, marginBottom: 12 }]}>
        Links for App Store compliance and support.
      </Text>

      <LinkButton
        label="Privacy Policy"
        hint={PRIVACY_POLICY_URL}
        disabled={!PRIVACY_POLICY_URL}
        palette={palette}
        onPress={() => { hapticTap();  openExternalLink(PRIVACY_POLICY_URL); }}
      />

      <LinkButton
        label="Support"
        hint={SUPPORT_URL}
        disabled={!SUPPORT_URL}
        palette={palette}
        onPress={() => { hapticTap();  openExternalLink(SUPPORT_URL); }}
      />

      <Text style={[styles.h1, { marginTop: 28 }]}>Disclaimer</Text>
      <Text style={[styles.body, { color: palette.textSecondary }]}>
        NorthPaw is for general outdoor education. It is not veterinary, legal, or emergency medical advice.
        Always follow posted regulations and consult professionals for health or legal questions.
      </Text>

      <Text style={[styles.h1, { marginTop: 28 }]}>Privacy</Text>
      <Text style={[styles.body, { color: palette.textSecondary, marginBottom: 12 }]}>
        Favorites, checklist boxes, your dog&apos;s name and photo on Home, Pro outing logs (notes, place, photos,
        optional GPS), and open history stay on your device. Subscription status is verified through Apple and
        RevenueCat when configured. Opening Privacy Policy or Support may use an in-app browser or your mail app.
      </Text>

      {__DEV__ ? (
        <>
          <Text style={[styles.h1, { marginTop: 28, color: palette.tint }]}>Developer Settings</Text>
          <Pressable
            onPress={async () => {
              hapticTap();
              Alert.alert(
                'Reset Onboarding',
                'Are you sure you want to reset all onboarding progress and profile data?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await saveDogProfile({
                          onboardingDone: false,
                          dogName: '',
                          dogPhotoUri: '',
                          dogBreed: '',
                          dogBreedMix: '',
                          dogAgeGroup: '',
                          dogOutingTypes: [],
                          locationPermission: '',
                          notificationsPermission: '',
                          dogWeightLbs: null,
                          dogCoatType: '',
                          dogColor: '',
                          dogSnoutProfile: 'standard',
                          dogActivityBaseline: 'moderate',
                          morningBriefTime: '7:00 AM',
                          gearVault: {},
                        });
                        await FileSystem.deleteAsync(FileSystem.documentDirectory + 'home_walkthrough.txt', { idempotent: true });
                        router.replace('/onboarding');
                      } catch (e) {
                        Alert.alert('Error', 'Failed to reset onboarding profile.');
                      }
                    },
                  },
                ]
              );
            }}
            style={({ pressed }) => [
              styles.linkCard,
              {
                borderColor: '#B5443A',
                backgroundColor: palette.surface,
                opacity: pressed ? 0.92 : 1,
              },
            ]}>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={{ color: '#B5443A', fontWeight: '800', fontSize: 16 }}>Reset Onboarding & Profile</Text>
              <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 16 }}>
                Clear all database profile records and return to the onboarding flow.
              </Text>
            </View>
            <FontAwesome name="refresh" size={16} color="#B5443A" />
          </Pressable>
        </>
      ) : null}
      <FeedbackModal
        visible={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        initialType={feedbackInitialType}
      />
    </ScrollView>
  );
}

type Palette = (typeof Colors)['light'];

function LinkButton(props: {
  label: string;
  hint: string;
  disabled: boolean;
  palette: Palette;
  onPress: () => void;
}) {
  const { label, hint, disabled, palette, onPress } = props;
  return (
    <Pressable
      disabled={disabled}
      onPress={() => { hapticTap(); onPress(); }}
      style={({ pressed }) => [
        styles.linkCard,
        {
          borderColor: palette.border,
          backgroundColor: palette.surface,
          opacity: disabled ? 0.55 : pressed ? 0.92 : 1,
        },
      , { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <Text style={{ color: palette.text, fontWeight: '800', fontSize: 16 }}>{label}</Text>
        <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 16 }} numberOfLines={2}>
          {hint}
        </Text>
      </View>
      {!disabled ? (
        <FontAwesome name="chevron-right" size={14} color={palette.textSecondary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  h1: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16 },
  body: { fontSize: 15, lineHeight: 22 },
  cta: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkRow: { flexDirection: 'row', alignItems: 'center' },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  resetBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  feedbackCardButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
  },
});
