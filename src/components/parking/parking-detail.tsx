import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { LevelBadge, OccupancyBar } from '@/components/ui/level-badge';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { useParqueaderos } from '@/context/parking-context';
import { useReservas } from '@/context/reservations-context';
import { abrirComoLlegar } from '@/lib/direcciones';
import { calcularTotal, cuposLibres, formatoCOP, formatoDistancia, formatoHora, nivel, SERVICIOS } from '@/lib/parking';
import { autenticar, detectarBiometria, type Biometria } from '@/services/biometrics';
import { vibrar } from '@/services/haptics';
import { radius, spacing, useTheme } from '@/theme';

const LLEGADAS = [
  { min: 15, texto: 'En 15 min' },
  { min: 30, texto: 'En 30 min' },
  { min: 60, texto: 'En 1 hora' },
  { min: 120, texto: 'En 2 horas' },
];

type Props = { parqueaderoId: string; distancia?: number; onCerrar: () => void };

export function ParkingDetail({ parqueaderoId, distancia, onCerrar }: Props) {
  const { colors } = useTheme();
  const { usuario } = useAuth();
  const { parqueaderos, favoritos, alternarFavorito } = useParqueaderos();
  const { crear, activa } = useReservas();
  const p = parqueaderos.find((x) => x.id === parqueaderoId);

  const [llegadaMin, setLlegadaMin] = useState(30);
  const [horas, setHoras] = useState(2);
  const [pagando, setPagando] = useState(false);
  const [listo, setListo] = useState(false);
  const [bio, setBio] = useState<Biometria | null>(null);

  useEffect(() => {
    detectarBiometria().then(setBio);
  }, []);

  const total = useMemo(() => (p ? calcularTotal(p, horas) : 0), [p, horas]);
  if (!p) return null;

  const n = nivel(p);
  const libres = cuposLibres(p);
  const favorito = favoritos.includes(p.id);
  const esConductor = usuario?.rol === 'conductor';
  const llegada = new Date(Date.now() + llegadaMin * 60_000);

  const reservar = async () => {
    const confirmar = async () => {
      setPagando(true);
      try {
        if (bio?.disponible) {
          const ok = await autenticar(`Confirma el pago de ${formatoCOP(total)}`);
          if (!ok) {
            vibrar.error();
            return;
          }
        }
        await new Promise((r) => setTimeout(r, 900)); // simula la pasarela de pago
        await crear(p, llegada, horas);
        vibrar.exito();
        setListo(true);
      } finally {
        setPagando(false);
      }
    };
    if (activa) {
      Alert.alert('Ya tienes una reserva', `Si continúas, se cancela tu reserva en ${activa.parqueaderoNombre}.`, [
        { text: 'Volver', style: 'cancel' },
        { text: 'Reemplazar', style: 'destructive', onPress: confirmar },
      ]);
    } else {
      await confirmar();
    }
  };

  if (listo) {
    return (
      <Animated.View entering={FadeIn} style={styles.exito}>
        <Animated.View entering={ZoomIn.springify().damping(10)} style={[styles.check, { backgroundColor: colors.successBg }]}>
          <Ionicons name="checkmark" size={56} color={colors.success} />
        </Animated.View>
        <Text variant="title" center>
          ¡Cupo reservado!
        </Text>
        <Text color="textMuted" center>
          {p.nombre} te espera a las {formatoHora(llegada.toISOString())}. Te avisaremos 10 minutos antes.
        </Text>
        <Button
          titulo="Ver mi código QR"
          icono="qr-code"
          grande
          style={{ alignSelf: 'stretch', marginTop: spacing.md }}
          onPress={() => {
            onCerrar();
            router.navigate('/reservas');
          }}
        />
      </Animated.View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.delay(50)} style={styles.cabecera}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="title">{p.nombre}</Text>
          <Text color="textMuted">
            {p.direccion}, {p.barrio}
            {distancia !== undefined ? ` · ${formatoDistancia(distancia)}` : ''}
          </Text>
          <View style={styles.fila}>
            <Ionicons name="star" size={15} color="#F59E0B" />
            <Text variant="caption">{p.calificacion.toFixed(1)}</Text>
            <Text variant="caption" color="textMuted">
              · {p.horario}
            </Text>
          </View>
        </View>
        <PressableScale
          onPress={() => alternarFavorito(p.id)}
          escala={0.8}
          accessibilityLabel={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          style={[styles.circulo, { backgroundColor: colors.surfaceAlt }]}
        >
          <Ionicons name={favorito ? 'heart' : 'heart-outline'} size={22} color={favorito ? '#E11D48' : colors.text} />
        </PressableScale>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(110)} style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.fila}>
          <LevelBadge nivel={n} />
          <View style={{ flex: 1 }} />
          <Text variant="caption" color="textMuted">
            Actualizado en vivo
          </Text>
        </View>
        <View style={styles.metricas}>
          <Metrica valor={String(libres)} etiqueta="cupos libres" />
          <Metrica valor={formatoCOP(p.tarifaHora)} etiqueta="por hora" />
          <Metrica valor={formatoCOP(p.tarifaDia)} etiqueta="tope diario" />
        </View>
        <OccupancyBar ocupados={p.ocupados} capacidad={p.capacidad} nivel={n} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(170)} style={styles.servicios}>
        {p.servicios.map((s) => (
          <View key={s} style={[styles.servicio, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name={SERVICIOS[s].icono as keyof typeof Ionicons.glyphMap} size={15} color={colors.tint} />
            <Text variant="caption">{SERVICIOS[s].texto}</Text>
          </View>
        ))}
      </Animated.View>

      <Button titulo="Cómo llegar" icono="navigate" variante="secundario" onPress={() => abrirComoLlegar(p, p.nombre)} />

      {esConductor && (
        <Animated.View entering={FadeInDown.delay(230)} style={{ gap: spacing.md }}>
          <Text variant="label" color="textMuted" style={{ marginTop: spacing.sm }}>
            ¿Cuándo llegas?
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {LLEGADAS.map((l) => (
              <Chip key={l.min} texto={l.texto} activo={llegadaMin === l.min} onPress={() => setLlegadaMin(l.min)} />
            ))}
          </ScrollView>

          <View style={[styles.horas, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Tiempo reservado</Text>
              <Text variant="caption" color="textMuted">
                De {formatoHora(llegada.toISOString())} a {formatoHora(new Date(llegada.getTime() + horas * 3600_000).toISOString())}
              </Text>
            </View>
            <Paso icono="remove" onPress={() => setHoras((h) => Math.max(1, h - 1))} deshabilitado={horas <= 1} etiqueta="Menos horas" />
            <Animated.View key={horas} entering={ZoomIn.springify().damping(12)}>
              <Text variant="title" style={{ minWidth: 44, textAlign: 'center' }}>
                {horas} h
              </Text>
            </Animated.View>
            <Paso icono="add" onPress={() => setHoras((h) => Math.min(8, h + 1))} deshabilitado={horas >= 8} etiqueta="Más horas" />
          </View>

          <Button
            titulo={libres === 0 ? 'Sin cupos por ahora' : `Pagar ${formatoCOP(total)}${bio?.disponible ? ` con ${bio.nombre}` : ''}`}
            icono={bio?.disponible ? bio.icono : 'card'}
            grande
            cargando={pagando}
            deshabilitado={libres === 0}
            onPress={reservar}
          />
          <Text variant="caption" color="textMuted" center>
            Pago simulado para la demostración. Cancelación gratis hasta 1 hora antes.
          </Text>
        </Animated.View>
      )}
    </ScrollView>
  );
}

function Metrica({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text variant="subtitle" numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
      <Text variant="caption" color="textMuted">
        {etiqueta}
      </Text>
    </View>
  );
}

function Paso({ icono, onPress, deshabilitado, etiqueta }: { icono: 'add' | 'remove'; onPress: () => void; deshabilitado: boolean; etiqueta: string }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={deshabilitado}
      escala={0.85}
      accessibilityLabel={etiqueta}
      style={[styles.paso, { backgroundColor: colors.surfaceAlt, opacity: deshabilitado ? 0.4 : 1 }]}
    >
      <Ionicons name={icono} size={20} color={colors.tint} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.lg },
  cabecera: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  circulo: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  panel: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: StyleSheet.hairlineWidth },
  metricas: { flexDirection: 'row', gap: spacing.md },
  servicios: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  servicio: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 32, borderRadius: radius.pill },
  horas: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, padding: spacing.md, borderWidth: StyleSheet.hairlineWidth },
  paso: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  exito: { padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  check: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
});
