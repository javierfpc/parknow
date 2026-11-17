import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { TEXTO_NIVEL } from '@/lib/parking';
import { radius, useTheme } from '@/theme';
import type { NivelDisponibilidad } from '@/types';

import { Text } from './text';

const ICONOS = { alta: 'checkmark-circle', baja: 'alert-circle', lleno: 'close-circle' } as const;

/** Disponibilidad con ícono + texto (nunca solo color). */
export function LevelBadge({ nivel, compacto }: { nivel: NivelDisponibilidad; compacto?: boolean }) {
  const { colors } = useTheme();
  const paleta = {
    alta: [colors.success, colors.successBg],
    baja: [colors.warning, colors.warningBg],
    lleno: [colors.danger, colors.dangerBg],
  }[nivel];
  return (
    <View style={[styles.badge, { backgroundColor: paleta[1] }, compacto && { paddingHorizontal: 8, height: 24 }]}>
      <Ionicons name={ICONOS[nivel]} size={compacto ? 13 : 15} color={paleta[0]} />
      <Text variant="caption" style={{ color: paleta[0], fontSize: compacto ? 12 : 13 }}>
        {TEXTO_NIVEL[nivel]}
      </Text>
    </View>
  );
}

/** Barra de ocupación que se anima cuando cambia el valor. */
export function OccupancyBar({ ocupados, capacidad, nivel }: { ocupados: number; capacidad: number; nivel: NivelDisponibilidad }) {
  const { colors } = useTheme();
  const progreso = useSharedValue(0);
  useEffect(() => {
    progreso.value = withSpring(capacidad ? ocupados / capacidad : 0, { damping: 18, stiffness: 120 });
  }, [ocupados, capacidad, progreso]);
  const ancho = useAnimatedStyle(() => ({ width: `${Math.min(1, progreso.value) * 100}%` }));
  const color = { alta: colors.success, baja: colors.warning, lleno: colors.danger }[nivel];
  return (
    <View style={[styles.pista, { backgroundColor: colors.surfaceAlt }]}>
      <Animated.View style={[styles.relleno, { backgroundColor: color }, ancho]} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  pista: { height: 6, borderRadius: 3, overflow: 'hidden' },
  relleno: { height: 6, borderRadius: 3 },
});
