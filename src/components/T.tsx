import { Text, type TextProps } from 'react-native';

import { colors, fonts, type FontWeight } from '@/theme/tokens';

type Props = TextProps & {
  size?: number;
  weight?: FontWeight;
  color?: string;
  /** Tracking en em, como en el diseño (−0.03 = −0.03em). */
  tracking?: number;
  glow?: boolean;
};

export function T({ size = 15, weight = 400, color = colors.text, tracking, glow, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: fonts[weight], fontSize: size, color },
        tracking !== undefined && { letterSpacing: size * tracking },
        glow && {
          textShadowColor: 'rgba(201,182,255,0.55)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 20,
          // iOS recorta la sombra a la caja del texto: se amplía la caja sin mover el layout.
          padding: 24,
          margin: -24,
        },
        style,
      ]}
    />
  );
}
