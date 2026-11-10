import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api, auth } from '../lib/api';
import { fmtFecha, useAreas } from '../lib/hooks';
import { ESTADOS, TIPOS, type EstadoSugerencia, type Sugerencia, type TipoSugerencia } from '../types';
import { Icon, SuggestionIcon } from '../components/Icon';

const LAST_AREA = 'buzon:lastArea';

export default function InboxPage() {
  const { areas } = useAreas();
  const [areaId, setAreaId] = useState(() => {
    try { return localStorage.getItem(LAST_AREA) ?? ''; } catch { return ''; }
  });
  const [logged, setLogged] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [items, setItems] = useState<Sugerencia[]>([]);
  const [fEstado, setFEstado] = useState<EstadoSugerencia | ''>('');
  const [fTipo, setFTipo] = useState<TipoSugerencia | ''>('');
  const [q, setQ] = useState('');

  const area = areas.find((a) => a.id === areaId);
  const headers = () => (auth.adminPin() ? auth.adminHeaders() : auth.areaHeaders(areaId));

  const cargar = useCallback(async () => {
    if (!areaId) return;
    try {
      const data = await api.get<Sugerencia[]>(`/areas/${areaId}/sugerencias`, {
        ...auth.areaHeaders(areaId),
        ...(auth.adminPin() ? auth.adminHeaders() : {}),
      });
      setItems(data);
      setLogged(true);
    } catch {
      setLogged(false);
    }
  }, [areaId]);

  // Si ya hay PIN guardado para el área (o sesión de admin), entra directo
  useEffect(() => {
    setLogged(false);
    setItems([]);
    if (areaId && (auth.areaPin(areaId) || auth.adminPin())) cargar();
  }, [areaId, cargar]);

  async function login(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/auth/area/${areaId}`, { pin });
      auth.setAreaPin(areaId, pin);
      try { localStorage.setItem(LAST_AREA, areaId); } catch { /* ignore */ }
      setPin('');
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function actualizar(id: string, cambios: Partial<Pick<Sugerencia, 'estado' | 'notaInterna'>>) {
    const s = await api.patch<Sugerencia>(`/sugerencias/${id}`, cambios, headers());
    setItems((prev) => prev.map((x) => (x.id === id ? s : x)));
  }

  function salir() {
    auth.setAreaPin(areaId, null);
    setLogged(false);
    setItems([]);
  }

  const filtrados = useMemo(
    () =>
      items.filter(
        (s) =>
          (!fEstado || s.estado === fEstado) &&
          (!fTipo || s.tipo === fTipo) &&
          (!q || `${s.mensaje} ${s.autor} ${s.notaInterna}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [items, fEstado, fTipo, q],
  );

  function exportarCSV() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const filas = [
      ['Fecha', 'Tipo', 'Estado', 'Mensaje', 'Autor', 'Nota interna'],
      ...filtrados.map((s) => [
        fmtFecha(s.creadoEn),
        TIPOS[s.tipo].label,
        ESTADOS[s.estado].label,
        s.mensaje,
        s.anonimo ? 'Anónimo' : s.autor || '(sin nombre)',
        s.notaInterna,
      ]),
    ];
    const csv = '﻿' + filas.map((f) => f.map(esc).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `sugerencias-${areaId}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const conteo = (e: EstadoSugerencia) => items.filter((s) => s.estado === e).length;

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow"><Icon name="inbox" size={15} /> GESTIÓN DE MENSAJES</p>
          <h1>Bandeja del área</h1>
          <p className="muted">Cada área solo ve los mensajes que le enviaron.</p>
        </div>
        <label className="area-select"><Icon name="areas" size={18} /><select className="input w-auto" aria-label="Seleccionar área" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
          <option value="">— Elige tu área —</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select></label>
      </div>

      {!areaId ? (
        <div className="empty-state"><Icon name="inbox" size={26} /><h3>Tu bandeja te espera</h3><p>Selecciona tu área para consultar y gestionar los mensajes.</p></div>
      ) : !logged ? (
        <form className="card narrow" onSubmit={login}>
          <div className="auth-icon"><Icon name="lock" size={23} /></div>
          <h2>Ingresar a {area?.nombre}</h2>
          <p className="muted">Escribe el PIN que te asignó el administrador.</p>
          <input
            className="input"
            type="password"
            inputMode="numeric"
            placeholder="PIN del área"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
          />
          {error && <p className="error">{error}</p>}
          <button className="btn block"><Icon name="lock" size={17} /> Entrar a la bandeja</button>
          <p className="hint"><Icon name="shield" size={14} /> Acceso privado para el equipo del área.</p>
        </form>
      ) : (
        <>
          <div className="stats">
            <div className="stat"><span className="stat-icon"><Icon name="message" /></span><b>{items.length}</b><span>Total de mensajes</span></div>
            {(Object.keys(ESTADOS) as EstadoSugerencia[]).map((e) => (
              <button
                key={e}
                className={`stat ${fEstado === e ? 'on' : ''}`}
                style={{ borderColor: ESTADOS[e].color }}
                onClick={() => setFEstado(fEstado === e ? '' : e)}
              >
                <b style={{ color: ESTADOS[e].color }}>{conteo(e)}</b>
                <span>{ESTADOS[e].label}</span>
              </button>
            ))}
          </div>

          <div className="toolbar">
            <label className="search-field"><Icon name="search" size={18} /><input className="input" aria-label="Buscar mensajes" placeholder="Buscar en los mensajes…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
            <select className="input w-auto" value={fTipo} onChange={(e) => setFTipo(e.target.value as TipoSugerencia | '')}>
              <option value="">Todos los tipos</option>
              {(Object.keys(TIPOS) as TipoSugerencia[]).map((t) => (
                <option key={t} value={t}>{TIPOS[t].label}</option>
              ))}
            </select>
            <button className="btn ghost" onClick={cargar}><Icon name="refresh" size={16} /> Actualizar</button>
            <button className="btn ghost" onClick={exportarCSV} disabled={!filtrados.length}><Icon name="arrowDown" size={16} /> Exportar CSV</button>
            {!auth.adminPin() && <button className="btn ghost" onClick={salir}><Icon name="logout" size={16} /> Salir</button>}
          </div>

          {filtrados.length === 0 ? (
            <div className="empty-state"><Icon name={items.length ? 'search' : 'mail'} size={25} /><h3>{items.length ? 'No encontramos resultados' : 'Todavía no hay mensajes'}</h3><p>{items.length ? 'Prueba con otros filtros o términos de búsqueda.' : 'Cuando alguien envíe una sugerencia aparecerá aquí.'}</p></div>
          ) : (
            <div className="msg-list">
              {filtrados.map((s) => (
                <MensajeCard key={s.id} s={s} onChange={(c) => actualizar(s.id, c)} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

function MensajeCard({
  s,
  onChange,
}: {
  s: Sugerencia;
  onChange: (c: Partial<Pick<Sugerencia, 'estado' | 'notaInterna'>>) => Promise<void>;
}) {
  const [nota, setNota] = useState(s.notaInterna);
  const [abierta, setAbierta] = useState(false);
  const cambioNota = nota !== s.notaInterna;

  return (
    <article className={`msg ${s.estado === 'nueva' ? 'is-new' : ''}`}>
      <div className="msg-head">
        <span className="tag"><SuggestionIcon type={s.tipo} /> {TIPOS[s.tipo].label}</span>
        <span className="message-date"><Icon name="calendar" size={15} /> {fmtFecha(s.creadoEn)}</span>
        <select
          className="estado"
          style={{ color: ESTADOS[s.estado].color, borderColor: ESTADOS[s.estado].color }}
          value={s.estado}
          onChange={(e) => onChange({ estado: e.target.value as EstadoSugerencia })}
        >
          {(Object.keys(ESTADOS) as EstadoSugerencia[]).map((e) => (
            <option key={e} value={e}>{ESTADOS[e].label}</option>
          ))}
        </select>
      </div>
      <p className="msg-body">{s.mensaje}</p>
      <div className="msg-foot">
        <span className="message-author"><Icon name={s.anonimo ? 'lock' : 'user'} size={15} /> {s.anonimo ? 'Anónimo' : s.autor || 'Sin nombre'}</span>
        <button className="link note-toggle" onClick={() => setAbierta(!abierta)}>
          <Icon name="note" size={16} /> {abierta ? 'Ocultar nota' : s.notaInterna ? 'Ver nota interna' : 'Añadir nota'}
        </button>
      </div>
      {abierta && (
        <div className="nota">
          <textarea
            rows={2}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Acciones tomadas, responsable, fecha… (solo la ve el área)"
          />
          <button className="btn small" disabled={!cambioNota} onClick={() => onChange({ notaInterna: nota })}>
            <Icon name="save" size={15} /> Guardar nota
          </button>
        </div>
      )}
    </article>
  );
}
