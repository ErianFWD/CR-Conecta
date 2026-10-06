import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CircleCheck, CircleX } from 'lucide-react';

export function ProjectionResultModal({ record, onClose, error = '', busy = false }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    if (record && element && !element.open) element.showModal();
    return () => { element?.close(); if (previous?.isConnected) previous.focus(); };
  }, [record]);
  if (!record) return null;
  const success = record.status === 'cumplida';
  const Icon = success ? CircleCheck : CircleX;
  return createPortal(<dialog ref={dialog} className={`confirmation-dialog projection-result ${success ? 'projection-success' : 'projection-failure'}`}
    aria-labelledby="projection-result-title" aria-describedby="projection-result-description"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <Icon className="projection-result-icon" size={60} strokeWidth={2} aria-hidden="true" />
    <h2 id="projection-result-title">{success ? '¡Se cumplió la meta!' : 'No se cumplió la meta'}</h2>
    <p id="projection-result-description">{success ? 'Las donaciones registradas alcanzaron la meta de tu proyección.' : 'Terminó el plazo de tu proyección sin alcanzar la meta.'}</p>
    <p><strong>{record.scenario.category}</strong></p>
    <p>{record.actual} de {record.scenario.goal} unidades · Cierre: {new Date(record.endsAt).toLocaleString('es-CR')}</p>
    {error && <p role="alert">{error}</p>}
    <button type="button" className="btn primary" onClick={onClose} disabled={busy} autoFocus>{busy ? 'Guardando…' : 'Entendido'}</button>
  </dialog>, document.body);
}
