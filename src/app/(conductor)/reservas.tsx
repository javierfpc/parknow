import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useParqueaderos } from '@/context/parking-context';
import { useReservas } from '@/context/reservations-context';
import { abrirComoLlegar } from '@/lib/direcciones';
import { formatoCOP, formatoFecha, formatoHora } from '@/lib/parking';
import { confirmar } from '@/services/confirm';
import { vibrar } from '@/services/haptics';
import { radius, shadow, spacing, useTheme } from '@/theme';
import type { EstadoReserva, Reserva } from '@/types';

const QR_TAM = 190;

function useAhora(cadaMs = 30_000) {
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), cadaMs);
    return () => clearInterval(id);
  }, [cadaMs]);
  return ahora;
}

function duracion(ms: number): string {
  const min = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(min / 60);
  return h ? `${h} h ${min % 60} min` : `${min} min`;
}

export default function ReservasScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { reservas, activa } = useReservas();
  const historial = reservas.filter((r) => r.id !== activa?.id);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.xl, paddingBottom: 130 + insets.bottom, gap: spacing.lg }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown}>
        <Text variant="display">Reservas</Text>
        <Text color="textMuted">Tu código QR y tu historial de parqueos.</Text>
      </Animated.View>

      {activa ? (
        <Ticket reserva={activa} />
      ) : (
        <Animated.View entering={FadeInDown.delay(80)} style={[styles.vacio, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.vacioIcono, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="ticket-outline" size={34} color={colors.tint} />
          </View>
          <Text variant="subtitle" center>
            No tienes reservas activas
          </Text>
          <Text color="textMuted" center>
            Busca un parqueadero en el mapa y asegura tu cupo antes de salir.
          </Text>
          <Button titulo="Buscar en el mapa" icono="map" onPress={() => router.navigate('/mapa')} style={{ alignSelf: 'stretch' }} />
        </Animated.View>
      )}

      {historial.length > 0 && (
        <View style={{ gap: spacing.md }}>
          <Text variant="label" color="textMuted">
            Historial
          </Text>
          {historial.map((r, i) => (
            <FilaHistorial key={r.id} reserva={r} indice={i} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Ticket({ reserva }: { reserva: Reserva }) {
  const { colors } = useTheme();
  const toast = useToast();
  const { cancelar } = useReservas();
  const { parqueaderos } = useParqueaderos();
  const ahora = useAhora();
  const inicio = new Date(reserva.llegada).getTime();
  const fin = inicio + reserva.horas * 3600_000;
  const enCurso = ahora >= inicio;
  const p = parqueaderos.find((x) => x.id === reserva.parqueaderoId);

  // Línea de escaneo que recorre el QR.
  const barrido = useSharedValue(0);
  useEffect(() => {
    barrido.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [barrido]);
  const linea = useAnimatedStyle(() => ({ transform: [{ translateY: barrido.value * (QR_TAM + 8) }] }));

  const pedirCancelacion = async () => {
    const gratis = inicio - Date.now() > 3600_000;
    const ok = await confirmar({
      titulo: '¿Cancelar la reserva?',
      mensaje: gratis ? 'Faltan más de 1 hora: la cancelación es gratis.' : 'Falta menos de 1 hora: según las reglas, perderías lo pagado.',
      aceptar: 'Cancelar reserva',
      cancelar: 'Mantener',
      destructivo: true,
    });
    if (ok) {
      cancelar(reserva.id);
      vibrar.exito();
      toast('Reserva cancelada', 'info');
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(80).springify().damping(16)} style={[styles.ticket, { backgroundColor: colors.surface }, shadow(3)]}>
      <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ticketTop}>
        <View style={styles.fila}>
          <View style={[styles.estado, { backgroundColor: enCurso ? '#16A34A' : 'rgba(255,255,255,0.18)' }]}>
            <View style={styles.puntoVivo} />
            <Text variant="caption" style={{ color: '#FFFFFF' }}>
              {enCurso ? 'En curso' : 'Confirmada'}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
            #{reserva.id}
          </Text>
        </View>
        <Text variant="title" style={{ color: '#FFFFFF' }}>
          {reserva.parqueaderoNombre}
        </Text>
        <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
          {reserva.direccion}
        </Text>
        <Text variant="subtitle" style={{ color: '#90E0EF', marginTop: 4 }}>
          {enCurso ? `Quedan ${duracion(fin - ahora)}` : `Empieza en ${duracion(inicio - ahora)}`}
        </Text>
      </LinearGradient>

      {/* Corte del tiquete */}
      <View style={styles.corte}>
        <View style={[styles.muesca, { backgroundColor: colors.background, left: -14 }]} />
        <View style={[styles.punteado, { borderColor: colors.border }]} />
        <View style={[styles.muesca, { backgroundColor: colors.background, right: -14 }]} />
      </View>

      <View style={styles.qrZona}>
        <View style={styles.qrMarco} accessible accessibilityLabel="Código QR de la reserva. Muéstralo en la entrada del parqueadero.">
          <QRCode value={reserva.codigo} size={QR_TAM} color="#03045E" backgroundColor="#FFFFFF" />
          <Animated.View style={[styles.lineaEscaneo, linea]} />
        </View>
        <Text variant="caption" color="textMuted" center>
          Muestra este código en la entrada
        </Text>
      </View>

      <View style={[styles.detalles, { borderColor: colors.border }]}>
        <Dato etiqueta="Llegada" valor={formatoHora(reserva.llegada)} />
        <Dato etiqueta="Tiempo" valor={`${reserva.horas} h`} />
        <Dato etiqueta="Pagado" valor={formatoCOP(reserva.total)} />
      </View>

      <View style={styles.acciones}>
        {p && <Button titulo="Cómo llegar" icono="navigate" variante="secundario" onPress={() => abrirComoLlegar(p, p.nombre)} style={{ flex: 1 }} />}
        <Button titulo="Cancelar" icono="close" variante="fantasma" onPress={pedirCancelacion} style={{ flex: 1 }} />
      </View>
    </Animated.View>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text variant="caption" color="textMuted">
        {etiqueta}
      </Text>
      <Text variant="bodyStrong">{valor}</Text>
    </View>
  );
}

const ESTADOS: Record<EstadoReserva, { texto: string; icono: keyof typeof Ionicons.glyphMap; color: 'success' | 'textMuted' | 'danger' | 'tint' }> = {
  activa: { texto: 'Activa', icono: 'time', color: 'tint' },
  usada: { texto: 'Usada', icono: 'checkmark-circle', color: 'success' },
  cancelada: { texto: 'Cancelada', icono: 'close-circle', color: 'danger' },
  vencida: { texto: 'Vencida', icono: 'alert-circle', color: 'textMuted' },
};

function FilaHistorial({ reserva, indice }: { reserva: Reserva; indice: number }) {
  const { colors } = useTheme();
  const e = ESTADOS[reserva.estado];
  return (
    <Animated.View
      entering={FadeInDown.delay(120 + indice * 50)}
      layout={LinearTransition}
      style={[styles.fila, styles.historial, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.historialIcono, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name="car-outline" size={20} color={colors.tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {reserva.parqueaderoNombre}
        </Text>
        <Text variant="caption" color="textMuted">
          {formatoFecha(reserva.llegada)} · {formatoHora(reserva.llegada)} · {formatoCOP(reserva.total)}
        </Text>
      </View>
      <View style={styles.fila}>
        <Ionicons name={e.icono} size={15} color={colors[e.color]} />
        <Text variant="caption" color={e.color}>
          {e.texto}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vacio: { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  vacioIcono: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  ticket: { borderRadius: radius.xl, overflow: 'hidden' },
  ticketTop: { padding: spacing.xl, gap: 4 },
  estado: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 26, borderRadius: radius.pill },
  puntoVivo: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF' },
  corte: { height: 28, justifyContent: 'center' },
  muesca: { position: 'absolute', width: 28, height: 28, borderRadius: 14 },
  punteado: { marginHorizontal: 22, borderTopWidth: 2, borderStyle: 'dashed' },
  qrZona: { alignItems: 'center', gap: spacing.md, paddingBottom: spacing.lg },
  qrMarco: { padding: 4, backgroundColor: '#FFFFFF', borderRadius: radius.md, overflow: 'hidden' },
  lineaEscaneo: { position: 'absolute', left: 0, right: 0, top: 0, height: 3, backgroundColor: '#00B4D8', opacity: 0.8 },
  detalles: { flexDirection: 'row', marginHorizontal: spacing.xl, paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  acciones: { flexDirection: 'row', gap: spacing.md, padding: spacing.xl },
  historial: { gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
  historialIcono: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
