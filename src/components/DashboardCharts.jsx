import { BarChart3 } from 'lucide-react';

const chartColors = ['#257a9e', '#5a62bb', '#198c9b', '#4678a8', '#8b5fbd', '#4d879a'];

function safeChartItems(items) {
  return items.map(item => ({
    label: String(item.label || 'Sin clasificar'),
    value: Number.isFinite(Number(item.value)) ? Math.max(0, Number(item.value)) : 0
  }));
}

export function DashboardBarChart({ title, subtitle, items, variant = 'bars', emptyLabel = 'Aún no hay datos para mostrar.' }) {
  const rows = safeChartItems(items);
  const maximum = Math.max(1, ...rows.map(item => item.value));
  const total = rows.reduce((sum, item) => sum + item.value, 0);
  const columns = variant === 'columns';
  return (
    <section className="dashboard-card dashboard-chart-card" aria-label={title}>
      <div className="dashboard-chart-heading">
        <span className="dashboard-chart-icon" aria-hidden="true"><BarChart3 size={18} /></span>
        <div><h3>{title}</h3><p>{subtitle}</p></div>
        {rows.length > 0 && <span className="dashboard-chart-total"><strong>{total.toLocaleString('es-CR')}</strong><small>registros</small></span>}
      </div>
      {rows.length > 0 ? (
        <>
          <div className={`dashboard-bars ${columns ? 'dashboard-bars-columns' : ''}`} role="list" aria-label={`Distribución de ${title.toLowerCase()}`}>
            {rows.map((item, index) => {
              const percentage = total ? Math.round(item.value / total * 100) : 0;
              const color = chartColors[index % chartColors.length];
              return <div className="dashboard-bar-row" key={`${item.label}-${index}`} role="listitem"
                aria-label={`${item.label}: ${item.value} registros, ${percentage} por ciento`} style={{ '--bar-color': color }}>
                {columns ? <>
                  <strong className="dashboard-column-value">{item.value.toLocaleString('es-CR')}</strong>
                  <div className="dashboard-column-track" aria-hidden="true"><span style={{ height: `${item.value ? Math.max(5, item.value / maximum * 100) : 0}%` }} /></div>
                  <div className="dashboard-column-label"><strong title={item.label}>{item.label}</strong><small>{percentage} % del total</small></div>
                </> : <>
                  <div className="dashboard-bar-label"><span><i aria-hidden="true" />{item.label}</span><strong>{item.value.toLocaleString('es-CR')} <small>{percentage} %</small></strong></div>
                  <div className="dashboard-bar-track" aria-hidden="true"><span style={{ width: `${item.value ? Math.max(3, item.value / maximum * 100) : 0}%` }} /></div>
                </>}
              </div>;
            })}
          </div>
          {columns
            ? <p className="dashboard-chart-footnote">Escala máxima: {maximum.toLocaleString('es-CR')} registros</p>
            : <div className="dashboard-chart-axis" aria-hidden="true"><span>0</span><span>{Math.round(maximum / 2).toLocaleString('es-CR')}</span><span>{maximum.toLocaleString('es-CR')}</span></div>}
        </>
      ) : <p className="dashboard-empty-note">{emptyLabel}</p>}
    </section>
  );
}

export function DashboardMetric({ icon: Icon, label, value, detail, tone = 'blue' }) {
  return (
    <div className={`dashboard-metric-card tone-${tone}`}>
      <span className="dashboard-metric-icon" aria-hidden="true"><Icon size={19} /></span>
      <div className="dashboard-metric-content">
        <span className="dashboard-metric-label">{label}</span>
        <strong>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>
    </div>
  );
}

export function dashboardCounts(items, getLabel, limit = 5) {
  const counts = items.reduce((result, item) => {
    const label = getLabel(item) || 'Sin clasificar';
    result.set(label, (result.get(label) || 0) + 1);
    return result;
  }, new Map());
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}
