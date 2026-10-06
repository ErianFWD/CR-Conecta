import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { downloadProjectionPdf } from '../lib/projectionPdf';

const labels = { en_curso: 'En curso', cumplida: 'Meta cumplida', fallida: 'Meta no cumplida' };
export function ProjectionHistory() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState('');
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const load = async () => {
      try { const result = await api('/projections', { signal: controller.signal }); if (active) { setRows(result); setError(''); } }
      catch (failure) { if (active) setError(failure.message || 'No se pudo cargar el seguimiento.'); }
    };
    load();
    const timer = setInterval(load, 15000);
    window.addEventListener('cr:projections-updated', load);
    return () => { active = false; controller.abort(); clearInterval(timer); window.removeEventListener('cr:projections-updated', load); };
  }, []);
  const download = async record => {
    setDownloading(record.id);
    try { await downloadProjectionPdf(record.snapshot, record); }
    catch { setError('No se pudo descargar el informe. Intentá nuevamente.'); }
    finally { setDownloading(''); }
  };
  return <section className="proj-panel proj-history" aria-label="Seguimiento de proyecciones">
    <h4>Seguimiento de metas guardadas</h4>
    <p>Se cuentan nuevas donaciones de la categoría durante el plazo. Para empresas, únicamente sus aportes. Los datos importados sirven para estimar, no se suman al avance real.</p>
    {error && <p className="proj-error" role="alert">{error}</p>}
    {!rows.length && !error && <p>Aún no hay metas guardadas. Activá el seguimiento al calcular una proyección.</p>}
    {rows.length > 0 && <div className="proj-table-wrap"><table className="proj-table"><thead><tr><th>Categoría</th><th>Avance real</th><th>Cierre</th><th>Estado</th><th>Informe</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.id}><td>{row.scenario.category}</td><td>{row.actual} / {row.scenario.goal}</td><td>{new Date(row.endsAt).toLocaleString('es-CR')}</td><td>{labels[row.status]}</td><td><button className="btn secondary" disabled={Boolean(downloading)} onClick={() => download(row)}>{downloading === row.id ? 'Preparando…' : 'Descargar PDF'}</button></td></tr>)}</tbody></table></div>}
  </section>;
}
