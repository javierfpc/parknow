import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ParkingCard } from '@/components/parking/parking-card';
import { ParkingDetail } from '@/components/parking/parking-detail';
import { ShakeHint } from '@/components/parking/shake-hint';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Chip } from '@/components/ui/chip';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SearchBox } from '@/components/ui/search-box';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/context/auth-context';
import { useParqueaderos } from '@/context/parking-context';
import { useReservas } from '@/context/reservations-context';
import { useAgitar } from '@/hooks/use-agitar';
import { FILTROS, useBusqueda } from '@/hooks/use-busqueda';
import { useUbicacion } from '@/hooks/use-ubicacion';
import { cuposLibres, formatoCOP, formatoHora, saludo } from '@/lib/parking';
import { vibrar } from '@/services/haptics';
import { radius, shadow, spacing, useTheme } from '@/theme';

export default function InicioScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { usuario } = useAuth();
  const { activa } = useReservas();
  const { refrescar, actualizadoEn } = useParqueaderos();
  const { coords, estado, buscando } = useUbicacion();
  const { texto, setTexto, filtro, setFiltro, resultados } = useBusqueda(coords);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  const actualizar = useCallback(async () => {
    setRefrescando(true);
    await refrescar();
    setRefrescando(false);
  }, [refrescar]);

  // Sensor: al agitar el celular se actualiza la disponibilidad.
  const sensor = useAgitar(() => {
    vibrar.fuerte();
    actualizar().then(() => toast('Disponibilidad actualizada', 'exito'));
  });

  const resumen = useMemo(() => {
    const cerca = resultados.filter((p) => p.distancia <= 3);
    const libres = cerca.reduce((s, p) => s + cuposLibres(p), 0);
    const promedio = cerca.length ? cerca.reduce((s, p) => s + p.tarifaHora, 0) / cerca.length : 0;
    return { cerca: cerca.length, libres, promedio };
  }, [resultados]);

  const seleccionado = resultados.find((p) => p.id === seleccion);

  const cabecera = (
    <View>
      <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.burbuja} />
        <Animated.View entering={FadeInDown.springify()} style={styles.filaHero}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {saludo()},
            </Text>
            <Text variant="title" style={{ color: '#FFFFFF' }}>
              {usuario?.nombre.split(' ')[0]} 👋
            </Text>
          </View>
          <PressableScale onPress={() => router.navigate('/perfil')} style={styles.avatar} accessibilityLabel="Ir a mi perfil">
            <Text variant="subtitle" style={{ color: '#03045E' }}>
              {usuario?.nombre[0]}
            </Text>
          </PressableScale>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(80)} style={styles.ubicacion}>
          <Ionicons name={estado === 'concedido' ? 'location' : 'location-outline'} size={15} color="#90E0EF" />
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {buscando ? 'Buscando tu ubicación…' : estado === 'concedido' ? 'Usando tu ubicación actual' : 'Ubicación aproximada: Chapinero'}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(140)} style={styles.stats}>
          <Stat valor={String(resumen.cerca)} etiqueta="a menos de 3 km" />
          <View style={styles.separador} />
          <Stat valor={String(resumen.libres)} etiqueta="cupos libres" />
          <View style={styles.separador} />
          <Stat valor={resumen.promedio ? formatoCOP(Math.round(resumen.promedio / 100) * 100) : '—'} etiqueta="promedio / h" />
        </Animated.View>
      </LinearGradient>

      <View style={styles.cuerpo}>
        <SearchBox valor={texto} onChange={setTexto} elevado />

        {activa && (
          <Animated.View entering={FadeIn}>
            <PressableScale
              onPress={() => router.navigate('/reservas')}
              style={[styles.reserva, { backgroundColor: colors.surface, borderColor: colors.accent }, shadow(1)]}
              accessibilityLabel="Ver mi reserva activa"
            >
              <View style={[styles.reservaIcono, { backgroundColor: colors.primary }]}>
                <Ionicons name="qr-code" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {activa.parqueaderoNombre}
                </Text>
                <Text variant="caption" color="textMuted">
                  Reserva activa · llegada {formatoHora(activa.llegada)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </PressableScale>
          </Animated.View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -spacing.xl }} contentInset={{ left: 0 }}>
          <View style={{ width: spacing.xl - 8 }} />
          {FILTROS.map((f) => (
            <Chip key={f.id} texto={f.texto} icono={f.icono} activo={filtro === f.id} onPress={() => setFiltro(f.id)} />
          ))}
          <View style={{ width: spacing.xl - 8 }} />
        </ScrollView>

        <ShakeHint actualizadoEn={actualizadoEn} disponible={sensor} />

        <Text variant="label" color="textMuted">
          {resultados.length} parqueaderos
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={resultados}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={cabecera}
        renderItem={({ item, index }) => (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <ParkingCard parqueadero={item} indice={index} onPress={() => setSeleccion(item.id)} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Ionicons name={filtro === 'favoritos' ? 'heart-outline' : 'search'} size={40} color={colors.textMuted} />
            <Text variant="subtitle" center>
              {filtro === 'favoritos' ? 'Aún no tienes favoritos' : 'Sin resultados'}
            </Text>
            <Text color="textMuted" center>
              {filtro === 'favoritos' ? 'Toca el corazón de un parqueadero para guardarlo.' : 'Prueba con otro barrio o quita el filtro.'}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={actualizar} tintColor="#FFFFFF" colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      />
      <BottomSheet visible={!!seleccion} onClose={() => setSeleccion(null)}>
        {seleccion && <ParkingDetail parqueaderoId={seleccion} distancia={seleccionado?.distancia} onCerrar={() => setSeleccion(null)} />}
      </BottomSheet>
    </View>
  );
}

function Stat({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text variant="subtitle" style={{ color: '#FFFFFF' }} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
      <Text variant="caption" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11.5 }} numberOfLines={1}>
        {etiqueta}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: spacing.xl, paddingBottom: 56, gap: spacing.md, overflow: 'hidden', borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  burbuja: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: '#00B4D8', opacity: 0.15, top: -90, right: -70 },
  filaHero: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#90E0EF', alignItems: 'center', justifyContent: 'center' },
  ubicacion: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stats: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.lg, paddingVertical: 14, marginTop: spacing.xs },
  separador: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
  cuerpo: { paddingHorizontal: spacing.xl, gap: spacing.lg, marginTop: -26, marginBottom: spacing.md },
  reserva: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5 },
  reservaIcono: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  vacio: { alignItems: 'center', gap: spacing.sm, padding: spacing.xxl },
});
