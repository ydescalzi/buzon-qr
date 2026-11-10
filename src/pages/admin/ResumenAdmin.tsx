import { useEffect, useState } from 'react';
import { api, auth } from '../../lib/api';
import { useAreas } from '../../lib/hooks';
import { ESTADOS, type EstadoSugerencia, type ResumenArea } from '../../types';
import { Icon } from '../../components/Icon';

export default function ResumenAdmin({ onAuthError }: { onAuthError: () => void }) {
  const { areas } = useAreas();
  const [data, setData] = useState<ResumenArea[]>([]);

  useEffect(() => {
    api
      .get<ResumenArea[]>('/resumen', auth.adminHeaders())
      .then(setData)
      .catch(() => {
        auth.setAdminPin(null);
        onAuthError();
      });
  }, [onAuthError]);

  const total = data.reduce((n, r) => n + r.total, 0);
  const nuevas = data.reduce((n, r) => n + r.porEstado.nueva, 0);
  const semana = data.reduce((n, r) => n + r.ultimos7, 0);
  const atendidas = data.reduce((n, r) => n + r.porEstado.atendida, 0);

  return (
    <>
      <div className="stats">
        <div className="stat"><span className="stat-icon"><Icon name="message" /></span><b>{total}</b><span>Mensajes totales</span></div>
        <div className="stat"><span className="stat-icon"><Icon name="calendar" /></span><b>{semana}</b><span>Últimos 7 días</span></div>
        <div className="stat"><span className="stat-icon"><Icon name="mail" /></span><b style={{ color: ESTADOS.nueva.color }}>{nuevas}</b><span>Sin leer</span></div>
        <div className="stat"><span className="stat-icon"><Icon name="checkCircle" /></span>
          <b style={{ color: ESTADOS.atendida.color }}>{total ? Math.round((atendidas / total) * 100) : 0}%</b>
          <span>Atendidas</span>
        </div>
      </div>

      <div className="section-heading summary-heading">
        <div><p className="eyebrow">ACTIVIDAD POR EQUIPO</p><h2>Resumen de áreas</h2></div>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Área</th>
              <th className="num">Total</th>
              <th className="num">7 días</th>
              {(Object.keys(ESTADOS) as EstadoSugerencia[]).map((e) => (
                <th key={e} className="num">{ESTADOS[e].label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r) => {
              const a = areas.find((x) => x.id === r.areaId);
              return (
                <tr key={r.areaId}>
                  <td><span className="dot" style={{ background: a?.color }} /> {a?.nombre ?? r.areaId}</td>
                  <td className="num"><b>{r.total}</b></td>
                  <td className="num">{r.ultimos7}</td>
                  {(Object.keys(ESTADOS) as EstadoSugerencia[]).map((e) => (
                    <td key={e} className="num">{r.porEstado[e] || '·'}</td>
                  ))}
                </tr>
              );
            })}
            {!data.length && <tr><td colSpan={3 + Object.keys(ESTADOS).length} className="empty">Aún no hay actividad para mostrar.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="hint"><Icon name="shield" size={14} />
        El administrador puede abrir la bandeja de cualquier área desde “Bandeja” sin conocer su PIN.
      </p>
    </>
  );
}
