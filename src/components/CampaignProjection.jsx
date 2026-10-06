import { ProjectionPdfInput } from './ProjectionPdfInput';
import { ProjectionHistory } from './ProjectionHistory';
import { downloadProjectionPdf } from '../lib/projectionPdf';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { BarChart3, CalendarClock, CircleCheck, Download, Info, Lightbulb, Sparkles, Target, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react';
import { api } from '../lib/api';
import { DashboardMetric } from './DashboardCharts';

const DEFAULT_SCENARIO = { category: 'Alimentos sellados', goal: 30, weeks: 6 };

function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function shortDate(iso) {
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' });
}

function scenarioFromCampaign(campaign) {
  if (!campaign) return DEFAULT_SCENARIO;
  const end = new Date(`${campaign.end}T12:00:00`);
  const remainingWeeks = Number.isNaN(end.getTime()) ? 6 : Math.ceil((end.getTime() - Date.now()) / (7 * 86400000));
  return {
    category: String(campaign.category || DEFAULT_SCENARIO.category),
    goal: Math.max(1, Math.round(Number(campaign.goal)) || DEFAULT_SCENARIO.goal),
    weeks: Math.min(52, Math.max(1, remainingWeeks || 6))
  };
}

function niceScale(maximum) {
  const rough = Math.max(maximum, 1) / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].find(candidate => candidate * power >= rough) * power;
  return { step, max: step * 4 };
}

