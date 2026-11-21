import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold, useFonts } from '@expo-google-fonts/sora';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { initAccount } from '@/db/account';
import { initLanguage } from '@/db/language';
import { initReminders } from '@/db/reminders';
import { initWidgets } from '@/db/widgets';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

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
        <Stack.Screen name="goal/new" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="auth" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="goal/[id]/index" />
        <Stack.Screen name="goal/[id]/edit" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="goal/[id]/completed" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen
          name="goal/[id]/log"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.62, 0.98],
            sheetGrabberVisible: true,
            sheetCornerRadius: 34,
            contentStyle: { backgroundColor: '#17132F' },
          }}
        />
      </Stack>
    </>
  );
}
