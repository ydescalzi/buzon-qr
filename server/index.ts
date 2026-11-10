/**
 * Servidor del Buzón QR.
 * - Guarda todo en server/data/db.json (no necesita instalar base de datos).
 * - NO guarda IP ni datos del dispositivo de quien envía una sugerencia (anonimato real).
 * - En producción (npm run build && npm start) también sirve la web compilada desde /dist.
 */
import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  ESTADOS,
  MAX_MENSAJE,
  TIPOS,
  type Area,
  type AreaDB,
  type DB,
  type EstadoSugerencia,
  type Persona,
  type PersonaPublica,
  type ResumenArea,
  type Sugerencia,
  type TipoSugerencia,
} from '../src/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT ?? 3001);
const ADMIN_PIN = process.env.ADMIN_PIN ?? 'admin123';

// ---------- utilidades ----------
const hash = (pin: string) => crypto.createHash('sha256').update(`buzon-qr:${pin}`).digest('hex');
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function slug(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'area';
}

// ---------- base de datos JSON ----------
function seed(): DB {
  const mk = (nombre: string, descripcion: string, color: string): AreaDB => ({
    id: slug(nombre),
    nombre,
    descripcion,
    color,
    pinHash: hash('1234'),
    creadoEn: now(),
  });
  return {
    config: { empresa: 'Universidad de San Martín de Porres', publicUrl: '', logo: '' },
    areas: [
      mk('Dpto. de Sistemas', 'Soporte técnico, equipos, redes y software', '#0e7490'),
      mk('Recursos Humanos', 'Bienestar, capacitación, planillas y clima laboral', '#7c3aed'),
      mk('Contabilidad', 'Pagos, reembolsos y procesos contables', '#b45309'),
      mk('Logística', 'Compras, almacén y mantenimiento', '#15803d'),
    ],
    personal: [],
    sugerencias: [],
  };
}

function save(data: DB) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_FILE); // escritura atómica: evita archivos corruptos si se corta la luz
}

function load(): DB {
  if (!fs.existsSync(DB_FILE)) {
    const d = seed();
    save(d);
    console.log('📁 Base de datos creada en', DB_FILE, '(PIN de todas las áreas: 1234)');
    return d;
  }
  const d = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as DB;
  d.config = Object.assign({ empresa: '', publicUrl: '', logo: '' }, d.config);
  return d;
}

const db = load();
const persist = () => save(db);

const publicArea = ({ pinHash: _omit, ...a }: AreaDB): Area => a;
const publicPersona = (p: Persona): PersonaPublica => ({
  id: p.id,
  codigo: p.codigo,
  nombres: p.nombres,
  apellidos: p.apellidos,
  cargo: p.cargo,
  areaId: p.areaId,
  foto: p.foto,
  activo: p.activo,
});

// ---------- autenticación simple por PIN ----------
const isAdmin = (req: Request) => req.header('x-admin-pin') === ADMIN_PIN;

function canAccessArea(req: Request, areaId: string) {
  if (isAdmin(req)) return true;
  const area = db.areas.find((a) => a.id === areaId);
  const pin = req.header('x-area-pin');
  return !!area && !!pin && hash(pin) === area.pinHash;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'PIN de administrador incorrecto' });
  next();
}

// Límite anti-spam en memoria (no se guarda en disco ni se asocia a las sugerencias)
const envios = new Map<string, number[]>();
function antiSpam(req: Request, res: Response, next: NextFunction) {
  const key = req.ip ?? 'x';
  const ventana = 10 * 60 * 1000;
  const lista = (envios.get(key) ?? []).filter((t) => Date.now() - t < ventana);
  if (lista.length >= 15) {
    return res.status(429).json({ error: 'Has enviado muchos mensajes seguidos. Intenta de nuevo en unos minutos.' });
  }
  lista.push(Date.now());
  envios.set(key, lista);
  next();
}

// ---------- app ----------
const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.json({ limit: '6mb' })); // fotos en base64

