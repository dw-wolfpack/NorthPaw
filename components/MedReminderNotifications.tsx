import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
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
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;

    const run = () => {
      syncAllMedReminderNotifications().catch((e) => console.warn('[med reminders]', e));
    };

    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });

    const routeSub = Notifications.addNotificationResponseReceivedListener(response => {
      const url = response.notification.request.content.data?.url;
      if (url && typeof url === 'string') {
        router.push(url as any);
      }
    });

    return () => {
      sub.remove();
      routeSub.remove();
    };
  }, [router]);

  return null;
}
