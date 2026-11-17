# ParkNow

Sistema móvil para la gestión inteligente de parqueaderos urbanos en Bogotá: encuentra un parqueadero cercano, reserva tu cupo, paga con tu huella y entra mostrando un código QR.

Proyecto de la asignatura **Desarrollo de Aplicaciones Móviles Híbridas**, Universidad Compensar.
Integrantes: Sara Catalina Acosta Moreno, Javier Felipe Patiño Chaves y Jhon Jairo Martínez Forero.

## Cuentas de demostración

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Conductor | `conductor@parknow.co` | `123456` |
| Administrador (Parqueadero Calle 72) | `admin@parknow.co` | `admin123` |

En la pantalla de ingreso, los botones «Conductor» y «Administrador» llenan los datos de la cuenta. La app funciona sin servidor, con datos de prueba.

## Funcionalidades

**Conductor** (pestañas Inicio, Mapa, Reservas y Perfil):
- Lista de parqueaderos cercanos con buscador, filtros (más cerca, con cupo, económicos, favoritos, eléctrico, cubierto) y disponibilidad en vivo.
- Mapa con pines de precio y disponibilidad, y tu ubicación por GPS.
- Detalle en una hoja inferior que se arrastra. Se reserva eligiendo la hora de llegada y las horas, y se paga confirmando con huella o Face ID.
- Ticket con código QR, cuenta regresiva, «Cómo llegar» y cancelación.
- Notificación al confirmar la reserva y recordatorio 10 minutos antes.
- Agitar el celular actualiza los cupos.

**Administrador** (pestañas Panel, Escanear y Cuenta):
- Medidor de ocupación animado, con botones «Entró» y «Salió».
- Escáner de QR con la cámara (y linterna) para validar las reservas.

## Funciones nativas y sensor

| Función | Librería | Uso |
| --- | --- | --- |
| GPS | `expo-location` | Parqueaderos cercanos y tu posición en el mapa |
| Cámara | `expo-camera` | Escanear el QR de la reserva y usar la linterna |
| Biometría | `expo-local-authentication` | Ingresar y confirmar pagos |
| Notificaciones | `expo-notifications` | Confirmación y recordatorio de la reserva |
| Vibración | `expo-haptics` | Respuesta táctil |
| Almacenamiento seguro | `expo-secure-store` | Sesión cifrada (Keystore o Llavero) |
| **Sensor: acelerómetro** | `expo-sensors` | Agitar el celular actualiza la disponibilidad |

## Adaptación a Android e iOS

| Aspecto | Android | iOS |
| --- | --- | --- |
| Sombras | `elevation` | `shadow*` |
| Barra de pestañas | Fondo sólido | Desenfoque (`expo-blur`) |
| Biometría | «huella» o «rostro» | «Face ID» o «Touch ID» |
| Notificaciones | Canal propio (obligatorio desde Android 8) | No usa canal |
| Teclado | La ventana se redimensiona | `KeyboardAvoidingView` con padding |
| Botón «atrás» | Cierra la hoja de detalle | No aplica |
| «Cómo llegar» | Google Maps en modo navegación | Apple Maps |
| Sesión | Keystore de Android | Llavero de iOS |

## Tecnologías

React Native 0.86, Expo SDK 57, expo-router (navegación por pestañas), React Native Reanimated 4, Gesture Handler, Leaflet con mapas de OpenStreetMap/CARTO (sin llave de API) dentro de `react-native-webview`, TypeScript estricto.

## Estructura

```
src/
  app/            rutas: login, (conductor)/ y (admin)/ con sus pestañas
  components/     ui/, parking/, map/, navigation/, screens/, brand/
  context/        sesión, parqueaderos y reservas
  hooks/          ubicación, acelerómetro y búsqueda
  services/       almacenamiento, biometría, notificaciones y vibración
  lib/            funciones puras (distancias, precios, cómo llegar)
  theme/          colores (claro y oscuro), tipografía, espaciados y sombras
  data/           parqueaderos de prueba
```

## Cómo ejecutarlo

```bash
npm install
npx expo start
```

Abre el proyecto en **Expo Go** escaneando el QR que aparece en la terminal.

## Generar el APK

```bash
npx eas-cli login
npx eas-cli build -p android --profile preview
```
