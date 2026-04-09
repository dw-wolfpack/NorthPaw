import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { HeroImage } from '@/components/HeroImage';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useSubscription } from '@/context/SubscriptionContext';
import { canAccessPack, getCardsForPack, getChecklistsForPack, getPack } from '@/lib/content';
import { gradientForCardTags, gradientForPack, IMAGES, iconForTag } from '@/lib/contentVisuals';
import { recordOpen } from '@/lib/database';
import { useColorScheme } from '@/components/useColorScheme';

export default function PackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const { isPro, loading: subLoading } = useSubscription();
  const pack = id ? getPack(id) : undefined;

  useEffect(() => {
    if (!id || !pack) return;
    recordOpen('pack', id).catch(() => {});
  }, [id, pack]);

  useEffect(() => {
    if (!pack || subLoading) return;
    if (!canAccessPack(pack.id, isPro)) {
      router.replace({ pathname: '/paywall', params: { returnTo: `/pack/${pack.id}` } });
    }
  }, [pack, isPro, router, subLoading]);

  if (!pack) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text>Pack not found.</Text>
      </View>
    );
  }

  if (subLoading || !canAccessPack(pack.id, isPro)) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        {subLoading ? (
          <ActivityIndicator color={palette.tint} />
        ) : (
          <Text style={{ color: palette.textSecondary }}>Opening subscription…</Text>
        )}
      </View>
    );
  }

  const cards = getCardsForPack(pack.id);
  const checklists = getChecklistsForPack(pack.id);
  const heroGrad = gradientForPack(pack.id);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.container}>
      <HeroImage height={200} source={IMAGES.pack} gradient={heroGrad} scrimOpacity={0.9}>
        <View style={styles.heroBadge}>
          <MaterialCommunityIcons name="book-open-variant" size={16} color="rgba(255,255,255,0.95)" />
          <Text style={styles.heroBadgeText} lightColor="rgba(255,255,255,0.95)" darkColor="rgba(255,255,255,0.95)">
            {cards.length} cards · {checklists.length} lists
          </Text>
        </View>
        <Text style={styles.heroTitle} lightColor="#fff" darkColor="#fff">
          {pack.title}
        </Text>
        <Text
          style={styles.heroSub}
          lightColor="rgba(255,255,255,0.9)"
          darkColor="rgba(255,255,255,0.9)"
          numberOfLines={3}>
          {pack.description}
        </Text>
      </HeroImage>

      {pack.regionNote ? (
        <View style={[styles.noteBox, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <MaterialCommunityIcons name="information" size={20} color={palette.tint} />
          <Text style={[styles.noteText, { color: palette.textSecondary }]}>{pack.regionNote}</Text>
        </View>
      ) : null}

      {checklists.length > 0 ? (
        <>
          <View style={styles.sectionRow}>
            <MaterialCommunityIcons name="format-list-checks" size={20} color={palette.tint} />
            <Text style={[styles.section, { color: palette.text }]}>Checklists</Text>
          </View>
          {checklists.map((cl) => (
            <Pressable
              key={cl.id}
              onPress={() => router.push(`/checklist/${cl.id}`)}
              style={({ pressed }) => [
                styles.row,
                { borderColor: palette.border, backgroundColor: palette.surface, opacity: pressed ? 0.9 : 1 },
              ]}>
              <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={24} color={palette.tint} />
              <Text style={[styles.rowTitle, { color: palette.text, flex: 1 }]}>{cl.title}</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={palette.textSecondary} />
            </Pressable>
          ))}
        </>
      ) : null}

      <View style={styles.sectionRow}>
        <MaterialCommunityIcons name="card-text-outline" size={20} color={palette.tint} />
        <Text style={[styles.section, { color: palette.text }]}>Field cards</Text>
      </View>
      {cards.map((c) => {
        const cg = gradientForCardTags(c.tags);
        const ic = iconForTag(c.tags[0] ?? '');
        return (
          <Pressable
            key={c.id}
            onPress={() => router.push(`/card/${c.id}`)}
            style={({ pressed }) => [
              styles.cardRow,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
                opacity: pressed ? 0.9 : 1,
              },
            ]}>
            <View style={styles.miniThumb}>
              <Image source={IMAGES.card} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient colors={[`${cg[0]}66`, `${cg[1]}bb`]} style={StyleSheet.absoluteFill} />
              <View style={styles.miniThumbIcon}>
                <MaterialCommunityIcons name={ic} size={22} color="rgba(255,255,255,0.95)" />
              </View>
            </View>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={{ fontWeight: '800', color: palette.text, fontSize: 16 }} numberOfLines={2}>
                {c.title}
              </Text>
              {c.subtitle ? (
                <Text style={{ color: palette.textSecondary, fontSize: 13, marginTop: 4 }} numberOfLines={2}>
                  {c.subtitle}
                </Text>
              ) : null}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={palette.textSecondary} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  container: { padding: 20, paddingBottom: 40 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  heroBadgeText: { fontSize: 13, fontWeight: '700' },
  heroTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  heroSub: { fontSize: 15, lineHeight: 21, marginTop: 6 },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 10 },
  section: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  rowTitle: { fontWeight: '700', fontSize: 16 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  miniThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  miniThumbIcon: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
