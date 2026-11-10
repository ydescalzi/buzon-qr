/**
 * MODO DEMO (sin servidor ni base de datos).
 * Simula la misma API de server/index.ts pero guarda todo en el localStorage del navegador.
 * Se activa con VITE_DEMO=true (ver .env.demo y vercel.json).
 *
 * Limitación: cada navegador/celular tiene sus propios datos. Una sugerencia enviada
 * desde un celular solo se ve en la bandeja de ESE mismo celular.
 */
import {
  ESTADOS,
  MAX_MENSAJE,
  TIPOS,
  type Area,
  type Config,
  type EstadoSugerencia,
  type Persona,
  type PersonaPublica,
  type ResumenArea,
  type Sugerencia,
  type TipoSugerencia,
} from '../types';

type DemoArea = Area & { pin: string };
interface DemoDB {
  config: Config;
  areas: DemoArea[];
  personal: Persona[];
  sugerencias: Sugerencia[];
}

const KEY = 'buzon:demo-db';
export const DEMO_ADMIN_PIN = 'admin123';
export const DEMO_AREA_PIN = '1234';

type Body = Record<string, unknown>;
type Headers = Record<string, string>;

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
const now = () => new Date().toISOString();
const haceDias = (d: number, h = 0) => new Date(Date.now() - d * 864e5 - h * 36e5).toISOString();
const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const slug = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'area';

function seed(): DemoDB {
  const area = (nombre: string, descripcion: string, color: string): DemoArea => ({
    id: slug(nombre), nombre, descripcion, color, pin: DEMO_AREA_PIN, creadoEn: now(),
  });
  const sug = (areaId: string, tipo: TipoSugerencia, mensaje: string, dias: number, estado: EstadoSugerencia = 'nueva', autor = ''): Sugerencia => ({
    id: uid(), areaId, tipo, mensaje, anonimo: !autor, autor, estado, notaInterna: '',
    creadoEn: haceDias(dias, 2), actualizadoEn: haceDias(dias),
  });
  const persona = (codigo: string, nombres: string, apellidos: string, cargo: string, areaId: string): Persona => ({
    id: uid(), codigo, nombres, apellidos, cargo, areaId, dni: '', email: '', foto: '', activo: true, creadoEn: now(),
  });
  return {
    config: { empresa: 'Institución Demo', publicUrl: '', logo: '' },
    areas: [
      area('Dpto. de Sistemas', 'Soporte técnico, equipos, redes y software', '#0e7490'),
      area('Recursos Humanos', 'Bienestar, capacitación, planillas y clima laboral', '#7c3aed'),
      area('Contabilidad', 'Pagos, reembolsos y procesos contables', '#b45309'),
      area('Logística', 'Compras, almacén y mantenimiento', '#15803d'),
    ],
    personal: [
      persona('EMP-0001', 'Carlos Andrés', 'Quispe Rojas', 'Jefe de Sistemas', 'dpto-de-sistemas'),
      persona('EMP-0002', 'María', 'Huamán León', 'Analista de Bienestar', 'recursos-humanos'),
      persona('EMP-0003', 'Jorge Luis', 'Mendoza Paredes', 'Asistente Contable', 'contabilidad'),
    ],
    sugerencias: [
      sug('dpto-de-sistemas', 'mejora', 'Sería bueno tener un formulario para pedir soporte en lugar de llamar por teléfono.', 0),
      sug('dpto-de-sistemas', 'reconocimiento', 'Gracias por arreglar la impresora del 2do piso tan rápido.', 1, 'leida', 'Ana Torres'),
      sug('dpto-de-sistemas', 'queja', 'El WiFi de la sala de reuniones se cae casi todas las tardes.', 3, 'en_proceso'),
      sug('recursos-humanos', 'idea', 'Podríamos hacer una pausa activa de 10 minutos a media mañana.', 2),
      sug('recursos-humanos', 'sugerencia', 'Que las boletas de pago lleguen también por correo.', 6, 'atendida'),
      sug('logistica', 'mejora', 'Falta señalizar mejor las salidas de emergencia del almacén.', 4),
    ],
  };
}

function load(): DemoDB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DemoDB;
  } catch {
    /* sin almacenamiento disponible: se usa memoria */
  }
  return seed();
}

let db = load();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    throw new Error('El almacenamiento del navegador está lleno (prueba con fotos más pequeñas o reinicia la demo).');
  }
}

export function resetDemo() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  db = seed();
}

