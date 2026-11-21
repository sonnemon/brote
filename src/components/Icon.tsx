import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type UiIconName =
  | 'scale'
  | 'wallet'
  | 'book'
  | 'route'
  | 'clock'
  | 'percent'
  | 'star'
  | 'back'
  | 'close'
  | 'plus'
  | 'minus'
  | 'check'
  | 'chevron'
  | 'calendar'
  | 'bell'
  | 'lock'
  | 'user'
  | 'sprout'
  | 'gear'
  | 'trendUp'
  | 'trendDown'
  | 'more'
  | 'info'
  | 'archive'
  | 'trash'
  | 'share'
  | 'download'
  | 'cloud'
  | 'coin'
  | 'moon'
  | 'globe';

type Props = { name: UiIconName; size?: number; color: string; strokeWidth?: number };

export function Icon({ name, size = 22, color, strokeWidth = 2 }: Props) {
  const stroke = { stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderIcon(name, stroke)}
    </Svg>
  );
}

function renderIcon(name: UiIconName, s: Record<string, string | number>) {
  switch (name) {
    case 'globe':
      return (
        <>
          <Circle cx="12" cy="12" r="9.5" {...s} />
          <Path d="M12 2.5a14 14 0 0 0 0 19 14 14 0 0 0 0-19M2.5 12h19" {...s} />
        </>
      );
    case 'more':
      return (
        <>
          <Circle cx={5} cy={12} r={2} fill={s.stroke as string} />
          <Circle cx={12} cy={12} r={2} fill={s.stroke as string} />
          <Circle cx={19} cy={12} r={2} fill={s.stroke as string} />
        </>
      );
    case 'info':
      return (
        <>
          <Circle cx={12} cy={12} r={9} {...s} />
          <Path d="M12 11v5M12 8h.01" {...s} />
        </>
      );
    case 'archive':
      return (
        <>
          <Rect x={3} y={4} width={18} height={5} rx={1.5} {...s} />
          <Path d="M5 9v10h14V9M10 13h4" {...s} />
        </>
      );
    case 'trash':
      return <Path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" {...s} />;
    case 'share':
      return <Path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7" {...s} />;
    case 'download':
      return <Path d="M12 4v11M7 10l5 5 5-5M5 19h14" {...s} />;
    case 'cloud':
      return <Path d="M7 18a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.5A3.8 3.8 0 0 1 17.5 18z" {...s} />;
    case 'coin':
      return (
        <>
          <Circle cx={12} cy={12} r={9} {...s} />
          <Path d="M15 9h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9M12 6v2M12 16v2" {...s} />
        </>
      );
    case 'moon':
      return <Path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" {...s} />;
    case 'back':
      return <Path d="M15 6l-6 6 6 6" {...s} />;
    case 'close':
      return <Path d="M6 6l12 12M18 6L6 18" {...s} />;
    case 'plus':
      return <Path d="M12 5v14M5 12h14" {...s} />;
    case 'minus':
      return <Path d="M5 12h14" {...s} />;
    case 'check':
      return <Path d="M5 12l5 5 9-10" {...s} />;
    case 'chevron':
      return <Path d="M9 6l6 6-6 6" {...s} />;
    case 'calendar':
      return (
        <>
          <Rect x={3} y={5} width={18} height={16} rx={3} {...s} />
          <Path d="M3 10h18M8 3v4M16 3v4" {...s} />
        </>
      );
    case 'bell':
      return <Path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" {...s} />;
    case 'lock':
      return (
        <>
          <Rect x={5} y={11} width={14} height={10} rx={2} {...s} />
          <Path d="M8 11V8a4 4 0 0 1 8 0v3" {...s} />
        </>
      );
    case 'user':
      return (
        <>
          <Circle cx={12} cy={8} r={4} {...s} />
          <Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" {...s} />
        </>
      );
    case 'star':
      return <Path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.6l1.1-6L3.4 9.4l6-.8z" {...s} />;
    case 'sprout':
      return (
        <>
          <Path d="M12 20v-8M7 20h10" {...s} />
          <Path d="M12 14c-4.2 0-7-2.6-7-6.5 4.2 0 7 2.6 7 6.5z" {...s} />
          <Path d="M12 11c0-3.8 2.6-6.5 6.5-6.5 0 3.8-2.6 6.5-6.5 6.5z" {...s} />
        </>
      );
    case 'gear':
      return (
        <>
          <Circle cx={12} cy={12} r={3} {...s} />
          <Path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" {...s} />
        </>
      );
    case 'trendUp':
      return <Path d="M3 17l6-6 4 4 8-8M15 7h6v6" {...s} />;
    case 'trendDown':
      return <Path d="M3 7l6 6 4-4 8 8M15 17h6v-6" {...s} />;
    case 'scale':
      return (
        <>
          <Rect x={4} y={4} width={16} height={16} rx={4} {...s} />
          <Path d="M9 9.5a4 4 0 0 1 6 0" {...s} />
        </>
      );
    case 'wallet':
      return (
        <>
          <Rect x={3} y={6} width={18} height={14} rx={3} {...s} />
          <Path d="M3 10h18M16 15h1" {...s} />
        </>
      );
    case 'book':
      return <Path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5" {...s} />;
    case 'route':
      return (
        <>
          <Circle cx={6} cy={19} r={2.5} {...s} />
          <Circle cx={18} cy={5} r={2.5} {...s} />
          <Path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5" {...s} />
        </>
      );
    case 'clock':
      return (
        <>
          <Circle cx={12} cy={12} r={9} {...s} />
          <Path d="M12 7v5l3 2" {...s} />
        </>
      );
    case 'percent':
      return (
        <>
          <Circle cx={7} cy={7} r={2.5} {...s} />
          <Circle cx={17} cy={17} r={2.5} {...s} />
          <Path d="M19 5L5 19" {...s} />
        </>
      );
  }
}
