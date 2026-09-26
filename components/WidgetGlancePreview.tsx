import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { SEMANTIC_SAFETY_COLORS, roadBandForTemp } from '@/lib/readiness/thresholds';
import { useColorScheme } from '@/components/useColorScheme';

const hapticTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

export interface WidgetGlancePreviewProps {
  dogName?: string;
  statusText?: string;
  airTempF?: number | null;
  roadTempF?: number | null;
  surfaceType?: string;
  npiScore?: number | null;
  actionableTime?: string;
  isOutingActive?: boolean;
  style?: StyleProp<ViewStyle>;
  initialTab?: 'home' | 'lock';
}

/**
 * Representative preview of NorthPaw Home Screen & Lock Screen Widgets.
 * Shares semantic color tokens and data presentation with the native SwiftUI widget.
 */
export function WidgetGlancePreview({
  dogName,
  statusText,
  airTempF,
  roadTempF,
  surfaceType = 'asphalt',
  npiScore,
  actionableTime,
  isOutingActive = false,
  style,
  initialTab = 'home',
}: WidgetGlancePreviewProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState<'home' | 'lock'>(initialTab);

  const safeDogName = (dogName && dogName.trim()) || 'Your Pup';
  const safeRoadTemp = Number.isFinite(roadTempF) ? Math.round(roadTempF!) : 74;
  const safeAirTemp = Number.isFinite(airTempF) ? Math.round(airTempF!) : 70;
  const safeSurface = surfaceType ? surfaceType.charAt(0).toUpperCase() + surfaceType.slice(1) : 'Asphalt';

  // Derive semantic status band & colors
  const band = roadBandForTemp(safeRoadTemp);
  let statusColor: string = SEMANTIC_SAFETY_COLORS.safe.hex;
  let displayStatus = statusText?.toUpperCase() || 'FAVORABLE';

  if (isOutingActive) {
    statusColor = SEMANTIC_SAFETY_COLORS.active_outing.hex;
    displayStatus = 'EXPLORING';
  } else if (displayStatus.includes('DANGER') || band === 'danger' || (npiScore != null && npiScore > 66)) {
    statusColor = SEMANTIC_SAFETY_COLORS.danger.hex;
    displayStatus = 'DANGER';
  } else if (displayStatus === 'HOT' || band === 'hot') {
    statusColor = SEMANTIC_SAFETY_COLORS.hot.hex;
    displayStatus = 'HOT';
  } else if (displayStatus.includes('CAUTION') || displayStatus === 'WARM' || band === 'warm' || (npiScore != null && npiScore > 33)) {
    statusColor = SEMANTIC_SAFETY_COLORS.warm.hex;
    displayStatus = 'CAUTION';
  } else if (band === 'unavailable') {
    statusColor = SEMANTIC_SAFETY_COLORS.unavailable.hex;
    displayStatus = 'UPDATING';
  }

  const timingCopy = isOutingActive
    ? '🐾 Outing in progress'
    : actionableTime
    ? (displayStatus === 'FAVORABLE' || displayStatus === 'READY'
        ? `Favorable until ${actionableTime}`
        : `Next favorable: ${actionableTime}`)
    : 'Favorable to walk now';

  return (
    <View style={[styles.rootWrap, style]}>
      {/* Interactive Switcher Tab Bar */}
      <View
        style={[
          styles.tabSelectorBar,
          { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(18, 31, 24, 0.07)' },
        ]}
      >
        <Pressable
          style={[
            styles.tabSelectorItem,
            activeTab === 'home' && styles.tabSelectorItemActive,
            activeTab === 'home' && { backgroundColor: '#2D6A4F' },
          ]}
          onPress={() => {
            hapticTap();
            setActiveTab('home');
          }}
          accessibilityRole="tab"
          accessibilityLabel="Home Screen widget preview"
          accessibilityState={{ selected: activeTab === 'home' }}
        >
          <Text
            style={[
              styles.tabSelectorText,
              { color: activeTab === 'home' ? '#FFFFFF' : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(18,31,24,0.6)' },
              activeTab === 'home' && { fontWeight: '700' },
            ]}
          >
            Home Screen
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tabSelectorItem,
            activeTab === 'lock' && styles.tabSelectorItemActive,
            activeTab === 'lock' && { backgroundColor: '#2D6A4F' },
          ]}
          onPress={() => {
            hapticTap();
            setActiveTab('lock');
          }}
          accessibilityRole="tab"
          accessibilityLabel="Lock Screen widget preview"
          accessibilityState={{ selected: activeTab === 'lock' }}
        >
          <Text
            style={[
              styles.tabSelectorText,
              { color: activeTab === 'lock' ? '#FFFFFF' : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(18,31,24,0.6)' },
              activeTab === 'lock' && { fontWeight: '700' },
            ]}
          >
            Lock Screen
          </Text>
        </Pressable>
      </View>

      {activeTab === 'home' ? (
        /* Home Screen Medium Widget */
        <View
          style={[
            styles.widgetContainer,
            {
              backgroundColor: isDark ? '#141E18' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(18, 31, 24, 0.12)',
            },
          ]}
          accessible={true}
          accessibilityRole="summary"
          accessibilityLabel={`Representative widget preview for ${safeDogName}: ${displayStatus}, ${safeRoadTemp} degrees surface temperature`}
        >
          {/* Top Header Strip: Status badge + Dog name */}
          <View style={styles.headerRow}>
            <View style={styles.statusBadgeRow}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{displayStatus}</Text>
              <Text style={[styles.bullet, { color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)' }]}>•</Text>
              <Text
                style={[styles.dogName, { color: isDark ? '#FFFFFF' : '#121F18' }]}
                numberOfLines={1}
              >
                {safeDogName}
              </Text>
            </View>

            <View style={[styles.appBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
              <MaterialCommunityIcons name="paw" size={11} color={statusColor} />
              <Text style={[styles.appBadgeText, { color: isDark ? '#A1A1A1' : '#666666' }]}>NorthPaw</Text>
            </View>
          </View>

          {/* Actionable Window / Readiness Cue */}
          <View style={styles.timingRow}>
            <Text style={[styles.timingText, { color: isDark ? 'rgba(255, 255, 255, 0.72)' : 'rgba(18, 31, 24, 0.72)' }]} numberOfLines={1}>
              {timingCopy}
            </Text>
          </View>

          {/* Conditions Strip */}
          <View style={styles.conditionsRow}>
            <View>
              <View style={styles.tempPrimaryRow}>
                <Text style={[styles.heroTempText, { color: isDark ? '#FFFFFF' : '#121F18' }]}>
                  {safeRoadTemp}°F
                </Text>
                <Text style={[styles.surfaceSub, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(18, 31, 24, 0.5)' }]}>
                  {safeSurface}
                </Text>
              </View>
              <Text style={[styles.airTempSub, { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(18, 31, 24, 0.45)' }]}>
                Air: {safeAirTemp}°F
              </Text>
            </View>

            {/* Glance Quick Button Visual */}
            <View
              style={[
                styles.glanceActionButton,
                {
                  backgroundColor: isOutingActive
                    ? 'rgba(239, 68, 68, 0.14)'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isOutingActive ? 'stop' : 'play'}
                size={12}
                color={isOutingActive ? '#EF4444' : statusColor}
              />
              <Text
                style={[
                  styles.glanceActionText,
                  { color: isOutingActive ? '#EF4444' : isDark ? '#EAEAEA' : '#121F18' },
                ]}
              >
                {isOutingActive ? 'End' : 'Explore'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        /* Lock Screen Accessory Widgets Preview */
        <View style={styles.lockScreenContainer}>
          {/* 1. Accessory Inline (Above Clock) */}
          <View style={[styles.lockInlineCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(18,31,24,0.06)' }]}>
            <MaterialCommunityIcons name="paw" size={12} color={statusColor} />
            <Text style={[styles.lockInlineText, { color: isDark ? '#FFFFFF' : '#121F18' }]}>
              {safeDogName} • {displayStatus} • Road {safeRoadTemp}°
            </Text>
          </View>
          <Text style={[styles.accessorySubCaption, { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(18,31,24,0.45)' }]}>
            Inline (Above Clock)
          </Text>

          {/* 2. Below Clock: Rectangular & Circular Accessories */}
          <View style={styles.lockAccessoriesRow}>
            {/* Accessory Rectangular Box */}
            <View style={[styles.lockRectCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(18,31,24,0.08)' }]}>
              <View style={styles.lockRectTopRow}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.lockRectStatus, { color: statusColor }]}>{displayStatus}</Text>
                <Text style={styles.lockRectBullet}>•</Text>
                <Text style={[styles.lockRectDog, { color: isDark ? '#FFFFFF' : '#121F18' }]} numberOfLines={1}>
                  {safeDogName}
                </Text>
              </View>

              <Text style={[styles.lockRectTemp, { color: isDark ? '#FFFFFF' : '#121F18' }]}>
                Road {safeRoadTemp}°F
              </Text>

              <Text style={[styles.lockRectTiming, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(18,31,24,0.7)' }]} numberOfLines={1}>
                {timingCopy}
              </Text>
            </View>

            {/* Accessory Circular Complication */}
            <View style={[styles.lockCircularCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(18,31,24,0.08)' }]}>
              <View style={[styles.lockCircularRim, { borderColor: statusColor }]}>
                <MaterialCommunityIcons name="paw" size={10} color={statusColor} />
                <Text style={[styles.lockCircularTemp, { color: isDark ? '#FFFFFF' : '#121F18' }]}>
                  {safeRoadTemp}°
                </Text>
              </View>
              <Text style={[styles.lockCircularLabel, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(18,31,24,0.5)' }]}>
                Circular
              </Text>
            </View>
          </View>
          <Text style={[styles.accessorySubCaption, { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(18,31,24,0.45)' }]}>
            Rectangular & Circular (Below Clock)
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  widgetContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  bullet: {
    marginHorizontal: 6,
    fontSize: 12,
  },
  dogName: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    gap: 4,
  },
  appBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  timingRow: {
    marginBottom: 10,
  },
  timingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  conditionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  tempPrimaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  heroTempText: {
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  surfaceSub: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  airTempSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  glanceActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  glanceActionText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  rootWrap: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  tabSelectorBar: {
    flexDirection: 'row',
    width: '100%',
    padding: 3,
    borderRadius: 12,
    marginBottom: 12,
  },
  tabSelectorItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  tabSelectorItemActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  tabSelectorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lockScreenContainer: {
    width: '100%',
    alignItems: 'center',
  },
  lockInlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
    marginBottom: 4,
  },
  lockInlineText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  accessorySubCaption: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  lockAccessoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 4,
  },
  lockRectCard: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  lockRectTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  lockRectStatus: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  lockRectBullet: {
    color: 'rgba(255, 255, 255, 0.35)',
    marginHorizontal: 4,
    fontSize: 10,
  },
  lockRectDog: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  lockRectTemp: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  lockRectTiming: {
    fontSize: 10,
    fontWeight: '600',
  },
  lockCircularCard: {
    width: 82,
    height: 82,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 6,
  },
  lockCircularRim: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  lockCircularTemp: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  lockCircularLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
