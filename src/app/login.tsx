import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/context/auth-context';
import { detectarBiometria, type Biometria } from '@/services/biometrics';
import { vibrar } from '@/services/haptics';
import { fonts, radius, shadow, spacing, useTheme } from '@/theme';

const DEMOS = [
  { texto: 'Conductor', icono: 'car-sport' as const, correo: 'conductor@parknow.co', clave: '123456' },
  { texto: 'Administrador', icono: 'business' as const, correo: 'admin@parknow.co', clave: 'admin123' },
];

export default function LoginScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { iniciarSesion, iniciarConBiometria, correoBiometria } = useAuth();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [bio, setBio] = useState<Biometria | null>(null);
  const claveRef = useRef<TextInput>(null);

  useEffect(() => {
    detectarBiometria().then(setBio);
  }, []);

  // Animación de la cabecera: el logo flota y los círculos de fondo respiran.
  const flotar = useSharedValue(0);
  useEffect(() => {
    flotar.value = withRepeat(
      withSequence(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.quad) })),
      -1,
    );
  }, [flotar]);
  const logo = useAnimatedStyle(() => ({ transform: [{ translateY: -8 * flotar.value }, { rotate: `${-4 + 8 * flotar.value}deg` }] }));
  const burbuja = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.12 * flotar.value }] }));

  const entrar = async () => {
    setError('');
    if (!correo.includes('@') || clave.length < 6) {
      setError('Escribe un correo válido y una contraseña de al menos 6 caracteres.');
      vibrar.error();
      return;
    }
    setCargando(true);
    try {
      await iniciarSesion(correo, clave);
      vibrar.exito();
    } catch {
      setError('Correo o contraseña incorrectos.');
      vibrar.error();
    } finally {
      setCargando(false);
    }
  };

  const entrarConBiometria = async () => {
    const ok = await iniciarConBiometria('Ingresa a ParkNow');
    if (!ok) toast('No se pudo verificar tu identidad', 'error');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 32 }]}>
        <Animated.View style={[styles.burbuja, { top: -60, right: -40 }, burbuja]} />
        <Animated.View style={[styles.burbuja, { width: 160, height: 160, bottom: -50, left: -50, opacity: 0.08 }, burbuja]} />
        <Animated.View entering={ZoomIn.springify().damping(12)} style={logo}>
          <LogoMark size={76} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Text variant="display" style={{ color: '#FFFFFF', marginTop: spacing.lg }} center>
            Park<Text variant="display" style={{ color: '#90E0EF' }}>Now</Text>
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }} center>
            Encuentra, reserva y entra con QR.
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* Validación de plataforma: iOS desplaza con padding; Android ya redimensiona la ventana. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInUp.delay(250).springify().damping(16)} style={[styles.tarjeta, { backgroundColor: colors.surface }, shadow(3)]}>
            <Text variant="title">Ingresa a tu cuenta</Text>

            <Campo icono="mail-outline" etiqueta="Correo">
              <TextInput
                value={correo}
                onChangeText={setCorreo}
                placeholder="tu@correo.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => claveRef.current?.focus()}
                style={[styles.input, { color: colors.text }]}
              />
            </Campo>
            <Campo icono="lock-closed-outline" etiqueta="Contraseña">
              <TextInput
                ref={claveRef}
                value={clave}
                onChangeText={setClave}
                placeholder="••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!verClave}
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={entrar}
                style={[styles.input, { color: colors.text }]}
              />
              <Pressable onPress={() => setVerClave((v) => !v)} hitSlop={10} accessibilityLabel={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                <Ionicons name={verClave ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
              </Pressable>
            </Campo>

            {error ? (
              <Animated.View entering={FadeInDown} style={[styles.error, { backgroundColor: colors.dangerBg }]}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text variant="caption" style={{ color: colors.danger, flex: 1 }}>
                  {error}
                </Text>
              </Animated.View>
            ) : null}

            <Button titulo="Ingresar" icono="arrow-forward" grande cargando={cargando} onPress={entrar} />

            {correoBiometria && bio?.disponible && (
              <Button titulo={`Entrar con ${bio.nombre}`} icono={bio.icono} variante="secundario" onPress={entrarConBiometria} />
            )}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400)} style={{ gap: spacing.sm }}>
            <Text variant="label" color="textMuted" center>
              Cuentas de demostración
            </Text>
            <View style={styles.demos}>
              {DEMOS.map((d) => (
                <PressableScale
                  key={d.correo}
                  onPress={() => {
                    setCorreo(d.correo);
                    setClave(d.clave);
                    setError('');
                  }}
                  style={[styles.demo, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  accessibilityLabel={`Usar cuenta de ${d.texto}`}
                >
                  <Ionicons name={d.icono} size={20} color={colors.tint} />
                  <Text variant="bodyStrong">{d.texto}</Text>
                </PressableScale>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Campo({ icono, etiqueta, children }: { icono: keyof typeof Ionicons.glyphMap; etiqueta: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text variant="caption" color="textMuted">
        {etiqueta}
      </Text>
      <View style={[styles.campo, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Ionicons name={icono} size={19} color={colors.textMuted} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingBottom: 72, alignItems: 'center', overflow: 'hidden' },
  burbuja: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: '#00B4D8', opacity: 0.18 },
  form: { paddingHorizontal: spacing.xl, gap: spacing.xl, marginTop: -48 },
  tarjeta: { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg },
  campo: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: 14 },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 15, height: '100%' },
  error: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: radius.sm },
  demos: { flexDirection: 'row', gap: spacing.md },
  demo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: radius.md, borderWidth: 1 },
});
