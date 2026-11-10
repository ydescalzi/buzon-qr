import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import IdCard from '../components/IdCard';
import { api, auth } from '../lib/api';
import { isLocalhost, publicBase, useAreas, useConfig } from '../lib/hooks';
import type { Persona } from '../types';
import { Icon } from '../components/Icon';

export default function PrintCardsPage() {
  const [params] = useSearchParams();
  const { areas } = useAreas();
  const { config } = useConfig();
  const base = publicBase(config);
  const [personal, setPersonal] = useState<Persona[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<Persona[]>('/personal', auth.adminHeaders())
      .then(setPersonal)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error)
    return (
      <div className="print-page">
        <p className="empty">{error}. <Link to="/admin">Inicia sesión como administrador</Link>.</p>
      </div>
    );
  if (!personal) return <p className="empty">Cargando…</p>;

  const ids = params.get('ids')?.split(',').filter(Boolean);
  const area = params.get('area');
  const lista = personal.filter((p) => (ids ? ids.includes(p.id) : p.activo && (!area || p.areaId === area)));

  return (
    <div className="print-page">
      <div className="print-bar no-print">
        <span>{lista.length} fotocheck(s) · 54 × 85.6 mm (tarjeta CR80) · 9 por hoja A4</span>
        {isLocalhost(base) && <span className="warn"><Icon name="warning" size={16} /> Los QR apuntan a localhost: configura la URL pública primero.</span>}
        <button className="btn" onClick={() => window.print()}><Icon name="print" size={17} /> Imprimir</button>
      </div>
      <p className="no-print print-tip">
        Consejo: en el diálogo de impresión usa escala <b>100%</b> (“Tamaño real”) y activa “Gráficos de fondo”
        para que salgan los colores.
      </p>
      <div className="card-sheet">
        {lista.map((p) => (
          <IdCard key={p.id} persona={p} area={areas.find((a) => a.id === p.areaId)} config={config} base={base} />
        ))}
      </div>
    </div>
  );
}
