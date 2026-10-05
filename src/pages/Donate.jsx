import { CostaRicaFields } from '../components/CostaRicaFields';
import { profileDetails } from '../services/costaRica';
import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useData } from '../lib/useData';
import { CATEGORY_OPTIONS } from '../constants/limits';
import { prepareDonationPhoto } from '../lib/donationPhoto';

export function Donate({ session }) {
  const [searchParams] = useSearchParams();
  const preselectedRequestId = searchParams.get('requestId') || '';

  const { data: reqs = [] } = useData('/requests');
  const [saved, setSaved] = useState(false);
  const [civic, setCivic] = useState(() => profileDetails(session));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);

  const handlePhoto = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    setPhoto('');
    setError('');
    if (!file) return;
    setPhotoBusy(true);
    try {
      setPhoto(await prepareDonationPhoto(file));
    } catch (photoError) {
      input.value = '';
      setError(photoError.message || 'No se pudo leer la foto. Seleccioná otra imagen.');
    } finally {
      setPhotoBusy(false);
    }
  };
  const [form, setForm] = useState({
    category: 'Alimentos sellados',
    product: '',
    quantity: 1,
    destination: preselectedRequestId,
    anonymous: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (saving || photoBusy) return;
    if (!photo) {
      setError('Subí una foto del producto que vas a donar.');
      return;
    }

    const productName = form.product.trim();
    const quantityNumber = Number(form.quantity);
    if (!productName || productName.length > 200) {
      setError('Describí el producto o aporte con un máximo de 200 caracteres.');
      return;
    }
    if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
      setError('La cantidad de donación debe ser mayor que cero.');
      return;
    }

    try {
      setSaving(true);
      await api('/donations', {
        method: 'POST',
        body: JSON.stringify({
          identification: civic.identification,
          location: civic.location,
          category: form.category,
          product: productName,
          photo,
          quantity: quantityNumber,
          destination: form.destination || 'Institución',
          anonymous: form.anonymous,
          requestId: form.destination !== 'Institución' ? form.destination : null
        })
      });
      setSaved(true);
    } catch (donationError) {
      setError(donationError.message || 'No se pudo registrar la donación.');
    } finally {
      setSaving(false);
    }
  };

  if (!session || !['Donante individual', 'Empresa donante'].includes(session.role)) {
    return (
      <div className="page">
        <div className="page-head">
          <span className="eyebrow">REGISTRO DE DONACIONES</span>
          <h1>Acceso para personas donantes</h1>
          <p>Iniciá sesión con una cuenta donante para registrar aportes y darles seguimiento.</p>
        </div>
        <Link className="btn primary" to="/acceso">Iniciar sesión</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">REGISTRO DE DONACIONES</span>
        <h1>Quiero donar</h1>
        <p>Registrá un aporte de demostración y elegí su destino comunitario.</p>
      </div>

      <div className="help-form-card">
        {saved ? (
          <div className="help-form-success">
            <span className="help-form-success-icon"><CheckCircle2 size={28} /></span>
            <h3>¡Donación registrada!</h3>
            <p>
              Tu aporte ficticio se guardó en el servidor local y podés seguir su recorrido simulado en el panel.
            </p>
            <div className="help-form-actions">
              <Link className="btn primary" to="/panel">Ver mi aporte<ArrowRight className="i i-r" size={14} /></Link>
              <button type="button" className="btn secondary" onClick={() => {
                setSaved(false);
                setPhoto('');
                setForm(current => ({ ...current, product: '', quantity: 1 }));
                setError('');
              }}>Registrar otra donación</button>
            </div>
          </div>
        ) : (
          <form className="help-form" onSubmit={handleSubmit}>
            <div className="help-form-intro">
              <span className="help-form-step">REGISTRO DE APORTE</span>
              <h2>Tu aporte puede ayudar</h2>
              <p>              Elegí una necesidad aprobada o el centro comunitario.</p>
            </div>

            <div className="help-form-field">
              <label htmlFor="donation-category">Categoría de donación <span aria-hidden="true">*</span></label>
              <select id="donation-category" required value={form.category} onChange={e => setForm(current => ({ ...current, category: e.target.value }))}>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="help-form-field">
              <label htmlFor="donation-product">¿Qué vas a aportar? <span aria-hidden="true">*</span></label>
              <input
                id="donation-product"
                required
                maxLength={200}
                value={form.product}
                onChange={e => setForm(current => ({ ...current, product: e.target.value }))}
                placeholder="Ej. Paquetes de arroz y frijoles"
                aria-describedby="donation-product-count"
              />
              <small id="donation-product-count" className="help-form-hint help-form-counter">{form.product.length}/200 caracteres</small>
            </div>

            <div className="help-form-field">
              <label htmlFor="donation-photo">Foto del producto donado <span aria-hidden="true">*</span></label>
              <input id="donation-photo" type="file" accept="image/jpeg,image/png,image/webp"
                required disabled={saving || photoBusy} onChange={handlePhoto}
                aria-describedby="donation-photo-hint" />
              <small id="donation-photo-hint" className="help-form-hint">
                Foto obligatoria. JPG, PNG o WebP, hasta 10 MB. Se optimiza automáticamente al subirla.
              </small>
              {photoBusy && <small role="status">Preparando foto…</small>}
              {photo && <img className="donation-photo-preview" src={photo} alt="Vista previa del producto que vas a donar" />}
            </div>

            <div className="help-form-field">
              <label htmlFor="donation-quantity">Cantidad de unidades <span aria-hidden="true">*</span></label>
              <input id="donation-quantity" type="number" min="1" max="100000" step="1" required value={form.quantity} onChange={e => setForm(current => ({ ...current, quantity: e.target.value }))} />
            </div>

            <div className="help-form-field">
              <label htmlFor="donation-destination">Destino del aporte <span aria-hidden="true">*</span></label>
              <select id="donation-destination" required value={form.destination} onChange={e => setForm(current => ({ ...current, destination: e.target.value }))}>
                <option value="">Seleccionar solicitud aprobada o institución...</option>
                {(reqs || []).filter(r => r.status === 'Aprobada').map(r => (
                  <option key={r.id} value={r.id}>Solicitud #{r.id} · {r.description} ({r.zone})</option>
                ))}
                <option value="Institución">Centro Comunitario Institucional (Puntarenas)</option>
              </select>
            </div>

            <CostaRicaFields value={civic} onChange={patch => setCivic(current => ({ ...current, ...patch }))} />
            <div className="help-form-checkbox">
              <input type="checkbox" id="anon" checked={form.anonymous} onChange={e => setForm(current => ({ ...current, anonymous: e.target.checked }))} />
              <label htmlFor="anon">
                <b>Modo anónimo:</b> Ocultar mi nombre públicamente en los registros de ayuda.
              </label>
            </div>

            {error && <div className="help-form-error" role="alert">{error}</div>}
            <button type="submit" className="btn primary help-form-submit" disabled={saving || photoBusy}>
              {saving ? 'Guardando aporte…' : 'Registrar aporte'}{!saving && <ArrowRight className="i i-r" size={14} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
