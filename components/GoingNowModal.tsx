import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Notifications from 'expo-notifications';
import { startOuting, ActiveOuting, AssessmentSnapshot } from '@/lib/outings';
import { trackEvent } from '@/lib/analytics';

type Props = {
  visible: boolean;
  dogName?: string;
  snapshot: AssessmentSnapshot;
  onClose: () => void;
  onOutingStarted: (outing: ActiveOuting) => void;
};

export default function GoingNowModal({ visible, dogName = 'your dog', snapshot, onClose, onOutingStarted }: Props) {
  const [selectedDuration, setSelectedDuration] = useState<number>(25);

  const handleStart = async (duration: number) => {
    let notificationId: string | null = null;

    try {
      // Schedule local notification timer on device
      const notifResponse = await Notifications.scheduleNotificationAsync({
        content: {
          title: `How did ${dogName} handle the walk?`,
          body: `Tap to record a 1-tap private check-in for ${dogName}.`,
          sound: true,
          data: { type: 'post_walk_checkin' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: (duration + 5) * 60,
        },
      });
      notificationId = notifResponse;
    } catch (e) {
      console.log('Local notification scheduling unavailable:', e);
    }

    const outing = await startOuting({
      dogId: 'dog_primary',
      expectedDurationMinutes: duration,
      source: 'home',
      snapshot,
      notificationId,
    });

    trackEvent('outing_intent_started', { durationMinutes: duration });
    onOutingStarted(outing);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="paw" size={22} color="#D4AF37" />
              <Text style={styles.title}>Going Now — {dogName}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color="#9AAFA3" />
            </Pressable>
          </View>

          <Text style={styles.subText}>
            Select planned walk duration. NorthPaw will schedule a local check-in prompt when you return.
          </Text>

          <View style={styles.durationOptions}>
            <Pressable
              style={[styles.durationBtn, selectedDuration === 10 && styles.durationBtnSelected]}
              onPress={() => setSelectedDuration(10)}>
              <MaterialCommunityIcons name="timer-sand" size={20} color={selectedDuration === 10 ? '#0A1A12' : '#4E9F6E'} />
              <View>
                <Text style={[styles.durationTitle, selectedDuration === 10 && styles.durationTextSelected]}>Quick Outing</Text>
                <Text style={[styles.durationSub, selectedDuration === 10 && styles.durationTextSelected]}>~10 Minutes</Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.durationBtn, selectedDuration === 25 && styles.durationBtnSelected]}
              onPress={() => setSelectedDuration(25)}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={selectedDuration === 25 ? '#0A1A12' : '#D4AF37'} />
              <View>
                <Text style={[styles.durationTitle, selectedDuration === 25 && styles.durationTextSelected]}>Normal Walk</Text>
                <Text style={[styles.durationSub, selectedDuration === 25 && styles.durationTextSelected]}>~25 Minutes</Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.durationBtn, selectedDuration === 45 && styles.durationBtnSelected]}
              onPress={() => setSelectedDuration(45)}>
              <MaterialCommunityIcons name="hiking" size={20} color={selectedDuration === 45 ? '#0A1A12' : '#E67E22'} />
              <View>
                <Text style={[styles.durationTitle, selectedDuration === 45 && styles.durationTextSelected]}>Long Outing</Text>
                <Text style={[styles.durationSub, selectedDuration === 45 && styles.durationTextSelected]}>~45 Minutes</Text>
              </View>
            </Pressable>
          </View>

          <Pressable style={styles.startBtn} onPress={() => handleStart(selectedDuration)}>
            <Text style={styles.startBtnText}>Start Outing (~{selectedDuration}m)</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#0D1F17',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  subText: {
    color: '#B0C2B6',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  durationOptions: {
    gap: 10,
    marginBottom: 20,
  },
  durationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  durationBtnSelected: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  durationTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  durationSub: {
    color: '#B0C2B6',
    fontSize: 12,
  },
  durationTextSelected: {
    color: '#0A1A12',
  },
  startBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#0A1A12',
    fontWeight: '800',
    fontSize: 16,
  },
});
