import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, glass } from '@/theme/tokens';

type Props = {
  children: ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function GlassCard({ children, radius = 24, style }: Props) {
  return (
    <View style={[styles.card, { borderRadius: radius }, style]}>
      <BlurView intensity={glass.blur} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient colors={glass.gradient} style={StyleSheet.absoluteFill} />
      <View style={styles.highlight} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: glass.highlight,
  },
});
