import { BarChart3 } from 'lucide-react';

export function DashboardBarChart({ title, subtitle, items, variant = 'bars', emptyLabel = 'Aún no hay datos para mostrar.' }) {
  const maximum = Math.max(1, ...items.map(item => item.value));
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const colors = [
    'linear-gradient(135deg, #05b8a5, #26d7c4)',
    'linear-gradient(135deg, #ff7043, #ffad42)',
    'linear-gradient(135deg, #7256e8, #ad78ff)',
    'linear-gradient(135deg, #1788e8, #45bdff)',
    'linear-gradient(135deg, #e84e91, #ff7fb1)',
    'linear-gradient(135deg, #8bbd22, #c5e94d)'
  ];

  return (
    <section className="dashboard-card dashboard-chart-card">
      <div className="dashboard-chart-heading">
        <span className="dashboard-chart-icon"><BarChart3 size={18} /></span>
        <div><h3>{title}</h3><p>{subtitle}</p></div>
        {items.length > 0 && <span className="dashboard-chart-total"><strong>{total}</strong><small>registros</small></span>}
      </div>
      {items.length ? (
        <div className={`dashboard-bars ${variant === 'columns' ? 'dashboard-bars-columns' : ''}`}>
          {items.map((item, index) => (
            <div className="dashboard-bar-row" key={item.label} style={{ '--bar-delay': `${index * 90}ms` }}>
              {variant === 'columns' ? (
                <>
                  <div className="dashboard-column-value">{item.value}</div>
                  <div className="dashboard-column-track">
                    <span style={{
                      '--bar-height': `${Math.max(item.value > 0 ? 10 : 0, (item.value / maximum) * 100)}%`,
                      '--bar-color': colors[index % colors.length],
                      '--bar-delay': `${index * 90}ms`
                    }} />
                  </div>
                  <div className="dashboard-column-label">
                    <strong>{item.label}</strong>
                    <small>{total ? `${Math.round((item.value / total) * 100)}%` : '0%'}</small>
                  </div>
                </>
              ) : (
                <>
                  <div className="dashboard-bar-label">
                    <span><i style={{ background: colors[index % colors.length] }} />{item.label}</span>
                    <strong>{item.value}<small>{total ? `${Math.round((item.value / total) * 100)}%` : '0%'}</small></strong>
                  </div>
                  <div className="dashboard-bar-track">
                    <span style={{
                      '--bar-width': `${Math.max(item.value > 0 ? 7 : 0, (item.value / maximum) * 100)}%`,
                      '--bar-color': colors[index % colors.length],
                      '--bar-delay': `${index * 90}ms`
                    }} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : <p className="dashboard-empty-note">{emptyLabel}</p>}
    </section>
  );
}

export function DashboardMetric({ icon: Icon, label, value, detail, tone = 'blue' }) {
  return (
    <div className={`dashboard-metric-card tone-${tone}`}>
      <span className="dashboard-metric-icon"><Icon size={19} /></span>
      <span className="dashboard-metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
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
