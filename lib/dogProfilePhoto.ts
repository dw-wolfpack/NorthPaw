import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const MAX_WEB_DATA_URL = 1_200_000;

/** Persist picked avatar into app documents (native) or capped data URL (web). */
export async function finalizeDogAvatar(sourceUri: string): Promise<string> {
  if (!sourceUri.trim()) return '';

  if (Platform.OS === 'web') {
    if (sourceUri.startsWith('data:')) {
      return sourceUri.length <= MAX_WEB_DATA_URL ? sourceUri : '';
    }
    try {
      const res = await fetch(sourceUri);
      const blob = await res.blob();
      const dataUrl = await blobToDataUrl(blob);
      if (!dataUrl || dataUrl.length > MAX_WEB_DATA_URL) return '';
      return dataUrl;
    } catch {
      return '';
    }
  }

  const dogDir = new Directory(Paths.document, 'dog');
  dogDir.create({ intermediates: true, idempotent: true });

  for (const entry of dogDir.list()) {
    if (entry instanceof File && entry.exists) {
      try {
        entry.delete();
      } catch {
        /* another pass may still write a fresh avatar_* file */
      }
    }
  }

  const dest = new File(dogDir, `avatar_${Date.now()}.jpg`);
  const src = new File(sourceUri);
  src.copy(dest);
  return dest.uri;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(typeof r.result === 'string' ? r.result : '');
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(blob);
  });
}
