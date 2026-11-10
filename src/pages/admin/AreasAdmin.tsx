import { useState, type FormEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api, auth } from '../../lib/api';
import { isLocalhost, publicBase, useAreas, useConfig } from '../../lib/hooks';
import type { Area } from '../../types';
import { Icon } from '../../components/Icon';

const VACIO = { nombre: '', descripcion: '', color: '#0e7490', pin: '' };

export default function AreasAdmin() {
  const { areas, reload } = useAreas();
  const { config } = useConfig();
  const base = publicBase(config);
  const [form, setForm] = useState(VACIO);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState('');

  function editar(a: Area) {
    setEditId(a.id);
    setForm({ nombre: a.nombre, descripcion: a.descripcion, color: a.color, pin: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelar() {
    setEditId(null);
    setForm(VACIO);
    setError('');
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editId) await api.put(`/areas/${editId}`, form, auth.adminHeaders());
      else await api.post('/areas', form, auth.adminHeaders());
      cancelar();
      reload();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function eliminar(a: Area) {
    if (!confirm(`¿Eliminar "${a.nombre}"? Se borrarán también TODAS sus sugerencias y su QR dejará de funcionar.`)) return;
    await api.del(`/areas/${a.id}`, auth.adminHeaders());
    reload();
  }

  async function copiar(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(url);
      setTimeout(() => setCopiado(''), 1500);
    } catch {
      prompt('Copia el enlace:', url);
    }
  }

  return (
    <>
      {isLocalhost(base) && (
        <div className="alert">
          <Icon name="warning" size={19} /> <span>Los QR apuntan a <b>{base}</b>, que no abre desde un celular. Ve a <b>Configuración</b> y elige la
          dirección de red de este equipo antes de imprimir.
          </span>
        </div>
      )}

      <form className="card form-grid" onSubmit={guardar}>
        <h2 className="form-section-title span-all"><span className="section-icon"><Icon name={editId ? 'edit' : 'areas'} /></span>{editId ? 'Editar área' : 'Crear una nueva área'}</h2>
        <label>
          Nombre
          <input className="input" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Dpto. de Sistemas" />
        </label>
        <label>
          Descripción corta
          <input className="input" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Soporte, equipos, redes…" />
        </label>
        <label>
          Color
          <input className="input color" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
        </label>
        <label>
          {editId ? 'Nuevo PIN (vacío = no cambiar)' : 'PIN para la bandeja'}
          <input className="input" required={!editId} minLength={4} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} placeholder="mín. 4 caracteres" />
        </label>
        {error && <p className="error span-all">{error}</p>}
        <div className="span-all row">
          <button className="btn"><Icon name={editId ? 'save' : 'check'} size={17} />{editId ? 'Guardar cambios' : 'Crear área'}</button>
          {editId && <button type="button" className="btn ghost" onClick={cancelar}><Icon name="close" size={16} />Cancelar</button>}
        </div>
      </form>

      <div className="page-head">
        <div><p className="eyebrow">ORGANIZA TUS CANALES</p><h2>Áreas <span className="count-badge">{areas.length}</span></h2></div>
        <a className="btn" href="/imprimir/areas" target="_blank" rel="noreferrer"><Icon name="print" size={17} /> Imprimir afiches QR</a>
      </div>

      <div className="area-admin-grid">
        {areas.map((a) => {
          const url = `${base}/s/${a.id}`;
          return (
            <div key={a.id} className="card area-admin" style={{ borderTopColor: a.color }}>
              <QRCodeSVG value={url} size={110} marginSize={1} />
              <div className="grow">
                <h3>{a.nombre}</h3>
                <p className="muted small">{a.descripcion}</p>
                <code className="url">{url}</code>
                <div className="row wrap">
                  <button className="btn small ghost" onClick={() => copiar(url)}><Icon name={copiado === url ? 'check' : 'copy'} size={15} />{copiado === url ? 'Copiado' : 'Copiar enlace'}</button>
                  <a className="btn small ghost" href={`/imprimir/areas?id=${a.id}`} target="_blank" rel="noreferrer"><Icon name="print" size={15} />Imprimir</a>
                  <button className="btn small ghost" onClick={() => editar(a)}><Icon name="edit" size={15} />Editar</button>
                  <button className="btn small danger" aria-label={`Eliminar ${a.nombre}`} onClick={() => eliminar(a)}><Icon name="trash" size={15} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
