import { getLocales } from 'expo-localization';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon, type UiIconName } from '@/components/Icon';
import { NebulaBackground } from '@/components/NebulaBackground';
import { T } from '@/components/T';
import { RoundButton } from '@/components/ui';
import { purchasePlan, restorePurchases, useAccount } from '@/db/account';
import { requestPermissionOnPlusActivated } from '@/db/reminders';
import { getLifetimePriceString } from '@/db/revenuecat';
import { lifetimePrice, PurchaseCancelledError, PurchasesUnavailableError } from '@/lib/purchases';
import { strings, useStrings } from '@/i18n';
import { brandFont, colors } from '@/theme/tokens';

/** Mismo orden que `paywall.features` en i18n. */
const FEATURES: { free: boolean; icon?: UiIconName; iconColor?: string }[] = [
  { free: true },
  { free: true },
  { free: false, icon: 'sprout', iconColor: colors.lilac },
  { free: false, icon: 'cloud', iconColor: colors.pink },
  { free: false, icon: 'bell', iconColor: colors.cyan },
];

const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL;
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL;

function openLegal(url: string | undefined) {
  if (url) void Linking.openURL(url);
  else Alert.alert('Brote Pro', strings().paywall.soon);
}

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const s = useStrings();
  const { email, trialDaysLeft, purchased, cloudConfigured } = useAccount();
  // Pro siempre queda en una cuenta: sin sesión, primero se inicia sesión y luego se sigue con la compra.
  const needsAccount = cloudConfigured && !email;
  const pending = useRef<'buy' | 'restore' | null>(null);
  const [busy, setBusy] = useState(false);
  // Precio real de la tienda (moneda del usuario); mientras carga, o sin RevenueCat, el de lista.
  const [storePrice, setStorePrice] = useState<string | null>(null);
  const price = storePrice ?? lifetimePrice(getLocales()[0]?.currencyCode);

  useEffect(() => {
    let active = true;
    void getLifetimePriceString().then((value) => {
      if (active) setStorePrice(value);
    });
    return () => {
      active = false;
    };
  }, []);

  const finish = () => router.back();

  const askAccount = (action: 'buy' | 'restore') => {
    pending.current = action;
    router.push({ pathname: '/auth', params: { mode: 'purchase' } });
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      if (error instanceof PurchaseCancelledError) return;
      Alert.alert(
        'Brote Pro',
        error instanceof PurchasesUnavailableError
          ? s.paywall.unavailable
          : s.paywall.failed,
      );
    } finally {
      setBusy(false);
    }
  };

  const buy = () => {
    if (needsAccount) return askAccount('buy');
    return run(async () => {
      await purchasePlan('lifetime');
      await requestPermissionOnPlusActivated();
      finish();
    });
  };

  const restore = () => {
    if (needsAccount) return askAccount('restore');
    return run(async () => {
      if (await restorePurchases()) {
        await requestPermissionOnPlusActivated();
        finish();
      } else Alert.alert('Brote Pro', s.paywall.noPurchase);
    });
  };

  // Al volver de iniciar sesión: si la cuenta ya tenía Pro, listo; si no, se sigue con lo que pidió.
  useEffect(() => {
    const action = pending.current;
    if (!email || !action) return;
    pending.current = null;
    if (purchased) finish();
    else if (action === 'buy') void buy();
    else void restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, purchased]);

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
              {s.paywall.restore}
            </T>
          </Pressable>
          <RoundButton icon="close" label={s.common.close} onPress={() => router.back()} />
        </View>

        <View style={styles.hero}>
          <LinearGradient
            colors={['rgba(201,182,255,0.25)', 'rgba(255,158,207,0.25)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.brand}
          >
            <Image source={require('../assets/icons/logo.png')} style={styles.brandLogo} accessibilityIgnoresInvertColors />
            <T size={16} color={colors.textStrong} style={styles.brandText}>
              Brote <T size={16} color={colors.lilac} style={styles.brandText}>Pro</T>
            </T>
          </LinearGradient>
          <T size={30} weight={600} tracking={-0.02} color={colors.textStrong} style={styles.center}>
            {s.paywall.headline}
          </T>
          <T size={14} color={colors.textSecondary} style={[styles.center, styles.lead]}>
            {trialDaysLeft > 0 ? s.paywall.trialLeft(trialDaysLeft) : s.paywall.trialEnded}
          </T>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHead]}>
            <View style={styles.flex} />
            <T size={12} color={colors.textTertiary} style={styles.col}>
              {s.paywall.free}
            </T>
            <T size={12} weight={600} color={colors.lilac} style={styles.col}>
              Pro
            </T>
          </View>
          {FEATURES.map((feature, i) => (
            <View key={i} style={[styles.tableRow, !feature.free && styles.highlight]}>
              <View style={styles.feature}>
                {feature.icon && <Icon name={feature.icon} size={16} color={feature.iconColor!} />}
                <T size={14} weight={feature.free ? 400 : 600}>
                  {s.paywall.features[i]}
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

        <View style={styles.plan}>
          <View style={styles.flex}>
            <T size={16} weight={600}>
              {s.paywall.lifetime}
            </T>
            <T size={12} color={colors.lilacSoft}>
              {s.paywall.oneTime}
            </T>
          </View>
          <T size={20} weight={600} color={colors.textStrong}>
            {price}
          </T>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button title={busy ? s.common.wait : s.paywall.cta(price)} onPress={buy} disabled={busy} style={styles.stretch} />
        <T size={11} color={colors.textTertiary} style={styles.center}>
          {s.paywall.noRenewal}
        </T>
        {needsAccount && (
          <T size={11} color={colors.textTertiary} style={styles.center}>
            {s.paywall.accountNote}
          </T>
        )}
        {!email && (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin' } })}
          >
            <T size={13} color={colors.textSecondary}>
              {s.paywall.alreadyPro} <T size={13} weight={600} color={colors.lilac}>{s.onboarding.signIn}</T>
            </T>
          </Pressable>
        )}
        <View style={styles.legal}>
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => openLegal(TERMS_URL)}>
            <T size={12} color={colors.lilac}>
              {s.paywall.terms}
            </T>
          </Pressable>
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => openLegal(PRIVACY_URL)}>
            <T size={12} color={colors.lilac}>
              {s.paywall.privacy}
            </T>
          </Pressable>
        </View>
      </View>
    </View>
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
    height: 34,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandLogo: { width: 26, height: 26 },
  brandText: { fontFamily: brandFont, lineHeight: 20 },
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
  plan: {
    minHeight: 72,
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.lilac,
    backgroundColor: 'rgba(201,182,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  footer: { paddingHorizontal: 20, paddingTop: 8, alignItems: 'center', gap: 8 },
  legal: { flexDirection: 'row', gap: 14 },
});
