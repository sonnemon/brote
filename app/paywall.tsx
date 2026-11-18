import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon, type UiIconName } from '@/components/Icon';
import { NebulaBackground } from '@/components/NebulaBackground';
import { T } from '@/components/T';
import { RoundButton } from '@/components/ui';
import { purchasePlan, restorePurchases, useAccount } from '@/db/account';
import { requestPermissionOnPlusActivated } from '@/db/reminders';
import { PLANS, PurchasesUnavailableError, type Plan, type PlanId } from '@/lib/purchases';
import { colors } from '@/theme/tokens';

const FEATURES: { label: string; free: boolean; icon?: UiIconName; iconColor?: string }[] = [
  { label: 'Metas ilimitadas', free: true },
  { label: 'Widgets y StandBy', free: true },
  { label: 'Guardado en tu celular', free: true },
  { label: 'Respaldo en la nube', free: false, icon: 'cloud', iconColor: colors.pink },
  { label: 'Recordatorios', free: false, icon: 'bell', iconColor: colors.cyan },
];

const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL;
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL;

function openLegal(url: string | undefined) {
  if (url) void Linking.openURL(url);
  else Alert.alert('Orbe Plus', 'Este documento estará disponible muy pronto.');
}

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { email } = useAccount();
  const [selected, setSelected] = useState<PlanId>('annual');
  const [busy, setBusy] = useState(false);
  const plan = PLANS.find((p) => p.id === selected)!;

  /** Con Plus activo se pasa a crear la cuenta, salvo que ya haya sesión. */
  const finish = () => {
    if (email) router.back();
    else router.replace('/auth');
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      Alert.alert(
        'Orbe Plus',
        error instanceof PurchasesUnavailableError
          ? 'Las compras aún no están disponibles.'
          : 'No se pudo completar. Inténtalo de nuevo.',
      );
    } finally {
      setBusy(false);
    }
  };

  const buy = () =>
    run(async () => {
      await purchasePlan(selected);
      await requestPermissionOnPlusActivated();
      finish();
    });

  const restore = () =>
    run(async () => {
      if (await restorePurchases()) {
        await requestPermissionOnPlusActivated();
        finish();
      } else Alert.alert('Orbe Plus', 'No encontramos una suscripción activa.');
    });

  return (
    <View style={styles.screen}>
      <NebulaBackground variant={0} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.nav}>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={restore} disabled={busy}>
            <T size={14} color={colors.textSecondary}>
              Restaurar
            </T>
          </Pressable>
          <RoundButton icon="close" label="Cerrar" onPress={() => router.back()} />
        </View>

        <View style={styles.hero}>
          <LinearGradient
            colors={['rgba(201,182,255,0.25)', 'rgba(255,158,207,0.25)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.brand}
          >
            <Icon name="orbit" size={13} color="#FFFFFF" />
            <T size={12} weight={600} tracking={0.1}>
              ORBE PLUS
            </T>
          </LinearGradient>
          <T size={30} weight={600} tracking={-0.02} color={colors.textStrong} style={styles.center}>
            Que tu meta te recuerde y nunca se pierda
          </T>
          <T size={14} color={colors.textSecondary} style={[styles.center, styles.lead]}>
            Gratis, todo se guarda en tu celular.{'\n'}Con Plus, también en la nube.
          </T>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHead]}>
            <View style={styles.flex} />
            <T size={12} color={colors.textTertiary} style={styles.col}>
              Gratis
            </T>
            <T size={12} weight={600} color={colors.lilac} style={styles.col}>
              Plus
            </T>
          </View>
          {FEATURES.map((feature) => (
            <View key={feature.label} style={[styles.tableRow, !feature.free && styles.highlight]}>
              <View style={styles.feature}>
                {feature.icon && <Icon name={feature.icon} size={16} color={feature.iconColor!} />}
                <T size={14} weight={feature.free ? 400 : 600}>
                  {feature.label}
                </T>
              </View>
              <View style={styles.col}>
                <Icon
                  name={feature.free ? 'check' : 'close'}
                  size={feature.free ? 16 : 14}
                  color={feature.free ? colors.textSecondary : '#6E6894'}
                  strokeWidth={2.6}
                />
              </View>
              <View style={styles.col}>
                <Icon name="check" size={16} color={colors.lilac} strokeWidth={2.6} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          {PLANS.map((item) => (
            <PlanCard key={item.id} plan={item} selected={item.id === selected} onPress={() => setSelected(item.id)} />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button title={busy ? 'Un momento…' : plan.cta} onPress={buy} disabled={busy} style={styles.stretch} />
        <T size={11} color={colors.textTertiary} style={styles.center}>
          Se renueva automáticamente. Cancela cuando quieras desde App Store.
        </T>
        <View style={styles.legal}>
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => openLegal(TERMS_URL)}>
            <T size={12} color={colors.lilac}>
              Términos
            </T>
          </Pressable>
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => openLegal(PRIVACY_URL)}>
            <T size={12} color={colors.lilac}>
              Privacidad
            </T>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function PlanCard({ plan, selected, onPress }: { plan: Plan; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.plan, selected && styles.planSelected]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <Icon name="check" size={12} color={colors.onPrimary} strokeWidth={3.5} />}
      </View>
      <View style={styles.flex}>
        <T size={16} weight={selected ? 600 : 500}>
          {plan.title}
        </T>
        {plan.note && (
          <T size={12} color={colors.lilacSoft}>
            {plan.note}
          </T>
        )}
      </View>
      <T size={selected ? 18 : 16} weight={600}>
        {plan.price}
      </T>
      {plan.badge && (
        <LinearGradient
          colors={[colors.pink, colors.lilac]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.badge}
        >
          <T size={11} weight={700} color={colors.onPrimary}>
            {plan.badge}
          </T>
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  stretch: { alignSelf: 'stretch' },
  content: { paddingHorizontal: 20, paddingBottom: 12, gap: 16 },
  nav: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hero: { alignItems: 'center', gap: 8 },
  brand: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lead: { lineHeight: 20 },
  table: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(201,182,255,0.14)',
    backgroundColor: 'rgba(20,17,42,0.72)',
    overflow: 'hidden',
  },
  tableRow: {
    minHeight: 40,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(201,182,255,0.06)',
  },
  tableHead: { minHeight: 34, borderTopWidth: 0 },
  highlight: { minHeight: 46, backgroundColor: 'rgba(201,182,255,0.06)' },
  feature: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  col: { width: 64, alignItems: 'center', textAlign: 'center' },
  plans: { gap: 10, paddingTop: 4 },
  plan: {
    minHeight: 62,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(201,182,255,0.18)',
    backgroundColor: 'rgba(20,17,42,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  planSelected: { borderWidth: 1.5, borderColor: colors.lilac, backgroundColor: 'rgba(201,182,255,0.14)' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(201,182,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderWidth: 0, backgroundColor: colors.lilac },
  badge: { position: 'absolute', right: 16, top: -11, height: 22, paddingHorizontal: 10, borderRadius: 11, justifyContent: 'center' },
  footer: { paddingHorizontal: 20, paddingTop: 8, alignItems: 'center', gap: 8 },
  legal: { flexDirection: 'row', gap: 14 },
});
