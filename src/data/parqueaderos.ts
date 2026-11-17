import type { Parqueadero } from '@/types';

// Datos de prueba de Bogotá. La app funciona sin servidor para la demostración.
export const PARQUEADEROS: Parqueadero[] = [
  { id: 'p1', nombre: 'Parqueadero Calle 72', direccion: 'Cra. 11 #72-35', barrio: 'Chapinero', lat: 4.6582, lng: -74.0588, tarifaHora: 6500, tarifaDia: 42000, capacidad: 60, ocupados: 41, horario: '6:00 a. m. – 10:00 p. m.', servicios: ['cubierto', 'vigilancia', 'motos'], calificacion: 4.6 },
  { id: 'p2', nombre: 'Centro Comercial Andino', direccion: 'Cra. 11 #82-71', barrio: 'El Retiro', lat: 4.6668, lng: -74.0527, tarifaHora: 8000, tarifaDia: 56000, capacidad: 250, ocupados: 243, horario: '7:00 a. m. – 11:00 p. m.', servicios: ['cubierto', 'vigilancia', 'electrico', 'lavado'], calificacion: 4.8 },
  { id: 'p3', nombre: 'ParkPlus Zona T', direccion: 'Cl. 83 #12-40', barrio: 'Zona T', lat: 4.6679, lng: -74.0552, tarifaHora: 7200, tarifaDia: 48000, capacidad: 45, ocupados: 45, horario: '24 horas', servicios: ['vigilancia', '24h'], calificacion: 4.3 },
  { id: 'p4', nombre: 'Parqueadero La Soledad', direccion: 'Cl. 41 #24-18', barrio: 'Teusaquillo', lat: 4.6283, lng: -74.0765, tarifaHora: 4800, tarifaDia: 30000, capacidad: 40, ocupados: 13, horario: '6:00 a. m. – 9:00 p. m.', servicios: ['motos'], calificacion: 4.1 },
  { id: 'p5', nombre: 'Estacionamiento Av. Chile', direccion: 'Cl. 72 #10-07', barrio: 'Chapinero', lat: 4.6561, lng: -74.0561, tarifaHora: 7000, tarifaDia: 45000, capacidad: 80, ocupados: 71, horario: '24 horas', servicios: ['cubierto', 'vigilancia', '24h'], calificacion: 4.5 },
  { id: 'p6', nombre: 'Parque 93 Plaza', direccion: 'Cl. 93A #13-20', barrio: 'Chicó', lat: 4.6768, lng: -74.0484, tarifaHora: 8500, tarifaDia: 60000, capacidad: 120, ocupados: 64, horario: '6:00 a. m. – 12:00 a. m.', servicios: ['cubierto', 'vigilancia', 'electrico'], calificacion: 4.7 },
  { id: 'p7', nombre: 'Usaquén Plaza', direccion: 'Cl. 119 #6-18', barrio: 'Usaquén', lat: 4.6951, lng: -74.0309, tarifaHora: 6000, tarifaDia: 38000, capacidad: 70, ocupados: 22, horario: '7:00 a. m. – 10:00 p. m.', servicios: ['vigilancia', 'motos', 'lavado'], calificacion: 4.4 },
  { id: 'p8', nombre: 'Centro Internacional', direccion: 'Cra. 7 #28-50', barrio: 'Centro', lat: 4.6151, lng: -74.0698, tarifaHora: 5500, tarifaDia: 34000, capacidad: 150, ocupados: 140, horario: '24 horas', servicios: ['cubierto', 'vigilancia', '24h'], calificacion: 4.0 },
  { id: 'p9', nombre: 'La Candelaria Parking', direccion: 'Cl. 11 #4-21', barrio: 'La Candelaria', lat: 4.5977, lng: -74.0727, tarifaHora: 4500, tarifaDia: 28000, capacidad: 35, ocupados: 18, horario: '6:00 a. m. – 8:00 p. m.', servicios: ['motos'], calificacion: 4.2 },
  { id: 'p10', nombre: 'Galerías Parking', direccion: 'Cl. 53 #24-30', barrio: 'Galerías', lat: 4.6402, lng: -74.0771, tarifaHora: 5000, tarifaDia: 32000, capacidad: 90, ocupados: 52, horario: '6:00 a. m. – 10:00 p. m.', servicios: ['cubierto', 'motos'], calificacion: 4.3 },
  { id: 'p11', nombre: 'Unicentro Norte', direccion: 'Cra. 15 #124-30', barrio: 'Santa Bárbara', lat: 4.7021, lng: -74.0419, tarifaHora: 7500, tarifaDia: 50000, capacidad: 300, ocupados: 188, horario: '8:00 a. m. – 10:00 p. m.', servicios: ['cubierto', 'vigilancia', 'electrico', 'lavado'], calificacion: 4.6 },
  { id: 'p12', nombre: 'Compensar Av. 68', direccion: 'Av. 68 #49A-47', barrio: 'Normandía', lat: 4.6603, lng: -74.0934, tarifaHora: 4000, tarifaDia: 26000, capacidad: 110, ocupados: 77, horario: '6:00 a. m. – 10:00 p. m.', servicios: ['vigilancia', 'motos', 'electrico'], calificacion: 4.5 },
];

/** Centro por defecto si no hay permiso de ubicación (Chapinero). */
export const CENTRO_BOGOTA = { lat: 4.6533, lng: -74.0602 };
