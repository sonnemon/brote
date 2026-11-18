import DateTimePicker from '@react-native-community/datetimepicker';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { useAccount } from '@/db/account';
import { getDefaultReminderTime, getReminderPermission, requestReminderPermission } from '@/db/reminders';
import type { Frequency } from '@/lib/progress';
import { defaultReminder, WEEKDAY_OPTIONS, type ReminderConfig } from '@/lib/reminders';
import { colors } from '@/theme/tokens';

import { Row } from './ListGroup';
import { openPlus } from './openPlus';
import { PlusBadge } from './PlusBadge';
import { T } from './T';
import { Toggle } from './Toggle';

/** Pide permiso si aún se puede; si iOS ya lo negó, lleva a Ajustes del sistema. */
export async function ensureReminderPermission(): Promise<boolean> {
  const permission = await getReminderPermission();
  if (permission === 'granted') return true;
  if (permission === 'undetermined') return requestReminderPermission();
  Alert.alert('Activa las notificaciones', 'Para recibir recordatorios, permite las notificaciones de Orbe en Ajustes.', [
    { text: 'Ahora no', style: 'cancel' },
    { text: 'Abrir Ajustes', onPress: () => void Linking.openSettings() },
  ]);
  return false;
}

export function dateFromTime({ hour, minute }: { hour: number; minute: number }): Date {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

type Props = {
  value: ReminderConfig | null;
  frequency: Frequency;
  onChange: (value: ReminderConfig | null) => void;
  last?: boolean;
};

export function ReminderRow({ value, frequency, onChange, last }: Props) {
  const { isPlus } = useAccount();

  if (!isPlus) return <Row label="Recordatorio" icon="bell" iconColor={colors.cyan} right={<PlusBadge />} onPress={openPlus} last={last} />;

  const toggle = async (on: boolean) => {
    if (!on) {
      onChange(null);
    } else if (await ensureReminderPermission()) {
      onChange(defaultReminder(frequency, new Date(), getDefaultReminderTime()));
    }
  };

  return (
    <>
      <Row
        label="Recordatorio"
        icon="bell"
        iconColor={colors.cyan}
        right={<Toggle label="Recordatorio" value={value !== null} onChange={(on) => void toggle(on)} />}
        last={last && !value}
      />
      {value && (
        <>
          <Row
            label="Hora"
            right={
              <DateTimePicker
                value={dateFromTime(value)}
                mode="time"
                display="compact"
                themeVariant="dark"
                accentColor={colors.lilac}
                locale="es-PE"
                onValueChange={(_, date) => onChange({ ...value, hour: date.getHours(), minute: date.getMinutes() })}
              />
            }
          />
          <View style={[styles.days, !last && styles.separator]}>
            <DayChip label="Todos" wide selected={value.weekday === null} onPress={() => onChange({ ...value, weekday: null })} />
            {WEEKDAY_OPTIONS.map((day) => (
              <DayChip
                key={day.value}
                label={day.label}
                accessibilityLabel={day.name}
                selected={value.weekday === day.value}
                onPress={() => onChange({ ...value, weekday: day.value })}
              />
            ))}
          </View>
        </>
      )}
    </>
  );
}

type DayChipProps = {
  label: string;
  accessibilityLabel?: string;
  selected: boolean;
  wide?: boolean;
  onPress: () => void;
};

function DayChip({ label, accessibilityLabel, selected, wide, onPress }: DayChipProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: selected }}
      hitSlop={4}
      onPress={onPress}
      style={[styles.day, wide && styles.dayWide, selected && styles.daySelected]}
    >
      <T size={12} weight={selected ? 600 : 400} color={selected ? colors.textStrong : colors.textSecondary}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  days: { paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  separator: { borderBottomWidth: 1, borderBottomColor: 'rgba(201,182,255,0.08)' },
  day: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(201,182,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayWide: { flex: 1.9 },
  daySelected: { borderWidth: 1.5, borderColor: colors.lilac, backgroundColor: 'rgba(201,182,255,0.18)' },
});