const publicArea = ({ pin: _pin, ...a }: DemoArea): Area => a;
const isAdmin = (h: Headers) => h['x-admin-pin'] === DEMO_ADMIN_PIN;
const canAccessArea = (h: Headers, areaId: string) =>
  isAdmin(h) || db.areas.some((a) => a.id === areaId && a.pin === h['x-area-pin']);

function needAdmin(h: Headers) {
  if (!isAdmin(h)) throw new Error('PIN de administrador incorrecto');
}
function findArea(id: string) {
  const a = db.areas.find((x) => x.id === id);
  if (!a) throw new Error('Área no encontrada');
  return a;
}

function siguienteCodigo() {
  const max = db.personal.reduce((m, p) => Math.max(m, Number(p.codigo.match(/(\d+)$/)?.[1] ?? 0)), 0);
  return `EMP-${String(max + 1).padStart(4, '0')}`;
}

function leerPersona(body: Body, base?: Persona): Persona {
  const nombres = str(body.nombres, 80);
  const apellidos = str(body.apellidos, 80);
  if (!nombres || !apellidos) throw new Error('Nombres y apellidos son obligatorios');
  const codigo = str(body.codigo, 30) || base?.codigo || siguienteCodigo();
  if (db.personal.some((p) => p.codigo === codigo && p.id !== base?.id)) throw new Error(`El código ${codigo} ya está en uso`);
  return {
    id: base?.id ?? uid(),
    codigo,
    nombres,
    apellidos,
    cargo: str(body.cargo, 100),
    areaId: str(body.areaId, 100),
    dni: str(body.dni, 20),
    email: str(body.email, 120),
    foto: typeof body.foto === 'string' ? body.foto : base?.foto ?? '',
    activo: body.activo !== false,
    creadoEn: base?.creadoEn ?? now(),
  };
}

