import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { LevelBadge, OccupancyBar } from '@/components/ui/level-badge';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { useParqueaderos } from '@/context/parking-context';
import type { ParqueaderoConDistancia } from '@/hooks/use-busqueda';
import { cuposLibres, formatoCOP, formatoDistancia, nivel } from '@/lib/parking';
import { radius, shadow, spacing, useTheme } from '@/theme';

type Props = { parqueadero: ParqueaderoConDistancia; indice: number; onPress: () => void };

export function ParkingCard({ parqueadero: p, indice, onPress }: Props) {
  const { colors } = useTheme();
  const { favoritos, alternarFavorito } = useParqueaderos();
  const favorito = favoritos.includes(p.id);
  const n = nivel(p);

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(indice, 8) * 60).springify().damping(18)} layout={LinearTransition.springify()}>
      <PressableScale
        onPress={onPress}
        escala={0.98}
        accessibilityRole="button"
        accessibilityLabel={`${p.nombre}, ${formatoDistancia(p.distancia)}, ${formatoCOP(p.tarifaHora)} la hora`}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadow(1)]}
      >
        <View style={styles.cabecera}>
          <View style={[styles.icono, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="car-sport" size={22} color={colors.tint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="subtitle" numberOfLines={1}>
              {p.nombre}
            </Text>
            <Text variant="caption" color="textMuted" numberOfLines={1}>
              {p.barrio} · {formatoDistancia(p.distancia)}
            </Text>
          </View>
          <PressableScale
            onPress={() => alternarFavorito(p.id)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            escala={0.8}
          >
            <Ionicons name={favorito ? 'heart' : 'heart-outline'} size={24} color={favorito ? '#E11D48' : colors.textMuted} />
          </PressableScale>
        </View>

        <View style={styles.fila}>
          <LevelBadge nivel={n} compacto />
          <Text variant="caption" color="textMuted">
            {cuposLibres(p)} de {p.capacidad} libres
          </Text>
          <View style={{ flex: 1 }} />
          <Text variant="subtitle" color="tint">
            {formatoCOP(p.tarifaHora)}
            <Text variant="caption" color="textMuted"> /h</Text>
          </Text>
        </View>
        <OccupancyBar ocupados={p.ocupados} capacidad={p.capacidad} nivel={n} />
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: StyleSheet.hairlineWidth },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icono: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
