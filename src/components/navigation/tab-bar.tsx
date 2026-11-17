import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import type { Tabs } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { vibrar } from '@/services/haptics';
import { fonts, radius, shadow, useTheme } from '@/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type Icono = keyof typeof Ionicons.glyphMap;

export const ICONOS_TAB: Record<string, [Icono, Icono]> = {
  index: ['home', 'home-outline'],
  mapa: ['map', 'map-outline'],
  reservas: ['ticket', 'ticket-outline'],
  perfil: ['person-circle', 'person-circle-outline'],
  panel: ['speedometer', 'speedometer-outline'],
  escanear: ['qr-code', 'qr-code-outline'],
  cuenta: ['person-circle', 'person-circle-outline'],
};

/** Barra de pestañas flotante con un indicador que se desliza con resorte. */
export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [ancho, setAncho] = useState(0);
  const n = state.routes.length;
  const tab = ancho / n;
  const x = useSharedValue(0);

  useEffect(() => {
    if (tab) x.value = withSpring(state.index * tab, { damping: 18, stiffness: 180 });
  }, [state.index, tab, x]);

  const indicador = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const contenido = (
    <View style={styles.fila} onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      {tab > 0 && (
        <Animated.View style={[styles.pista, { width: tab }, indicador]}>
          <View style={[styles.pildora, { backgroundColor: isDark ? 'rgba(76,201,240,0.16)' : 'rgba(2,54,138,0.09)' }]} />
        </Animated.View>
      )}
      {state.routes.map((route, i) => {
        const activo = state.index === i;
        const { options } = descriptors[route.key];
        const titulo = typeof options.title === 'string' ? options.title : route.name;
        const [lleno, contorno] = ICONOS_TAB[route.name] ?? ['ellipse', 'ellipse-outline'];
        const badge = options.tabBarBadge;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={titulo}
            style={styles.item}
            onPress={() => {
              const evento = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!activo && !evento.defaultPrevented) {
                vibrar.seleccion();
                navigation.navigate(route.name, route.params);
              }
            }}
          >
            <View>
              <Ionicons name={activo ? lleno : contorno} size={23} color={activo ? colors.tint : colors.textMuted} />
              {badge !== undefined && <View style={[styles.punto, { borderColor: colors.surface }]} />}
            </View>
            <Animated.Text
              style={[styles.texto, { color: activo ? colors.tint : colors.textMuted, fontFamily: activo ? fonts.bold : fonts.medium }]}
              numberOfLines={1}
            >
              {titulo}
            </Animated.Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.contenedor, { bottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={[styles.barra, { borderColor: colors.border }, shadow(3)]}>
        {/* Validación de plataforma: desenfoque nativo en iOS; fondo sólido en Android, donde el blur es costoso. */}
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.relleno}>
            {contenido}
          </BlurView>
        ) : (
          <View style={[styles.relleno, { backgroundColor: colors.tabBar }]}>{contenido}</View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { position: 'absolute', left: 16, right: 16 },
  barra: { borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, overflow: Platform.OS === 'ios' ? 'hidden' : 'visible' },
  relleno: { borderRadius: radius.xl, overflow: 'hidden' },
  fila: { flexDirection: 'row', height: 66 },
  pista: { position: 'absolute', top: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  pildora: { width: '82%', height: 54, borderRadius: radius.lg },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  texto: { fontSize: 11 },
  punto: { position: 'absolute', top: -2, right: -4, width: 11, height: 11, borderRadius: 6, backgroundColor: '#E11D48', borderWidth: 2 },
});
