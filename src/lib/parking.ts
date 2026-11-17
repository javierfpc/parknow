import type { Coordenadas, NivelDisponibilidad, Parqueadero, Servicio } from '@/types';

/** Distancia en km entre dos puntos (fórmula de Haversine). */
export function distanciaKm(a: Coordenadas, b: Coordenadas): number {
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatoDistancia(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
export function formatoCOP(valor: number): string {
  return cop.format(valor).replace(/\s/g, ' ');
}

export function cuposLibres(p: Parqueadero): number {
  return Math.max(0, p.capacidad - p.ocupados);
}

export function nivel(p: Parqueadero): NivelDisponibilidad {
  const libres = cuposLibres(p);
  if (libres === 0) return 'lleno';
  return libres / p.capacidad <= 0.15 ? 'baja' : 'alta';
}

export const TEXTO_NIVEL: Record<NivelDisponibilidad, string> = {
  alta: 'Hay cupos',
  baja: 'Pocos cupos',
  lleno: 'Lleno',
};

export const SERVICIOS: Record<Servicio, { texto: string; icono: string }> = {
  cubierto: { texto: 'Cubierto', icono: 'umbrella-outline' },
  vigilancia: { texto: 'Vigilancia', icono: 'shield-checkmark-outline' },
  electrico: { texto: 'Carga eléctrica', icono: 'flash-outline' },
  lavado: { texto: 'Lavado', icono: 'water-outline' },
  motos: { texto: 'Motos', icono: 'bicycle-outline' },
  '24h': { texto: '24 horas', icono: 'time-outline' },
};

/** Cobro de una reserva: tarifa por hora con tope diario. */
export function calcularTotal(p: Parqueadero, horas: number): number {
  return Math.min(p.tarifaHora * horas, p.tarifaDia);
}

export function saludo(fecha = new Date()): string {
  const h = fecha.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function formatoHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
}

export function formatoFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}
