import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';

const MIXPANEL_TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || '';

let cachedUuid: string | null = null;

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

export async function trackEvent(eventName: string, properties: Record<string, any> = {}) {
  if (!MIXPANEL_TOKEN) {
    if (__DEV__) {
      console.log(`[Analytics] (Dry Run) Event: "${eventName}"`, properties);
    }
    return;
  }

  try {
    const distinctId = await getDistinctId();
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
            platform: Platform.OS,
            ...properties,
          },
        },
      ]),
    });
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
}
