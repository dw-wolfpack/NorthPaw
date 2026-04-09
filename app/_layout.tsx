import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { MedReminderNotifications } from '@/components/MedReminderNotifications';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { getDb } from '@/lib/database';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

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
    if (loaded && dbReady) {
      SplashScreen.hideAsync();
    }
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
