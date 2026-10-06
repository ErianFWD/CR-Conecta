import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ProjectionResultModal } from './ProjectionResultModal';

// Mounted in the app shell: notifications also arrive while visiting other pages.
export function ProjectionNotifications({ session }) {
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const allowed = ['Administrador', 'Empresa donante'].includes(session?.role);
  useEffect(() => {
    if (!allowed) return undefined;
    let mounted = true;
    const controller = new AbortController();
    const check = async () => {
      try {
        const rows = await api('/projections', { signal: controller.signal });
        const next = rows.find(row => row.status !== 'en_curso' && row.acknowledgedStatus !== row.status);
        if (mounted) setRecord(current => current || next || null);
      } catch { /* Retry on the next poll; the history shows actionable load errors. */ }
    };
    check();
    const timer = setInterval(check, 15000);
    window.addEventListener('focus', check);
    window.addEventListener('cr:projections-updated', check);
    return () => { mounted = false; controller.abort(); clearInterval(timer); window.removeEventListener('focus', check); window.removeEventListener('cr:projections-updated', check); };
  }, [allowed, session?.id, record?.id]);
  const close = useCallback(async () => {
    if (!record || busy) return;
    setBusy(true); setError('');
    try {
      await api(`/projections/${record.id}/acknowledge`, { method: 'POST' });
      setRecord(null);
      window.dispatchEvent(new Event('cr:projections-updated'));
    } catch (failure) { setError(failure.message || 'No se pudo guardar la confirmación. Intentá otra vez.'); }
    finally { setBusy(false); }
  }, [record, busy]);
  return allowed ? <ProjectionResultModal record={record} onClose={close} error={error} busy={busy} /> : null;
}
