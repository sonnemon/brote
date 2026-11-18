import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon, type UiIconName } from '@/components/Icon';
import { NebulaBackground } from '@/components/NebulaBackground';
import { Ring } from '@/components/Ring';
import { T } from '@/components/T';
import { markOnboarded } from '@/db/store';
import { alpha, colors } from '@/theme/tokens';

const FEATURES: { icon: UiIconName; color: string; label: string }[] = [
  { icon: 'arrows', color: colors.lilac, label: 'Metas crecientes o decrecientes' },
  { icon: 'flag', color: colors.pink, label: 'Empieza en 0 o a mitad de camino' },
  { icon: 'phone', color: colors.cyan, label: 'Tus datos se quedan en tu celular' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();

  const start = () => {
    markOnboarded();
    router.replace('/');
    router.push('/goal/new');
  };

  return (
    <View style={styles.screen}>
      <NebulaBackground variant={1} />
      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.hero}>
          <Ring progress={0.68} size={260} strokeWidth={14}>
            <Icon name="orbit" size={30} color={colors.lilac} strokeWidth={1.8} />
            <T size={30} weight={600} tracking={-0.02}>
              Orbe
            </T>
          </Ring>
        </View>

        <View style={styles.bottom}>
          <View style={styles.copy}>
            <T size={34} weight={600} tracking={-0.02} color={colors.textStrong}>
              Mide lo que importa.
            </T>
            <T size={16} color={colors.textSecondary} style={styles.lead}>
              Crea una meta que suba o baje, empieza desde donde estás y mírala llenarse.
            </T>
          </View>

          <View style={styles.features}>
            {FEATURES.map((feature) => (
              <View key={feature.label} style={styles.feature}>
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: alpha(feature.color, 0.12), borderColor: alpha(feature.color, 0.24) },
                  ]}
                >
                  <Icon name={feature.icon} size={18} color={feature.color} />
                </View>
                <T size={15}>{feature.label}</T>
              </View>
            ))}
          </View>

          <View style={styles.cta}>
            <Button title="Crear mi primera meta" onPress={start} style={styles.button} />
            <T size={12} color={colors.textTertiary}>
              Gratis y sin cuenta. Respaldo en la nube con Plus.
            </T>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  hero: { alignItems: 'center' },
  bottom: { gap: 24 },
  copy: { gap: 10 },
  lead: { lineHeight: 24 },
  features: { gap: 12 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cta: { alignItems: 'center', gap: 12 },
  button: { alignSelf: 'stretch' },
});
