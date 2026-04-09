import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const MAX_OUTING_PHOTOS = 3;

export async function pickOutingPhotos(remainingSlots: number): Promise<string[]> {
  const n = Math.min(MAX_OUTING_PHOTOS, Math.max(0, remainingSlots));
  if (n <= 0) return [];
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: n,
    quality: 0.75,
  });
  if (res.canceled || !res.assets?.length) return [];
  return res.assets.map((a) => a.uri).slice(0, n);
}

/** Single foreground fix; returns null if denied or unavailable. */
export async function captureLocationForOuting(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}
