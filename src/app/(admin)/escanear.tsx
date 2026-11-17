import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withTiming, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { useParqueaderos } from '@/context/parking-context';
import { useReservas, validarCodigo, type ResultadoValidacion } from '@/context/reservations-context';
import { formatoHora } from '@/lib/parking';
import { vibrar } from '@/services/haptics';
import { CLAVES, guardarJSON, leerJSON } from '@/services/storage';
import { radius, spacing, useTheme } from '@/theme';

const MARCO = 250;
// Validación de plataforma: en la web (Chrome en Windows, Firefox, Safari) la cámara no lee QR,
// así que allí se pega el texto del código para validarlo con la misma lógica.
const ES_WEB = Platform.OS === 'web';

export default function EscanearScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const enfocada = useIsFocused();
  const { usuario } = useAuth();
  const { moverCupo } = useParqueaderos();
  const { reservas, marcarUsada } = useReservas();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [linterna, setLinterna] = useState(false);
  const [resultado, setResultado] = useState<ResultadoValidacion | null>(null);
  const [codigoManual, setCodigoManual] = useState('');
  const bloqueado = useRef(false);
  // Sin servidor, el celular del administrador recuerda qué códigos ya dejó entrar.
  const usados = useRef<Set<string>>(new Set());
  useEffect(() => {
    leerJSON<string[]>(CLAVES.qrUsados, []).then((ids) => {
      usados.current = new Set(ids);
    });
  }, []);

  const barrido = useSharedValue(0);
  useEffect(() => {
    barrido.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [barrido]);
  const laser = useAnimatedStyle(() => ({ transform: [{ translateY: barrido.value * (MARCO - 4) }] }));

  const alLeer = ({ data }: BarcodeScanningResult) => {
    if (bloqueado.current || !usuario?.parqueaderoId) return;
    bloqueado.current = true;
    const r = validarCodigo(data, usuario.parqueaderoId);
    if (r.valido) {
      const ya = reservas.find((x) => x.id === r.reservaId);
      let motivo: string | null = null;
      if (usados.current.has(r.reservaId) || ya?.estado === 'usada') motivo = 'Este código ya se usó.';
      else if (ya?.estado === 'cancelada') motivo = 'Esta reserva fue cancelada.';
      else if (ya?.estado === 'vencida') motivo = 'La reserva ya venció.';
      // moverCupo devuelve false si no queda cupo: solo se registra la entrada si sí cabía.
      else if (!moverCupo(usuario.parqueaderoId, 1)) motivo = 'El parqueadero está lleno.';
      if (motivo) {
        setResultado({ valido: false, motivo });
        vibrar.error();
        return;
      }
      usados.current.add(r.reservaId);
      guardarJSON(CLAVES.qrUsados, [...usados.current]);
      if (ya) marcarUsada(ya.id);
      vibrar.exito();
    } else {
      vibrar.error();
    }
    setResultado(r);
  };

  const otro = () => {
    setResultado(null);
    setCodigoManual('');
    bloqueado.current = false;
  };

  if (!ES_WEB && !permiso) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  if (!ES_WEB && !permiso?.granted) {
    return (
      <View style={[styles.permiso, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Animated.View entering={ZoomIn.springify()} style={[styles.permisoIcono, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="camera" size={42} color={colors.tint} />
        </Animated.View>
        <Text variant="title" center>
          Escanea los QR de las reservas
        </Text>
        <Text color="textMuted" center>
          Necesitamos la cámara para validar la entrada de los conductores. No guardamos fotos.
        </Text>
        <Button
          titulo={permiso?.canAskAgain ? 'Permitir cámara' : 'Abrir ajustes'}
          icono="camera"
          grande
          style={{ alignSelf: 'stretch' }}
          onPress={() => (permiso?.canAskAgain ? pedirPermiso() : Linking.openSettings())}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {enfocada && !ES_WEB && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={linterna}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={resultado ? undefined : alLeer}
        />
      )}

      <View style={[StyleSheet.absoluteFill, styles.capa]} pointerEvents="box-none">
        <View style={[styles.arriba, { paddingTop: insets.top + spacing.lg }]}>
          <Text variant="title" style={{ color: '#FFFFFF' }}>
            Validar reserva
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{ES_WEB ? 'Pega el texto del código QR del conductor' : 'Apunta al código QR del conductor'}</Text>
        </View>

        <View style={styles.marco}>
          {(['tl', 'tr', 'bl', 'br'] as const).map((e) => (
            <View key={e} style={[styles.esquina, styles[e]]} />
          ))}
          {!resultado && <Animated.View style={[styles.laser, laser]} />}
        </View>

        {ES_WEB ? (
          !resultado && (
            <View style={styles.manual}>
              <TextInput
                value={codigoManual}
                onChangeText={setCodigoManual}
                placeholder="PARKNOW|ABC123|p1|…"
                placeholderTextColor="rgba(255,255,255,0.5)"
                autoCapitalize="characters"
                style={[styles.campo, { borderColor: colors.border }]}
                accessibilityLabel="Código de la reserva"
              />
              <Button titulo="Validar" icono="checkmark" onPress={() => alLeer({ data: codigoManual.trim() } as BarcodeScanningResult)} />
            </View>
          )
        ) : (
          <PressableScale
            onPress={() => setLinterna((l) => !l)}
            style={[styles.linterna, { backgroundColor: linterna ? '#FFFFFF' : 'rgba(255,255,255,0.18)' }]}
            accessibilityLabel={linterna ? 'Apagar linterna' : 'Encender linterna'}
          >
            <Ionicons name={linterna ? 'flashlight' : 'flashlight-outline'} size={24} color={linterna ? '#03045E' : '#FFFFFF'} />
          </PressableScale>
        )}
      </View>

      {resultado && (
        <Animated.View
          entering={FadeInDown.springify().damping(15)}
          exiting={FadeOut}
          style={[styles.resultado, { backgroundColor: colors.surface, bottom: 100 + insets.bottom }]}
        >
          <View style={[styles.resultadoIcono, { backgroundColor: resultado.valido ? colors.successBg : colors.dangerBg }]}>
            <Ionicons name={resultado.valido ? 'checkmark-circle' : 'close-circle'} size={36} color={resultado.valido ? colors.success : colors.danger} />
          </View>
          <Text variant="title" center>
            {resultado.valido ? 'Entrada autorizada' : 'Código no válido'}
          </Text>
          <Text color="textMuted" center>
            {resultado.valido
              ? `Reserva #${resultado.reservaId} · llegada ${formatoHora(resultado.llegada.toISOString())} · ${resultado.horas} h. Se registró la entrada.`
              : resultado.motivo}
          </Text>
          <Button titulo="Escanear otro" icono="scan" onPress={otro} style={{ alignSelf: 'stretch' }} />
        </Animated.View>
      )}
    </View>
  );
}

const B = 4;
const L = 34;
const styles = StyleSheet.create({
  manual: { alignSelf: 'stretch', marginHorizontal: spacing.xl, gap: spacing.md },
  campo: { color: '#FFFFFF', borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: 'rgba(255,255,255,0.08)' },
  permiso: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.lg },
  permisoIcono: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  capa: { alignItems: 'center', justifyContent: 'space-between', paddingBottom: 130, backgroundColor: 'rgba(0,0,0,0.35)' },
  arriba: { alignItems: 'center', gap: 4 },
  marco: { width: MARCO, height: MARCO, overflow: 'hidden' },
  esquina: { position: 'absolute', width: L, height: L, borderColor: '#00B4D8' },
  tl: { top: 0, left: 0, borderTopWidth: B, borderLeftWidth: B, borderTopLeftRadius: 16 },
  tr: { top: 0, right: 0, borderTopWidth: B, borderRightWidth: B, borderTopRightRadius: 16 },
  bl: { bottom: 0, left: 0, borderBottomWidth: B, borderLeftWidth: B, borderBottomLeftRadius: 16 },
  br: { bottom: 0, right: 0, borderBottomWidth: B, borderRightWidth: B, borderBottomRightRadius: 16 },
  laser: { position: 'absolute', left: 12, right: 12, height: 3, borderRadius: 2, backgroundColor: '#00B4D8', shadowColor: '#00B4D8', shadowOpacity: 1, shadowRadius: 8 },
  linterna: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  resultado: { position: 'absolute', left: spacing.lg, right: spacing.lg, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md, alignItems: 'center' },
  resultadoIcono: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
});
