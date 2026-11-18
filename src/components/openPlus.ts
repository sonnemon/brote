import { router } from 'expo-router';

/** Punto único de entrada al paywall. */
export function openPlus() {
  router.push('/paywall');
}
