import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import Colors from '@/constants/Colors';
import { getDogProfile } from '@/lib/profile';
import { useColorScheme } from '@/components/useColorScheme';

export default function Index() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const [ready, setReady] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    let gone = false;
    getDogProfile()
      .then((p) => {
        if (!gone) {
          setOnboardingDone(p.onboardingDone);
          setReady(true);
        }
      })
      .catch(() => {
        if (!gone) setReady(true);
      });
    return () => {
      gone = true;
    };
  }, []);

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} size="large" />
      </View>
    );
  }

  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
