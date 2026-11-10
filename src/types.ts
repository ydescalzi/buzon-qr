// Tipos compartidos entre el servidor (server/index.ts) y el cliente (src/)

export type TipoSugerencia = 'sugerencia' | 'mejora' | 'reconocimiento' | 'queja' | 'idea';
export type EstadoSugerencia = 'nueva' | 'leida' | 'en_proceso' | 'atendida' | 'descartada';

export interface Area {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  creadoEn: string;
}

/** Área tal como se guarda en la base de datos (incluye el PIN cifrado). */
export interface AreaDB extends Area {
  pinHash: string;
}

export interface Persona {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  areaId: string;
  dni: string;
  email: string;
  foto: string; // dataURL (jpeg) redimensionada en el navegador
  activo: boolean;
  creadoEn: string;
}

/** Lo que cualquiera ve al escanear el QR del fotocheck. */
export type PersonaPublica = Pick<Persona, 'id' | 'codigo' | 'nombres' | 'apellidos' | 'cargo' | 'areaId' | 'foto' | 'activo'>;

export interface Sugerencia {
  id: string;
  areaId: string;
  tipo: TipoSugerencia;
  mensaje: string;
  anonimo: boolean;
  autor: string;
  estado: EstadoSugerencia;
  notaInterna: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Config {
  empresa: string;
  publicUrl: string;
  logo: string;
}

export interface DB {
  config: Config;
  areas: AreaDB[];
  personal: Persona[];
  sugerencias: Sugerencia[];
}

export interface ResumenArea {
  areaId: string;
  total: number;
  ultimos7: number;
  porEstado: Record<EstadoSugerencia, number>;
}

export const TIPOS: Record<TipoSugerencia, { label: string; emoji: string }> = {
  sugerencia: { label: 'Sugerencia', emoji: '💡' },
  mejora: { label: 'Oportunidad de mejora', emoji: '🔧' },
  idea: { label: 'Idea nueva', emoji: '🚀' },
  reconocimiento: { label: 'Reconocimiento', emoji: '👏' },
  queja: { label: 'Queja / reclamo', emoji: '⚠️' },
};

export const ESTADOS: Record<EstadoSugerencia, { label: string; color: string }> = {
  nueva: { label: 'Nueva', color: '#b5121b' },
  leida: { label: 'Leída', color: '#64748b' },
  en_proceso: { label: 'En proceso', color: '#b45309' },
  atendida: { label: 'Atendida', color: '#15803d' },
  descartada: { label: 'Descartada', color: '#9f1239' },
};

export const MAX_MENSAJE = 2000;
