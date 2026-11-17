export type Rol = 'conductor' | 'admin';

export type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  /** Parqueadero que administra (solo admin). */
  parqueaderoId?: string;
};

export type Servicio = 'cubierto' | 'vigilancia' | 'electrico' | 'lavado' | 'motos' | '24h';

export type Parqueadero = {
  id: string;
  nombre: string;
  direccion: string;
  barrio: string;
  lat: number;
  lng: number;
  tarifaHora: number;
  tarifaDia: number;
  capacidad: number;
  ocupados: number;
  horario: string;
  servicios: Servicio[];
  calificacion: number;
};

export type NivelDisponibilidad = 'alta' | 'baja' | 'lleno';

export type EstadoReserva = 'activa' | 'usada' | 'cancelada' | 'vencida';

export type Reserva = {
  id: string;
  parqueaderoId: string;
  parqueaderoNombre: string;
  direccion: string;
  llegada: string; // ISO
  horas: number;
  total: number;
  estado: EstadoReserva;
  creadaEn: string; // ISO
  codigo: string; // contenido del QR
};

export type Coordenadas = { lat: number; lng: number };
