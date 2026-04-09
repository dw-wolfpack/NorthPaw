import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { trailPathFromQrData } from '@/lib/deeplink';
import { useColorScheme } from '@/components/useColorScheme';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const [message, setMessage] = useState<string | null>(null);
  const lastScanAt = useRef(0);

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      const now = Date.now();
      if (now - lastScanAt.current < 2000) return;
      lastScanAt.current = now;
      const path = trailPathFromQrData(data);
      if (path) {
        setMessage(null);
        router.push(path as Parameters<typeof router.push>[0]);
        return;
      }
      setMessage(
        'This QR is not a NorthPaw link. Use northpaw://card/… (or legacy trailready://…) in your QR generator.'
      );
    },
    [router]
  );

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={{ color: palette.textSecondary }}>Loading camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background, padding: 24 }]}>
        <Text style={[styles.permTitle, { color: palette.text }]}>Camera access</Text>
        <Text style={[styles.permBody, { color: palette.textSecondary }]}>
          NorthPaw uses the camera only to read QR codes that open a field card, checklist, or pack inside
          this app.
        </Text>
        <Pressable
          onPress={() => requestPermission()}
          style={[styles.button, { backgroundColor: palette.tint }]}>
          <Text style={styles.buttonLabel}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onBarcodeScanned}
      />
      <View style={styles.overlay} pointerEvents="none">
        <View style={[styles.frame, { borderColor: palette.tint }]} />
      </View>
      <View style={[styles.footer, { backgroundColor: palette.surface }]}>
        <Text style={{ color: palette.text, fontWeight: '600' }}>Scan a NorthPaw QR</Text>
        <Text style={{ color: palette.textSecondary, marginTop: 6, fontSize: 13, lineHeight: 18 }}>
          Encode northpaw://card/heat-stress-signals or northpaw://checklist/pre-trail-60s. Older codes may use
          trailready://…
        </Text>
        {message ? (
          <Text style={{ color: palette.danger, marginTop: 10, fontSize: 13 }}>{message}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  permBody: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  button: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  buttonLabel: { color: '#fff', fontWeight: '700', fontSize: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
