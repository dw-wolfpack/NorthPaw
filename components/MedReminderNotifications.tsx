import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { syncAllMedReminderNotifications } from '@/lib/medReminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function MedReminderNotifications() {
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;

    const run = () => {
      syncAllMedReminderNotifications().catch((e) => console.warn('[med reminders]', e));
    };

    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, []);

  return null;
}
