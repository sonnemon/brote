import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold, useFonts } from '@expo-google-fonts/sora';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { initAccount } from '@/db/account';
import { initLanguage } from '@/db/language';
import { initReminders } from '@/db/reminders';
import { initWidgets } from '@/db/widgets';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

const isPad = Platform.OS === 'ios' && Platform.isPad;

// En iPad la hoja de registrar es una tarjeta centrada: se ajusta a su contenido en vez de a la altura de pantalla.
const LOG_SHEET_DETENTS = isPad ? 'fitToContents' : [0.62, 0.98];

// En iPad los formularios se abren como una tarjeta centrada (WidePanel) sobre la pantalla anterior oscurecida.
const padPanel = isPad
  ? ({ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } } as const)
  : null;

// Antes del primer render, para que ninguna pantalla aparezca en el idioma equivocado.
initLanguage();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Fraunces_600SemiBold,
  });
  const ready = loaded || !!error;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => initAccount(), []);

  useEffect(() => initWidgets(), []);

  useEffect(() => (ready ? initReminders() : undefined), [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="goal/new" options={padPanel ?? { animation: 'slide_from_bottom' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="paywall" options={padPanel ?? { presentation: 'fullScreenModal' }} />
        <Stack.Screen name="auth" options={padPanel ?? { presentation: 'fullScreenModal' }} />
        <Stack.Screen name="goal/[id]/index" />
        <Stack.Screen name="goal/[id]/edit" options={padPanel ?? { animation: 'slide_from_bottom' }} />
        <Stack.Screen name="goal/[id]/completed" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen
          name="goal/[id]/log"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: LOG_SHEET_DETENTS,
            sheetGrabberVisible: true,
            sheetCornerRadius: 34,
            contentStyle: { backgroundColor: '#17132F' },
          }}
        />
      </Stack>
    </>
  );
}
