import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** Datos no sensibles (reservas, favoritos) en AsyncStorage. */
export async function leerJSON<T>(clave: string, porDefecto: T): Promise<T> {
  try {
    const valor = await AsyncStorage.getItem(clave);
    return valor ? (JSON.parse(valor) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

export async function guardarJSON(clave: string, valor: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Si el almacenamiento falla, la app sigue funcionando en memoria.
  }
}

/**
 * Datos sensibles (sesión) en el almacenamiento cifrado del sistema:
 * Keychain en iOS y Keystore en Android. En web no existe, así que se usa AsyncStorage.
 */
export const almacenSeguro = {
  async leer(clave: string): Promise<string | null> {
    if (Platform.OS === 'web') return AsyncStorage.getItem(clave);
    return SecureStore.getItemAsync(clave);
  },
  async guardar(clave: string, valor: string): Promise<void> {
    if (Platform.OS === 'web') return AsyncStorage.setItem(clave, valor);
    return SecureStore.setItemAsync(clave, valor);
  },
  async borrar(clave: string): Promise<void> {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(clave);
    return SecureStore.deleteItemAsync(clave);
  },
};

export const CLAVES = {
  sesion: 'parknow.sesion',
  usuarioBiometria: 'parknow.usuario-biometria',
  reservas: 'parknow.reservas',
  favoritos: 'parknow.favoritos',
  onboarding: 'parknow.onboarding',
} as const;
