import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

import { HeroImage } from '@/components/HeroImage';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useSubscription } from '@/context/SubscriptionContext';
import { canAccessPack, getAllChecklists, getChecklist } from '@/lib/content';
import { gradientForPack, IMAGES } from '@/lib/contentVisuals';
import { listChecklistOutings } from '@/lib/database';
import type { ChecklistOutingRow } from '@/lib/database.types';
import { parseOutingCheckedIds } from '@/lib/parseOutingChecked';
import { parseOutingPhotoUris } from '@/lib/outingPhotoUris';
import { fetchWeatherForDeviceLocation } from '@/lib/weather/weatherDispatcher';
import { useColorScheme } from '@/components/useColorScheme';

export default function ChecklistsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const router = useRouter();
  const { isPro, activeEntitlements } = useSubscription();
  const lists = getAllChecklists();
  const heroGrad = gradientForPack('trail-basics');
  const [outings, setOutings] = useState<ChecklistOutingRow[]>([]);
  const [hazardTags, setHazardTags] = useState<string[]>([]);
  const [hazardMission, setHazardMission] = useState<null | { title: string; body: string }>(null);

  useFocusEffect(
    useCallback(() => {
      let gone = false;
      listChecklistOutings(50).then((rows) => {
        if (!gone) setOutings(rows);
      });
      fetchWeatherForDeviceLocation().then((w) => {
        if (!gone && w.status === 'ok') setHazardTags(w.hazardTags);
      });
      return () => {
        gone = true;
      };
    }, [])
  );
  const activeChecklistAddOns = [
    hazardTags.includes('pollen')
      ? { id: 'hazard-pollen', label: 'Pollen wipe-down kit', hint: 'Add paw wipes after walk.' }
      : null,
    hazardTags.includes('tick')
      ? { id: 'hazard-tick', label: 'Tick check tool', hint: 'Pack tweezers/tick remover today.' }
      : null,
  ].filter((v): v is { id: string; label: string; hint: string } => !!v);
  const missionDetailById: Record<string, { title: string; body: string }> = {
    'hazard-pollen': {
      title: '60-second pollen reset',
      body: 'Wipe paws, belly, and muzzle after the walk. Use a damp cloth first, then dry. Watch for sneezing, eye rub, or paw licking spikes.',
    },
    'hazard-tick': {
      title: '60-second tick sweep',
      body: 'Check ears, armpits, groin, collar line, and between toes. Use a tick tool for removal and clean the area. Log any bite location today.',
    },
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.container}>
      <HeroImage height={132} source={IMAGES.card} gradient={heroGrad} scrimOpacity={0.85}>
        <View style={styles.heroRow}>
          <MaterialCommunityIcons name="clipboard-check" size={22} color="rgba(255,255,255,0.95)" />
          <Text style={styles.heroKicker} lightColor="rgba(255,255,255,0.92)" darkColor="rgba(255,255,255,0.92)">
            Before you go
          </Text>
        </View>
        <Text style={styles.heroTitle} lightColor="#fff" darkColor="#fff">
          Checklists
        </Text>
        <Text
          style={styles.heroSub}
          lightColor="rgba(255,255,255,0.9)"
          darkColor="rgba(255,255,255,0.9)">
          Tap-through lists · checklist boxes save on-device
        </Text>
      </HeroImage>

      {isPro ? (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHead}>
            <MaterialCommunityIcons name="history" size={20} color={palette.tint} />
            <Text style={[styles.sectionLabel, { color: palette.text }]}>Outing log</Text>
          </View>
          <Text style={[styles.sectionHint, { color: palette.textSecondary }]}>
            Place, notes, optional GPS, and photos. Stored only on this device.
          </Text>
          {outings.length === 0 ? (
            <Text style={[styles.emptyLog, { color: palette.textSecondary }]}>
              Open a checklist, scroll to Outing log, then tap Save to log. Entries show up here.
            </Text>
          ) : null}
          {outings.map((o) => {
            const cl = getChecklist(o.checklist_id);
            const title = cl?.title ?? 'Checklist';
            const photoCount = parseOutingPhotoUris(o.photos_json).length;
            const previewParts = [o.place_label.trim(), o.notes.trim()].filter(Boolean);
            const preview =
              previewParts.join(' · ') ||
              (photoCount ? `${photoCount} photo${photoCount === 1 ? '' : 's'}` : '') ||
              `${parseOutingCheckedIds(o.checked_item_ids_json).length} items checked`;
            const when = new Date(o.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            return (
              <Pressable
                key={o.id}
                onPress={() => router.push(`/outing/${o.id}`)}
                style={({ pressed }) => [
                  styles.outingRow,
                  {
                    borderColor: palette.border,
                    backgroundColor: palette.surface,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}>
                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                  <Text style={[styles.outingWhen, { color: palette.textSecondary }]}>{when}</Text>
                  <Text style={[styles.outingTitle, { color: palette.text }]}>{title}</Text>
                  <Text style={[styles.outingPreview, { color: palette.textSecondary }]} numberOfLines={2}>
                    {preview}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={palette.textSecondary} />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {!isPro ? (
        <Pressable
          onPress={() => router.push({ pathname: '/paywall', params: { returnTo: '/(tabs)/checklists' } })}
          style={({ pressed }) => [
            styles.proUpsell,
            {
              borderColor: palette.tint,
              backgroundColor: palette.surface,
              opacity: pressed ? 0.92 : 1,
            },
          ]}>
          <MaterialCommunityIcons name="lock-outline" size={24} color={palette.tint} />
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <Text style={[styles.proUpsellTitle, { color: palette.text }]}>Pro · Outing log</Text>
            <Text style={{ color: palette.textSecondary, marginTop: 4, lineHeight: 20 }}>
              Save outings with place, notes, photos, optional GPS. All local on this device.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={palette.tint} />
        </Pressable>
      ) : null}

      {activeChecklistAddOns.length > 0 ? (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHead}>
            <MaterialCommunityIcons name="alert-outline" size={20} color={palette.tint} />
            <Text style={[styles.sectionLabel, { color: palette.text }]}>Injected by hazards</Text>
          </View>
          {activeChecklistAddOns.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setHazardMission(missionDetailById[item.id] ?? null)}
              style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1 }]}>
              <BlurView intensity={82} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={[styles.hazardInjectedRow, { borderColor: palette.border }]}>
                <MaterialCommunityIcons name="plus-circle-outline" size={18} color={palette.tint} />
                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                  <Text style={[styles.hazardInjectedTitle, { color: palette.text }]}>{item.label}</Text>
                  <Text style={[styles.hazardInjectedHint, { color: palette.textSecondary }]}>{item.hint}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={palette.textSecondary} />
              </BlurView>
            </Pressable>
          ))}
        </View>
      ) : null}

      {lists.map((cl) => {
        const locked = !canAccessPack(cl.packId, isPro, activeEntitlements);
        return (
          <Pressable
            key={cl.id}
            onPress={() => {
              if (locked) {
                router.push({ pathname: '/paywall', params: { returnTo: `/checklist/${cl.id}` } });
              } else {
                router.push(`/checklist/${cl.id}`);
              }
            }}
            style={({ pressed }) => [
              styles.row,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
                opacity: pressed ? 0.9 : 1,
              },
            ]}>
            <View style={[styles.checkIcon, { backgroundColor: `${palette.tint}22` }]}>
              <MaterialCommunityIcons name="format-list-checks" size={26} color={palette.tint} />
            </View>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={[styles.title, { color: palette.text }]}>{cl.title}</Text>
              {cl.description ? (
                <Text style={{ color: palette.textSecondary, marginTop: 4 }} numberOfLines={2}>
                  {cl.description}
                </Text>
              ) : null}
              <View style={styles.metaRow}>
                <Text style={{ color: palette.tint, fontSize: 13, fontWeight: '700' }}>
                  {cl.items.length} items
                </Text>
                {locked ? (
                  <View style={[styles.lockMini, { borderColor: palette.tint }]}>
                    <MaterialCommunityIcons name="lock" size={12} color={palette.tint} />
                    <Text style={{ color: palette.tint, fontSize: 11, fontWeight: '700' }}>Pro</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={palette.textSecondary} />
          </Pressable>
        );
      })}
      <Modal visible={!!hazardMission} transparent animationType="fade" onRequestClose={() => setHazardMission(null)}>
        <View style={styles.missionOverlay}>
          <BlurView intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[styles.missionCard, { borderColor: palette.border }]}>
            <Text style={[styles.missionTitle, { color: palette.text }]}>{hazardMission?.title}</Text>
            <Text style={[styles.missionBody, { color: palette.textSecondary }]}>{hazardMission?.body}</Text>
            <Pressable onPress={() => setHazardMission(null)} style={[styles.missionCloseBtn, { backgroundColor: palette.tint }]}>
              <Text style={styles.missionCloseText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  heroKicker: { fontSize: 13, fontWeight: '700' },
  heroTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.4 },
  heroSub: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  checkIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  lockMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sectionBlock: { marginBottom: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionLabel: { fontSize: 17, fontWeight: '800' },
  sectionHint: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  emptyLog: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  outingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  outingWhen: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  outingTitle: { fontSize: 16, fontWeight: '800' },
  outingPreview: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  proUpsell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  proUpsellTitle: { fontSize: 16, fontWeight: '800' },
  hazardInjectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  hazardInjectedTitle: { fontSize: 14, fontWeight: '800' },
  hazardInjectedHint: { marginTop: 2, fontSize: 12, lineHeight: 16 },
  missionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  missionCard: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 24,
    backgroundColor: 'rgba(15,23,20,0.72)',
    padding: 20,
  },
  missionTitle: { fontSize: 20, fontWeight: '800' },
  missionBody: { marginTop: 10, fontSize: 14, lineHeight: 20 },
  missionCloseBtn: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  missionCloseText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
