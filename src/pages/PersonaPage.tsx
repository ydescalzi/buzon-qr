import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { getInstitutionLogo, useConfig } from '../lib/hooks';
import type { Area, PersonaPublica } from '../types';
import { Icon } from '../components/Icon';

/** Lo que se ve al escanear el QR del fotocheck. */
export default function PersonaPage() {
  const { personaId = '' } = useParams();
  const { config } = useConfig();
  const [persona, setPersona] = useState<PersonaPublica | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<PersonaPublica>(`/personal/${personaId}`)
      .then((p) => {
        setPersona(p);
        if (p.areaId) api.get<Area>(`/areas/${p.areaId}`).then(setArea).catch(() => undefined);
      })
      .catch(() => setError(true));
  }, [personaId]);

  if (error)
    return (
      <div className="mobile">
        <div className="card center">
          <h2>Credencial no válida</h2>
          <p>Este código no corresponde a ningún colaborador registrado.</p>
        </div>
      </div>
    );
  if (!persona) return <div className="mobile"><p className="empty">Cargando…</p></div>;

  return (
    <div className="mobile" style={{ '--area': area?.color ?? '#334155' } as CSSProperties}>
      <div className="card center profile">
        <img className="profile-logo" src={getInstitutionLogo(config)} alt={config.empresa || 'Logo institucional'} />
        {config.logo && config.empresa && <small className="muted">{config.empresa}</small>}
        <div className="profile-photo">
          {persona.foto ? <img src={persona.foto} alt="" /> : <span>{persona.nombres[0]}{persona.apellidos[0]}</span>}
        </div>
        <h2>{persona.nombres} {persona.apellidos}</h2>
        <p className="profile-cargo">{persona.cargo}</p>
        {area && <span className="pill" style={{ background: area.color }}>{area.nombre}</span>}
        <p className={`status ${persona.activo ? 'ok' : 'off'}`}>
          <Icon name={persona.activo ? 'checkCircle' : 'warning'} size={16} />
          {persona.activo ? 'Colaborador activo' : 'Credencial inactiva'}
        </p>
        <p className="muted profile-code"><Icon name="file" size={15} /> Código: <b>{persona.codigo}</b></p>
        {area && persona.activo && (
          <Link to={`/s/${area.id}`} className="btn btn-area block">
            <Icon name="send" size={17} /> Enviar una sugerencia a {area.nombre}
          </Link>
        )}
      </div>
    </div>
  );
}
