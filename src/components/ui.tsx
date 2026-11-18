import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, gradients } from '@/theme/tokens';

import { Icon, type UiIconName } from './Icon';
import { T } from './T';

export function RoundButton({ icon, label, onPress }: { icon: UiIconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.round}>
      <Icon name={icon} size={18} color={colors.text} strokeWidth={2.4} />
    </Pressable>
  );
}

type FieldProps = TextInputProps & { label?: string; suffix?: string; error?: boolean };

export function Field({ label, suffix, error, style, ...rest }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      {label && (
        <T size={13} color={colors.textSecondary}>
          {label}
        </T>
      )}
      <View>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textTertiary}
          keyboardAppearance="dark"
          selectionColor={colors.lilac}
          selectTextOnFocus={rest.keyboardType === 'decimal-pad'}
          {...rest}
          style={[styles.input, suffix ? { paddingRight: 56 } : null, error && { borderColor: colors.danger }, style]}
        />
        {suffix && (
          <T size={14} color={colors.textTertiary} style={styles.suffix}>
            {suffix}
          </T>
        )}
      </View>
    </View>
  );
}

type SegmentedProps<V extends string> = {
  options: { value: V; label: string }[];
  value: V;
  onChange: (value: V) => void;
};

export function Segmented<V extends string>({ options, value, onChange }: SegmentedProps<V>) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <T size={14} weight={selected ? 600 : 400} color={selected ? colors.textStrong : colors.textSecondary}>
              {option.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressBar({ progress, height = 6 }: { progress: number; height?: number }) {
  return (
    <View style={[styles.barTrack, { height, borderRadius: height / 2 }]}>
      <LinearGradient
        colors={gradients.bar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: `${Math.round(progress * 100)}%`, height, borderRadius: height / 2 }}
      />
    </View>
  );
}

export function StepBars({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.stepBars}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.stepBar, i < step && { backgroundColor: colors.lilac }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(201,182,255,0.2)',
    backgroundColor: 'rgba(23,19,44,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldWrap: { gap: 8 },
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    color: colors.textStrong,
    fontFamily: fonts[500],
    fontSize: 16,
  },
  suffix: { position: 'absolute', right: 16, top: 16 },
  segmented: {
    height: 48,
    padding: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    gap: 4,
  },
  segment: { flex: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: 'rgba(201,182,255,0.26)' },
  barTrack: { flex: 1, backgroundColor: colors.track, overflow: 'hidden' },
  stepBars: { flexDirection: 'row', gap: 6 },
  stepBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(201,182,255,0.18)' },
});
