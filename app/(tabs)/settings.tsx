import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Row, Section } from '@/components/ListGroup';
import { NebulaBackground } from '@/components/NebulaBackground';
import { openPlus } from '@/components/openPlus';
import { TAB_BAR_SPACE } from '@/components/OrbeTabBar';
import { PlusBadge } from '@/components/PlusBadge';
import { dateFromTime, ensureReminderPermission } from '@/components/ReminderRow';
import { T } from '@/components/T';
import { Toggle } from '@/components/Toggle';
import {
  clearDevPlus,
  deleteAccount,
  requestSync,
  setDevTrialEnded,
  signOut,
  syncBeforeSignOut,
  useAccount,
  type Account,
} from '@/db/account';
import { exportCsv } from '@/db/export';
import { setLanguagePref } from '@/db/language';
import {
  areRemindersEnabled,
  debugReminders,
  getDefaultReminderTime,
  setDefaultReminderTime,
  setRemindersEnabled,
} from '@/db/reminders';
import { archiveGoal, useArchivedGoals } from '@/db/store';
import type { TimeOfDay } from '@/lib/reminders';
import { strings, useLang, useStrings, type Lang } from '@/i18n';
import { colors, readable } from '@/theme/tokens';

const LANGUAGES: { value: Lang; label: string }[] = [
  { value: 'es', label: 'ES' },
  { value: 'en', label: 'EN' },
];

