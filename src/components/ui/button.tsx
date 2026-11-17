import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, shadow, useTheme } from '@/theme';

import { PressableScale } from './pressable-scale';
import { Text } from './text';

type Props = {
  titulo: string;
  onPress?: () => void;
  variante?: 'primario' | 'secundario' | 'fantasma' | 'peligro';
  icono?: keyof typeof Ionicons.glyphMap;
  cargando?: boolean;
  deshabilitado?: boolean;
  grande?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ titulo, onPress, variante = 'primario', icono, cargando, deshabilitado, grande, style }: Props) {
  const { colors } = useTheme();
  const inactivo = deshabilitado || cargando;
  const colorTexto =
    variante === 'primario' || variante === 'peligro' ? '#FFFFFF' : variante === 'secundario' ? colors.tint : colors.text;

  const contenido = (
    <View style={[styles.fila, { minHeight: grande ? 58 : 50 }]}>
      {cargando ? (
        <ActivityIndicator color={colorTexto} />
      ) : (
        <>
          {icono && <Ionicons name={icono} size={20} color={colorTexto} />}
          <Text variant="bodyStrong" style={{ color: colorTexto, fontSize: grande ? 16 : 15 }}>
            {titulo}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: !!inactivo, busy: !!cargando }}
      style={[{ opacity: inactivo ? 0.55 : 1, borderRadius: radius.md }, variante === 'primario' && shadow(2), style]}
    >
      {variante === 'primario' ? (
        <LinearGradient colors={['#0077B6', '#02368A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.base}>
          {contenido}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.base,
            variante === 'secundario' && { backgroundColor: colors.surfaceAlt },
            variante === 'peligro' && { backgroundColor: colors.danger },
            variante === 'fantasma' && { borderWidth: 1.5, borderColor: colors.border },
          ]}
        >
          {contenido}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, paddingHorizontal: 18, overflow: 'hidden' },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