function ProjectionChart({ projection, view }) {
  const { forecast, scenario, history } = projection;
  const rangeGradientId = useId();
  const width = 640;
  const height = 270;
  const margin = { top: 20, right: 20, bottom: 36, left: 46 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const cumulative = view === 'acumulado';

  let content;
  let description;
  if (cumulative) {
    const points = [{ x: 0, base: 0, low: 0, high: 0 }, ...forecast.weeks.map((week, index) => ({ x: index + 1, base: week.cumulativeBase, low: week.cumulativeLow, high: week.cumulativeHigh }))];
    const { step, max } = niceScale(Math.max(scenario.goal, ...points.map(point => point.high)) * 1.05);
    const sx = value => margin.left + (value / scenario.weeks) * innerWidth;
    const sy = value => margin.top + innerHeight - (value / max) * innerHeight;
    const band = `${points.map((point, index) => `${index ? 'L' : 'M'}${sx(point.x)},${sy(point.high)}`).join(' ')} ${[...points].reverse().map(point => `L${sx(point.x)},${sy(point.low)}`).join(' ')} Z`;
    const line = points.map((point, index) => `${index ? 'L' : 'M'}${sx(point.x)},${sy(point.base)}`).join(' ');
    const last = points.at(-1);
    const labelEvery = Math.max(1, Math.ceil(scenario.weeks / 8));
    description = `Proyección acumulada: ${forecast.totals.base} unidades en ${scenario.weeks} semanas frente a una meta de ${scenario.goal}, con rango de ${forecast.totals.low} a ${forecast.totals.high}.`;
    content = (
      <>
        {[0, 1, 2, 3, 4].map(tick => (
          <g key={tick}>
            <line className="proj-grid" x1={margin.left} x2={width - margin.right} y1={sy(tick * step)} y2={sy(tick * step)} />
            <text className="proj-axis" x={margin.left - 8} y={sy(tick * step) + 4} textAnchor="end">{tick * step}</text>
          </g>
        ))}
        <defs><linearGradient id={rangeGradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.26" /><stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.05" /></linearGradient></defs>
        <path className="proj-band" d={band} fill={`url(#${rangeGradientId})`} />
        <line className="proj-goal" x1={margin.left} x2={width - margin.right} y1={sy(scenario.goal)} y2={sy(scenario.goal)} />
        <text className="proj-goal-label" x={margin.left + 6} y={sy(scenario.goal) - 6}>Meta {scenario.goal}</text>
        <path className="proj-line" d={line} />
        {points.map(point => <circle key={point.x} className="proj-dot" cx={sx(point.x)} cy={sy(point.base)} r="3.5" />)}
        <text className="proj-value" x={sx(last.x) - 6} y={sy(last.base) - 10} textAnchor="end">{last.base}</text>
        {points.filter(point => point.x === 0 || point.x === scenario.weeks || point.x % labelEvery === 0).map(point => (
          <text key={`x${point.x}`} className="proj-axis" x={sx(point.x)} y={height - 12} textAnchor="middle">{point.x === 0 ? 'Hoy' : `S${point.x}`}</text>
        ))}
      </>
    );
  } else {
    const past = history.slice(-6);
    const items = [
      ...past.map(week => ({ kind: 'hist', label: shortDate(week.start), value: week.units })),
      ...forecast.weeks.map(week => ({ kind: 'proj', label: `S${week.week}`, value: week.base, low: week.low, high: week.high }))
    ];
    const { step, max } = niceScale(Math.max(forecast.requiredWeekly, ...items.map(item => item.high ?? item.value)) * 1.1);
    const band = innerWidth / items.length;
    const barWidth = Math.min(34, band * 0.6);
    const sy = value => margin.top + innerHeight - (value / max) * innerHeight;
    const cx = index => margin.left + band * index + band / 2;
    const thin = Math.max(1, Math.ceil(items.length / 9));
    description = `Aportes semanales: ${past.length} semanas de historial y ${scenario.weeks} semanas proyectadas, con ${forecast.weeklyRate} unidades por semana de ritmo estimado.`;
    content = (
      <>
        {[0, 1, 2, 3, 4].map(tick => (
          <g key={tick}>
            <line className="proj-grid" x1={margin.left} x2={width - margin.right} y1={sy(tick * step)} y2={sy(tick * step)} />
            <text className="proj-axis" x={margin.left - 8} y={sy(tick * step) + 4} textAnchor="end">{tick * step}</text>
          </g>
        ))}
        {past.length > 0 && (
          <>
            <line className="proj-divider" x1={margin.left + band * past.length} x2={margin.left + band * past.length} y1={margin.top} y2={margin.top + innerHeight} />
            <text className="proj-axis" x={margin.left + band * past.length - 6} y={margin.top + 10} textAnchor="end">Historial</text>
            <text className="proj-axis" x={margin.left + band * past.length + 6} y={margin.top + 10}>Proyección</text>
          </>
        )}
        <line className="proj-goal" x1={margin.left} x2={width - margin.right} y1={sy(forecast.requiredWeekly)} y2={sy(forecast.requiredWeekly)} />
        <text className="proj-goal-label" x={width - margin.right} y={sy(forecast.requiredWeekly) - 6} textAnchor="end">Necesario {forecast.requiredWeekly}/sem</text>
        {items.map((item, index) => (
          <g key={`${item.kind}${index}`}>
            <rect className={item.kind === 'hist' ? 'proj-bar-hist' : 'proj-bar-proj'} x={cx(index) - barWidth / 2} y={sy(item.value)} width={barWidth} height={Math.max(0, margin.top + innerHeight - sy(item.value))} rx="4" />
            {item.kind === 'proj' && (
              <g className="proj-whisker">
                <line x1={cx(index)} x2={cx(index)} y1={sy(item.low)} y2={sy(item.high)} />
                <line x1={cx(index) - 5} x2={cx(index) + 5} y1={sy(item.high)} y2={sy(item.high)} />
                <line x1={cx(index) - 5} x2={cx(index) + 5} y1={sy(item.low)} y2={sy(item.low)} />
              </g>
            )}
            {items.length <= 12 && <text className="proj-value" x={cx(index)} y={sy(item.high ?? item.value) - 6} textAnchor="middle">{item.value}</text>}
            {index % thin === 0 && <text className="proj-axis" x={cx(index)} y={height - 12} textAnchor="middle">{item.label}</text>}
          </g>
        ))}
      </>
    );
  }

  return (
    <div className="proj-chart-scroll">
      <svg className="proj-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={description}>{content}</svg>
      <div className="proj-chart-legend" aria-hidden="true">
        <span><i className="proj-legend-estimate" /> Aportes estimados</span>
        <span><i className="proj-legend-range" /> Rango orientativo</span>
        <span><i className="proj-legend-goal" /> Meta</span>
      </div>
    </div>
  );
}

function InsightIcon({ level }) {
  if (level === 'warn') return <TriangleAlert size={16} aria-hidden="true" />;
  if (level === 'ok') return <CircleCheck size={16} aria-hidden="true" />;
  return <Info size={16} aria-hidden="true" />;
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(projection) {
  const { scenario, forecast } = projection;
  const rows = [
    ['Proyección CR Conecta'],
    ['Categoría', scenario.category],
    ['Meta (unidades)', scenario.goal],
    ['Duración (semanas)', scenario.weeks],
    ['Ritmo estimado (u/sem)', forecast.weeklyRate],
    ['Confianza de los datos', projection.confidence.level],
    ['Generado', projection.generatedAt],
    [],
    ['Semana', 'Base', 'Mínimo', 'Máximo', 'Acumulado base', 'Acumulado mínimo', 'Acumulado máximo'],
    ...forecast.weeks.map(week => [week.week, week.base, week.low, week.high, week.cumulativeBase, week.cumulativeLow, week.cumulativeHigh]),
    [],
    ['Aviso', 'Escenario orientativo basado en datos del prototipo; no garantiza resultados reales.']
  ];
  const blob = new Blob([`\ufeff${rows.map(row => row.map(csvCell).join(';')).join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `proyeccion-${scenario.category.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'categoria'}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function CampaignProjection({ campaigns = [] }) {
  const seedCampaign = campaigns.find(campaign => campaign.status === 'Activa') || campaigns[0];
  const seedKey = seedCampaign?.id ?? 'none';
  const [scenario, setScenario] = useState(() => scenarioFromCampaign(seedCampaign));
  const [importBusy, setImportBusy] = useState(false);
  const [imported, setImported] = useState(null);
  const [track, setTrack] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [projection, setProjection] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('acumulado');
  const touched = useRef(false);
  const latestRequest = useRef(0);

  const run = useCallback(async (nextScenario, withAI, history = null, save = false) => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;
    setLoading(true);
    setError('');
    try {
      const result = await api('/assistant/campaign-projection', {
        method: 'POST',
        body: JSON.stringify({ category: String(nextScenario.category).trim(), goal: Number(nextScenario.goal), weeks: Number(nextScenario.weeks), useAI: withAI, importedHistory: history, track: save })
      });
      if (latestRequest.current === requestId) { setProjection(result); if (result.trackingId) window.dispatchEvent(new Event('cr:projections-updated')); }
    } catch (requestError) {
      if (latestRequest.current === requestId) setError(requestError.message || 'No se pudo generar la proyección.');
    } finally {
      if (latestRequest.current === requestId) setLoading(false);
    }
  }, []);

  // Al abrir el panel (y cuando llegan las campañas) se calcula de inmediato con los datos de la plataforma, sin IA.
  useEffect(() => {
    if (touched.current) return;
    const initial = scenarioFromCampaign(campaigns.find(campaign => campaign.status === 'Activa') || campaigns[0]);
    setScenario(initial);
    run(initial, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey, run]);

  const update = field => event => {
    touched.current = true;
    setScenario(current => ({ ...current, [field]: event.target.value }));
  };

  const submit = event => {
    event.preventDefault();
    if (loading || importBusy) return;
    touched.current = true;
    run(scenario, useAI, imported?.rows, track);
  };

  const loadCampaignScenario = campaign => {
    touched.current = true;
    const next = scenarioFromCampaign(campaign);
    setScenario(next);
    run(next, useAI, imported?.rows, track);
  };

  const categories = useMemo(() => {
    const names = new Set([...campaigns.map(campaign => campaign.category), ...(projection?.outlook || []).map(item => item.category)]);
    return [...names].filter(Boolean);
  }, [campaigns, projection]);

  const forecast = projection?.forecast;
  const goalTone = !forecast ? 'blue' : forecast.goalCoverage.base >= 100 ? 'green' : forecast.goalCoverage.base >= 60 ? 'amber' : 'red';

  return (
    <section className="dashboard-card proj" aria-labelledby="campaign-projection-title" aria-busy={loading}>
      <div className="proj-header">
        <span className="dashboard-chart-icon"><BarChart3 size={18} /></span>
        <div>
          <h3 id="campaign-projection-title">Proyección de campañas y cobertura</h3>
          <p>Escenarios ajustables de hasta 52 semanas, calculados con donaciones, solicitudes, inventario y campañas registradas. La IA puede redactar el análisis.</p>
        </div>
        {projection && (
          <div className="proj-badges">
            <span className={`proj-badge proj-conf-${projection.confidence.level.toLowerCase().replace(' ', '-')}`} title={projection.confidence.reasons.join(' ')}>Confianza {projection.confidence.level.toLowerCase()}</span>
            <span className="proj-badge">{projection.scope === 'admin' ? 'Vista de administración' : 'Vista de empresa'}</span>
          </div>
        )}
      </div>

      <ProjectionPdfInput value={imported} onChange={setImported} onBusyChange={setImportBusy} disabled={loading || importBusy} />

      <form className="proj-form" onSubmit={submit}>
        <label className="proj-field proj-field-wide">
          Categoría
          <input list="projection-categories" value={scenario.category} onChange={update('category')} maxLength={80} required />
          <datalist id="projection-categories">{categories.map(name => <option key={name} value={name} />)}</datalist>
        </label>
        <label className="proj-field">
          Meta (unidades)
          <input type="number" min="1" max="1000000000" step="1" value={scenario.goal} onChange={update('goal')} required />
        </label>
        <label className="proj-field">
          Duración (semanas)
          <input type="number" min="1" max="52" step="1" value={scenario.weeks} onChange={update('weeks')} required />
        </label>
        <button type="submit" className="btn primary" disabled={loading || importBusy}>{importBusy ? 'Leyendo PDF…' : loading ? 'Calculando…' : 'Calcular proyección'}</button>
        <label className="proj-check">
          <input type="checkbox" checked={useAI} onChange={event => setUseAI(event.target.checked)} />
          Redactar la interpretación con IA
        </label>
        <label className="proj-check"><input type="checkbox" checked={track} onChange={event => setTrack(event.target.checked)} />Guardar y seguir esta meta desde ahora</label>
        <p className="proj-note">El seguimiento mide donaciones nuevas durante el plazo elegido. Un aviso verde confirma la meta; uno rojo indica que el plazo terminó sin alcanzarla.</p>
      </form>

      {campaigns.length > 0 && (
        <div className="proj-chips" aria-label="Usar los datos de una campaña existente">
          <span>Partir de una campaña:</span>
          {campaigns.slice(0, 4).map(campaign => (
            <button type="button" className="proj-chip" key={campaign.id} onClick={() => loadCampaignScenario(campaign)} disabled={loading || importBusy}>
              {campaign.name}
            </button>
          ))}
        </div>
      )}

      {error && <p role="alert" className="proj-error">{error}</p>}

      {!projection && !error && <p role="status" className="dashboard-empty-note">Calculando la proyección con los datos disponibles…</p>}

      {projection && forecast && (
        <div className={`proj-body ${loading ? 'is-loading' : ''}`} aria-live="polite">
          <p className="proj-note">Fuente del cálculo: {projection.dataSource === 'pdf' ? `PDF (${projection.importedRows} registros)` : 'Plataforma'}. {projection.trackingId ? 'Meta guardada para seguimiento.' : 'Vista previa sin seguimiento.'}</p>
          <div className="dashboard-kpis proj-kpis">
            <DashboardMetric icon={Target} label="Ritmo semanal estimado" value={forecast.weeklyRate} detail={`Necesario: ${forecast.requiredWeekly} por semana`} tone={forecast.requiredWeekly > forecast.weeklyRate * 1.25 ? 'amber' : 'green'} />
            <DashboardMetric icon={forecast.trend === 'Decreciente' ? TrendingDown : TrendingUp} label="Proyección base" value={forecast.totals.base} detail={`${forecast.goalCoverage.base} % de la meta de ${projection.scenario.goal}`} tone={goalTone} />
            <DashboardMetric icon={BarChart3} label="Rango orientativo" value={`${forecast.totals.low}–${forecast.totals.high}`} detail={forecast.probability !== null ? `Probabilidad de meta ≈ ${forecast.probability} %` : 'Probabilidad no estimable'} tone="blue" />
            <DashboardMetric icon={CalendarClock} label="Meta alcanzada hacia" value={forecast.completionDate ? formatDate(forecast.completionDate) : '—'} detail={forecast.weeksToGoal ? `${forecast.weeksToGoal} semanas al ritmo actual` : 'Sin ritmo registrado'} tone="blue" />
          </div>

          <div className="proj-grid-2">
            <div className="proj-panel">
              <div className="proj-panel-head">
                <div>
                  <h4>{projection.scenario.category}: aportes proyectados</h4>
                  <small>Tendencia: {forecast.trend.toLowerCase()} · sombreado y barras de error: rango orientativo (~80 %)</small>
                </div>
                <div className="proj-toggle" role="group" aria-label="Tipo de gráfico">
                  <button type="button" className={view === 'acumulado' ? 'active' : ''} aria-pressed={view === 'acumulado'} onClick={() => setView('acumulado')}>Acumulado</button>
                  <button type="button" className={view === 'semanal' ? 'active' : ''} aria-pressed={view === 'semanal'} onClick={() => setView('semanal')}>Semanal</button>
                </div>
              </div>
              <ProjectionChart projection={projection} view={view} />
              <details className="proj-details">
                <summary>Ver tabla de datos</summary>
                <div className="proj-table-wrap">
                  <table className="proj-table">
                    <thead><tr><th>Semana</th><th>Base</th><th>Rango</th><th>Acumulado</th><th>Rango acumulado</th></tr></thead>
                    <tbody>
                      {forecast.weeks.map(week => (
                        <tr key={week.week}>
                          <td>S{week.week}</td><td>{week.base}</td><td>{week.low}–{week.high}</td><td>{week.cumulativeBase}</td><td>{week.cumulativeLow}–{week.cumulativeHigh}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>

            <div className="proj-panel">
              <h4>Lecturas del escenario</h4>
              <ul className="proj-insights">
                {projection.insights.map((item, index) => (
                  <li key={index} className={`proj-insight proj-${item.level}`}><InsightIcon level={item.level} /><span>{item.text}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="proj-grid-2">
            <div className="proj-panel">
              <h4>Demanda y existencias</h4>
              <dl className="proj-stats">
                <div><dt>Unidades pendientes</dt><dd>{projection.demand.pendingUnits}</dd></div>
                <div><dt>Solicitudes abiertas</dt><dd>{projection.demand.openRequests}</dd></div>
                <div><dt>Prioridad alta</dt><dd>{projection.demand.highPriority}</dd></div>
                <div><dt>En revisión (unidades)</dt><dd>{projection.demand.inReviewUnits}</dd></div>
                {projection.stock && <div><dt>Existencias libres</dt><dd>{projection.stock.free}</dd></div>}
                {projection.stock && <div><dt>Productos en o bajo mínimo</dt><dd>{projection.stock.belowMinimum}</dd></div>}
                <div><dt>Cobertura de la demanda</dt><dd>{projection.coverage === null ? '—' : projection.coverage >= 300 ? '> 300 %' : `${projection.coverage} %`}</dd></div>
              </dl>
              <small className="proj-note">{projection.stock ? 'Cobertura = (existencias libres + aportes proyectados) ÷ unidades pendientes.' : 'Cobertura = aportes proyectados de tu cuenta ÷ unidades pendientes.'}</small>
            </div>

            <div className="proj-panel">
              <h4>Campañas de la categoría</h4>
              {projection.campaigns.length ? (
                <ul className="proj-campaigns">
                  {projection.campaigns.map((campaign, index) => (
                    <li key={index}>
                      <div className="proj-campaign-head">
                        <strong>{campaign.name}</strong>
                        <span className={`proj-badge proj-sched-${campaign.schedule.toLowerCase().replace(/\s+/g, '-')}`}>{campaign.schedule}</span>
                      </div>
                      <div className="proj-progress" role="img" aria-label={`${campaign.pctDone} % de avance${campaign.expectedPct !== null ? `, ${campaign.expectedPct} % esperado por calendario` : ''}`}>
                        <span style={{ width: `${Math.min(100, campaign.pctDone)}%` }} />
                        {campaign.expectedPct !== null && <i style={{ left: `${Math.min(100, campaign.expectedPct)}%` }} />}
                      </div>
                      <small>{campaign.progress} de {campaign.goal} {campaign.unit}{campaign.projectedPct !== null ? ` · al cierre ≈ ${campaign.projectedPct} % de la meta` : ''}</small>
                    </li>
                  ))}
                </ul>
              ) : <p className="dashboard-empty-note">No hay campañas registradas en esta categoría.</p>}
            </div>
          </div>

          {projection.outlook.length > 0 && (
            <div className="proj-panel">
              <h4>Panorama por categoría ({projection.scenario.weeks} {projection.scenario.weeks === 1 ? 'semana' : 'semanas'})</h4>
              <div className="proj-table-wrap">
                <table className="proj-table">
                  <thead>
                    <tr><th>Categoría</th><th>Ritmo (u/sem)</th><th>Aportes proyectados</th>{projection.scope === 'admin' && <th>Existencias libres</th>}<th>Demanda pendiente</th><th>Faltante</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {projection.outlook.map(item => (
                      <tr key={item.category}>
                        <td>{item.category}</td><td>{item.weeklyRate}</td><td>{item.projectedInflow}</td>
                        {projection.scope === 'admin' && <td>{item.freeStock ?? 0}</td>}
                        <td>{item.pendingDemand}</td><td>{item.shortfall}</td>
                        <td><span className={`proj-badge proj-state-${item.status.toLowerCase().replace(/\s+/g, '-').replace('é', 'e')}`}>{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="proj-panel proj-narrative">
            <div className="proj-panel-head">
              <h4><Sparkles size={15} aria-hidden="true" /> Interpretación</h4>
              <span className="proj-badge">{projection.narrative.source === 'ia' ? 'Redactada con IA' : 'Automática'}</span>
            </div>
            <p>{projection.narrative.summary}</p>
            {projection.narrative.recommendations.length > 0 && (
              <ul className="proj-recommendations">
                {projection.narrative.recommendations.map((item, index) => <li key={index}><Lightbulb size={15} aria-hidden="true" /><span>{item}</span></li>)}
              </ul>
            )}
          </div>

          <div className="proj-footer">
            <details className="proj-details">
              <summary>Metodología y supuestos</summary>
              <ul>
                {projection.assumptions.map((item, index) => <li key={index}>{item}</li>)}
                <li>Las proyecciones suponen que los aportes futuros se parecerán a los recientes; campañas especiales, feriados o cambios de difusión pueden alterar el resultado.</li>
                <li>La probabilidad y el rango usan una aproximación normal; con pocas semanas de historial son orientativos.</li>
              </ul>
            </details>
            <button type="button" className="btn primary" disabled={pdfBusy || loading} onClick={async () => {
              setPdfBusy(true);
              try { await downloadProjectionPdf(projection); }
              catch { setError('No se pudo generar el PDF. Intentá nuevamente.'); }
              finally { setPdfBusy(false); }
            }}><Download size={15} aria-hidden="true" />{pdfBusy ? 'Preparando PDF…' : 'Descargar PDF'}</button>
            <button type="button" className="btn secondary" onClick={() => downloadCsv(projection)}><Download size={15} aria-hidden="true" /> Descargar CSV</button>
          </div>
          <small className="proj-note">Escenario orientativo de un prototipo con datos simulados; no garantiza resultados reales. Generado el {new Date(projection.generatedAt).toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })}.</small>
        </div>
      )}
      <ProjectionHistory />
    </section>
  );
}
