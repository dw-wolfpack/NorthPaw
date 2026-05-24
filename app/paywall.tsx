import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { ENTITLEMENT_PRO } from '@/constants/Purchases';
import { useSubscription } from '@/context/SubscriptionContext';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { useColorScheme } from '@/components/useColorScheme';
import { IMAGES } from '@/lib/contentVisuals';

const BENEFITS = [
  {
    icon: 'head-cog',
    title: 'Fewer panicked decisions',
    desc: 'Take the guesswork out of heat thresholds, pavement burns, and toxic plants.',
  },
  {
    icon: 'clipboard-list',
    title: 'Deeper offline checklists',
    desc: 'Access hyper-specific packing lists for long road trips and local trail conditions.',
  },
  {
    icon: 'map-marker-path',
    title: 'On-device outing log',
    desc: 'Save photos, GPS coordinates, and private notes locally without cellular reception.',
  },
] as const;

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
  const OVERLAY_COLORS = ['rgba(13,31,23,0.35)', 'rgba(13,31,23,0.92)', '#0A1A12'];

  return (
    <ImageBackground
      source={IMAGES.paywallBg}
      style={{ flex: 1, backgroundColor: '#0A1A12' }}
      contentFit="cover">
      <LinearGradient
        colors={OVERLAY_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.topControlRow}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtnBacking}>
            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
          </Pressable>
        </View>

        <View style={styles.heroBlock}>
          <Text style={styles.h1}>NorthPaw Pro</Text>
          <Text style={styles.p}>
            Step outside with confidence. Unlock premium regional packs, deep situation checklists, and private local logging.
          </Text>
        </View>

        <View style={styles.benefitsBlock}>
          {BENEFITS.map((b) => (
            <View key={b.icon} style={styles.benefitRow}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name={b.icon as any} size={22} color="#4ADE80" />
              </View>
              <View style={styles.benefitTextWrap}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitDesc}>{b.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.packagesWrap}>
          {expoGo ? (
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>Development Mode</Text>
              <Text style={styles.bannerBody}>
                You are running Expo Go where RevCat bindings are unavailable. Please build with a dev client, or use `EXPO_PUBLIC_NORTHPAW_DEV_PRO=1` to simulate Pro access.
              </Text>
            </View>
          ) : null}

          {!expoGo && !configured ? (
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>Store Disconnected</Text>
              <Text style={styles.bannerBody}>
                Missing RevenueCat API Key. Connect the store dashboard to view packages.
              </Text>
            </View>
          ) : null}

          {loading || busy ? (
            <ActivityIndicator style={{ marginVertical: 32 }} color="#4ADE80" size="large" />
          ) : null}

          {!expoGo && configured && packages.length === 0 ? (
            <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
              No subscriptions offered right now. Check back soon.
            </Text>
          ) : null}

          {!expoGo &&
            packages.map((pkg) => (
            <Pressable
              key={pkg.identifier}
              disabled={busy}
              onPress={() => buy(pkg)}
              style={({ pressed }) => [
                styles.pkgBtn,
                { opacity: pressed ? 0.8 : 1 },
              ]}>
              <View style={styles.pkgRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pkgTitle}>{pkg.product.title}</Text>
                  <Text style={styles.pkgDesc}>{pkg.product.description}</Text>
                </View>
                <Text style={styles.pkgPrice}>{pkg.product.priceString}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {!expoGo ? (
          <Pressable onPress={restore} disabled={busy || !configured} style={styles.restoreBtn}>
            <Text style={styles.restoreText}>Restore purchases</Text>
          </Pressable>
        ) : null}

        {msg ? <Text style={styles.errorMsg}>{msg}</Text> : null}

        <Text style={styles.legalLabel}>
          Subscriptions auto-renew to maintain your access unless disabled in Apple ID settings. Unlocking Pro grants on-device reference context via NorthPaw Packs. It is not veterinary advice.
        </Text>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 48,
  },
  topControlRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  closeBtnBacking: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBlock: { backgroundColor: 'transparent', marginBottom: 32 },
  h1: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  p: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  benefitsBlock: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    marginBottom: 20,
    gap: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTextWrap: { flex: 1, backgroundColor: 'transparent', marginTop: 2 },
  benefitTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  benefitDesc: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 20,
  },
  packagesWrap: { backgroundColor: 'transparent' },
  banner: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bannerTitle: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  bannerBody: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  pkgBtn: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderWidth: 1.5,
    borderColor: '#4ADE80',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  pkgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  pkgTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  pkgDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 6,
  },
  pkgPrice: {
    color: '#4ADE80',
    fontSize: 22,
    fontWeight: '800',
  },
  restoreBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreText: { color: '#4ADE80', fontWeight: '700', fontSize: 15 },
  errorMsg: { color: '#F87171', marginTop: 12, textAlign: 'center', fontSize: 14 },
  legalLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
