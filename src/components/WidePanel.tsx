import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { useStrings } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { colors } from '@/theme/tokens';

const PANEL_WIDTH = 620;
const PANEL_MAX_HEIGHT = 860;
const PANEL_INSETS = { top: 12, bottom: 12, left: 0, right: 0 };

/**
 * En iPad, los formularios (nueva meta, editar, cuenta, Pro) se muestran como una tarjeta centrada sobre la
 * pantalla anterior, que queda oscurecida detrás; tocar fuera cierra. En iPhone (o en una ventana angosta)
 * la pantalla se muestra igual que siempre.
 */
export function WidePanel({ children }: { children: ReactNode }) {
  const { wide } = useLayout();
  const { width, height } = useWindowDimensions();
  const s = useStrings();
  if (!wide) return children;

  return (
    <View style={styles.backdrop}>
      <Pressable
        style={StyleSheet.absoluteFill}
        accessibilityRole="button"
        accessibilityLabel={s.common.close}
        onPress={() => router.back()}
      />
      <View
        style={[
          styles.panel,
          {
            width: Math.min(PANEL_WIDTH, width - 48),
            height: Math.min(PANEL_MAX_HEIGHT, height - 96),
          },
        ]}
      >
        {/* Dentro de la tarjeta no hay barra de estado ni indicador de inicio que esquivar. */}
        <SafeAreaInsetsContext.Provider value={PANEL_INSETS}>{children}</SafeAreaInsetsContext.Provider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(4,3,14,0.62)',
  },
  panel: {
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,182,255,0.18)',
    backgroundColor: colors.bg,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 24 },
  },
});
