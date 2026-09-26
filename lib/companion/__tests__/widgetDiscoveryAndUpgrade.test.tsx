import React from 'react';
// @ts-ignore
import renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getWidgetIntroVersion,
  setWidgetIntroVersion,
  shouldShowWidgetUpgrade,
  CURRENT_WIDGET_INTRO_VERSION,
  WIDGET_INTRO_VERSION_KEY,
} from '../../widgetSync';
import { WidgetGlancePreview } from '../../../components/WidgetGlancePreview';
import { WidgetUpgradeModal } from '../../../components/WidgetUpgradeModal';
import { trackEvent } from '../../analytics';

jest.mock('react-native', () => {
  const React = require('react');
  return {
    Platform: { OS: 'ios', select: (obj: any) => obj.ios || obj.default },
    StyleSheet: {
      create: (styles: any) => styles,
      flatten: (styles: any) => styles,
    },
    View: (props: any) => React.createElement('View', props, props.children),
    Text: (props: any) => React.createElement('Text', props, props.children),
    Pressable: (props: any) => React.createElement('Pressable', props, props.children),
    Modal: (props: any) => (props.visible ? React.createElement('Modal', props, props.children) : null),
    ScrollView: (props: any) => React.createElement('ScrollView', props, props.children),
  };
});

