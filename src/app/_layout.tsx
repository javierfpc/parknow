import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/ui/toast';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { ParkingProvider } from '@/context/parking-context';
import { ReservationsProvider } from '@/context/reservations-context';
import { configurarNotificaciones } from '@/services/notifications';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Navegacion() {
  const { usuario, cargando } = useAuth();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (!cargando) SplashScreen.hideAsync().catch(() => {});
  }, [cargando]);

  if (cargando) return null;

  return (
    <ParkingProvider parqueaderoAdministrado={usuario?.parqueaderoId}>
      <ReservationsProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Protected guard={!usuario}>
            <Stack.Screen name="login" />
          </Stack.Protected>
          <Stack.Protected guard={usuario?.rol === 'conductor'}>
            <Stack.Screen name="(conductor)" />
          </Stack.Protected>
          <Stack.Protected guard={usuario?.rol === 'admin'}>
            <Stack.Screen name="(admin)" />
          </Stack.Protected>
        </Stack>
      </ReservationsProvider>
    </ParkingProvider>
  );
}

export default function RootLayout() {
  const [fuentes] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    configurarNotificaciones();
  }, []);

  if (!fuentes) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <AuthProvider>
            <Navegacion />
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
