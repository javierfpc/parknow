import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import { Accelerometer } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/context/auth-context';
import { useReservas } from '@/context/reservations-context';
import { autenticar, detectarBiometria, type Biometria } from '@/services/biometrics';
import { vibrar } from '@/services/haptics';
import { pedirPermiso } from '@/services/notifications';
import { radius, spacing, useTheme } from '@/theme';

export function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { usuario, correoBiometria, activarBiometria, cerrarSesion } = useAuth();
  const { reservas } = useReservas();
  const [bio, setBio] = useState<Biometria | null>(null);
  const [acelerometro, setAcelerometro] = useState<boolean | null>(null);
  const [notis, setNotis] = useState(false);

  useEffect(() => {
    detectarBiometria().then(setBio);
    if (Platform.OS !== 'web') Accelerometer.isAvailableAsync().then(setAcelerometro);
  }, []);

  if (!usuario) return null;
  const bioActiva = correoBiometria === usuario.correo;

  const alternarBio = async (valor: boolean) => {
    if (valor) {
      if (!bio?.disponible) {
        toast('Este equipo no tiene biometría configurada', 'error');
        return;
      }
      if (!(await autenticar('Activa el ingreso con biometría'))) return;
    }
    await activarBiometria(valor);
    vibrar.exito();
    toast(valor ? `Ingreso con ${bio?.nombre} activado` : 'Ingreso con biometría desactivado', 'exito');
  };

  const alternarNotis = async (valor: boolean) => {
    if (!valor) return setNotis(false);
    const ok = await pedirPermiso();
    setNotis(ok);
    toast(ok ? 'Recibirás recordatorios de tus reservas' : 'Permiso de notificaciones denegado', ok ? 'exito' : 'error');
  };

  const salir = () =>
    Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => cerrarSesion() },
    ]);

  const sistema = Platform.OS === 'ios' ? `iOS ${Platform.Version}` : Platform.OS === 'android' ? `Android (API ${Platform.Version})` : 'Web';
  const usadas = reservas.filter((r) => r.estado === 'usada' || r.estado === 'activa').length;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 130 + insets.bottom }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}>
        <Animated.View entering={FadeInDown.springify()} style={styles.avatar}>
          <Text variant="display" style={{ color: '#03045E' }}>
            {usuario.nombre[0]}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(80)} style={{ alignItems: 'center' }}>
          <Text variant="title" style={{ color: '#FFFFFF' }}>
            {usuario.nombre}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{usuario.correo}</Text>
          <View style={styles.rol}>
            <Ionicons name={usuario.rol === 'admin' ? 'business' : 'car-sport'} size={14} color="#03045E" />
            <Text variant="caption" style={{ color: '#03045E' }}>
              {usuario.rol === 'admin' ? 'Administrador' : `Conductor · ${usadas} parqueos`}
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <View style={styles.cuerpo}>
        <Seccion titulo="Seguridad" indice={0}>
          <Fila icono={bio?.icono ?? 'finger-print'} titulo={`Ingresar con ${bio?.nombre ?? 'biometría'}`} subtitulo={bio?.disponible ? 'Sin escribir tu contraseña' : 'No disponible en este equipo'}>
            <Switch value={bioActiva} onValueChange={alternarBio} trackColor={{ true: colors.secondary, false: colors.border }} thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined} />
          </Fila>
          <Fila icono="lock-closed" titulo="Sesión cifrada" subtitulo={Platform.OS === 'ios' ? 'Guardada en el Llavero de iOS' : 'Guardada en el Keystore de Android'} />
        </Seccion>

        <Seccion titulo="Notificaciones" indice={1}>
          <Fila icono="notifications" titulo="Recordatorios de reserva" subtitulo="Te avisamos 10 minutos antes">
            <Switch value={notis} onValueChange={alternarNotis} trackColor={{ true: colors.secondary, false: colors.border }} thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined} />
          </Fila>
        </Seccion>

        <Seccion titulo="Este dispositivo" indice={2}>
          <Fila icono={Platform.OS === 'ios' ? 'logo-apple' : 'logo-android'} titulo="Sistema" subtitulo={sistema} />
          <Fila icono="phone-portrait" titulo="Modelo" subtitulo={Device.modelName ?? 'Desconocido'} />
          <Fila icono="pulse" titulo="Acelerómetro" subtitulo={acelerometro === null ? 'Comprobando…' : acelerometro ? 'Disponible: agita para actualizar' : 'No disponible'} />
          <Fila icono={isDark ? 'moon' : 'sunny'} titulo="Tema" subtitulo={isDark ? 'Oscuro (según el sistema)' : 'Claro (según el sistema)'} />
        </Seccion>

        <Animated.View entering={FadeInDown.delay(300)}>
          <Button titulo="Cerrar sesión" icono="log-out-outline" variante="fantasma" onPress={salir} />
        </Animated.View>
        <Text variant="caption" color="textMuted" center>
          ParkNow 1.0 · Universidad Compensar
        </Text>
      </View>
    </ScrollView>
  );
}

function Seccion({ titulo, indice, children }: { titulo: string; indice: number; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(120 + indice * 70).springify().damping(18)} style={{ gap: spacing.sm }}>
      <Text variant="label" color="textMuted">
        {titulo}
      </Text>
      <View style={[styles.seccion, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>
    </Animated.View>
  );
}

function Fila({ icono, titulo, subtitulo, children }: { icono: keyof typeof Ionicons.glyphMap; titulo: string; subtitulo?: string; children?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.fila}>
      <View style={[styles.filaIcono, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name={icono} size={19} color={colors.tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{titulo}</Text>
        {subtitulo && (
          <Text variant="caption" color="textMuted">
            {subtitulo}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.md, paddingBottom: spacing.xxl, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#90E0EF', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.35)' },
  rol: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#90E0EF', paddingHorizontal: 12, height: 28, borderRadius: radius.pill, marginTop: spacing.sm },
  cuerpo: { padding: spacing.xl, gap: spacing.xl },
  seccion: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, paddingVertical: spacing.xs },
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  filaIcono: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
