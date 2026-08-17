import { requireNativeModule } from 'expo';

let WidgetBridge: any = null;
try {
  WidgetBridge = requireNativeModule('WidgetBridge');
} catch (e: any) {
  console.warn('[WidgetBridge] Native module not found, widget reloads will fallback:', e?.message || e);
}

export function reloadAllTimelines() {
  try {
    if (WidgetBridge && WidgetBridge.reloadAllTimelines) {
      WidgetBridge.reloadAllTimelines();
    }
  } catch (e) {
    console.warn('[WidgetBridge] Failed to reload timelines:', e);
  }
}
