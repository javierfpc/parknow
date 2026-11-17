import { Tabs } from 'expo-router';

import { TabBar } from '@/components/navigation/tab-bar';

export const unstable_settings = { initialRouteName: 'panel' };

// Pestañas del administrador del parqueadero.
export default function AdminTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false, animation: 'shift' }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="panel" options={{ title: 'Panel' }} />
      <Tabs.Screen name="escanear" options={{ title: 'Escanear' }} />
      <Tabs.Screen name="cuenta" options={{ title: 'Cuenta' }} />
    </Tabs>
  );
}
