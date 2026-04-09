import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type { GradientPair } from '@/lib/contentVisuals';

type Props = {
  height: number;
  source: number;
  gradient: GradientPair;
  /** Extra darkening at bottom for text (0–1). */
  scrimOpacity?: number;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function HeroImage({
  height,
  source,
  gradient,
  scrimOpacity = 0.92,
  children,
  style,
}: Props) {
  return (
    <View style={[{ height, borderRadius: 16, overflow: 'hidden' }, style]}>
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      <LinearGradient
        colors={[`${gradient[0]}00`, `${gradient[0]}AA`, gradient[1]]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', `rgba(13,27,20,${scrimOpacity * 0.55})`, `rgba(13,27,20,${scrimOpacity})`]}
        locations={[0.35, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children ? <View style={styles.childWrap}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  childWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 16,
  },
});
