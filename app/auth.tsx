import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { NebulaBackground } from '@/components/NebulaBackground';
import { T } from '@/components/T';
import { Field } from '@/components/ui';
import { CloudNotConfiguredError, sendEmailCode, verifyEmailCode } from '@/db/account';
import { markOnboarded } from '@/db/store';
import { isReviewEmail, isValidEmail } from '@/lib/purchases';
import { strings, useStrings } from '@/i18n';
import { colors } from '@/theme/tokens';

/** Si se abrió por enlace no hay pantalla detrás: se va al inicio. */
function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof CloudNotConfiguredError ? strings().auth.notConfigured : fallback;
}

/**
 * Correo + código. `mode=signin` es para quien ya tiene Pro y cambió de celular: al entrar se trae
 * su Pro y sus metas desde la nube. `mode=purchase` va antes de comprar o restaurar Pro, que siempre
 * queda en una cuenta. `from=onboarding` salta la bienvenida al terminar.
 */
export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const s = useStrings();
  const { mode, from } = useLocalSearchParams<{ mode?: string; from?: string }>();
  const signIn = mode === 'signin';
  // Antes de comprar o restaurar Pro: la compra queda en la cuenta.
  const purchase = mode === 'purchase';
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // La cuenta de revisión de App Store escribe una contraseña en lugar del código.
  const review = isReviewEmail(email);

  const send = async () => {
    if (!isValidEmail(email)) {
      setError(s.auth.invalidEmail);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendEmailCode(email);
      setCodeSent(true);
    } catch (e) {
      setError(errorMessage(e, s.auth.sendFailed));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (code.trim().length < 6) {
      setError(s.auth.incompleteCode);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await verifyEmailCode(email, code);
      if (from === 'onboarding') {
        markOnboarded();
        router.replace('/');
      } else {
        leave();
      }
    } catch (e) {
      setError(errorMessage(e, s.auth.wrongCode));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <NebulaBackground variant={3} dim />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 60 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.icon}>
            <Icon name="cloud" size={26} color={colors.pink} />
          </View>
          <View style={styles.copy}>
            <T size={28} weight={600} tracking={-0.02} color={colors.textStrong}>
              {codeSent ? s.auth.checkEmail : signIn ? s.auth.signInTitle : purchase ? s.auth.purchaseTitle : s.auth.activate}
            </T>
            <T size={14} color={colors.textSecondary} style={styles.lead}>
              {codeSent
                ? review
                  ? s.auth.reviewPassword
                  : s.auth.sent(email.trim())
                : signIn
                  ? s.auth.signInExplain
                  : purchase
                    ? s.auth.purchaseExplain
                    : s.auth.explain}
            </T>
          </View>

          {codeSent ? (
            review ? (
              <Field
                label={s.auth.password}
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  setError(null);
                }}
                secureTextEntry
                textContentType="password"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            ) : (
              <Field
                label={s.auth.code}
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  setError(null);
                }}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={8}
                autoFocus
              />
            )
          ) : (
            <Field
              label={s.auth.email}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={s.auth.emailPlaceholder}
            />
          )}

          {error && (
            <T size={13} color={colors.danger} accessibilityLiveRegion="polite">
              {error}
            </T>
          )}

          {codeSent && (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                setCodeSent(false);
                setCode('');
                setError(null);
              }}
            >
              <T size={14} color={colors.lilac}>
                {s.auth.otherEmail}
              </T>
            </Pressable>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button
            title={busy ? s.common.wait : codeSent ? s.auth.confirm : s.auth.send}
            onPress={codeSent ? verify : send}
            disabled={busy}
            style={styles.stretch}
          />
          <Pressable accessibilityRole="button" hitSlop={8} onPress={leave}>
            <T size={14} color={colors.textSecondary}>
              {s.reminders.notNow}
            </T>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,158,207,0.3)',
    backgroundColor: 'rgba(255,158,207,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { gap: 8 },
  lead: { lineHeight: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 8, alignItems: 'center', gap: 14 },
  stretch: { alignSelf: 'stretch' },
});
