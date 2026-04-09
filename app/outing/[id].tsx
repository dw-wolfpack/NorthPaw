import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useSubscription } from '@/context/SubscriptionContext';
import { getChecklist } from '@/lib/content';
import { deleteChecklistOuting, getChecklistOuting } from '@/lib/database';
import type { ChecklistOutingRow } from '@/lib/database.types';
import { parseOutingCheckedIds } from '@/lib/parseOutingChecked';
import { parseOutingPhotoUris } from '@/lib/outingPhotoUris';
import { useColorScheme } from '@/components/useColorScheme';

export default function OutingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const { isPro, loading: subLoading } = useSubscription();
  const [row, setRow] = useState<ChecklistOutingRow | null | undefined>(undefined);

  const load = useCallback(async () => {
    if (!id) {
      setRow(null);
      return;
    }
    const r = await getChecklistOuting(id);
    setRow(r ?? null);
  }, [id]);

  useEffect(() => {
    load().catch(() => setRow(null));
  }, [load]);

  useEffect(() => {
    if (subLoading) return;
    if (!isPro) router.replace({ pathname: '/paywall', params: { returnTo: '/(tabs)/checklists' } });
  }, [isPro, router, subLoading]);

  const onDelete = () => {
    if (!id) return;
    const photosJson = row?.photos_json ?? '[]';
    const hasPhotos = parseOutingPhotoUris(photosJson).length > 0;
    Alert.alert(
      'Delete this log?',
      hasPhotos
        ? 'This entry and its saved photos will be removed from your device.'
        : 'This outing entry will be removed from your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteChecklistOuting(id).then(() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)/checklists');
            });
          },
        },
      ]
    );
  };

  if (subLoading || !isPro) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  }

  if (row === undefined) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  }

  if (!row) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={{ color: palette.text }}>Outing not found.</Text>
      </View>
    );
  }

  const cl = getChecklist(row.checklist_id);
  const title = cl?.title ?? 'Checklist';
  const checkedIds = new Set(parseOutingCheckedIds(row.checked_item_ids_json));
  const labels =
    cl?.items.filter((i) => checkedIds.has(i.id)).map((i) => i.label) ?? [];
  const missingLabels = Array.from(checkedIds).filter((cid) => !cl?.items.some((i) => i.id === cid));

  const when = new Date(row.created_at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const photoUris = parseOutingPhotoUris(row.photos_json);
  const hasGps = row.latitude != null && row.longitude != null;
  const mapsUrl = hasGps
    ? `https://maps.apple.com/?ll=${row.latitude},${row.longitude}&q=Pinned+location`
    : '';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.date, { color: palette.textSecondary }]}>{when}</Text>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>

      {row.place_label.trim() ? (
        <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <Text style={[styles.cardLabel, { color: palette.textSecondary }]}>Place</Text>
          <Text style={[styles.notes, { color: palette.text }]}>{row.place_label.trim()}</Text>
        </View>
      ) : null}

      {hasGps ? (
        <Pressable
          onPress={() => Linking.openURL(mapsUrl)}
          style={({ pressed }) => [
            styles.mapsRow,
            {
              borderColor: palette.tint,
              backgroundColor: palette.surface,
              opacity: pressed ? 0.9 : 1,
            },
          ]}>
          <MaterialCommunityIcons name="map-marker-radius" size={24} color={palette.tint} />
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <Text style={{ color: palette.text, fontWeight: '700' }}>Pinned location</Text>
            <Text style={{ color: palette.textSecondary, fontSize: 13, marginTop: 4 }}>
              {row.latitude!.toFixed(5)}, {row.longitude!.toFixed(5)} · Open in Maps
            </Text>
          </View>
          <MaterialCommunityIcons name="open-in-new" size={20} color={palette.tint} />
        </Pressable>
      ) : null}

      {photoUris.length > 0 ? (
        <>
          <Text style={[styles.sectionLabel, { color: palette.text, marginTop: 8 }]}>Photos</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoStrip}>
            {photoUris.map((uri, i) => (
              <Image
                key={`${uri}-${i}`}
                source={{ uri }}
                style={[styles.photoLarge, { backgroundColor: palette.border }]}
                contentFit="cover"
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <Text style={[styles.cardLabel, { color: palette.textSecondary }]}>Notes</Text>
        <Text style={[styles.notes, { color: row.notes ? palette.text : palette.textSecondary }]}>
          {row.notes.trim() ? row.notes.trim() : 'No notes for this outing.'}
        </Text>
      </View>

      <Text style={[styles.sectionLabel, { color: palette.text }]}>Items checked (snapshot)</Text>
      <Text style={{ color: palette.textSecondary, fontSize: 13, marginBottom: 10, lineHeight: 18 }}>
        Saved when you tapped “Save to log.” Current checklist boxes are separate.
      </Text>
      {labels.map((label) => (
        <View
          key={label}
          style={[styles.itemRow, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <Text style={{ color: palette.text, flex: 1, lineHeight: 22 }}>{label}</Text>
        </View>
      ))}
      {missingLabels.map((mid) => (
        <View
          key={mid}
          style={[styles.itemRow, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <Text style={{ color: palette.textSecondary, flex: 1, fontStyle: 'italic' }}>(removed item · {mid})</Text>
        </View>
      ))}
      {labels.length === 0 && missingLabels.length === 0 ? (
        <Text style={{ color: palette.textSecondary }}>Nothing was checked in this snapshot.</Text>
      ) : null}

      <Pressable
        onPress={onDelete}
        style={({ pressed }) => [
          styles.deleteBtn,
          { borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
        ]}>
        <Text style={{ color: '#c1121f', fontWeight: '700', textAlign: 'center' }}>Delete log entry</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingBottom: 48 },
  date: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 22 },
  cardLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  notes: { fontSize: 16, lineHeight: 24 },
  sectionLabel: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  itemRow: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8 },
  mapsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  photoStrip: { paddingVertical: 8, gap: 10 },
  photoLarge: { width: 220, height: 220, borderRadius: 14, marginRight: 12 },
  deleteBtn: { marginTop: 28, borderWidth: 1, borderRadius: 12, paddingVertical: 14 },
});
