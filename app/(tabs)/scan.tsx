import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { trackEvent } from '@/lib/analytics';

const { width: screenWidth } = Dimensions.get('window');

const BENEFITS = [
  {
    icon: 'tag-outline',
    title: 'Scan Gear Tags',
    desc: "Scan a tag on your dog's harness or collar to instantly log a current location snapshot.",
  },
  {
    icon: 'account-group',
    title: 'Social Boards',
    desc: 'Scan community flyers or local boards to connect with other dog owners and get updates.',
  },
  {
    icon: 'share-variant',
    title: 'Personalized Checklist Sharing',
    desc: 'Share your custom checklists with other owners using dynamic QR codes.',
  },
  {
    icon: 'plus-circle-outline',
    title: 'Plus More',
    desc: 'Additional features including offline guides and personalized tags are planned for the upcoming release.',
  },
] as const;

import { getTabScrollPadding } from '@/lib/layout';

export default function ScanScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    trackEvent('scan_screen_viewed');
  }, []);

  const triggerExcitedAlert = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await trackEvent('scan_interest_registered');
      Alert.alert(
        'Real-Life QR Sync Coming!',
        "Get ready to connect NorthPaw directly with the physical world! Soon you will be able to scan tags on your dog's gear, community flyers, and shared checklists to instantly sync location snapshots and custom lists. We are super excited to launch this in our upcoming Pro release!",
        [
          {
            text: 'Return Home',
            onPress: () => {
              router.replace('/(tabs)');
            },
          },
          {
            text: 'Got It',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: palette.background }]}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: getTabScrollPadding(insets.bottom) }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text }]}>Real-Life Sync</Text>
        <Text style={[styles.desc, { color: palette.textSecondary }]}>
          Bring physical gear tags, social boards, and custom lists straight into your app.
        </Text>
      </View>

      {/* Primary Action Button */}
      <Pressable
        disabled={busy}
        onPress={triggerExcitedAlert}
        style={({ pressed }) => [
          styles.scanBtn,
          { backgroundColor: palette.tint, opacity: pressed || busy ? 0.85 : 1, marginBottom: 32 },
        ]}
      >
        <MaterialCommunityIcons name="camera" size={20} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.scanBtnText}>Try QR Scanner</Text>
      </Pressable>

      {/* Benefits Block */}
      <View style={styles.benefitsWrap}>
        {BENEFITS.map((b) => (
          <View key={b.icon} style={styles.benefitRow}>
            <View style={[styles.iconCircle, { backgroundColor: `${palette.tint}18` }]}>
              <MaterialCommunityIcons name={b.icon as any} size={22} color={palette.tint} />
            </View>
            <View style={styles.benefitTextWrap}>
              <Text style={[styles.benefitTitle, { color: palette.text }]}>{b.title}</Text>
              <Text style={[styles.benefitDesc, { color: palette.textSecondary }]}>{b.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Visual QR Code Scanner Mockup */}
      <View style={[styles.scannerContainer, { backgroundColor: colorScheme === 'dark' ? '#0F2015' : '#E8F5EC', borderColor: palette.border }]}>
        <LinearGradient
          colors={colorScheme === 'dark' ? ['rgba(46,204,113,0.15)', 'transparent'] : ['rgba(21,122,63,0.06)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.scannerCorner, styles.topLeft, { borderColor: palette.tint }]} />
        <View style={[styles.scannerCorner, styles.topRight, { borderColor: palette.tint }]} />
        <View style={[styles.scannerCorner, styles.bottomLeft, { borderColor: palette.tint }]} />
        <View style={[styles.scannerCorner, styles.bottomRight, { borderColor: palette.tint }]} />
        
        <MaterialCommunityIcons name="qrcode-scan" size={80} color={palette.tint} />
        
        {/* Simulated laser line */}
        <View style={[styles.laser, { backgroundColor: palette.tint }]} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 24 },
  topNav: { flexDirection: 'row', marginBottom: 16 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backBtnText: { fontSize: 14, fontWeight: '700' },
  header: { marginBottom: 28 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.6, marginBottom: 8 },
  desc: { fontSize: 16, lineHeight: 22 },
  scannerContainer: {
    height: 200,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  scannerCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 4,
  },
  topLeft: { top: 16, left: 16, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  topRight: { top: 16, right: 16, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  bottomLeft: { bottom: 16, left: 16, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  bottomRight: { bottom: 16, right: 16, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  laser: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    top: '55%',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitsWrap: { marginBottom: 32 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 16 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTextWrap: { flex: 1, marginTop: 2 },
  benefitTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  benefitDesc: { fontSize: 14, lineHeight: 20 },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  scanBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
