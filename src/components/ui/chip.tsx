import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { radius, useTheme } from '@/theme';
import { fonts } from '@/theme';

import { PressableScale } from './pressable-scale';

type Props = {
  texto: string;
  activo: boolean;
  onPress: () => void;
  icono?: keyof typeof Ionicons.glyphMap;
};

/** Filtro con transición de color animada al activarse. */
export function Chip({ texto, activo, onPress, icono }: Props) {
  const { colors } = useTheme();
  const p = useSharedValue(activo ? 1 : 0);
  useEffect(() => {
    p.value = withTiming(activo ? 1 : 0, { duration: 220 });
  }, [activo, p]);

  const fondo = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], [colors.surface, colors.primary]),
    borderColor: interpolateColor(p.value, [0, 1], [colors.border, colors.primary]),
  }));
  const color = useAnimatedStyle(() => ({ color: interpolateColor(p.value, [0, 1], [colors.text, '#FFFFFF']) }));

  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: activo }} haptic={false}>
      <Animated.View style={[styles.chip, fondo]}>
        {icono && <Ionicons name={icono} size={15} color={activo ? '#FFFFFF' : colors.textMuted} />}
        <Animated.Text style={[styles.texto, color]}>{texto}</Animated.Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  texto: { fontFamily: fonts.semibold, fontSize: 13.5 },
});
