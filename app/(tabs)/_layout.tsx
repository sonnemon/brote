import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { OrbeTabBar } from '@/components/OrbeTabBar';
import { isOnboarded } from '@/db/store';
import { colors } from '@/theme/tokens';

export default function TabsLayout() {
  if (!isOnboarded()) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      tabBar={(props) => <OrbeTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
