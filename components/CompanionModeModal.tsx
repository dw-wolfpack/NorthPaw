import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface CompanionModeModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const CompanionModeModal: React.FC<CompanionModeModalProps> = ({
  visible,
  onClose,
  title = 'Companion Mode — Coming Soon! 🐾',
  description = 'Outing logs, history tracking, and custom checklist sync will be available in NorthPaw Companion Mode.',
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          entering={ZoomIn.springify().damping(28).stiffness(120)}
          exiting={FadeOut}
          style={[
            styles.card,
            {
              backgroundColor: palette.cardOpaque,
              borderColor: palette.border,
            },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: `${palette.tint}18` }]}>
            <MaterialCommunityIcons name="paw-outline" size={32} color={palette.tint} />
          </View>

          <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
          <Text style={[styles.body, { color: palette.textSecondary }]}>{description}</Text>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: palette.tint,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={styles.buttonText}>Got It</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
