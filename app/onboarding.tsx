import { router } from 'expo-router';
import { Milestone, ShieldCheck, TrendingUpDown, type LucideIcon } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { NebulaBackground } from '@/components/NebulaBackground';
import { Ring } from '@/components/Ring';
import { T } from '@/components/T';
import { markOnboarded } from '@/db/store';
import { useStrings } from '@/i18n';
import { alpha, brandFont, colors } from '@/theme/tokens';

const FEATURES: { icon: LucideIcon; color: string }[] = [
  { icon: TrendingUpDown, color: colors.lilac },
  { icon: Milestone, color: colors.pink },
  { icon: ShieldCheck, color: colors.cyan },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const s = useStrings();

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
            <Image source={require('../assets/icons/logo.png')} style={styles.logo} accessibilityIgnoresInvertColors />
            <T size={40} tracking={-0.01} glow style={styles.wordmark}>
              Brote
            </T>
          </Ring>
        </View>

        <View style={styles.bottom}>
          <View style={styles.copy}>
            <T size={34} weight={600} tracking={-0.02} color={colors.textStrong}>
              {s.onboarding.headline}
            </T>
            <T size={16} color={colors.textSecondary} style={styles.lead}>
              {s.onboarding.lead}
            </T>
          </View>

          <View style={styles.features}>
            {FEATURES.map((feature, i) => (
              <View key={i} style={styles.feature}>
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: alpha(feature.color, 0.12), borderColor: alpha(feature.color, 0.24) },
                  ]}
                >
                  <feature.icon size={18} color={feature.color} strokeWidth={2} />
                </View>
                <T size={15}>{s.onboarding.features[i]}</T>
              </View>
            ))}
          </View>

          <View style={styles.cta}>
            <Button title={s.onboarding.cta} onPress={start} style={styles.button} />
            <T size={12} color={colors.textTertiary}>
              {s.onboarding.footnote}
            </T>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin', from: 'onboarding' } })}
            >
              <T size={13} color={colors.textSecondary}>
                {s.onboarding.haveAccount} <T size={13} weight={600} color={colors.lilac}>{s.onboarding.signIn}</T>
              </T>
            </Pressable>
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
  logo: { width: 112, height: 112, marginBottom: 2 },
  wordmark: { fontFamily: brandFont, lineHeight: 46 },
  bottom: { gap: 24 },
  copy: { gap: 10 },
  lead: { lineHeight: 24 },
  features: { gap: 12 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cta: { alignItems: 'center', gap: 12 },
  button: { alignSelf: 'stretch' },
});
