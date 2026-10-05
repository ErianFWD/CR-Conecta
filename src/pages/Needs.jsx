import { useMemo, useState } from 'react';
import { Check, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../lib/useData';
import { MockupNeedCard } from '../components/MockupNeedCard';

export function Needs({ onOpenNeedModal }) {
  const { data: reqs = [], state, retry } = useData('/requests');
  const [filter, setFilter] = useState('Todas');

  const approvedList = useMemo(() => {
    return (reqs || []).filter(r => {
      const matchStatus = r.status === 'Aprobada';
      const matchPriority = filter === 'Todas' || r.priority === filter;
      return matchStatus && matchPriority;
    });
  }, [reqs, filter]);

  return (
    <div className="page needs-page">
      <div className="needs-page-hero">
        <div className="page-head">
          <span className="eyebrow">OPORTUNIDADES PARA AYUDAR</span>
          <h1>Tu ayuda puede cambiar un día.</h1>
          <p>
            Conocé las necesidades aprobadas en tu comunidad y elegí cómo colaborar. La identidad y ubicación exacta de las familias se mantienen protegidas.
          </p>
        </div>
        <div className="needs-hero-note">
          <span className="needs-hero-icon"><HeartHandshake size={22} /></span>
          <strong>Apoyo cercano,<br />impacto real.</strong>
          <span>Cada aporte suma a una red comunitaria más fuerte.</span>
        </div>
      </div>

      <div className="filter-row">
        <div className="pills">
          <Link className="btn primary" to="/solicitar" style={{ padding: '8px 18px', fontSize: '0.75rem' }}>
            Solicitar ayuda
          </Link>
          {['Todas', 'Alta', 'Media', 'Baja'].map(x => (
            <button
              key={x}
              className={filter === x ? 'active' : ''}
              onClick={() => setFilter(x)}
            >
              {x === 'Todas' ? 'Todas las prioridades' : `Prioridad ${x}`}
            </button>
          ))}
        </div>
        <span className="needs-count-note">
          {approvedList.length} {approvedList.length === 1 ? 'necesidad aprobada' : 'necesidades aprobadas'} · Privacidad protegida
        </span>
      </div>

      {state === 'loading' ? (
        <div className="state"><div className="state-icon">…</div><h3>Cargando solicitudes...</h3></div>
      ) : state === 'error' ? (
        <div className="state">
          <div className="state-icon">!</div>
          <h3>Error de conexión con la API</h3>
          <p>Verificá que el servidor local en el puerto 3001 esté activo.</p>
          <button className="btn secondary" onClick={retry}>Reintentar</button>
        </div>
      ) : approvedList.length === 0 ? (
        <div className="state">
          <div className="state-icon"><Check size={24} /></div>
          <h3>No hay solicitudes aprobadas con este filtro</h3>
          <p>Podés cambiar de filtro o ingresar al panel administrativo para evaluar solicitudes pendientes.</p>
        </div>
      ) : (
        <div className="large-grid">
          {approvedList.map((r, i) => (
            <MockupNeedCard
              key={r.id}
              r={r}
              index={i}
              onSelect={() => onOpenNeedModal(r)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
