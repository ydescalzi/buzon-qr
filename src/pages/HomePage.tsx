import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAreas } from '../lib/hooks';
import { Icon } from '../components/Icon';

export default function HomePage() {
  const { areas, loading } = useAreas();
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <p className="hero-kicker"><Icon name="message" size={16} /> CANAL DIGITAL DE SUGERENCIAS</p>
          <h1>Tu opinión puede hacer la diferencia.</h1>
          <p>
          Cada área tiene su propio código QR. Escanéalo o elige el área aquí abajo, escribe tu sugerencia y envíala.
          Puedes hacerlo de forma anónima: no se guarda tu nombre ni tu dispositivo.
          </p>
          <div className="hero-points">
            <span><Icon name="shield" size={16} /> Anónimo y confidencial</span>
            <span><Icon name="send" size={16} /> Llega al área correcta</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true"><Icon name="message" size={58} strokeWidth={1.3} /></div>
      </section>

      {loading ? (
        <div className="empty-state"><Icon name="refresh" size={22} /><p>Cargando áreas…</p></div>
      ) : (
        <>
          <div className="section-heading">
            <div><p className="eyebrow">ESTAMOS PARA ESCUCHARTE</p><h2>Elige un área</h2></div>
            <span className="section-note"><Icon name="areas" size={16} /> {areas.length} áreas disponibles</span>
          </div>
          {areas.length ? (
            <div className="area-grid">
              {areas.map((a) => (
                <Link key={a.id} to={`/s/${a.id}`} className="area-tile" style={{ '--area': a.color } as CSSProperties}>
                  <span className="area-icon"><Icon name="areas" size={22} /></span>
                  <span className="area-tile-title">{a.nombre}</span>
                  <small>{a.descripcion || 'Envíanos tu mensaje y lo haremos llegar al equipo.'}</small>
                  <span className="area-cta">Enviar un mensaje <Icon name="arrowRight" size={17} /></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state"><Icon name="areas" size={24} /><p>Aún no hay áreas disponibles.</p></div>
          )}
        </>
      )}
    </>
  );
}
