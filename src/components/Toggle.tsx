import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme/tokens';

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
};

export function Toggle({ value, onChange, label }: Props) {
  const [anim] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: false }).start();
  }, [anim, value]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      onPress={() => onChange(!value)}
    >
      <Animated.View
        style={[
          styles.track,
          { backgroundColor: anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(201,182,255,0.18)', colors.lilac] }) },
        ]}
      >
        <Animated.View
          style={[styles.thumb, { left: anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] }) }]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 51, height: 31, borderRadius: 16 },
  thumb: { position: 'absolute', top: 2, width: 27, height: 27, borderRadius: 14, backgroundColor: '#FFFFFF' },
});
