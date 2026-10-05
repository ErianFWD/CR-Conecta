import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { setConfirmationHandler } from '../services/confirmation';

export function ConfirmationDialog() {
  const [prompt, setPrompt] = useState(null);
  const resolver = useRef(null);
  const dialog = useRef(null);
  const finish = useCallback(accepted => {
    dialog.current?.close();
    resolver.current?.(accepted);
    resolver.current = null;
    setPrompt(null);
  }, []);
  useEffect(() => {
    setConfirmationHandler(details => new Promise(resolve => {
      if (resolver.current) { resolve(false); return; }
      resolver.current = resolve;
      setPrompt(details);
    }));
    return () => { setConfirmationHandler(null); resolver.current?.(false); };
  }, []);
  useEffect(() => {
    if (prompt && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [prompt]);
  return createPortal(
    <dialog ref={dialog} className="confirmation-dialog" aria-labelledby="confirmation-title"
      aria-describedby="confirmation-description" onCancel={event => { event.preventDefault(); finish(false); }}>
      {prompt && <>
        <span className="confirmation-icon"><AlertTriangle aria-hidden="true" /></span>
        <h2 id="confirmation-title">{prompt.title}</h2>
        <p id="confirmation-description">{prompt.text}</p>
        <div className="confirmation-actions">
          <button type="button" className="btn secondary" onClick={() => finish(false)} autoFocus>Cancelar</button>
          <button type="button" className={`btn primary${prompt.danger ? ' confirm-danger' : ''}`} onClick={() => finish(true)}>Aceptar</button>
        </div>
      </>}
    </dialog>, document.body
  );
}
