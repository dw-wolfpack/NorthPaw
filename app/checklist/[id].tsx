import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { HeaderBackButton, type HeaderBackButtonProps } from '@react-navigation/elements';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View as RNView,
} from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useSubscription } from '@/context/SubscriptionContext';
import { canAccessPack, getChecklist } from '@/lib/content';
import {
  clearChecklistAllLocal,
  getChecklistCheckedIds,
  recordOpen,
  saveChecklistOuting,
  setChecklistItemChecked,
} from '@/lib/database';
import { captureLocationForOuting, pickOutingPhotos } from '@/lib/outingCaptureHelpers';
import { useColorScheme } from '@/components/useColorScheme';

const MAX_PHOTOS = 3;

export default function ChecklistDetailScreen() {
  const { id: idParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const id = typeof idParam === 'string' ? idParam : idParam?.[0];
  const router = useRouter();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const { isPro, loading: subLoading } = useSubscription();
  const cl = id ? getChecklist(id) : undefined;
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [outingNotes, setOutingNotes] = useState('');
  const [placeLabel, setPlaceLabel] = useState('');
  const [includeGps, setIncludeGps] = useState(false);
  const [pendingPhotoUris, setPendingPhotoUris] = useState<string[]>([]);
  const [outingBusy, setOutingBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    const s = await getChecklistCheckedIds(id);
    setChecked(s);
  }, [id]);

  useEffect(() => {
    if (!id || !cl) return;
    recordOpen('checklist', id).catch(() => {});
    reload().catch(() => {});
  }, [id, cl, reload]);

  const exitChecklist = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace('/(tabs)/checklists' as Href);
    }
  }, [navigation, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: (props: HeaderBackButtonProps) => (
        <HeaderBackButton {...props} onPress={exitChecklist} />
      ),
    });
  }, [navigation, exitChecklist]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        exitChecklist();
        return true;
      });
      return () => sub.remove();
    }, [exitChecklist])
  );

  useEffect(() => {
    if (!isFocused || !cl || subLoading) return;
    if (!canAccessPack(cl.packId, isPro)) {
      router.replace({ pathname: '/paywall', params: { returnTo: `/checklist/${cl.id}` } });
    }
  }, [isFocused, cl, isPro, router, subLoading]);

  const toggle = async (itemId: string) => {
    if (!id) return;
    const next = !checked.has(itemId);
    await setChecklistItemChecked(id, itemId, next);
    await reload();
  };

  const onSaveOuting = async () => {
    if (!id || !isPro) {
      router.push({ pathname: '/paywall', params: { returnTo: `/checklist/${id}` } });
      return;
    }
    setOutingBusy(true);
    try {
      const ids = Array.from(checked);
      let latitude: number | null = null;
      let longitude: number | null = null;
      if (includeGps) {
        const pos = await captureLocationForOuting();
        if (pos) {
          latitude = pos.latitude;
          longitude = pos.longitude;
        } else {
          Alert.alert(
            'Location not attached',
            'Permission was denied or location is unavailable. The log was still saved without GPS.'
          );
        }
      }
      await saveChecklistOuting({
        checklistId: id,
        notes: outingNotes.trim(),
        checkedItemIds: ids,
        placeLabel,
        latitude,
        longitude,
        pendingPhotoUris,
      });
      setOutingNotes('');
      setPlaceLabel('');
      setIncludeGps(false);
      setPendingPhotoUris([]);
      Alert.alert('Saved', 'Added to Outing log on the Checklists tab.');
    } finally {
      setOutingBusy(false);
    }
  };

  const onAddPhotos = async () => {
    const more = await pickOutingPhotos(MAX_PHOTOS - pendingPhotoUris.length);
    if (more.length) setPendingPhotoUris((prev) => [...prev, ...more].slice(0, MAX_PHOTOS));
  };

  const removePhotoAt = (index: number) => {
    setPendingPhotoUris((prev) => prev.filter((_, i) => i !== index));
  };

  const onClearChecks = () => {
    if (!id) return;
    Alert.alert(
      'Clear all for this checklist?',
      'Removes every checkmark and deletes all saved outing logs for this list on this device (notes, place, photos, GPS pins). This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: () => {
            clearChecklistAllLocal(id).then(() => {
              setOutingNotes('');
              setPlaceLabel('');
              setIncludeGps(false);
              setPendingPhotoUris([]);
              reload();
            });
          },
        },
      ]
    );
  };

  if (!cl) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text>Checklist not found.</Text>
      </View>
    );
  }

  if (subLoading || !canAccessPack(cl.packId, isPro)) {
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

  const total = cl.items.length;
  const done = cl.items.filter((i) => checked.has(i.id)).length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{cl.title}</Text>
      {cl.description ? (
        <Text style={{ color: palette.textSecondary, marginTop: 8, lineHeight: 21 }}>{cl.description}</Text>
      ) : null}
      <Text style={{ color: palette.tint, marginTop: 12, fontWeight: '600' }}>
        {done} / {total} done
      </Text>

      {cl.items.map((item) => {
        const isOn = checked.has(item.id);
        return (
          <Pressable
            key={item.id}
            onPress={() => toggle(item.id)}
            style={({ pressed }) => [
              styles.itemRow,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
                opacity: pressed ? 0.92 : 1,
              },
            ]}>
            <View
              style={[
                styles.box,
                {
                  borderColor: isOn ? palette.tint : palette.border,
                  backgroundColor: isOn ? palette.tint : 'transparent',
                },
              ]}>
              {isOn ? <Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text> : null}
            </View>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={{ fontSize: 16, color: palette.text, lineHeight: 22 }}>{item.label}</Text>
              {item.hint ? (
                <Text style={{ color: palette.textSecondary, fontSize: 13, marginTop: 6 }}>{item.hint}</Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}

      <View style={[styles.outingCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <View style={styles.outingHeader}>
          <MaterialCommunityIcons name="notebook-outline" size={22} color={palette.tint} />
          <Text style={[styles.outingTitle, { color: palette.text }]}>Outing log</Text>
          {!isPro ? (
            <View style={[styles.proPill, { borderColor: palette.tint }]}>
              <Text style={{ color: palette.tint, fontSize: 11, fontWeight: '800' }}>PRO</Text>
            </View>
          ) : null}
        </View>
        <Text style={{ color: palette.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 6 }}>
          Save a dated snapshot: where you were, optional GPS, photos, and notes. All kept on this device.
        </Text>
        <TextInput
          value={placeLabel}
          onChangeText={setPlaceLabel}
          placeholder="Place (trail, park, neighborhood…)"
          placeholderTextColor={palette.textSecondary}
          editable={!outingBusy}
          style={[
            styles.singleLineInput,
            {
              borderColor: palette.border,
              color: palette.text,
              backgroundColor: palette.background,
            },
          ]}
        />
        <RNView style={styles.gpsRow}>
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <Text style={{ color: palette.text, fontWeight: '600', fontSize: 15 }}>Attach GPS at save</Text>
            <Text style={{ color: palette.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
              One-time location when you tap Save. Not tracked in the background.
            </Text>
          </View>
          <Switch
            value={includeGps}
            onValueChange={setIncludeGps}
            disabled={outingBusy}
            trackColor={{ false: palette.border, true: `${palette.tint}88` }}
            thumbColor={includeGps ? palette.tint : palette.surface}
          />
        </RNView>
        {pendingPhotoUris.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoStrip}>
            {pendingPhotoUris.map((uri, i) => (
              <RNView key={`${uri}-${i}`} style={styles.thumbWrap}>
                <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
                <Pressable
                  onPress={() => removePhotoAt(i)}
                  style={[styles.thumbRemove, { backgroundColor: palette.background }]}>
                  <MaterialCommunityIcons name="close" size={18} color={palette.text} />
                </Pressable>
              </RNView>
            ))}
          </ScrollView>
        ) : null}
        <Pressable
          onPress={onAddPhotos}
          disabled={outingBusy || pendingPhotoUris.length >= MAX_PHOTOS}
          style={({ pressed }) => [
            styles.addPhotoBtn,
            {
              borderColor: palette.tint,
              opacity: pressed || pendingPhotoUris.length >= MAX_PHOTOS ? 0.65 : 1,
            },
          ]}>
          <MaterialCommunityIcons name="image-plus" size={22} color={palette.tint} />
          <Text style={{ color: palette.tint, fontWeight: '700', marginLeft: 8 }}>
            Add photos ({pendingPhotoUris.length}/{MAX_PHOTOS})
          </Text>
        </Pressable>
        <TextInput
          value={outingNotes}
          onChangeText={setOutingNotes}
          placeholder="Notes (optional), conditions, dog, what you want to remember"
          placeholderTextColor={palette.textSecondary}
          multiline
          editable={!outingBusy}
          style={[
            styles.notesInput,
            {
              borderColor: palette.border,
              color: palette.text,
              backgroundColor: palette.background,
            },
          ]}
        />
        <Pressable
          onPress={onSaveOuting}
          disabled={outingBusy}
          style={({ pressed }) => [
            styles.saveOutingBtn,
            { backgroundColor: palette.tint, opacity: pressed || outingBusy ? 0.88 : 1 },
          ]}>
          {outingBusy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveOutingBtnText}>{isPro ? 'Save to log' : 'Unlock saving · Pro'}</Text>
          )}
        </Pressable>
      </View>

      <Pressable onPress={onClearChecks} style={styles.clearLink}>
        <Text style={{ color: palette.textSecondary, fontSize: 14, textDecorationLine: 'underline' }}>
          Clear all · checks & outing logs
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  box: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  outingCard: {
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  outingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  outingTitle: { fontSize: 18, fontWeight: '800', flex: 1 },
  proPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  singleLineInput: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  photoStrip: { marginTop: 14, maxHeight: 96 },
  thumbWrap: { marginRight: 10, position: 'relative' },
  thumb: { width: 88, height: 88, borderRadius: 12 },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    borderStyle: 'dashed',
  },
  notesInput: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 88,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  saveOutingBtn: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveOutingBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  clearLink: { marginTop: 18, alignSelf: 'center', paddingVertical: 8 },
});
