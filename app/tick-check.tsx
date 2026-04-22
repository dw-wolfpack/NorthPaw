import { useRouter } from 'expo-router';
import { StyleSheet, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function TickCheckScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const router = useRouter();

  const handleClear = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(74, 222, 128, 0.15)' }]}>
        <MaterialCommunityIcons name="bug" size={64} color={palette.tint} />
      </View>
      <Text style={[styles.title, { color: palette.text }]}>Tick Check Time!</Text>
      <Text style={[styles.body, { color: palette.textSecondary }]}>
        It's been a few hours since your outing! Run your hands deeply through your dog's coat, paying special attention around the ears, collar, under the legs, and between the toes.
      </Text>
      <Pressable
        onPress={handleClear}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: palette.tint, opacity: pressed ? 0.8 : 1 }
        ]}>
        <Text style={styles.btnText}>All Clear!</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center' },
  iconWrap: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', marginTop: 16, marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 16, lineHeight: 26, textAlign: 'center', marginBottom: 48 },
  btn: { paddingVertical: 18, paddingHorizontal: 40, borderRadius: 16, width: '100%', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '800' }
});
