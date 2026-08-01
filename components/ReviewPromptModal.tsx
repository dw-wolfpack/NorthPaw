import React, { useState, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import AnimatedReanimated, { ZoomIn, FadeOut } from 'react-native-reanimated';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import {
  handleLeaveWrittenReview,
  handleQuickStarRating,
  handleMaybeLater,
  handleNeverAskAgain,
  openStoreFallback,
} from '@/lib/reviewPrompt';

interface ReviewPromptModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ReviewPromptModal({ visible, onClose }: ReviewPromptModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [selectedStars, setSelectedStars] = useState(0);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedStars(0);
      setRated(false);
    }
  }, [visible]);

  const onSelectStar = async (starRating: number) => {
    setSelectedStars(starRating);
    setRated(true);
    await handleQuickStarRating(starRating);
    setTimeout(async () => {
      onClose();
      if (starRating >= 4) {
        await openStoreFallback();
      }
    }, 900);
  };

  const onLeaveWrittenReview = async () => {
    onClose();
    await handleLeaveWrittenReview();
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
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <AnimatedReanimated.View
          entering={ZoomIn.springify().damping(28).stiffness(120)}
          exiting={FadeOut}
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#0F2015' : '#FFFFFF',
              borderColor: palette.border,
            },
          ]}
        >
          {/* Paw Icon Badge */}
          <View style={[styles.iconCircle, { backgroundColor: rated ? 'rgba(243, 156, 18, 0.18)' : `${palette.tint}18` }]}>
            <MaterialCommunityIcons name={rated ? "star" : "paw"} size={32} color={rated ? "#F39C12" : palette.tint} />
          </View>

          <Text style={[styles.title, { color: palette.text }]}>
            {rated ? 'Thank You! 🐾' : 'Enjoying NorthPaw?'}
          </Text>

          <Text style={[styles.body, { color: palette.textSecondary, marginBottom: rated ? 12 : 16 }]}>
            {rated 
              ? `You rated NorthPaw ${selectedStars} Stars! Your feedback helps other dog owners explore safely.`
              : 'Tap a quick star rating below or write a review on the App Store:'}
          </Text>

          {!rated ? (
            <>
              {/* Interactive 5-Star Rating Rail */}
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={`star-${star}`}
                    onPress={() => onSelectStar(star)}
                    style={({ pressed }) => [
                      styles.starBtn,
                      { transform: [{ scale: pressed ? 1.25 : 1 }] }
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Rate ${star} out of 5 stars`}
                  >
                    <MaterialCommunityIcons
                      name={star <= selectedStars ? "star" : "star-outline"}
                      size={36}
                      color={star <= selectedStars ? "#F39C12" : (isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)")}
                    />
                  </Pressable>
                ))}
              </View>

              {/* Action 1: Write a Review (App Store) */}
              <Pressable
                onPress={onLeaveWrittenReview}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: palette.tint, opacity: pressed ? 0.88 : 1, marginTop: 14 },
                ]}
              >
                <MaterialCommunityIcons name="square-edit-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.primaryBtnText}>Write a Review on App Store</Text>
              </Pressable>

              {/* Action 2: Maybe Later */}
              <Pressable
                onPress={onMaybeLater}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[styles.secondaryBtnText, { color: palette.textSecondary }]}>Maybe Later</Text>
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
            </>
          ) : null}
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
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  starBtn: {
    padding: 4,
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
    marginBottom: 10,
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
