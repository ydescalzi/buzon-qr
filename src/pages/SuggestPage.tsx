import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { getInstitutionLogo, useConfig } from '../lib/hooks';
import { MAX_MENSAJE, TIPOS, type Area, type TipoSugerencia } from '../types';
import { Icon, SuggestionIcon } from '../components/Icon';

export default function SuggestPage() {
  const { areaId = '' } = useParams();
  const { config } = useConfig();
  const [area, setArea] = useState<Area | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tipo, setTipo] = useState<TipoSugerencia>('sugerencia');
  const [mensaje, setMensaje] = useState('');
  const [anonimo, setAnonimo] = useState(true);
  const [autor, setAutor] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Area>(`/areas/${areaId}`).then(setArea).catch(() => setNotFound(true));
  }, [areaId]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await api.post('/sugerencias', { areaId, tipo, mensaje, anonimo, autor });
      setEnviado(true);
      setMensaje('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (notFound)
    return (
      <div className="mobile">
        <div className="card center">
          <div className="auth-icon"><Icon name="warning" size={23} /></div>
          <h2>Área no encontrada</h2>
          <p>Este código QR ya no es válido.</p>
          <Link to="/" className="btn"><Icon name="arrowRight" size={16} /> Ver todas las áreas</Link>
        </div>
      </div>
    );
  if (!area) return <div className="mobile"><p className="empty">Cargando…</p></div>;

  return (
    <div className="mobile" style={{ '--area': area.color } as CSSProperties}>
      <header className="mobile-head">
        <img className="mobile-logo" src={getInstitutionLogo(config)} alt={config.empresa || 'Logo institucional'} />
        <small>Buzón de sugerencias</small>
        <h1>{area.nombre}</h1>
        {area.descripcion && <p>{area.descripcion}</p>}
      </header>

      {enviado ? (
        <div className="card center success">
          <div className="big-check"><Icon name="check" size={32} /></div>
          <h2>¡Gracias! Tu mensaje fue enviado</h2>
          <p>El equipo de {area.nombre} lo recibirá en su bandeja.</p>
          <button className="btn btn-area" onClick={() => setEnviado(false)}><Icon name="send" size={17} /> Enviar otro mensaje</button>
        </div>
      ) : (
        <form className="card" onSubmit={enviar}>
          <label className="label"><span className="form-step">1</span> ¿Qué quieres compartir?</label>
          <div className="chips">
            {(Object.keys(TIPOS) as TipoSugerencia[]).map((t) => (
              <button
                type="button"
                key={t}
                className={`chip ${tipo === t ? 'on' : ''}`}
                onClick={() => setTipo(t)}
              >
                <SuggestionIcon type={t} /> {TIPOS[t].label}
              </button>
            ))}
          </div>

          <label className="label" htmlFor="msg"><span className="form-step">2</span> Cuéntanos más</label>
          <textarea
            id="msg"
            rows={6}
            required
            minLength={5}
            maxLength={MAX_MENSAJE}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Cuéntanos con detalle: qué pasa, qué propones, a quién quieres reconocer…"
          />
          <div className="counter">{mensaje.length}/{MAX_MENSAJE}</div>

          <label className="switch">
            <input type="checkbox" checked={anonimo} onChange={(e) => setAnonimo(e.target.checked)} />
            <span className="switch-copy"><b>Enviar de forma anónima</b><small>Tu identidad no será compartida</small></span>
          </label>
          {!anonimo && (
            <input
              className="input"
              placeholder="Tu nombre (opcional)"
              value={autor}
              maxLength={120}
              onChange={(e) => setAutor(e.target.value)}
            />
          )}
          <p className="hint privacy-hint">
            <Icon name="shield" size={16} />
            {anonimo
              ? 'No se guarda tu nombre, IP ni datos de tu celular.'
              : 'Tu nombre será visible para el área, así podrán contactarte.'}
          </p>

          {error && <p className="error form-error"><Icon name="warning" size={16} />{error}</p>}
          <button className="btn btn-area block" disabled={enviando || mensaje.trim().length < 5}>
            <Icon name="send" size={17} />{enviando ? 'Enviando…' : 'Enviar mensaje'}
          </button>
        </form>
      )}
      <p className="mobile-foot"><Icon name="shield" size={15} /> <Link to="/">Otras áreas</Link><span>·</span> Tu voz importa</p>
    </div>
  );
}
