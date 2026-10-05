import { useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Ban, Check, CheckCircle2, MapPin, X } from 'lucide-react';
import { CATEGORY_LIMITS, checkRequestLimits } from '../constants/limits';
import { useModalAccessibility } from '../lib/useModalAccessibility';

function evaluationReason(decision, exceeded) {
  if (decision === 'Aprobada') {
    return exceeded
      ? 'Aprobada bajo excepción administrativa por vulnerabilidad comprobada.'
      : 'Cumple con los criterios de necesidad y validación de la comunidad.';
  }
  return 'No se ajusta a los criterios de atención prioritaria del programa.';
}

export function RequestEvaluationModal({ isOpen, onClose, request, allRequests = [], adminSession, onSave }) {
  const modalRef = useRef(null);
  const todayStr = new Date().toISOString().slice(0, 10);
  const limitCheck = request
    ? checkRequestLimits(request.category, request.amount, allRequests.filter(r => r.id !== request.id && r.beneficiaryId === request.beneficiaryId))
    : { exceeded: false, reason: '' };
  const isExceeded = request ? (request.limitExceeded || limitCheck.exceeded) : false;

  const initialDecision = request?.status === 'Aprobada' ? 'Aprobada' : request?.status === 'Denegada' ? 'Denegada' : 'Aprobada';
  const [decision, setDecision] = useState(initialDecision);
  const [priority, setPriority] = useState(request?.priority || 'Media');
  const [reason, setReason] = useState(request?.decisionReason || evaluationReason(initialDecision, isExceeded));
  const [decisionDate, setDecisionDate] = useState(request?.decisionDate || todayStr);
  
  // RF-10: Exception fields
  const [grantException, setGrantException] = useState(Boolean(request?.exceptionGranted));
  const [exceptionReason, setExceptionReason] = useState(request?.exceptionReason || '');
  const [authorizedBy, setAuthorizedBy] = useState(request?.exceptionAuthorizedBy || adminSession?.name || 'Administración CR Conecta');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  useModalAccessibility(modalRef, isOpen && Boolean(request), onClose);

  const changeDecision = value => {
    setReason(current => current === evaluationReason(decision, isExceeded) ? evaluationReason(value, isExceeded) : current);
    setDecision(value);
  };

  if (!isOpen || !request) return null;

  const categoryConfig = CATEGORY_LIMITS[request.category];

  // RF-10 block rule: If exceeded and trying to approve, must have granted exception with a non-empty reason
  const isApprovalBlocked = decision === 'Aprobada' && isExceeded && (!grantException || !exceptionReason.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!reason.trim()) {
      setErrorMsg('Debés ingresar el motivo de la decisión.');
      return;
    }

    if (decision === 'Aprobada' && isExceeded && !grantException) {
      setErrorMsg('La solicitud excede los límites configurados. Debés registrar una excepción administrativa para poder aprobarla.');
      return;
    }

    if (grantException && !exceptionReason.trim()) {
      setErrorMsg('Por favor especificá la justificación de la excepción administrativa.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        status: decision,
        priority: priority,
        decisionReason: reason,
        decisionDate: decisionDate,
        limitExceeded: isExceeded,
        exceptionGranted: decision === 'Aprobada' && isExceeded ? true : (request.exceptionGranted || false),
        exceptionReason: decision === 'Aprobada' && isExceeded ? exceptionReason : (request.exceptionReason || null),
        exceptionAuthorizedBy: decision === 'Aprobada' && isExceeded ? authorizedBy : (request.exceptionAuthorizedBy || null),
        exceptionDate: decision === 'Aprobada' && isExceeded ? decisionDate : (request.exceptionDate || null)
      };

      await onSave(request.id, payload);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo guardar la evaluación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-evaluation-title"
        tabIndex={-1}
        className="evaluation-modal" 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)',
          width: 'min(680px, 95vw)',
          borderRadius: '20px',
          boxShadow: '0 25px 70px rgba(6,36,74,0.22)',
          border: '1px solid var(--line)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ background: 'var(--brand-solid)', padding: '20px 28px', color: 'var(--white)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.6875rem', letterSpacing: '1.5px', color: 'var(--brand-eyebrow)', fontWeight: '800' }}>
              EVALUACIÓN ADMINISTRATIVA (RF-08, RF-09, RF-10)
            </span>
            <h3 id="request-evaluation-title" style={{ margin: '3px 0 0', fontSize: '1.25rem', color: '#ffffff' }}>
              Evaluar Solicitud #{request.id}
            </h3>
          </div>
          <span style={{ background: 'var(--brand-chip)', color: 'var(--brand-chip-fg)', padding: '5px 12px', borderRadius: '14px', fontSize: '0.75rem', fontWeight: '700' }}>
            Estado actual: {request.status}
          </span>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Summary Box */}
          <div style={{ background: 'var(--surface-soft)', padding: '16px 18px', borderRadius: '14px', border: '1px solid var(--line-light)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Categoría & Ayuda</span>
              <strong style={{ fontSize: '0.84375rem', color: 'var(--navy)' }}>{request.category}</strong>
              <div style={{ fontSize: '0.78125rem', color: 'var(--muted)', marginTop: '2px' }}>{request.description}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Cantidad solicitada & Zona</span>
              <strong style={{ fontSize: '0.9375rem', color: 'var(--navy)' }}>{request.amount} {request.unit}</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}><MapPin className="i i-l" size={13} />{request.zone} · Fecha: {request.date}</div>
            </div>
          </div>

          {/* RF-10 Limits Comparison Card */}
          <div 
            style={{
              padding: '16px 18px',
              borderRadius: '14px',
              border: isExceeded ? '1.5px solid #f87171' : '1px solid #cbd5e1',
              background: isExceeded ? 'var(--danger-bg)' : 'var(--ok-bg)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.125rem' }}>{isExceeded ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}</span>
                <strong style={{ fontSize: '0.84375rem', color: isExceeded ? 'var(--danger-fg)' : 'var(--ok-fg)' }}>
                  {isExceeded ? 'Control de límites: EXCESO DETECTADO (RF-10)' : 'Control de límites: DENTRO DE LOS PARÁMETROS'}
                </strong>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', background: isExceeded ? 'var(--danger-bg)' : 'var(--ok-bg)', color: isExceeded ? 'var(--danger-fg)' : 'var(--ok-fg)' }}>
                {isExceeded ? 'Bloqueo activo' : 'Normal'}
              </span>
            </div>

            <p style={{ margin: '0 0 8px', fontSize: '0.75rem', color: isExceeded ? 'var(--danger-fg)' : 'var(--ok-fg)', lineHeight: '1.45' }}>
              {isExceeded 
                ? (request.limitDetails || limitCheck.reason || `La cantidad solicitada (${request.amount} ${request.unit}) supera el límite de ${categoryConfig?.maxPerRequest || 20} ${categoryConfig?.unit || 'unidades'} configurado para esta categoría.`)
                : `La cantidad solicitada (${request.amount} ${request.unit}) respeta el límite estándar de hasta ${categoryConfig?.maxPerRequest || 20} ${categoryConfig?.unit || 'unidades'}.`}
            </p>

            {isExceeded && (
              <div style={{ fontSize: '0.75rem', background: 'var(--white)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', color: 'var(--danger)' }}>
                <strong>Regla de negocio:</strong> La aprobación está <u>bloqueada</u> por defecto hasta que un administrador registre formalmente una excepción con su justificación correspondiente.
              </div>
            )}
          </div>

          {/* Decision and Priority Row (RF-08 & RF-09) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* RF-08 Decision */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', display: 'block', marginBottom: '7px' }}>
                Decisión administrativa (RF-08) *
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => changeDecision('Aprobada')}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: decision === 'Aprobada' ? '2px solid #059669' : '1px solid #cbd5e1',
                    background: decision === 'Aprobada' ? 'var(--ok-bg)' : 'var(--white)',
                    color: decision === 'Aprobada' ? 'var(--success)' : 'var(--muted)',
                    fontWeight: '700',
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  <Check className="i i-l" size={14} />Aprobar
                </button>
                <button
                  type="button"
                  onClick={() => changeDecision('Denegada')}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: decision === 'Denegada' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                    background: decision === 'Denegada' ? 'var(--danger-bg)' : 'var(--white)',
                    color: decision === 'Denegada' ? 'var(--danger-fg)' : 'var(--muted)',
                    fontWeight: '700',
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  <X className="i i-l" size={14} />Denegar
                </button>
              </div>
            </div>

            {/* RF-09 Priority */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', display: 'block', marginBottom: '7px' }}>
                Asignar Prioridad (RF-09) *
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Alta', 'Media', 'Baja'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    style={{
                      flex: 1,
                      padding: '11px 6px',
                      borderRadius: '10px',
                      border: priority === p ? '2px solid #06244a' : '1px solid #cbd5e1',
                      background: priority === p 
                        ? (p === 'Alta' ? 'var(--danger-bg)' : p === 'Media' ? 'var(--warn-bg)' : 'var(--info-bg)')
                        : 'var(--white)',
                      color: priority === p 
                        ? (p === 'Alta' ? 'var(--danger-fg)' : p === 'Media' ? 'var(--warn-fg)' : 'var(--info-fg)')
                        : 'var(--muted)',
                      fontWeight: '800',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RF-10 Administrative Exception Box */}
          {isExceeded && decision === 'Aprobada' && (
            <div style={{ background: 'var(--warn-bg)', border: '1.5px dashed var(--warning)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="grantException"
                  checked={grantException}
                  onChange={e => setGrantException(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                />
                <label htmlFor="grantException" style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--warn-fg)', cursor: 'pointer' }}>
                  Registrar excepción administrativa y desbloquear aprobación
                </label>
              </div>

              {grantException && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px', paddingLeft: '28px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--warn-fg)', display: 'block', marginBottom: '4px' }}>
                      Justificación formal de la excepción *
                    </label>
                    <textarea
                      required={grantException}
                      value={exceptionReason}
                      onChange={e => setExceptionReason(e.target.value)}
                      placeholder="Ejemplo: Caso de familia extendida con 7 personas y pérdida total por emergencia en Barranca."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #d97706',
                        fontSize: '0.75rem',
                        background: 'var(--white)',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--warn-fg)', display: 'block', marginBottom: '4px' }}>
                      Administrador que autoriza la excepción *
                    </label>
                    <input
                      type="text"
                      required={grantException}
                      value={authorizedBy}
                      onChange={e => setAuthorizedBy(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #d97706',
                        fontSize: '0.75rem',
                        background: 'var(--white)',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Decision Reason & Date (RF-08) */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                Motivo de la decisión (RF-08) *
              </label>
              <textarea
                required
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ingresá los argumentos o criterios que sustentan esta resolución..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '9px',
                  border: '1px solid var(--line)',
                  fontSize: '0.78125rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                Fecha de la decisión *
              </label>
              <input
                type="date"
                required
                value={decisionDate}
                onChange={e => setDecisionDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: '9px',
                  border: '1px solid var(--line)',
                  fontSize: '0.78125rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Error notice if blocked */}
          {isApprovalBlocked && (
            <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--line)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.75rem' }}>
              <Ban className="i i-l" size={14} /><strong>Aprobación bloqueada:</strong> Esta solicitud supera el límite permitido. Marcá "Registrar excepción administrativa" y detallá la justificación para proceder.
            </div>
          )}

          {errorMsg && (
            <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--line)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.75rem' }}>
              {errorMsg}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--line-light)' }}>
            <button
              type="button"
              className="btn secondary"
              onClick={onClose}
              style={{ padding: '11px 20px', fontSize: '0.8125rem' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={submitting || isApprovalBlocked}
              style={{
                padding: '11px 26px',
                fontSize: '0.8125rem',
                background: isApprovalBlocked ? 'var(--muted)' : 'var(--brand-solid)',
                cursor: isApprovalBlocked ? 'not-allowed' : 'pointer',
                opacity: isApprovalBlocked ? 0.7 : 1
              }}
            >
              {submitting ? 'Guardando…' : <>{`Guardar resolución (${decision})`}<ArrowRight className="i i-r" size={14} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
