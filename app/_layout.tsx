import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { AppState, AppStateStatus, Text, TextInput } from 'react-native';
import * as Linking from 'expo-linking';
import { getHasTrackedActivity, resetTrackedActivity, setUserProperties } from '@/lib/analytics';
import { getDogProfile, saveDogProfile } from '@/lib/profile';
import { localCalendarDateString } from '@/lib/readiness/persistence';
import { registerBackgroundFetchAsync } from '@/lib/weather/backgroundFetch';

// Disable Dynamic Type font scaling globally to preserve precise UI layouts on small/zoomed screens
try {
  (Text as any).defaultProps = (Text as any).defaultProps || {};
  (Text as any).defaultProps.allowFontScaling = false;
  (TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
  (TextInput as any).defaultProps.allowFontScaling = false;
} catch (e) {
  console.warn('[NorthPaw] Failed to disable allowFontScaling globally', e);
}

import { MedReminderNotifications } from '@/components/MedReminderNotifications';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { getDb } from '@/lib/database';
import { trackEvent } from '@/lib/analytics';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();
const MIN_SPLASH_MS = 2000;

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    getDb()
      .then(() => setDbReady(true))
      .catch((e) => {
        console.error('[NorthPaw] Database init failed', e);
        setDbReady(true);
      });
  }, []);

  useEffect(() => {
    if (!loaded || !dbReady) return;

    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, MIN_SPLASH_MS);

    return () => clearTimeout(timer);
  }, [loaded, dbReady]);

  if (!loaded || !dbReady) {
    return null;
  }

  return <RootLayoutNav />;
}

const NavThemeLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const NavThemeDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    trackEvent('app_opened');

    // Register background fetch for weather updates
    registerBackgroundFetchAsync();

    // Track unique readiness days login metric
    (async () => {
      try {
        const profile = await getDogProfile();
        const todayStr = localCalendarDateString();
        if (todayStr !== profile.lastReadinessDay) {
          const nextCount = profile.uniqueReadinessDays + 1;
          await saveDogProfile({
            ...profile,
            uniqueReadinessDays: nextCount,
            lastReadinessDay: todayStr,
          });
          // Update Mixpanel User Properties
          await setUserProperties({ unique_readiness_days: nextCount });
        }
      } catch (err) {
        console.warn('[NorthPaw] Failed to update unique readiness days', err);
      }
    })();

    // 1. UTM Deep Link Parsing
    const handleDeepLink = (event: { url: string }) => {
      try {
        const parsed = Linking.parse(event.url);
        if (parsed.queryParams) {
          const { utm_source, utm_medium, utm_campaign } = parsed.queryParams;
          if (utm_source) {
            setUserProperties({
              acquisition_source: utm_source,
              acquisition_medium: utm_medium || 'direct',
              acquisition_campaign: utm_campaign || 'none',
            });
          }
        }
      } catch (e) {
        console.warn('[Analytics] Deep link parsing failed', e);
      }
    };

    Linking.getInitialURL()
      .then((url) => {
        if (url) handleDeepLink({ url });
      })
      .catch(() => {});

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // 2. Active-Duration Bounce (Zero Value Session) Tracker
    let activeTimer: ReturnType<typeof setTimeout> | null = null;
    let timeSpentActive = 0;
    let activeStart = Date.now();
    let hasTrackedZeroValueSessionThisSession = false;

    const checkBounce = () => {
      if (AppState.currentState === 'active') {
        timeSpentActive += Date.now() - activeStart;
      }
      if (timeSpentActive >= 15000 && !getHasTrackedActivity() && !hasTrackedZeroValueSessionThisSession) {
        hasTrackedZeroValueSessionThisSession = true;
        trackEvent('zero_value_session');
      }
    };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        activeStart = Date.now();
        hasTrackedZeroValueSessionThisSession = false; // Reset lock on new active session
        resetTrackedActivity(); // Reset activity on new active session
        const remaining = Math.max(0, 15000 - timeSpentActive);
        activeTimer = setTimeout(checkBounce, remaining);
      } else {
        if (activeTimer) clearTimeout(activeTimer);
        timeSpentActive += Date.now() - activeStart;
      }
    };

    if (AppState.currentState === 'active') {
      activeTimer = setTimeout(checkBounce, 15000);
    }

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      appStateSub.remove();
      if (activeTimer) clearTimeout(activeTimer);
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? NavThemeDark : NavThemeLight}>
      <SubscriptionProvider>
        <MedReminderNotifications />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="card/[id]"
            options={{ title: 'Field card', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="checklist/[id]"
            options={{ title: 'Checklist', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="outing/[id]"
            options={{ title: 'Outing log', headerBackTitle: 'Back' }}
          />
          <Stack.Screen name="pack/[id]" options={{ title: 'Pack', headerBackTitle: 'Back' }} />
          <Stack.Screen
            name="paywall"
            options={{
              title: 'NorthPaw Pro',
              presentation: 'modal',
              headerBackTitle: 'Close',
              headerLargeTitleEnabled: false,
            }}
          />
          <Stack.Screen
            name="post-walk"
            options={{
              title: 'Post-Walk Check-In',
              presentation: 'modal',
              headerBackTitle: 'Close',
            }}
          />
          <Stack.Screen
            name="tick-check"
            options={{
              title: 'Tick Check',
              presentation: 'modal',
              headerBackTitle: 'Close',
              headerLargeTitleEnabled: false,
            }}
          />
          <Stack.Screen
            name="dog-profile"
            options={{ title: 'Your dog', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="reminders"
            options={{ title: 'Care reminders', headerBackTitle: 'Back' }}
          />
        </Stack>
      </SubscriptionProvider>
    </ThemeProvider>
  );
}
