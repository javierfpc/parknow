import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

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

/** Mapa nativo (WebView) con pines de precio y disponibilidad. */
export const ParkingMap = forwardRef<ParkingMapRef, Props>(function ParkingMap(
  { parqueaderos, ubicacion, seleccion, onSeleccionar },
  ref,
) {
  const { colors, isDark } = useTheme();
  const web = useRef<WebView>(null);
  const [listo, setListo] = useState(false);
  // El HTML se arma una sola vez por tema; los datos se inyectan después.
  const centroInicial = useRef(ubicacion ?? { lat: 4.6533, lng: -74.0602 });
  const html = useMemo(() => construirHtmlMapa(isDark, centroInicial.current), [isDark]);

  useImperativeHandle(ref, () => ({
    volarA: (c, zoom) => web.current?.injectJavaScript(`window.volar(${c.lat}, ${c.lng}, ${zoom ?? 15}); true;`),
  }));

  useEffect(() => {
    if (!listo) return;
    const datos = {
      seleccion,
      yo: ubicacion,
      parqueaderos: parqueaderos.map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        nivel: nivel(p),
        etiqueta: nivel(p) === 'lleno' ? 'Lleno' : formatoCOP(p.tarifaHora),
      })),
    };
    web.current?.injectJavaScript(`window.ponerDatos(${JSON.stringify(datos)}); true;`);
  }, [listo, parqueaderos, ubicacion, seleccion]);

  const alMensaje = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const m = JSON.parse(e.nativeEvent.data) as { tipo: string; id?: string };
        if (m.tipo === 'listo') setListo(true);
        if (m.tipo === 'seleccion' && m.id) onSeleccionar(m.id);
        if (m.tipo === 'fondo') onSeleccionar(null);
      } catch {
        // Mensaje desconocido: se ignora.
      }
    },
    [onSeleccionar],
  );

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
      <WebView
        key={isDark ? 'oscuro' : 'claro'}
        ref={web}
        source={{ html, baseUrl: 'https://parknow.local/' }}
        originWhitelist={['*']}
        onMessage={alMensaje}
        onLoadStart={() => setListo(false)}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        overScrollMode="never"
        bounces={false}
        style={{ backgroundColor: 'transparent' }}
        accessibilityLabel="Mapa de parqueaderos"
      />
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
