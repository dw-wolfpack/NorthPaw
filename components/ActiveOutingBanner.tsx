import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Notifications from 'expo-notifications';
import { ActiveOuting, cancelActiveOuting } from '@/lib/outings';
import { trackEvent } from '@/lib/analytics';

type Props = {
  outing: ActiveOuting;
  dogName?: string;
  onFinishTapped: () => void;
  onCancelled: () => void;
};

export default function ActiveOutingBanner({ outing, dogName = 'your dog', onFinishTapped, onCancelled }: Props) {
  const startTimeStr = new Date(outing.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const expectedReturnTime = new Date(outing.startedAt + outing.expectedDurationMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleStillWalking = async () => {
    try {
      if (outing.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(outing.notificationId);
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `How did ${dogName} handle the walk?`,
          body: `Tap to record a 1-tap private check-in for ${dogName}.`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 10 * 60,
        },
      });
    } catch (e) {
      console.log('Error rescheduling notification:', e);
    }
    trackEvent('post_outing_prompt_rescheduled');
  };

  const handleCancel = async () => {
    if (outing.notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(outing.notificationId);
      } catch (e) {}
    }
    await cancelActiveOuting();
    trackEvent('outing_intent_cancelled');
    onCancelled();
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="paw" size={18} color="#D4AF37" />
          <Text style={styles.titleText}>Active Outing in Progress</Text>
        </View>
        <Text style={styles.timeSub}>Started {startTimeStr} (Expected ~{expectedReturnTime})</Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.finishBtn} onPress={onFinishTapped}>
          <Text style={styles.finishBtnText}>Finish Outing</Text>
        </Pressable>

        <Pressable style={styles.extendBtn} onPress={handleStillWalking}>
          <Text style={styles.extendBtnText}>+10m</Text>
        </Pressable>

        <Pressable style={styles.cancelBtn} onPress={handleCancel}>
          <MaterialCommunityIcons name="close-circle-outline" size={20} color="#8A9E92" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0D1F17',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  topRow: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  titleText: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 15,
  },
  timeSub: {
    color: '#B0C2B6',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  finishBtn: {
    flex: 1,
    backgroundColor: '#D4AF37',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  finishBtnText: {
    color: '#0A1A12',
    fontWeight: '800',
    fontSize: 14,
  },
  extendBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  extendBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
  cancelBtn: {
    padding: 6,
  },
});
