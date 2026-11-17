import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition, useAnimatedProps, useSharedValue, withSpring, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { LevelBadge } from '@/components/ui/level-badge';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/context/auth-context';
import { useParqueaderos } from '@/context/parking-context';
import { cuposLibres, formatoCOP, formatoHora, nivel } from '@/lib/parking';
import { vibrar } from '@/services/haptics';
import { radius, shadow, spacing, useTheme } from '@/theme';

const ACircle = Animated.createAnimatedComponent(Circle);
const TAM = 220;
const GROSOR = 18;
const R = (TAM - GROSOR) / 2;
const CIRC = 2 * Math.PI * R;

type Movimiento = { id: number; tipo: 'entrada' | 'salida'; hora: string };

export default function PanelScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { usuario } = useAuth();
  const { parqueaderos, moverCupo } = useParqueaderos();
  const p = parqueaderos.find((x) => x.id === usuario?.parqueaderoId);
  const [movs, setMovs] = useState<Movimiento[]>([]);

  const progreso = useSharedValue(0);
  useEffect(() => {
    if (p) progreso.value = withSpring(p.ocupados / p.capacidad, { damping: 16, stiffness: 110 });
  }, [p, progreso]);
  const arco = useAnimatedProps(() => ({ strokeDashoffset: CIRC * (1 - progreso.value) }));

  if (!p) return null;
  const n = nivel(p);
  const libres = cuposLibres(p);
  const colorNivel = { alta: colors.success, baja: colors.warning, lleno: colors.danger }[n];

  const mover = (delta: 1 | -1) => {
    if (!moverCupo(p.id, delta)) {
      vibrar.error();
      toast(delta === 1 ? 'El parqueadero está lleno' : 'No hay carros adentro', 'error');
      return;
    }
    vibrar.fuerte();
    setMovs((m) => [{ id: Date.now(), tipo: (delta === 1 ? 'entrada' : 'salida') as Movimiento['tipo'], hora: new Date().toISOString() }, ...m].slice(0, 6));
  };

  const entradas = movs.filter((m) => m.tipo === 'entrada').length;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.xl, paddingBottom: 130 + insets.bottom, gap: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown}>
        <Text variant="label" color="textMuted">
          Panel del parqueadero
        </Text>
        <Text variant="display">{p.nombre}</Text>
        <Text color="textMuted">
          {p.direccion}, {p.barrio}
        </Text>
      </Animated.View>

      <Animated.View entering={ZoomIn.springify().damping(14)} style={[styles.medidor, { backgroundColor: colors.surface }, shadow(2)]}>
        <View style={{ width: TAM, height: TAM, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={TAM} height={TAM} style={StyleSheet.absoluteFill}>
            <Circle cx={TAM / 2} cy={TAM / 2} r={R} stroke={colors.surfaceAlt} strokeWidth={GROSOR} fill="none" />
            <ACircle
              cx={TAM / 2}
              cy={TAM / 2}
              r={R}
              stroke={colorNivel}
              strokeWidth={GROSOR}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${CIRC} ${CIRC}`}
              animatedProps={arco}
              transform={`rotate(-90 ${TAM / 2} ${TAM / 2})`}
            />
          </Svg>
          <Animated.View key={p.ocupados} entering={ZoomIn.duration(180)} style={{ alignItems: 'center' }}>
            <Text variant="display" style={{ fontSize: 46, lineHeight: 52 }} accessibilityLiveRegion="polite">
              {libres}
            </Text>
          </Animated.View>
          <Text variant="caption" color="textMuted">
            cupos libres de {p.capacidad}
          </Text>
        </View>
        <LevelBadge nivel={n} />
      </Animated.View>

      <View style={styles.botones}>
        <BotonMovimiento texto="Entró" icono="enter" color={colors.primary} onPress={() => mover(1)} deshabilitado={libres === 0} />
        <BotonMovimiento texto="Salió" icono="exit" color={colors.secondary} onPress={() => mover(-1)} deshabilitado={p.ocupados === 0} />
      </View>

      <View style={styles.stats}>
        <Stat icono="car" valor={String(p.ocupados)} etiqueta="Adentro" />
        <Stat icono="trending-up" valor={String(entradas)} etiqueta="Entradas (sesión)" />
        <Stat icono="cash" valor={formatoCOP(p.tarifaHora)} etiqueta="Tarifa / h" />
      </View>

      {movs.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Text variant="label" color="textMuted">
            Últimos movimientos
          </Text>
          {movs.map((m) => (
            <Animated.View
              key={m.id}
              entering={FadeInDown.springify().damping(16)}
              layout={LinearTransition.springify()}
              style={[styles.mov, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name={m.tipo === 'entrada' ? 'arrow-down-circle' : 'arrow-up-circle'} size={22} color={m.tipo === 'entrada' ? colors.tint : colors.success} />
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {m.tipo === 'entrada' ? 'Entrada registrada' : 'Salida registrada'}
              </Text>
              <Text variant="caption" color="textMuted">
                {formatoHora(m.hora)}
              </Text>
            </Animated.View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function BotonMovimiento({ texto, icono, color, onPress, deshabilitado }: { texto: string; icono: 'enter' | 'exit'; color: string; onPress: () => void; deshabilitado: boolean }) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={deshabilitado}
      escala={0.92}
      haptic={false}
      accessibilityRole="button"
      accessibilityLabel={`Registrar: ${texto}`}
      style={[styles.boton, { backgroundColor: color, opacity: deshabilitado ? 0.45 : 1 }, shadow(2)]}
    >
      <Ionicons name={icono} size={30} color="#FFFFFF" />
      <Text variant="title" style={{ color: '#FFFFFF' }}>
        {texto}
      </Text>
    </PressableScale>
  );
}

function Stat({ icono, valor, etiqueta }: { icono: keyof typeof Ionicons.glyphMap; valor: string; etiqueta: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name={icono} size={18} color={colors.tint} />
      <Text variant="subtitle" numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
      <Text variant="caption" color="textMuted" numberOfLines={1}>
        {etiqueta}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  medidor: { alignItems: 'center', gap: spacing.lg, padding: spacing.xl, borderRadius: radius.xl },
  botones: { flexDirection: 'row', gap: spacing.md },
  boton: { flex: 1, height: 96, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: 4 },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, padding: spacing.md, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, gap: 2 },
  mov: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
});
