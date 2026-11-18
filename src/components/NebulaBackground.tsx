import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/theme/tokens';

const nebula = require('../../assets/nebula.png');

const VARIANTS = [
  { scale: 1.15, x: 0, y: 0, flip: 1 },
  { scale: 1.35, x: -0.2, y: -0.12, flip: -1 },
  { scale: 1.5, x: -0.28, y: -0.3, flip: 1 },
  { scale: 1.25, x: -0.1, y: -0.2, flip: -1 },
] as const;

type Props = {
  /** Encuadre de la imagen: cada pantalla usa uno distinto. */
  variant?: 0 | 1 | 2 | 3;
  /** Pantallas con formularios oscurecen más el fondo. */
  dim?: boolean;
};

export function NebulaBackground({ variant = 0, dim = false }: Props) {
  const { width, height } = useWindowDimensions();
  const v = VARIANTS[variant];
  const stars = useMemo(() => makeStars(width, height, variant), [width, height, variant]);
  const imageWidth = width * v.scale;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, overflow: 'hidden' }]}>
        <Image
          source={nebula}
          resizeMode="cover"
          style={{
            position: 'absolute',
            left: width * v.x,
            top: height * v.y,
            width: imageWidth,
            height: Math.max(height * 1.3, (imageWidth * 1688) / 780),
            opacity: dim ? 0.75 : 1,
            transform: [{ scaleX: v.flip }],
          }}
        />
      </View>
      <LinearGradient
        colors={
          dim
            ? ['rgba(7,6,26,0.35)', 'rgba(7,6,26,0.7)', 'rgba(5,4,18,0.92)']
            : ['rgba(7,6,26,0.15)', 'rgba(7,6,26,0.5)', 'rgba(5,4,18,0.9)']
        }
        locations={dim ? [0, 0.35, 0.8] : [0, 0.3, 0.7]}
        style={StyleSheet.absoluteFill}
      />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {stars.map((star, i) => (
          <Circle key={i} cx={star.x} cy={star.y} r={star.r} fill="#FFFFFF" opacity={star.o} />
        ))}
      </Svg>
    </View>
  );
}

function makeStars(width: number, height: number, seed: number) {
  let s = (seed + 1) * 2654435761;
  const next = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  return Array.from({ length: 46 }, () => ({
    x: next() * width,
    y: next() * height,
    r: 0.4 + next() * 0.8,
    o: 0.25 + next() * 0.6,
  }));
}
