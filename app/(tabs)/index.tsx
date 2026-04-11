import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { HeroImage } from '@/components/HeroImage';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useSubscription } from '@/context/SubscriptionContext';
import {
  canAccessPack,
  getAllPacks,
  getCardsForPack,
  getCurrentHazardMonth,
  getLibrary,
} from '@/lib/content';
import { gradientForPack, IMAGES } from '@/lib/contentVisuals';
import { useColorScheme } from '@/components/useColorScheme';

export default function LibraryScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const router = useRouter();
  const { isPro } = useSubscription();
  const packs = getAllPacks();
  const hazard = getCurrentHazardMonth();
  const lib = getLibrary();

  const homeGrad = gradientForPack('trail-basics');

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.container}>
      <HeroImage height={168} source={IMAGES.homeHero} gradient={homeGrad} scrimOpacity={0.88}>
        <View style={styles.heroLabelRow}>
          <MaterialCommunityIcons name="paw" size={18} color="rgba(255,255,255,0.95)" />
          <Text style={styles.heroKicker} lightColor="rgba(255,255,255,0.92)" darkColor="rgba(255,255,255,0.92)">
            Field guide · offline
          </Text>
        </View>
        <Text style={styles.heroTitle} lightColor="#fff" darkColor="#fff">
          NorthPaw
        </Text>
        <Text
          style={styles.heroSubOverlay}
          lightColor="rgba(255,255,255,0.92)"
          darkColor="rgba(255,255,255,0.92)">
          Dog life year-round: neighborhood, car, trail. Quick checks when judgment beats guessing.
        </Text>
      </HeroImage>

      <Text style={[styles.bodyLead, { color: palette.textSecondary }]}>
        Educational reference only. Not veterinary or legal advice. Confirm local rules for trails, parks, and vehicles yourself.
      </Text>

      {hazard ? (
        <View style={[styles.hazardCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <LinearGradient
            colors={[`${palette.tint}22`, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.hazardHeader}>
            <MaterialCommunityIcons name="calendar-month" size={22} color={palette.tint} />
            <Text style={[styles.cardTitle, { color: palette.text }]}>This month</Text>
          </View>
          <Text style={[styles.hazardMonthTitle, { color: palette.text }]}>{hazard.title}</Text>
          {hazard.bullets.map((b) => (
            <View key={b} style={styles.bulletRow}>
              <MaterialCommunityIcons name="terrain" size={16} color={palette.tint} style={styles.bulletIcon} />
              <Text style={[styles.bullet, { color: palette.textSecondary }]}>{b}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.sectionRow}>
        <MaterialCommunityIcons name="map-search" size={20} color={palette.tint} />
        <Text style={[styles.sectionLabel, { color: palette.text }]}>
          Packs · {lib.cards.length} cards
        </Text>
      </View>

      {packs.map((pack) => {
        const locked = !canAccessPack(pack.id, isPro);
        const count = getCardsForPack(pack.id).length;
        const pg = gradientForPack(pack.id);
        return (
          <Pressable
            key={pack.id}
            onPress={() => {
              if (locked) {
                router.push({ pathname: '/paywall', params: { returnTo: `/pack/${pack.id}` } });
              } else {
                router.push(`/pack/${pack.id}`);
              }
            }}
            style={({ pressed }) => [
              styles.packRow,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
                opacity: pressed ? 0.88 : 1,
              },
            ]}>
            <View style={styles.thumbOuter}>
              <Image source={IMAGES.pack} style={styles.packThumb} contentFit="cover" />
              <LinearGradient
                colors={[`${pg[1]}55`, `${pg[0]}99`]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.thumbIconWrap}>
                <MaterialCommunityIcons name="dog-side" size={26} color="rgba(255,255,255,0.92)" />
              </View>
            </View>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={styles.packTitle}>{pack.title}</Text>
              <Text style={{ color: palette.textSecondary, fontSize: 14 }} numberOfLines={2}>
                {pack.description}
              </Text>
              <View style={styles.packMeta}>
                <Text style={{ color: palette.tint, fontSize: 13, fontWeight: '700' }}>
                  {count} cards · {pack.tier === 'premium' ? 'Pro' : 'Free'}
                </Text>
                {locked ? (
                  <View style={[styles.lockPill, { borderColor: palette.tint }]}>
                    <MaterialCommunityIcons name="lock" size={14} color={palette.tint} />
                    <Text style={{ color: palette.tint, fontSize: 12, fontWeight: '700' }}>Pro</Text>
                  </View>
                ) : (
                  <MaterialCommunityIcons name="chevron-right" size={22} color={palette.textSecondary} />
                )}
              </View>
            </View>
          </Pressable>
        );
      })}

      <Text style={[styles.footerLegal, { color: palette.textSecondary }]}>
        Educational content only. Verify trail regulations with official sources before you head out.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 48 },
  heroLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  heroKicker: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  heroTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  heroSubOverlay: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
    maxWidth: 320,
  },
  bodyLead: { fontSize: 14, lineHeight: 20, marginTop: 16, marginBottom: 8 },
  hazardCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  hazardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  hazardMonthTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  bulletIcon: { marginTop: 3 },
  bullet: { flex: 1, fontSize: 14, lineHeight: 21 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 },
  sectionLabel: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  packRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 14,
  },
  thumbOuter: {
    width: 78,
    height: 78,
    borderRadius: 14,
    overflow: 'hidden',
  },
  packThumb: { width: '100%', height: '100%' },
  thumbIconWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4, letterSpacing: -0.2 },
  packMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  footerLegal: { fontSize: 12, lineHeight: 18, marginTop: 20 },
});
