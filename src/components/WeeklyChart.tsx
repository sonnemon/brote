import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Polygon, Polyline, Stop } from 'react-native-svg';

import { colors, gradients } from '@/theme/tokens';

const DEFAULT_HEIGHT = 72;
const PAD_X = 6;
const PAD_Y = 8;

export function WeeklyChart({ values, height: HEIGHT = DEFAULT_HEIGHT }: { values: number[]; height?: number }) {
  const [width, setWidth] = useState(0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const stepX = (width - PAD_X * 2) / Math.max(values.length - 1, 1);
  const points = values.map((value, i) => ({
    x: PAD_X + i * stepX,
    y: span === 0 ? HEIGHT / 2 : PAD_Y + (1 - (value - min) / span) * (HEIGHT - PAD_Y * 2),
  }));
  const line = points.map((p) => `${p.x},${p.y}`).join(' ');
  const last = points[points.length - 1];

  return (
    <View style={{ height: HEIGHT }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          <Defs>
            <LinearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.lilac} stopOpacity={0.35} />
              <Stop offset="1" stopColor={colors.pink} stopOpacity={0} />
            </LinearGradient>
            <LinearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={gradients.progress[0]} />
              <Stop offset="0.5" stopColor={gradients.progress[1]} />
              <Stop offset="1" stopColor={gradients.progress[2]} />
            </LinearGradient>
          </Defs>
          <Line x1={0} y1={HEIGHT / 3} x2={width} y2={HEIGHT / 3} stroke="rgba(201,182,255,0.08)" />
          <Line x1={0} y1={(HEIGHT * 2) / 3} x2={width} y2={(HEIGHT * 2) / 3} stroke="rgba(201,182,255,0.08)" />
          <Polygon points={`${line} ${last.x},${HEIGHT} ${PAD_X},${HEIGHT}`} fill="url(#chartArea)" />
          {/* El gradiente necesita una caja con ancho y alto: en una línea plana se usa color sólido. */}
          <Polyline
            points={line}
            fill="none"
            stroke={span === 0 ? colors.lilac : 'url(#chartLine)'}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <Circle cx={last.x} cy={last.y} r={8} fill={colors.pink} opacity={0.25} />
          <Circle cx={last.x} cy={last.y} r={4} fill="#FFFFFF" />
        </Svg>
      )}
    </View>
  );
}
