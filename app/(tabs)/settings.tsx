import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';

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
import { useColorScheme } from '@/components/useColorScheme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const { isPro, configured, expoGo, loading, error } = useSubscription();
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.container}>
      <Text style={styles.h1}>Your dog</Text>
      <Pressable
        onPress={() => router.push('/dog-profile')}
        style={({ pressed }) => [
          styles.linkCard,
          {
            borderColor: palette.border,
            backgroundColor: palette.surface,
            opacity: pressed ? 0.92 : 1,
            marginBottom: 8,
          },
        ]}>
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          <Text style={{ color: palette.text, fontWeight: '800', fontSize: 16 }}>Name &amp; photo</Text>
          <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 16 }}>
            Shown on Home. Stored only on this device.
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={palette.textSecondary} />
      </Pressable>
      <Pressable
        onPress={() => router.push('/reminders')}
        style={({ pressed }) => [
          styles.linkCard,
          {
            borderColor: palette.border,
            backgroundColor: palette.surface,
            opacity: pressed ? 0.92 : 1,
            marginBottom: 8,
          },
        ]}>
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          <Text style={{ color: palette.text, fontWeight: '800', fontSize: 16 }}>Care reminders</Text>
          <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 16 }}>
            Heartworm and flea & tick alerts on your device. Custom schedules with Pro. Alerts are scheduled
            locally—no server.
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={palette.textSecondary} />
      </Pressable>

      <Text style={[styles.h1, { marginTop: 24 }]}>Subscription</Text>
      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <Text style={{ color: palette.text, fontWeight: '600' }}>
          {loading ? 'Checking…' : isPro ? 'NorthPaw Pro active' : 'Free library + locked Pro packs'}
        </Text>
        {expoGo ? (
          <Text style={{ color: palette.textSecondary, marginTop: 10, lineHeight: 20 }}>
            Running in Expo Go, Pro packs stay locked here. Use EXPO_PUBLIC_NORTHPAW_DEV_PRO=1 in .env to
            preview all content locally, or build a dev client (npm run dev:client) for real StoreKit.
          </Text>
        ) : !configured ? (
          <Text style={{ color: palette.textSecondary, marginTop: 10, lineHeight: 20 }}>
            Add EXPO_PUBLIC_REVENUECAT_IOS_API_KEY for StoreKit. Until then, Pro lessons stay locked (unless you
            set EXPO_PUBLIC_NORTHPAW_DEV_PRO=1 in development only).
          </Text>
        ) : null}
        {error ? <Text style={{ color: palette.danger, marginTop: 10 }}>{error}</Text> : null}
        {!isPro ? (
          <Pressable
            onPress={() => router.push('/paywall')}
            style={[styles.cta, { backgroundColor: palette.tint, marginTop: 14 }]}>
            <Text style={styles.ctaText}>Unlock Pro</Text>
          </Pressable>
        ) : null}
        {Platform.OS === 'ios' ? (
          <Pressable
            onPress={() => openExternalLink(APPLE_MANAGE_SUBSCRIPTIONS_URL)}
            style={[styles.linkRow, { marginTop: 12 }]}>
            <Text style={{ color: palette.tint, fontWeight: '700', fontSize: 15 }}>
              Manage subscription in App Store…
            </Text>
            <FontAwesome name="external-link" size={14} color={palette.tint} style={{ marginLeft: 8 }} />
          </Pressable>
        ) : null}
      </View>

      <Text style={[styles.h1, { marginTop: 28 }]}>Legal &amp; listing</Text>
      <Text style={[styles.body, { color: palette.textSecondary, marginBottom: 12 }]}>
        Links for App Store compliance and support. Set URLs in your Expo env (
        <Text style={{ fontWeight: '700', color: palette.textSecondary }}>EXPO_PUBLIC_NORTHPAW_*</Text>) before
        production builds. Legacy EXPO_PUBLIC_TRAILREADY_* names still work.
      </Text>

      <LinkButton
        label="Privacy Policy"
        hint={PRIVACY_POLICY_URL ? PRIVACY_POLICY_URL : 'Add EXPO_PUBLIC_NORTHPAW_PRIVACY_URL'}
        disabled={!PRIVACY_POLICY_URL}
        palette={palette}
        onPress={() => openExternalLink(PRIVACY_POLICY_URL)}
      />
      <LinkButton
        label="Terms of Use"
        hint={TERMS_OF_USE_URL ? TERMS_OF_USE_URL : 'Add EXPO_PUBLIC_NORTHPAW_TERMS_URL'}
        disabled={!TERMS_OF_USE_URL}
        palette={palette}
        onPress={() => openExternalLink(TERMS_OF_USE_URL)}
      />
      <LinkButton
        label="Support"
        hint={
          SUPPORT_URL
            ? SUPPORT_URL
            : 'Add EXPO_PUBLIC_NORTHPAW_SUPPORT_URL (https or mailto:)'
        }
        disabled={!SUPPORT_URL}
        palette={palette}
        onPress={() => openExternalLink(SUPPORT_URL)}
      />

      <Text style={[styles.h1, { marginTop: 28 }]}>Disclaimer</Text>
      <Text style={[styles.body, { color: palette.textSecondary }]}>
        NorthPaw is for general outdoor education. It is not veterinary, legal, or emergency medical advice.
        Always follow posted regulations and consult professionals for health or legal questions.
      </Text>

      <Text style={[styles.h1, { marginTop: 28 }]}>Privacy</Text>
      <Text style={[styles.body, { color: palette.textSecondary }]}>
        Favorites, checklist boxes, your dog&apos;s name and photo on Home, Pro outing logs (notes, place, photos,
        optional GPS), and open history stay on your device. Subscription status is verified through Apple and
        RevenueCat when configured. Opening Privacy Policy or Support may use an in-app browser or your mail app.
      </Text>
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
      onPress={onPress}
      style={({ pressed }) => [
        styles.linkCard,
        {
          borderColor: palette.border,
          backgroundColor: palette.surface,
          opacity: disabled ? 0.55 : pressed ? 0.92 : 1,
        },
      ]}>
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
});
