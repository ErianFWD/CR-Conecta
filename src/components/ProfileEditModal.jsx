import { CostaRicaFields } from './CostaRicaFields';
import { useRef, useState } from 'react';
import { ArrowRight, Info } from 'lucide-react';
import { api } from '../lib/api';
import { useModalAccessibility } from '../lib/useModalAccessibility';

export function ProfileEditModal({ isOpen, onClose, user, onSaved }) {
  const modalRef = useRef(null);
  const [form, setForm] = useState({
    name: user?.name || '',
    identification: user?.identification || '',
    location: user?.location || null,
    phone: user?.phone || '+506 8888-0000',
    zone: user?.zone || 'Puntarenas',
    notes: user?.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useModalAccessibility(modalRef, isOpen && Boolean(user), onClose);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updatedUser = await api(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify(form)
      });

      onSaved(updatedUser);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar los cambios en la API local.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-title"
        tabIndex={-1}
        className="profile-modal-card" 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)',
          width: 'min(500px, 94vw)',
          borderRadius: '20px',
          boxShadow: '0 25px 70px rgba(6,36,74,0.22)',
          border: '1px solid var(--line)',
          overflow: 'hidden'
        }}
      >
        <div style={{ background: 'var(--brand-solid)', padding: '20px 24px', color: 'var(--white)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.6875rem', letterSpacing: '1.5px', color: 'var(--brand-eyebrow)', fontWeight: '800' }}>
              ACTUALIZACIÓN DE PERFIL (RF-04)
            </span>
            <h3 id="profile-edit-title" style={{ margin: '3px 0 0', fontSize: '1.1875rem', color: '#ffffff' }}>
              Editar datos de {user.name}
            </h3>
          </div>
          <span style={{ background: 'var(--brand-chip)', color: 'var(--brand-chip-fg)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
            {user.role}
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <CostaRicaFields value={form} onChange={patch => setForm(current => ({ ...current, ...patch }))} />
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
              Nombre de demostración *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '0.8125rem', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                Teléfono de contacto ficticio *
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+506 8888-0000"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '0.8125rem', boxSizing: 'border-box' }}
              />
            </div>
            
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
              Descripción / Notas del perfil (datos no sensibles)
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Información general de rol, disponibilidad o condición comunitaria..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '0.78125rem', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ background: 'var(--surface-soft)', padding: '10px 12px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--muted)', border: '1px solid var(--line-light)' }}>
            <Info className="i i-l" size={14} />Los cambios se persisten de inmediato en el servidor local.
          </div>

          {error && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '0.75rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn secondary" onClick={onClose} style={{ padding: '9px 18px', fontSize: '0.78125rem' }}>
              Cancelar
            </button>
            <button type="submit" className="btn primary" disabled={loading} style={{ padding: '9px 22px', fontSize: '0.78125rem', background: 'var(--brand-solid)' }}>
              {loading ? 'Guardando...' : <>Guardar cambios<ArrowRight className="i i-r" size={14} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
