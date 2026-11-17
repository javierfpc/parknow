import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { PARQUEADEROS } from '@/data/parqueaderos';
import { guardarJSON, leerJSON, CLAVES } from '@/services/storage';
import type { Parqueadero } from '@/types';

type ParkingContextType = {
  parqueaderos: Parqueadero[];
  actualizadoEn: Date;
  /** Vuelve a consultar la disponibilidad (agitar el celular o deslizar hacia abajo). */
  refrescar: () => Promise<void>;
  /** Registra una entrada (+1) o salida (−1) en un parqueadero. Devuelve false si no se pudo. */
  moverCupo: (id: string, delta: 1 | -1) => boolean;
  favoritos: string[];
  alternarFavorito: (id: string) => void;
};

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

// Simula la llegada y salida de carros para que la disponibilidad se sienta "en vivo".
function variar(lista: Parqueadero[], intensidad: number, fijo?: string): Parqueadero[] {
  return lista.map((p) => {
    if (p.id === fijo || Math.random() > 0.45) return p;
    const delta = Math.round((Math.random() - 0.5) * intensidad);
    return { ...p, ocupados: Math.min(p.capacidad, Math.max(0, p.ocupados + delta)) };
  });
}

export function ParkingProvider({ children, parqueaderoAdministrado }: { children: ReactNode; parqueaderoAdministrado?: string }) {
  const [parqueaderos, setParqueaderos] = useState<Parqueadero[]>(PARQUEADEROS);
  const [actualizadoEn, setActualizadoEn] = useState(new Date());
  const [favoritos, setFavoritos] = useState<string[]>([]);

  useEffect(() => {
    leerJSON<string[]>(CLAVES.favoritos, []).then(setFavoritos);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setParqueaderos((l) => variar(l, 4, parqueaderoAdministrado));
      setActualizadoEn(new Date());
    }, 12000);
    return () => clearInterval(id);
  }, [parqueaderoAdministrado]);

  const refrescar = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 600));
    setParqueaderos((l) => variar(l, 8, parqueaderoAdministrado));
    setActualizadoEn(new Date());
  }, [parqueaderoAdministrado]);

  const moverCupo = useCallback(
    (id: string, delta: 1 | -1) => {
      const p = parqueaderos.find((x) => x.id === id);
      if (!p) return false;
      const nuevo = p.ocupados + delta;
      if (nuevo < 0 || nuevo > p.capacidad) return false;
      setParqueaderos((l) => l.map((x) => (x.id === id ? { ...x, ocupados: nuevo } : x)));
      setActualizadoEn(new Date());
      return true;
    },
    [parqueaderos],
  );

  const alternarFavorito = useCallback((id: string) => {
    setFavoritos((f) => {
      const nuevo = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
      guardarJSON(CLAVES.favoritos, nuevo);
      return nuevo;
    });
  }, []);

  const valor = useMemo(
    () => ({ parqueaderos, actualizadoEn, refrescar, moverCupo, favoritos, alternarFavorito }),
    [parqueaderos, actualizadoEn, refrescar, moverCupo, favoritos, alternarFavorito],
  );
  return <ParkingContext.Provider value={valor}>{children}</ParkingContext.Provider>;
}

export function useParqueaderos() {
  const ctx = useContext(ParkingContext);
  if (!ctx) throw new Error('useParqueaderos debe usarse dentro de ParkingProvider');
  return ctx;
}
