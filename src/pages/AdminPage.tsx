import { useCallback, useState, type FormEvent } from 'react';
import { api, auth } from '../lib/api';
import ResumenAdmin from './admin/ResumenAdmin';
import AreasAdmin from './admin/AreasAdmin';
import PersonalAdmin from './admin/PersonalAdmin';
import ConfigAdmin from './admin/ConfigAdmin';
import { Icon, type IconName } from '../components/Icon';

const TABS = {
  resumen: { label: 'Resumen', icon: 'dashboard' },
  areas: { label: 'Áreas y QR', icon: 'areas' },
  personal: { label: 'Personal y fotochecks', icon: 'users' },
  config: { label: 'Configuración', icon: 'settings' },
} as const satisfies Record<string, { label: string; icon: IconName }>;
type Tab = keyof typeof TABS;

export default function AdminPage() {
  const [logged, setLogged] = useState(() => !!auth.adminPin());
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('resumen');
  const onAuthError = useCallback(() => setLogged(false), []);

  async function login(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/admin', { pin });
      auth.setAdminPin(pin);
      setLogged(true);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!logged)
    return (
      <form className="card narrow" onSubmit={login}>
        <div className="auth-icon"><Icon name="shield" size={24} /></div>
        <p className="eyebrow">PORTAL DE GESTIÓN</p>
        <h2>Administración</h2>
        <p className="muted">Gestión de áreas, personal, QR y fotochecks.</p>
        <input
          className="input"
          type="password"
          placeholder="PIN de administrador"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          autoFocus
        />
        {error && <p className="error">{error}</p>}
        <button className="btn block"><Icon name="lock" size={17} /> Ingresar al panel</button>
      </form>
    );

  return (
    <>
      <div className="page-head">
        <div><p className="eyebrow"><Icon name="settings" size={15} /> ESPACIO DE TRABAJO</p><h1>Administración</h1></div>
        <button
          className="btn ghost"
          onClick={() => {
            auth.setAdminPin(null);
            setLogged(false);
          }}
        >
          <Icon name="logout" size={16} /> Cerrar sesión
        </button>
      </div>
      <nav className="tabs" aria-label="Secciones de administración">
        {(Object.keys(TABS) as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)}>
            <Icon name={TABS[t].icon} size={17} /> {TABS[t].label}
          </button>
        ))}
      </nav>
      {tab === 'resumen' && <ResumenAdmin onAuthError={onAuthError} />}
      {tab === 'areas' && <AreasAdmin />}
      {tab === 'personal' && <PersonalAdmin />}
      {tab === 'config' && <ConfigAdmin />}
    </>
  );
}
