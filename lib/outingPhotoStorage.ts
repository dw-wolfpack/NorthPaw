import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/** Copy picked images into app-owned storage (native). Web: inlines as data URLs with size cap. */
export async function finalizeOutingPhotos(outingId: string, uris: string[]): Promise<string[]> {
  const capped = uris.slice(0, 3);
  if (Platform.OS === 'web') {
    const out: string[] = [];
    for (const u of capped) {
      const s = await webUriToDataUrl(u);
      if (s) out.push(s);
    }
    return out;
  }

  const outingDir = new Directory(Paths.document, 'outings', outingId);
  outingDir.create({ intermediates: true, idempotent: true });

  const stored: string[] = [];
  for (let i = 0; i < capped.length; i++) {
    const src = new File(capped[i]);
    const dest = new File(outingDir, `photo_${i}.jpg`);
    src.copy(dest);
    stored.push(dest.uri);
  }
  return stored;
}

async function webUriToDataUrl(uri: string): Promise<string | null> {
  if (uri.startsWith('data:')) {
    return uri.length <= MAX_WEB_DATA_URL ? uri : null;
  }
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    const dataUrl = await blobToDataUrl(blob);
    if (!dataUrl || dataUrl.length > MAX_WEB_DATA_URL) return null;
    return dataUrl;
  } catch {
    return null;
  }
}

const MAX_WEB_DATA_URL = 1_800_000;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(typeof r.result === 'string' ? r.result : '');
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(blob);
  });
}

/** Remove on-disk folder for one outing (native only). */
export async function removeOutingFiles(outingId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const outingDir = new Directory(Paths.document, 'outings', outingId);
  if (outingDir.exists) {
    outingDir.delete();
  }
}
