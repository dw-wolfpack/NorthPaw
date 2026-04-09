import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

/** Open http(s) in in-app browser; mailto/tel via Linking. Returns false if url empty. */
export async function openExternalLink(url: string): Promise<boolean> {
  const u = url.trim();
  if (!u) return false;
  if (/^mailto:/i.test(u) || /^tel:/i.test(u)) {
    const can = await Linking.canOpenURL(u);
    if (can) await Linking.openURL(u);
    return can;
  }
  await WebBrowser.openBrowserAsync(u);
  return true;
}
