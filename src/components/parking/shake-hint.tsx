import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { formatoHora } from '@/lib/parking';
import { radius, useTheme } from '@/theme';

/** Pista del sensor: el ícono del celular se sacude cada pocos segundos. */
export function ShakeHint({ actualizadoEn, disponible }: { actualizadoEn: Date; disponible: boolean }) {
  const { colors } = useTheme();
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(
      withDelay(2600, withSequence(...[-14, 14, -10, 10, -5, 0].map((v) => withTiming(v, { duration: 70 })))),
      -1,
    );
  }, [r]);
  const giro = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));

  return (
    <View style={[styles.caja, { backgroundColor: colors.surfaceAlt }]}>
      <Animated.View style={giro}>
        <Ionicons name="phone-portrait-outline" size={18} color={colors.tint} />
      </Animated.View>
      <Text variant="caption" style={{ flex: 1 }}>
        {disponible ? 'Agita el celular para actualizar los cupos' : 'Desliza hacia abajo para actualizar'}
      </Text>
      <Text variant="caption" color="textMuted">
        {formatoHora(actualizadoEn.toISOString())}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 42, borderRadius: radius.md },
});
