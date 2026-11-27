import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStrings } from '@/i18n';
import { alpha, colors, extendedGoalColors, goalColors, readable } from '@/theme/tokens';

import { GoalIcon } from './GoalIcon';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { T } from './T';

type Props = {
  value: string;
  onChange: (color: string) => void;
  /** Icono para la vista previa del selector. */
  icon: string;
  /** Tamaño de cada muestra (44 en crear, 22 en la fila de editar). */
  swatch?: number;
  gap?: number;
};

const BASE = goalColors.map((c) => c.value as string);
const same = (a: string, b: string) => a.toUpperCase() === b.toUpperCase();

/** Colores base + un botón "más" que abre la paleta ampliada. */
export function ColorField({ value, onChange, icon, swatch = 44, gap = 14 }: Props) {
  const [open, setOpen] = useState(false);
  const s = useStrings();
  const custom = !BASE.some((c) => same(c, value));
  const ring = swatch >= 40 ? 2 : 1.5;

  return (
    <View style={[styles.row, { gap }]}>
      {BASE.map((color, i) => {
        const selected = same(color, value);
        return (
          <Pressable
            key={color}
            accessibilityRole="button"
            accessibilityLabel={s.colors.base[i]}
            accessibilityState={{ selected }}
            hitSlop={6}
            onPress={() => onChange(color)}
            style={[
              { width: swatch, height: swatch, borderRadius: swatch / 2, backgroundColor: color },
              selected && { borderWidth: ring, borderColor: colors.textStrong },
            ]}
          />
        );
      })}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={s.colors.more}
        accessibilityState={{ selected: custom }}
        hitSlop={6}
        onPress={() => setOpen(true)}
        style={[
          styles.more,
          { width: swatch, height: swatch, borderRadius: swatch / 2 },
          custom
            ? { backgroundColor: value, borderWidth: ring, borderColor: colors.textStrong, borderStyle: 'solid' }
            : null,
        ]}
      >
        {!custom && <Icon name="plus" size={swatch * 0.45} color={colors.lilac} strokeWidth={2.4} />}
      </Pressable>

      <ColorPickerSheet
        visible={open}
        value={value}
        icon={icon}
        onClose={() => setOpen(false)}
        onSelect={(color) => {
          onChange(color);
          setOpen(false);
        }}
      />
    </View>
  );
}

type SheetProps = {
  visible: boolean;
  value: string;
  icon: string;
  onClose: () => void;
  onSelect: (color: string) => void;
};

function ColorPickerSheet({ visible, value, icon, onClose, onSelect }: SheetProps) {
  const insets = useSafeAreaInsets();
  const s = useStrings();

  return (
    <Sheet visible={visible} title={s.colors.pick} onClose={onClose}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.preview}>
          <View style={[styles.previewIcon, { backgroundColor: alpha(value, 0.14), borderColor: alpha(value, 0.3) }]}>
            <GoalIcon name={icon} size={30} color={value} />
          </View>
          <T size={13} color={colors.textTertiary}>
            {value.toUpperCase()}
          </T>
        </View>

        {extendedGoalColors.map((family, f) => (
          <View key={family.label} style={styles.group}>
            <T size={12} tracking={0.12} color={colors.textTertiary}>
              {s.colors.families[f].toUpperCase()}
            </T>
            <View style={styles.grid}>
              {family.values.map((color) => {
                const selected = same(color, value);
                return (
                  <Pressable
                    key={color}
                    accessibilityRole="button"
                    accessibilityLabel={`${s.colors.families[f]} ${color}`}
                    accessibilityState={{ selected }}
                    onPress={() => onSelect(color)}
                    style={({ pressed }) => [
                      styles.swatch,
                      { backgroundColor: color },
                      selected && styles.swatchSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    {selected && <Icon name="check" size={18} color={colors.onPrimary} strokeWidth={3} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  more: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(201,182,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { ...readable, paddingHorizontal: 20, paddingTop: 4, gap: 22 },
  preview: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  previewIcon: { width: 72, height: 72, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  group: { gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  swatch: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  swatchSelected: { borderWidth: 3, borderColor: colors.textStrong },
  pressed: { opacity: 0.7 },
});
