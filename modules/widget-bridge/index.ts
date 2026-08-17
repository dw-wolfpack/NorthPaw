import { requireNativeModule } from 'expo';

const WidgetBridge = requireNativeModule('WidgetBridge');

export function reloadAllTimelines() {
  try {
    WidgetBridge.reloadAllTimelines();
  } catch (e) {
    console.warn('[WidgetBridge] Failed to reload timelines:', e);
  }
}
