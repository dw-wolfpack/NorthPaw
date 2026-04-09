import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { ENTITLEMENT_PRO } from '@/constants/Purchases';
import { useSubscription } from '@/context/SubscriptionContext';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { useColorScheme } from '@/components/useColorScheme';

export default function PaywallScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const { configured, expoGo, currentOffering, purchasePackage, restorePurchases, loading } =
    useSubscription();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onClose = useCallback(() => {
    if (returnTo && typeof returnTo === 'string') {
      router.replace(returnTo as Parameters<typeof router.replace>[0]);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [returnTo, router]);

  const buy = async (pkg: PurchasesPackage) => {
    setBusy(true);
    setMsg(null);
    try {
      await purchasePackage(pkg);
      onClose();
    } catch (e: unknown) {
      const err = e as { code?: unknown; userCancelled?: boolean };
      const cancelled =
        err?.userCancelled === true ||
        err?.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
      if (cancelled) {
        setMsg(null);
      } else {
        setMsg(e instanceof Error ? e.message : 'Purchase failed');
      }
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const info = await restorePurchases();
      const hasPro = info.entitlements.active[ENTITLEMENT_PRO] != null;
      if (hasPro) onClose();
      else setMsg('No active subscription found for this Apple ID.');
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Restore failed');
    } finally {
      setBusy(false);
    }
  };

  const packages = currentOffering?.availablePackages ?? [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.body}>
        <Text style={styles.h1}>NorthPaw Pro</Text>
        <Text style={[styles.p, { color: palette.textSecondary }]}>
          Fewer panicked decisions about heat, cars, other dogs, and seasonal trail risks. Judgment you can open on a sidewalk or at the trailhead. Unlock NorCal seasonal packs, deeper checklists, an on-device outing log (place, notes, photos, optional GPS), and future drops. Billed through Apple; cancel anytime in Settings → Subscriptions.
        </Text>

        {expoGo ? (
          <View style={[styles.banner, { borderColor: palette.tint, backgroundColor: palette.surface }]}>
            <Text style={{ color: palette.text, fontWeight: '600' }}>You’re in Expo Go</Text>
            <Text style={{ color: palette.textSecondary, marginTop: 8, lineHeight: 20 }}>
              In-app purchases need a development or production build (RevenueCat + StoreKit). Scanning the QR
              from <Text style={{ fontWeight: '700' }}>npm run dev</Text> opens Expo Go for free-tier preview. To
              test subscriptions, run <Text style={{ fontWeight: '700' }}>npm run dev:client</Text> after installing
              NorthPaw with Xcode or EAS.
            </Text>
          </View>
        ) : null}

        {!expoGo && !configured ? (
          <View style={[styles.banner, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <Text style={{ color: palette.text, fontWeight: '600' }}>Store not configured</Text>
            <Text style={{ color: palette.textSecondary, marginTop: 8, lineHeight: 20 }}>
              Add your RevenueCat iOS API key (EXPO_PUBLIC_REVENUECAT_IOS_API_KEY) and create an offering with
              entitlement &quot;pro&quot; in the dashboard. Product IDs in code are placeholders, swap for
              your App Store product identifiers.
            </Text>
          </View>
        ) : null}

        {loading || busy ? (
          <ActivityIndicator style={{ marginVertical: 20 }} color={palette.tint} />
        ) : null}

        {!expoGo && configured && packages.length === 0 ? (
          <Text style={{ color: palette.textSecondary, marginTop: 12 }}>
            No packages in the current RevenueCat offering. Attach monthly/annual products to the default
            offering.
          </Text>
        ) : null}

        {!expoGo &&
          packages.map((pkg) => (
          <Pressable
            key={pkg.identifier}
            disabled={busy}
            onPress={() => buy(pkg)}
            style={({ pressed }) => [
              styles.pkg,
              { borderColor: palette.tint, backgroundColor: palette.surface, opacity: pressed ? 0.9 : 1 },
            ]}>
            <Text style={{ fontWeight: '700', color: palette.text, fontSize: 17 }}>
              {pkg.product.title}
            </Text>
            <Text style={{ color: palette.textSecondary, marginTop: 6 }}>{pkg.product.description}</Text>
            <Text style={{ color: palette.tint, fontWeight: '800', marginTop: 10, fontSize: 18 }}>
              {pkg.product.priceString}
            </Text>
          </Pressable>
        ))}

        {!expoGo ? (
          <Pressable
            onPress={restore}
            disabled={busy || !configured}
            style={{ marginTop: 20, alignItems: 'center', padding: 12 }}>
            <Text style={{ color: palette.tint, fontWeight: '600' }}>Restore purchases</Text>
          </Pressable>
        ) : null}

        {msg ? <Text style={{ color: palette.danger, marginTop: 16, textAlign: 'center' }}>{msg}</Text> : null}

        <Text style={[styles.legal, { color: palette.textSecondary }]}>
          Educational app. Subscriptions unlock digital reference content only.
        </Text>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, paddingBottom: 40 },
  h1: { fontSize: 28, fontWeight: '800' },
  p: { fontSize: 15, lineHeight: 22, marginTop: 10, marginBottom: 16 },
  banner: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  pkg: { borderWidth: 2, borderRadius: 14, padding: 18, marginBottom: 12 },
  legal: { fontSize: 11, lineHeight: 16, marginTop: 28, textAlign: 'center' },
});
