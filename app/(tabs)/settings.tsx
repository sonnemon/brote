import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActionSheetIOS, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Row, Section } from '@/components/ListGroup';
import { NebulaBackground } from '@/components/NebulaBackground';
import { openPlus } from '@/components/openPlus';
import { TAB_BAR_SPACE } from '@/components/OrbeTabBar';
import { PlusBadge } from '@/components/PlusBadge';
import { dateFromTime, ensureReminderPermission } from '@/components/ReminderRow';
import { T } from '@/components/T';
import { Toggle } from '@/components/Toggle';
import { clearDevPlus, requestSync, signOut, useAccount, type Account } from '@/db/account';
import { exportCsv } from '@/db/export';
import {
  areRemindersEnabled,
  debugReminders,
  getDefaultReminderTime,
  setDefaultReminderTime,
  setRemindersEnabled,
} from '@/db/reminders';
import { archiveGoal, useArchivedGoals, useGoals } from '@/db/store';
import { getWidgetGoalId, setWidgetGoalId } from '@/db/widgets';
import type { TimeOfDay } from '@/lib/reminders';
import { selectWidgetGoal } from '@/lib/widgetData';
import { colors } from '@/theme/tokens';

function backupStatus(account: Account): string {
  if (!account.email) return 'Iniciar sesión';
  if (account.syncStatus === 'syncing') return 'Sincronizando…';
  if (account.syncStatus === 'error') return 'Reintentar';
  return account.lastSyncAt ? 'Al día' : 'Pendiente';
}

function PlusButton({ label }: { label: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={8} onPress={openPlus}>
      <PlusBadge />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const archived = useArchivedGoals();
  const account = useAccount();
  const goals = useGoals();
  const [widgetGoalId, setWidgetGoalIdState] = useState(getWidgetGoalId);
  const widgetGoal = selectWidgetGoal(goals, widgetGoalId);

  const chooseWidgetGoal = () => {
    const names = goals.map((goal) => goal.name);
    ActionSheetIOS.showActionSheetWithOptions(
      { title: 'Meta en widgets', options: [...names, 'Cancelar'], cancelButtonIndex: names.length, userInterfaceStyle: 'dark' },
      (index) => {
        if (index >= names.length) return;
        setWidgetGoalId(goals[index].id);
        setWidgetGoalIdState(goals[index].id);
      },
    );
  };
  const [remindersOn, setRemindersOn] = useState(areRemindersEnabled);
  const [defaultTime, setDefaultTime] = useState(getDefaultReminderTime);

  const changeReminders = async (on: boolean) => {
    if (on && !(await ensureReminderPermission())) return;
    setRemindersEnabled(on);
    setRemindersOn(on);
  };

  const changeDefaultTime = (time: TimeOfDay) => {
    setDefaultReminderTime(time);
    setDefaultTime(time);
  };

  const confirmSignOut = () => {
    Alert.alert('Cerrar sesión', 'Tus metas seguirán en este celular, pero dejarán de respaldarse.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const handleExport = () => {
    exportCsv().catch(() => Alert.alert('No se pudo exportar', 'Inténtalo de nuevo en un momento.'));
  };

  return (
    <View style={styles.screen}>
      <NebulaBackground variant={3} dim />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: TAB_BAR_SPACE }]}
        showsVerticalScrollIndicator={false}
      >
        <T size={30} weight={600} tracking={-0.02} color={colors.textStrong} style={styles.title}>
          Ajustes
        </T>

        <Section title="RECORDATORIOS">
          <Row
            label="Recordatorios"
            icon="bell"
            iconColor={colors.cyan}
            right={
              account.isPlus ? (
                <Toggle label="Recordatorios" value={remindersOn} onChange={(on) => void changeReminders(on)} />
              ) : (
                <PlusButton label="Desbloquear recordatorios con Plus" />
              )
            }
            last={!account.isPlus || !remindersOn}
          />
          {account.isPlus && remindersOn && (
            <Row
              label="Hora por defecto"
              last
              right={
                <DateTimePicker
                  value={dateFromTime(defaultTime)}
                  mode="time"
                  display="compact"
                  themeVariant="dark"
                  accentColor={colors.lilac}
                  locale="es-PE"
                  onValueChange={(_, date) => changeDefaultTime({ hour: date.getHours(), minute: date.getMinutes() })}
                />
              }
            />
          )}
        </Section>

        <Section title="PREFERENCIAS">
          <Row label="Unidades" icon="scale" value="Métrico" />
          <Row label="Moneda" icon="coin" iconColor={colors.amber} value="S/ · PEN" />
          <Row label="Tema" icon="moon" iconColor={colors.pink} value="Nébula" last />
        </Section>

        {goals.length > 0 && (
          <Section title="WIDGETS">
            <Row
              label="Meta en widgets"
              icon="orbit"
              value={widgetGoal?.name}
              onPress={chooseWidgetGoal}
              last
            />
          </Section>
        )}

        <Section title="DATOS">
          {account.isPlus ? (
            <Row
              label="Respaldo en la nube"
              icon="cloud"
              iconColor={colors.pink}
              value={backupStatus(account)}
              onPress={account.email ? () => requestSync() : () => router.push('/auth')}
            />
          ) : (
            <Row
              label="Respaldo en la nube"
              icon="cloud"
              iconColor={colors.pink}
              right={<PlusButton label="Desbloquear respaldo con Plus" />}
            />
          )}
          {account.email && <Row label={account.email} icon="user" value="Cerrar sesión" onPress={confirmSignOut} />}
          <Row label="Exportar datos" icon="download" iconColor={colors.cyan} value="CSV" onPress={handleExport} last />
        </Section>

        {archived.length > 0 && (
          <Section title="ARCHIVADAS">
            {archived.map((goal, i) => (
              <Row
                key={goal.id}
                label={goal.name}
                last={i === archived.length - 1}
                right={
                  <Pressable accessibilityRole="button" hitSlop={8} onPress={() => archiveGoal(goal.id, false)}>
                    <T size={14} weight={600} color={colors.lilac}>
                      Restaurar
                    </T>
                  </Pressable>
                }
              />
            ))}
          </Section>
        )}

        {__DEV__ && account.isPlus && (
          <Section title="DESARROLLO">
            <Row
              label="Probar recordatorio en 5 s"
              icon="bell"
              onPress={() => void debugReminders().then((summary) => Alert.alert('Recordatorios', summary))}
            />
            <Row label="Quitar Plus de prueba" icon="close" onPress={clearDevPlus} last />
          </Section>
        )}

        <View style={styles.footer}>
          <T size={12} color={colors.textTertiary}>
            {account.email ? 'Tus datos están en tu celular y en tu respaldo.' : 'Tus datos se quedan en tu celular.'}
          </T>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, gap: 14 },
  title: { height: 44, lineHeight: 44 },
  footer: { alignItems: 'center', paddingTop: 4 },
});