type Handler = (p: string[], body: Body, h: Headers) => unknown;
const routes: [string, RegExp, Handler][] = [
  ['GET', /^\/info$/, () => ({ ips: [] })],

  ['POST', /^\/auth\/admin$/, (_p, b) => {
    if (b.pin !== DEMO_ADMIN_PIN) throw new Error('PIN incorrecto');
    return { ok: true };
  }],
  ['POST', /^\/auth\/area\/([^/]+)$/, ([id], b) => {
    if (findArea(id).pin !== String(b.pin ?? '')) throw new Error('PIN incorrecto');
    return { ok: true };
  }],

  ['GET', /^\/config$/, () => db.config],
  ['PUT', /^\/config$/, (_p, b, h) => {
    needAdmin(h);
    db.config = {
      empresa: str(b.empresa, 120),
      publicUrl: str(b.publicUrl, 200).replace(/\/+$/, ''),
      logo: typeof b.logo === 'string' ? b.logo : db.config.logo,
    };
    persist();
    return db.config;
  }],

  ['GET', /^\/areas$/, () => db.areas.map(publicArea)],
  ['GET', /^\/areas\/([^/]+)$/, ([id]) => publicArea(findArea(id))],
  ['POST', /^\/areas$/, (_p, b, h) => {
    needAdmin(h);
    const nombre = str(b.nombre, 80);
    const pin = str(b.pin, 20);
    if (!nombre) throw new Error('El nombre es obligatorio');
    if (pin.length < 4) throw new Error('El PIN debe tener al menos 4 caracteres');
    let id = slug(nombre);
    for (let i = 2; db.areas.some((a) => a.id === id); i++) id = `${slug(nombre)}-${i}`;
    const area: DemoArea = { id, nombre, descripcion: str(b.descripcion, 200), color: str(b.color, 20) || '#0e7490', pin, creadoEn: now() };
    db.areas.push(area);
    persist();
    return publicArea(area);
  }],
  ['PUT', /^\/areas\/([^/]+)$/, ([id], b, h) => {
    needAdmin(h);
    const area = findArea(id);
    area.nombre = str(b.nombre, 80) || area.nombre;
    area.descripcion = str(b.descripcion, 200);
    area.color = str(b.color, 20) || area.color;
    const pin = str(b.pin, 20);
    if (pin) {
      if (pin.length < 4) throw new Error('El PIN debe tener al menos 4 caracteres');
      area.pin = pin;
    }
    persist();
    return publicArea(area);
  }],
  ['DELETE', /^\/areas\/([^/]+)$/, ([id], _b, h) => {
    needAdmin(h);
    db.areas = db.areas.filter((a) => a.id !== id);
    db.sugerencias = db.sugerencias.filter((s) => s.areaId !== id);
    db.personal.forEach((p) => { if (p.areaId === id) p.areaId = ''; });
    persist();
    return { ok: true };
  }],

  ['POST', /^\/sugerencias$/, (_p, b) => {
    const areaId = str(b.areaId, 100);
    const tipo = str(b.tipo, 30) as TipoSugerencia;
    const mensaje = str(b.mensaje, MAX_MENSAJE);
    const anonimo = b.anonimo !== false;
    findArea(areaId);
    if (!(tipo in TIPOS)) throw new Error('Tipo no válido');
    if (mensaje.length < 5) throw new Error('Escribe un mensaje un poco más largo');
    db.sugerencias.push({
      id: uid(), areaId, tipo, mensaje, anonimo, autor: anonimo ? '' : str(b.autor, 120),
      estado: 'nueva', notaInterna: '', creadoEn: now(), actualizadoEn: now(),
    });
    persist();
    return { ok: true };
  }],
  ['GET', /^\/areas\/([^/]+)\/sugerencias$/, ([id], _b, h) => {
    if (!canAccessArea(h, id)) throw new Error('Sin acceso a esta área');
    return db.sugerencias.filter((s) => s.areaId === id).sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
  }],
  ['PATCH', /^\/sugerencias\/([^/]+)$/, ([id], b, h) => {
    const s = db.sugerencias.find((x) => x.id === id);
    if (!s) throw new Error('No encontrada');
    if (!canAccessArea(h, s.areaId)) throw new Error('Sin acceso');
    const estado = b.estado as EstadoSugerencia | undefined;
    if (estado) {
      if (!(estado in ESTADOS)) throw new Error('Estado no válido');
      s.estado = estado;
    }
    if (typeof b.notaInterna === 'string') s.notaInterna = str(b.notaInterna, 1000);
    s.actualizadoEn = now();
    persist();
    return s;
  }],
  ['DELETE', /^\/sugerencias\/([^/]+)$/, ([id], _b, h) => {
    needAdmin(h);
    db.sugerencias = db.sugerencias.filter((s) => s.id !== id);
    persist();
    return { ok: true };
  }],

  ['GET', /^\/resumen$/, (_p, _b, h): ResumenArea[] => {
    needAdmin(h);
    const hace7 = Date.now() - 7 * 864e5;
    return db.areas.map((a) => {
      const lista = db.sugerencias.filter((s) => s.areaId === a.id);
      const porEstado = Object.fromEntries(Object.keys(ESTADOS).map((k) => [k, 0])) as Record<EstadoSugerencia, number>;
      lista.forEach((s) => porEstado[s.estado]++);
      return { areaId: a.id, total: lista.length, ultimos7: lista.filter((s) => Date.parse(s.creadoEn) >= hace7).length, porEstado };
    });
  }],

  ['GET', /^\/personal$/, (_p, _b, h) => {
    needAdmin(h);
    return [...db.personal].sort((a, b) => a.apellidos.localeCompare(b.apellidos));
  }],
  ['GET', /^\/personal\/([^/]+)$/, ([id]): PersonaPublica => {
    const p = db.personal.find((x) => x.id === id);
    if (!p) throw new Error('Persona no encontrada');
    return p;
  }],
  ['POST', /^\/personal$/, (_p, b, h) => {
    needAdmin(h);
    const p = leerPersona(b);
    db.personal.push(p);
    persist();
    return p;
  }],
  ['PUT', /^\/personal\/([^/]+)$/, ([id], b, h) => {
    needAdmin(h);
    const idx = db.personal.findIndex((x) => x.id === id);
    if (idx < 0) throw new Error('Persona no encontrada');
    db.personal[idx] = leerPersona(b, db.personal[idx]);
    persist();
    return db.personal[idx];
  }],
  ['DELETE', /^\/personal\/([^/]+)$/, ([id], _b, h) => {
    needAdmin(h);
    db.personal = db.personal.filter((p) => p.id !== id);
    persist();
    return { ok: true };
  }],
];

export async function demoRequest<T>(method: string, url: string, body?: unknown, headers: Headers = {}): Promise<T> {
  await new Promise((r) => setTimeout(r, 120)); // pequeña espera para que se sienta como una API real
  const path = url.split('?')[0];
  for (const [m, re, handler] of routes) {
    const match = m === method ? path.match(re) : null;
    if (match) {
      const result = handler(match.slice(1).map(decodeURIComponent), (body ?? {}) as Body, headers);
      return structuredClone(result) as T;
    }
  }
  throw new Error('Ruta no encontrada');
}
