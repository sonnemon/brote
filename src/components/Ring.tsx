import { useId, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { alpha, colors, gradients } from '@/theme/tokens';

type Props = {
  /** Progreso entre 0 y 1. */
  progress: number;
  size: number;
  strokeWidth: number;
  /** Color sólido; sin él se usa el gradiente cian → lila → rosa. */
  color?: string;
  children?: ReactNode;
};

export function Ring({ progress, size, strokeWidth, color, children }: Props) {
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const glow = color ?? colors.lilac;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color ? alpha(color, 0.14) : colors.track}
          strokeWidth={strokeWidth}
        />
      </Svg>
      {progress > 0 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { shadowColor: glow, shadowOpacity: 0.8, shadowRadius: size > 100 ? 12 : 4, shadowOffset: { width: 0, height: 0 } },
          ]}
        >
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={gradients.progress[0]} />
                <Stop offset="0.5" stopColor={gradients.progress[1]} />
                <Stop offset="1" stopColor={gradients.progress[2]} />
              </LinearGradient>
            </Defs>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={color ?? `url(#${gradientId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={[circumference * Math.min(progress, 1), circumference]}
              rotation={-90}
              originX={center}
              originY={center}
            />
          </Svg>
        </View>
      )}
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
