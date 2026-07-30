import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MIXPANEL_TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || '';

let cachedUuid: string | null = null;
let cachedInstallTime: number | null = null;

async function getDistinctId(): Promise<string> {
  if (cachedUuid) return cachedUuid;
  if (Platform.OS === 'web') {
    cachedUuid = 'web-user';
    return cachedUuid;
  }
  try {
    const file = new File(Paths.document, 'client_uuid.txt');
    if (file.exists) {
      cachedUuid = await file.text();
    } else {
      cachedUuid = 'np-' + Math.random().toString(36).slice(2, 11) + '-' + Date.now().toString(36);
      file.write(cachedUuid);
    }
  } catch {
    cachedUuid = 'np-fallback-' + Math.random().toString(36).slice(2, 11);
  }
  return cachedUuid;
}

async function getInstallTime(): Promise<number> {
  if (cachedInstallTime) return cachedInstallTime;
  if (Platform.OS === 'web') {
    cachedInstallTime = Date.now();
    return cachedInstallTime;
  }
  try {
    const file = new File(Paths.document, 'client_install_time.txt');
    if (file.exists) {
      const txt = await file.text();
      cachedInstallTime = parseInt(txt, 10) || Date.now();
    } else {
      cachedInstallTime = Date.now();
      file.write(cachedInstallTime.toString());
    }
  } catch {
    cachedInstallTime = Date.now();
  }
  return cachedInstallTime;
}

let hasTrackedActivity = false;

const MEANINGFUL_EVENTS = new Set([
  'onboarding_started',
  'onboarding_completed',
  'dog_created',
  'readiness_viewed',
  'hand_test_started',
  'hand_test_completed',
  'surface_changed',
  'feedback_submitted',
  'share_button_pressed',
  'share_button_tapped',
  'share_sheet_opened',
  'share_completed',
  'support_contact_pressed',
]);

export function getHasTrackedActivity() {
  return hasTrackedActivity;
}

export function resetTrackedActivity() {
  hasTrackedActivity = false;
}

const MUTE_TESTFLIGHT_ANALYTICS_KEY = '@northpaw_mute_testflight_analytics';

export function isTestflightOrDevBuild(): boolean {
  if (__DEV__) return true;
  if (Constants.executionEnvironment === 'storeClient') return true;
  if (process.env.EXPO_PUBLIC_ENV === 'production' && process.env.EXPO_PUBLIC_IS_TESTFLIGHT !== 'true') {
    return false;
  }
  return true;
}

export function getAnalyticsEnvironment(): 'production' | 'testflight' | 'expo_go' | 'development' {
  if (__DEV__) return 'development';
  if (Constants.executionEnvironment === 'storeClient') return 'expo_go';
  if (
    process.env.EXPO_PUBLIC_ENV === 'testflight' ||
    process.env.EXPO_PUBLIC_IS_TESTFLIGHT === 'true' ||
    Constants.expoConfig?.extra?.isTestFlight === true
  ) {
    return 'testflight';
  }
  if (process.env.EXPO_PUBLIC_ENV === 'production') return 'production';
  return 'testflight';
}

/** In non-prod (local/TestFlight), default Mixpanel sending is OFF (false). */
export async function isAnalyticsEnabledInNonProd(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(MUTE_TESTFLIGHT_ANALYTICS_KEY);
    if (val !== null) return val === 'true';
  } catch (_) {}
  // Default to OFF in local/TestFlight builds to prevent polluting production data
  return false;
}

export async function setAnalyticsEnabledInNonProd(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(MUTE_TESTFLIGHT_ANALYTICS_KEY, String(enabled));
  } catch (_) {}
}

export async function trackEvent(eventName: string, properties: Record<string, any> = {}) {
  if (MEANINGFUL_EVENTS.has(eventName)) {
    hasTrackedActivity = true;
  }

  const env = getAnalyticsEnvironment();

  // In non-prod (TestFlight/Dev), default to OFF unless explicitly enabled in Settings
  if (env !== 'production') {
    const isEnabled = await isAnalyticsEnabledInNonProd();
    if (!isEnabled) {
      console.log(`[Analytics] (Muted Non-Prod) Event: "${eventName}" [env: ${env}]`, properties);
      return;
    }
  }

  if (!MIXPANEL_TOKEN) {
    return;
  }

  try {
    const distinctId = await getDistinctId();
    const installTime = await getInstallTime();
    const daysSinceInstall = Math.floor((Date.now() - installTime) / (1000 * 60 * 60 * 24));
    const osName = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web';
    const appVersion = Constants.expoConfig?.version || '1.0.0';

    await fetch('https://api.mixpanel.com/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
      },
      body: JSON.stringify([
        {
          event: eventName,
          properties: {
            token: MIXPANEL_TOKEN,
            distinct_id: distinctId,
            $os: osName,
            $os_version: String(Platform.Version),
            $app_version_string: appVersion,
            platform: Platform.OS,
            days_since_install: daysSinceInstall,
            environment: env,
            is_testflight: env === 'testflight',
            build_type: env,
            ...properties,
          },
        },
      ]),
    });
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
}

export async function setUserProperties(properties: Record<string, any>) {
  const env = getAnalyticsEnvironment();
  if (env !== 'production') {
    const isEnabled = await isAnalyticsEnabledInNonProd();
    if (!isEnabled) {
      console.log(`[Analytics] (Muted Non-Prod) Set User Properties:`, properties);
      return;
    }
  }

  if (!MIXPANEL_TOKEN) {
    return;
  }

  try {
    const distinctId = await getDistinctId();
    await fetch('https://api.mixpanel.com/engage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
      },
      body: JSON.stringify([
        {
          $token: MIXPANEL_TOKEN,
          $distinct_id: distinctId,
          $set: properties,
        },
      ]),
    });
  } catch (error) {
    console.error('[Analytics] Failed to set user properties:', error);
  }
}

export async function incrementUserProperties(properties: Record<string, number>) {
  const env = getAnalyticsEnvironment();
  if (env !== 'production') {
    const isEnabled = await isAnalyticsEnabledInNonProd();
    if (!isEnabled) {
      console.log(`[Analytics] (Muted Non-Prod) Increment User Properties:`, properties);
      return;
    }
  }

  if (!MIXPANEL_TOKEN) {
    return;
  }

  try {
    const distinctId = await getDistinctId();
    await fetch('https://api.mixpanel.com/engage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
      },
      body: JSON.stringify([
        {
          $token: MIXPANEL_TOKEN,
          $distinct_id: distinctId,
          $add: properties,
        },
      ]),
    });
  } catch (error) {
    console.error('[Analytics] Failed to increment user properties:', error);
  }
}
