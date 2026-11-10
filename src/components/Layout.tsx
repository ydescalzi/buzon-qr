import { NavLink, Outlet } from 'react-router-dom';
import { getInstitutionLogo, useConfig } from '../lib/hooks';
import { Icon } from './Icon';

export default function Layout() {
  const { config } = useConfig();
  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <img src={getInstitutionLogo(config)} alt={config.empresa || 'Logo institucional'} />
          <span>
            <b>Buzón QR</b>
            {config.logo && config.empresa && <small>{config.empresa}</small>}
          </span>
        </NavLink>
        <nav aria-label="Navegación principal">
          <NavLink to="/" end><Icon name="areas" /> <span>Áreas</span></NavLink>
          <NavLink to="/bandeja"><Icon name="inbox" /> <span>Bandeja</span></NavLink>
          <NavLink to="/admin"><Icon name="settings" /> <span>Administración</span></NavLink>
        </nav>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
