import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/tokens';

import { T } from './T';

type Props = {
  label: string;
  selected?: boolean;
  dashed?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, selected, dashed, onPress, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      hitSlop={4}
      onPress={onPress}
      style={[styles.chip, selected ? styles.selected : dashed ? styles.dashed : styles.idle, style]}
    >
      <T size={14} weight={selected ? 600 : 400} color={selected ? colors.textStrong : colors.textSecondary}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { height: 40, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  idle: { borderWidth: 1, borderColor: 'rgba(201,182,255,0.18)', backgroundColor: 'rgba(20,17,42,0.65)' },
  dashed: { borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(201,182,255,0.35)' },
  selected: { borderWidth: 1.5, borderColor: colors.lilac, backgroundColor: 'rgba(201,182,255,0.18)' },
});
