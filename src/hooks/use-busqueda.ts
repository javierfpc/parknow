import { useMemo, useState } from 'react';

import { useParqueaderos } from '@/context/parking-context';
import { cuposLibres, distanciaKm } from '@/lib/parking';
import type { Coordenadas, Parqueadero } from '@/types';

export type Filtro = 'cerca' | 'disponibles' | 'economicos' | 'favoritos' | 'electrico' | 'cubierto';

export const FILTROS: { id: Filtro; texto: string; icono: 'navigate' | 'checkmark-circle' | 'cash' | 'heart' | 'flash' | 'umbrella' }[] = [
  { id: 'cerca', texto: 'Más cerca', icono: 'navigate' },
  { id: 'disponibles', texto: 'Con cupo', icono: 'checkmark-circle' },
  { id: 'economicos', texto: 'Económicos', icono: 'cash' },
  { id: 'favoritos', texto: 'Favoritos', icono: 'heart' },
  { id: 'electrico', texto: 'Eléctrico', icono: 'flash' },
  { id: 'cubierto', texto: 'Cubierto', icono: 'umbrella' },
];

export type ParqueaderoConDistancia = Parqueadero & { distancia: number };

/** Búsqueda por texto y filtros, siempre ordenada según el filtro elegido. */
export function useBusqueda(coords: Coordenadas) {
  const { parqueaderos, favoritos } = useParqueaderos();
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('cerca');

  const resultados = useMemo<ParqueaderoConDistancia[]>(() => {
    const q = texto.trim().toLowerCase();
    let lista = parqueaderos
      .map((p) => ({ ...p, distancia: distanciaKm(coords, p) }))
      .filter((p) => !q || `${p.nombre} ${p.barrio} ${p.direccion}`.toLowerCase().includes(q));
    if (filtro === 'disponibles') lista = lista.filter((p) => cuposLibres(p) > 0);
    if (filtro === 'favoritos') lista = lista.filter((p) => favoritos.includes(p.id));
    if (filtro === 'electrico') lista = lista.filter((p) => p.servicios.includes('electrico'));
    if (filtro === 'cubierto') lista = lista.filter((p) => p.servicios.includes('cubierto'));
    return lista.sort((a, b) => (filtro === 'economicos' ? a.tarifaHora - b.tarifaHora : a.distancia - b.distancia));
  }, [parqueaderos, favoritos, coords, texto, filtro]);

  return { texto, setTexto, filtro, setFiltro, resultados };
}
