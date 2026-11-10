import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { api, auth } from '../../lib/api';
import { publicBase, useAreas, useConfig } from '../../lib/hooks';
import { prepararFoto } from '../../lib/image';
import IdCard from '../../components/IdCard';
import { Icon } from '../../components/Icon';
import type { Persona } from '../../types';

type FormPersona = Omit<Persona, 'id' | 'creadoEn'>;
const VACIO: FormPersona = {
  codigo: '',
  nombres: '',
  apellidos: '',
  cargo: '',
  areaId: '',
  dni: '',
  email: '',
  foto: '',
  activo: true,
};

export default function PersonalAdmin() {
  const { areas } = useAreas();
  const { config } = useConfig();
  const base = publicBase(config);
  const [lista, setLista] = useState<Persona[]>([]);
  const [form, setForm] = useState<FormPersona>(VACIO);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [fArea, setFArea] = useState('');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const cargar = useCallback(() => {
    api.get<Persona[]>('/personal', auth.adminHeaders()).then(setLista).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(cargar, [cargar]);

  const set = <K extends keyof FormPersona>(k: K, v: FormPersona[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function onFoto(file?: File) {
    if (!file) return;
    try {
      set('foto', await prepararFoto(file));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function editar(p: Persona) {
    setEditId(p.id);
    const { id: _id, creadoEn: _c, ...rest } = p;
    setForm(rest);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelar() {
    setEditId(null);
    setForm(VACIO);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editId) await api.put(`/personal/${editId}`, form, auth.adminHeaders());
      else await api.post('/personal', form, auth.adminHeaders());
      cancelar();
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function eliminar(p: Persona) {
    if (!confirm(`¿Eliminar a ${p.nombres} ${p.apellidos}? Su QR dejará de ser válido.`)) return;
    await api.del(`/personal/${p.id}`, auth.adminHeaders());
    cargar();
  }

  const filtrados = useMemo(
    () =>
      lista.filter(
        (p) =>
          (!fArea || p.areaId === fArea) &&
          (!q || `${p.nombres} ${p.apellidos} ${p.cargo} ${p.codigo} ${p.dni}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [lista, q, fArea],
  );

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const todosSel = filtrados.length > 0 && filtrados.every((p) => sel.has(p.id));

  const urlImprimir = sel.size
    ? `/imprimir/fotochecks?ids=${[...sel].join(',')}`
    : `/imprimir/fotochecks${fArea ? `?area=${fArea}` : ''}`;

  const preview: Persona = { ...form, id: editId ?? 'vista-previa', creadoEn: '' };
  const nombreCompleto = form.nombres || form.apellidos;

  return (
    <>
      <div className="persona-editor">
        <form className="card form-grid" onSubmit={guardar}>
          <h2 className="form-section-title span-all"><span className="section-icon"><Icon name="users" /></span>{editId ? 'Editar colaborador' : 'Registrar colaborador'}</h2>
          <label>Nombres<input className="input" required value={form.nombres} onChange={(e) => set('nombres', e.target.value)} /></label>
          <label>Apellidos<input className="input" required value={form.apellidos} onChange={(e) => set('apellidos', e.target.value)} /></label>
          <label>Cargo<input className="input" value={form.cargo} onChange={(e) => set('cargo', e.target.value)} placeholder="Analista de sistemas" /></label>
          <label>
            Área
            <select className="input" value={form.areaId} onChange={(e) => set('areaId', e.target.value)}>
              <option value="">— Sin área —</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </label>
          <label>DNI<input className="input" value={form.dni} onChange={(e) => set('dni', e.target.value)} /></label>
          <label>Correo<input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></label>
          <label>Código<input className="input" value={form.codigo} onChange={(e) => set('codigo', e.target.value)} placeholder="Automático (EMP-0001)" /></label>
          <label>
            Foto (se recorta tipo carnet)
            <input ref={fileRef} className="input" type="file" accept="image/*" onChange={(e) => onFoto(e.target.files?.[0])} />
          </label>
          <label className="switch span-all">
            <input type="checkbox" checked={form.activo} onChange={(e) => set('activo', e.target.checked)} />
            <span>Credencial activa (si la desactivas, al escanear el QR aparecerá como inactiva)</span>
          </label>
          {error && <p className="error span-all">{error}</p>}
          <div className="span-all row">
            <button className="btn"><Icon name={editId ? 'save' : 'check'} size={17} />{editId ? 'Guardar cambios' : 'Registrar'}</button>
            {(editId || nombreCompleto) && <button type="button" className="btn ghost" onClick={cancelar}><Icon name="close" size={16} />Cancelar</button>}
            {form.foto && <button type="button" className="btn ghost" onClick={() => set('foto', '')}><Icon name="trash" size={15} />Quitar foto</button>}
          </div>
        </form>

        <div className="preview">
          <small className="muted">Vista previa</small>
          <IdCard persona={{ ...preview, nombres: form.nombres || 'Nombres', apellidos: form.apellidos || 'Apellidos' }} area={areas.find((a) => a.id === form.areaId)} config={config} base={base} />
        </div>
      </div>

      <div className="page-head">
        <div><p className="eyebrow">EQUIPO DE LA INSTITUCIÓN</p><h2>Personal <span className="count-badge">{lista.length}</span></h2></div>
        <a className="btn" href={urlImprimir} target="_blank" rel="noreferrer">
          <Icon name="print" size={17} /> Imprimir fotochecks {sel.size ? `(${sel.size} seleccionados)` : fArea ? '(del área)' : '(todos)'}
        </a>
      </div>

      <div className="toolbar">
        <label className="search-field"><Icon name="search" size={18} /><input className="input" aria-label="Buscar personal" placeholder="Buscar por nombre, cargo, DNI o código…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <select className="input w-auto" value={fArea} onChange={(e) => setFArea(e.target.value)}>
          <option value="">Todas las áreas</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
        {sel.size > 0 && <button className="btn ghost" onClick={() => setSel(new Set())}><Icon name="close" size={15} />Limpiar selección</button>}
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={todosSel}
                  onChange={() => setSel(todosSel ? new Set() : new Set(filtrados.map((p) => p.id)))}
                />
              </th>
              <th>Colaborador</th>
              <th>Cargo</th>
              <th>Área</th>
              <th>Código</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => {
              const a = areas.find((x) => x.id === p.areaId);
              return (
                <tr key={p.id} className={p.activo ? '' : 'inactive'}>
                  <td><input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)} /></td>
                  <td>
                    <div className="person-cell">
                      {p.foto ? <img src={p.foto} alt="" /> : <span className="avatar">{p.nombres[0]}{p.apellidos[0]}</span>}
                      <div>
                        <b>{p.apellidos}, {p.nombres}</b>
                        <small className="muted">{p.dni && `DNI ${p.dni}`}{!p.activo && ' · inactivo'}</small>
                      </div>
                    </div>
                  </td>
                  <td>{p.cargo}</td>
                  <td>{a && <><span className="dot" style={{ background: a.color }} /> {a.nombre}</>}</td>
                  <td><code>{p.codigo}</code></td>
                  <td className="actions">
                    <a className="btn small ghost" aria-label={`Ver credencial de ${p.nombres} ${p.apellidos}`} href={`/p/${p.id}`} target="_blank" rel="noreferrer"><Icon name="eye" size={15} /></a>
                    <button className="btn small ghost" aria-label={`Editar ${p.nombres} ${p.apellidos}`} onClick={() => editar(p)}><Icon name="edit" size={15} /></button>
                    <button className="btn small danger" aria-label={`Eliminar ${p.nombres} ${p.apellidos}`} onClick={() => eliminar(p)}><Icon name="trash" size={15} /></button>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="empty">Aún no hay colaboradores registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
