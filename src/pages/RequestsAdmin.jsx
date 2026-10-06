import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CircleCheck, Clock3, FileText, MapPin, Star, Target } from 'lucide-react';
import { api } from '../lib/api';
import { DashboardMetric } from '../components/DashboardCharts';
import { useData } from '../lib/useData';
import { GoogleIcon } from '../components/GoogleAccessModal';
import { RequestEvaluationModal } from '../components/RequestEvaluationModal';

const STATUS_OPTIONS = ['Todas', 'En revisión', 'Aprobada', 'Denegada'];
const PRIORITY_OPTIONS = ['Todas', 'Alta', 'Media', 'Baja'];

function statusClass(status) {
  if (status === 'Aprobada') return 'aprobada';
  if (status === 'Denegada') return 'denegada';
  return 'revision';
}

const KpiCard = DashboardMetric;

// Cada rol ve un encabezado distinto: el mismo listado cambia de enfoque.
const ROLE_VIEW = {
  Administrador: {
    eyebrow: 'SOLICITUDES · ADMINISTRACIÓN (RF-08, RF-09, RF-10)',
    title: 'Solicitudes',
    lead: 'Revisá cada caso, verificá los límites de cantidad y registrá el dictamen. Es la única vista con acceso a la información interna de las solicitudes.',
  },
  Beneficiario: {
    eyebrow: 'MIS SOLICITUDES (RF-05, RF-07, RF-10)',
    title: 'Mis solicitudes',
    lead: 'Estas son las solicitudes que registraste y el avance de los apoyos asignados a tu hogar.',
  },
  'Aliado comunitario': {
    eyebrow: 'SOLICITUDES DE MI COMUNIDAD',
    title: 'Solicitudes de mi zona',
    lead: 'Solo se muestran las solicitudes aprobadas de tu zona comunitaria, con la información pública de cada caso.',
  },
  'Donante individual': {
    eyebrow: 'SOLICITUDES APROBADAS',
    title: 'Solicitudes a las que podés aportar',
    lead: 'Casos aprobados a los que podés aportar. La información sensible de cada solicitud no se comparte.',
  },
  'Empresa donante': {
    eyebrow: 'SOLICITUDES APROBADAS',
    title: 'Necesidades abiertas',
    lead: 'Casos aprobados donde tu organización puede coordinar aportes o campañas.',
  },
  Voluntario: {
    eyebrow: 'SOLICITUDES APROBADAS',
    title: 'Solicitudes vinculadas a entregas',
    lead: 'Casos aprobados que tu voluntariado puede ayudar a distribuir en las rutas asignadas.',
  }
};

