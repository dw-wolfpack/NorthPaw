/** Parse stored JSON array of photo URIs (file://, data URLs, etc.). */
export function parseOutingPhotoUris(photosJson: string | undefined): string[] {
  if (!photosJson) return [];
  try {
    const a = JSON.parse(photosJson) as unknown;
    if (!Array.isArray(a)) return [];
    return a.filter((x): x is string => typeof x === 'string' && x.length > 0);
  } catch {
    return [];
  }
}
