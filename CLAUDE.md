# ParkNow

Proyecto de clase de la asignatura **Desarrollo de Aplicaciones Móviles Híbridas** (Universidad Compensar).
Integrantes: Sara Catalina Acosta Moreno, Javier Felipe Patiño Chaves y Jhon Jairo Martínez Forero.

**No es Cupark.** Cupark (`../cupark`) es la startup real y vive en otro repositorio. No copiar código, datos, marca, claves ni documentos entre los dos proyectos, y no tocar `../cupark` desde aquí.

## Qué es

App móvil (React Native + Expo SDK 57, expo-router) para buscar, reservar y entrar con QR a parqueaderos de Bogotá. Funciona **sin servidor**: los datos de prueba están en `src/data/parqueaderos.ts` y las cuentas de demostración en `src/context/auth-context.tsx`. Así el APK funciona en cualquier celular.

Cuentas de demostración: `conductor@parknow.co` / `123456` y `admin@parknow.co` / `admin123`, que administra el parqueadero `p1`.

## Requisitos de la clase que la app debe cumplir

Parcial práctico del corte II, que es el principal:
- **Navegación únicamente por pestañas.** El detalle de un parqueadero es una hoja inferior (`BottomSheet`), no una ruta nueva. El ingreso queda fuera de las pestañas, protegido con `Stack.Protected`.
- Dos o más funciones nativas y un sensor:
  - GPS: `expo-location`;
  - cámara para el QR, con linterna: `expo-camera`;
  - biometría: `expo-local-authentication`;
  - notificaciones: `expo-notifications`;
  - vibración: `expo-haptics`;
  - almacenamiento seguro: `expo-secure-store`;
  - sensor: el acelerómetro (`expo-sensors`), que actualiza los cupos al agitar el celular (`src/hooks/use-agitar.ts`).
- **Validar el sistema operativo** con `Platform.OS` / `Platform.select`:
  - sombras frente a elevación;
  - desenfoque de la barra de pestañas solo en iOS;
  - Face ID frente a huella;
  - el canal de notificaciones de Android;
  - `KeyboardAvoidingView`;
  - el botón «atrás» de Android cierra la hoja;
  - la app de mapas que abre «Cómo llegar»;
  - el Keystore frente al Llavero.
  Cada diferencia lleva un comentario «Validación de plataforma».
- Interfaz cuidada (UI/UX) y **APK con EAS Build** (`eas build -p android --profile preview`).

Talleres anteriores que se pueden mostrar aquí: animaciones con Reanimated (rebote al presionar, hoja que se arrastra, indicador de las pestañas, listas escalonadas, medidor circular) y, si se pide, una versión web en Next.js en una carpeta aparte.

## Mapa

Leaflet dentro de un `react-native-webview` (`src/components/map/`), con teselas de OpenStreetMap (CARTO ya exige llave; el tema oscuro es un filtro CSS). En la web se usa `parking-map.web.tsx`, con un `<iframe>`. **No usa Google Maps ni llaves de API**: así funciona en Expo Go y en el APK sin facturación. React Native y la página del mapa se comunican así: `postMessage` hacia React Native, e `injectJavaScript` (`window.ponerDatos`, `window.volar`) hacia el mapa.

## Estructura

- `src/app/`: rutas.
  - `login.tsx`;
  - `(conductor)/`, con las pestañas index, mapa, reservas y perfil;
  - `(admin)/`, con las pestañas panel, escanear y cuenta.
- `src/components/`: `ui/` (componentes base), `parking/`, `map/`, `navigation/tab-bar.tsx`, `screens/`, `brand/`.
- `src/context/`: auth, parking (cupos simulados en vivo y favoritos), reservations (reservas y validación del QR).
- `src/hooks/`, `src/services/` (storage, biometrics, notifications, haptics), `src/lib/` (funciones puras), `src/theme/` (paleta del documento, temas claro y oscuro, Plus Jakarta Sans).

## Reglas

- TypeScript estricto: `npx tsc --noEmit` debe pasar, igual que `npx expo-doctor`.
- Colores y espaciados solo desde `src/theme`. La disponibilidad siempre va con ícono + texto, nunca solo con color.
- Textos de la interfaz en español.
- Las dependencias nativas se instalan con `npx expo install` (versiones de SDK 57).
- Commits convencionales (`feat:`, `fix:`, `docs:`…), con la identidad de git configurada y sin líneas de atribución a Claude.

## Comandos

- `npm install`.
- `npx expo start --lan`: abrir en Expo Go con `exp://<IP-del-PC>:8081`. Si hay varias interfaces de red, fijar `REACT_NATIVE_PACKAGER_HOSTNAME=<IP>`. Si el firewall bloquea, usar `--tunnel`.
- `npx eas-cli login` y luego `npx eas-cli build -p android --profile preview`: el APK.

## Estado

- 2026-11-17: app móvil completa con datos de prueba; el bundle de Android compila. Faltan la prueba en un celular real, el primer APK con EAS y, si da el tiempo, la web en Next.js. La entrega es el 2026-11-17 a las 5 p. m.
