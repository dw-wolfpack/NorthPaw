import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { finishOuting, cancelActiveOuting, OutingOutcomeResponse } from '@/lib/outings';
import { recordQualifiedReadinessDay } from '@/lib/outings';
import { trackEvent } from '@/lib/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { reloadAllTimelines } from '../modules/widget-bridge';

const SYMPTOM_OPTIONS = [
  { id: 'heavy_panting', label: 'Heavy Panting', icon: 'weather-hazy' },
  { id: 'sought_shade', label: 'Sought Shade', icon: 'tree' },
  { id: 'lifted_paws', label: 'Lifted Paws / Heat Sensitive', icon: 'paw' },
  { id: 'stopped_early', label: 'Stopped Early', icon: 'stop-circle-outline' },
  { id: 'drank_excessive_water', label: 'Excessive Thirst', icon: 'water' },
] as const;

export default function PostWalkCheckInScreen() {
  const router = useRouter();
  const { outingId } = useLocalSearchParams<{ outingId?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [dogName, setDogName] = useState('your dog');
  const [selectedResponse, setSelectedResponse] = useState<OutingOutcomeResponse | null>(null);
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    trackEvent('screen_viewed', { screenName: 'Post-Walk Check-In', outingId });
    AsyncStorage.getItem('@northpaw_dog_name').then((val) => {
      if (val) setDogName(val);
    }).catch(() => {});
  }, [outingId]);

  const toggleSignal = (signalId: string) => {
    setSelectedSignals((prev) =>
      prev.includes(signalId) ? prev.filter((s) => s !== signalId) : [...prev, signalId]
    );
  };

  const handleSave = useCallback(async () => {
    if (!selectedResponse) {
      Alert.alert('Selection Required', 'Please select how your dog handled the walk.');
      return;
    }

    setSubmitting(true);
    try {
      const targetId = outingId || `manual_${Date.now()}`;
      await finishOuting(targetId, selectedResponse, selectedSignals);
      await SharedGroupPreferences.setItem('isOutingActive', 'false', 'group.com.northpaw.app').catch(() => {});
      reloadAllTimelines();
      
      // Phase D2: Record qualified readiness day for today
      const todayIso = new Date().toISOString().split('T')[0];
      await recordQualifiedReadinessDay(todayIso);

      await trackEvent('post_walk_checkin_submitted', {
        outingId: targetId,
        response: selectedResponse,
        signalsCount: selectedSignals.length,
      });

      Alert.alert(
        'Check-In Saved',
        `Thank you! ${dogName}'s response was recorded 100% privately on your device.`,
        [
          {
            text: 'Done',
            onPress: () => {
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)');
            },
          },
        ]
      );
    } catch (e) {
      console.error('Failed to save post-walk check-in:', e);
      Alert.alert('Error', 'Failed to save check-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedResponse, selectedSignals, outingId, dogName, router]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerBlock}>
            <Text style={[styles.title, { color: palette.text }]}>Post-Walk Check-In</Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              How did {dogName} handle today's walk conditions?
            </Text>
          </View>
          <Pressable
            onPress={async () => {
              await cancelActiveOuting();
              await SharedGroupPreferences.setItem('isOutingActive', 'false', 'group.com.northpaw.app').catch(() => {});
              reloadAllTimelines();
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)');
            }}
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.7 : 1 }
            ]}
            accessibilityRole="button"
            accessibilityLabel="Close and skip check-in"
          >
            <MaterialCommunityIcons name="close" size={20} color={palette.textSecondary} />
          </Pressable>
        </View>

        {/* Primary Response Grid */}
        <View style={styles.responseGrid}>
          <Pressable
            style={({ pressed }) => [
              styles.responseCard,
              {
                borderColor: selectedResponse === 'as_usual' ? '#2ECC71' : palette.border,
                backgroundColor: selectedResponse === 'as_usual' ? (isDark ? 'rgba(46, 204, 113, 0.15)' : 'rgba(46, 204, 113, 0.08)') : palette.surface,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => {
              setSelectedResponse('as_usual');
              setSelectedSignals([]);
            }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🙂</Text>
            <Text style={[styles.responseCardTitle, { color: palette.text }]}>As Usual</Text>
            <Text style={[styles.responseCardSub, { color: palette.textSecondary }]}>Great energy, normal pace</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.responseCard,
              {
                borderColor: selectedResponse === 'slowed' ? '#D97706' : palette.border,
                backgroundColor: selectedResponse === 'slowed' ? (isDark ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.08)') : palette.surface,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => setSelectedResponse('slowed')}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>😐</Text>
            <Text style={[styles.responseCardTitle, { color: palette.text }]}>Slowed Down</Text>
            <Text style={[styles.responseCardSub, { color: palette.textSecondary }]}>Slightly lower energy</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.responseCard,
              {
                borderColor: selectedResponse === 'struggled' ? '#C0392B' : palette.border,
                backgroundColor: selectedResponse === 'struggled' ? (isDark ? 'rgba(192, 57, 43, 0.15)' : 'rgba(192, 57, 43, 0.08)') : palette.surface,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => setSelectedResponse('struggled')}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>☹</Text>
            <Text style={[styles.responseCardTitle, { color: palette.text }]}>Struggled</Text>
            <Text style={[styles.responseCardSub, { color: palette.textSecondary }]}>Heavily fatigued / heat signs</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.responseCard,
              {
                borderColor: selectedResponse === 'did_not_go' ? palette.textSecondary : palette.border,
                backgroundColor: selectedResponse === 'did_not_go' ? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)') : palette.surface,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => {
              setSelectedResponse('did_not_go');
              setSelectedSignals([]);
            }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🏠</Text>
            <Text style={[styles.responseCardTitle, { color: palette.text }]}>Didn't Go</Text>
            <Text style={[styles.responseCardSub, { color: palette.textSecondary }]}>Walk was skipped</Text>
          </Pressable>
        </View>

        {/* Optional Symptom Chips */}
        {selectedResponse && selectedResponse !== 'did_not_go' && (
          <View style={[styles.symptomsSection, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <Text style={[styles.symptomsTitle, { color: palette.text }]}>What did you observe? (Optional)</Text>
            <View style={styles.chipsWrap}>
              {SYMPTOM_OPTIONS.map((item) => {
                const active = selectedSignals.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? palette.tint : palette.border,
                        backgroundColor: active ? (isDark ? 'rgba(46, 204, 113, 0.2)' : 'rgba(46, 204, 113, 0.12)') : 'transparent',
                      },
                    ]}
                    onPress={() => toggleSignal(item.id)}>
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={16}
                      color={active ? palette.tint : palette.textSecondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.chipText, { color: active ? palette.text : palette.textSecondary }]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Submit Button */}
        <Pressable
          disabled={!selectedResponse || submitting}
          style={({ pressed }) => [
            styles.submitBtn,
            {
              backgroundColor: selectedResponse ? palette.tint : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
              opacity: pressed || submitting || !selectedResponse ? 0.7 : 1,
            },
          ]}
          onPress={handleSave}>
          <Text style={[styles.submitBtnText, { color: selectedResponse ? '#0A1A12' : palette.textSecondary }]}>
            {submitting ? 'Saving Check-In...' : 'Save Check-In'}
          </Text>
        </Pressable>

        <Text style={[styles.privacyNote, { color: palette.textSecondary }]}>
          🔒 All check-in observations remain 100% private and stored locally on your device.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerBlock: { flex: 1, marginRight: 12 },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  responseGrid: { gap: 12, marginBottom: 20 },
  responseCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  responseCardTitle: { fontSize: 16, fontWeight: '800', marginTop: 8 },
  responseCardSub: { fontSize: 12, marginTop: 2 },
  symptomsSection: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  symptomsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  submitBtnText: { fontSize: 16, fontWeight: '800' },
  privacyNote: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
