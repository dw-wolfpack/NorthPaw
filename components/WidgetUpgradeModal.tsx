import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { WidgetGlancePreview } from '@/components/WidgetGlancePreview';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { trackEvent } from '@/lib/analytics';

const hapticTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

export interface WidgetUpgradeModalProps {
  visible: boolean;
  onDismiss: () => void;
  dogName?: string;
  statusText?: string;
  airTempF?: number | null;
  roadTempF?: number | null;
  surfaceType?: string;
  actionableTime?: string;
  source?: 'upgrade' | 'settings';
}

export function WidgetUpgradeModal({
  visible,
  onDismiss,
  dogName,
  statusText,
  airTempF,
  roadTempF,
  surfaceType,
  actionableTime,
  source = 'upgrade',
}: WidgetUpgradeModalProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';
  const palette = Colors[colorScheme];

  const [showHowTo, setShowHowTo] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'lock'>('home');
  const trackedViewRef = useRef(false);

  useEffect(() => {
    if (visible && !trackedViewRef.current) {
      trackedViewRef.current = true;
      if (source === 'upgrade') {
        trackEvent('widget_intro_viewed', { source: 'upgrade' });
      } else if (source === 'settings') {
        trackEvent('widget_settings_opened');
      }
    }
    if (!visible) {
      trackedViewRef.current = false;
      setShowHowTo(false);
      setActiveTab('home');
    }
  }, [visible, source]);

  const handleShowMeHow = () => {
    hapticTap();
    trackEvent('widget_howto_opened', { source });
    setShowHowTo(true);
  };

  const handleClose = () => {
    hapticTap();
    onDismiss();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? '#121A15' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(18, 31, 24, 0.12)',
            },
          ]}
        >
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {!showHowTo ? (
              // Stage 1: Feature Introduction
              <View style={styles.contentWrap}>
                <View style={[styles.sparkleIconWrap, { backgroundColor: isDark ? 'rgba(45, 106, 79, 0.2)' : 'rgba(45, 106, 79, 0.1)' }]}>
                  <MaterialCommunityIcons name="widgets" size={26} color="#2D6A4F" />
                </View>

                <Text style={[styles.title, { color: palette.text }]}>
                  {source === 'settings' ? 'NorthPaw Widgets' : 'New: NorthPaw Widgets'}
                </Text>

                <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
                  Your dog&apos;s outdoor readiness is now available at a glance.
                </Text>

                {/* Representative Widget Preview */}
                <View style={styles.previewContainer}>
                  <WidgetGlancePreview
                    dogName={dogName}
                    statusText={statusText}
                    airTempF={airTempF}
                    roadTempF={roadTempF}
                    surfaceType={surfaceType}
                    actionableTime={actionableTime}
                  />
                </View>

                <Text style={[styles.benefitCopy, { color: palette.textSecondary }]}>
                  See current conditions, favorable outing times, and outing status right from your Home Screen or Lock Screen.
                </Text>

                {/* CTAs */}
                <View style={styles.ctaContainer}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={handleShowMeHow}
                    accessibilityRole="button"
                    accessibilityLabel="Show me how to add the widget"
                  >
                    <Text style={styles.primaryButtonText}>Show Me How (Home &amp; Lock Screen)</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      { opacity: pressed ? 0.6 : 1 },
                    ]}
                    onPress={handleClose}
                    accessibilityRole="button"
                    accessibilityLabel={source === 'settings' ? 'Close widget settings' : 'Not now'}
                  >
                    <Text style={[styles.secondaryButtonText, { color: palette.textSecondary }]}>
                      {source === 'settings' ? 'Done' : 'Not Now'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              // Stage 2: Step-by-Step Instructions
              <View style={styles.contentWrap}>
                <View style={[styles.sparkleIconWrap, { backgroundColor: isDark ? 'rgba(45, 106, 79, 0.2)' : 'rgba(45, 106, 79, 0.1)' }]}>
                  <MaterialCommunityIcons name="gesture-tap-hold" size={26} color="#2D6A4F" />
                </View>

                <Text style={[styles.title, { color: palette.text }]}>
                  How to add the widget
                </Text>

                <Text style={[styles.subtitle, { color: palette.textSecondary, marginBottom: 12 }]}>
                  Follow these quick steps on your iPhone:
                </Text>

                {/* Segmented Switcher: Home Screen vs Lock Screen */}
                <View
                  style={[
                    styles.tabBar,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(18, 31, 24, 0.06)' },
                  ]}
                >
                  <Pressable
                    style={[
                      styles.tabItem,
                      activeTab === 'home' && styles.tabItemActive,
                      activeTab === 'home' && { backgroundColor: '#2D6A4F' },
                    ]}
                    onPress={() => {
                      hapticTap();
                      setActiveTab('home');
                    }}
                    accessibilityRole="tab"
                    accessibilityLabel="Home Screen instructions"
                    accessibilityState={{ selected: activeTab === 'home' }}
                  >
                    <Text
                      style={[
                        styles.tabItemText,
                        { color: activeTab === 'home' ? '#FFFFFF' : palette.textSecondary },
                        activeTab === 'home' && { fontWeight: '700' },
                      ]}
                    >
                      Home Screen
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.tabItem,
                      activeTab === 'lock' && styles.tabItemActive,
                      activeTab === 'lock' && { backgroundColor: '#2D6A4F' },
                    ]}
                    onPress={() => {
                      hapticTap();
                      setActiveTab('lock');
                    }}
                    accessibilityRole="tab"
                    accessibilityLabel="Lock Screen instructions"
                    accessibilityState={{ selected: activeTab === 'lock' }}
                  >
                    <Text
                      style={[
                        styles.tabItemText,
                        { color: activeTab === 'lock' ? '#FFFFFF' : palette.textSecondary },
                        activeTab === 'lock' && { fontWeight: '700' },
                      ]}
                    >
                      Lock Screen
                    </Text>
                  </Pressable>
                </View>

                {activeTab === 'home' ? (
                  <View style={styles.stepsList}>
                    <View style={styles.stepItem}>
                      <View style={styles.stepNumberBadge}>
                        <Text style={styles.stepNumberText}>1</Text>
                      </View>
                      <Text style={[styles.stepText, { color: palette.text }]}>
                        Touch and hold any empty area on your <Text style={{ fontWeight: '700' }}>Home Screen</Text> until your apps jiggle.
                      </Text>
                    </View>

                    <View style={styles.stepItem}>
                      <View style={styles.stepNumberBadge}>
                        <Text style={styles.stepNumberText}>2</Text>
                      </View>
                      <Text style={[styles.stepText, { color: palette.text }]}>
                        Tap the <Text style={{ fontWeight: '700' }}>+ (Add)</Text> button in the upper-left corner.
                      </Text>
                    </View>

                    <View style={styles.stepItem}>
                      <View style={styles.stepNumberBadge}>
                        <Text style={styles.stepNumberText}>3</Text>
                      </View>
                      <Text style={[styles.stepText, { color: palette.text }]}>
                        Search for <Text style={{ fontWeight: '700' }}>NorthPaw</Text>, choose your widget size, and tap <Text style={{ fontWeight: '700' }}>Add Widget</Text>.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.stepsList}>
                    <View style={styles.stepItem}>
                      <View style={styles.stepNumberBadge}>
                        <Text style={styles.stepNumberText}>1</Text>
                      </View>
                      <Text style={[styles.stepText, { color: palette.text }]}>
                        Touch and hold your <Text style={{ fontWeight: '700' }}>Lock Screen</Text> until <Text style={{ fontWeight: '700' }}>Customize</Text> appears, then tap Customize.
                      </Text>
                    </View>

                    <View style={styles.stepItem}>
                      <View style={styles.stepNumberBadge}>
                        <Text style={styles.stepNumberText}>2</Text>
                      </View>
                      <Text style={[styles.stepText, { color: palette.text }]}>
                        Tap your <Text style={{ fontWeight: '700' }}>Lock Screen</Text> preview on the left to edit it.
                      </Text>
                    </View>

                    <View style={styles.stepItem}>
                      <View style={styles.stepNumberBadge}>
                        <Text style={styles.stepNumberText}>3</Text>
                      </View>
                      <Text style={[styles.stepText, { color: palette.text }]}>
                        Tap the <Text style={{ fontWeight: '700' }}>Add Widgets</Text> box directly below (or above) the clock.
                      </Text>
                    </View>

                    <View style={styles.stepItem}>
                      <View style={styles.stepNumberBadge}>
                        <Text style={styles.stepNumberText}>4</Text>
                      </View>
                      <Text style={[styles.stepText, { color: palette.text }]}>
                        Select <Text style={{ fontWeight: '700' }}>NorthPaw</Text>, choose your preferred lock screen widget, and tap <Text style={{ fontWeight: '700' }}>Done</Text>.
                      </Text>
                    </View>
                  </View>
                )}

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { opacity: pressed ? 0.85 : 1, marginTop: 14 },
                  ]}
                  onPress={handleClose}
                  accessibilityRole="button"
                  accessibilityLabel="Got it, close instructions"
                >
                  <Text style={styles.primaryButtonText}>Got It</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  scrollContent: {
    padding: 22,
  },
  contentWrap: {
    alignItems: 'center',
  },
  sparkleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 6,
  },
  benefitCopy: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  ctaContainer: {
    width: '100%',
    gap: 8,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#2D6A4F',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  stepsList: {
    width: '100%',
    marginVertical: 12,
    gap: 14,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2D6A4F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  stepText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    padding: 3,
    borderRadius: 12,
    marginBottom: 10,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  tabItemActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