export function RequestsAdmin({ session, onOpenGoogleAuth }) {
  const [refreshCount, setRefreshCount] = useState(0);
  const [filterStatus, setFilterStatus] = useState('Todas');
  const [filterPriority, setFilterPriority] = useState('Todas');
  const [evaluatingRequest, setEvaluatingRequest] = useState(null);
  const [saveError, setSaveError] = useState('');

  const { data: reqs = [], state } = useData('/requests', refreshCount);
  const triggerRefresh = () => setRefreshCount(c => c + 1);

  const role = session?.role;
  const isAdmin = role === 'Administrador';
  const view = role ? ROLE_VIEW[role] : null;

  const visibleRequests = useMemo(
    () => (reqs || []).filter(r =>
      (filterStatus === 'Todas' || r.status === filterStatus)
      && (filterPriority === 'Todas' || r.priority === filterPriority)),
    [reqs, filterStatus, filterPriority]
  );

  const counts = useMemo(() => {
    const rows = reqs || [];
    const pending = rows.filter(r => r.status === 'En revisión').length;
    const approved = rows.filter(r => r.status === 'Aprobada').length;
    const denied = rows.filter(r => r.status === 'Denegada').length;
    const goal = rows.reduce((sum, r) => sum + (Number(r.goal) || Number(r.amount) || 0), 0);
    const received = rows.reduce((sum, r) => sum + (Number(r.received) || 0), 0);
    return { pending, approved, denied, goal, received, total: rows.length };
  }, [reqs]);

  const handleSaveEvaluation = async (requestId, payload) => {
    setSaveError('');
    try {
      await api(`/requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      setEvaluatingRequest(null);
      triggerRefresh();
    } catch (error) {
      setSaveError(error.message || 'No se pudo guardar el dictamen de la solicitud.');
      throw error;
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">{view?.eyebrow || 'SOLICITUDES'}</span>
        <h1>{view?.title || 'Solicitudes aprobadas'}</h1>
        <p>{view?.lead || 'Casos aprobados registrados en la plataforma. Iniciá sesión para ver las solicitudes vinculadas a tu perfil.'}</p>
      </div>

      {!session && (
        <div className="solicitudes-gate">
          <h3>Estás viendo solo la información pública</h3>
          <p>
            Sin sesión se listan únicamente las solicitudes aprobadas. Iniciá sesión para ver
            tus propias solicitudes, las de tu zona o el detalle interno de cada caso.
          </p>
          <button className="btn primary" onClick={onOpenGoogleAuth}>
            <GoogleIcon size={18} /> Iniciar sesión de demostración
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="api-banner" role="alert">
          No se pudieron cargar las solicitudes desde la API local.
          <button type="button" onClick={triggerRefresh}>Reintentar</button>
        </div>
      )}

      {saveError && (
        <div className="api-banner" role="alert">{saveError}</div>
      )}

      {counts.total > 0 && (
        <div className="dashboard-kpis solicitudes-kpis">
          {isAdmin ? (
            <>
              <KpiCard icon={Clock3} label="Por evaluar" value={counts.pending} detail="Esperan dictamen" tone="amber" />
              <KpiCard icon={CircleCheck} label="Aprobadas" value={counts.approved} detail="Casos activos" tone="green" />
              <KpiCard icon={AlertTriangle} label="Denegadas" value={counts.denied} detail="Fuera de los criterios" tone="red" />
              <KpiCard icon={FileText} label="Total registradas" value={counts.total} detail="Todas las solicitudes" tone="blue" />
            </>
          ) : (
            <>
              <KpiCard icon={FileText} label="Solicitudes" value={counts.total} detail="Visibles para tu perfil" tone="blue" />
              <KpiCard icon={CircleCheck} label="Aprobadas" value={counts.approved} detail="En curso" tone="green" />
              <KpiCard icon={Target} label="Meta total" value={counts.goal} detail="Unidades solicitadas" tone="blue" />
              <KpiCard
                icon={Target}
                label="Aporte recibido"
                value={counts.received}
                detail={counts.goal ? `${Math.round((counts.received / counts.goal) * 100)}% de la meta` : 'Sin meta registrada'}
                tone="green"
              />
            </>
          )}
        </div>
      )}

      <div className="solicitudes-toolbar">
        <div className="solicitudes-filters">
          <span>Filtrar por estado:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            aria-label="Filtrar solicitudes por estado"
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option === 'Todas' ? 'Todos los estados' : option}
              </option>
            ))}
          </select>

          <span className="solicitudes-filters-gap">Prioridad (RF-09):</span>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            aria-label="Filtrar solicitudes por prioridad"
          >
            {PRIORITY_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option === 'Todas' ? 'Todas las prioridades' : option}
              </option>
            ))}
          </select>
        </div>

        <span className="solicitudes-total">
          {visibleRequests.length} de {counts.total} solicitudes
        </span>
      </div>

      {visibleRequests.length === 0 ? (
        <div className="state">
          <span className="state-icon"><FileText size={26} /></span>
          <h3>No hay solicitudes para mostrar</h3>
          <p>
            {counts.total
              ? 'Probá cambiando los filtros de estado o prioridad.'
              : 'Todavía no hay solicitudes registradas para tu perfil.'}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Necesidad / Categoría</th>
                {isAdmin && <th>Cantidad &amp; Límites (RF-10)</th>}
                <th>Zona</th>
                <th>Prioridad (RF-09)</th>
                <th>Estado</th>
                {!isAdmin && <th>Avance</th>}
                {isAdmin && <th>Dictamen / Excepción</th>}
                {isAdmin && <th>Acción</th>}
              </tr>
            </thead>
            <tbody>
              {visibleRequests.map(r => {
                const isExceeded = r.limitExceeded || r.requiresException;
                const isPending = r.status === 'En revisión';
                const goal = Number(r.goal) || Number(r.amount) || 0;
                const received = Number(r.received) || 0;
                const progress = goal ? Math.min(100, Math.round((received / goal) * 100)) : 0;

                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: '800', color: 'var(--navy)' }}>#{r.id}</td>
                    <td>
                      <b>{r.description}</b>
                      <small>
                        {r.category}
                        {isAdmin && r.beneficiaryId ? ` · Beneficiario: ${r.beneficiaryId}` : ''}
                      </small>
                    </td>

                    {isAdmin && (
                      <td>
                        <strong>{r.amount} {r.unit}</strong>
                        {isExceeded && (
                          <span className="table-flag table-flag-error">
                            <AlertTriangle className="i i-l" size={14} />Excede límite estándar
                          </span>
                        )}
                      </td>
                    )}

                    <td><MapPin className="i i-l" size={13} />{r.zone}</td>

                    <td>
                      <span className={`table-badge priority-${(r.priority || 'media').toLowerCase()}`}>
                        {r.priority || 'Media'}
                      </span>
                    </td>

                    <td>
                      <span className={`table-badge status-${statusClass(r.status)}`}>{r.status}</span>
                    </td>

                    {!isAdmin && (
                      <td>
                        <strong>{received} / {goal} {r.unit}</strong>
                        <span className="table-progress" aria-hidden="true">
                          <span style={{ width: `${progress}%` }} />
                        </span>
                      </td>
                    )}

                    {isAdmin && (
                      <td style={{ maxWidth: '240px' }}>
                        {r.decisionReason ? (
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>{r.decisionReason}</span>
                            <small style={{ color: 'var(--muted)' }}>Fecha: {r.decisionDate}</small>
                            {r.exceptionGranted && (
                              <span className="table-flag table-flag-warning">
                                <Star className="i i-l" size={14} />Excepción concedida
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Pendiente de evaluación</span>
                        )}
                      </td>
                    )}

                    {isAdmin && (
                      <td>
                        <button
                          type="button"
                          className={isPending ? 'btn primary table-action' : 'btn secondary table-action'}
                          onClick={() => setEvaluatingRequest(r)}
                        >
                          {isPending ? <>Evaluar (RF-08/10)<ArrowRight className="i i-r" size={14} /></> : 'Editar dictamen'}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {role === 'Beneficiario' && (
        <div className="solicitudes-hint">
          <p>¿Necesitás registrar una necesidad nueva? Podés hacerlo desde el formulario de solicitud.</p>
          <Link className="btn secondary" to="/solicitar">Ir a solicitar ayuda<ArrowRight className="i i-r" size={14} /></Link>
        </div>
      )}

      {evaluatingRequest && (
        <RequestEvaluationModal
          isOpen={Boolean(evaluatingRequest)}
          onClose={() => setEvaluatingRequest(null)}
          request={evaluatingRequest}
          allRequests={reqs}
          adminSession={session}
          onSave={handleSaveEvaluation}
        />
      )}
    </div>
  );
}
