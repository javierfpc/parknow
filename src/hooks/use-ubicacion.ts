import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';

import { CENTRO_BOGOTA } from '@/data/parqueaderos';
import type { Coordenadas } from '@/types';

type Estado = 'pendiente' | 'concedido' | 'denegado';

/** Ubicación del dispositivo con GPS. Sin permiso, usa el centro de Chapinero. */
export function useUbicacion() {
  const [coords, setCoords] = useState<Coordenadas>(CENTRO_BOGOTA);
  const [estado, setEstado] = useState<Estado>('pendiente');
  const [buscando, setBuscando] = useState(false);

  const localizar = useCallback(async () => {
    setBuscando(true);
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setEstado('denegado');
        return { ok: false as const, canAskAgain };
      }
      setEstado('concedido');
      // Android puede tardar en el primer fix: primero la última posición conocida.
      const ultima = Platform.OS === 'android' ? await Location.getLastKnownPositionAsync() : null;
      if (ultima) setCoords({ lat: ultima.coords.latitude, lng: ultima.coords.longitude });
      const actual = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const nuevas = { lat: actual.coords.latitude, lng: actual.coords.longitude };
      setCoords(nuevas);
      return { ok: true as const, canAskAgain: true, coords: nuevas };
    } catch {
      return { ok: false as const, canAskAgain: true };
    } finally {
      setBuscando(false);
    }
  }, []);

  useEffect(() => {
    localizar();
  }, [localizar]);

  return { coords, estado, buscando, localizar, abrirAjustes: () => Linking.openSettings() };
}
