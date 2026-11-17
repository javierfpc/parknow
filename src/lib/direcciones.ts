import { Linking, Platform } from 'react-native';

import type { Coordenadas } from '@/types';

/**
 * Abre la navegación en la app de mapas propia de cada sistema:
 * Apple Maps en iOS y Google Maps (modo navegación) en Android.
 */
export async function abrirComoLlegar({ lat, lng }: Coordenadas, nombre: string): Promise<void> {
  const web = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const nativa = Platform.select({
    ios: `maps://?daddr=${lat},${lng}&q=${encodeURIComponent(nombre)}`,
    android: `google.navigation:q=${lat},${lng}`,
    default: web,
  });
  try {
    // Validación de plataforma: en Android 11+ canOpenURL devuelve false si el esquema no está
    // declarado en <queries>, así que allí se intenta abrir directo y, si falla, se usa el navegador.
    if (Platform.OS === 'android' || (await Linking.canOpenURL(nativa))) return await Linking.openURL(nativa);
  } catch {
    // Sin app de mapas: se usa el navegador.
  }
  await Linking.openURL(web);
}
