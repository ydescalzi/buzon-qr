import type { CSSProperties } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getInstitutionLogo } from '../lib/hooks';
import type { Area, Config } from '../types';

/** Afiche A4 para pegar en la puerta / escritorio de cada área. */
export default function AreaPoster({ area, config, base }: { area: Area; config: Config; base: string }) {
  const url = `${base}/s/${area.id}`;
  return (
    <section className="poster" style={{ '--area': area.color } as CSSProperties}>
      <header className="poster-head">
        <img src={getInstitutionLogo(config)} alt={config.empresa || 'Logo institucional'} />
        {config.logo && config.empresa && <span>{config.empresa}</span>}
      </header>

      <div className="poster-body">
        <p className="poster-kicker">Buzón de sugerencias</p>
        <h1>{area.nombre}</h1>
        {area.descripcion && <p className="poster-desc">{area.descripcion}</p>}

        <div className="poster-qr">
          <QRCodeSVG value={url} size={512} level="H" marginSize={0} style={{ width: '95mm', height: '95mm' }} />
        </div>

        <ol className="poster-steps">
          <li><b>1</b> Escanea el código con la cámara de tu celular</li>
          <li><b>2</b> Escribe tu sugerencia, idea o reconocimiento</li>
          <li><b>3</b> Envíala — puede ser <u>anónima</u></li>
        </ol>
      </div>

      <footer className="poster-foot">{url}</footer>
    </section>
  );
}
