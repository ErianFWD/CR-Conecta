import { CostaRicaFields } from '../components/CostaRicaFields';
import { profileDetails } from '../services/costaRica';
import { useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useData } from '../lib/useData';
import { CATEGORY_LIMITS, CATEGORY_OPTIONS, checkRequestLimits, getCategoryUnit } from '../constants/limits';

function localDateInputValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 10);
}

export function RequestForm({ session }) {
  const [category, setCategory] = useState('Alimentos sellados');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('1');
  const [unit, setUnit] = useState('paquetes');
  const [civic, setCivic] = useState(() => profileDetails(session));
  const [date, setDate] = useState(localDateInputValue);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { data: priorRequests = [] } = useData('/requests');
  const today = localDateInputValue();
  const categoryLimit = CATEGORY_LIMITS[category];

  const handleCatChange = (newCat) => {
    setCategory(newCat);
    setUnit(getCategoryUnit(newCat));
    setError('');
  };

  const limitCheck = checkRequestLimits(
    category,
    amount,
    priorRequests.filter(request => request.beneficiaryId === session?.id)
  );
  const isLimitExceeded = limitCheck.exceeded;

  if (!session || session.role !== 'Beneficiario') {
    return (
      <div className="page">
        <div className="page-head">
          <span className="eyebrow">SOLICITUD DE APOYO</span>
          <h1>Acceso para personas beneficiarias</h1>
          <p>Iniciá sesión con una cuenta beneficiaria para registrar y consultar solicitudes propias.</p>
        </div>
        <Link className="btn primary" to="/acceso">Iniciar sesión</Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (saving) return;

    const cleanDescription = description.trim();
    const parsedAmount = Number(amount);

    if (!cleanDescription || cleanDescription.length > 500) {
      setError('Escribí una descripción clara de hasta 500 caracteres.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('La cantidad debe ser mayor que cero.');
      return;
    }
    if (!date || date > today) {
      setError('Elegí una fecha válida que no sea posterior a hoy.');
      return;
    }

    const newReq = {
      category,
      description: cleanDescription,
      amount: parsedAmount,
      unit,
      identification: civic.identification,
      location: civic.location,
      zone: civic.location.district || civic.location.canton,
      date,
      status: 'En revisión', // RF-07
      priority: 'Media',     // RF-09
      goal: parsedAmount,
      received: 0,
      limitExceeded: isLimitExceeded, // RF-10
      requiresException: isLimitExceeded,
      limitDetails: isLimitExceeded ? limitCheck.reason : null,
      decisionReason: null,
      decisionDate: null
    };

    try {
      setSaving(true);
      await api('/requests', {
        method: 'POST',
        body: JSON.stringify(newReq)
      });
      setSaved(true);
    } catch (requestError) {
      setError(requestError.message || 'No se pudo registrar la solicitud.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">SOLICITUD DE APOYO (RF-07, RF-10)</span>
        <h1>Formular una solicitud</h1>
        <p>Registrá el requerimiento de ayuda comunitaria. Quedará en estado inicial <b>En revisión</b>.</p>
      </div>

      <div className="help-form-card">
        {saved ? (
          <div className="help-form-success">
            <span className="help-form-success-icon"><CheckCircle2 size={28} /></span>
            <h3>¡Solicitud enviada!</h3>
            <p>
              La solicitud fue guardada con estado inicial <b>En revisión</b>. Podés consultar su estado en el panel.
            </p>
            <div className="help-form-actions">
              <button type="button" className="btn primary" onClick={() => navigate('/panel')}>Ver mi solicitud</button>
              <button type="button" className="btn secondary" onClick={() => {
                setSaved(false);
                setDescription('');
                setAmount('1');
                setDate(localDateInputValue());
                setError('');
              }}>Crear otra solicitud</button>
            </div>
          </div>
        ) : (
          <form className="help-form" onSubmit={handleSubmit}>
            <div className="help-form-intro">
              <span className="help-form-step">SOLICITUD DE APOYO</span>
              <h2>Contanos qué necesitás</h2>
              <p>Compartí solo información general, sin direcciones exactas ni datos sensibles.</p>
            </div>

            <div className="help-form-field">
              <label htmlFor="request-category">Categoría de ayuda <span aria-hidden="true">*</span></label>
              <select id="request-category" required value={category} onChange={e => handleCatChange(e.target.value)}>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <small className="help-form-hint">{categoryLimit.description}</small>
            </div>

            <div className="help-form-field">
              <label htmlFor="request-description">¿Qué apoyo necesitás? <span aria-hidden="true">*</span></label>
              <textarea
                id="request-description"
                required
                maxLength={500}
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describí brevemente qué ayudaría a tu hogar o comunidad."
                aria-describedby="request-description-count"
                aria-invalid={Boolean(error && !description.trim())}
              />
              <small id="request-description-count" className="help-form-hint help-form-counter">{description.length}/500 caracteres</small>
            </div>

            <div className="help-form-grid">
              <div className="help-form-field">
                <label htmlFor="request-amount">Cantidad <span aria-hidden="true">*</span></label>
                <input id="request-amount" type="number" min="1" max="100000" step="1" required value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="help-form-field">
                <label htmlFor="request-unit">Unidad</label>
                <input id="request-unit" value={unit} readOnly aria-describedby="request-unit-hint" />
                <small id="request-unit-hint" className="help-form-hint">Se define según la categoría.</small>
              </div>
            </div>

            <div className="help-form-grid">
              <CostaRicaFields value={civic} onChange={patch => setCivic(current => ({ ...current, ...patch }))} />
              <div className="help-form-field">
                <label htmlFor="request-date">Fecha de solicitud <span aria-hidden="true">*</span></label>
                <input id="request-date" type="date" max={today} required value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>

            {/* RF-10 Real-time check */}
            {isLimitExceeded && (
              <div style={{ background: 'var(--warn-bg)', border: '1px solid var(--warn-fg)', borderRadius: '10px', padding: '12px 14px', fontSize: '0.75rem', color: 'var(--warn-fg)' }}>
                <AlertTriangle className="i i-l" size={14} /><strong>Aviso de límite (RF-10):</strong> {limitCheck.reason} Requerirá autorización con excepción administrativa para ser aprobada.
              </div>
            )}

            {error && <div className="help-form-error" role="alert">{error}</div>}

            <button type="submit" className="btn primary help-form-submit" disabled={saving}>
              {saving ? 'Enviando solicitud…' : 'Enviar solicitud'}{!saving && <ArrowRight className="i i-r" size={14} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
