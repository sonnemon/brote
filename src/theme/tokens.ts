export const colors = {
  bg: '#07061A',
  lilac: '#C9B6FF',
  pink: '#FF9ECF',
  cyan: '#8FE3F0',
  amber: '#FFD59E',
  mint: '#B8F2D4',
  text: '#EEEAFE',
  textStrong: '#F5F2FF',
  textSecondary: '#BDB6DC',
  textTertiary: '#A49DC4',
  lilacSoft: '#D9CCFF',
  onPrimary: '#15112A',
  track: 'rgba(201,182,255,0.14)',
  border: 'rgba(201,182,255,0.16)',
  borderStrong: 'rgba(201,182,255,0.24)',
  surface: 'rgba(20,17,42,0.7)',
  danger: '#FFB4C4',
} as const;

export const glass = {
  gradient: ['rgba(36,30,72,0.62)', 'rgba(14,12,32,0.78)'] as const,
  blur: 18,
  highlight: 'rgba(255,255,255,0.08)',
};

export const gradients = {
  primary: ['#C9B6FF', '#E7B9F0'] as const,
  progress: ['#8FE3F0', '#C9B6FF', '#FF9ECF'] as const,
  bar: ['#8FE3F0', '#C9B6FF'] as const,
};

export const fonts = {
  400: 'Sora_400Regular',
  500: 'Sora_500Medium',
  600: 'Sora_600SemiBold',
  700: 'Sora_700Bold',
} as const;

export type FontWeight = keyof typeof fonts;

export const goalColors = [
  { value: colors.lilac, label: 'Lila' },
  { value: colors.pink, label: 'Rosa' },
  { value: colors.cyan, label: 'Cian' },
  { value: colors.amber, label: 'Ámbar' },
  { value: colors.mint, label: 'Menta' },
] as const;

/** Convierte un color hex a rgba con la opacidad indicada. */
export function alpha(hex: string, opacity: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${opacity})`;
}
