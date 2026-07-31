import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import AnimatedReanimated, { ZoomIn, FadeOut } from 'react-native-reanimated';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import {
  handleLeaveAReview,
  handleMaybeLater,
  handleNeverAskAgain,
} from '@/lib/reviewPrompt';

interface ReviewPromptModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ReviewPromptModal({ visible, onClose }: ReviewPromptModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const onLeaveReview = async () => {
    onClose();
    await handleLeaveAReview();
  };

  const onMaybeLater = async () => {
    onClose();
    await handleMaybeLater();
  };

  const onNeverAskAgain = async () => {
    onClose();
    await handleNeverAskAgain();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onMaybeLater}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onMaybeLater} />
        <BlurView
          intensity={80}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <AnimatedReanimated.View
          entering={ZoomIn.springify().damping(28).stiffness(120)}
          exiting={FadeOut}
          style={[
            styles.card,
            {
              backgroundColor: colorScheme === 'dark' ? '#0F2015' : '#FFFFFF',
              borderColor: palette.border,
            },
          ]}
        >
          {/* Paw Icon Badge */}
          <View style={[styles.iconCircle, { backgroundColor: `${palette.tint}18` }]}>
            <MaterialCommunityIcons name="paw" size={32} color={palette.tint} />
          </View>

          <Text style={[styles.title, { color: palette.text }]}>
            Enjoying NorthPaw?
          </Text>

          <Text style={[styles.body, { color: palette.textSecondary }]}>
            If NorthPaw has helped you make better outdoor decisions with your dog, a quick review would help other dog owners discover it.
          </Text>

          {/* Action 1: Leave a Review */}
          <Pressable
            onPress={onLeaveReview}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: palette.tint, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="star-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.primaryBtnText}>Leave a Review</Text>
          </Pressable>

          {/* Action 2: Maybe Later */}
          <Pressable
            onPress={onMaybeLater}
            style={({ pressed }) => [
              styles.secondaryBtn,
              {
                backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.secondaryBtnText, { color: palette.text }]}>Maybe Later</Text>
          </Pressable>

          {/* Action 3: Never Ask Again */}
          <Pressable
            onPress={onNeverAskAgain}
            style={({ pressed }) => [
              styles.tertiaryBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[styles.tertiaryBtnText, { color: palette.textSecondary }]}>
              Never Ask Again
            </Text>
          </Pressable>
        </AnimatedReanimated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
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
    shadowOpacity: 0.12,
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
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tertiaryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tertiaryBtnText: {
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
