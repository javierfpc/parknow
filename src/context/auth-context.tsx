import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { autenticar } from '@/services/biometrics';
import { almacenSeguro, CLAVES } from '@/services/storage';
import type { Usuario } from '@/types';

// Cuentas de demostración (la app funciona sin servidor).
const CUENTAS: (Usuario & { contrasena: string })[] = [
  { id: 'u1', nombre: 'Sara Acosta', correo: 'conductor@parknow.co', contrasena: '123456', rol: 'conductor' },
  { id: 'u2', nombre: 'Admin Calle 72', correo: 'admin@parknow.co', contrasena: 'admin123', rol: 'admin', parqueaderoId: 'p1' },
];

export class CredencialesInvalidas extends Error {}

type AuthContextType = {
  usuario: Usuario | null;
  cargando: boolean;
  /** Correo guardado para entrar con biometría, si la persona la activó. */
  correoBiometria: string | null;
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>;
  iniciarConBiometria: (motivo: string) => Promise<boolean>;
  activarBiometria: (activar: boolean) => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function sinContrasena({ contrasena: _c, ...u }: Usuario & { contrasena: string }): Usuario {
  return u;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [correoBiometria, setCorreoBiometria] = useState<string | null>(null);

  // Restaura la sesión guardada de forma cifrada al abrir la app.
  useEffect(() => {
    (async () => {
      try {
        const [sesion, bio] = await Promise.all([
          almacenSeguro.leer(CLAVES.sesion),
          almacenSeguro.leer(CLAVES.usuarioBiometria),
        ]);
        if (sesion) setUsuario(JSON.parse(sesion) as Usuario);
        setCorreoBiometria(bio);
      } catch {
        // Sesión ilegible: se pide ingresar de nuevo.
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const entrar = useCallback(async (u: Usuario) => {
    await almacenSeguro.guardar(CLAVES.sesion, JSON.stringify(u));
    setUsuario(u);
  }, []);

  const iniciarSesion = useCallback(
    async (correo: string, contrasena: string) => {
      await new Promise((r) => setTimeout(r, 700)); // simula la petición
      const cuenta = CUENTAS.find((c) => c.correo === correo.trim().toLowerCase() && c.contrasena === contrasena);
      if (!cuenta) throw new CredencialesInvalidas('Correo o contraseña incorrectos');
      await entrar(sinContrasena(cuenta));
    },
    [entrar],
  );

  const iniciarConBiometria = useCallback(
    async (motivo: string) => {
      const cuenta = CUENTAS.find((c) => c.correo === correoBiometria);
      if (!cuenta) return false;
      if (!(await autenticar(motivo))) return false;
      await entrar(sinContrasena(cuenta));
      return true;
    },
    [correoBiometria, entrar],
  );

  const activarBiometria = useCallback(
    async (activar: boolean) => {
      if (activar && usuario) {
        await almacenSeguro.guardar(CLAVES.usuarioBiometria, usuario.correo);
        setCorreoBiometria(usuario.correo);
      } else {
        await almacenSeguro.borrar(CLAVES.usuarioBiometria);
        setCorreoBiometria(null);
      }
    },
    [usuario],
  );

  const cerrarSesion = useCallback(async () => {
    await almacenSeguro.borrar(CLAVES.sesion);
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, correoBiometria, iniciarSesion, iniciarConBiometria, activarBiometria, cerrarSesion }),
    [usuario, cargando, correoBiometria, iniciarSesion, iniciarConBiometria, activarBiometria, cerrarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
