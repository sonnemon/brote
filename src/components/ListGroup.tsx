import type { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts } from '@/theme/tokens';

import { Icon, type UiIconName } from './Icon';
import { T } from './T';

export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      {title && (
        <T size={12} tracking={0.12} color={colors.textTertiary} style={styles.sectionTitle}>
          {title}
        </T>
      )}
      <View style={styles.group}>{children}</View>
    </View>
  );
}

type RowProps = {
  label: string;
  icon?: UiIconName;
  iconColor?: string;
  labelColor?: string;
  /** Texto a la derecha. */
  value?: string;
  valueColor?: string;
  /** Contenido a la derecha cuando no basta con texto. */
  right?: ReactNode;
  onPress?: () => void;
  dimmed?: boolean;
  last?: boolean;
};

export function Row({ label, icon, iconColor, labelColor, value, valueColor, right, onPress, dimmed, last }: RowProps) {
  const content = (
    <>
      <View style={styles.rowLabel}>
        {icon && <Icon name={icon} size={18} color={iconColor ?? colors.lilac} />}
        <T size={15} color={labelColor ?? colors.text}>
          {label}
        </T>
      </View>
      <View style={styles.rowRight}>
        {value !== undefined && (
          <T size={14} color={valueColor ?? colors.textSecondary} numberOfLines={1} style={styles.rowValue}>
            {value}
          </T>
        )}
        {right}
      </View>
    </>
  );
  const style = [styles.row, !last && styles.separator, dimmed && styles.dimmed];

  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [style, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

export function InputRow({ label, last, ...rest }: TextInputProps & { label: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.separator]}>
      <T size={15}>{label}</T>
      <TextInput
        accessibilityLabel={label}
        keyboardAppearance="dark"
        selectionColor={colors.lilac}
        placeholderTextColor={colors.textTertiary}
        selectTextOnFocus={rest.keyboardType === 'decimal-pad'}
        {...rest}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  sectionTitle: { paddingLeft: 4 },
  group: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,182,255,0.14)',
    backgroundColor: 'rgba(20,17,42,0.72)',
    overflow: 'hidden',
  },
  row: {
    minHeight: 46,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  separator: { borderBottomWidth: 1, borderBottomColor: 'rgba(201,182,255,0.08)' },
  pressed: { backgroundColor: 'rgba(201,182,255,0.08)' },
  dimmed: { opacity: 0.45 },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowRight: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { flexShrink: 1 },
  input: {
    flex: 1,
    height: 46,
    padding: 0,
    textAlign: 'right',
    color: colors.textSecondary,
    fontFamily: fonts[400],
    fontSize: 14,
  },
});