/** Interruptor ES / EN. Hasta que el usuario elija, refleja el idioma del celular. */
function LanguageSwitch() {
  const lang = useLang();
  return (
    <View style={styles.switch} accessibilityRole="radiogroup">
      {LANGUAGES.map(({ value, label }) => {
        const selected = lang === value;
        return (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityLabel={value === 'es' ? 'Español' : 'English'}
            accessibilityState={{ checked: selected }}
            hitSlop={4}
            onPress={() => setLanguagePref(value)}
            style={[styles.switchOption, selected && styles.switchSelected]}
          >
            <T size={12} weight={selected ? 600 : 500} color={selected ? colors.onPrimary : colors.textSecondary}>
              {label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

function backupStatus(account: Account): string {
  const s = strings().settings;
  if (!account.email) return s.signIn;
  if (account.syncStatus === 'syncing') return s.syncing;
  if (account.syncStatus === 'error') return s.retry;
  return account.lastSyncAt ? s.upToDate : s.pending;
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
  const s = useStrings();
  const archived = useArchivedGoals();

  const account = useAccount();
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

  const [signingOut, setSigningOut] = useState(false);

  const confirmSignOut = async () => {
    if (signingOut) return;
    // Primero se respalda lo pendiente; si algo no se pudo subir, se avisa que se perderá.
    setSigningOut(true);
    const backedUp = await syncBeforeSignOut();
    setSigningOut(false);
    Alert.alert(s.settings.signOut, backedUp ? s.settings.signOutText : s.settings.signOutUnsaved, [
      { text: s.common.cancel, style: 'cancel' },
      { text: s.settings.signOut, style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const [deleting, setDeleting] = useState(false);

  const runDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
    } catch {
      Alert.alert(s.settings.deleteAccountError, s.common.tryAgain);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteAccount = () => {
    if (deleting) return;
    Alert.alert(s.settings.deleteAccountTitle, s.settings.deleteAccountText, [
      { text: s.common.cancel, style: 'cancel' },
      { text: s.settings.deleteAccountConfirm, style: 'destructive', onPress: () => void runDeleteAccount() },
    ]);
  };

  const handleExport = () => {
    exportCsv().catch(() => Alert.alert(s.settings.exportError, s.common.tryAgain));
  };

  return (
    <View style={styles.screen}>
      <NebulaBackground variant={3} dim />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: TAB_BAR_SPACE }]}
        showsVerticalScrollIndicator={false}
      >
        <T size={30} weight={600} tracking={-0.02} color={colors.textStrong} style={styles.title}>
          {s.settings.title}
        </T>

        <Section title={s.settings.pro}>
          <Row
            label={s.settings.proRow}
            icon="sprout"
            value={
              account.purchased
                ? s.settings.proLifetime
                : account.trialDaysLeft > 0
                  ? s.settings.proTrial(account.trialDaysLeft)
                  : s.settings.proUnlock
            }
            valueColor={account.purchased ? colors.textSecondary : colors.lilac}
            onPress={account.purchased ? undefined : openPlus}
            last
          />
        </Section>

        <Section title={s.settings.reminders}>
          <Row
            label={s.settings.remindersRow}
            icon="bell"
            iconColor={colors.cyan}
            right={
              account.isPlus ? (
                <Toggle label={s.settings.remindersRow} value={remindersOn} onChange={(on) => void changeReminders(on)} />
              ) : (
                <PlusButton label={s.settings.unlockReminders} />
              )
            }
            last={!account.isPlus || !remindersOn}
          />
          {account.isPlus && remindersOn && (
            <Row
              label={s.settings.defaultTime}
              last
              right={
                <DateTimePicker
                  value={dateFromTime(defaultTime)}
                  mode="time"
                  display="compact"
                  themeVariant="dark"
                  accentColor={colors.lilac}
                  locale={s.locale}
                  onValueChange={(_, date) => changeDefaultTime({ hour: date.getHours(), minute: date.getMinutes() })}
                />
              }
            />
          )}
        </Section>

        <Section title={s.settings.preferences}>
          <Row label={s.settings.language} icon="globe" iconColor={colors.cyan} right={<LanguageSwitch />} last />
        </Section>

        <Section title={s.settings.data}>
          {account.isPlus ? (
            <Row
              label={s.settings.backup}
              icon="cloud"
              iconColor={colors.pink}
              value={backupStatus(account)}
              onPress={account.email ? () => requestSync() : () => router.push('/auth')}
            />
          ) : (
            <Row
              label={s.settings.backup}
              icon="cloud"
              iconColor={colors.pink}
              right={<PlusButton label={s.settings.unlockBackup} />}
            />
          )}
          {account.email ? (
            <Row
              label={account.email}
              icon="user"
              value={signingOut ? s.settings.syncing : s.settings.signOut}
              onPress={() => void confirmSignOut()}
              dimmed={signingOut}
            />
          ) : (
            // Con Pro activo, "Respaldo en la nube" ya lleva a iniciar sesión.
            !account.isPlus && <Row
              label={s.settings.signIn}
              icon="user"
              value={s.settings.recoverGoals}
              onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin' } })}
            />
          )}
          <Row label={s.settings.export} icon="download" iconColor={colors.cyan} value="CSV" onPress={handleExport} last />
        </Section>

        {archived.length > 0 && (
          <Section title={s.settings.archived}>
            {archived.map((goal, i) => (
              <Row
                key={goal.id}
                label={goal.name}
                last={i === archived.length - 1}
                right={
                  <Pressable accessibilityRole="button" hitSlop={8} onPress={() => archiveGoal(goal.id, false)}>
                    <T size={14} weight={600} color={colors.lilac}>
                      {s.settings.restore}
                    </T>
                  </Pressable>
                }
              />
            ))}
          </Section>
        )}

        {account.email && (
          <Section>
            <Row
              label={s.settings.deleteAccount}
              icon="trash"
              iconColor={colors.danger}
              labelColor={colors.danger}
              value={deleting ? s.settings.deletingAccount : undefined}
              onPress={confirmDeleteAccount}
              dimmed={deleting}
              last
            />
          </Section>
        )}

        {__DEV__ && (
          <Section title={s.settings.dev}>
            {account.isPlus && (
              <Row
                label={s.settings.testReminder}
                icon="bell"
                onPress={() => void debugReminders().then((summary) => Alert.alert(s.settings.remindersRow, summary))}
              />
            )}
            <Row
              label={account.trialDaysLeft > 0 ? s.settings.endTrial : s.settings.restartTrial}
              icon="calendar"
              onPress={() => setDevTrialEnded(account.trialDaysLeft > 0)}
            />
            <Row label={s.settings.removePlus} icon="close" onPress={clearDevPlus} last />
          </Section>
        )}

        <View style={styles.footer}>
          <T size={12} color={colors.textTertiary}>
            {account.email ? s.settings.footerBackup : s.settings.footerLocal}
          </T>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { ...readable, paddingHorizontal: 20, gap: 14 },
  title: { height: 44, lineHeight: 44 },
  footer: { alignItems: 'center', paddingTop: 4 },
  switch: {
    flexDirection: 'row',
    padding: 3,
    gap: 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(20,17,42,0.8)',
  },
  switchOption: { minWidth: 40, height: 26, paddingHorizontal: 10, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  switchSelected: { backgroundColor: colors.lilac },
});
