import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { colors } from '@/theme/tokens';

import { Icon } from './Icon';
import { T } from './T';

export function PlusBadge() {
  return (
    <LinearGradient
      colors={['rgba(201,182,255,0.3)', 'rgba(255,158,207,0.3)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.badge}
    >
      <Icon name="lock" size={10} color={colors.textStrong} strokeWidth={3} />
      <T size={10} weight={700} tracking={0.08} color={colors.textStrong}>
        PRO
      </T>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
