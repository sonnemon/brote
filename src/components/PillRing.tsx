import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { alpha, colors } from '@/theme/tokens';

type Props = {
  progress: number;
  width: number;
  height: number;
  strokeWidth: number;
  color?: string;
  children?: ReactNode;
};

/** Anillo con forma de píldora; el trazo arranca arriba al centro y avanza en sentido horario. */
export function PillRing({ progress, width, height, strokeWidth, color = colors.lilac, children }: Props) {
  const inset = strokeWidth / 2;
  const r = (height - strokeWidth) / 2;
  const left = inset + r;
  const right = width - inset - r;
  const top = inset;
  const bottom = height - inset;
  const middle = width / 2;
  const d = `M ${middle} ${top} L ${right} ${top} A ${r} ${r} 0 0 1 ${right} ${bottom} L ${left} ${bottom} A ${r} ${r} 0 0 1 ${left} ${top} L ${middle} ${top}`;
  const perimeter = 2 * (right - left) + 2 * Math.PI * r;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Path d={d} fill="none" stroke={alpha(color, 0.14)} strokeWidth={strokeWidth} />
        {progress > 0 && (
          <Path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={[perimeter * Math.min(progress, 1), perimeter]}
          />
        )}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
