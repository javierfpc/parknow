import { Tabs } from 'expo-router';

import { TabBar } from '@/components/navigation/tab-bar';
import { useReservas } from '@/context/reservations-context';

// Navegación únicamente por pestañas (requisito del parcial).
export default function ConductorTabs() {
  const { activa } = useReservas();
  return (
    <Tabs screenOptions={{ headerShown: false, animation: 'shift' }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="mapa" options={{ title: 'Mapa' }} />
      <Tabs.Screen name="reservas" options={{ title: 'Reservas', tabBarBadge: activa ? 1 : undefined }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
