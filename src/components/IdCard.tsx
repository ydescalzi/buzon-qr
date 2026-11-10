import type { CSSProperties } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getInstitutionLogo } from '../lib/hooks';
import type { Area, Config, PersonaPublica } from '../types';

interface Props {
  persona: PersonaPublica;
  area?: Area;
  config: Config;
  base: string;
}

/** Fotocheck tamaño tarjeta CR80 vertical (54 × 85.6 mm). */
export default function IdCard({ persona, area, config, base }: Props) {
  const url = `${base}/p/${persona.id}`;
  const iniciales = `${persona.nombres[0] ?? ''}${persona.apellidos[0] ?? ''}`.toUpperCase();
  return (
    <div className="idcard" style={{ '--area': area?.color ?? '#334155' } as CSSProperties}>
      <div className="idcard-top">
        <img src={getInstitutionLogo(config)} alt={config.empresa || 'Logo institucional'} className="idcard-logo" />
        {config.logo && config.empresa && <span className="idcard-empresa">{config.empresa}</span>}
      </div>

      <div className="idcard-photo">
        {persona.foto ? <img src={persona.foto} alt="" /> : <span>{iniciales}</span>}
      </div>

      <div className="idcard-name">
        {persona.nombres}
        <strong>{persona.apellidos}</strong>
      </div>
      <div className="idcard-cargo">{persona.cargo || '—'}</div>
      <div className="idcard-area">{area?.nombre ?? 'Sin área'}</div>

      <div className="idcard-bottom">
        <QRCodeSVG value={url} size={256} level="M" marginSize={0} style={{ width: '17mm', height: '17mm' }} />
        <div className="idcard-code">
          <span>Código</span>
          <b>{persona.codigo}</b>
          <small>Escanéame</small>
        </div>
      </div>
    </div>
  );
}
