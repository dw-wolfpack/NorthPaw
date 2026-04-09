/**
 * Parse QR / deep link payloads into an Expo Router path.
 * Supports northpaw://… (primary) and trailready://… (legacy QR codes)
 * for card, checklist, pack, and outing paths; also dev client URLs containing /--/card/id
 */
export function trailPathFromQrData(data: string): string | null {
  const trimmed = data.trim();
  if (!trimmed) return null;

  const custom = /^(?:northpaw|trailready):\/\/\/?([\s\S]+)$/i.exec(trimmed);
  if (custom) {
    const pathOnly = custom[1].split('?')[0].replace(/\/+$/, '');
    if (
      pathOnly.startsWith('card/') ||
      pathOnly.startsWith('checklist/') ||
      pathOnly.startsWith('pack/') ||
      pathOnly.startsWith('outing/')
    ) {
      return `/${pathOnly}`;
    }
  }

  const expDev =
    /--\/(card\/[\w-]+|checklist\/[\w-]+|pack\/[\w-]+|outing\/[\w-]+)/.exec(trimmed);
  if (expDev) {
    return `/${expDev[1]}`;
  }

  return null;
}

export function isKnownContentPath(path: string): boolean {
  return /^\/(card|checklist|pack|outing)\/[\w-]+\/?$/.test(path);
}
