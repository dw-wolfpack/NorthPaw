import React from 'react';
import { StyleSheet, Text, Pressable, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ShareButtonProps {
  onPress: () => void;
  loading: boolean;
  dogName?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ onPress, loading, dogName }) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        loading && styles.buttonDisabled,
      ]}
    >
      {({ pressed }) => (
        loading ? (
          <ActivityIndicator size="small" color="#D4AF37" />
        ) : (
          <View style={styles.contentContainer}>
            <Ionicons 
              name="share-social" 
              size={18} 
              color="#D4AF37" 
              style={[
                styles.icon,
                pressed && styles.iconPressed
              ]} 
            />
            <Text style={styles.text}>
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
    marginTop: 18,
    alignSelf: 'center',
    minWidth: 220,
    // Gold shadow glow effect
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, // Stronger glow visibility
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: 'rgba(212, 175, 55, 0.7)',
    transform: [{ scale: 0.96 }], // Slightly deeper press feedback
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
    transform: [{ scale: 1 }, { rotate: '0deg' }],
  },
  iconPressed: {
    transform: [{ scale: 1.25 }, { rotate: '12deg' }], // Playful pop and tilt on press
  },
  text: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
});