// Info de red: ayuda a armar la URL que irá en los QR
app.get('/api/info', (_req, res) => {
  const ips = Object.values(os.networkInterfaces())
    .flat()
    .filter((i): i is os.NetworkInterfaceInfo => !!i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
  res.json({ ips });
});

// Auth
app.post('/api/auth/admin', (req, res) => {
  if (req.body?.pin !== ADMIN_PIN) return res.status(401).json({ error: 'PIN incorrecto' });
  res.json({ ok: true });
});

app.post('/api/auth/area/:id', (req, res) => {
  const area = db.areas.find((a) => a.id === req.params.id);
  if (!area) return res.status(404).json({ error: 'Área no encontrada' });
  if (hash(String(req.body?.pin ?? '')) !== area.pinHash) return res.status(401).json({ error: 'PIN incorrecto' });
  res.json({ ok: true });
});

// Config
app.get('/api/config', (_req, res) => res.json(db.config));
app.put('/api/config', requireAdmin, (req, res) => {
  db.config.empresa = str(req.body?.empresa, 120);
  db.config.publicUrl = str(req.body?.publicUrl, 200).replace(/\/+$/, '');
  if (typeof req.body?.logo === 'string') db.config.logo = req.body.logo.slice(0, 1_500_000);
  persist();
  res.json(db.config);
});

// Áreas
app.get('/api/areas', (_req, res) => res.json(db.areas.map(publicArea)));

app.get('/api/areas/:id', (req, res) => {
  const area = db.areas.find((a) => a.id === req.params.id);
  if (!area) return res.status(404).json({ error: 'Área no encontrada' });
  res.json(publicArea(area));
});

app.post('/api/areas', requireAdmin, (req, res) => {
  const nombre = str(req.body?.nombre, 80);
  const pin = str(req.body?.pin, 20);
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  if (pin.length < 4) return res.status(400).json({ error: 'El PIN debe tener al menos 4 caracteres' });
  let id = slug(nombre);
  for (let i = 2; db.areas.some((a) => a.id === id); i++) id = `${slug(nombre)}-${i}`;
  const area: AreaDB = {
    id,
    nombre,
    descripcion: str(req.body?.descripcion, 200),
    color: str(req.body?.color, 20) || '#0e7490',
    pinHash: hash(pin),
    creadoEn: now(),
  };
  db.areas.push(area);
  persist();
  res.status(201).json(publicArea(area));
});

app.put('/api/areas/:id', requireAdmin, (req, res) => {
  const area = db.areas.find((a) => a.id === req.params.id);
  if (!area) return res.status(404).json({ error: 'Área no encontrada' });
  const nombre = str(req.body?.nombre, 80);
  if (nombre) area.nombre = nombre; // el id NO cambia, así los QR impresos siguen funcionando
  area.descripcion = str(req.body?.descripcion, 200);
  area.color = str(req.body?.color, 20) || area.color;
  const pin = str(req.body?.pin, 20);
  if (pin) {
    if (pin.length < 4) return res.status(400).json({ error: 'El PIN debe tener al menos 4 caracteres' });
    area.pinHash = hash(pin);
  }
  persist();
  res.json(publicArea(area));
});

app.delete('/api/areas/:id', requireAdmin, (req, res) => {
  const idx = db.areas.findIndex((a) => a.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Área no encontrada' });
  const [area] = db.areas.splice(idx, 1);
  db.sugerencias = db.sugerencias.filter((s) => s.areaId !== area.id);
  db.personal.forEach((p) => {
    if (p.areaId === area.id) p.areaId = '';
  });
  persist();
  res.json({ ok: true });
});

// Sugerencias
app.post('/api/sugerencias', antiSpam, (req, res) => {
  const areaId = str(req.body?.areaId, 100);
  const tipo = str(req.body?.tipo, 30) as TipoSugerencia;
  const mensaje = str(req.body?.mensaje, MAX_MENSAJE);
  const anonimo = req.body?.anonimo !== false;
  if (!db.areas.some((a) => a.id === areaId)) return res.status(400).json({ error: 'Área no válida' });
  if (!(tipo in TIPOS)) return res.status(400).json({ error: 'Tipo no válido' });
  if (mensaje.length < 5) return res.status(400).json({ error: 'Escribe un mensaje un poco más largo' });
  const s: Sugerencia = {
    id: uid(),
    areaId,
    tipo,
    mensaje,
    anonimo,
    autor: anonimo ? '' : str(req.body?.autor, 120),
    estado: 'nueva',
    notaInterna: '',
    creadoEn: now(),
    actualizadoEn: now(),
  };
  db.sugerencias.push(s);
  persist();
  res.status(201).json({ ok: true });
});

app.get('/api/areas/:id/sugerencias', (req, res) => {
  if (!canAccessArea(req, req.params.id)) return res.status(401).json({ error: 'Sin acceso a esta área' });
  const lista = db.sugerencias
    .filter((s) => s.areaId === req.params.id)
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
  res.json(lista);
});

app.patch('/api/sugerencias/:id', (req, res) => {
  const s = db.sugerencias.find((x) => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'No encontrada' });
  if (!canAccessArea(req, s.areaId)) return res.status(401).json({ error: 'Sin acceso' });
  const estado = req.body?.estado as EstadoSugerencia | undefined;
  if (estado) {
    if (!(estado in ESTADOS)) return res.status(400).json({ error: 'Estado no válido' });
    s.estado = estado;
  }
  if (typeof req.body?.notaInterna === 'string') s.notaInterna = str(req.body.notaInterna, 1000);
  s.actualizadoEn = now();
  persist();
  res.json(s);
});

app.delete('/api/sugerencias/:id', requireAdmin, (req, res) => {
  db.sugerencias = db.sugerencias.filter((s) => s.id !== req.params.id);
  persist();
  res.json({ ok: true });
});

app.get('/api/resumen', requireAdmin, (_req, res) => {
  const hace7 = Date.now() - 7 * 864e5;
  const resumen: ResumenArea[] = db.areas.map((a) => {
    const lista = db.sugerencias.filter((s) => s.areaId === a.id);
    const porEstado = Object.fromEntries(Object.keys(ESTADOS).map((k) => [k, 0])) as Record<EstadoSugerencia, number>;
    lista.forEach((s) => porEstado[s.estado]++);
    return {
      areaId: a.id,
      total: lista.length,
      ultimos7: lista.filter((s) => Date.parse(s.creadoEn) >= hace7).length,
      porEstado,
    };
  });
  res.json(resumen);
});

// Personal
function siguienteCodigo() {
  const max = db.personal.reduce((m, p) => {
    const n = Number(p.codigo.match(/(\d+)$/)?.[1] ?? 0);
    return Math.max(m, n);
  }, 0);
  return `EMP-${String(max + 1).padStart(4, '0')}`;
}

function leerPersona(body: Record<string, unknown>, base?: Persona): Persona | string {
  const nombres = str(body.nombres, 80);
  const apellidos = str(body.apellidos, 80);
  if (!nombres || !apellidos) return 'Nombres y apellidos son obligatorios';
  const areaId = str(body.areaId, 100);
  if (areaId && !db.areas.some((a) => a.id === areaId)) return 'Área no válida';
  const codigo = str(body.codigo, 30) || base?.codigo || siguienteCodigo();
  if (db.personal.some((p) => p.codigo === codigo && p.id !== base?.id)) return `El código ${codigo} ya está en uso`;
  return {
    id: base?.id ?? uid(),
    codigo,
    nombres,
    apellidos,
    cargo: str(body.cargo, 100),
    areaId,
    dni: str(body.dni, 20),
    email: str(body.email, 120),
    foto: typeof body.foto === 'string' ? body.foto.slice(0, 1_500_000) : base?.foto ?? '',
    activo: body.activo !== false,
    creadoEn: base?.creadoEn ?? now(),
  };
}

app.get('/api/personal', requireAdmin, (_req, res) => {
  res.json([...db.personal].sort((a, b) => a.apellidos.localeCompare(b.apellidos)));
});

app.get('/api/personal/:id', (req, res) => {
  const p = db.personal.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Persona no encontrada' });
  res.json(isAdmin(req) ? p : publicPersona(p));
});

app.post('/api/personal', requireAdmin, (req, res) => {
  const p = leerPersona(req.body ?? {});
  if (typeof p === 'string') return res.status(400).json({ error: p });
  db.personal.push(p);
  persist();
  res.status(201).json(p);
});

app.put('/api/personal/:id', requireAdmin, (req, res) => {
  const idx = db.personal.findIndex((x) => x.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Persona no encontrada' });
  const p = leerPersona(req.body ?? {}, db.personal[idx]);
  if (typeof p === 'string') return res.status(400).json({ error: p });
  db.personal[idx] = p;
  persist();
  res.json(p);
});

app.delete('/api/personal/:id', requireAdmin, (req, res) => {
  db.personal = db.personal.filter((p) => p.id !== req.params.id);
  persist();
  res.json({ ok: true });
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Producción: servir la web compilada
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (_req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API del Buzón QR en http://localhost:${PORT}`);
  if (ADMIN_PIN === 'admin123') console.log('⚠️  Estás usando el PIN de admin por defecto (admin123). Cámbialo con la variable ADMIN_PIN.');
});
