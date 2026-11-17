import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type Biometria = { disponible: boolean; nombre: string; icono: 'finger-print' | 'scan' };

/**
 * Detecta la biometría del equipo. El nombre cambia según el sistema:
 * en iOS es Face ID o Touch ID y en Android "huella" o "rostro".
 */
export async function detectarBiometria(): Promise<Biometria> {
  if (Platform.OS === 'web') return { disponible: false, nombre: 'Biometría', icono: 'finger-print' };
  const [hardware, inscrita, tipos] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);
  const rostro = tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  const nombre = Platform.OS === 'ios' ? (rostro ? 'Face ID' : 'Touch ID') : rostro ? 'tu rostro' : 'tu huella';
  return { disponible: hardware && inscrita, nombre, icono: rostro ? 'scan' : 'finger-print' };
}

export async function autenticar(motivo: string): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  try {
    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: motivo,
      cancelLabel: 'Cancelar',
      // En Android se permite el PIN o patrón como respaldo; en iOS, el código del equipo.
      disableDeviceFallback: false,
      fallbackLabel: 'Usar código',
    });
    return resultado.success;
  } catch {
    // Biometría bloqueada por intentos o sin permiso de Face ID: se trata como no verificada.
    return false;
  }
}
