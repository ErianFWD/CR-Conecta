import { CostaRicaFields } from '../components/CostaRicaFields';
import { profileDetails } from '../services/costaRica';
import { useState } from 'react';
import { AlertTriangle, ArrowRight, Check, ClipboardList, Mail, MapPin, Pencil, Phone, Star } from 'lucide-react';
import { CATEGORY_OPTIONS, checkRequestLimits, getCategoryUnit } from '../constants/limits';
import { api } from '../lib/api';

function localDateInputValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 10);
}

export function BeneficiarySection({ session, onOpenEditProfile, requests = [], onRefreshRequests }) {
  const [category, setCategory] = useState('Alimentos sellados');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState('paquetes');
  const [civic, setCivic] = useState(() => profileDetails(session));
  const [date, setDate] = useState(localDateInputValue);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Filter requests belonging to this beneficiary
  const myRequests = requests.filter(r => r.beneficiaryId === session?.id);

  // Unit auto-adaptation by category
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    setUnit(getCategoryUnit(newCat));
  };

  // RF-10 Real-time limit verification
  const limitCheck = checkRequestLimits(category, amount, myRequests);
  const isLimitExceeded = limitCheck.exceeded;
  const today = localDateInputValue();

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setNotification(null);

    const cleanDescription = description.trim();
    const parsedAmount = Number(amount);

    if (!cleanDescription || cleanDescription.length > 500) {
      setNotification({ type: 'error', text: 'Escribí una descripción clara de hasta 500 caracteres.' });
      setSubmitting(false);
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setNotification({ type: 'error', text: 'La cantidad debe ser mayor que cero.' });
      setSubmitting(false);
      return;
    }
    if (!date || date > today) {
      setNotification({ type: 'error', text: 'Elegí una fecha válida que no sea posterior a hoy.' });
      setSubmitting(false);
      return;
    }

    const newRequest = {
      category,
      description: cleanDescription,
      amount: parsedAmount,
      unit,
      identification: civic.identification,
      location: civic.location,
      zone: civic.location.district || civic.location.canton,
      date,
      status: 'En revisión', // RF-07: asignarle En revisión como estado inicial
      priority: 'Media',     // Default priority pending admin evaluation (RF-09)
      goal: parsedAmount,
      received: 0,
      limitExceeded: isLimitExceeded, // RF-10: Comparación y alerta de exceso
      requiresException: isLimitExceeded,
      limitDetails: isLimitExceeded ? limitCheck.reason : null,
      decisionReason: null,
      decisionDate: null
    };

    try {
      const createdRequest = await api('/requests', {
        method: 'POST',
        body: JSON.stringify(newRequest)
      });

      setNotification({
        type: 'success',
        text: `Solicitud #${createdRequest.id} registrada exitosamente con estado inicial "En revisión". ${isLimitExceeded ? 'Supera el límite estándar; pasará a revisión de excepción administrativa.' : ''}`
      });

      // Reset form
      setDescription('');
      setAmount(1);
      if (onRefreshRequests) onRefreshRequests();
    } catch (error) {
      setNotification({
        type: 'error',
        text: error.message || 'No se pudo guardar la solicitud. Verificá que la API esté activa.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelivery = async (req) => {
    try {
      await api(`/requests/${req.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          deliveryConfirmed: true,
          deliveryConfirmationDate: localDateInputValue()
        })
      });
      setNotification({
        type: 'success',
        text: `¡Entrega de la solicitud #${req.id} confirmada con éxito por la persona beneficiaria!`
      });
      if (onRefreshRequests) onRefreshRequests();
    } catch (error) {
      setNotification({ type: 'error', text: error.message || 'Error al confirmar la entrega' });
    }
  };

  return (
    <div className="beneficiary-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* RF-05 Beneficiary Profile Card */}
      <div
        style={{
          background: 'var(--white)',
          borderRadius: '18px',
          border: '1px solid var(--line)',
          padding: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: '0 8px 25px rgba(6,36,74,0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <img
            src="/logo-mark.png"
            alt="Beneficiario"
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid rgba(6, 36, 74, 0.08)',
              background: 'var(--white)'
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.375rem', color: 'var(--navy)' }}>{session?.name}</h2>
              <span style={{ background: 'var(--ok-bg)', color: 'var(--ok-fg)', border: '1px solid var(--ok-fg)', borderRadius: '14px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: '700' }}>
                Rol: Beneficiario (RF-05)
              </span>
            </div>
            <div style={{ display: 'flex', gap: '14px', color: 'var(--muted)', fontSize: '0.78125rem', marginTop: '6px', flexWrap: 'wrap' }}>
              <span><Mail className="i i-l" size={13} />{session?.email}</span>
              <span><Phone className="i i-l" size={13} />{session?.phone || '+506 8888-0002'}</span>
              <span><MapPin className="i i-l" size={13} />{session?.zone || 'Barranca'}</span>
            </div>
            {session?.notes && (
              <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>
                <em>"{session.notes}"</em>
              </p>
            )}
          </div>
        </div>

        <button 
          type="button" 
          className="btn secondary" 
          onClick={onOpenEditProfile}
          style={{ padding: '9px 18px', fontSize: '0.75rem', borderRadius: '10px' }}
        >
          Editar mis datos (RF-04)<Pencil className="i i-r" size={14} />
        </button>
      </div>

      {notification && (
        <div
          className={notification.type === 'error' ? 'help-form-error' : ''}
          role={notification.type === 'error' ? 'alert' : 'status'}
          aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            background: notification.type === 'success' ? 'var(--ok-bg)' : undefined,
            border: notification.type === 'success' ? '1px solid #b7e1cd' : undefined,
            color: notification.type === 'success' ? 'var(--ok-fg)' : undefined,
            fontSize: '0.8125rem',
            fontWeight: '600'
          }}
        >
          {notification.text}
        </div>
      )}

      {/* Grid: Formulate Request (RF-07, RF-10) and My Requests (RF-05) */}
      <div className="beneficiary-grid">
        
        {/* Formulate Request Box */}
        <section className="beneficiary-panel"
          style={{
            background: 'var(--white)',
            borderRadius: '18px',
            border: '1px solid var(--line)',
            padding: '22px',
            boxShadow: '0 8px 25px rgba(6,36,74,0.03)'
          }}
        >
          <div className="help-form-intro">
            <span className="help-form-step">NUEVA SOLICITUD</span>
            <h2>
              Contanos qué necesitás
            </h2>
            <p>Compartí solo información general; no incluyas datos sensibles. Revisaremos tu solicitud.</p>
          </div>

          <form className="help-form" onSubmit={handleSubmitRequest} aria-busy={submitting}>
            <div className="help-form-field">
              <label htmlFor="beneficiary-request-category">Categoría de apoyo <span aria-hidden="true">*</span></label>
              <select
                id="beneficiary-request-category"
                required
                value={category}
                onChange={e => handleCategoryChange(e.target.value)}
              >
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="help-form-field">
              <label htmlFor="beneficiary-request-description">¿Qué apoyo necesitás? <span aria-hidden="true">*</span></label>
              <textarea
                id="beneficiary-request-description"
                required
                maxLength={500}
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describí brevemente qué ayudaría a tu hogar o comunidad."
                aria-describedby="beneficiary-request-description-count"
              />
              <small id="beneficiary-request-description-count" className="help-form-hint help-form-counter">{description.length}/500 caracteres</small>
            </div>

            <div className="help-form-grid">
              <div className="help-form-field">
                <label htmlFor="beneficiary-request-amount">Cantidad solicitada <span aria-hidden="true">*</span></label>
                <input
                  id="beneficiary-request-amount"
                  type="number"
                  min="1"
                  max="100000"
                  step="1"
                  required
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                />
              </div>

              <div className="help-form-field">
                <label htmlFor="beneficiary-request-unit">Unidad de medida</label>
                <input
                  id="beneficiary-request-unit"
                  type="text"
                  value={unit}
                  readOnly
                />
              </div>
            </div>

            <div className="help-form-grid">
              <CostaRicaFields value={civic} onChange={patch => setCivic(current => ({ ...current, ...patch }))} />

              <div className="help-form-field">
                <label htmlFor="beneficiary-request-date">Fecha de solicitud <span aria-hidden="true">*</span></label>
                <input
                  id="beneficiary-request-date"
                  type="date"
                  required
                  max={today}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* RF-10 Limits Alert indicator */}
            {isLimitExceeded ? (
              <div style={{ background: 'var(--warn-bg)', border: '1px solid var(--warn-fg)', borderRadius: '10px', padding: '12px 14px', fontSize: '0.75rem', color: 'var(--warn-fg)', display: 'flex', gap: '10px' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Aviso de límite (RF-10):</strong> {limitCheck.reason}
                  <div style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--warn-fg)' }}>
                    Podés enviar la solicitud, pero requerirá de una aprobación con excepción administrativa autorizada.
                  </div>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="btn primary"
              style={{ padding: '12px 24px', fontSize: '0.84375rem', background: 'var(--brand-solid)', marginTop: '6px' }}
            >
              {submitting ? 'Registrando solicitud...' : <>Enviar solicitud<ArrowRight className="i i-r" size={14} /></>}
            </button>
          </form>
        </section>

        {/* Mis Solicitudes y Ayudas Consultadas (RF-05) */}
        <section className="beneficiary-panel"
          style={{
            background: 'var(--white)',
            borderRadius: '18px',
            border: '1px solid var(--line)',
            padding: '22px',
            boxShadow: '0 8px 25px rgba(6,36,74,0.03)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '0.6875rem', letterSpacing: '1.5px', color: 'var(--info-fg)', fontWeight: '800' }}>SEGUIMIENTO</span>
            <h3 style={{ margin: '4px 0 0', fontSize: '1.25rem', color: 'var(--navy)' }}>
              Mis solicitudes
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.78125rem', color: 'var(--muted)' }}>
              Consultá el estado de cada apoyo.
            </p>
          </div>

          <div className="beneficiary-request-list">
            {myRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--muted)' }}>
                <ClipboardList size={32} />
                <p style={{ margin: '10px 0 0', fontSize: '0.8125rem' }}>Aún no has registrado solicitudes de ayuda.</p>
              </div>
            ) : (
              myRequests.map(r => {
                const progress = Math.min(100, Math.round(((r.received || 0) / (r.goal || r.amount || 1)) * 100));
                const isApproved = r.status === 'Aprobada';
                const isDenied = r.status === 'Denegada';
                return (
                  <article
                    key={r.id}
                    className="beneficiary-request-card"
                    style={{
                      border: '1px solid var(--line-light)',
                      borderRadius: '14px',
                      padding: '13px',
                      background: 'var(--surface-soft)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div className="beneficiary-request-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '800', color: 'var(--navy)', fontSize: '0.8125rem' }}>
                        #{r.id} · <span style={{ color: 'var(--muted)', fontWeight: '600' }}>{r.category}</span>
                      </span>
                      <div className="beneficiary-request-badges" style={{ display: 'flex', gap: '6px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.6875rem',
                            fontWeight: '800',
                            background: isApproved ? 'var(--ok-bg)' : isDenied ? 'var(--danger-bg)' : 'var(--warn-bg)',
                            color: isApproved ? 'var(--ok-fg)' : isDenied ? 'var(--danger-fg)' : 'var(--warn-fg)'
                          }}
                        >
                          {r.status}
                        </span>
                        {r.priority === 'Alta' && <span 
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.6875rem',
                            fontWeight: '800',
                            background: r.priority === 'Alta' ? 'var(--danger-bg)' : r.priority === 'Baja' ? 'var(--info-bg)' : 'var(--warn-bg)',
                            color: r.priority === 'Alta' ? 'var(--danger-fg)' : r.priority === 'Baja' ? 'var(--info-fg)' : 'var(--warn-fg)'
                          }}
                        >
                          {r.priority}
                        </span>}
                      </div>
                    </div>

                    <div className="beneficiary-request-description" style={{ fontSize: '0.84375rem', fontWeight: '600', color: 'var(--navy)' }}>
                      {r.description}
                    </div>

                    <div className="beneficiary-request-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)' }}>
                      <span>Zona: {r.zone}</span>
                      <span>Cantidad: {r.amount} {r.unit}</span>
                    </div>

                    <details className="beneficiary-request-details">
                      <summary>Ver avance y detalles</summary>
                      <p className="beneficiary-request-full-description">{r.description}</p>
                      <div className="beneficiary-request-progress">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>
                          <span>Progreso de donaciones</span>
                          <span>{r.received || 0} / {r.goal || r.amount} {r.unit} ({progress}%)</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--surface-soft)', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-primary)', borderRadius: '6px' }} />
                        </div>
                      </div>

                      {r.decisionReason && (
                        <div style={{ background: 'var(--surface-soft)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--muted)', marginTop: '10px' }}>
                          <strong>Dictamen administrativo:</strong> {r.decisionReason} ({r.decisionDate})
                          {r.exceptionGranted && (
                            <div style={{ color: 'var(--warn-fg)', fontWeight: '600', marginTop: '2px' }}>
                              <Star className="i i-l" size={14} />Aprobada con excepción administrativa: {r.exceptionReason}
                            </div>
                          )}
                        </div>
                      )}
                    </details>

                    {isApproved && (r.received > 0 || r.deliveryConfirmed) && (
                      <div className="beneficiary-request-delivery">
                        {r.deliveryConfirmed ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--ok-fg)', fontWeight: '700', background: 'var(--ok-bg)', padding: '4px 10px', borderRadius: '8px' }}>
                            <Check className="i i-l" size={14} />Entrega confirmada ({r.deliveryConfirmationDate || 'Registrada'})
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleConfirmDelivery(r)}
                            style={{ background: 'var(--success)', color: 'var(--on-accent)', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Confirmar recepción de ayuda<Check className="i i-r" size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
