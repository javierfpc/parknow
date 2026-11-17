import { useIsFocused } from 'expo-router';
import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

const UMBRAL_G = 1.9; // aceleración total (en g) que cuenta como sacudida
const PAUSA_MS = 1500; // evita disparar varias veces con una sola sacudida

/**
 * Sensor: acelerómetro. Llama a `alAgitar` cuando la persona sacude el celular.
 * Solo escucha mientras la pantalla está enfocada, para no gastar batería.
 */
export function useAgitar(alAgitar: () => void) {
  const enfocada = useIsFocused();
  const ultimo = useRef(0);
  const callback = useRef(alAgitar);
  callback.current = alAgitar;
  const [disponible, setDisponible] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' || !enfocada) return;
    let sub: { remove: () => void } | undefined;
    let activo = true;
    Accelerometer.isAvailableAsync().then((ok) => {
      if (!ok || !activo) return;
      setDisponible(true);
      Accelerometer.setUpdateInterval(100);
      sub = Accelerometer.addListener(({ x, y, z }) => {
        const fuerza = Math.sqrt(x * x + y * y + z * z);
        const ahora = Date.now();
        if (fuerza > UMBRAL_G && ahora - ultimo.current > PAUSA_MS) {
          ultimo.current = ahora;
          callback.current();
        }
      });
    });
    return () => {
      activo = false;
      sub?.remove();
    };
  }, [enfocada]);

  return disponible;
}