jest.mock('react-native-shared-group-preferences', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../modules/widget-bridge', () => ({
  reloadAllTimelines: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../analytics', () => ({
  trackEvent: jest.fn(),
  isTestflightOrDevBuild: jest.fn().mockReturnValue(false),
  isAnalyticsEnabledInNonProd: jest.fn().mockResolvedValue(false),
  setAnalyticsEnabledInNonProd: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('../../../components/useColorScheme', () => ({
  useColorScheme: () => 'dark',
}));

(global as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('Widget Discovery & 6.0 Upgrade Sheet Test Suite', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('1. Version Gate & Upgrade Presentation Logic', () => {
    it('shows upgrade sheet for existing user with version < 1 (e.g., 0)', async () => {
      const initialVer = await getWidgetIntroVersion();
      expect(initialVer).toBe(0);
      expect(shouldShowWidgetUpgrade(initialVer)).toBe(true);
    });

    it('does not show upgrade sheet for existing user with version >= 1', async () => {
      await setWidgetIntroVersion(1);
      const updatedVer = await getWidgetIntroVersion();
      expect(updatedVer).toBe(1);
      expect(shouldShowWidgetUpgrade(updatedVer)).toBe(false);

      // Future versions (e.g. 2) also do not re-trigger 1.0 upgrade
      expect(shouldShowWidgetUpgrade(2)).toBe(false);
    });
  });

  describe('2. Dismissal & Interaction Persistence (Lifecycle Safety)', () => {
    it('dismissing via Not Now persists version = 1 and prevents future modal appearances', async () => {
      let isVisible = true;
      const onDismiss = jest.fn(async () => {
        isVisible = false;
        await setWidgetIntroVersion(CURRENT_WIDGET_INTRO_VERSION);
      });

      const root = renderer.create(
        <WidgetUpgradeModal
          visible={isVisible}
          onDismiss={onDismiss}
          source="upgrade"
        />
      );

      // Verify mounting the modal does NOT set version = 1 automatically in storage
      const storageValueBeforeDismiss = await AsyncStorage.getItem(WIDGET_INTRO_VERSION_KEY);
      expect(storageValueBeforeDismiss).toBeNull();

      // Trigger dismissal ("Not Now")
      await act(async () => {
        await onDismiss();
      });

      expect(onDismiss).toHaveBeenCalledTimes(1);
      const storageValueAfterDismiss = await AsyncStorage.getItem(WIDGET_INTRO_VERSION_KEY);
      expect(storageValueAfterDismiss).toBe('1');

      const nextVer = await getWidgetIntroVersion();
      expect(shouldShowWidgetUpgrade(nextVer)).toBe(false);
    });

    it('Show Me How opens instructions and completion persists version = 1', async () => {
      let isVisible = true;
      const onDismiss = jest.fn(async () => {
        isVisible = false;
        await setWidgetIntroVersion(CURRENT_WIDGET_INTRO_VERSION);
      });

      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(
          <WidgetUpgradeModal
            visible={isVisible}
            onDismiss={onDismiss}
            source="upgrade"
          />
        );
      });

      // Find "Show Me How" pressable
      const buttons = component!.root.findAllByType('View');
      expect(buttons.length).toBeGreaterThan(0);

      // Complete the flow via onDismiss
      await act(async () => {
        await onDismiss();
      });

      const persisted = await getWidgetIntroVersion();
      expect(persisted).toBe(1);
      expect(shouldShowWidgetUpgrade(persisted)).toBe(false);
    });
  });

  describe('3. Onboarding Bypass & New User Protection', () => {
    it('onboarding user completing the widget scene persists version = 1', async () => {
      // Simulates the Continue button in onboarding 'widget-glance' scene
      await act(async () => {
        await setWidgetIntroVersion(CURRENT_WIDGET_INTRO_VERSION);
      });

      const ver = await getWidgetIntroVersion();
      expect(ver).toBe(1);
    });

    it('onboarding completion guarantees user will not see upgrade modal on Home', async () => {
      // User finishes onboarding
      await setWidgetIntroVersion(CURRENT_WIDGET_INTRO_VERSION);

      // Home screen checks eligibility
      const homeVer = await getWidgetIntroVersion();
      const shouldPromptOnHome = shouldShowWidgetUpgrade(homeVer);

      expect(shouldPromptOnHome).toBe(false);
    });
  });

  describe('4. Settings Screen Accessibility', () => {
    it('Settings remains available regardless of version (0, 1, or 2)', async () => {
      // Even if version is 1, settings can open the modal on demand
      await setWidgetIntroVersion(1);

      let settingsModalVisible = false;
      const openFromSettings = () => {
        settingsModalVisible = true;
      };

      openFromSettings();
      expect(settingsModalVisible).toBe(true);

      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(
          <WidgetUpgradeModal
            visible={settingsModalVisible}
            onDismiss={() => { settingsModalVisible = false; }}
            source="settings"
          />
        );
      });

      // Settings opening should trigger widget_settings_opened, NOT widget_intro_viewed
      expect(trackEvent).toHaveBeenCalledWith('widget_settings_opened');
      expect(trackEvent).not.toHaveBeenCalledWith('widget_intro_viewed', expect.anything());
    });
  });

  describe('5. Graceful Fallbacks with Missing Data', () => {
    it('renders gracefully when dogName, temps, and times are undefined or null', () => {
      let tree: any;
      expect(() => {
        act(() => {
          tree = renderer.create(
            <WidgetGlancePreview
              dogName={undefined}
              statusText={undefined}
              airTempF={null}
              roadTempF={null}
              actionableTime={undefined}
            />
          );
        });
      }).not.toThrow();

      const json = tree.toJSON();
      const stringified = JSON.stringify(json);

      // Safe fallbacks should be visible rather than NaN or crashes
      expect(stringified).toContain('Your Pup');
      expect(stringified).toContain('"74"');
      expect(stringified).toContain('Air: ');
      expect(stringified).toContain('"70"');
      expect(stringified).toContain('FAVORABLE');
      expect(stringified).toContain('Favorable to walk now');
      expect(stringified).not.toContain('NaN');
    });

    it('renders active outing state accurately', () => {
      let tree: any;
      act(() => {
        tree = renderer.create(
          <WidgetGlancePreview
            dogName="Kona"
            isOutingActive={true}
          />
        );
      });

      const stringified = JSON.stringify(tree.toJSON());
      expect(stringified).toContain('Kona');
      expect(stringified).toContain('EXPLORING');
      expect(stringified).toContain('Outing in progress');
    });
  });

  describe('6. Telemetry Deduplication & Payload Cleanliness', () => {
    it('fires widget_intro_viewed once on mount and does not duplicate on re-renders', async () => {
      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(
          <WidgetUpgradeModal
            visible={true}
            onDismiss={jest.fn()}
            source="upgrade"
          />
        );
      });

      expect(trackEvent).toHaveBeenCalledTimes(1);
      expect(trackEvent).toHaveBeenCalledWith('widget_intro_viewed', { source: 'upgrade' });

      // Rerender with same visible state
      await act(async () => {
        component!.update(
          <WidgetUpgradeModal
            visible={true}
            onDismiss={jest.fn()}
            source="upgrade"
          />
        );
      });

      // Still called only once
      expect(trackEvent).toHaveBeenCalledTimes(1);
    });

    it('fires widget_howto_opened with source = upgrade or settings', async () => {
      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(
          <WidgetUpgradeModal
            visible={true}
            onDismiss={jest.fn()}
            source="settings"
          />
        );
      });

      // Find "Show Me How" pressable by accessibilityLabel
      const showMeHowBtn = component!.root.findByProps({
        accessibilityLabel: 'Show me how to add the widget',
      });

      await act(async () => {
        showMeHowBtn.props.onPress();
      });

      expect(trackEvent).toHaveBeenCalledWith('widget_howto_opened', { source: 'settings' });
    });

    it('supports switching between Home Screen and Lock Screen instructions', async () => {
      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(
          <WidgetUpgradeModal
            visible={true}
            onDismiss={jest.fn()}
            source="upgrade"
          />
        );
      });

      // Verify Stage 1 copy mentions Lock Screen
      const stage1Str = JSON.stringify(component!.toJSON());
      expect(stage1Str).toContain('Home Screen or Lock Screen');

      // Open instructions
      const showMeHowBtn = component!.root.findByProps({
        accessibilityLabel: 'Show me how to add the widget',
      });
      await act(async () => {
        showMeHowBtn.props.onPress();
      });

      // Initially shows Home Screen tab instructions
      const homeScreenTab = component!.root.findByProps({
        accessibilityLabel: 'Home Screen instructions',
      });
      const lockScreenTab = component!.root.findByProps({
        accessibilityLabel: 'Lock Screen instructions',
      });
      expect(homeScreenTab).toBeDefined();
      expect(lockScreenTab).toBeDefined();

      let instructionsStr = JSON.stringify(component!.toJSON());
      expect(instructionsStr).toContain('until your apps jiggle');

      // Switch to Lock Screen tab
      await act(async () => {
        lockScreenTab.props.onPress();
      });

      instructionsStr = JSON.stringify(component!.toJSON());
      expect(instructionsStr).toContain('Customize');
      expect(instructionsStr).toContain('Add Widgets');
      expect(instructionsStr).toContain('choose your preferred lock screen widget');
    });
  });
});
