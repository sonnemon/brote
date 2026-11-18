import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, gradients } from '@/theme/tokens';

import { Icon, type UiIconName } from './Icon';
import { T } from './T';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: UiIconName;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, disabled, icon, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.shadow, { opacity: disabled ? 0.45 : pressed ? 0.85 : 1 }, style]}
    >
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fill}>
        <View style={styles.row}>
          {icon && <Icon name={icon} size={18} color={colors.onPrimary} strokeWidth={2.6} />}
          <T size={16} weight={600} color={colors.onPrimary}>
            {title}
          </T>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 27,
    shadowColor: colors.lilac,
    shadowOpacity: 0.45,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
  },
  fill: { height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
