import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// La vibración solo existe en el celular; en web no hace nada.
const activo = Platform.OS !== 'web';

export const vibrar = {
  toque: () => activo && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  fuerte: () => activo && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}),
  seleccion: () => activo && Haptics.selectionAsync().catch(() => {}),
  exito: () => activo && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  error: () => activo && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
};
