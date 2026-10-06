import { useRef, useState } from 'react';
import { FileUp, Download } from 'lucide-react';
import { downloadHistoryTemplate, readProjectionPdf } from '../lib/projectionPdf';

export function ProjectionPdfInput({ value, onChange, onBusyChange, disabled }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const serial = useRef(0);
  const upload = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const request = ++serial.current;
    setBusy(true); onBusyChange?.(true); setError('');
    onChange(null);
    try {
      const rows = await readProjectionPdf(file);
      if (request === serial.current) onChange({ name: file.name, rows });
    } catch (failure) { if (request === serial.current) setError(failure.message || 'No se pudo leer el PDF.'); }
    finally { if (request === serial.current) { setBusy(false); onBusyChange?.(false); } }
  };
  return <div className="proj-panel proj-import">
    <h4><FileUp size={17} aria-hidden="true" /> Historial desde PDF</h4>
    <p>Subí datos con el formato <strong>YYYY-MM-DD | Categoría | Cantidad</strong>. El historial del PDF se usará para el cálculo. Máximo 10 MB y 30 páginas; texto seleccionable.</p>
    <label className="proj-field">Seleccionar PDF<input type="file" accept=".pdf,application/pdf" onChange={upload} disabled={disabled || busy} /></label>
    <button className="btn secondary" type="button" disabled={busy} onClick={() => downloadHistoryTemplate().catch(() => setError('No se pudo descargar la plantilla.'))}><Download size={15} aria-hidden="true" /> Descargar plantilla PDF</button>
    {busy && <p role="status">Leyendo PDF…</p>}
    {value && <><p role="status">{value.name}: {value.rows.length} registros listos. Pulsá Calcular proyección.</p>
      <details><summary>Revisar datos importados</summary><div className="proj-table-wrap"><table className="proj-table"><thead><tr><th>Fecha</th><th>Categoría</th><th>Cantidad</th></tr></thead><tbody>{value.rows.slice(0, 20).map((row, i) => <tr key={i}><td>{row.date}</td><td>{row.category}</td><td>{row.quantity}</td></tr>)}</tbody></table></div>{value.rows.length > 20 && <p>Vista previa de los primeros 20 registros.</p>}</details>
      <button type="button" className="btn secondary" disabled={disabled} onClick={() => { onChange(null); setError(''); }}>Quitar PDF y usar la plataforma</button></>}
    {error && <p className="proj-error" role="alert">{error}</p>}
  </div>;
}
