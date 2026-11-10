import { useSearchParams } from 'react-router-dom';
import AreaPoster from '../components/AreaPoster';
import { isLocalhost, publicBase, useAreas, useConfig } from '../lib/hooks';
import { Icon } from '../components/Icon';

export default function PrintAreasPage() {
  const [params] = useSearchParams();
  const { areas, loading } = useAreas();
  const { config } = useConfig();
  const base = publicBase(config);
  const id = params.get('id');
  const lista = id ? areas.filter((a) => a.id === id) : areas;

  return (
    <div className="print-page">
      <div className="print-bar no-print">
        <span>{lista.length} afiche(s) · tamaño A4 · un área por hoja</span>
        {isLocalhost(base) && <span className="warn"><Icon name="warning" size={16} /> Los QR apuntan a localhost: configura la URL pública primero.</span>}
        <button className="btn" onClick={() => window.print()} disabled={loading}><Icon name="print" size={17} /> Imprimir</button>
      </div>
      {lista.map((a) => <AreaPoster key={a.id} area={a} config={config} base={base} />)}
    </div>
  );
}
