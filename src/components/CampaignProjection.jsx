import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { api } from '../lib/api';
import { DashboardBarChart } from './DashboardCharts';

export function CampaignProjection({ campaigns = [] }) {
  const [category, setCategory] = useState(campaigns[0]?.category || 'Alimentos sellados');
  const [goal, setGoal] = useState(30);
  const [weeks, setWeeks] = useState(6);
  const [projection, setProjection] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async event => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setProjection(null);
    setError('');
    try {
      const result = await api('/assistant/campaign-projection', {
        method: 'POST',
        body: JSON.stringify({ category: category.trim(), goal: Number(goal), weeks: Number(weeks) })
      });
      setProjection(result);
    } catch (requestError) {
      setError(requestError.message || 'No se pudo generar la proyección.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="dashboard-card dashboard-chart-card" aria-labelledby="campaign-projection-title">
      <div className="dashboard-chart-heading">
        <span className="dashboard-chart-icon"><BarChart3 size={18} /></span>
        <div>
          <h3 id="campaign-projection-title">Proyección de la próxima campaña con IA</h3>
          <p>Estimá aportes para una campaña nueva con los datos disponibles.</p>
        </div>
      </div>
      <form onSubmit={generate} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: '12px' }}>
        <label style={{ display: 'grid', gap: '6px', fontSize: '0.75rem', fontWeight: 700, flex: '1 1 190px' }}>
          Categoría
          <input value={category} onChange={event => setCategory(event.target.value)} maxLength={80} required
            style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
        </label>
        <label style={{ display: 'grid', gap: '6px', fontSize: '0.75rem', fontWeight: 700, flex: '1 1 110px' }}>
          Meta en unidades
          <input type="number" min="1" max="100000" step="1" value={goal} onChange={event => setGoal(event.target.value)} required
            style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
        </label>
        <label style={{ display: 'grid', gap: '6px', fontSize: '0.75rem', fontWeight: 700, flex: '1 1 110px' }}>
          Duración (semanas)
          <input type="number" min="1" max="12" step="1" value={weeks} onChange={event => setWeeks(event.target.value)} required
            style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
        </label>
        <button type="submit" className="btn primary" disabled={loading}>{loading ? 'Calculando…' : 'Generar proyección'}</button>
      </form>
      {loading && <p role="status">La IA está evaluando los datos de campañas.</p>}
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      {projection && (
        <div aria-live="polite" style={{ marginTop: '20px' }}>
          <p style={{ color: '#09274c', fontSize: '0.8125rem' }}>{projection.summary}</p>
          <div className="dashboard-chart-grid">
            <DashboardBarChart
              title="Aportes proyectados por semana"
              subtitle={`Campaña de ${projection.scenario.category} · meta ${projection.scenario.goal} unidades`}
              items={projection.weeklyUnits.map((value, index) => ({ label: `Semana ${index + 1}`, value }))}
              variant="columns"
            />
            <div className="dashboard-card dashboard-chart-card">
              <h3>Resumen del escenario</h3>
              <p>Estimación: <strong>{projection.weeklyUnits.reduce((sum, value) => sum + value, 0)}</strong> de {projection.scenario.goal} unidades en {projection.scenario.weeks} semanas.</p>
              <p>Campañas observadas: {projection.observedCampaigns}.</p>
              {projection.assumptions.length > 0 && <ul>{projection.assumptions.map((item, index) => <li key={index}>{item}</li>)}</ul>}
              <small>Escenario orientativo de un prototipo con datos simulados; no garantiza resultados reales.</small>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
