import React from 'react';
import { StyleSheet, Text, Pressable, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';

interface ShareButtonProps {
  onPress: () => void;
  loading: boolean;
  dogName?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ onPress, loading, dogName }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const goldTextColor = isDark ? '#F5D77F' : '#8B6508';
  const goldBgColor = isDark ? 'rgba(212, 175, 55, 0.12)' : 'rgba(212, 175, 55, 0.14)';
  const goldBorderColor = isDark ? 'rgba(212, 175, 55, 0.45)' : 'rgba(184, 134, 11, 0.55)';

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed
            ? (isDark ? 'rgba(212, 175, 55, 0.25)' : 'rgba(212, 175, 55, 0.28)')
            : goldBgColor,
          borderColor: goldBorderColor,
        },
        pressed && styles.buttonPressed,
        loading && styles.buttonDisabled,
      ]}
    >
      {({ pressed }) => (
        loading ? (
          <ActivityIndicator size="small" color={goldTextColor} />
        ) : (
          <View style={styles.contentContainer}>
            <Ionicons 
              name="share-social" 
              size={18} 
              color={goldTextColor} 
              style={[
                styles.icon,
                pressed && styles.iconPressed
              ]} 
            />
            <Text style={[styles.text, { color: goldTextColor }]}>
              {dogName ? `Share ${dogName}'s Walk Report` : 'Share Walk Report'}
            </Text>
          </View>
        )
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.45)', // Brighter gold border
    borderRadius: 24,
    paddingVertical: 14, // Taller button
    paddingHorizontal: 22,
    marginVertical: 12,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  iconPressed: {
    transform: [{ rotate: '-10deg' }],
  },
  text: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
