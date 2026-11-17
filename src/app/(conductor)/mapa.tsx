import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ParkingMap, type ParkingMapRef } from '@/components/map/parking-map';
import { ParkingDetail } from '@/components/parking/parking-detail';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Chip } from '@/components/ui/chip';
import { LevelBadge } from '@/components/ui/level-badge';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SearchBox } from '@/components/ui/search-box';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useParqueaderos } from '@/context/parking-context';
import { useAgitar } from '@/hooks/use-agitar';
import { FILTROS, useBusqueda } from '@/hooks/use-busqueda';
import { useUbicacion } from '@/hooks/use-ubicacion';
import { cuposLibres, formatoCOP, formatoDistancia, nivel } from '@/lib/parking';
import { vibrar } from '@/services/haptics';
import { radius, shadow, spacing, useTheme } from '@/theme';

export default function MapaScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const mapa = useRef<ParkingMapRef>(null);
  const { refrescar } = useParqueaderos();
  const { coords, estado, localizar, abrirAjustes, buscando } = useUbicacion();
  const { texto, setTexto, filtro, setFiltro, resultados } = useBusqueda(coords);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [detalle, setDetalle] = useState(false);

  const elegido = resultados.find((p) => p.id === seleccion);

  const seleccionar = useCallback(
    (id: string | null) => {
      setSeleccion(id);
      if (id) {
        vibrar.seleccion();
        const p = resultados.find((x) => x.id === id);
        if (p) mapa.current?.volarA(p, 16);
      }
    },
    [resultados],
  );

  useAgitar(() => {
    vibrar.fuerte();
    refrescar().then(() => toast('Disponibilidad actualizada', 'exito'));
  });

  const irAMiUbicacion = async () => {
    const r = await localizar();
    if (r.ok) {
      mapa.current?.volarA(r.coords, 15);
    } else if (!r.canAskAgain) {
      toast('Activa la ubicación en los ajustes', 'info');
      abrirAjustes();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ParkingMap ref={mapa} parqueaderos={resultados} ubicacion={estado === 'concedido' ? coords : null} seleccion={seleccion} onSeleccionar={seleccionar} />

      <View style={[styles.arriba, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        <Animated.View entering={FadeInDown.springify()} style={{ paddingHorizontal: spacing.lg }}>
          <SearchBox valor={texto} onChange={setTexto} elevado placeholder="Buscar en el mapa" />
        </Animated.View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: spacing.lg }}>
          {FILTROS.map((f) => (
            <Chip key={f.id} texto={f.texto} icono={f.icono} activo={filtro === f.id} onPress={() => setFiltro(f.id)} />
          ))}
        </ScrollView>
      </View>

      <View style={[styles.lateral, { bottom: (elegido ? 230 : 110) + insets.bottom }]}>
        <PressableScale
          onPress={irAMiUbicacion}
          style={[styles.flotante, { backgroundColor: colors.surface }, shadow(2)]}
          accessibilityLabel="Centrar en mi ubicación"
        >
          <Ionicons name={buscando ? 'hourglass-outline' : estado === 'concedido' ? 'locate' : 'locate-outline'} size={22} color={colors.tint} />
        </PressableScale>
      </View>

      {elegido && (
        <Animated.View
          key={elegido.id}
          entering={FadeInDown.springify().damping(16)}
          exiting={FadeOutDown.duration(150)}
          style={[styles.mini, { bottom: 96 + insets.bottom }]}
        >
          <PressableScale
            onPress={() => setDetalle(true)}
            escala={0.98}
            style={[styles.miniCard, { backgroundColor: colors.surface }, shadow(3)]}
            accessibilityLabel={`Ver detalle de ${elegido.nombre}`}
          >
            <View style={{ flex: 1, gap: 6 }}>
              <Text variant="subtitle" numberOfLines={1}>
                {elegido.nombre}
              </Text>
              <Text variant="caption" color="textMuted">
                {elegido.barrio} · {formatoDistancia(elegido.distancia)} · {cuposLibres(elegido)} libres
              </Text>
              <LevelBadge nivel={nivel(elegido)} compacto />
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <Text variant="title" color="tint">
                {formatoCOP(elegido.tarifaHora)}
              </Text>
              <View style={[styles.verMas, { backgroundColor: colors.primary }]}>
                <Text variant="caption" style={{ color: '#FFFFFF' }}>
                  Reservar
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </View>
            </View>
          </PressableScale>
        </Animated.View>
      )}

      <BottomSheet visible={detalle && !!elegido} onClose={() => setDetalle(false)}>
        {elegido && <ParkingDetail parqueaderoId={elegido.id} distancia={elegido.distancia} onCerrar={() => setDetalle(false)} />}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  arriba: { position: 'absolute', top: 0, left: 0, right: 0, gap: spacing.sm },
  lateral: { position: 'absolute', right: spacing.lg, gap: spacing.sm },
  flotante: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  mini: { position: 'absolute', left: spacing.lg, right: spacing.lg },
  miniCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg },
  verMas: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: 32, borderRadius: radius.pill },
});
