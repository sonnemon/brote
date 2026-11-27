import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStrings } from '@/i18n';
import { colors, gradients } from '@/theme/tokens';

import { Icon, type UiIconName } from './Icon';
import { T } from './T';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export const TAB_BAR_SPACE = 110;

const ITEMS: Record<string, { label: 'home' | 'settings'; icon: UiIconName }> = {
  index: { label: 'home', icon: 'sprout' },
  settings: { label: 'settings', icon: 'gear' },
};

export function OrbeTabBar({ state, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const s = useStrings();
  const activeName = state.routes[state.index].name;

  const tab = (name: string) => {
    const item = ITEMS[name];
    const active = activeName === name;
    const routeKey = state.routes.find((route) => route.name === name)?.key;
    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={() => routeKey && navigateToTab(routeKey)}
        style={styles.tab}
      >
        {active && (
          <LinearGradient
            colors={['rgba(201,182,255,0.24)', 'rgba(255,158,207,0.12)']}
            style={[StyleSheet.absoluteFill, styles.activeTab]}
          />
        )}
        <Icon name={item.icon} color={active ? colors.lilac : colors.textSecondary} />
        <T size={11} weight={active ? 600 : 400} color={active ? colors.textStrong : colors.textSecondary}>
          {s.tabs[item.label]}
        </T>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom - 12, 12) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.tint]} />
        {tab('index')}
        <Pressable accessibilityRole="button" accessibilityLabel={s.tabs.newGoal} onPress={() => router.push('/goal/new')}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.add}>
            <Icon name="plus" size={24} color={colors.onPrimary} strokeWidth={2.4} />
          </LinearGradient>
        </Pressable>
        {tab('settings')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 20, right: 20, alignItems: 'center' },
  bar: {
    width: '100%',
    maxWidth: 440,
    height: 66,
    padding: 6,
    borderRadius: 33,
    borderWidth: 1,
    borderColor: 'rgba(201,182,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  tint: { backgroundColor: 'rgba(20,17,42,0.72)' },
  tab: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', gap: 3 },
  activeTab: { borderRadius: 26 },
  add: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
});
