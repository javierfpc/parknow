import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let configurado = false;

/** Muestra las notificaciones también con la app abierta y crea el canal de Android. */
export async function configurarNotificaciones(): Promise<void> {
  if (configurado || Platform.OS === 'web') return;
  configurado = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  // Android 8+ exige un canal; iOS no lo usa.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reservas', {
      name: 'Reservas',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: '#00B4D8',
    });
  }
}

export async function pedirPermiso(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return true;
  const nuevo = await Notifications.requestPermissionsAsync();
  return nuevo.granted;
}

async function programar(titulo: string, cuerpo: string, segundos: number, identificador?: string): Promise<void> {
  if (!(await pedirPermiso())) return;
  await Notifications.scheduleNotificationAsync({
    identifier: identificador,
    content: { title: titulo, body: cuerpo, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(segundos)),
      channelId: Platform.OS === 'android' ? 'reservas' : undefined,
    },
  });
}

const idRecordatorio = (reservaId: string) => `recordatorio-${reservaId}`;

export async function notificarReservaConfirmada(parqueadero: string, llegada: Date, reservaId: string): Promise<void> {
  try {
    await programar('Reserva confirmada ✅', `Tu cupo en ${parqueadero} te espera. Muestra el QR al llegar.`, 2);
    const recordatorio = (llegada.getTime() - Date.now()) / 1000 - 10 * 60;
    if (recordatorio > 5) {
      await programar('Tu reserva empieza en 10 minutos', `${parqueadero}: ten listo tu código QR.`, recordatorio, idRecordatorio(reservaId));
    }
  } catch {
    // Expo Go o permisos denegados: la reserva sigue siendo válida.
  }
}

/** Quita el recordatorio de una reserva cancelada o reemplazada. */
export async function cancelarRecordatorio(reservaId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(idRecordatorio(reservaId));
  } catch {
    // No había recordatorio programado.
  }
}

/** Al cerrar sesión no deben llegar recordatorios de la cuenta anterior. */
export async function cancelarTodosLosRecordatorios(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Sin permisos o sin notificaciones programadas.
  }
}
