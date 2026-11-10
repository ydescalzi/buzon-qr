import { useEffect, useState, type FormEvent } from 'react';
import { api, auth } from '../../lib/api';
import { isLocalhost, useConfig } from '../../lib/hooks';
import { prepararLogo } from '../../lib/image';
import type { Config } from '../../types';
import { Icon } from '../../components/Icon';

export default function ConfigAdmin() {
  const { config, setConfig } = useConfig();
  const [form, setForm] = useState<Config>(config);
  const [ips, setIps] = useState<string[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => setForm(config), [config]);
  useEffect(() => {
    api.get<{ ips: string[] }>('/info').then((r) => setIps(r.ips)).catch(() => undefined);
  }, []);

  const puerto = window.location.port ? `:${window.location.port}` : '';
  const sugeridas = ips.map((ip) => `${window.location.protocol}//${ip}${puerto}`);
  const actual = form.publicUrl || window.location.origin;

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      const c = await api.put<Config>('/config', form, auth.adminHeaders());
      setConfig(c);
      setMsg('Configuración guardada');
    } catch (err) {
      setMsg((err as Error).message);
    }
  }

  return (
    <form className="card form-grid" onSubmit={guardar}>
      <h2 className="form-section-title span-all"><span className="section-icon"><Icon name="areas" /></span>Identidad de la institución</h2>
      <label>
        Nombre de la institución / empresa
        <input className="input" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} />
      </label>
      <label>
        Logo personalizado (opcional)
        <input
          className="input"
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setForm({ ...form, logo: await prepararLogo(f) });
          }}
        />
        <small className="muted">Si no cargas uno, se usará el logo institucional.</small>
      </label>
      {form.logo && (
        <div className="span-all row">
          <img src={form.logo} alt="logo" className="logo-preview" />
          <button type="button" className="btn small ghost" onClick={() => setForm({ ...form, logo: '' })}><Icon name="trash" size={15} />Quitar logo</button>
        </div>
      )}

      <h2 className="form-section-title span-all"><span className="section-icon"><Icon name="globe" /></span>Dirección pública de los códigos QR</h2>
      <p className="span-all muted">
        Los celulares deben poder abrir esta dirección. Si los QR dicen <code>localhost</code>, solo funcionarían en
        esta misma computadora. Usa la IP de red de este equipo (misma red WiFi/LAN) o, si lo publican en un
        servidor, su dominio (por ejemplo <code>https://sugerencias.miempresa.pe</code>).
      </p>
      <label className="span-all">
        URL pública
        <input
          className="input"
          value={form.publicUrl}
          placeholder={window.location.origin}
          onChange={(e) => setForm({ ...form, publicUrl: e.target.value })}
        />
      </label>
      {sugeridas.length > 0 && (
        <div className="span-all row wrap">
          <span className="muted small">Direcciones de red detectadas:</span>
          {sugeridas.map((u) => (
            <button type="button" key={u} className="chip" onClick={() => setForm({ ...form, publicUrl: u })}><Icon name="globe" size={15} />{u}</button>
          ))}
        </div>
      )}
      {isLocalhost(actual) && <div className="alert span-all"><Icon name="warning" size={18} /><span>Actualmente los QR usarían <b>{actual}</b>.</span></div>}

      <h2 className="form-section-title span-all"><span className="section-icon"><Icon name="lock" /></span>Acceso de administración</h2>
      <p className="span-all muted">
        Se define al iniciar el servidor con la variable <code>ADMIN_PIN</code> (ver README). Por defecto es
        <code>admin123</code>: cámbialo antes de usarlo en serio.
      </p>

      <div className="span-all row">
        <button className="btn"><Icon name="save" size={17} />Guardar configuración</button>
        {msg && <span className="save-message"><Icon name="checkCircle" size={17} />{msg}</span>}
      </div>
    </form>
  );
}
