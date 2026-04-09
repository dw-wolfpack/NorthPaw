import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { HeroImage } from '@/components/HeroImage';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useSubscription } from '@/context/SubscriptionContext';
import { canAccessPack, getCard, getPack } from '@/lib/content';
import { gradientForCardTags, IMAGES, iconForTag } from '@/lib/contentVisuals';
import { addFavorite, isFavorite, recordOpen, removeFavorite } from '@/lib/database';
import { useColorScheme } from '@/components/useColorScheme';

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const { isPro, loading: subLoading } = useSubscription();
  const card = id ? getCard(id) : undefined;
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (!id || !card) return;
    recordOpen('card', id).catch(() => {});
    isFavorite('card', id).then(setFav).catch(() => {});
  }, [id, card]);

  useEffect(() => {
    if (!card || subLoading) return;
    if (!canAccessPack(card.packId, isPro)) {
      router.replace({ pathname: '/paywall', params: { returnTo: `/card/${card.id}` } });
    }
  }, [card, isPro, router, subLoading]);

  const toggleFav = useCallback(async () => {
    if (!id) return;
    if (fav) {
      await removeFavorite('card', id);
      setFav(false);
    } else {
      await addFavorite('card', id);
      setFav(true);
    }
  }, [id, fav]);

  if (!card) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text>Card not found.</Text>
      </View>
    );
  }

  if (subLoading || !canAccessPack(card.packId, isPro)) {
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

  const pack = getPack(card.packId);
  const grad = gradientForCardTags(card.tags);
  const leadIcon = iconForTag(card.tags[0] ?? '');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.container}>
      <View style={styles.heroWrap}>
        <HeroImage height={236} source={IMAGES.card} gradient={grad} scrimOpacity={0.9}>
          <View style={styles.heroTopIcons}>
            <View style={[styles.heroChip, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
              <MaterialCommunityIcons name={leadIcon} size={18} color="#fff" />
            </View>
          </View>
          {pack ? (
            <Text
              style={styles.heroPack}
              lightColor="rgba(255,255,255,0.88)"
              darkColor="rgba(255,255,255,0.88)">
              {pack.title}
            </Text>
          ) : null}
          <Text style={styles.heroCardTitle} lightColor="#fff" darkColor="#fff">
            {card.title}
          </Text>
          {card.subtitle ? (
            <Text
              style={styles.heroCardSub}
              lightColor="rgba(255,255,255,0.9)"
              darkColor="rgba(255,255,255,0.9)">
              {card.subtitle}
            </Text>
          ) : null}
        </HeroImage>
        <Pressable
          onPress={toggleFav}
          hitSlop={12}
          style={[styles.heartFab, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <FontAwesome name={fav ? 'heart' : 'heart-o'} size={22} color={palette.tint} />
        </Pressable>
      </View>

      <View style={[styles.tagRow, { backgroundColor: 'transparent' }]}>
        {card.tags.map((t) => (
          <View
            key={t}
            style={[styles.tag, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <MaterialCommunityIcons name={iconForTag(t)} size={14} color={palette.tint} />
            <Text style={{ fontSize: 13, color: palette.textSecondary, fontWeight: '600' }}>{t}</Text>
          </View>
        ))}
      </View>

      {card.body.map((para, i) => (
        <View
          key={i}
          style={[styles.paraBlock, { borderLeftColor: palette.tint, backgroundColor: palette.surface }]}>
          <Text style={[styles.para, { color: palette.text }]}>{para}</Text>
        </View>
      ))}

      {card.disclaimer ? (
        <View style={[styles.disclaimerBox, { borderColor: palette.border }]}>
          <MaterialCommunityIcons name="shield-alert-outline" size={18} color={palette.textSecondary} />
          <Text style={[styles.disclaimer, { color: palette.textSecondary }]}>{card.disclaimer}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { paddingBottom: 40 },
  heroWrap: { position: 'relative', marginHorizontal: 16, marginTop: 8 },
  heroTopIcons: { flexDirection: 'row', marginBottom: 8 },
  heroChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPack: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3, marginBottom: 4 },
  heroCardTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  heroCardSub: { fontSize: 16, lineHeight: 22, marginTop: 8 },
  heartFab: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 20, marginTop: 18 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  paraBlock: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 4,
    borderRadius: 12,
  },
  para: { fontSize: 16, lineHeight: 25 },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  disclaimer: { flex: 1, fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
});
