import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

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

export async function trackEvent(eventName: string, properties: Record<string, any> = {}) {
  if (__DEV__ || !Device.isDevice) {
    console.log(`[Analytics] (Dry Run) Event: "${eventName}"`, properties);
    return;
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
  if (__DEV__ || !Device.isDevice) {
    console.log(`[Analytics] (Dry Run) Set User Properties:`, properties);
    return;
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
