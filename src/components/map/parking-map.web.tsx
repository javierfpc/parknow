import { createElement, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { formatoCOP, nivel } from '@/lib/parking';
import { useTheme } from '@/theme';
import type { Coordenadas, Parqueadero } from '@/types';

import { construirHtmlMapa } from './map-html';

export type ParkingMapRef = { volarA: (c: Coordenadas, zoom?: number) => void };

type Props = {
  parqueaderos: Parqueadero[];
  ubicacion: Coordenadas | null;
  seleccion: string | null;
  onSeleccionar: (id: string | null) => void;
};

type VentanaMapa = Window & { ponerDatos?: (d: unknown) => void; volar?: (lat: number, lng: number, zoom: number) => void };

// La página del mapa le habla a window.ReactNativeWebView; en la web ese puente se reemplaza por postMessage al padre.
const PUENTE = `<script>window.ReactNativeWebView={postMessage:function(s){parent.postMessage({parknow:s},'*')}};</script>`;

/**
 * Validación de plataforma: react-native-webview no existe en la web.
 * Esta versión pinta la misma página de Leaflet dentro de un <iframe> y se comunica igual.
 */
export const ParkingMap = forwardRef<ParkingMapRef, Props>(function ParkingMap({ parqueaderos, ubicacion, seleccion, onSeleccionar }, ref) {
  const { colors, isDark } = useTheme();
  const marco = useRef<HTMLIFrameElement | null>(null);
  const [listo, setListo] = useState(false);
  const centroInicial = useRef(ubicacion ?? { lat: 4.6533, lng: -74.0602 });
  const html = useMemo(() => construirHtmlMapa(isDark, centroInicial.current).replace('<head>', `<head>${PUENTE}`), [isDark]);
  const ventana = () => marco.current?.contentWindow as VentanaMapa | null | undefined;

  // Al cambiar de tema se monta otro iframe: se espera su nuevo aviso de «listo».
  useEffect(() => setListo(false), [isDark]);

  useImperativeHandle(ref, () => ({
    volarA: (c, zoom) => ventana()?.volar?.(c.lat, c.lng, zoom ?? 15),
  }));

  useEffect(() => {
    const alMensaje = (e: MessageEvent) => {
      if (e.source !== marco.current?.contentWindow || typeof e.data?.parknow !== 'string') return;
      try {
        const m = JSON.parse(e.data.parknow) as { tipo: string; id?: string };
        if (m.tipo === 'listo') setListo(true);
        if (m.tipo === 'seleccion' && m.id) onSeleccionar(m.id);
        if (m.tipo === 'fondo') onSeleccionar(null);
      } catch {
        // Mensaje desconocido: se ignora.
      }
    };
    window.addEventListener('message', alMensaje);
    return () => window.removeEventListener('message', alMensaje);
  }, [onSeleccionar]);

  useEffect(() => {
    if (!listo) return;
    ventana()?.ponerDatos?.({
      seleccion,
      yo: ubicacion,
      parqueaderos: parqueaderos.map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        nivel: nivel(p),
        etiqueta: nivel(p) === 'lleno' ? 'Lleno' : formatoCOP(p.tarifaHora),
      })),
    });
  }, [listo, parqueaderos, ubicacion, seleccion]);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
      {createElement('iframe', {
        key: isDark ? 'oscuro' : 'claro',
        ref: marco,
        srcDoc: html,
        title: 'Mapa de parqueaderos',
        style: { border: 0, width: '100%', height: '100%' },
      })}
      {!listo && (
        <View style={[StyleSheet.absoluteFill, styles.cargando]} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  cargando: { alignItems: 'center', justifyContent: 'center' },
});
