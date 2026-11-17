import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { calcularTotal } from '@/lib/parking';
import { notificarReservaConfirmada } from '@/services/notifications';
import { CLAVES, guardarJSON, leerJSON } from '@/services/storage';
import type { Parqueadero, Reserva } from '@/types';

export const PREFIJO_QR = 'PARKNOW';

type ReservationsContextType = {
  reservas: Reserva[];
  activa: Reserva | null;
  crear: (p: Parqueadero, llegada: Date, horas: number) => Promise<Reserva>;
  cancelar: (id: string) => void;
  marcarUsada: (id: string) => void;
};

const ReservationsContext = createContext<ReservationsContextType | undefined>(undefined);

/** Una reserva activa vence cuando termina el tiempo reservado. */
function conEstadoActual(r: Reserva): Reserva {
  if (r.estado !== 'activa') return r;
  const fin = new Date(r.llegada).getTime() + r.horas * 3600_000;
  return Date.now() > fin ? { ...r, estado: 'vencida' } : r;
}

export function ReservationsProvider({ children }: { children: ReactNode }) {
  const [reservas, setReservas] = useState<Reserva[]>([]);

  useEffect(() => {
    leerJSON<Reserva[]>(CLAVES.reservas, []).then((r) => setReservas(r.map(conEstadoActual)));
  }, []);

  const persistir = useCallback((fn: (r: Reserva[]) => Reserva[]) => {
    setReservas((actual) => {
      const nuevo = fn(actual);
      guardarJSON(CLAVES.reservas, nuevo);
      return nuevo;
    });
  }, []);

  const crear = useCallback(
    async (p: Parqueadero, llegada: Date, horas: number) => {
      const id = Math.random().toString(36).slice(2, 8).toUpperCase();
      const reserva: Reserva = {
        id,
        parqueaderoId: p.id,
        parqueaderoNombre: p.nombre,
        direccion: `${p.direccion}, ${p.barrio}`,
        llegada: llegada.toISOString(),
        horas,
        total: calcularTotal(p, horas),
        estado: 'activa',
        creadaEn: new Date().toISOString(),
        codigo: [PREFIJO_QR, id, p.id, llegada.toISOString(), horas].join('|'),
      };
      // Solo una reserva activa a la vez.
      persistir((r) => [reserva, ...r.map((x) => (x.estado === 'activa' ? { ...x, estado: 'cancelada' as const } : x))]);
      await notificarReservaConfirmada(p.nombre, llegada);
      return reserva;
    },
    [persistir],
  );

  const cancelar = useCallback(
    (id: string) => persistir((r) => r.map((x) => (x.id === id ? { ...x, estado: 'cancelada' } : x))),
    [persistir],
  );
  const marcarUsada = useCallback(
    (id: string) => persistir((r) => r.map((x) => (x.id === id ? { ...x, estado: 'usada' } : x))),
    [persistir],
  );

  const valor = useMemo(() => {
    const actuales = reservas.map(conEstadoActual);
    return { reservas: actuales, activa: actuales.find((r) => r.estado === 'activa') ?? null, crear, cancelar, marcarUsada };
  }, [reservas, crear, cancelar, marcarUsada]);

  return <ReservationsContext.Provider value={valor}>{children}</ReservationsContext.Provider>;
}

export function useReservas() {
  const ctx = useContext(ReservationsContext);
  if (!ctx) throw new Error('useReservas debe usarse dentro de ReservationsProvider');
  return ctx;
}

export type ResultadoValidacion =
  | { valido: true; reservaId: string; parqueaderoId: string; llegada: Date; horas: number }
  | { valido: false; motivo: string };

/** Valida el contenido de un QR leído por la cámara del administrador. */
export function validarCodigo(codigo: string, parqueaderoId: string): ResultadoValidacion {
  const partes = codigo.split('|');
  if (partes.length !== 5 || partes[0] !== PREFIJO_QR) return { valido: false, motivo: 'El código no es de ParkNow.' };
  const [, reservaId, pId, llegadaIso, horasTxt] = partes;
  const llegada = new Date(llegadaIso);
  const horas = Number(horasTxt);
  if (Number.isNaN(llegada.getTime()) || !Number.isFinite(horas)) return { valido: false, motivo: 'El código está dañado.' };
  if (pId !== parqueaderoId) return { valido: false, motivo: 'La reserva es de otro parqueadero.' };
  const ahora = Date.now();
  if (ahora < llegada.getTime() - 60 * 60_000) return { valido: false, motivo: 'Aún es muy temprano para esta reserva.' };
  if (ahora > llegada.getTime() + horas * 3600_000) return { valido: false, motivo: 'La reserva ya venció.' };
  return { valido: true, reservaId, parqueaderoId: pId, llegada, horas };
}
