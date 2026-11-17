import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { radius, useTheme } from '@/theme';

type Props = { visible: boolean; onClose: () => void; children: ReactNode };

/**
 * Hoja inferior que se abre con resorte y se cierra arrastrándola hacia abajo.
 * En Android el botón "atrás" también la cierra (onRequestClose del Modal).
 */
export function BottomSheet({ visible, onClose, children }: Props) {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [montado, setMontado] = useState(visible);
  const y = useSharedValue(height);

  useEffect(() => {
    if (visible) {
      setMontado(true);
      y.value = height;
      y.value = withSpring(0, { damping: 20, stiffness: 180, mass: 0.9 });
    } else if (montado) {
      y.value = withTiming(height, { duration: 240 }, () => scheduleOnRN(setMontado, false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const cerrar = () => {
    y.value = withTiming(height, { duration: 220 }, () => scheduleOnRN(onClose));
  };

  const arrastre = Gesture.Pan()
    .onUpdate((e) => {
      y.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 900) {
        y.value = withTiming(height, { duration: 200 }, () => scheduleOnRN(onClose));
      } else {
        y.value = withSpring(0, { damping: 18 });
      }
    });

  const hoja = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const fondo = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [0, height * 0.6], [1, 0]) }));

  if (!montado) return null;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={cerrar}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, fondo]}>
          <Pressable style={{ flex: 1 }} onPress={cerrar} accessibilityLabel="Cerrar" />
        </Animated.View>
        <Animated.View
          style={[
            styles.hoja,
            { backgroundColor: colors.background, maxHeight: height * 0.9, paddingBottom: insets.bottom + 16 },
            hoja,
          ]}
        >
          <GestureDetector gesture={arrastre}>
            <View style={styles.zonaAgarre} accessibilityLabel="Arrastra hacia abajo para cerrar">
              <View style={[styles.agarre, { backgroundColor: colors.border }]} />
            </View>
          </GestureDetector>
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  hoja: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  zonaAgarre: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  agarre: { width: 44, height: 5, borderRadius: 3 },
});
