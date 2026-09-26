import React from 'react';
import { StyleSheet, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SEMANTIC_SAFETY_COLORS, roadBandForTemp } from '@/lib/readiness/thresholds';
import { useColorScheme } from '@/components/useColorScheme';

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
}

/**
 * Representative preview of the NorthPaw Home Screen Widget.
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
}: WidgetGlancePreviewProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';

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
    <View
      style={[
        styles.widgetContainer,
        {
          backgroundColor: isDark ? '#141E18' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(18, 31, 24, 0.12)',
        },
        style,
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
});
