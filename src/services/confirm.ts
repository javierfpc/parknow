import { Alert, Platform } from 'react-native';

type Opciones = { titulo: string; mensaje: string; aceptar: string; cancelar: string; destructivo?: boolean };

/**
 * Pide confirmación al usuario y resuelve true si acepta.
 * Validación de plataforma: en iOS y Android usa el diálogo nativo (Alert);
 * en la web Alert.alert con botones no hace nada, así que se usa window.confirm.
 */
export function confirmar({ titulo, mensaje, aceptar, cancelar, destructivo = false }: Opciones): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensaje}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      titulo,
      mensaje,
      [
        { text: cancelar, style: 'cancel', onPress: () => resolve(false) },
        { text: aceptar, style: destructivo ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      // Android: tocar fuera del diálogo lo cierra; cuenta como cancelar.
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
