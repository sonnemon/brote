import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStrings } from '@/i18n';
import { categoryLabel, GOAL_ICONS, ICON_CATEGORIES, iconLabel, resolveIconKey, searchIcons } from '@/lib/goalIcons';
import { alpha, colors } from '@/theme/tokens';

import { GoalIcon } from './GoalIcon';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { T } from './T';
import { Field } from './ui';

type ButtonProps = {
  value: string;
  color: string;
  suggestions: string[];
  onChange: (icon: string) => void;
  size?: number;
};

/** Icono actual al costado del nombre; al tocarlo abre el catálogo completo. */
export function IconButton({ value, color, suggestions, onChange, size = 52 }: ButtonProps) {
  const [open, setOpen] = useState(false);
  const s = useStrings();
  const current = resolveIconKey(value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={s.icons.current(iconLabel(current))}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.button,
          { width: size, height: size },
          pressed && styles.pressed,
        ]}
      >
        <GoalIcon name={current} size={size * 0.46} color={color} />
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Icon name="more" size={10} color={colors.onPrimary} strokeWidth={3} />
        </View>
      </Pressable>
      <IconPickerSheet
        visible={open}
        value={current}
        color={color}
        suggestions={suggestions}
        onClose={() => setOpen(false)}
        onSelect={(icon) => {
          onChange(icon);
          setOpen(false);
        }}
      />
    </>
  );
}

type SheetProps = {
  visible: boolean;
  value: string;
  color: string;
  suggestions: string[];
  onClose: () => void;
  onSelect: (icon: string) => void;
};

function IconPickerSheet({ visible, value, color, suggestions, onClose, onSelect }: SheetProps) {
  const insets = useSafeAreaInsets();
  const s = useStrings();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchIcons(query), [query]);
  const searching = query.trim() !== '';

  const close = () => {
    setQuery('');
    onClose();
  };
  const select = (icon: string) => {
    setQuery('');
    onSelect(icon);
  };

  return (
    <Sheet visible={visible} title={s.icons.pick} onClose={close}>
      <View style={styles.search}>
        <Field
          value={query}
          onChangeText={setQuery}
          placeholder={s.icons.search}
          accessibilityLabel={s.icons.searchLabel}
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
      <ScrollView
        contentContainerStyle={[styles.sheetContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {searching ? (
          results.length > 0 ? (
            <IconGrid icons={results.map((i) => i.key)} value={value} color={color} onSelect={select} />
          ) : (
            <T size={14} color={colors.textSecondary} style={styles.empty}>
              {s.icons.noResults(query.trim())}
            </T>
          )
        ) : (
          <>
            <Group title={s.icons.suggested}>
              <IconGrid icons={suggestions} value={value} color={color} onSelect={select} />
            </Group>
            {ICON_CATEGORIES.map((category) => (
              <Group key={category.id} title={categoryLabel(category).toUpperCase()}>
                <IconGrid
                  icons={GOAL_ICONS.filter((i) => i.category === category.id).map((i) => i.key)}
                  value={value}
                  color={color}
                  onSelect={select}
                />
              </Group>
            ))}
          </>
        )}
      </ScrollView>
    </Sheet>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <T size={12} tracking={0.12} color={colors.textTertiary}>
        {title}
      </T>
      {children}
    </View>
  );
}

function IconGrid({
  icons,
  value,
  color,
  onSelect,
}: {
  icons: string[];
  value: string;
  color: string;
  onSelect: (icon: string) => void;
}) {
  return (
    <View style={styles.grid}>
      {icons.map((icon) => (
        <IconTile key={icon} icon={icon} color={color} selected={icon === value} onPress={() => onSelect(icon)} />
      ))}
    </View>
  );
}

type TileProps = { icon: string; color: string; selected?: boolean; size?: number; onPress?: () => void };

export function IconTile({ icon, color, selected, size = 52, onPress }: TileProps) {
  const tile = [
    styles.tile,
    { width: size, height: size, borderRadius: size * 0.32 },
    selected
      ? { backgroundColor: alpha(color, 0.18), borderColor: color, borderWidth: 1.5 }
      : { backgroundColor: 'rgba(20,17,42,0.65)', borderColor: colors.border },
  ];
  const glyph = <GoalIcon name={icon} size={size * 0.44} color={selected ? color : colors.textSecondary} />;
  if (!onPress) return <View style={tile}>{glyph}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={iconLabel(icon)}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [tile, pressed && styles.pressed]}
    >
      {glyph}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  search: { paddingHorizontal: 20, paddingBottom: 8 },
  sheetContent: { paddingHorizontal: 20, paddingTop: 8, gap: 22 },
  group: { gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', marginTop: 24 },
});
