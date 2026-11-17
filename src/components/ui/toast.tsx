import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOutUp, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, shadow } from '@/theme';

import { Text } from './text';

type Tipo = 'exito' | 'info' | 'error';
type Toast = { id: number; mensaje: string; tipo: Tipo };

const ToastContext = createContext<(mensaje: string, tipo?: Tipo) => void>(() => {});

const ESTILO: Record<Tipo, { icono: keyof typeof Ionicons.glyphMap; fondo: string }> = {
  exito: { icono: 'checkmark-circle', fondo: '#0F5132' },
  info: { icono: 'information-circle', fondo: '#03045E' },
  error: { icono: 'alert-circle', fondo: '#7F1D1D' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const insets = useSafeAreaInsets();

  const mostrar = useCallback((mensaje: string, tipo: Tipo = 'info') => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), mensaje, tipo });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 8 }]}>
        {toast && (
          <Animated.View
            key={toast.id}
            entering={SlideInUp.springify().damping(16)}
            exiting={FadeOutUp.duration(200)}
            accessibilityLiveRegion="polite"
            style={[styles.toast, { backgroundColor: ESTILO[toast.tipo].fondo }, shadow(3)]}
          >
            <Ionicons name={ESTILO[toast.tipo].icono} size={20} color="#FFFFFF" />
            <Text variant="bodyStrong" style={{ color: '#FFFFFF', flexShrink: 1 }}>
              {toast.mensaje}
            </Text>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toast: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.pill,
    maxWidth: '92%',
  },
});
