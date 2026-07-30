import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { IMAGES } from '@/lib/contentVisuals';
import { trackEvent } from '@/lib/analytics';
import { useSubscription } from '@/context/SubscriptionContext';
import { checkCompanionEligibility, CompanionEligibility, COMPANION_REQUIREMENTS } from '@/lib/companion/companionEligibility';

const COMPANION_BENEFITS = [
  {
    icon: 'head-cog',
    title: 'Personalized Window Refinement',
    desc: 'Learns how your dog recovers from specific surface & humidity thresholds.',
  },
  {
    icon: 'history',
    title: 'Similar-Condition Recall',
    desc: 'Shows how your dog handled identical weather and heat levels on past walks.',
  },
  {
    icon: 'chart-line-variant',
    title: 'Seasonal Adaptation Insights',
    desc: 'Tracks coat density & temperature adaptation over summer & winter transitions.',
  },
] as const;

export default function PaywallScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const { isPro } = useSubscription();
  const [busy, setBusy] = useState(false);
  const [eligibility, setEligibility] = useState<CompanionEligibility | null>(null);

  const [isDemoUnlocked, setIsDemoUnlocked] = useState(false);

  useEffect(() => {
    trackEvent('companion_preview_viewed', { returnTo });
    checkCompanionEligibility().then((res) => {
      setEligibility(res);
      if (res.isEligible) {
        trackEvent('companion_eligibility_reached');
      }
    });
  }, [returnTo]);

  const onClose = useCallback(() => {
    trackEvent('companion_paywall_closed', { returnTo });
    if (isPro && returnTo && typeof returnTo === 'string') {
      router.replace(returnTo as Parameters<typeof router.replace>[0]);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [returnTo, router, isPro]);

  const registerInterest = async (pkgName: string, priceString: string) => {
    setBusy(true);
    try {
      await trackEvent('companion_interest_registered', { packageName: pkgName, price: priceString });
      if (pkgName === 'companion_demo') {
        setIsDemoUnlocked(true);
      } else {
        Alert.alert(
          'Baseline In Progress',
          'Thank you for your interest! NorthPaw Companion is building local baseline features. We will notify you when personalized insights unlock.',
          [{ text: 'Got It', onPress: onClose }]
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    await trackEvent('companion_restore_tapped');
    Alert.alert('Beta Mode', 'NorthPaw Companion is currently in local baseline building phase.');
  };

  const OVERLAY_COLORS = ['rgba(13,31,23,0.35)', 'rgba(13,31,23,0.92)', '#0A1A12'] as const;

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
          <Text style={styles.h1}>NorthPaw Companion</Text>
          <Text style={styles.p}>
            Private, on-device intelligence that adapts to your dog's unique tolerance over time.
          </Text>
        </View>

        {/* Phase H4: Pre-Eligibility Baseline Screen */}
        {eligibility && !eligibility.isEligible && (
          <View style={styles.eligibilityCard}>
            <View style={styles.eligibilityBadge}>
              <MaterialCommunityIcons name="shield-sync" size={18} color="#D4AF37" />
              <Text style={styles.eligibilityBadgeText}>Building Private Baseline</Text>
            </View>
            <Text style={styles.eligibilityTitle}>
              {eligibility.qualifiedOutcomesCount} of {eligibility.requiredOutcomes} Check-Ins Recorded
            </Text>
            <Text style={styles.eligibilitySub}>
              Companion insights require at least {eligibility.requiredOutcomes} post-walk check-ins across {eligibility.requiredOutcomeDays} days to ensure day-1 personalized value.
            </Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${eligibility.progressPercent}%` }]} />
            </View>
            <Text style={styles.progressPercentText}>{eligibility.progressPercent}% Baseline Complete</Text>
          </View>
        )}

        <View style={styles.benefitsList}>
          {COMPANION_BENEFITS.map((item, i) => (
            <View key={i} style={styles.benefitRow}>
              <View style={styles.iconChip}>
                <MaterialCommunityIcons name={item.icon as any} size={22} color="#D4AF37" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.benefitTitle}>{item.title}</Text>
                <Text style={styles.benefitDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Unlocked Insights Card in Demo Mode */}
        {isDemoUnlocked && (
          <View style={{ width: '100%', marginTop: 12, marginBottom: 16, padding: 18, borderRadius: 20, backgroundColor: 'rgba(212, 175, 55, 0.12)', borderWidth: 1, borderColor: '#D4AF37' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="star-four-points" size={22} color="#D4AF37" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFF' }}>Demo Mode: Unlocked Insights</Text>
            </View>

            <View style={{ marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: 'rgba(10, 26, 18, 0.85)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#D4AF37', marginBottom: 2 }}>Similar-Condition Recall</Text>
              <Text style={{ fontSize: 12, color: '#EAEAEA', lineHeight: 17 }}>
                On past 82°F sunny days on Asphalt, Aoife completed 25-min walks with zero heat fatigue.
              </Text>
            </View>

            <View style={{ marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: 'rgba(10, 26, 18, 0.85)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#D4AF37', marginBottom: 2 }}>Personalized Window Refinement</Text>
              <Text style={{ fontSize: 12, color: '#EAEAEA', lineHeight: 17 }}>
                Optimal morning window refined to before 9:00 AM based on Aoife's recovery patterns.
              </Text>
            </View>

            <View style={{ padding: 12, borderRadius: 12, backgroundColor: 'rgba(10, 26, 18, 0.85)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#D4AF37', marginBottom: 2 }}>Seasonal Adaptation Insights</Text>
              <Text style={{ fontSize: 12, color: '#EAEAEA', lineHeight: 17 }}>
                Aoife shows +15% elevated heat sensitivity during early summer transitions.
              </Text>
            </View>
          </View>
        )}

        {/* Purchase CTA unlocked when eligible OR in Screenshot / Demo Mode */}
        <View style={styles.ctaBox}>
          {eligibility?.isEligible ? (
            <Pressable
              disabled={busy}
              style={[styles.mainBtn, busy && { opacity: 0.7 }]}
              onPress={() => registerInterest('companion_annual', '$29.99/yr')}>
              {busy ? (
                <ActivityIndicator color="#0A1A12" />
              ) : (
                <Text style={styles.mainBtnText}>Unlock Companion — $29.99/year</Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              disabled={busy}
              style={[styles.mainBtn, { backgroundColor: '#D4AF37' }]}
              onPress={() => registerInterest('companion_demo', 'Demo Mode Unlocked')}>
              {busy ? (
                <ActivityIndicator color="#0A1A12" />
              ) : (
                <Text style={[styles.mainBtnText, { color: '#0A1A12' }]}>
                  Preview Companion Features (Demo Mode)
                </Text>
              )}
            </Pressable>
          )}

          <Pressable onPress={restore} style={styles.restoreBtn}>
            <Text style={styles.restoreText}>Restore Purchase</Text>
          </Pressable>
        </View>

        <Text style={styles.disclaimerText}>
          Core readiness, surface heat estimates, and post-walk check-ins remain 100% free forever. All Companion data stays on your device.
        </Text>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  topControlRow: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  closeBtnBacking: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBlock: {
    marginBottom: 20,
  },
  h1: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F5E6C8',
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 8,
  },
  p: {
    fontSize: 16,
    color: '#D0E0D5',
    lineHeight: 22,
  },
  eligibilityCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  eligibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  eligibilityBadgeText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  eligibilityTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  eligibilitySub: {
    color: '#D0E0D5',
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 4,
  },
  progressPercentText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  benefitsList: {
    gap: 16,
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  benefitDesc: {
    color: '#B0C2B6',
    fontSize: 14,
    lineHeight: 18,
  },
  ctaBox: {
    gap: 12,
    marginBottom: 20,
  },
  mainBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  mainBtnText: {
    color: '#0A1A12',
    fontSize: 16,
    fontWeight: '800',
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  restoreText: {
    color: '#B0C2B6',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  disclaimerText: {
    color: '#8A9E92',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
