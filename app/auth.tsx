import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { NebulaBackground } from '@/components/NebulaBackground';
import { T } from '@/components/T';
import { Field } from '@/components/ui';
import { CloudNotConfiguredError, sendEmailCode, verifyEmailCode } from '@/db/account';
import { isValidEmail } from '@/lib/purchases';
import { colors } from '@/theme/tokens';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof CloudNotConfiguredError ? 'La nube aún no está configurada en esta versión.' : fallback;
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!isValidEmail(email)) {
      setError('Escribe un correo válido.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendEmailCode(email);
      setCodeSent(true);
    } catch (e) {
      setError(errorMessage(e, 'No pudimos enviar el código. Revisa tu conexión e inténtalo de nuevo.'));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (code.trim().length < 6) {
      setError('Escribe el código completo.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await verifyEmailCode(email, code);
      router.back();
    } catch (e) {
      setError(errorMessage(e, 'El código no es correcto o ya venció.'));
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
              {codeSent ? 'Revisa tu correo' : 'Activa tu respaldo'}
            </T>
            <T size={14} color={colors.textSecondary} style={styles.lead}>
              {codeSent
                ? `Enviamos un código a ${email.trim()}.`
                : 'Con tu correo guardamos tus metas en la nube. Te enviaremos un código, sin contraseñas.'}
            </T>
          </View>

          {codeSent ? (
            <Field
              label="Código"
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
          ) : (
            <Field
              label="Correo"
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
              placeholder="tu@correo.com"
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
                Usar otro correo
              </T>
            </Pressable>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button
            title={busy ? 'Un momento…' : codeSent ? 'Confirmar' : 'Enviar código'}
            onPress={codeSent ? verify : send}
            disabled={busy}
            style={styles.stretch}
          />
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()}>
            <T size={14} color={colors.textSecondary}>
              Ahora no
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
